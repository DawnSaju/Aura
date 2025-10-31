import { Client, Databases, Storage } from 'node-appwrite';
import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
  // Log the raw request for debugging
  log('Raw request body:', req.body);
  log('Raw request payload:', req.payload);
  log('Request headers:', JSON.stringify(req.headers));
  
  let videoFileId, projectId;
  
  try {
    // Try parsing from body first
    if (req.body) {
      const parsed = JSON.parse(req.body);
      videoFileId = parsed.videoFileId;
      projectId = parsed.projectId;
    } else if (req.payload) {
      const parsed = JSON.parse(req.payload);
      videoFileId = parsed.videoFileId;
      projectId = parsed.projectId;
    }
  } catch (e) {
    log('Failed to parse request:', e.message);
  }
  
  log(`Parsed - videoFileId: ${videoFileId}, projectId: ${projectId}`);
  
  if (!videoFileId || !projectId) {
    error('Missing required parameters');
    return res.json({ 
      success: false, 
      error: 'Missing videoFileId or projectId' 
    });
  }
  
  try {
    log(`Starting caption generation for project: ${projectId}`);
    
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    const storage = new Storage(client);
    const databases = new Databases(client);
    
    // Download video
    log('Downloading video from storage...');
    const videoBuffer = await storage.getFileDownload(
      process.env.BUCKET_ID,
      videoFileId
    );
    
    // Upload to AssemblyAI
    log('Uploading video to AssemblyAI...');
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { 'authorization': process.env.ASSEMBLYAI_KEY },
      body: videoBuffer
    });
    const { upload_url } = await uploadRes.json();
    log(`Upload URL: ${upload_url}`);
    
    // Request transcription
    log('Requesting transcription...');
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': process.env.ASSEMBLYAI_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: upload_url,
        word_boost: ['video', 'content'],
        format_text: false
      })
    });
    const { id: transcriptId } = await transcriptRes.json();
    log(`Transcript ID: ${transcriptId}`);
    
    // Poll for completion
    log('Polling for transcription completion...');
    let transcript;
    let pollCount = 0;
    while (true) {
      const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'authorization': process.env.ASSEMBLYAI_KEY }
      });
      transcript = await statusRes.json();
      
      pollCount++;
      log(`Poll ${pollCount}: Status = ${transcript.status}`);
      
      if (transcript.status === 'completed') break;
      if (transcript.status === 'error') throw new Error('Transcription failed');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Convert to caption format
    log('Converting words to caption format...');
    const captions = transcript.words.map((word, i) => ({
      id: `cap_${i}`,
      start: word.start / 1000,
      end: word.end / 1000,
      text: word.text
    }));
    
    // Group words into sentences (optional)
    const groupedCaptions = groupWordsBySentence(captions, 8); // 8 words per caption
    log(`Generated ${groupedCaptions.length} captions`);
    
    // Update project
    log('Updating project document...');
    try {
      await databases.updateDocument(
        process.env.DATABASE_ID,
        process.env.COLLECTION_ID,
        projectId,
        {
          captions: JSON.stringify(groupedCaptions),
          captionsGenerated: true
        }
      );
      log('Project document updated successfully!');
    } catch (updateErr) {
      log(`Warning: Could not update project document: ${updateErr.message}`);
      log('Returning captions anyway so frontend can handle it');
    }
    
    log('Caption generation completed successfully!');
    return res.json({ success: true, captions: groupedCaptions });
  } catch (err) {
    error(`Error: ${err.message}`);
    return res.json({ success: false, error: err.message });
  }
};

function groupWordsBySentence(words, maxWords) {
  const sentences = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const group = words.slice(i, i + maxWords);
    sentences.push({
      id: `cap_${Math.floor(i / maxWords)}`,
      start: group[0].start,
      end: group[group.length - 1].end,
      text: group.map(w => w.text).join(' ')
    });
  }
  return sentences;
}
