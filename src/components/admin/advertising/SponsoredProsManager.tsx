import React, { useState } from 'react';
import { Advertisement } from '../../../types/advertising';
import { UserProfile } from '../../../types';
import { UserAvatar } from '../../common/UserAvatar';
import { AdService } from '../../../services/adService';
import { useApp } from '../../../context/AppContext';
import { 
  ShieldCheck, 
  Sparkles, 
  Star, 
  Plus, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Award,
  AlertCircle,
  Eye,
  MousePointer,
  ArrowRight
} from 'lucide-react';

interface SponsoredProsManagerProps {
  campaigns: Advertisement[];
  onOpenCreateAd: (initialData?: Partial<Advertisement>) => void;
  onRefresh: () => void;
}

export const SponsoredProsManager: React.FC<SponsoredProsManagerProps> = ({
  campaigns,
  onOpenCreateAd,
  onRefresh
}) => {
  const { users } = useApp();

  // Find all verified professionals
  const verifiedPros = users.filter(u => 
    u.authorities && u.authorities.some(a => a.status === 'VERIFIED')
  );

  // Sponsored and Featured campaigns
  const sponsoredAds = campaigns.filter(c => 
    c.advertisementType === 'sponsored_professional' || c.advertisementType === 'featured_professional'
  );

  const activeSponsoredProIds = new Set(
    sponsoredAds
      .filter(a => a.status === 'LIVE' || a.status === 'APPROVED')
      .map(a => a.sponsoredProfessionalId)
  );

  return (
    <div className="space-y-6" id="sponsored-pros-manager-root">
      
      {/* Overview Banner */}
      <div className="p-5 rounded-3xl bg-indigo-900 text-white border border-indigo-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-[10px] font-mono-code font-bold uppercase border border-indigo-400/30">
              MARKETPLACE RANKING & SPONSORSHIPS
            </span>
          </div>
          <h3 className="text-lg font-display-legal font-bold">
            Sponsored & Featured Legal Practitioner Rankings
          </h3>
          <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
            Promote verified Commissioners for Oaths and Notaries Public in the marketplace. Statutory verification is strictly mandatory before any professional may be sponsored.
          </p>
        </div>

        <button
          onClick={() => onOpenCreateAd({
            advertisementType: 'sponsored_professional',
            placement: 'marketplace',
            priority: 'HIGH'
          })}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 transition-colors cursor-pointer"
          id="btn-new-sponsored-pro"
        >
          <Plus className="w-4 h-4" />
          <span>New Sponsored Ranking</span>
        </button>
      </div>

      {/* Grid of Verified Practitioners and their Sponsorship Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifiedPros.map((pro) => {
          const activeCampaign = sponsoredAds.find(
            a => a.sponsoredProfessionalId === pro.id && (a.status === 'LIVE' || a.status === 'APPROVED')
          );
          const isSponsored = Boolean(activeCampaign);
          const isFeatured = activeCampaign?.advertisementType === 'featured_professional';

          return (
            <div 
              key={pro.id}
              className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                isSponsored 
                  ? 'border-indigo-300 shadow-md ring-2 ring-indigo-500/10' 
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
              id={`pro-sponsor-card-${pro.id}`}
            >
              <div className="space-y-3">
                
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      src={pro.avatarUrl || null} 
                      name={pro.fullName}
                      size="lg" 
                      className="border border-slate-200 shadow-2xs" 
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{pro.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono-code capitalize">{pro.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isSponsored ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono-code font-bold uppercase border flex items-center gap-1 ${
                      isFeatured 
                        ? 'bg-purple-100 text-purple-900 border-purple-300' 
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {isFeatured ? <Sparkles className="w-2.5 h-2.5 text-purple-600" /> : <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />}
                      {isFeatured ? 'FEATURED' : 'SPONSORED'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono-code bg-slate-100 text-slate-600 border border-slate-200">
                      Standard
                    </span>
                  )}
                </div>

                {/* Practitioner Info */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Station / City:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {pro.stationCity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Statutory Commission:</span>
                    <span className="font-mono-code text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Completed Acts:</span>
                    <span className="font-mono-code text-slate-800 font-bold">{pro.completedCeremoniesCount} oaths</span>
                  </div>
                </div>

                {/* Campaign metrics if sponsored */}
                {activeCampaign && (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs font-mono-code">
                    <div className="text-[10px] text-indigo-900 font-bold flex items-center justify-between">
                      <span>Live Campaign:</span>
                      <span className="text-emerald-700">{activeCampaign.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-indigo-800">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {activeCampaign.impressions} views</span>
                      <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> {activeCampaign.clicks} clicks</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Valid: {activeCampaign.startDate} to {activeCampaign.endDate}
                    </div>
                  </div>
                )}

              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {isSponsored && activeCampaign ? (
                  <button
                    onClick={() => onOpenCreateAd(activeCampaign)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    id={`btn-edit-pro-sponsor-${pro.id}`}
                  >
                    <span>Manage Promotion</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenCreateAd({
                      advertiserName: pro.fullName,
                      campaignName: `Sponsored Listing - ${pro.fullName}`,
                      advertisementType: 'sponsored_professional',
                      placement: 'marketplace',
                      headline: `${pro.fullName} — Certified ${pro.role.toUpperCase()}`,
                      description: `High Court licensed legal practitioner based in ${pro.stationCity}. Instant remote oath appointments.`,
                      callToAction: 'Book Commissioner',
                      destinationUrl: `https://wallahi.ug/marketplace?pro=${pro.id}`,
                      sponsoredProfessionalId: pro.id,
                      targetLocation: pro.stationCity,
                      priority: 'HIGH',
                      status: 'LIVE'
                    })}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    id={`btn-sponsor-pro-${pro.id}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Promote This Practitioner</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
