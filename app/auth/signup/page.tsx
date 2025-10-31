"use client";

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Chrome, Check, X } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
    const router = useRouter();
    const { register, loginWithGoogle } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*]/.test(formData.password),
    };

    const allChecksPassed = Object.values(passwordChecks).every(check => check);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (!allChecksPassed) {
            setError('Please meet all password requirements');
            setLoading(false);
            return;
        }

        try {
            await register(formData.email, formData.password, formData.name);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google sign-up failed');
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join us and start creating amazing videos with AI"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl font-['Inter',sans-serif] tracking-[-0.48px] text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575]"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575]"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Create a password"
                            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575]"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#212121] transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {formData.password && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2">
                            <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] text-sm mb-2">
                                Password must contain:
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    {passwordChecks.length ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`font-['Inter',sans-serif] tracking-[-0.48px] text-sm ${passwordChecks.length ? 'text-green-600' : 'text-[#757575]'}`}>
                                        At least 8 characters
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {passwordChecks.uppercase ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`font-['Inter',sans-serif] tracking-[-0.48px] text-sm ${passwordChecks.uppercase ? 'text-green-600' : 'text-[#757575]'}`}>
                                        One uppercase letter
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {passwordChecks.lowercase ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`font-['Inter',sans-serif] tracking-[-0.48px] text-sm ${passwordChecks.lowercase ? 'text-green-600' : 'text-[#757575]'}`}>
                                        One lowercase letter
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {passwordChecks.number ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`font-['Inter',sans-serif] tracking-[-0.48px] text-sm ${passwordChecks.number ? 'text-green-600' : 'text-[#757575]'}`}>
                                        One number
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {passwordChecks.special ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`font-['Inter',sans-serif] tracking-[-0.48px] text-sm ${passwordChecks.special ? 'text-green-600' : 'text-[#757575]'}`}>
                                        One special character (!@#$%^&*)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#212121] mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm your password"
                            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:border-[#ff652d] focus:ring-2 focus:ring-[#ff652d]/20 outline-none font-['Inter',sans-serif] tracking-[-0.48px] text-[#212121] transition-all placeholder:text-[#757575]"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#212121] transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="mt-2 font-['Inter',sans-serif] tracking-[-0.48px] text-red-500 text-sm">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 border-2 border-gray-300 rounded accent-[#ff652d] mt-0.5"
                        required
                    />
                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575] text-sm">
                        I agree to the{' '}
                        <a href="/terms" className="text-[#ff652d] hover:opacity-80 transition-opacity">
                            Terms & Conditions
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-[#ff652d] hover:opacity-80 transition-opacity">
                            Privacy Policy
                        </a>
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff652d] text-white py-3.5 rounded-xl font-['Inter',sans-serif] font-medium tracking-[-0.48px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575]">
                            Or sign up with
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Chrome className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                    </button>
                </div>

                <p className="text-center font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575]">
                    Already have an account?{' '}
                    <Link
                        href="/auth/signin"
                        className="text-[#ff652d] hover:opacity-80 transition-opacity"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
