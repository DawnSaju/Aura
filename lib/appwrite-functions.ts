import { Functions, ExecutionMethod } from 'appwrite';
import { client } from './appwrite';

const functions = new Functions(client);

export interface FunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function executeFunction<T = any>(
  functionId: string,
  data?: any,
  method: ExecutionMethod = ExecutionMethod.POST
): Promise<FunctionResponse<T>> {
  try {
    console.log(`Executing function ${functionId} with data:`, data);
    
    // Set async to true to avoid synchronous execution timeout
    const execution = await functions.createExecution(
      functionId,
      JSON.stringify(data || {}),
      true, // async = true
      '/',
      method
    );

    console.log(`Execution created: ${execution.$id}, status: ${execution.status}`);
    let attempts = 0;
    const maxAttempts = 1500; // 5 minutes (300 seconds) to match video processing time

    while (attempts < maxAttempts) {
      const status = await functions.getExecution(functionId, execution.$id);
      console.log(`Execution status (attempt ${attempts + 1}): ${status.status}`);
      
      if (status.status === 'completed') {
        console.log('Execution completed! Full status:', status);
        console.log('Response body:', status.responseBody);
        console.log('Response body type:', typeof status.responseBody);
        console.log('Response body length:', status.responseBody?.length);
        console.log('All status keys:', Object.keys(status));
        const statusAny = status as any;
        console.log('Status response:', statusAny.response);
        console.log('Status stdout:', statusAny.stdout);
        let responseText = status.responseBody || statusAny.response || statusAny.stdout || '{}';
        
        try {
          const response = JSON.parse(responseText);
          console.log('Parsed response:', response);
          return {
            success: true,
            data: response
          };
        } catch (parseErr) {
          console.error('Failed to parse response:', parseErr);
          console.error('Raw response text:', responseText);
          return {
            success: false,
            error: 'Failed to parse function response'
          };
        }
      }
      
      if (status.status === 'failed') {
        console.error('Execution failed:', status.responseBody);
        return {
          success: false,
          error: status.responseBody || 'Function execution failed'
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    return {
      success: false,
      error: 'Function execution timeout'
    };
  } catch (error: any) {
    console.error('Function execution error:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute function'
    };
  }
}

export async function generateCaptions(videoFileId: string, projectId: string) {
  return executeFunction('generate-captions', {
    videoFileId,
    projectId
  });
}

export async function exportVideo(data: {
  projectId: string;
  quality: '1080p' | '720p' | '480p';
  format: 'mp4' | 'mov' | 'webm';
  includeCaptions?: boolean;
  textOverlays?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    backgroundColor: string;
    opacity: number;
    startTime: number;
    endTime: number;
    rotation: number;
    scale: number;
  }>;
  trimStart?: number;
  trimEnd?: number;
}) {
  return executeFunction('export-video', data);
}

export async function convertAspectRatio(data: {
  videoFileId: string;
  projectId: string;
  targetRatio: '16:9' | '9:16' | '1:1';
  cropPosition?: 'top' | 'center' | 'bottom';
}) {
  return executeFunction('convert-aspect-ratio', data);
}

export async function autoTrimVideo(data: {
  videoFileId: string;
  projectId: string;
  mode: 'silence_removal' | 'best_moments';
  duration?: number;
}) {
  return executeFunction('auto-trim', data);
}

export async function generateThumbnails(videoFileId: string, projectId: string, frameCount: number = 40) {
  return executeFunction('generate-thumbnails', {
    videoFileId,
    projectId,
    frameCount
  });
}

export async function pollExecution(
  functionId: string,
  executionId: string,
  onProgress?: (progress: number) => void
): Promise<FunctionResponse> {
  try {
    let attempts = 0;
    const maxAttempts = 300;

    while (attempts < maxAttempts) {
      const status = await functions.getExecution(functionId, executionId);
      try {
        const response = JSON.parse(status.responseBody || '{}');
        if (response.progress && onProgress) {
          onProgress(response.progress);
        }
      } catch (e) {
      }
      
      if (status.status === 'completed') {
        const response = JSON.parse(status.responseBody || '{}');
        return {
          success: true,
          data: response
        };
      }
      
      if (status.status === 'failed') {
        return {
          success: false,
          error: status.responseBody || 'Function execution failed'
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    return {
      success: false,
      error: 'Function execution timeout'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to poll execution'
    };
  }
}
