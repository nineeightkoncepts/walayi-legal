import React from 'react';
import { useApp } from '../../context/AppContext';
import { MasterAdminSection } from '../../types';
import { PlatformOverviewSection } from './PlatformOverviewSection';
import { FinancialRevenueSection } from './FinancialRevenueSection';
import { OverallWalletSection } from './OverallWalletSection';
import { DocumentsManagementSection } from './DocumentsManagementSection';
import { ProfessionalNetworkSection } from './ProfessionalNetworkSection';
import { CredentialVerificationQueue } from './CredentialVerificationQueue';
import { AdminAuditLogSection } from './AdminAuditLogSection';
import { StatutoryLegalRulesSection } from './StatutoryLegalRulesSection';
import { AdvertisingSection } from './AdvertisingSection';
import { UserManagementSection } from './UserManagementSection';
import { ApiGatewayConfigModal } from './ApiGatewayConfigModal';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Scale, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Users, 
  Clock, 
  Lock, 
  BookOpen, 
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Eye,
  ArrowRight,
  Key,
  Sparkles
} from 'lucide-react';

export const MasterControlCenter: React.FC = () => {
  const { 
    currentUser, 
    masterAdminSection, 
    setMasterAdminSection, 
    setOperatingView,
    users,
    credentialDocs,
    disputes
  } = useApp();

  const [showApiConfigModal, setShowApiConfigModal] = React.useState(false);

  // Pending count for queue badge
  let pendingDocsCount = 0;
  Object.values(credentialDocs).forEach((docs) => {
    if (Array.isArray(docs)) {
      pendingDocsCount += (docs as any[]).filter(d => d.status === 'PENDING').length;
    }
  });

  const openDisputesCount = disputes.filter(d => d.status === 'OPEN').length;

  const navTabs: { id: MasterAdminSection; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'OVERVIEW', label: 'Platform Overview', icon: Scale },
    { id: 'FINANCIAL', label: 'Financial & Revenue Hub', icon: TrendingUp },
    { id: 'WALLET', label: 'Overall Wallet & Treasury', icon: Wallet, badge: openDisputesCount > 0 ? openDisputesCount : undefined },
    { id: 'DOCUMENTS', label: 'Document Archive & Hashes', icon: FileText },
    { id: 'PROFESSIONALS', label: 'Professional Network', icon: Users },
    { id: 'VERIFICATION_QUEUE', label: 'Credential Review Queue', icon: Clock, badge: pendingDocsCount > 0 ? pendingDocsCount : undefined },
    { id: 'AUDIT_LOGS', label: 'Audit Trail Logs', icon: Lock },
    { id: 'RULES_FEES', label: 'Statutory Policy & Fees', icon: BookOpen },
    { id: 'ADVERTISING', label: 'Advertising Control Centre', icon: Sparkles },
    { id: 'USERS', label: 'User & Role Management', icon: Users }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto" id="master-control-center-root">
      
      {/* Master Admin Top Header Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              {currentUser.role === 'super_admin' ? 'SUPER ADMIN CONSOLE' : 'CENTRAL ADMIN DASHBOARD'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System 100% Operational
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-display-legal font-bold tracking-tight text-white">
            WALAYI Central Command & Admin Dashboard
          </h1>
        </div>

        {/* Quick Actions & Operating View Swapper */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMasterAdminSection('USERS')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
            id="btn-admin-manage-users"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Manage Users</span>
          </button>
          
          <button
            onClick={() => setMasterAdminSection('RULES_FEES')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
            id="btn-admin-payment-settings"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment Settings</span>
          </button>

          <button
            onClick={() => setMasterAdminSection('FINANCIAL')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
            id="btn-admin-view-ledger"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Ledger</span>
          </button>

          <button
            onClick={() => setOperatingView('USER')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700/60"
            title="Preview as deponent user"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Client Mode
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = masterAdminSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMasterAdminSection(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id={`master-tab-${tab.id.toLowerCase()}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-code font-extrabold ${
                  isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-900'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Section Content */}
      <div className="min-h-[400px]">
        {masterAdminSection === 'OVERVIEW' && <PlatformOverviewSection />}
        {masterAdminSection === 'FINANCIAL' && <FinancialRevenueSection />}
        {masterAdminSection === 'WALLET' && <OverallWalletSection />}
        {masterAdminSection === 'DOCUMENTS' && <DocumentsManagementSection />}
        {masterAdminSection === 'PROFESSIONALS' && <ProfessionalNetworkSection />}
        {masterAdminSection === 'VERIFICATION_QUEUE' && <CredentialVerificationQueue />}
        {masterAdminSection === 'AUDIT_LOGS' && <AdminAuditLogSection />}
        {masterAdminSection === 'RULES_FEES' && <StatutoryLegalRulesSection />}
        {masterAdminSection === 'ADVERTISING' && <AdvertisingSection />}
        {masterAdminSection === 'USERS' && <UserManagementSection />}
      </div>

      {/* API Gateway Secrets Configuration Modal */}
      <ApiGatewayConfigModal
        isOpen={showApiConfigModal}
        onClose={() => setShowApiConfigModal(false)}
      />

    </div>
  );
};
