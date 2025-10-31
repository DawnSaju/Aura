"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, User, Bot } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantProps {
    onCommand?: (command: string, params: any) => void;
    projectId: string;
    videoDuration: number;
}

export default function AIAssistant({ onCommand, projectId, videoDuration }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! 👋 I'm your AI video editing assistant. I can help you:\n\n• Add text overlays\n• Change aspect ratio (16:9, 9:16, 1:1, 4:5)\n• Trim or cut your video\n• Apply filters and effects\n• Add transitions\n• And more!\n\nJust tell me what you'd like to do with your video!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        try {
            const response = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    projectId,
                    videoDuration,
                    conversationHistory: messages.slice(-5)
                })
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            if (data.command && onCommand) {
                onCommand(data.command.action, data.command.params);
            }
        } catch (error) {
            console.error('AI Assistant error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 bg-linear-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-['Inter',sans-serif] font-semibold text-gray-900">AI Assistant</h3>
                        <p className="text-xs text-gray-500">Powered by AI</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user'
                                ? 'bg-[#ff652d]'
                                : 'bg-linear-to-br from-purple-500 to-blue-500'
                            }`}>
                            {message.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                            ) : (
                                <Bot className="w-4 h-4 text-white" />
                            )}
                        </div>

                        <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                            <div
                                className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                        ? 'bg-[#ff652d] text-white rounded-tr-sm'
                                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                </p>
                                <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                                    }`}>
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                <span className="text-sm text-gray-600">Processing...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    <div className="flex-1 bg-white rounded-lg border border-gray-200 focus-within:border-[#ff652d] focus-within:ring-2 focus-within:ring-[#ff652d]/20 transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me to edit your video..."
                            disabled={isProcessing}
                            rows={1}
                            className="w-full px-4 py-3 text-sm resize-none focus:outline-none rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ maxHeight: '120px' }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className="w-11 h-11 bg-[#ff652d] hover:opacity-90 text-white rounded-lg flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
