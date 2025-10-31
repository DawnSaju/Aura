"use client";

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Film } from 'lucide-react';
import { uploadVideo, createProject, validateVideoFile, formatFileSize, updateProjectStatus } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface VideoUploaderProps {
    onClose?: () => void;
}

export default function VideoUploader({ onClose }: VideoUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const router = useRouter();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        setError('');

        const validation = validateVideoFile(selectedFile);
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        setFile(selectedFile);
        if (!title) {
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
            setTitle(fileName);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !user || !title.trim()) {
            setError('Please provide a title and select a video file');
            return;
        }

        setUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            const uploadedFile = await uploadVideo(file, (progress) => {
                setUploadProgress(progress.percentage);
            });
            const project = await createProject({
                title: title.trim(),
                description: description.trim(),
                userId: user.$id,
                videoFileId: uploadedFile.$id,
                fileSize: file.size,
                mimeType: file.type,
            });
            await updateProjectStatus(project.$id, 'ready');

            setSuccess(true);
            setTimeout(() => {
                router.push(`/editing/${project.$id}`);
            }, 1500);

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed. Please try again.');
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setTitle('');
        setDescription('');
        setUploadProgress(0);
        setError('');
        setSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-2xl">
                            Upload Video
                        </h2>
                        <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-sm">
                            Upload your video to start editing
                        </p>
                    </div>
                </div>
                {onClose && !uploading && (
                    <button
                        onClick={onClose}
                        className="text-[#757575] hover:text-[#212121] transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-sm">
                            {error}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3">
                        <Check className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-sm">
                                Upload complete!
                            </p>
                            <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-sm mt-1">
                                Redirecting to editor...
                            </p>
                        </div>
                    </div>
                )}

                {!file ? (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive
                                ? 'border-[#ff652d] bg-orange-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <Film className="w-8 h-8 text-[#757575]" />
                            </div>
                            <div>
                                <p className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-lg mb-1">
                                    Drag and drop your video here
                                </p>
                                <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-sm">
                                    or click to browse
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-[#ff652d] text-white rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity"
                            >
                                Choose File
                            </button>
                            <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-xs">
                                Supported: MP4, MOV, WEBM, AVI, MKV (max 500MB)
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>
                ) : (
                    /* File Selected */
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-lg flex items-center justify-center shrink-0">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] truncate">
                                    {file.name}
                                </p>
                                <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] text-sm">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={resetForm}
                                    className="text-[#757575] hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                                    Project Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a title for your project"
                                    disabled={uploading}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575] disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a description for your project"
                                    disabled={uploading}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575] resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121]">
                                        Uploading...
                                    </span>
                                    <span className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575]">
                                        {uploadProgress}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-linear-to-r from-[#ffa280] to-[#ff652d] transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={resetForm}
                                disabled={uploading}
                                className="flex-1 px-6 py-3 border border-gray-300 text-[#212121] rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !title.trim() || success}
                                className="flex-1 px-6 py-3 bg-[#ff652d] text-white rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : success ? 'Complete!' : 'Upload & Edit'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
