"use client";

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthLayout from "@/components/AuthLayout";
import { account } from '@/lib/appwrite';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            await account.createRecovery(
                email,
                `${origin}/auth/reset-password`
            );
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a password reset link"
        >
            {success ? (
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-['Inter',sans-serif] tracking-[-0.48px] text-sm">
                        Check your email! We've sent you a password reset link.
                    </div>
                    <button
                        onClick={() => router.push('/auth/signin')}
                        className="w-full bg-[#ff652d] text-white py-3.5 rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity"
                    >
                        Back to Sign In
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl font-['Inter',sans-serif] tracking-[-0.48px] text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575]"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff652d] text-white py-3.5 rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/auth/signin')}
                        className="w-full flex items-center justify-center gap-2 text-[#757575] hover:text-[#212121] transition-colors font-['Inter',sans-serif] font-medium tracking-[-0.48px]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
