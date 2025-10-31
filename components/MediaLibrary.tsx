"use client";

import { useMemo, useRef, useState } from 'react';
import {
    Upload,
    Trash2,
    Video,
    Music,
    Image as ImageIcon,
    Loader2,
    Search,
} from 'lucide-react';
import { uploadVideo } from '@/lib/storage';
import type { MediaItem } from '@/lib/storage';

type FilterType = 'all' | 'video' | 'audio' | 'image';

interface MediaLibraryProps {
    projectId: string;
    userId: string;
    mediaItems: MediaItem[];
    onMediaItemsChange: (items: MediaItem[]) => void;
    onAddToTimeline?: (item: MediaItem) => void;
}

export default function MediaLibrary({
    projectId,
    userId,
    mediaItems,
    onMediaItemsChange,
    onAddToTimeline,
}: MediaLibraryProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [query, setQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalCount = mediaItems.length;
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return mediaItems.filter((m) => {
            const matchesType = filter === 'all' ? true : m.type === filter;
            const matchesQuery = q ? m.name.toLowerCase().includes(q) : true;
            return matchesType && matchesQuery;
        });
    }, [mediaItems, filter, query]);

    const handleUploadClick = () => fileInputRef.current?.click();

    async function buildMediaItemFromFile(file: File): Promise<MediaItem> {
        const uploadedFile = await uploadVideo(file, (progress) => {
            setUploadProgress(progress.percentage);
        });

        let type: MediaItem['type'] = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('image/')) type = 'image';

        const item: MediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fileId: uploadedFile.$id,
            type,
            name: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
        };

        if (type === 'video' || type === 'audio') {
            const url = URL.createObjectURL(file);
            const el = type === 'video' ? document.createElement('video') : document.createElement('audio');
            el.src = url;
            await new Promise<void>((resolve) => {
                el.onloadedmetadata = () => {
                    item.duration = el.duration;
                    URL.revokeObjectURL(url);
                    resolve();
                };
            });
        }

        return item;
    }

    const handleFilesUpload = async (files: FileList | File[]) => {
        const list = Array.from(files);
        if (list.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        try {
            const newItems: MediaItem[] = [];
            for (let i = 0; i < list.length; i++) {
                const file = list[i];
                const item = await buildMediaItemFromFile(file);
                newItems.push(item);
                setUploadProgress(Math.round(((i + 1) / list.length) * 100));
            }
            onMediaItemsChange([...mediaItems, ...newItems]);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload media. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFilesUpload(e.target.files);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesUpload(e.dataTransfer.files);
        }
    };

    const handleRemoveMedia = (itemId: string) => {
        onMediaItemsChange(mediaItems.filter((item) => item.id !== itemId));
    };

    const getMediaIcon = (type: MediaItem['type']) => {
        switch (type) {
            case 'video':
                return <Video className="w-5 h-5 text-[#212121]" />;
            case 'audio':
                return <Music className="w-5 h-5 text-[#212121]" />;
            case 'image':
                return <ImageIcon className="w-5 h-5 text-[#212121]" />;
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '—';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="h-full flex flex-col bg-white relative"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className="px-4 pt-4 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#212121]">Video</h3>
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-[#757575]">{totalCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => alert('Coming soon: AI Video generation')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-xs rounded-lg text-[#212121] hover:bg-gray-50"
                        >
                            Generate
                        </button>
                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff652d] text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            <span>{isUploading ? `${uploadProgress}%` : 'Upload'}</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,audio/*,image/*"
                            multiple
                            onChange={onFileInputChange}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="mt-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#9E9E9E] absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search media..."
                            className="w-full pl-7 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#ff652d]/30 focus:border-[#ff652d]"
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                    {(['all', 'video', 'audio', 'image'] as FilterType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${filter === t
                                    ? 'bg-[#ff652d]/10 border-[#ff652d] text-[#ff652d]'
                                    : 'bg-white border-gray-200 text-[#616161] hover:bg-gray-50'
                                }`}
                        >
                            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {isUploading && (
                    <div className="mt-3 h-1 bg-gray-100 rounded">
                        <div
                            className="h-1 bg-[#ff652d] rounded transition-all"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}
            </div>

            {dragActive && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                    <div className="border-2 border-dashed border-white/70 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-lg">
                        <Upload className="w-6 h-6 text-[#ff652d] mx-auto mb-2" />
                        <p className="text-sm text-[#212121] font-medium">Drop files to upload</p>
                        <p className="text-xs text-[#616161] mt-1">Videos, audio, or images</p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                {filtered.length === 0 && !isUploading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-[#9E9E9E]" />
                            </div>
                            <p className="text-sm font-medium text-[#212121]">No media yet</p>
                            <p className="text-xs text-[#616161] mt-1">Upload or drag files here to get started</p>
                            <button
                                onClick={handleUploadClick}
                                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff652d] text-white text-xs rounded-lg hover:opacity-90"
                            >
                                <Upload className="w-3 h-3" /> Upload media
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className="group rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all overflow-hidden"
                            >
                                <div
                                    className="relative aspect-video bg-gray-100 flex items-center justify-center"
                                >
                                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-gray-200 text-[10px] text-[#616161]">
                                        {item.type.toUpperCase()}
                                        {item.duration ? (
                                            <span className="ml-1 text-[#9E9E9E]">• {formatDuration(item.duration)}</span>
                                        ) : null}
                                    </div>

                                    <div className="text-[#616161]">{getMediaIcon(item.type)}</div>

                                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onAddToTimeline?.(item)}
                                            className="flex-1 mr-2 px-3 py-1.5 rounded-md text-xs bg-[#ff652d] text-white hover:opacity-90"
                                        >
                                            Add to timeline
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveMedia(item.id);
                                            }}
                                            aria-label="Remove"
                                            className="px-2 py-1 rounded-md text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3">
                                    <p className="text-xs font-medium text-[#212121] truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#616161]">
                                        <span>{formatFileSize(item.fileSize)}</span>
                                        <span className="uppercase tracking-wide text-[#9E9E9E]">{item.mimeType?.split('/')[1] || ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
