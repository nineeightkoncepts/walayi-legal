import React, { useState, useEffect } from 'react';
import { 
  Advertisement, 
  AdGlobalConfig, 
  AdMobConfig, 
  AdAnalyticsSummary, 
  AdAuditLog, 
  AdPlacement 
} from '../../types/advertising';
import { AdService } from '../../services/adService';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  AlertOctagon, 
  Power, 
  Layers, 
  Users, 
  DollarSign, 
  BarChart3, 
  ShieldAlert, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Settings2,
  FileCheck,
  Building,
  Smartphone,
  History
} from 'lucide-react';
import { CampaignListTable } from './advertising/CampaignListTable';
import { CreateAdModal } from './advertising/CreateAdModal';
import { SponsoredProsManager } from './advertising/SponsoredProsManager';
import { AdMobConfigPanel } from './advertising/AdMobConfigPanel';
import { AdAnalyticsView } from './advertising/AdAnalyticsView';
import { AdAuditLogTable } from './advertising/AdAuditLogTable';

type AdSubTab = 'CAMPAIGNS' | 'SPONSORED_PROS' | 'ADMOB' | 'ANALYTICS' | 'AUDIT_LOGS';

export const AdvertisingSection: React.FC = () => {
  const { currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<AdSubTab>('CAMPAIGNS');
  const [globalConfig, setGlobalConfig] = useState<AdGlobalConfig>(AdService.getGlobalConfig());
  const [campaigns, setCampaigns] = useState<Advertisement[]>(AdService.getAllAdvertisements());
  const [analytics, setAnalytics] = useState<AdAnalyticsSummary>(AdService.getAnalyticsSummary());
  const [auditLogs, setAuditLogs] = useState<AdAuditLog[]>(AdService.getAuditLogs());

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const refreshAll = () => {
    setGlobalConfig(AdService.getGlobalConfig());
    setCampaigns(AdService.getAllAdvertisements());
    setAnalytics(AdService.getAnalyticsSummary());
    setAuditLogs(AdService.getAuditLogs());
  };

  useEffect(() => {
    refreshAll();
    const unsubscribe = AdService.subscribe(() => {
      refreshAll();
    });
    return () => unsubscribe();
  }, []);

  // Handler for Global Kill Switch
  const handleToggleGlobalKillSwitch = () => {
    const newState = !globalConfig.globalKillSwitch;
    AdService.saveGlobalConfig(
      { globalKillSwitch: newState },
      currentUser.email,
      currentUser.fullName,
      newState ? 'Emergency shutdown of all commercial placements' : 'Restored standard commercial operation'
    );
  };

  // Handler for Direct Ads
  const handleToggleDirectAds = () => {
    const newState = !globalConfig.disableDirectAds;
    AdService.saveGlobalConfig(
      { disableDirectAds: newState },
      currentUser.email,
      currentUser.fullName
    );
  };

  // Handler for Sponsored Pros
  const handleToggleSponsoredPros = () => {
    const newState = !globalConfig.disableSponsoredProfessionals;
    AdService.saveGlobalConfig(
      { disableSponsoredProfessionals: newState },
      currentUser.email,
      currentUser.fullName
    );
  };

  // Handler for AdMob
  const handleToggleAdMob = () => {
    const newState = !globalConfig.disableAdMob;
    AdService.saveGlobalConfig(
      { disableAdMob: newState },
      currentUser.email,
      currentUser.fullName
    );
  };

  // Handler for Granular Placement Blacklist
  const handleTogglePlacement = (placement: AdPlacement) => {
    let disabled = [...globalConfig.disabledPlacements];
    if (disabled.includes(placement)) {
      disabled = disabled.filter(p => p !== placement);
    } else {
      disabled.push(placement);
    }
    AdService.saveGlobalConfig(
      { disabledPlacements: disabled },
      currentUser.email,
      currentUser.fullName
    );
  };

  const placementsList: { id: AdPlacement; label: string }[] = [
    { id: 'home_dashboard', label: 'Home Dashboard' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'commissioner_search', label: 'Commissioner Search' },
    { id: 'professional_directory', label: 'Professional Directory' },
    { id: 'legal_services', label: 'Legal Services' },
    { id: 'educational_content', label: 'Educational / CLE' },
    { id: 'completion_success', label: 'Completion / Success' }
  ];

  return (
    <div className="space-y-6" id="wallahi-advertising-section-root">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-code font-bold bg-blue-600 text-white uppercase tracking-wider">
              WALAYI COMMERCIAL ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono-code">Master Admin Subsystem</span>
          </div>
          <h2 className="text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Advertising & Commercialisation Control Centre
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage WALAYI Direct Ads, sponsored professional rankings, Google AdMob programmatic ads, and emergency kill switches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingAd(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            id="btn-create-campaign-top"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* EMERGENCY KILL SWITCH & GRANULAR TOGGLES BAR */}
      <div className={`p-6 rounded-3xl border transition-all ${
        globalConfig.globalKillSwitch 
          ? 'bg-red-500/10 border-red-500 text-red-950 shadow-md ring-2 ring-red-500/20' 
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        
        {/* Global Master Switch */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Power className={`w-5 h-5 ${globalConfig.globalKillSwitch ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
              <h3 className="font-display-legal font-bold text-base text-slate-900">
                Global Advertising Kill Switch
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Instantly terminates ALL advertisements (Direct, Sponsored Practitioners, and AdMob) across the entire platform in a single click with zero lag.
            </p>
          </div>

          <button
            onClick={handleToggleGlobalKillSwitch}
            className={`px-6 py-3 rounded-2xl font-bold text-xs font-mono-code uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              globalConfig.globalKillSwitch
                ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce ring-4 ring-red-300'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            id="btn-global-kill-switch"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{globalConfig.globalKillSwitch ? 'KILL SWITCH ACTIVE (ADS OFF)' : 'ACTIVATE KILL SWITCH'}</span>
          </button>
        </div>

        {/* Granular Subsystem Toggles */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono-code">
              Subsystem Channel Toggles
            </h4>
            <span className="text-[11px] text-slate-500">Individual channel controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Direct Ads Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-slate-900">Channel A: Direct Ads</div>
                <div className="text-[10px] text-slate-500 font-mono-code">Banners, CLE, Services</div>
              </div>
              <button
                onClick={handleToggleDirectAds}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  !globalConfig.disableDirectAds ? 'bg-emerald-600 text-white' : 'bg-red-200 text-red-900'
                }`}
                id="toggle-direct-ads"
              >
                {!globalConfig.disableDirectAds ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            {/* Sponsored Pros Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-slate-900">Sponsored Practitioners</div>
                <div className="text-[10px] text-slate-500 font-mono-code">Priority Marketplace Badges</div>
              </div>
              <button
                onClick={handleToggleSponsoredPros}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  !globalConfig.disableSponsoredProfessionals ? 'bg-emerald-600 text-white' : 'bg-red-200 text-red-900'
                }`}
                id="toggle-sponsored-pros"
              >
                {!globalConfig.disableSponsoredProfessionals ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            {/* AdMob Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-slate-900">Channel B: Google AdMob</div>
                <div className="text-[10px] text-slate-500 font-mono-code">Programmatic Network</div>
              </div>
              <button
                onClick={handleToggleAdMob}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  !globalConfig.disableAdMob ? 'bg-emerald-600 text-white' : 'bg-red-200 text-red-900'
                }`}
                id="toggle-admob"
              >
                {!globalConfig.disableAdMob ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

          </div>
        </div>

        {/* Granular Placement Whitelist */}
        <div className="pt-4 border-t border-slate-200/60 mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono-code">
              Granular Slot Whitelist / Blacklist
            </h4>
            <span className="text-[10px] text-slate-500 font-mono-code">
              Click to toggle individual slots on/off
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {placementsList.map(p => {
              const isDisabled = globalConfig.disabledPlacements.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handleTogglePlacement(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    !isDisabled
                      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                      : 'bg-red-50 text-red-800 border-red-200 opacity-70 line-through hover:opacity-100'
                  }`}
                  id={`toggle-slot-${p.id}`}
                >
                  <span className={`w-2 h-2 rounded-full ${!isDisabled ? 'bg-blue-600' : 'bg-red-500'}`} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* SUBTABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'CAMPAIGNS', label: 'Campaign Management', icon: Layers, count: campaigns.length },
          { id: 'SPONSORED_PROS', label: 'Sponsored Practitioners', icon: Users },
          { id: 'ADMOB', label: 'Google AdMob Programmatic', icon: Smartphone },
          { id: 'ANALYTICS', label: 'Performance & Revenue', icon: BarChart3 },
          { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: History, count: auditLogs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdSubTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
              id={`tab-ad-${tab.id.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code ${
                  isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT VIEWS */}
      {activeTab === 'CAMPAIGNS' && (
        <CampaignListTable
          campaigns={campaigns}
          onEditAd={(ad) => {
            setEditingAd(ad);
            setIsCreateModalOpen(true);
          }}
          onRefresh={refreshAll}
        />
      )}

      {activeTab === 'SPONSORED_PROS' && (
        <SponsoredProsManager
          campaigns={campaigns}
          onOpenCreateAd={(initialData) => {
            setEditingAd(initialData ? (initialData as Advertisement) : null);
            setIsCreateModalOpen(true);
          }}
          onRefresh={refreshAll}
        />
      )}

      {activeTab === 'ADMOB' && (
        <AdMobConfigPanel onRefresh={refreshAll} />
      )}

      {activeTab === 'ANALYTICS' && (
        <AdAnalyticsView campaigns={campaigns} analytics={analytics} />
      )}

      {activeTab === 'AUDIT_LOGS' && (
        <AdAuditLogTable logs={auditLogs} />
      )}

      {/* CREATE & EDIT AD MODAL */}
      <CreateAdModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAd(null);
        }}
        onAdCreated={(ad) => {
          refreshAll();
        }}
        initialAd={editingAd}
      />

    </div>
  );
};
