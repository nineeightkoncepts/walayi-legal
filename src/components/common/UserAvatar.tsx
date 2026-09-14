import React, { useState } from 'react';
import { User, Camera, Upload } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  showUploadOverlay?: boolean;
  onUploadClick?: () => void;
  id?: string;
  alt?: string;
}

const sizeClasses: Record<string, { container: string; icon: string; text: string }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-[9px]' },
  sm: { container: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-[10px]' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xs' },
  lg: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-sm' },
  xl: { container: 'w-24 h-24 sm:w-28 sm:h-28', icon: 'w-12 h-12', text: 'text-base' },
  '2xl': { container: 'w-28 h-28 sm:w-32 sm:h-32', icon: 'w-14 h-14', text: 'text-lg' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
  showUploadOverlay = false,
  onUploadClick,
  id,
  alt = 'User Avatar'
}) => {
  const [imgError, setImgError] = useState(false);

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const currentSize = sizeClasses[size] || sizeClasses.md;

  // Derive initials if name provided
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase())
        .join('')
    : '';

  const trimmedSrc = src && typeof src === 'string' ? src.trim() : '';
  const hasValidPhoto = Boolean(trimmedSrc.length > 0 && !imgError);

  return (
    <div
      id={id}
      onClick={onUploadClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${currentSize.container} ${roundedClass} ${
        onUploadClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {hasValidPhoto && trimmedSrc ? (
        <img
          src={trimmedSrc}
          alt={alt}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${roundedClass}`}
        />
      ) : (
        /* Blank Avatar: Simple, clean neutral silhouette icon */
        <div
          className={`w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shadow-2xs ${roundedClass}`}
          title={name ? `${name} (Blank Avatar - Click to set photo)` : 'Blank Avatar'}
        >
          <User className={`${currentSize.icon} text-slate-400 stroke-[1.75]`} />
        </div>
      )}

      {/* Interactive Upload Overlay */}
      {showUploadOverlay && (
        <div
          className={`absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1 ${roundedClass}`}
          title="Click to Upload Photo"
        >
          <Camera className="w-4 h-4 text-teal-300" />
          <span className="text-[9px] tracking-tight">Upload</span>
        </div>
      )}
    </div>
  );
};
