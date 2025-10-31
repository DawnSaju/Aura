"use client";

import { Play } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-lg flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-2xl text-[#212121]">
                            Aura
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-4xl md:text-5xl">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-[#757575] text-lg">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>

            <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-[#ffa280] to-[#ff652d] items-center justify-center p-12 relative overflow-hidden">
                <div className="relative z-10 text-center space-y-6 max-w-lg">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Play className="w-10 h-10 text-white fill-white" />
                        </div>
                    </div>
                    <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.92px] text-white text-5xl">
                        AI Powered Video Editing
                    </h2>
                    <p className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white/90 text-xl">
                        Transform your content with cutting edge AI technology and professional editing tools
                    </p>
                    <div className="flex items-center justify-center gap-8 pt-8">
                        <div className="text-center">
                            <div className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-white text-4xl mb-1">
                                AppWrite
                            </div>
                            <div className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white/80">
                                Backend
                            </div>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                            <div className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-white text-4xl mb-1">
                                GitHub
                            </div>
                            <div className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white/80">
                                Open Source
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
