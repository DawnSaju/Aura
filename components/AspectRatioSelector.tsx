'use client';

import { useState } from 'react';

export interface AspectRatioPreset {
  id: string;
  ratio: '16:9' | '9:16' | '1:1' | '4:5';
  label: string;
  description: string;
  dimensions: { width: number; height: number };
}

const presets: AspectRatioPreset[] = [
  {
    id: 'youtube',
    ratio: '16:9',
    label: 'YouTube',
    description: 'Landscape (1920x1080)',
    dimensions: { width: 1920, height: 1080 }
  },
  {
    id: 'tiktok',
    ratio: '9:16',
    label: 'TikTok',
    description: 'Portrait (1080x1920)',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'instagram-post',
    ratio: '1:1',
    label: 'Instagram Post',
    description: 'Square (1080x1080)',
    dimensions: { width: 1080, height: 1080 }
  },
  {
    id: 'instagram-story',
    ratio: '9:16',
    label: 'Instagram Story',
    description: 'Portrait (1080x1920)',
    dimensions: { width: 1080, height: 1920 }
  },
  {
    id: 'instagram-reel',
    ratio: '4:5',
    label: 'Instagram Reel',
    description: 'Portrait (1080x1350)',
    dimensions: { width: 1080, height: 1350 }
  }
];

interface AspectRatioSelectorProps {
  currentRatio?: string;
  onSelect: (preset: AspectRatioPreset) => void;
  isProcessing?: boolean;
}

export default function AspectRatioSelector({
  currentRatio,
  onSelect,
  isProcessing = false
}: AspectRatioSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<AspectRatioPreset | null>(null);
  const [cropPosition, setCropPosition] = useState<'top' | 'center' | 'bottom'>('center');

  const RatioPreview = ({ ratio }: { ratio: AspectRatioPreset['ratio'] }) => {
    const [w, h] = ratio.split(':').map(Number);
    const isPortrait = w < h;
    const isSquare = w === h;
    const frameWidth = isSquare ? 44 : isPortrait ? 32 : 56;

    return (
      <div className="flex items-center">
        <div
          className="relative bg-white border-2 border-gray-300 rounded-md shadow-sm flex items-center justify-center"
          style={{ width: frameWidth, height: isPortrait ? 56 : 36 }}
        >
                    <div
            className="bg-gray-200 rounded-sm"
            style={{ width: '80%', aspectRatio: `${w}/${h}` }}
          />
        </div>
                {!isPortrait && !isSquare && (
          <div className="w-8 h-1 bg-gray-300 rounded mx-auto ml-2" />
        )}
      </div>
    );
  };

  const handleSelect = (preset: AspectRatioPreset) => {
    setSelectedPreset(preset);
  };

  const handleApply = () => {
    if (selectedPreset) {
      onSelect(selectedPreset);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.48px] text-[#212121] text-lg font-semibold">
          Aspect Ratio
        </h3>
        <p className="font-['Inter',sans-serif] text-sm text-[#757575] mt-1">
          Convert for different platforms
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset)}
            disabled={isProcessing}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedPreset?.id === preset.id
                ? 'border-[#ff652d] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <RatioPreview ratio={preset.ratio} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-['Inter',sans-serif] font-semibold text-[#212121]">
                    {preset.label}
                  </h4>
                  <span className="px-2 py-0.5 bg-gray-100 text-[#757575] text-xs rounded-full font-['Inter',sans-serif] font-medium">
                    {preset.ratio}
                  </span>
                </div>
                <p className="font-['Inter',sans-serif] text-sm text-[#757575]">
                  {preset.description}
                </p>
              </div>
            </div>
          </button>
        ))}

        {selectedPreset && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-['Inter',sans-serif] font-semibold text-[#212121] mb-3">
              Crop Position
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(['top', 'center', 'bottom'] as const).map((position) => (
                <button
                  key={position}
                  onClick={() => setCropPosition(position)}
                  className={`px-3 py-2 rounded-lg text-sm font-['Inter',sans-serif] font-medium transition-colors ${
                    cropPosition === position
                      ? 'bg-[#ff652d] text-white'
                      : 'bg-white text-[#757575] hover:bg-gray-100'
                  }`}
                >
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                </button>
              ))}
            </div>
            <p className="font-['Inter',sans-serif] text-xs text-[#757575] mt-2">
              Choose where to focus when cropping
            </p>
          </div>
        )}
      </div>

      {selectedPreset && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-[#ff652d] hover:opacity-90 text-white rounded-lg font-['Inter',sans-serif] font-medium transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Convert to {selectedPreset.label}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
