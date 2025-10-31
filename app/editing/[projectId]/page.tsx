"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Play,
    Pause,
    Undo,
    Redo,
    Download,
    ChevronDown,
    Type,
    Image as ImageIcon,
    Film,
    Music,
    Sparkles,
    Wand2,
    Scissors,
    Settings,
    MoreVertical,
    Bold,
    Italic,
    Underline,
    Plus,
    Trash2,
    Loader2,
    Crop,
    Maximize2
} from 'lucide-react';
import { getProject, getVideoUrl, updateProjectStatus, updateProjectEditing, updateProjectMedia, updateProjectTitle, Project, Caption as ProjectCaption, MediaItem } from '@/lib/storage';
import { generateCaptions, exportVideo } from '@/lib/appwrite-functions';
import CaptionEditor from '@/components/CaptionEditor';
import AspectRatioSelector from '@/components/AspectRatioSelector';
import AIAssistant from '@/components/AIAssistant';
import MediaLibrary from '@/components/MediaLibrary';

export default function EditingPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [selectedTool, setSelectedTool] = useState<string>('captions');
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [showVideoControls, setShowVideoControls] = useState(false);
    const [volume, setVolume] = useState(100);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportQuality, setExportQuality] = useState<'1080p' | '720p' | '480p'>('1080p');
    const [exportFormat, setExportFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [captions, setCaptions] = useState<ProjectCaption[]>([]);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [includeCaptions, setIncludeCaptions] = useState(true);
    interface TextOverlay {
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
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
    const [timelineDragType, setTimelineDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
    const [timelineDragTextId, setTimelineDragTextId] = useState<string | null>(null);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const projectId = params?.projectId as string;

    const leftTools = [
        { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
        { id: 'media', icon: Film, label: 'Media' },
        { id: 'aspect-ratio', icon: Maximize2, label: 'Aspect Ratio' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'elements', icon: ImageIcon, label: 'Elements' },
        { id: 'music', icon: Music, label: 'Music' },
        { id: 'captions', icon: Wand2, label: 'Captions' },
        { id: 'effects', icon: Scissors, label: 'Effects' },
        { id: 'crop', icon: Crop, label: 'Crop' },
        { id: 'transitions', icon: Settings, label: 'Transitions' },
    ];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const loadProject = async () => {
        try {
            setLoading(true);
            const projectData = await getProject(projectId);
            setProject(projectData);
            setEditedTitle(projectData.title || '');
            if (projectData.captions) {
                try {
                    const parsedCaptions = JSON.parse(projectData.captions);
                    setCaptions(parsedCaptions);
                } catch (e) {
                    console.error('Failed to parse captions:', e);
                }
            }
            if (projectData.textOverlays) {
                try {
                    const parsedOverlays = JSON.parse(projectData.textOverlays);
                    setTextOverlays(parsedOverlays);
                } catch (e) {
                    console.error('Failed to parse text overlays:', e);
                }
            }
            if (projectData.trimStart !== undefined) {
                setTrimStart(projectData.trimStart);
            }
            if (projectData.trimEnd !== undefined) {
                setTrimEnd(projectData.trimEnd);
            }
            if (projectData.mediaItems) {
                try {
                    const parsedMedia = JSON.parse(projectData.mediaItems);
                    setMediaItems(parsedMedia);
                    if (parsedMedia.length > 0 && !activeMediaId) {
                        setActiveMediaId(parsedMedia[0].id);
                    }
                } catch (e) {
                    console.error('Failed to parse media items:', e);
                }
            } else {
                const initialMedia: MediaItem = {
                    id: 'original',
                    fileId: projectData.videoFileId,
                    type: 'video',
                    name: projectData.title || 'Original Video',
                    duration: projectData.duration,
                    thumbnailUrl: projectData.thumbnailUrl,
                    fileSize: projectData.fileSize,
                    mimeType: projectData.mimeType,
                    uploadedAt: projectData.$createdAt,
                };
                setMediaItems([initialMedia]);
                setActiveMediaId('original');
            }
        } catch (err: any) {
            console.error('Failed to load project:', err);
            setError(err.message || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };
    const handleGenerateCaptions = async () => {
        if (!project) return;

        setIsGeneratingCaptions(true);
        try {
            console.log('Generating captions for video:', project.videoFileId, 'project:', projectId);
            const result = await generateCaptions(project.videoFileId, projectId);
            console.log('Caption generation result:', result);

            if (result.success && result.data) {
                let captionsData;
                if (result.data.success && result.data.captions) {
                    captionsData = result.data.captions;
                } else if (result.data.captions) {
                    captionsData = result.data.captions;
                } else if (Array.isArray(result.data)) {
                    captionsData = result.data;
                }

                if (Array.isArray(captionsData) && captionsData.length > 0) {
                    setCaptions(captionsData);
                    console.log(`✅ Captions generated successfully! ${captionsData.length} captions created.`);
                    try {
                        updateProjectStatus(projectId, project.status, {
                            captions: JSON.stringify(captionsData),
                            captionsGenerated: true
                        }).catch((saveErr) => {
                            console.warn('Could not save captions to database:', saveErr);
                        });
                    } catch (e) {
                    }
                } else {
                    console.error('No captions in result or invalid format');
                }
            } else {
                console.error('Caption generation failed:', result.error);
            }
        } catch (err: any) {
            console.error('Caption generation error:', err);
        } finally {
            setIsGeneratingCaptions(false);
        }
    };
    const handleCaptionUpdate = (id: string, text: string) => {
        setCaptions(prev => prev.map(cap =>
            cap.id === id ? { ...cap, text } : cap
        ));
    };

    const handleCaptionDelete = (id: string) => {
        setCaptions(prev => prev.filter(cap => cap.id !== id));
    };

    const handleCaptionAdd = (caption: Omit<ProjectCaption, 'id'>) => {
        const newCaption: ProjectCaption = {
            ...caption,
            id: `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        setCaptions(prev => [...prev, newCaption]);
    };

    const handleSeekTo = (time: number) => {
        seekToTime(time);
    };
    const handleAddText = () => {
        const newText: TextOverlay = {
            id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: 'Your Text',
            x: 50,
            y: 50,
            fontSize: 48,
            fontFamily: 'Inter',
            color: '#FFFFFF',
            bold: false,
            italic: false,
            underline: false,
            backgroundColor: 'transparent',
            opacity: 100,
            startTime: currentTime,
            endTime: Math.min(currentTime + 5, duration),
            rotation: 0,
            scale: 1
        };
        setTextOverlays(prev => [...prev, newText]);
        setSelectedTextId(newText.id);
    };

    const handleUpdateText = (id: string, updates: Partial<TextOverlay>) => {
        setTextOverlays(prev => prev.map(text =>
            text.id === id ? { ...text, ...updates } : text
        ));
    };

    const handleDeleteText = (id: string) => {
        setTextOverlays(prev => prev.filter(text => text.id !== id));
        if (selectedTextId === id) {
            setSelectedTextId(null);
        }
    };
    const handleTitleBlur = async () => {
        if (editedTitle.trim() && editedTitle !== project?.title) {
            try {
                await updateProjectTitle(projectId, editedTitle.trim());
                setProject(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
            } catch (error) {
                console.error('Failed to update title:', error);
                setEditedTitle(project?.title || '');
            }
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleBlur();
        } else if (e.key === 'Escape') {
            setEditedTitle(project?.title || '');
            setIsEditingTitle(false);
        }
    };
    const handleMediaItemsChange = (items: MediaItem[]) => {
        setMediaItems(items);
        if (activeMediaId && !items.find(item => item.id === activeMediaId)) {
            setActiveMediaId(items.length > 0 ? items[0].id : null);
        }
    };

    const handleAddToTimeline = (item: MediaItem) => {
        setActiveMediaId(item.id);
    };

    const getActiveTextOverlays = () => {
        return textOverlays.filter(text =>
            currentTime >= text.startTime && currentTime <= text.endTime
        );
    };

    const handleTextDragStart = (e: React.MouseEvent, textId: string) => {
        e.stopPropagation();
        setIsDraggingText(true);
        setSelectedTextId(textId);
        const videoContainer = e.currentTarget.closest('.aspect-video');
        if (videoContainer) {
            const rect = videoContainer.getBoundingClientRect();
            setDragStartPos({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100
            });
        }
    };
    useEffect(() => {
        if (!isDraggingText || !selectedTextId) return;

        const handleMouseMove = (e: MouseEvent) => {
            const videoContainer = document.querySelector('.aspect-video');
            if (!videoContainer) return;

            const rect = videoContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

            handleUpdateText(selectedTextId, { x, y });
        };

        const handleMouseUp = () => {
            setIsDraggingText(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingText, selectedTextId]);
    useEffect(() => {
        if (!isDraggingTimeline || !timelineDragTextId) return;

        const handleMouseMove = (e: MouseEvent) => {
            const timeline = document.getElementById('timeline-track');
            if (!timeline) return;

            const rect = timeline.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            const newTime = percentage * duration;

            const text = textOverlays.find(t => t.id === timelineDragTextId);
            if (!text) return;

            if (timelineDragType === 'move') {
                const textDuration = text.endTime - text.startTime;
                const newStartTime = Math.max(0, Math.min(duration - textDuration, newTime - textDuration / 2));
                const newEndTime = newStartTime + textDuration;
                handleUpdateText(timelineDragTextId, { startTime: newStartTime, endTime: newEndTime });
            } else if (timelineDragType === 'resize-start') {
                const newStartTime = Math.max(0, Math.min(text.endTime - 0.5, newTime));
                handleUpdateText(timelineDragTextId, { startTime: newStartTime });
            } else if (timelineDragType === 'resize-end') {
                const newEndTime = Math.max(text.startTime + 0.5, Math.min(duration, newTime));
                handleUpdateText(timelineDragTextId, { endTime: newEndTime });
            }
        };

        const handleMouseUp = () => {
            setIsDraggingTimeline(false);
            setTimelineDragType(null);
            setTimelineDragTextId(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingTimeline, timelineDragTextId, timelineDragType, duration, textOverlays]);

    const handleTimelineTextDragStart = (e: React.MouseEvent, textId: string, type: 'move' | 'resize-start' | 'resize-end') => {
        e.stopPropagation();
        setIsDraggingTimeline(true);
        setTimelineDragType(type);
        setTimelineDragTextId(textId);
        setSelectedTextId(textId);
    };

    const selectedText = textOverlays.find(t => t.id === selectedTextId);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/signin');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (projectId && user) {
            loadProject();
        }
    }, [projectId, user]);
    useEffect(() => {
        if (duration > 0 && trimEnd === 0) {
            setTrimEnd(duration);
        }
    }, [duration]);
    useEffect(() => {
        if (!projectId || !project) return;

        const timeoutId = setTimeout(async () => {
            try {
                await updateProjectEditing(projectId, {
                    textOverlays: JSON.stringify(textOverlays),
                    trimStart,
                    trimEnd,
                });
                console.log('Auto-saved editing data');
            } catch (error) {
                console.error('Failed to auto-save editing data:', error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [projectId, project, textOverlays, trimStart, trimEnd]);
    useEffect(() => {
        if (!projectId || !project || mediaItems.length === 0) return;

        const timeoutId = setTimeout(async () => {
            try {
                await updateProjectMedia(projectId, JSON.stringify(mediaItems));
                console.log('Auto-saved media items');
            } catch (error) {
                console.error('Failed to auto-save media items:', error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [projectId, project, mediaItems]);
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                togglePlayPause();
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                seekToTime(Math.max(0, currentTime - 5));
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                seekToTime(Math.min(duration, currentTime + 5));
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentTime, duration, isPlaying]);
    useEffect(() => {
        if (!isDraggingPlayhead) return;

        const handleMouseMove = (e: MouseEvent) => {
            const timeline = document.getElementById('timeline-track');
            if (!timeline) return;

            const rect = timeline.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            const newTime = percentage * duration;
            if (videoElement) {
                videoElement.currentTime = newTime;
                setCurrentTime(newTime);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingPlayhead(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingPlayhead, duration, videoElement]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-pink-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 text-[#ff652d] animate-spin" />
                                <div className="absolute inset-0 w-10 h-10 border-4 border-[#ff652d]/20 rounded-full" />
                            </div>
                        </div>
                        <div className="absolute -inset-4 bg-linear-to-r from-[#ff652d]/20 to-pink-500/20 rounded-3xl blur-2xl -z-10 animate-pulse" />
                    </div>

                    <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-2xl font-semibold mb-2">
                        Loading your project
                    </h2>
                    <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-sm">
                        Setting up your editing workspace...
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-1">
                        <div className="w-2 h-2 bg-[#ff652d] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#ff652d] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#ff652d] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-3xl">⚠️</span>
                    </div>
                    <h1 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl mb-4">
                        Project Not Found
                    </h1>
                    <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] mb-6">
                        {error || 'The project you are looking for does not exist or you do not have access to it.'}
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 bg-[#ff652d] text-white rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const getActiveMedia = () => {
        return mediaItems.find(m => m.id === activeMediaId);
    };

    const videoUrl = (() => {
        const activeMedia = getActiveMedia();
        if (activeMedia) {
            return getVideoUrl(activeMedia.fileId);
        }
        return getVideoUrl(project.videoFileId);
    })();

    const togglePlayPause = () => {
        if (videoElement) {
            if (isPlaying) {
                videoElement.pause();
            } else {
                videoElement.play();
            }
        }
    };
    const seekToTime = (time: number) => {
        if (videoElement) {
            videoElement.currentTime = time;
            setCurrentTime(time);
        }
    };
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingPlayhead) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        seekToTime(newTime);
    };
    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };
    const handleExport = async () => {
        if (!project) return;

        setIsExporting(true);
        setExportProgress(0);

        try {
            console.log('Calling export with:', {
                projectId,
                quality: exportQuality,
                format: exportFormat,
                includeCaptions,
                textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
                trimStart: trimStart > 0 ? trimStart : undefined,
                trimEnd: trimEnd < duration ? trimEnd : undefined
            });

            const result = await exportVideo({
                projectId,
                quality: exportQuality,
                format: exportFormat,
                includeCaptions: includeCaptions && captions.length > 0,
                textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
                trimStart: trimStart > 0 ? trimStart : undefined,
                trimEnd: trimEnd < duration ? trimEnd : undefined
            });

            console.log('Export function result:', result);

            if (result.success) {
                setExportProgress(20);
                console.log('Export started, polling for completion...');

                const { databases } = await import('@/lib/appwrite');
                const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
                const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;

                // Poll for export completion
                let attempts = 0;
                const maxAttempts = 300; // 5 minutes with 1-second intervals (matches function timeout)
                let exportData: any = null;

                while (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;

                    const progress = 20 + (attempts / maxAttempts) * 60; // Progress from 20% to 80%
                    setExportProgress(Math.min(progress, 80));

                    const updatedProject = await databases.getDocument(
                        DATABASE_ID,
                        COLLECTION_ID,
                        projectId
                    );

                    const data = JSON.parse(updatedProject.exportData || '{}');

                    if (data.downloadUrl && data.exportedAt) {
                        // Check if this export is recent (within last 5 minutes)
                        const exportTime = new Date(data.exportedAt).getTime();
                        const now = Date.now();
                        if (now - exportTime < 5 * 60 * 1000) {
                            exportData = data;
                            break;
                        }
                    }
                }

                if (!exportData) {
                    throw new Error('Export timed out or failed. Please check the function logs.');
                }

                console.log('Export data:', exportData);

                if (exportData.downloadUrl) {
                    setExportProgress(100);
                    const videoLink = document.createElement('a');
                    videoLink.href = exportData.downloadUrl;
                    videoLink.download = `${project.title}_${exportQuality}.${exportFormat}`;
                    document.body.appendChild(videoLink);
                    videoLink.click();
                    document.body.removeChild(videoLink);
                    if (exportData.srtContent) {
                        setTimeout(() => {
                            const blob = new Blob([exportData.srtContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);

                            const captionsLink = document.createElement('a');
                            captionsLink.href = url;
                            captionsLink.download = `${project.title}_captions.srt`;
                            document.body.appendChild(captionsLink);
                            captionsLink.click();
                            document.body.removeChild(captionsLink);
                            URL.revokeObjectURL(url);

                            console.log('✅ Video and captions downloaded successfully!');
                        }, 500);
                    }

                    setTimeout(() => {
                        setIsExporting(false);
                        setShowExportModal(false);
                        setExportProgress(0);
                    }, 1500);
                } else {
                    throw new Error('Export data not found in database');
                }
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (err: any) {
            console.error('Export error:', err);
            alert(err.message || 'Failed to export video');
            setIsExporting(false);
            setExportProgress(0);
        }
    };
    const skipTime = (seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        seekToTime(newTime);
    };
    const toggleFullscreen = () => {
        if (videoElement) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoElement.requestFullscreen();
            }
        }
    };
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (videoElement) {
            videoElement.volume = newVolume / 100;
        }
    };
    const toggleMute = () => {
        if (videoElement) {
            if (volume > 0) {
                setVolume(0);
                videoElement.volume = 0;
            } else {
                setVolume(100);
                videoElement.volume = 1;
            }
        }
    };

    return (
        <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-10 h-10 bg-[#ff652d] hover:opacity-90 rounded-lg flex items-center justify-center transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2L2 10L10 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 10H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={editedTitle || ''}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            className="px-4 py-2 font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] border border-[#ff652d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff652d]"
                        />
                    ) : (
                        <button
                            onClick={() => setIsEditingTitle(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                {project?.title || 'Untitled Project'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-[#757575]" />
                        </button>
                    )}

                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <button
                            onClick={() => setZoom(Math.max(50, zoom - 10))}
                            className="text-[#757575] hover:text-[#212121] transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] min-w-12 text-center text-sm">
                            {zoom}%
                        </span>
                        <button
                            onClick={() => setZoom(Math.min(200, zoom + 10))}
                            className="text-[#757575] hover:text-[#212121] transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="hidden md:block p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-[#757575] hover:text-[#212121]">
                        <Undo className="w-5 h-5" />
                    </button>
                    <button className="hidden md:block p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-[#757575] hover:text-[#212121]">
                        <Redo className="w-5 h-5" />
                    </button>

                    <div className="hidden md:block w-px h-6 bg-gray-200 mx-2" />

                    <button className="hidden md:flex items-center gap-2 text-[#757575] hover:text-[#212121]">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">😊</span>
                        </div>
                    </button>
                    <button className="hidden md:flex items-center gap-2 text-[#757575] hover:text-[#212121]">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🎨</span>
                        </div>
                    </button>
                    <button className="hidden md:flex items-center gap-2 text-[#757575] hover:text-[#212121]">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">😎</span>
                        </div>
                    </button>
                    <button className="hidden md:flex items-center gap-2 text-[#757575] hover:text-[#212121]">
                        <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-[#757575]" />
                        </div>
                    </button>

                    <div className="hidden md:block w-px h-6 bg-gray-200 mx-2" />

                    <button className="hidden lg:flex px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors items-center gap-2 font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                        <Settings className="w-4 h-4" />
                    </button>

                    <button className="bg-[#ff652d] hover:opacity-90 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-['Inter',sans-serif] font-medium tracking-[-0.48px] transition-opacity flex items-center gap-2 text-sm md:text-base"
                        onClick={() => setShowExportModal(true)}
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-12 md:w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1 overflow-y-auto">
                    {leftTools.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = selectedTool === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedTool(tool.id)}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive
                                        ? 'bg-[#ff652d] text-white'
                                        : 'text-[#757575] hover:text-[#212121] hover:bg-gray-50'
                                    }`}
                                title={tool.label}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        );
                    })}
                </div>

                {selectedTool === 'media' && user && (
                    <div className="hidden md:block w-72 md:w-80 bg-white border-r border-gray-200 overflow-y-auto">
                        <MediaLibrary
                            projectId={projectId}
                            userId={user.$id}
                            mediaItems={mediaItems}
                            onMediaItemsChange={handleMediaItemsChange}
                            onAddToTimeline={handleAddToTimeline}
                        />
                    </div>
                )}

                <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                    <div className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-auto">
                        <div className="w-full max-w-5xl">
                            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
                                <div
                                    className="relative aspect-video bg-black group"
                                    onMouseEnter={() => setShowVideoControls(true)}
                                    onMouseLeave={() => setShowVideoControls(false)}
                                >
                                    <video
                                        ref={(el) => setVideoElement(el)}
                                        src={videoUrl}
                                        className="w-full h-full object-contain"
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                        onClick={togglePlayPause}
                                    >
                                        Your browser does not support the video tag.
                                    </video>

                                    <div className={`absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${showVideoControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                        {!isPlaying && (
                                            <button
                                                onClick={togglePlayPause}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                                            >
                                                <Play className="w-8 h-8 md:w-10 md:h-10 text-[#ff652d] ml-1" />
                                            </button>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
                                            <div className="flex-1">
                                                <div
                                                    className="h-1 bg-white/30 rounded-full cursor-pointer group/progress"
                                                    onClick={handleTimelineClick}
                                                >
                                                    <div
                                                        className="h-full bg-[#ff652d] rounded-full relative group-hover/progress:h-1.5 transition-all"
                                                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                                    >
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={toggleMute}
                                                className="text-white hover:text-[#ff652d] transition-colors"
                                            >
                                                {volume === 0 ? (
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 4L6 8H2V12H6L10 16V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M16 8L12 12M12 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                ) : volume < 50 ? (
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 4L6 8H2V12H6L10 16V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M14 10C14 9 13.5 8 13 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 4L6 8H2V12H6L10 16V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M14 7C15 8 15.5 9 15.5 10C15.5 11 15 12 14 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        <path d="M16 5C17.5 6.5 18.5 8.5 18.5 10C18.5 11.5 17.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </button>

                                            <span className="text-white text-sm font-['Inter',sans-serif] tracking-[-0.48px]">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>

                                            <button
                                                onClick={toggleFullscreen}
                                                className="text-white hover:text-[#ff652d] transition-colors"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 2H7M2 2V7M2 2L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M18 2H13M18 2V7M18 2L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M2 18H7M2 18V13M2 18L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M18 18H13M18 18V13M18 18L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {project.status === 'processing' && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                            <div className="text-center">
                                                <Loader2 className="w-12 h-12 text-[#ff652d] animate-spin mx-auto mb-4" />
                                                <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white">
                                                    Processing video...
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {getActiveTextOverlays().map(text => (
                                        <div
                                            key={text.id}
                                            className={`absolute cursor-move group ${selectedTextId === text.id ? 'z-20' : 'z-10'}`}
                                            style={{
                                                left: `${text.x}%`,
                                                top: `${text.y}%`,
                                                transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
                                            }}
                                            onMouseDown={(e) => handleTextDragStart(e, text.id)}
                                        >
                                            {selectedTextId === text.id && (
                                                <div className="absolute inset-0 border-2 border-dashed border-[#ff652d] rounded-lg pointer-events-none -m-2 p-2">
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-[#ff652d] rounded-full cursor-nw-resize" />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-[#ff652d] rounded-full cursor-ne-resize" />
                                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-[#ff652d] rounded-full cursor-sw-resize" />
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#ff652d] rounded-full cursor-se-resize" />
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#ff652d] rounded-full cursor-grab">
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#ff652d]" />
                                                    </div>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    backgroundColor: text.backgroundColor,
                                                    opacity: text.opacity / 100,
                                                }}
                                                className="px-4 py-2 rounded-lg"
                                            >
                                                <p
                                                    style={{
                                                        fontSize: `${text.fontSize}px`,
                                                        fontFamily: text.fontFamily,
                                                        color: text.color,
                                                        fontWeight: text.bold ? 'bold' : 'normal',
                                                        fontStyle: text.italic ? 'italic' : 'normal',
                                                        textDecoration: text.underline ? 'underline' : 'none',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                    }}
                                                    className="whitespace-nowrap select-none"
                                                >
                                                    {text.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {captions.length > 0 && (() => {
                                        const activeCaption = captions.find(cap => currentTime >= cap.start && currentTime <= cap.end);
                                        return activeCaption ? (
                                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[85%] md:max-w-[75%] pointer-events-none">
                                                <div className="bg-black/90 backdrop-blur-md px-6 py-3 rounded-xl shadow-2xl border border-white/10">
                                                    <p className="font-['Inter',sans-serif] font-bold tracking-tight text-white text-center text-base md:text-lg leading-tight"
                                                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        {activeCaption.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-t border-gray-200 px-2 md:px-4 py-3">
                        <div className="flex items-center gap-2 md:gap-3 mb-3">
                            <button
                                onClick={togglePlayPause}
                                className="w-8 h-8 bg-[#ff652d] hover:opacity-90 rounded-full flex items-center justify-center transition-opacity"
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4 text-white" />
                                ) : (
                                    <Play className="w-4 h-4 text-white ml-0.5" />
                                )}
                            </button>

                            <div className="flex items-center gap-1 md:gap-2">
                                <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#ff652d] text-xs md:text-sm">
                                    {formatTime(currentTime)}
                                </span>
                                <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs md:text-sm">
                                    / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex-1" />

                            <button
                                onClick={() => skipTime(-5)}
                                className="hidden md:block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Rewind 5 seconds"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 9L9 2L9 16L2 9Z" fill="#757575" />
                                    <path d="M9 9L16 2L16 16L9 9Z" fill="#757575" />
                                </svg>
                            </button>

                            <button
                                onClick={() => skipTime(5)}
                                className="hidden md:block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Forward 5 seconds"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 9L9 16L9 2L16 9Z" fill="#757575" />
                                    <path d="M9 9L2 16L2 2L9 9Z" fill="#757575" />
                                </svg>
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="hidden md:block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Fullscreen"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 2H7M2 2V7M2 2L7 7" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 2H11M16 2V7M16 2L11 7" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 16H7M2 16V11M2 16L7 11" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 16H11M16 16V11M16 16L11 11" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button className="hidden md:block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="9" cy="9" r="7" stroke="#757575" strokeWidth="2" />
                                    <path d="M9 5V9L12 12" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="relative">
                            <div className="hidden md:flex justify-between mb-1 px-2">
                                {Array.from({ length: 11 }).map((_, i) => (
                                    <span key={i} className="font-['Inter',sans-serif] text-[10px] text-[#757575]">
                                        {formatTime(i * 60)}
                                    </span>
                                ))}
                            </div>

                            <div
                                id="timeline-track"
                                className="relative h-16 md:h-24 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                onClick={handleTimelineClick}
                            >
                                {activeMediaId && mediaItems.find(m => m.id === activeMediaId) ? (
                                    <>
                                        <div className="absolute top-1 md:top-2 left-1 md:left-2 right-1 md:right-2 h-10 md:h-16 bg-gray-800 rounded-sm shadow-sm pointer-events-none flex items-center justify-center">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full pointer-events-none">
                                                <Film className="w-4 h-4 text-white" />
                                                <span className="font-['Inter',sans-serif] text-xs font-medium text-white">
                                                    {mediaItems.find(m => m.id === activeMediaId)?.name || project.title}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Empty state - Add Media prompt */
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTool('media');
                                            }}
                                            className="px-4 py-2 bg-[#ff652d] hover:opacity-90 text-white rounded-lg font-['Inter',sans-serif] font-medium text-sm transition-opacity flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Media
                                        </button>
                                    </div>
                                )}

                                {textOverlays.map((text) => {
                                    const startPercent = (text.startTime / duration) * 100;
                                    const widthPercent = ((text.endTime - text.startTime) / duration) * 100;
                                    const isSelected = selectedTextId === text.id;
                                    return (
                                        <div
                                            key={text.id}
                                            className={`absolute bottom-1 md:bottom-2 h-5 rounded-sm group cursor-move transition-all ${isSelected ? 'bg-[#ff652d] shadow-lg z-20' : 'bg-blue-500 hover:bg-blue-600 z-10'
                                                }`}
                                            style={{
                                                left: `calc(0.5rem + ${startPercent}%)`,
                                                width: `${Math.max(widthPercent, 2)}%`,
                                            }}
                                            onMouseDown={(e) => handleTimelineTextDragStart(e, text.id, 'move')}
                                            onClick={(e) => e.stopPropagation()}
                                            title={`${text.text} (${formatTime(text.startTime)} - ${formatTime(text.endTime)})`}
                                        >
                                            <div
                                                className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 ${isSelected ? 'bg-white/20' : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    handleTimelineTextDragStart(e, text.id, 'resize-start');
                                                }}
                                            />

                                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2">
                                                <Type className="w-3 h-3 text-white mr-1 shrink-0" />
                                                <span className="text-[10px] text-white font-medium truncate">
                                                    {text.text}
                                                </span>
                                            </div>

                                            <div
                                                className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 ${isSelected ? 'bg-white/20' : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    handleTimelineTextDragStart(e, text.id, 'resize-end');
                                                }}
                                            />

                                            <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {formatTime(text.startTime)}
                                                </div>
                                            </div>
                                            <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {formatTime(text.endTime)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {(trimStart > 0 || trimEnd < duration) && (
                                    <>
                                        {trimStart > 0 && (
                                            <div
                                                className="absolute top-1 md:top-2 bottom-1 md:bottom-2 left-1 md:left-2 bg-black/50 rounded-l-sm pointer-events-none"
                                                style={{ width: `${(trimStart / duration) * 100}%` }}
                                            />
                                        )}
                                        {trimEnd < duration && (
                                            <div
                                                className="absolute top-1 md:top-2 bottom-1 md:bottom-2 right-1 md:right-2 bg-black/50 rounded-r-sm pointer-events-none"
                                                style={{ width: `${((duration - trimEnd) / duration) * 100}%` }}
                                            />
                                        )}
                                    </>
                                )}

                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-[#ff652d] z-10 cursor-ew-resize"
                                    style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                    onMouseDown={handlePlayheadMouseDown}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#ff652d] rounded-full border-2 border-white cursor-grab active:cursor-grabbing" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block w-80 bg-white border-l border-gray-200 overflow-y-auto">
                    {selectedTool === 'captions' && (
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-gray-200">
                                <button
                                    onClick={handleGenerateCaptions}
                                    disabled={isGeneratingCaptions || !project}
                                    className="w-full bg-[#ff652d] hover:opacity-90 text-white py-3 rounded-lg font-['Inter',sans-serif] font-medium tracking-[-0.48px] transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingCaptions ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            Generate Captions (AI)
                                        </>
                                    )}
                                </button>
                                <p className="font-['Inter',sans-serif] text-xs text-[#757575] text-center mt-2">
                                    Auto-generate captions using AI speech recognition
                                </p>
                            </div>

                            <CaptionEditor
                                captions={captions}
                                currentTime={currentTime}
                                onCaptionUpdate={handleCaptionUpdate}
                                onCaptionDelete={handleCaptionDelete}
                                onCaptionAdd={handleCaptionAdd}
                                onSeekTo={handleSeekTo}
                            />
                        </div>
                    )}

                    {selectedTool === 'ai' && project && (
                        <AIAssistant
                            projectId={projectId}
                            videoDuration={duration}
                            onCommand={(action, params) => {
                                console.log('AI Command:', action, params);
                            }}
                        />
                    )}

                    {selectedTool === 'aspect-ratio' && (
                        <AspectRatioSelector
                            currentRatio="16:9"
                            onSelect={async (preset) => {
                                alert(`Converting to ${preset.label} (${preset.ratio})...`);
                            }}
                            isProcessing={false}
                        />
                    )}

                    {selectedTool === 'text' && (
                        <div className="p-4 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-lg">
                                    Text Overlays
                                </h3>
                                <button
                                    onClick={handleAddText}
                                    className="bg-[#ff652d] hover:opacity-90 text-white px-4 py-2 rounded-lg font-['Inter',sans-serif] font-medium tracking-[-0.48px] transition-opacity flex items-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Text
                                </button>
                            </div>

                            {textOverlays.length === 0 ? (
                                <div className="text-center py-8">
                                    <Type className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="font-['Inter',sans-serif] text-sm text-[#757575]">
                                        No text overlays yet. Click "Add Text" to start.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 mb-6">
                                    {textOverlays.map((text) => (
                                        <div
                                            key={text.id}
                                            onClick={() => setSelectedTextId(text.id)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedTextId === text.id
                                                    ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-['Inter',sans-serif] font-medium text-[#212121] text-sm truncate">
                                                        {text.text}
                                                    </p>
                                                    <p className="font-['Inter',sans-serif] text-xs text-[#757575] mt-1">
                                                        {formatTime(text.startTime)} - {formatTime(text.endTime)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteText(text.id);
                                                    }}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedText && (
                                <div className="space-y-4 border-t border-gray-200 pt-4">
                                    <h4 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] font-medium">
                                        Edit Text
                                    </h4>

                                    <div>
                                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                            Text Content
                                        </label>
                                        <textarea
                                            value={selectedText.text}
                                            onChange={(e) => handleUpdateText(selectedText.id, { text: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] resize-none focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                            Font
                                        </label>
                                        <select
                                            value={selectedText.fontFamily}
                                            onChange={(e) => handleUpdateText(selectedText.id, { fontFamily: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                        >
                                            <option value="Inter">Inter</option>
                                            <option value="Arial">Arial</option>
                                            <option value="Helvetica">Helvetica</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Verdana">Verdana</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                                Font Size
                                            </label>
                                            <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                                {selectedText.fontSize}px
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="12"
                                            max="120"
                                            value={selectedText.fontSize}
                                            onChange={(e) => handleUpdateText(selectedText.id, { fontSize: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                            Style
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateText(selectedText.id, { bold: !selectedText.bold })}
                                                className={`flex-1 p-2.5 border-2 rounded-lg transition-all ${selectedText.bold
                                                        ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Bold className="w-4 h-4 text-[#212121] mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateText(selectedText.id, { italic: !selectedText.italic })}
                                                className={`flex-1 p-2.5 border-2 rounded-lg transition-all ${selectedText.italic
                                                        ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Italic className="w-4 h-4 text-[#212121] mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateText(selectedText.id, { underline: !selectedText.underline })}
                                                className={`flex-1 p-2.5 border-2 rounded-lg transition-all ${selectedText.underline
                                                        ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Underline className="w-4 h-4 text-[#212121] mx-auto" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                            Text Color
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={selectedText.color}
                                                onChange={(e) => handleUpdateText(selectedText.id, { color: e.target.value })}
                                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={selectedText.color}
                                                onChange={(e) => handleUpdateText(selectedText.id, { color: e.target.value })}
                                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] uppercase focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                            Background
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={selectedText.backgroundColor === 'transparent' ? '#000000' : selectedText.backgroundColor}
                                                onChange={(e) => handleUpdateText(selectedText.id, { backgroundColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                            />
                                            <button
                                                onClick={() => handleUpdateText(selectedText.id, {
                                                    backgroundColor: selectedText.backgroundColor === 'transparent' ? '#000000' : 'transparent'
                                                })}
                                                className={`flex-1 px-3 py-2 border-2 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-sm transition-all ${selectedText.backgroundColor === 'transparent'
                                                        ? 'border-[#ff652d] bg-[#ff652d]/5 text-[#ff652d]'
                                                        : 'border-gray-200 text-[#212121] hover:bg-gray-50'
                                                    }`}
                                            >
                                                {selectedText.backgroundColor === 'transparent' ? 'Transparent' : 'Solid'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                                Opacity
                                            </label>
                                            <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                                {selectedText.opacity}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={selectedText.opacity}
                                            onChange={(e) => handleUpdateText(selectedText.id, { opacity: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                                Rotation
                                            </label>
                                            <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                                {selectedText.rotation}°
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={selectedText.rotation}
                                            onChange={(e) => handleUpdateText(selectedText.id, { rotation: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                                Scale
                                            </label>
                                            <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                                {(selectedText.scale * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="3"
                                            step="0.1"
                                            value={selectedText.scale}
                                            onChange={(e) => handleUpdateText(selectedText.id, { scale: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                                X Position
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={selectedText.x}
                                                onChange={(e) => handleUpdateText(selectedText.id, { x: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                                Y Position
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={selectedText.y}
                                                onChange={(e) => handleUpdateText(selectedText.id, { y: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                                Start Time
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={selectedText.endTime}
                                                step="0.1"
                                                value={selectedText.startTime.toFixed(1)}
                                                onChange={(e) => handleUpdateText(selectedText.id, { startTime: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs mb-2">
                                                End Time
                                            </label>
                                            <input
                                                type="number"
                                                min={selectedText.startTime}
                                                max={duration}
                                                step="0.1"
                                                value={selectedText.endTime.toFixed(1)}
                                                onChange={(e) => handleUpdateText(selectedText.id, { endTime: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] focus:border-[#ff652d] focus:ring-1 focus:ring-[#ff652d] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedTool === 'crop' && (
                        <div className="p-4 space-y-6">
                            <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] mb-3">
                                Trim Video
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                            Start Time
                                        </label>
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                            {formatTime(trimStart)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={trimEnd}
                                        step="0.1"
                                        value={trimStart}
                                        onChange={(e) => setTrimStart(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-xs">
                                            End Time
                                        </label>
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm">
                                            {formatTime(trimEnd)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={trimStart}
                                        max={duration}
                                        step="0.1"
                                        value={trimEnd}
                                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff652d]"
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                            Original Duration
                                        </span>
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                            {formatTime(duration)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                            Trimmed Duration
                                        </span>
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#ff652d]">
                                            {formatTime(trimEnd - trimStart)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setTrimStart(0);
                                        setTrimEnd(duration);
                                    }}
                                    className="w-full px-4 py-2 border-2 border-gray-200 text-[#212121] rounded-lg font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:bg-gray-50 transition-colors"
                                >
                                    Reset Trim
                                </button>
                            </div>
                        </div>
                    )}

                    {!['captions', 'aspect-ratio', 'text', 'crop', 'ai', 'media'].includes(selectedTool) && (
                        <div className="p-4">
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Settings className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.48px] text-[#212121] text-lg mb-2">
                                    {leftTools.find(t => t.id === selectedTool)?.label || 'Tool'}
                                </h3>
                                <p className="font-['Inter',sans-serif] text-sm text-[#757575]">
                                    Coming soon...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-2xl mb-1">
                                        Export Video
                                    </h2>
                                    <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-sm">
                                        Choose your export settings and download your video
                                    </p>
                                </div>
                                <button
                                    onClick={() => !isExporting && setShowExportModal(false)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={isExporting}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gray-100 rounded-xl p-4">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                                    <video
                                        src={getVideoUrl(project.videoFileId)}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        {project.title}
                                    </span>
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] mb-3">
                                    Quality
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['1080p', '720p', '480p'] as const).map((quality) => (
                                        <button
                                            key={quality}
                                            onClick={() => setExportQuality(quality)}
                                            disabled={isExporting}
                                            className={`p-4 rounded-xl border-2 transition-all ${exportQuality === quality
                                                    ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                } disabled:opacity-50`}
                                        >
                                            <div className="font-['Inter',sans-serif] font-semibold tracking-[-0.48px] text-[#212121] text-lg mb-1">
                                                {quality}
                                            </div>
                                            <div className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-xs">
                                                {quality === '1080p' ? 'Full HD' : quality === '720p' ? 'HD' : 'Standard'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] mb-3">
                                    Format
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['mp4', 'mov', 'webm'] as const).map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setExportFormat(format)}
                                            disabled={isExporting}
                                            className={`p-4 rounded-xl border-2 transition-all ${exportFormat === format
                                                    ? 'border-[#ff652d] bg-[#ff652d]/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                } disabled:opacity-50`}
                                        >
                                            <div className="font-['Inter',sans-serif] font-semibold tracking-[-0.48px] text-[#212121] uppercase">
                                                {format}
                                            </div>
                                            <div className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-xs">
                                                {format === 'mp4' ? 'Most compatible' : format === 'mov' ? 'Best quality' : 'Web optimized'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {captions.length > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                    <input
                                        type="checkbox"
                                        id="includeCaptions"
                                        checked={includeCaptions}
                                        onChange={(e) => setIncludeCaptions(e.target.checked)}
                                        disabled={isExporting}
                                        className="w-5 h-5 rounded border-gray-300 text-[#ff652d] focus:ring-[#ff652d] disabled:opacity-50"
                                    />
                                    <label htmlFor="includeCaptions" className="flex-1 cursor-pointer">
                                        <div className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                            Burn captions into video
                                        </div>
                                        <div className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-xs mt-1">
                                            {captions.length} caption{captions.length !== 1 ? 's' : ''} will be permanently added to the video
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        Resolution
                                    </span>
                                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                        {exportQuality === '1080p' ? '1920 × 1080' : exportQuality === '720p' ? '1280 × 720' : '854 × 480'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        Frame Rate
                                    </span>
                                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                        30 fps
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        Estimated Size
                                    </span>
                                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                        {exportQuality === '1080p' ? '~120 MB' : exportQuality === '720p' ? '~80 MB' : '~50 MB'}
                                    </span>
                                </div>
                            </div>

                            {isExporting && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                            Exporting...
                                        </span>
                                        <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#ff652d]">
                                            {exportProgress}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#ff652d] transition-all duration-300"
                                            style={{ width: `${exportProgress}%` }}
                                        />
                                    </div>
                                    <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-sm text-center">
                                        This may take a few moments. Please don't close this window.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex items-center gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                disabled={isExporting}
                                className="flex-1 px-6 py-3 border-2 border-gray-200 text-[#212121] rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex-1 px-6 py-3 bg-[#ff652d] text-white rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Exporting
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Export & Download
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
