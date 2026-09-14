import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'glyph';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSlogan?: boolean;
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '', 
  showSlogan = false,
  light = false 
}) => {
  const navy = '#0D1B3D';
  const teal = '#0097A7';
  const white = '#FFFFFF';

  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-20',
  };

  const LogoMark = () => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
      {/* Background Arc */}
      <path 
        d="M10 75C10 75 30 85 50 85C70 85 90 75 90 75" 
        stroke={light ? white : navy} 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      
      {/* Deponent (Left) */}
      <path 
        d="M25 65C25 55 20 45 15 45V30C15 25 20 20 25 20C30 20 35 25 35 30V40L45 35L48 45L35 50V65H25Z" 
        fill={light ? white : navy} 
      />
      {/* Deponent Hand Raised */}
      <path d="M45 15L42 35L48 35L45 15Z" fill={light ? white : teal} />
      {/* Deponent Hand on Book */}
      <rect x="28" y="10" width="12" height="16" rx="2" fill={light ? white : teal} transform="rotate(-15 34 18)" />

      {/* Commissioner (Right) */}
      <path 
        d="M75 65C75 55 80 45 85 45V30C85 25 80 20 75 20C70 20 65 25 65 30V45L55 40L52 50L65 55V65H75Z" 
        fill={light ? white : navy} 
      />
      
      {/* Document (Center) */}
      <rect x="42" y="35" width="16" height="22" rx="1" fill={light ? white : navy} stroke={light ? navy : white} strokeWidth="1" />
      <path d="M45 42H55M45 46H55M45 50H50" stroke={light ? navy : white} strokeWidth="1" strokeLinecap="round" />
      
      {/* Stamp (Right hand of commissioner) */}
      <path d="M54 52L50 62H60L56 52H54Z" fill={light ? white : teal} />
      <circle cx="55" cy="65" r="4" fill={light ? white : teal} />
    </svg>
  );

  const LogoMarkSimplified = () => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
       <circle cx="50" cy="50" r="48" stroke={light ? white : navy} strokeWidth="4" />
       <g transform="scale(0.7) translate(22, 22)">
          <path d="M10 75C10 75 30 85 50 85C70 85 90 75 90 75" stroke={light ? white : navy} strokeWidth="5" strokeLinecap="round" />
          <path d="M25 65C25 55 20 45 15 45V30C15 25 20 20 25 20C30 20 35 25 35 30V65H25Z" fill={light ? white : navy} />
          <path d="M75 65C75 55 80 45 85 45V30C85 25 80 20 75 20C70 20 65 25 65 30V65H75Z" fill={light ? white : navy} />
          <rect x="42" y="35" width="16" height="22" rx="1" fill={light ? white : navy} stroke={light ? navy : white} strokeWidth="1" />
          <circle cx="50" cy="65" r="5" fill={teal} />
       </g>
    </svg>
  );

  if (variant === 'glyph') {
    return (
      <div className={`aspect-square rounded-xl ${light ? 'bg-white' : 'bg-[#0D1B3D]'} p-1.5 flex items-center justify-center ${sizes[size]} ${className}`}>
        <LogoMarkSimplified />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizes[size]} aspect-square`}>
          <LogoMarkSimplified />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} aspect-square`}>
        <LogoMark />
      </div>
      <div className="flex flex-col">
        <span className={`font-display-legal font-black ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-5xl' : 'text-2xl'} tracking-tight ${light ? 'text-white' : 'text-[#0D1B3D]'}`}>
          WALAYI
        </span>
        {showSlogan && (
          <span className={`font-mono-code font-bold ${size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[10px]'} tracking-[0.2em] uppercase mt-0.5 ${light ? 'text-teal-100' : 'text-[#0097A7]'}`}>
            SWORN. WITNESSED. SEALED.
          </span>
        )}
      </div>
    </div>
  );
};
