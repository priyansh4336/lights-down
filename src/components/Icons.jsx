import React from 'react';

export const ArrowLeft01Icon = 'arrow-left';
export const ArrowRight01Icon = 'arrow-right';
export const Tick02Icon = 'tick';
export const VolumeLowIcon = 'volume-low';
export const VolumeHighIcon = 'volume-high';
export const Video01Icon = 'video';
export const Folder01Icon = 'folder';
export const File01Icon = 'file';
export const CodeIcon = 'file';
export const FigmaIcon = 'file';
export const FileZipIcon = 'file';
export const Image01Icon = 'video';
export const MusicNote01Icon = 'video';
export const Note01Icon = 'file';
export const Pdf01Icon = 'file';
export const Presentation01Icon = 'video';
export const Table01Icon = 'file';

export function HugeiconsIcon({ icon, size = 18, strokeWidth = 2, className = '' }) {
  const s = Number(size) || 18;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': 'true'
  };

  switch (icon) {
    case ArrowLeft01Icon:
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case ArrowRight01Icon:
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case Tick02Icon:
      return (
        <svg {...common}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case VolumeLowIcon:
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    case VolumeHighIcon:
      return (
        <svg {...common}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="7.01" y2="8" />
          <line x1="7" y1="12" x2="7.01" y2="12" />
          <line x1="7" y1="16" x2="7.01" y2="16" />
        </svg>
      );
  }
}
