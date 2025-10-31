import { storage, databases, ID, Query } from './appwrite';
import { Models } from 'appwrite';

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'videos';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'aura';
const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID || 'projects';

export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface TextOverlay {
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
}

export interface MediaItem {
  id: string;
  fileId: string;
  type: 'video' | 'audio' | 'image';
  name: string;
  duration?: number;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface Project {
  $id: string;
  $createdAt: string;  $updatedAt: string;  title: string;
  description?: string;
  userId: string;
  videoFileId: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  captions?: string;  captionsGenerated?: boolean;
  textOverlays?: string;  trimStart?: number;
  trimEnd?: number;
  mediaItems?: string;  thumbnailFrames?: string;  exportedFileId?: string;
  exportStatus?: 'idle' | 'processing' | 'completed' | 'failed';
  exportProgress?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<Models.File> {
  try {
    const fileId = ID.unique();
    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      fileId,
      file
    );
    if (onProgress && typeof onProgress === 'function') {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100,
      });
    }

    return uploadedFile;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload video');
  }
}

export async function createProject(data: {
  title: string;
  description?: string;
  userId: string;
  videoFileId: string;
  fileSize: number;
  mimeType: string;
}): Promise<Project> {
  try {
    const documentData: any = {
      title: data.title,
      userId: data.userId,
      videoFileId: data.videoFileId,
      status: 'uploading',
    };
    if (data.description) {
      documentData.description = data.description;
    }
    if (data.fileSize) {
      documentData.fileSize = data.fileSize;
    }
    if (data.mimeType) {
      documentData.mimeType = data.mimeType;
    }

    const project = await databases.createDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      ID.unique(),
      documentData,
      [
        `read("user:${data.userId}")`,
        `update("user:${data.userId}")`,
        `delete("user:${data.userId}")`,
      ]
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Create project error:', error);
    throw new Error(error.message || 'Failed to create project');
  }
}

export async function updateProjectStatus(
  projectId: string,
  status: Project['status'],
  additionalData?: Partial<Project>
): Promise<Project> {
  try {
    const updateData: any = {
      status,
    };
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        const value = additionalData[key as keyof Project];
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });
    }

    const project = await databases.updateDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId,
      updateData
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Update project error:', error);
    throw new Error(error.message || 'Failed to update project');
  }
}

export async function updateProjectEditing(
  projectId: string,
  data: {
    textOverlays?: string;
    trimStart?: number;
    trimEnd?: number;
  }
): Promise<Project> {
  try {
    const updateData: any = {};
    if (data.textOverlays !== undefined) {
      updateData.textOverlays = data.textOverlays;
    }
    if (data.trimStart !== undefined) {
      updateData.trimStart = data.trimStart;
    }
    if (data.trimEnd !== undefined) {
      updateData.trimEnd = data.trimEnd;
    }

    const project = await databases.updateDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId,
      updateData
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Update project editing error:', error);
    throw new Error(error.message || 'Failed to update project editing data');
  }
}

export async function updateProjectMedia(
  projectId: string,
  mediaItems: string
): Promise<Project> {
  try {
    const project = await databases.updateDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId,
      { mediaItems }
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Update project media error:', error);
    throw new Error(error.message || 'Failed to update project media');
  }
}

export async function updateProjectTitle(
  projectId: string,
  title: string
): Promise<Project> {
  try {
    const project = await databases.updateDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId,
      { title }
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Update project title error:', error);
    throw new Error(error.message || 'Failed to update project title');
  }
}

export async function getProject(projectId: string): Promise<Project> {
  try {
    const project = await databases.getDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId
    );

    return project as unknown as Project;
  } catch (error: any) {
    console.error('Get project error:', error);
    throw new Error(error.message || 'Failed to get project');
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      [
        Query.equal('userId', userId)
      ]
    );

    return response.documents as unknown as Project[];
  } catch (error: any) {
    console.error('Get projects error:', error);
    throw new Error(error.message || 'Failed to get projects');
  }
}

export async function deleteProject(projectId: string, videoFileId: string): Promise<void> {
  try {
    await storage.deleteFile(BUCKET_ID, videoFileId);
    await databases.deleteDocument(
      DATABASE_ID,
      PROJECTS_COLLECTION_ID,
      projectId
    );
  } catch (error: any) {
    console.error('Delete project error:', error);
    throw new Error(error.message || 'Failed to delete project');
  }
}

export function getVideoUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
}

export function getVideoDownloadUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${projectId}`;
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024;  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type must be MP4, MOV, WEBM, AVI, or MKV',
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
