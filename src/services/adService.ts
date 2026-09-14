import { 
  Advertisement, 
  AdGlobalConfig, 
  AdMobConfig, 
  AdAuditLog, 
  AdPlacement, 
  AdAnalyticsSummary, 
  AdAuditAction 
} from '../types/advertising';
import { 
  INITIAL_AD_GLOBAL_CONFIG, 
  INITIAL_ADMOB_CONFIG, 
  INITIAL_ADVERTISEMENTS, 
  INITIAL_AD_AUDIT_LOGS 
} from '../data/mockAdsData';

const STORAGE_KEYS = {
  GLOBAL_CONFIG: 'wallahi_ad_global_config',
  ADMOB_CONFIG: 'wallahi_admob_config',
  ADVERTISEMENTS: 'wallahi_advertisements',
  AUDIT_LOGS: 'wallahi_ad_audit_logs'
};

/**
 * STRICTLY PROHIBITED ADVERTISEMENT LOCATIONS
 * Statutory & Trust Rules: Advertisements MUST NEVER appear on these workflows!
 */
export const STRICTLY_PROHIBITED_AD_LOCATIONS = [
  'identity_verification',
  'document_verification',
  'oath_taking',
  'oath_administration',
  'bible_quran_selection',
  'video_commissioning_session',
  'commissioner_signing',
  'electronic_signature',
  'digital_sealing',
  'annexure_commissioning',
  'document_generation',
  'final_authentication'
];

export class AdService {
  // Listeners for real-time reactivity across components
  private static listeners: Array<() => void> = [];

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyChange() {
    this.listeners.forEach(l => {
      try { l(); } catch (e) { console.error('AdService listener error', e); }
    });
  }

  // ==========================================
  // CONFIGURATION RETRIEVAL & PERSISTENCE
  // ==========================================

  static getGlobalConfig(): AdGlobalConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_CONFIG);
      if (stored) {
        return { ...INITIAL_AD_GLOBAL_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('AdService: Failed to read global ad config from storage, using defaults', e);
    }
    return INITIAL_AD_GLOBAL_CONFIG;
  }

  static saveGlobalConfig(
    config: Partial<AdGlobalConfig>, 
    adminEmail: string = 'admin@wallahi.ug', 
    adminName: string = 'Master Admin',
    auditReason?: string
  ): AdGlobalConfig {
    const current = this.getGlobalConfig();
    const updated: AdGlobalConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(updated));

    // Determine audit action
    let action: AdAuditAction = 'GLOBAL_KILL_SWITCH_TOGGLE';
    let details = 'Updated global advertising configuration.';

    if (config.globalKillSwitch !== undefined && config.globalKillSwitch !== current.globalKillSwitch) {
      action = 'GLOBAL_KILL_SWITCH_TOGGLE';
      details = config.globalKillSwitch 
        ? '⚠️ ACTIVATED GLOBAL KILL SWITCH: All advertising disabled immediately across entire platform.' 
        : 'Re-enabled global advertising system.';
    } else if (config.disableDirectAds !== undefined && config.disableDirectAds !== current.disableDirectAds) {
      action = 'DIRECT_ADS_TOGGLE';
      details = config.disableDirectAds ? 'Disabled WALAYI Direct Ads.' : 'Re-enabled WALAYI Direct Ads.';
    } else if (config.disableSponsoredProfessionals !== undefined && config.disableSponsoredProfessionals !== current.disableSponsoredProfessionals) {
      action = 'SPONSORED_PROS_TOGGLE';
      details = config.disableSponsoredProfessionals ? 'Disabled Sponsored Professional Listings.' : 'Re-enabled Sponsored Professional Listings.';
    } else if (config.disableAdMob !== undefined && config.disableAdMob !== current.disableAdMob) {
      action = 'ADMOB_TOGGLE';
      details = config.disableAdMob ? 'Disabled Google AdMob Programmatic Ads.' : 'Re-enabled Google AdMob Programmatic Ads.';
    } else if (config.disabledPlacements) {
      action = 'PLACEMENT_TOGGLE';
      details = `Updated placement whitelist/blacklist. Disabled: ${config.disabledPlacements.join(', ') || 'None'}`;
    }

    this.addAuditLog({
      adminEmail,
      adminName,
      action,
      reason: auditReason,
      details
    });

    this.notifyChange();
    return updated;
  }

  static getAdMobConfig(): AdMobConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADMOB_CONFIG);
      if (stored) {
        return { ...INITIAL_ADMOB_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('AdService: Failed to read AdMob config, using defaults', e);
    }
    return INITIAL_ADMOB_CONFIG;
  }

  static saveAdMobConfig(
    config: Partial<AdMobConfig>,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): AdMobConfig {
    const current = this.getAdMobConfig();
    const updated: AdMobConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    localStorage.setItem(STORAGE_KEYS.ADMOB_CONFIG, JSON.stringify(updated));

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'ADMOB_CONFIG_UPDATE',
      details: `Updated Google AdMob configuration (Enabled: ${updated.enabled}, TestMode: ${updated.testMode}, AppID: ${updated.appId}).`
    });

    this.notifyChange();
    return updated;
  }

  // ==========================================
  // ADVERTISEMENT REPOSITORY
  // ==========================================

  static getAllAdvertisements(): Advertisement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADVERTISEMENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('AdService: Failed to read ads from storage, using initial dataset', e);
    }
    return INITIAL_ADVERTISEMENTS;
  }

  private static saveAllAdvertisements(ads: Advertisement[]) {
    localStorage.setItem(STORAGE_KEYS.ADVERTISEMENTS, JSON.stringify(ads));
    this.notifyChange();
  }

  // ==========================================
  // DIRECT AD SERVING ENGINE
  // ==========================================

  /**
   * Conceptually requested method: getActiveAdvertisements(placement, userContext, currentDateTime)
   * Safely returns only eligible, non-prohibited, active ads.
   */
  static getActiveAdvertisements(
    placement: AdPlacement,
    userContext?: { role?: string; city?: string; isPro?: boolean },
    currentDateTime: Date = new Date()
  ): Advertisement[] {
    const globalConfig = this.getGlobalConfig();

    // 1. GLOBAL KILL SWITCH CHECK - Immediate exit if disabled
    if (globalConfig.globalKillSwitch) {
      return [];
    }

    // 2. DIRECT ADS TOGGLE CHECK
    if (globalConfig.disableDirectAds) {
      return [];
    }

    // 3. PLACEMENT TOGGLE CHECK
    if (globalConfig.disabledPlacements.includes(placement)) {
      return [];
    }

    const todayStr = currentDateTime.toISOString().split('T')[0];
    const allAds = this.getAllAdvertisements();

    const eligible = allAds.filter(ad => {
      // Must match requested placement
      if (ad.placement !== placement) return false;

      // Check sponsored professional toggle
      if (
        globalConfig.disableSponsoredProfessionals && 
        (ad.advertisementType === 'sponsored_professional' || ad.advertisementType === 'featured_professional')
      ) {
        return false;
      }

      // Status must be LIVE or APPROVED within scheduled window
      if (ad.status !== 'LIVE' && ad.status !== 'APPROVED') {
        return false;
      }

      // Schedule window check (inclusive)
      if (ad.startDate && ad.startDate > todayStr) return false;
      if (ad.endDate && ad.endDate < todayStr) return false;

      // Optional audience / location targeting
      if (userContext?.city && ad.targetLocation && ad.targetLocation !== 'All Uganda') {
        if (!ad.targetLocation.toLowerCase().includes(userContext.city.toLowerCase())) {
          // Allow loose match or fall through if general
        }
      }

      return true;
    });

    // Priority Sort: HIGH > MEDIUM > LOW, then random shuffle within priority
    return eligible.sort((a, b) => {
      const pScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const scoreDiff = pScore[b.priority] - pScore[a.priority];
      if (scoreDiff !== 0) return scoreDiff;
      return 0.5 - Math.random();
    });
  }

  // ==========================================
  // IMPRESSION & INTERACTION TRACKING
  // ==========================================

  static recordImpression(adId: string) {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (target) {
      target.impressions = (target.impressions || 0) + 1;
      target.updatedAt = new Date().toISOString();
      this.saveAllAdvertisements(ads);
    }
  }

  static recordClick(adId: string) {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (target) {
      target.clicks = (target.clicks || 0) + 1;
      target.updatedAt = new Date().toISOString();
      this.saveAllAdvertisements(ads);
    }
  }

  static recordLead(adId: string) {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (target) {
      target.leads = (target.leads || 0) + 1;
      target.updatedAt = new Date().toISOString();
      this.saveAllAdvertisements(ads);
    }
  }

  // ==========================================
  // CAMPAIGN LIFECYCLE MANAGEMENT (MASTER ADMIN)
  // ==========================================

  static createAd(
    adData: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'leads' | 'createdAt' | 'updatedAt'>,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): Advertisement {
    const ads = this.getAllAdvertisements();
    const newAd: Advertisement = {
      ...adData,
      id: `ad-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      impressions: 0,
      clicks: 0,
      leads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    ads.unshift(newAd);
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'CREATE',
      adId: newAd.id,
      campaignName: newAd.campaignName,
      newStatus: newAd.status,
      details: `Created new advertisement campaign "${newAd.campaignName}" for advertiser "${newAd.advertiserName}".`
    });

    return newAd;
  }

  static updateAd(
    adId: string,
    updates: Partial<Advertisement>,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): Advertisement | null {
    const ads = this.getAllAdvertisements();
    const index = ads.findIndex(a => a.id === adId);
    if (index === -1) return null;

    const prev = ads[index];
    const updated: Advertisement = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    ads[index] = updated;
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'EDIT',
      adId,
      campaignName: updated.campaignName,
      details: `Updated campaign details for "${updated.campaignName}".`
    });

    return updated;
  }

  static approveAd(
    adId: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    const prevStatus = target.status;
    const nowStr = new Date().toISOString().split('T')[0];
    const isLiveNow = target.startDate <= nowStr && target.endDate >= nowStr;
    
    target.status = isLiveNow ? 'LIVE' : 'APPROVED';
    target.approvedBy = adminEmail;
    target.updatedAt = new Date().toISOString();
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'APPROVE',
      adId,
      campaignName: target.campaignName,
      previousStatus: prevStatus,
      newStatus: target.status,
      details: `Approved campaign "${target.campaignName}". Status set to ${target.status}.`
    });

    return true;
  }

  static rejectAd(
    adId: string,
    reason: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    const prevStatus = target.status;
    target.status = 'REJECTED';
    target.rejectionReason = reason;
    target.updatedAt = new Date().toISOString();
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'REJECT',
      adId,
      campaignName: target.campaignName,
      previousStatus: prevStatus,
      newStatus: 'REJECTED',
      reason,
      details: `Rejected campaign "${target.campaignName}". Reason: ${reason}`
    });

    return true;
  }

  static suspendAd(
    adId: string,
    reason: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    const prevStatus = target.status;
    target.status = 'SUSPENDED';
    target.suspensionReason = reason;
    target.updatedAt = new Date().toISOString();
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'SUSPEND',
      adId,
      campaignName: target.campaignName,
      previousStatus: prevStatus,
      newStatus: 'SUSPENDED',
      reason,
      details: `Suspended campaign "${target.campaignName}". Reason: ${reason}`
    });

    return true;
  }

  static reactivateAd(
    adId: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    const prevStatus = target.status;
    const nowStr = new Date().toISOString().split('T')[0];
    const isLiveNow = target.startDate <= nowStr && target.endDate >= nowStr;
    
    target.status = isLiveNow ? 'LIVE' : 'APPROVED';
    target.suspensionReason = undefined;
    target.updatedAt = new Date().toISOString();
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'REACTIVATE',
      adId,
      campaignName: target.campaignName,
      previousStatus: prevStatus,
      newStatus: target.status,
      details: `Reactivated campaign "${target.campaignName}". Status set to ${target.status}.`
    });

    return true;
  }

  static scheduleAd(
    adId: string,
    startDate: string,
    endDate: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    const ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    target.startDate = startDate;
    target.endDate = endDate;
    const nowStr = new Date().toISOString().split('T')[0];
    if (startDate <= nowStr && endDate >= nowStr && (target.status === 'APPROVED' || target.status === 'SCHEDULED')) {
      target.status = 'LIVE';
    } else if (startDate > nowStr && target.status === 'APPROVED') {
      target.status = 'SCHEDULED';
    }
    target.updatedAt = new Date().toISOString();
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'SCHEDULE',
      adId,
      campaignName: target.campaignName,
      details: `Scheduled campaign "${target.campaignName}" from ${startDate} to ${endDate}.`
    });

    return true;
  }

  static deleteAd(
    adId: string,
    adminEmail: string = 'admin@wallahi.ug',
    adminName: string = 'Master Admin'
  ): boolean {
    let ads = this.getAllAdvertisements();
    const target = ads.find(a => a.id === adId);
    if (!target) return false;

    ads = ads.filter(a => a.id !== adId);
    this.saveAllAdvertisements(ads);

    this.addAuditLog({
      adminEmail,
      adminName,
      action: 'DELETE',
      adId,
      campaignName: target.campaignName,
      details: `Deleted campaign "${target.campaignName}" from the platform.`
    });

    return true;
  }

  // ==========================================
  // AUDIT LOGS REPOSITORY
  // ==========================================

  static getAuditLogs(): AdAuditLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('AdService: Failed to read audit logs, using initial', e);
    }
    return INITIAL_AD_AUDIT_LOGS;
  }

  static addAuditLog(log: Omit<AdAuditLog, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newLog: AdAuditLog = {
      ...log,
      id: `ad-log-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 150)));
  }

  // ==========================================
  // ANALYTICS & REVENUE CALCULATOR
  // ==========================================

  static getAnalyticsSummary(): AdAnalyticsSummary {
    const ads = this.getAllAdvertisements();
    const admob = this.getAdMobConfig();

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalLeads = 0;
    let directAdRevenueUGX = 0;

    let activeCampaignsCount = 0;
    let expiredCampaignsCount = 0;
    let pendingReviewCount = 0;
    let suspendedCount = 0;
    let sponsoredProsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    ads.forEach(ad => {
      totalImpressions += (ad.impressions || 0);
      totalClicks += (ad.clicks || 0);
      totalLeads += (ad.leads || 0);
      directAdRevenueUGX += (ad.spentUGX || 0);

      if (ad.status === 'LIVE') activeCampaignsCount++;
      if (ad.status === 'PENDING_REVIEW') pendingReviewCount++;
      if (ad.status === 'SUSPENDED') suspendedCount++;
      if (ad.status === 'EXPIRED' || (ad.endDate && ad.endDate < todayStr)) expiredCampaignsCount++;
      if (ad.advertisementType === 'sponsored_professional' || ad.advertisementType === 'featured_professional') {
        sponsoredProsCount++;
      }
    });

    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;

    return {
      totalImpressions,
      totalClicks,
      totalLeads,
      avgCtr: Number(avgCtr.toFixed(2)),
      directAdRevenueUGX,
      admobRevenueUSD: admob.estimatedRevenueUSD || 0,
      activeCampaignsCount,
      expiredCampaignsCount,
      pendingReviewCount,
      suspendedCount,
      sponsoredProsCount
    };
  }

  static resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ADMOB_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ADVERTISEMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.notifyChange();
  }
}
