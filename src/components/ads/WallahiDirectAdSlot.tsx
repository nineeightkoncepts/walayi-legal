import React, { useEffect, useState, useRef } from 'react';
import { AdPlacement, Advertisement } from '../../types/advertising';
import { AdService } from '../../services/adService';
import { ExternalLink, Sparkles, BookOpen, Building, ShieldCheck, Tag } from 'lucide-react';

interface WallahiDirectAdSlotProps {
  placement: AdPlacement;
  variant?: 'banner' | 'native' | 'card' | 'inline' | 'compact';
  userContext?: { role?: string; city?: string; isPro?: boolean };
  className?: string;
  onLeadCaptured?: (ad: Advertisement) => void;
}

export const WallahiDirectAdSlot: React.FC<WallahiDirectAdSlotProps> = ({
  placement,
  variant = 'banner',
  userContext,
  className = '',
  onLeadCaptured
}) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const impressionRecordedRef = useRef<string | null>(null);

  const fetchCurrentAd = () => {
    const activeAds = AdService.getActiveAdvertisements(placement, userContext);
    if (activeAds && activeAds.length > 0) {
      setAd(activeAds[0]);
    } else {
      setAd(null);
    }
  };

  useEffect(() => {
    fetchCurrentAd();
    const unsubscribe = AdService.subscribe(() => {
      fetchCurrentAd();
    });
    return () => unsubscribe();
  }, [placement, JSON.stringify(userContext)]);

  useEffect(() => {
    if (ad && impressionRecordedRef.current !== ad.id) {
      impressionRecordedRef.current = ad.id;
      AdService.recordImpression(ad.id);
    }
  }, [ad?.id]);

  if (!ad) {
    return null; // Graceful non-blocking empty state
  }

  const handleClick = (e: React.MouseEvent) => {
    AdService.recordClick(ad.id);
    if (onLeadCaptured) {
      onLeadCaptured(ad);
    }
  };

  const getBadgeLabel = () => {
    switch (ad.advertisementType) {
      case 'house_ad':
        return { label: 'WALAYI OFFICIAL', icon: Sparkles, bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'sponsored_cle':
        return { label: 'SPONSORED CLE', icon: BookOpen, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'sponsored_service':
        return { label: 'LEGAL SERVICE SPONSOR', icon: Building, bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'sponsored_professional':
        return { label: 'SPONSORED PRACTITIONER', icon: ShieldCheck, bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'featured_professional':
        return { label: 'FEATURED PRACTITIONER', icon: ShieldCheck, bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'institutional_campaign':
        return { label: 'INSTITUTIONAL ANNOUNCEMENT', icon: Building, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      default:
        return { label: 'ADVERTISEMENT', icon: Tag, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badgeInfo = getBadgeLabel();
  const BadgeIcon = badgeInfo.icon;

  // 1. COMPACT / INLINE VARIANT
  if (variant === 'compact') {
    return (
      <div 
        className={`p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all ${className}`}
        id={`direct-ad-${ad.id}-compact`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono-code font-bold border flex items-center gap-1 ${badgeInfo.bg}`}>
            <BadgeIcon className="w-2.5 h-2.5" />
            {badgeInfo.label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono-code truncate">{ad.advertiserName}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-900 truncate">{ad.headline}</h4>
            <p className="text-[11px] text-slate-500 line-clamp-1">{ad.description}</p>
          </div>
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-colors shrink-0"
            id={`btn-ad-cta-${ad.id}`}
          >
            <span>{ad.callToAction || 'View'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // 2. NATIVE / CARD VARIANT
  if (variant === 'native' || variant === 'card') {
    return (
      <div 
        className={`p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${className}`}
        id={`direct-ad-${ad.id}-card`}
      >
        <div className="space-y-3">
          {/* Header Strip with unambiguous labeling */}
          <div className="flex items-center justify-between gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono-code font-bold border flex items-center gap-1.5 ${badgeInfo.bg}`}>
              <BadgeIcon className="w-3 h-3" />
              {badgeInfo.label}
            </span>
            <span className="text-[11px] text-slate-400 font-mono-code">
              By {ad.advertiserName}
            </span>
          </div>

          {/* Optional Creative Image */}
          {ad.imageUrl && ad.imageUrl.trim().length > 0 && (
            <div className="h-36 w-full rounded-2xl overflow-hidden bg-slate-100 relative">
              <img 
                src={ad.imageUrl} 
                alt={ad.headline} 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-display-legal font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
              {ad.headline}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ad.description}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-400 font-mono-code">
            {ad.targetLocation ? `Target: ${ad.targetLocation}` : 'Verified Partner'}
          </div>
          
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            id={`btn-ad-cta-${ad.id}`}
          >
            <span>{ad.callToAction || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. FULL BANNER VARIANT (DEFAULT)
  return (
    <div 
      className={`p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md relative overflow-hidden group transition-all ${className}`}
      id={`direct-ad-${ad.id}-banner`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        
        {/* Creative Thumbnail if present */}
        {ad.imageUrl && ad.imageUrl.trim().length > 0 && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img 
              src={ad.imageUrl} 
              alt={ad.headline} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          {/* Unambiguous Label Strip */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono-code font-extrabold uppercase border flex items-center gap-1 ${badgeInfo.bg}`}>
              <BadgeIcon className="w-2.5 h-2.5" />
              {badgeInfo.label}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">
              {ad.advertiserName}
            </span>
          </div>

          <h3 className="font-display-legal font-bold text-sm sm:text-base text-white">
            {ad.headline}
          </h3>

          <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
            {ad.description}
          </p>
        </div>

        {/* CTA Button */}
        <div className="w-full md:w-auto shrink-0 flex items-center gap-2 pt-2 md:pt-0">
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            id={`btn-ad-cta-${ad.id}`}
          >
            <span>{ad.callToAction || 'Explore'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
