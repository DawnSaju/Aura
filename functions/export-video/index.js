import { Client, Databases, Storage, ID } from 'node-appwrite';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fetch from 'node-fetch';
import fs, { createWriteStream, unlinkSync, existsSync, createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export default async ({ req, res, log, error }) => {
  let projectId, quality, format, includeCaptions, textOverlays, trimStart, trimEnd;

  try {
    log('Export function started');
    log(`FFmpeg path: ${ffmpegPath || 'system default'}`);
    
    const parsed = req.body ? JSON.parse(req.body) : JSON.parse(req.payload || '{}');
    projectId = parsed.projectId;
    quality = parsed.quality || '1080p';
    format = parsed.format || 'mp4';
    includeCaptions = parsed.includeCaptions || false;
    textOverlays = parsed.textOverlays || [];
    trimStart = parsed.trimStart || 0;
    trimEnd = parsed.trimEnd;
  } catch (e) {
    error('Failed to parse request: ' + e.message);
    return res.json({ success: false, error: 'Failed to parse request: ' + e.message }, 400);
  }

  if (!projectId) {
    return res.json({ success: false, error: 'Missing projectId parameter' }, 400);
  }

  let inputPath, outputPath;

  try {
    log(`🎬 Starting video export for project: ${projectId}`);
    log(`Settings → Quality: ${quality}, Format: ${format}, Captions: ${includeCaptions}`);
    log(`Text overlays: ${textOverlays.length}, Trim: ${trimStart}-${trimEnd || 'end'}`);

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const storage = new Storage(client);
    const databases = new Databases(client);

    const project = await databases.getDocument(
      process.env.DATABASE_ID,
      process.env.COLLECTION_ID,
      projectId
    );

    const needsProcessing =
      textOverlays.length > 0 || trimStart > 0 || (trimEnd && trimEnd < project.duration);

    if (!needsProcessing) {
      log('No processing required — returning original video');
      const videoUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.BUCKET_ID}/files/${project.videoFileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

      let srtContent = null;
      if (includeCaptions && project.captions) {
        srtContent = generateSRT(JSON.parse(project.captions));
      }

      const exportData = {
        downloadUrl: videoUrl,
        srtContent,
        videoFileId: project.videoFileId,
        exportedAt: new Date().toISOString(),
      };

      await databases.updateDocument(
        process.env.DATABASE_ID,
        process.env.COLLECTION_ID,
        projectId,
        { exportData: JSON.stringify(exportData) }
      );

      return res.json({ success: true, message: 'Original video ready for download' });
    }


    inputPath = join(tmpdir(), `input_${projectId}.mp4`);
    outputPath = join(tmpdir(), `output_${projectId}.${format}`);

    log('Downloading source video...');
    const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.BUCKET_ID}/files/${project.videoFileId}/download?project=${process.env.APPWRITE_PROJECT_ID}`;
    const response = await fetch(downloadUrl, {
      headers: { 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
    });

    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);

    const fileStream = createWriteStream(inputPath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    log('Video downloaded. Starting FFmpeg processing...');
    await processVideoWithFFmpeg({
      inputPath,
      outputPath,
      textOverlays,
      trimStart,
      trimEnd: trimEnd || project.duration,
      quality,
      format,
      log,
      error,
    });

    log('Uploading processed video...');
    const processedFileStream = createReadStream(outputPath);
    const processedFile = await storage.createFile(
      process.env.BUCKET_ID,
      ID.unique(),
      processedFileStream
    );

    const processedUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.BUCKET_ID}/files/${processedFile.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

    let srtContent = null;
    if (includeCaptions && project.captions) {
      srtContent = generateSRT(JSON.parse(project.captions));
    }

    const exportData = {
      downloadUrl: processedUrl,
      srtContent,
      videoFileId: processedFile.$id,
      exportedAt: new Date().toISOString(),
      processed: true,
      textOverlaysApplied: textOverlays.length,
      trimApplied: trimStart > 0 || trimEnd < project.duration,
    };

    await databases.updateDocument(
      process.env.DATABASE_ID,
      process.env.COLLECTION_ID,
      projectId,
      { exportData: JSON.stringify(exportData) }
    );

    log('Export completed successfully');
    return res.json({ success: true, message: 'Processed video ready for download' });
  } catch (err) {
    error(`Error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  } finally {
    if (inputPath && existsSync(inputPath)) {
      try {
        unlinkSync(inputPath);
      } catch (e) {
        error('Failed to clean up input file: ' + e.message);
      }
    }
    if (outputPath && existsSync(outputPath)) {
      try {
        unlinkSync(outputPath);
      } catch (e) {
        error('Failed to clean up output file: ' + e.message);
      }
    }
  }
};

async function processVideoWithFFmpeg({
  inputPath,
  outputPath,
  textOverlays,
  trimStart,
  trimEnd,
  quality,
  format,
  log,
  error,
}) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    if (trimStart > 0 || trimEnd) {
      log(`Trimming ${trimStart}s → ${trimEnd}s`);
      command = command.setStartTime(trimStart);
      if (trimEnd) command = command.setDuration(trimEnd - trimStart);
    }

    const qualityMap = {
      '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
      '720p': { width: 1280, height: 720, bitrate: '3000k' },
      '480p': { width: 854, height: 480, bitrate: '1500k' },
    };

    const videoSettings = qualityMap[quality] || qualityMap['720p'];

    let filterComplex = `[0:v]scale=${videoSettings.width}:${videoSettings.height}[scaled]`;
    let lastOutput = '[scaled]';

    if (textOverlays.length > 0) {
      log(`Adding ${textOverlays.length} text overlays`);
      textOverlays.forEach((overlay, index) => {
        const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
        const fontsize = overlay.fontSize || 48;
        const fontcolor = (overlay.color || '#ffffff').replace('#', '0x');
        const alpha = Math.round((overlay.opacity / 100) * 255)
          .toString(16)
          .padStart(2, '0');
        const fontcolorWithAlpha = `${fontcolor}${alpha}`;

        let fontfile = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        if (!fs.existsSync(fontfile)) {
          fontfile = join(tmpdir(), 'DejaVuSans.ttf');
        }

        const xPos = `(w*${overlay.x / 100})`;
        const yPos = `(h*${overlay.y / 100})`;

        const nextOutput = index === textOverlays.length - 1 ? '[outv]' : `[v${index}]`;
        let drawtext = `${lastOutput}drawtext=text='${escapedText}':fontfile=${fontfile}:fontsize=${fontsize}:fontcolor=${fontcolorWithAlpha}:x=${xPos}:y=${yPos}`;
        
        if (overlay.backgroundColor && overlay.backgroundColor !== 'transparent') {
          const boxcolor = overlay.backgroundColor.replace('#', '0x') + 'AA';
          drawtext += `:box=1:boxcolor=${boxcolor}:boxborderw=5`;
        }

        drawtext += `:enable='between(t,${overlay.startTime},${overlay.endTime})'${nextOutput}`;
        filterComplex += `;${drawtext}`;
        lastOutput = nextOutput;
      });
    } else {
      filterComplex += '[outv]';
    }

    log(`Filter complex: ${filterComplex}`);

    command = command
      .outputOptions([
        `-filter_complex`, filterComplex,
        `-map`, `[outv]`,
        `-map`, `0:a?`,
        `-b:v`, videoSettings.bitrate,
        `-r`, `30`
      ]);

    command
      .output(outputPath)
      .on('start', (cmd) => log('FFmpeg command: ' + cmd))
      .on('progress', (p) => log(`Progress: ${Math.round(p.percent || 0)}%`))
      .on('end', () => {
        log('FFmpeg processing complete');
        resolve();
      })
      .on('error', (err) => {
        error('FFmpeg error: ' + err.message);
        reject(err);
      })
      .run();
  });
}

function generateSRT(captions) {
  return captions
    .map((cap, i) => {
      const startTime = formatSRTTime(cap.start);
      const endTime = formatSRTTime(cap.end);
      return `${i + 1}\n${startTime} --> ${endTime}\n${cap.text}\n`;
    })
    .join('\n');
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}
