import React, { useEffect, useState } from 'react';
import { AdPlacement } from '../../types/advertising';
import { AdMobService } from '../../services/adMobService';
import { AdService } from '../../services/adService';
import { Sparkles, ExternalLink, Info } from 'lucide-react';

interface GoogleAdMobSlotProps {
  placement: AdPlacement;
  format?: 'banner' | 'native';
  className?: string;
}

export const GoogleAdMobSlot: React.FC<GoogleAdMobSlotProps> = ({
  placement,
  format = 'banner',
  className = ''
}) => {
  const [isAllowed, setIsAllowed] = useState(false);
  const [admobConfig, setAdmobConfig] = useState(AdService.getAdMobConfig());

  const checkAllowed = () => {
    const allowed = AdMobService.isAdMobAllowed(placement);
    setIsAllowed(allowed);
    setAdmobConfig(AdService.getAdMobConfig());
  };

  useEffect(() => {
    checkAllowed();
    const unsubscribe = AdService.subscribe(() => {
      checkAllowed();
    });
    return () => unsubscribe();
  }, [placement]);

  useEffect(() => {
    if (isAllowed) {
      AdMobService.recordAdMobTestImpression();
    }
  }, [isAllowed]);

  if (!isAllowed) {
    return null;
  }

  const handleTestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    AdMobService.recordAdMobTestClick();
  };

  const adUnitId = format === 'native' ? admobConfig.nativeAdUnitId : admobConfig.bannerAdUnitId;

  if (format === 'native') {
    return (
      <div 
        className={`p-4 rounded-3xl bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all ${className}`}
        id={`admob-native-slot-${placement}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono-code font-bold text-[9px] uppercase tracking-wider">
              GOOGLE ADMOB TEST AD
            </span>
            <span className="text-[10px] text-slate-400 font-mono-code">Programmatic</span>
          </div>
          <span className="text-[9px] font-mono-code text-slate-400 truncate max-w-[140px] sm:max-w-none">
            Unit: {adUnitId}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-slate-900 leading-snug">
              Official Google AdMob Programmatic Ad Network
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
              Google AdMob connects verified advertisers worldwide. Test ad rendered in developer mode for verification.
            </p>
          </div>

          <button
            onClick={handleTestClick}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            id="btn-admob-test-action"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </button>
        </div>
      </div>
    );
  }

  // Banner Format (Standard 320x50 / 728x90 responsive)
  return (
    <div 
      className={`p-3 rounded-2xl bg-slate-100 border border-slate-300/80 text-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shadow-2xs ${className}`}
      id={`admob-banner-slot-${placement}`}
    >
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-mono-code font-bold text-[9px] border border-amber-300 uppercase">
          GOOGLE ADMOB
        </span>
        <span className="font-semibold text-slate-900 text-xs">
          Google Programmatic Advertising Partner
        </span>
        <span className="hidden md:inline text-[10px] text-slate-500 font-mono-code">
          ({admobConfig.testMode ? 'Test Mode Active' : 'Live AdUnit'})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono-code text-slate-500">
          ID: {adUnitId.slice(-10)}
        </span>
        <button
          onClick={handleTestClick}
          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
          id="btn-admob-banner-click"
        >
          Test Ad
        </button>
      </div>
    </div>
  );
};
