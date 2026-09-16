import React, { useState } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { MasterAdminSection, OperatingView } from '../../types';
import { 
  Shield, 
  Scale, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Users, 
  Clock, 
  Lock, 
  BookOpen, 
  Sparkles, 
  Crown, 
  Eye, 
  ChevronRight, 
  ChevronDown,
  X, 
  CheckCircle2,
  Key,
  ShieldCheck,
  Zap,
  Sliders,
  QrCode,
  Award,
  Search,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { ApiGatewayConfigModal } from './ApiGatewayConfigModal';

interface MasterAdminShieldConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterAdminShieldConsole: React.FC<MasterAdminShieldConsoleProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    currentUser,
    masterAdminSection, 
    setMasterAdminSection, 
    setCurrentView, 
    operatingView, 
    setOperatingView,
    credentialDocs,
    disputes,
    users,
    requests
  } = useApp();

  const [showApiSecrets, setShowApiSecrets] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Collapsible section states
  const [isQuickServicesOpen, setIsQuickServicesOpen] = useState(true);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(true);
  const [isPersonaOpen, setIsPersonaOpen] = useState(true);
  const [isGatewaysOpen, setIsGatewaysOpen] = useState(false);

  // Compute live badges
  let pendingDocsCount = 0;
  Object.values(credentialDocs).forEach((docs) => {
    if (Array.isArray(docs)) {
      pendingDocsCount += (docs as any[]).filter(d => d.status === 'PENDING').length;
    }
  });

  const openDisputesCount = disputes.filter(d => d.status === 'OPEN').length;

  const governanceSections: {
    id: MasterAdminSection;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { 
      id: 'OVERVIEW', 
      label: 'Platform Overview', 
      description: 'System health, High Court uptime & executive metrics', 
      icon: Scale 
    },
    { 
      id: 'FINANCIAL', 
      label: 'Financial & Revenue Hub', 
      description: 'Platform fee earnings, commission splits & volume', 
      icon: TrendingUp 
    },
    { 
      id: 'WALLET', 
      label: 'Overall Wallet & Treasury', 
      description: 'MoMo escrow reserves & dispute adjudication', 
      icon: Wallet,
      badge: openDisputesCount > 0 ? openDisputesCount : undefined,
      badgeColor: 'amber'
    },
    { 
      id: 'DOCUMENTS', 
      label: 'Document Archive & Hashes', 
      description: 'Cryptographic SHA-256 records & audit trail',
      icon: FileText,
      badge: requests.length,
      badgeColor: 'blue'
    },
    { 
      id: 'PROFESSIONALS', 
      label: 'Professional Network', 
      description: 'Admitted advocates, Notaries Public & circuit stations', 
      icon: Users 
    },
    { 
      id: 'VERIFICATION_QUEUE', 
      label: 'Credential Review Queue', 
      description: 'Practising certificates & warrant authentications', 
      icon: Clock,
      badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
      badgeColor: 'amber'
    },
    { 
      id: 'AUDIT_LOGS', 
      label: 'Audit Trail Logs', 
      description: 'Immutable chronological administrative governance events', 
      icon: Lock 
    },
    { 
      id: 'RULES_FEES', 
      label: 'Statutory Policy & Fees', 
      description: 'Cap. 5 fee schedules, statutory rates & policies', 
      icon: BookOpen 
    },
    { 
      id: 'ADVERTISING', 
      label: 'Advertising Control Centre', 
      description: 'Direct ads, AdMob kill switches & campaign moderation', 
      icon: Sparkles 
    },
    { 
      id: 'USERS', 
      label: 'User Directory', 
      description: 'Full database registry of deponents and practitioners', 
      icon: Users,
      badge: users.length,
      badgeColor: 'slate'
    }
  ];

  const quickServices: {
    view: AppView;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      view: 'verify-portal',
      label: 'Verify QR & Document Authenticity',
      description: 'Instant SHA-256 integrity and court barcode scanner',
      icon: QrCode,
      badge: 'Public'
    },
    {
      view: 'pro',
      label: 'PRO Advocate Subscriptions',
      description: 'Statutory priority listing, certified badges & VIP tier',
      icon: Award,
      badge: 'PRO'
    },
    {
      view: 'commissioner-dashboard',
      label: 'Commissioner Action Desk',
      description: 'Live task queue, video signing & 5-step execution',
      icon: Scale
    },
    {
      view: 'new-commissioning',
      label: 'Commission Affidavit Wizard',
      description: 'Step 1-5 instant digital oath & commissioner booking',
      icon: PlusCircle
    },
    {
      view: 'marketplace',
      label: 'Advocate & Notary Directory',
      description: 'Search vetted Commissioners across Uganda circuits',
      icon: Search
    },
    {
      view: 'documents',
      label: 'My Document Vault',
      description: 'Cryptographically sealed & stamped legal records',
      icon: FolderOpen
    }
  ];

  const filteredGovernance = governanceSections.filter(s => 
    s.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredServices = quickServices.filter(s => 
    s.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSelectSection = (sectionId: MasterAdminSection) => {
    setMasterAdminSection(sectionId);
    setOperatingView('ADMIN');
    setCurrentView('admin');
    onClose();
  };

  const handleSelectView = (view: AppView) => {
    setCurrentView(view);
    onClose();
  };

  const handleSwitchMode = (mode: OperatingView) => {
    setOperatingView(mode);
    if (mode === 'ADMIN') {
      setCurrentView('admin');
    } else if (mode === 'COMMISSIONER') {
      setCurrentView('commissioner-dashboard');
    } else {
      setCurrentView('home');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-end p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
        id="master-shield-console-overlay"
      >
        <div 
          className="bg-white h-full sm:h-auto sm:max-h-[92vh] w-full sm:w-[480px] sm:rounded-3xl border-l sm:border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-slideLeft"
          onClick={(e) => e.stopPropagation()}
          id="master-shield-console-drawer"
        >
          
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                <Shield className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono-code font-bold text-amber-400 uppercase tracking-wider">
                    CENTRAL SHIELD CONSOLE
                  </span>
                </div>
                <h2 className="text-base font-bold font-display-legal text-white">
                  Platform Operations & Governance
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
              id="btn-close-shield-console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search Filter */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools, verification, governance..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Container with Expandable Sections */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-slate-700 text-xs scroll-smooth">
            
            {/* Section 1: Operating Mode Quick Switcher (Expandable) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Operating Persona View</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold text-blue-700 uppercase bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {operatingView}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isPersonaOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isPersonaOpen && (
                <div className="p-3 pt-1 border-t border-slate-200/80 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSwitchMode('ADMIN')}
                    className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      operatingView === 'ADMIN'
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Master Admin</span>
                  </button>
                  <button
                    onClick={() => handleSwitchMode('COMMISSIONER')}
                    className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      operatingView === 'COMMISSIONER'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Commissioner</span>
                  </button>
                  <button
                    onClick={() => handleSwitchMode('USER')}
                    className={`py-2 px-2 rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      operatingView === 'USER'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Client / Deponent</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Quick Tools & Verifications (Expandable) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsQuickServicesOpen(!isQuickServicesOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Platform Verification & Core Tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold text-slate-500">
                    {filteredServices.length} tools
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isQuickServicesOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isQuickServicesOpen && (
                <div className="p-2 space-y-1 divide-y divide-slate-100 border-t border-slate-200">
                  {filteredServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.view}
                        onClick={() => handleSelectView(service.view)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{service.label}</span>
                            {service.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{service.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Administrative Governance & Oversight (Expandable) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsGovernanceOpen(!isGovernanceOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Administrative Governance Hubs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold text-slate-500">
                    {filteredGovernance.length} hubs
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isGovernanceOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isGovernanceOpen && (
                <div className="p-2 space-y-1 divide-y divide-slate-100 border-t border-slate-200">
                  {filteredGovernance.map((section) => {
                    const Icon = section.icon;
                    const isActive = masterAdminSection === section.id && operatingView === 'ADMIN';

                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSelectSection(section.id)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group ${
                          isActive ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        id={`shield-menu-${section.id.toLowerCase()}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'
                        }`}>
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">{section.label}</span>
                            {section.badge !== undefined && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono-code font-bold ${
                                section.badgeColor === 'amber'
                                  ? 'bg-amber-100 text-amber-800'
                                  : section.badgeColor === 'blue'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {section.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {section.description}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 4: Gateways & API Secrets (Expandable) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsGatewaysOpen(!isGatewaysOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50"
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Payment Gateways & Court Enactments</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isGatewaysOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGatewaysOpen && (
                <div className="p-3 border-t border-slate-200 space-y-2">
                  <button
                    onClick={() => setShowApiSecrets(true)}
                    className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>MTN & Airtel MoMo API Gateway Keys</span>
                    </div>
                    <span className="text-[10px] text-amber-700 uppercase font-mono-code font-bold">Configure</span>
                  </button>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      Statutory Enactments Verified
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Commissioners for Oaths Act (Cap. 5) • Electronic Transactions Act 2011 • Judicature Court Rules
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Quick Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => setShowApiSecrets(true)}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              API Secrets
            </button>

            <button
              onClick={() => {
                setOperatingView('ADMIN');
                setCurrentView('admin');
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Full Command Center
            </button>
          </div>

        </div>
      </div>

      {showApiSecrets && (
        <ApiGatewayConfigModal 
          isOpen={showApiSecrets} 
          onClose={() => setShowApiSecrets(false)} 
        />
      )}
    </>
  );
};

