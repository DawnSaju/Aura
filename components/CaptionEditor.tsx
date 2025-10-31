export interface Caption {
    id: string;
    start: number;
    end: number;
    text: string;
}

export interface CaptionEditorProps {
    captions: Caption[];
    currentTime: number;
    onCaptionUpdate: (id: string, text: string) => void;
    onCaptionDelete: (id: string) => void;
    onCaptionAdd: (caption: Omit<Caption, 'id'>) => void;
    onSeekTo: (time: number) => void;
}

export default function CaptionEditor({
    captions,
    currentTime,
    onCaptionUpdate,
    onCaptionDelete,
    onCaptionAdd,
    onSeekTo
}: CaptionEditorProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const parseTime = (timeStr: string): number => {
        const parts = timeStr.split(':');
        const mins = parseInt(parts[0]) || 0;
        const secsParts = parts[1]?.split('.') || ['0', '0'];
        const secs = parseInt(secsParts[0]) || 0;
        const ms = parseInt(secsParts[1]) || 0;
        return mins * 60 + secs + ms / 100;
    };

    const isActivCaption = (caption: Caption) => {
        return currentTime >= caption.start && currentTime <= caption.end;
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.48px] text-[#212121] text-base font-semibold">
                    Captions
                </h3>
                <p className="font-['Inter',sans-serif] text-xs text-[#757575] mt-0.5">
                    {captions.length} caption{captions.length !== 1 ? 's' : ''} • Click to jump to timestamp
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {captions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <p className="font-['Inter',sans-serif] text-sm font-medium text-[#212121] mb-1">
                            No captions yet
                        </p>
                        <p className="font-['Inter',sans-serif] text-xs text-[#757575]">
                            Generate captions using AI or add them manually
                        </p>
                    </div>
                ) : (
                    captions.map((caption, index) => (
                        <div
                            key={caption.id}
                            className={`group relative border rounded-xl p-3 transition-all duration-200 cursor-pointer ${isActivCaption(caption)
                                    ? 'border-[#ff652d] bg-orange-50 shadow-md ring-2 ring-orange-100'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:scale-[1.01]'
                                }`}
                            onClick={() => onSeekTo(caption.start)}
                        >
                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${isActivCaption(caption)
                                    ? 'bg-[#ff652d] text-white'
                                    : 'bg-gray-300 text-gray-700 group-hover:bg-gray-400'
                                }`}>
                                {index + 1}
                            </div>

                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="flex items-center gap-1.5 flex-1">
                                    <input
                                        type="text"
                                        value={formatTime(caption.start)}
                                        onChange={(e) => {
                                            const newStart = parseTime(e.target.value);
                                        }}
                                        className="w-[90px] px-2.5 py-1.5 text-xs font-mono font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff652d] focus:ring-2 focus:ring-orange-100 bg-white text-gray-900"
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="00:00.00"
                                    />
                                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={formatTime(caption.end)}
                                        onChange={(e) => {
                                            const newEnd = parseTime(e.target.value);
                                        }}
                                        className="w-[90px] px-2.5 py-1.5 text-xs font-mono font-medium border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff652d] focus:ring-2 focus:ring-orange-100 bg-white text-gray-900"
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="00:00.00"
                                    />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this caption?')) {
                                            onCaptionDelete(caption.id);
                                        }
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                                    title="Delete caption"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <textarea
                                value={caption.text}
                                onChange={(e) => onCaptionUpdate(caption.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full px-3 py-2 text-sm font-['Inter',sans-serif] leading-snug border rounded-lg resize-none focus:outline-none focus:border-[#ff652d] focus:ring-2 focus:ring-orange-100 transition-all text-gray-900 ${isActivCaption(caption)
                                        ? 'border-orange-300 bg-white'
                                        : 'border-gray-200 bg-white focus:bg-white'
                                    }`}
                                rows={2}
                                placeholder="Caption text..."
                            />
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-white">
                <button
                    onClick={() => {
                        const newCaption = {
                            start: currentTime,
                            end: currentTime + 3,
                            text: 'New caption'
                        };
                        onCaptionAdd(newCaption);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#212121] rounded-xl font-['Inter',sans-serif] font-semibold text-sm transition-all hover:shadow-md flex items-center justify-center gap-2 border border-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Caption at {formatTime(currentTime)}
                </button>
            </div>
        </div>
    );
}
