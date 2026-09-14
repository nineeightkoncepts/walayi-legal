import React, { useState } from 'react';
import { AdMobConfig, AdPlacement } from '../../../types/advertising';
import { AdService } from '../../../services/adService';
import { useApp } from '../../../context/AppContext';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  DollarSign, 
  Eye, 
  MousePointer,
  Lock,
  Layers,
  Save
} from 'lucide-react';

interface AdMobConfigPanelProps {
  onRefresh: () => void;
}

export const AdMobConfigPanel: React.FC<AdMobConfigPanelProps> = ({ onRefresh }) => {
  const { currentUser } = useApp();
  const [config, setConfig] = useState<AdMobConfig>(AdService.getAdMobConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleEnabled = (enabled: boolean) => {
    const updated = AdService.saveAdMobConfig({ enabled }, currentUser.email, currentUser.fullName);
    setConfig(updated);
    onRefresh();
  };

  const handleToggleTestMode = (testMode: boolean) => {
    const updated = AdService.saveAdMobConfig({ testMode }, currentUser.email, currentUser.fullName);
    setConfig(updated);
    onRefresh();
  };

  const handlePlacementToggle = (p: AdPlacement) => {
    let allowed = [...config.allowedPlacements];
    if (allowed.includes(p)) {
      allowed = allowed.filter(x => x !== p);
    } else {
      allowed.push(p);
    }
    const updated = AdService.saveAdMobConfig({ allowedPlacements: allowed }, currentUser.email, currentUser.fullName);
    setConfig(updated);
    onRefresh();
  };

  const handleSaveIds = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AdService.saveAdMobConfig(
      {
        appId: config.appId,
        bannerAdUnitId: config.bannerAdUnitId,
        nativeAdUnitId: config.nativeAdUnitId,
        interstitialAdUnitId: config.interstitialAdUnitId
      },
      currentUser.email,
      currentUser.fullName
    );
    setConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  const allAvailablePlacements: { id: AdPlacement; label: string; prohibited?: boolean }[] = [
    { id: 'home_dashboard', label: 'Home Dashboard (Discovery)' },
    { id: 'marketplace', label: 'Marketplace (Practitioner Search)' },
    { id: 'legal_services', label: 'Legal & Ancillary Services' },
    { id: 'educational_content', label: 'Educational / CLE Content' },
    { id: 'completion_success', label: 'Completion / Success Screen' }
  ];

  return (
    <div className="space-y-6" id="admob-config-panel-root">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono-code font-bold uppercase border border-amber-500/30">
              PROGRAMMATIC ADVERTISING ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono-code">Separate Subsystem</span>
          </div>
          <h3 className="text-lg font-display-legal font-bold">
            Google AdMob Integration & Ad Unit Controls
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Google AdMob delivers programmatic banner and native ads. This integration is architecturally isolated from WALAYI Direct Ads and strictly blocked from core commissioning steps.
          </p>
        </div>

        {/* Global AdMob Switch */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-800 p-2.5 rounded-2xl border border-slate-700">
          <span className="text-xs font-semibold text-slate-300">AdMob System:</span>
          <button
            onClick={() => handleToggleEnabled(!config.enabled)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              config.enabled 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-red-600/80 text-white'
            }`}
            id="btn-toggle-admob-enabled"
          >
            {config.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code mb-1">
            <span>AdMob Impressions</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {config.testImpressions.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono-code mt-1">
            Programmatic views served
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code mb-1">
            <span>AdMob Clicks</span>
            <MousePointer className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {config.testClicks.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono-code mt-1">
            CTR: {config.testImpressions > 0 ? ((config.testClicks / config.testImpressions) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code mb-1">
            <span>Estimated AdMob Rev</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            ${config.estimatedRevenueUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono-code mt-1">
            Net programmatic eCPM payout
          </div>
        </div>
      </div>

      {/* Ad Unit & App ID Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900">AdMob App ID & Ad Unit Credentials</h4>
            <p className="text-xs text-slate-500">Configure real production IDs or use standard Google Test IDs for sandbox verification.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Test Mode (Sandbox):</span>
            <button
              type="button"
              onClick={() => handleToggleTestMode(!config.testMode)}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                config.testMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
              id="btn-toggle-admob-testmode"
            >
              {config.testMode ? 'TEST MODE ACTIVE' : 'LIVE PRODUCTION'}
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>AdMob credentials successfully updated.</span>
          </div>
        )}

        <form onSubmit={handleSaveIds} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AdMob App ID *
              </label>
              <input
                type="text"
                required
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="input-admob-appid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banner Ad Unit ID *
              </label>
              <input
                type="text"
                required
                value={config.bannerAdUnitId}
                onChange={(e) => setConfig({ ...config, bannerAdUnitId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="input-admob-bannerid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Native Advanced Ad Unit ID *
              </label>
              <input
                type="text"
                required
                value={config.nativeAdUnitId}
                onChange={(e) => setConfig({ ...config, nativeAdUnitId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="input-admob-nativeid"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interstitial Ad Unit ID *
              </label>
              <input
                type="text"
                required
                value={config.interstitialAdUnitId}
                onChange={(e) => setConfig({ ...config, interstitialAdUnitId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="input-admob-interstitialid"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              id="btn-save-admob-config"
            >
              <Save className="w-4 h-4" />
              <span>Save AdMob Credentials</span>
            </button>
          </div>
        </form>

        {/* Permitted Placement Whitelist */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-bold text-xs text-slate-900 uppercase font-mono-code">
            Permitted AdMob Placements Whitelist
          </h4>
          <p className="text-xs text-slate-500">
            Check the slots where AdMob programmatic ads are authorized to appear. Prohibited commissioning rooms are hardcoded blocked.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allAvailablePlacements.map((p) => {
              const isChecked = config.allowedPlacements.includes(p.id);
              return (
                <label 
                  key={p.id} 
                  className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50/60 border-blue-300 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handlePlacementToggle(p.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold">{p.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Statutory Prohibition Reminder */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            Statutory Commissioning Prohibition Protection
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Even if AdMob is globally enabled, the WALAYI system enforces a hardcoded block on oath administration, video commissioning, electronic signing, biometric NIN checking, and digital stamping screens.
          </p>
        </div>

      </div>

    </div>
  );
};
