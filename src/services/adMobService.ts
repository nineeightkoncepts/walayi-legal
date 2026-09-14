import { AdMobConfig, AdPlacement } from '../types/advertising';
import { AdService, STRICTLY_PROHIBITED_AD_LOCATIONS } from './adService';

/**
 * Google AdMob Integration Service
 * 
 * Technically separate from WALAYI Direct Ads.
 * Programmatic ad rendering layer with strict verification safeguards.
 */
export class AdMobService {
  /**
   * Evaluates whether AdMob ads are permitted to display for a given placement.
   */
  static isAdMobAllowed(placement: AdPlacement): boolean {
    const globalConfig = AdService.getGlobalConfig();
    
    // 1. Global Kill Switch check
    if (globalConfig.globalKillSwitch) return false;

    // 2. AdMob specific disable switch
    if (globalConfig.disableAdMob) return false;

    // 3. Check against strictly prohibited legal workflows
    if (STRICTLY_PROHIBITED_AD_LOCATIONS.includes(placement as any)) {
      return false;
    }

    const admobConfig = AdService.getAdMobConfig();
    if (!admobConfig.enabled) return false;

    if (!admobConfig.allowedPlacements.includes(placement)) {
      return false;
    }

    return true;
  }

  /**
   * Tracks AdMob test impressions for local development / testing analytics.
   */
  static recordAdMobTestImpression() {
    const config = AdService.getAdMobConfig();
    const updated: Partial<AdMobConfig> = {
      testImpressions: (config.testImpressions || 0) + 1,
      estimatedRevenueUSD: Number(((config.estimatedRevenueUSD || 0) + 0.02).toFixed(2))
    };
    AdService.saveAdMobConfig(updated);
  }

  /**
   * Tracks AdMob test clicks.
   */
  static recordAdMobTestClick() {
    const config = AdService.getAdMobConfig();
    const updated: Partial<AdMobConfig> = {
      testClicks: (config.testClicks || 0) + 1,
      estimatedRevenueUSD: Number(((config.estimatedRevenueUSD || 0) + 0.15).toFixed(2))
    };
    AdService.saveAdMobConfig(updated);
  }
}
