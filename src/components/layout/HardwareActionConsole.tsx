import React, { useState, useEffect } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { 
  Search, 
  PlusCircle, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Crown, 
  Briefcase, 
  SlidersHorizontal, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Scale, 
  Video, 
  QrCode, 
  Layers, 
  Award, 
  X,
  Radio,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface HardwareActionConsoleProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const HardwareActionConsole: React.FC<HardwareActionConsoleProps> = () => {
  const { 
    currentView, 
    setCurrentView, 
    requests, 
    currentUser, 
    isMasterAdmin, 
    operatingView,
    deviceMode
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Auto-expand or collapse based on user interaction or preference
  const toggleConsole = () => {
    setIsExpanded(prev => !prev);
  };

  const handleActionClick = (view: AppView) => {
    setCurrentView(view);
    // On small devices, auto collapse drawer after selection if not pinned
    if (window.innerWidth < 1024 && !pinned) {
      setIsExpanded(false);
    }
  };

  // Keyboard shortcut for quick hardware switch (e.g. 'h' or '[' or Alt+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'h') || (e.ctrlKey && e.key === '`')) {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalDocuments = requests.length;
  const activeCeremonies = requests.filter(r => r.status === 'CEREMONY_ACTIVE' || r.status === 'ACCEPTED').length;

  const actions = [
    {
      id: 'commissioner-dashboard',
      view: 'commissioner-dashboard' as AppView,
      title: 'Commissioner Dashboard',
      shortLabel: 'Commissioner Tasks',
      subtitle: '5-Step Statutory Workflow & Escrow',
      badge: 'Chambers Hub',
      icon: Scale,
      color: 'blue',
      description: 'Pull pending tasks, inspect documents & exhibits, verify MoMo escrow, check deponent online status, and initiate video calls.'
    },
    {
      id: 'marketplace',
      view: 'marketplace' as AppView,
      title: 'Find Commissioner',
      shortLabel: 'Find Commissioner',
      subtitle: 'Verified Advocates & Notaries',
      badge: 'Available Now',
      icon: Search,
      color: 'blue',
      description: 'Search by High Court circuit, instant availability, verified warrants and fees.'
    },
    {
      id: 'new-commissioning',
      view: 'new-commissioning' as AppView,
      title: 'Commission Affidavit',
      shortLabel: 'Commission Affidavit',
      subtitle: 'Upload & Swear Solemn Oath',
      badge: 'Fast Track',
      icon: PlusCircle,
      color: 'emerald',
      description: 'Upload court affidavit, attach exhibits/annexures, deposit escrow & enter live room.'
    },
    {
      id: 'documents',
      view: 'documents' as AppView,
      title: 'My Documents',
      shortLabel: 'My Documents',
      subtitle: 'Jurats & Evidentiary Certificates',
      badge: `${totalDocuments} Records`,
      icon: FileText,
      color: 'indigo',
      description: 'Access sworn affidavits, certificates with QR codes, SHA-256 logs & ECCMIS filings.'
    },
    {
      id: 'verify-portal',
      view: 'verify-portal' as AppView,
      title: 'Verify Document',
      shortLabel: 'Verify Document',
      subtitle: 'Cryptographic SHA-256 Validator',
      badge: 'Live Auditor',
      icon: ShieldCheck,
      color: 'amber',
      description: 'Scan QR code or paste SHA-256 digest to authenticate commissioner warrant & seal.'
    },
    {
      id: 'vault',
      view: 'vault' as AppView,
      title: 'Credential Vault & Seal Studio',
      shortLabel: 'Seal & Signature Vault',
      subtitle: 'Practising Certs & Custom Brass Seals',
      badge: 'Biometric',
      icon: Lock,
      color: 'slate',
      description: 'Manage digital signature marks, custom chambers seal engraving & authority credentials.'
    },
    {
      id: 'pro',
      view: 'pro' as AppView,
      title: 'WALAYI Pro Chambers',
      shortLabel: 'Pro Chambers',
      subtitle: 'Priority Routing & Custom Jurats',
      badge: 'PRO',
      icon: Briefcase,
      color: 'amber',
      description: 'Chambers subscription for law firms with unlimited depositions and bespoke seals.'
    },
    ...(isMasterAdmin ? [{
      id: 'admin',
      view: 'admin' as AppView,
      title: 'Master Control Center',
      shortLabel: 'Master Control',
      subtitle: '5% Revenue & Escrow Ledger',
      badge: 'ADMIN',
      icon: Crown,
      color: 'purple',
      description: 'Full oversight over active ceremonies, financial sweeps, dispute tribunal & refunds.'
    }] : [])
  ];

  return (
    <>
      {/* TACTILE HARDWARE 3-BAR SWITCH / TRIGGER BUTTON (Anchored on the left edge) */}
      <div 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center select-none"
        id="hardware-console-trigger-root"
      >
        <button
          type="button"
          onClick={toggleConsole}
          aria-label={isExpanded ? "Collapse Legal Console" : "Open Legal Action Console"}
          className={`group flex items-center transition-all duration-300 shadow-xl cursor-pointer ${
            isExpanded 
              ? 'translate-x-0' 
              : 'hover:translate-x-0.5'
          }`}
          title="Hardware Console • 3-Bar Switch"
          id="btn-left-hardware-switch"
        >
          {/* Physical Chassis / Tactile Beveled Button with 3 Horizontal Thick Bars */}
          <div className="bg-slate-900/95 hover:bg-slate-900 text-white border-y border-r border-slate-700/90 rounded-r-xl py-3 px-2.5 shadow-2xl flex flex-col items-center gap-2.5 backdrop-blur-md transition-all">
            
            {/* 3 Thick Horizontal Lines (Hardware Standard Sign) */}
            <div className="flex flex-col justify-center items-center gap-1">
              <span className="w-5 h-[3.5px] bg-amber-400 group-hover:bg-amber-300 rounded-full transition-colors shadow-xs" />
              <span className="w-5 h-[3.5px] bg-slate-200 group-hover:bg-white rounded-full transition-colors" />
              <span className="w-5 h-[3.5px] bg-slate-200 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* Micro Status Indicator */}
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            </div>
          </div>
        </button>
      </div>

      {/* BACKDROP FOR MOBILE */}
      {isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity lg:hidden"
        />
      )}

      {/* EXPANDABLE HARDWARE ACTION CONSOLE (SLIDE-OUT DOCK) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-96 bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isExpanded ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="hardware-action-panel"
      >
        {/* Console Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display-legal font-bold text-sm text-white">WALAYI CONSOLE</h3>
                <span className="text-[9px] font-mono-code font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
                  HARDWARE HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-mono-code">Select button to display right functionalities</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-mono-code text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>State Machine: <strong>CONNECTED</strong></span>
          </div>
          {activeCeremonies > 0 ? (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Video className="w-2.5 h-2.5" />
              {activeCeremonies} Live Call
            </span>
          ) : (
            <span className="text-[10px] font-mono-code text-slate-500">
              High Court Circuit Ready
            </span>
          )}
        </div>

        {/* Core Hardware Action Buttons List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[10px] font-mono-code uppercase font-bold text-slate-400 px-2 pt-1 tracking-wider">
            Legal Hardware Buttons
          </div>

          {actions.map((action) => {
            const Icon = action.icon;
            const isActive = currentView === action.view;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleActionClick(action.view)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                }`}
                id={`btn-hardware-action-${action.id}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r" />
                )}

                {/* Button Icon Frame */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Button Text Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`font-bold text-xs leading-tight transition-colors ${
                      isActive ? 'text-blue-950 font-extrabold' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {action.title}
                    </h4>
                    <span className={`text-[9px] font-mono-code font-bold px-1.5 py-0.2 rounded border ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {action.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {action.subtitle}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>

                  {/* Active Status pill */}
                  {isActive && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md font-mono-code">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      DISPLAYED ON RIGHT
                    </div>
                  )}
                </div>

                {/* Forward Arrow */}
                <ChevronRight className={`w-4 h-4 mt-2 flex-shrink-0 transition-transform group-hover:translate-x-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-300'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Quick Footer / Direct Shortcut */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Signed in as: <strong>{(currentUser?.fullName || currentUser?.email || 'User').split(' ')[0]}</strong></span>
            <span className="font-mono-code text-[10px] text-blue-700 font-bold uppercase">{currentUser?.role}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActionClick('home')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                currentView === 'home' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Main Overview
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
