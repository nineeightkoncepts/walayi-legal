import React from 'react';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';
import { AdService } from '../../services/adService';

interface SponsoredBadgeProps {
  userId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const SponsoredBadge: React.FC<SponsoredBadgeProps> = ({
  userId,
  className = '',
  size = 'sm'
}) => {
  const globalConfig = AdService.getGlobalConfig();
  if (globalConfig.globalKillSwitch || globalConfig.disableSponsoredProfessionals) {
    return null;
  }

  const allAds = AdService.getAllAdvertisements();
  const todayStr = new Date().toISOString().split('T')[0];

  const activeSponsored = allAds.find(a => 
    a.sponsoredProfessionalId === userId && 
    (a.status === 'LIVE' || a.status === 'APPROVED') &&
    a.startDate <= todayStr && 
    a.endDate >= todayStr &&
    (a.advertisementType === 'sponsored_professional' || a.advertisementType === 'featured_professional')
  );

  if (!activeSponsored) {
    return null;
  }

  const isFeatured = activeSponsored.advertisementType === 'featured_professional';

  if (isFeatured) {
    return (
      <span 
        className={`inline-flex items-center gap-1 font-mono-code font-bold rounded-lg border bg-purple-50 text-purple-800 border-purple-200 shadow-2xs ${
          size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
        } ${className}`}
        title="Featured Legal Practitioner (Paid Promotional Placement - Verification Independent)"
        id={`badge-featured-${userId}`}
      >
        <Sparkles className="w-2.5 h-2.5 text-purple-600" />
        <span>FEATURED</span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 font-mono-code font-bold rounded-lg border bg-amber-50 text-amber-900 border-amber-300 shadow-2xs ${
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
      } ${className}`}
      title="Sponsored Legal Practitioner (Paid Priority Listing - Verification Independent)"
      id={`badge-sponsored-${userId}`}
    >
      <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
      <span>SPONSORED</span>
    </span>
  );
};
