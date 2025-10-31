"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Play,
    Upload,
    FileVideo,
    Settings,
    Loader2,
    Clock,
    LayoutTemplate,
    Search,
    Bell,
    Plus,
    Folder,
    Trash2,
    User,
    FilePlus,
    PlaySquare,
    MoreVertical,
    LogOut
} from 'lucide-react';
import VideoUploader from '@/components/VideoUploader';
import { getUserProjects, Project, formatFileSize } from '@/lib/storage';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [showUploader, setShowUploader] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeSidebar, setActiveSidebar] = useState('project');
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    const loadProjects = async () => {
        if (!user) return;

        setLoadingProjects(true);
        try {
            const userProjects = await getUserProjects(user.$id);
            setProjects(userProjects);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-2xl animate-pulse mx-auto mb-4"></div>
                    <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575]">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden">
            {showUploader && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <VideoUploader
                        onClose={() => {
                            setShowUploader(false);
                            loadProjects();
                        }}
                    />
                </div>
            )}

            <div className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 gap-6">
                <div className="w-12 h-12 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Play className="w-6 h-6 text-white fill-white" />
                </div>

                <div className="flex-1 flex flex-col items-center gap-2">
                    <button
                        onClick={() => setActiveSidebar('project')}
                        className={`group w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeSidebar === 'project'
                                ? 'bg-[#ff652d] text-white shadow-lg shadow-[#ff652d]/30'
                                : 'text-[#757575] hover:bg-gray-200 hover:text-[#212121]'
                            }`}
                        title="Projects"
                    >
                        <FileVideo className="w-5 h-5" />
                        <span className="text-[10px] font-['Inter',sans-serif] font-medium">Project</span>
                    </button>

                    <button
                        onClick={() => setActiveSidebar('template')}
                        className={`group w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeSidebar === 'template'
                                ? 'bg-[#ff652d] text-white shadow-lg shadow-[#ff652d]/30'
                                : 'text-[#757575] hover:bg-gray-200 hover:text-[#212121]'
                            }`}
                        title="Templates"
                    >
                        <LayoutTemplate className="w-5 h-5" />
                        <span className="text-[10px] font-['Inter',sans-serif] font-medium">Template</span>
                    </button>

                    <button
                        onClick={() => setActiveSidebar('folder')}
                        className={`group w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeSidebar === 'folder'
                                ? 'bg-[#ff652d] text-white shadow-lg shadow-[#ff652d]/30'
                                : 'text-[#757575] hover:bg-gray-200 hover:text-[#212121]'
                            }`}
                        title="Folders"
                    >
                        <Folder className="w-5 h-5" />
                        <span className="text-[10px] font-['Inter',sans-serif] font-medium">Folder</span>
                    </button>

                    <button
                        onClick={() => setActiveSidebar('trash')}
                        className={`group w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeSidebar === 'trash'
                                ? 'bg-[#ff652d] text-white shadow-lg shadow-[#ff652d]/30'
                                : 'text-[#757575] hover:bg-gray-200 hover:text-[#212121]'
                            }`}
                        title="Trash"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-['Inter',sans-serif] font-medium">Trash</span>
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-[#757575] hover:bg-gray-200 hover:text-[#212121] transition-all"
                        title="Account"
                    >
                        <div className="w-8 h-8 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-['Inter',sans-serif] font-medium">Account</span>
                    </button>

                    {showUserMenu && (
                        <div className="absolute bottom-full left-full ml-2 mb-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="font-['SF_Pro_Display',sans-serif] tracking-[-0.48px] text-[#212121] font-medium">
                                    {user.name || 'User'}
                                </p>
                                <p className="font-['Inter',sans-serif] text-xs text-[#757575]">
                                    {user.email}
                                </p>
                            </div>
                            <button className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-sm text-[#212121] hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <button className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-sm text-[#212121] hover:bg-gray-50 transition-colors flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notifications
                            </button>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left font-['Inter',sans-serif] text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl text-[#212121]">
                            Aura
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-['Inter',sans-serif] text-[#212121] focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none transition-all placeholder:text-[#757575] w-64"
                            />
                        </div>
                        <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <Bell className="w-5 h-5 text-[#757575]" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff652d] rounded-full" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-linear-to-b from-gray-50 to-white">
                    <div className="max-w-6xl mx-auto px-8 py-12">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-2xl mb-6 shadow-lg shadow-[#ff652d]/30">
                                <Play className="w-8 h-8 text-white fill-white" />
                            </div>

                            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-2px] text-5xl text-[#212121] mb-4">
                                Your aura starts here
                            </h2>

                            <p className="font-['Inter',sans-serif] tracking-[-0.48px] text-lg text-[#757575] max-w-2xl mx-auto">
                                Choose how you want to unleash your creativity.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            <button
                                onClick={() => setShowUploader(true)}
                                className="group relative bg-white border-2 border-gray-200 hover:border-[#ff652d] rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-[#ff652d]/10"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gray-50 group-hover:bg-[#ff652d]/10 rounded-2xl flex items-center justify-center mb-4 transition-all">
                                        <Upload className="w-8 h-8 text-[#757575] group-hover:text-[#ff652d] transition-colors" />
                                    </div>
                                    <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl text-[#212121] mb-2">
                                        Import Media
                                    </h3>
                                    <p className="font-['Inter',sans-serif] text-sm text-[#757575]">
                                        Upload your videos and start editing
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowUploader(true)}
                                className="group relative bg-linear-to-br from-[#ff652d] to-[#ffa280] rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-[#ff652d]/30 transform hover:scale-105"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                                        <FilePlus className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl text-white mb-2">
                                        New Project
                                    </h3>
                                    <p className="font-['Inter',sans-serif] text-sm text-white/90">
                                        Start with a blank canvas
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveSidebar('template')}
                                className="group relative bg-white border-2 border-gray-200 hover:border-[#ff652d] rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-[#ff652d]/10"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gray-50 group-hover:bg-[#ff652d]/10 rounded-2xl flex items-center justify-center mb-4 transition-all">
                                        <PlaySquare className="w-8 h-8 text-[#757575] group-hover:text-[#ff652d] transition-colors" />
                                    </div>
                                    <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl text-[#212121] mb-2">
                                        Use Template
                                    </h3>
                                    <p className="font-['Inter',sans-serif] text-sm text-[#757575]">
                                        Browse professionally designed templates
                                    </p>
                                </div>
                            </button>
                        </div>

                        {!loadingProjects && projects.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.2px] text-2xl text-[#212121]">
                                        Recent Projects
                                    </h3>
                                    <button className="font-['Inter',sans-serif] font-medium text-sm text-[#ff652d] hover:text-[#ff652d]/80 transition-colors">
                                        View All
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {projects.slice(0, 4).map((project) => (
                                        <div
                                            key={project.$id}
                                            onClick={() => router.push(`/editing/${project.$id}`)}
                                            className="group bg-white border border-gray-200 hover:border-[#ff652d] rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-[#ff652d]/10 text-left"
                                        >
                                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                                {project.thumbnailUrl ? (
                                                    <img
                                                        src={project.thumbnailUrl}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FileVideo className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                        <Play className="w-5 h-5 text-[#ff652d] fill-[#ff652d] ml-0.5" />
                                                    </div>
                                                </div>
                                                {project.duration && (
                                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-['Inter',sans-serif] font-medium">
                                                        {Math.floor(project.duration / 60)}:{String(Math.floor(project.duration % 60)).padStart(2, '0')}
                                                    </div>
                                                )}
                                                {project.status === 'processing' && (
                                                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-['Inter',sans-serif] font-medium flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Processing
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.48px] text-[#212121] text-sm line-clamp-1">
                                                        {project.title}
                                                    </h4>
                                                    <div
                                                        onClick={() => {
                                                        }}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5 text-[#757575]" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-['Inter',sans-serif] text-[#757575]">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(project.$createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                        {loadingProjects && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-[#ff652d] animate-spin" />
                            </div>
                        )}

                        {!loadingProjects && projects.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FileVideo className="w-8 h-8 text-[#757575]" />
                                </div>
                                <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl text-[#212121] mb-2">
                                    No projects yet
                                </h3>
                                <p className="font-['Inter',sans-serif] text-sm text-[#757575] mb-6">
                                    Upload your first video to get started
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </div>
    );
}