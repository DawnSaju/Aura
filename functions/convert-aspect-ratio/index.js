import { Client, Databases, Storage, ID } from 'node-appwrite';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Buffer } from 'buffer';

export default async ({ req, res, log, error }) => {
  const { videoFileId, projectId, targetRatio, cropPosition = 'center' } = JSON.parse(req.payload || '{}');
  
  try {
    log(`Starting aspect ratio conversion for project: ${projectId}`);
    log(`Target Ratio: ${targetRatio}, Crop Position: ${cropPosition}`);
    
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    const storage = new Storage(client);
    const databases = new Databases(client);
    
    // Download video
    log('Downloading video from storage...');
    const videoBuffer = await storage.getFileDownload(process.env.BUCKET_ID, videoFileId);
    const inputPath = `/tmp/input_${projectId}.mp4`;
    const outputPath = `/tmp/output_${projectId}.mp4`;
    fs.writeFileSync(inputPath, Buffer.from(videoBuffer));
    
    // Target dimensions
    const dimensions = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 }
    };
    
    const target = dimensions[targetRatio];
    log(`Target dimensions: ${target.width}x${target.height}`);
    
    // Calculate crop filter based on position
    const cropFilters = {
      'top': `crop=${target.width}:${target.height}:0:0`,
      'center': `crop=${target.width}:${target.height}`,
      'bottom': `crop=${target.width}:${target.height}:0:oh-ih`
    };
    
    const cropFilter = cropFilters[cropPosition];
    log(`Using crop filter: ${cropFilter}`);
    
    // Process video
    log('Processing video with FFmpeg...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters([
          `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase`,
          cropFilter
        ])
        .on('start', (cmdLine) => log(`FFmpeg command: ${cmdLine}`))
        .on('progress', (progress) => log(`Processing: ${progress.percent}% done`))
        .on('end', () => {
          log('FFmpeg processing completed');
          resolve();
        })
        .on('error', (err) => {
          error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
    
    // Upload converted video
    log('Uploading converted video to storage...');
    const convertedBuffer = fs.readFileSync(outputPath);
    const convertedFile = await storage.createFile(
      process.env.BUCKET_ID,
      ID.unique(),
      convertedBuffer
    );
    log(`Converted video uploaded: ${convertedFile.$id}`);
    
    // Update project with new video
    log('Updating project document...');
    await databases.updateDocument(
      process.env.DATABASE_ID,
      process.env.COLLECTION_ID,
      projectId,
      {
        videoFileId: convertedFile.$id
      }
    );
    
    // Cleanup
    log('Cleaning up temporary files...');
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    
    log('Aspect ratio conversion completed successfully!');
    return res.json({ success: true, fileId: convertedFile.$id });
  } catch (err) {
    error(`Error: ${err.message}`);
    return res.json({ success: false, error: err.message });
  }
};
