export type AdvertisementType = 
  | 'banner'
  | 'native'
  | 'sponsored_professional'
  | 'featured_professional'
  | 'sponsored_service'
  | 'sponsored_cle'
  | 'institutional_campaign'
  | 'house_ad';

export type CreativeType = 'image' | 'video';

export type AdPlacement = 
  | 'home_dashboard'
  | 'marketplace'
  | 'commissioner_search'
  | 'professional_directory'
  | 'legal_services'
  | 'educational_content'
  | 'completion_success';

export type AdStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'EXPIRED'
  | 'REJECTED'
  | 'SUSPENDED';

export type AdPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Advertisement {
  id: string;
  advertiserName: string;
  campaignName: string;
  advertisementType: AdvertisementType;
  creativeType: CreativeType;
  imageUrl?: string;
  videoUrl?: string;
  headline: string;
  description: string;
  callToAction: string;
  destinationUrl: string;
  placement: AdPlacement;
  targetAudience?: string; // e.g. "All Deponents", "Commercial Advocates", "Corporates"
  targetProfession?: string;
  targetLocation?: string; // e.g. "Kampala", "All Uganda", "Jinja", "Mbarara"
  priority: AdPriority;
  status: AdStatus;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string; // ISO string YYYY-MM-DD
  impressions: number;
  clicks: number;
  leads: number;
  sponsoredProfessionalId?: string; // Links to UserProfile.id if sponsored pro
  budgetUGX?: number;
  spentUGX?: number;
  createdBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdGlobalConfig {
  globalKillSwitch: boolean; // "DISABLE ALL ADVERTISEMENTS"
  disableDirectAds: boolean;
  disableSponsoredProfessionals: boolean;
  disableAdMob: boolean;
  disabledPlacements: AdPlacement[];
  updatedAt: string;
  updatedBy: string;
}

export interface AdMobConfig {
  enabled: boolean;
  appId: string;
  testMode: boolean;
  bannerAdUnitId: string;
  nativeAdUnitId: string;
  interstitialAdUnitId: string;
  allowedPlacements: AdPlacement[];
  testImpressions: number;
  testClicks: number;
  estimatedRevenueUSD: number;
  updatedAt: string;
  updatedBy: string;
}

export type AdAuditAction = 
  | 'CREATE'
  | 'EDIT'
  | 'SUBMIT_REVIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'SCHEDULE'
  | 'DELETE'
  | 'GLOBAL_KILL_SWITCH_TOGGLE'
  | 'DIRECT_ADS_TOGGLE'
  | 'SPONSORED_PROS_TOGGLE'
  | 'ADMOB_TOGGLE'
  | 'PLACEMENT_TOGGLE'
  | 'ADMOB_CONFIG_UPDATE';

export interface AdAuditLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: AdAuditAction;
  adId?: string;
  campaignName?: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  details: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AdAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
  avgCtr: number;
  directAdRevenueUGX: number;
  admobRevenueUSD: number;
  activeCampaignsCount: number;
  expiredCampaignsCount: number;
  pendingReviewCount: number;
  suspendedCount: number;
  sponsoredProsCount: number;
}
