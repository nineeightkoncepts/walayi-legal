import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  Scale, 
  FileCheck2, 
  Clock, 
  AlertOctagon, 
  Activity, 
  TrendingUp, 
  Wallet, 
  Building, 
  Sparkles,
  ArrowUpRight,
  Landmark,
  FileText
} from 'lucide-react';

export const PlatformOverviewSection: React.FC = () => {
  const { 
    users, 
    requests, 
    transactions, 
    credentialDocs, 
    disputes, 
    setMasterAdminSection 
  } = useApp();

  // Calculate platform metrics
  const totalUsers = users.length;
  
  const commissioners = users.filter(u => 
    u.authorities.some(a => a.type === 'commissioner_for_oaths' && a.status === 'VERIFIED')
  ).length;

  const notaries = users.filter(u => 
    u.authorities.some(a => a.type === 'notary_public' && a.status === 'VERIFIED')
  ).length;

  const judicialOfficers = users.filter(u => 
    u.authorities.some(a => a.type === 'judicial_officer' && a.status === 'VERIFIED')
  ).length;

  const justicesOfPeace = users.filter(u => 
    u.authorities.some(a => a.type === 'justice_of_the_peace' && a.status === 'VERIFIED')
  ).length;

  // Pending verification docs
  let pendingDocsCount = 0;
  Object.values(credentialDocs).forEach((docs) => {
    if (Array.isArray(docs)) {
      pendingDocsCount += (docs as any[]).filter(d => d.status === 'PENDING').length;
    }
  });

  const activeMarketplacePros = users.filter(u => 
    u.role !== 'deponent' && u.availableNow && u.authorities.some(a => a.status === 'VERIFIED')
  ).length;

  const activeCeremonies = requests.filter(r => 
    r.status === 'CEREMONY_ACTIVE' || r.status === 'ACCEPTED' || r.status === 'DOCUMENT_LOCKED'
  ).length;

  const completedDocuments = requests.filter(r => 
    r.status === 'COMPLETED' || r.status === 'COMMISSIONED' || r.status === 'VERIFIED'
  ).length;

  const failedCeremonies = requests.filter(r => 
    r.status === 'CANCELLED' || r.status === 'REJECTED' || r.status === 'INTERRUPTED'
  ).length;

  const openDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;

  // Financial sums
  const totalMoneyProcessed = transactions
    .filter(t => t.status === 'SETTLED' || t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const totalPlatformRevenue = transactions
    .filter(t => t.status === 'SETTLED' || t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + (t.type === 'PRO_SUBSCRIPTION' ? t.amountUGX : t.platformFeeUGX), 0);

  const totalPendingSettlement = transactions
    .filter(t => t.status === 'CONFIRMED' || t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-overview-section">
      
      {/* Quick Action / Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System 100% Operational
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono-code font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Audit Trail Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMasterAdminSection('FINANCIAL')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Financial Hub
          </button>
          <button
            onClick={() => setMasterAdminSection('VERIFICATION_QUEUE')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Queue ({pendingDocsCount})
          </button>
        </div>
      </div>

      {/* Primary Platform Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div 
          onClick={() => setMasterAdminSection('USERS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{totalUsers}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">+100% active</span> deponents & pros
          </div>
        </div>

        {/* Verified Commissioners for Oaths */}
        <div 
          onClick={() => setMasterAdminSection('PROFESSIONALS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Commissioners for Oaths</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{commissioners}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">Cap. 5 Warrants</span> verified
          </div>
        </div>

        {/* Verified Notaries Public */}
        <div 
          onClick={() => setMasterAdminSection('PROFESSIONALS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notaries Public</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{notaries}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-purple-600 font-semibold">High Court Enrolled</span>
          </div>
        </div>

        {/* Judicial Officers */}
        <div 
          onClick={() => setMasterAdminSection('PROFESSIONALS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Judicial Officers</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{judicialOfficers}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-amber-700 font-semibold">Judicial Service Inst.</span>
          </div>
        </div>

        {/* Justices of the Peace */}
        <div 
          onClick={() => setMasterAdminSection('PROFESSIONALS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Justices of the Peace</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{justicesOfPeace}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-teal-700 font-semibold">Statutory Gazette</span>
          </div>
        </div>

        {/* Pending Credential Verifications */}
        <div 
          onClick={() => setMasterAdminSection('VERIFICATION_QUEUE')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
            pendingDocsCount > 0 
              ? 'bg-amber-50/70 border-amber-300 shadow-xs' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Verifications</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 font-mono-code">{pendingDocsCount}</div>
          <div className="text-[11px] text-amber-800 mt-1 flex items-center gap-1 font-semibold">
            {pendingDocsCount > 0 ? 'Requires Master Review' : 'Queue clear'}
          </div>
        </div>

        {/* Completed Commissioned Documents */}
        <div 
          onClick={() => setMasterAdminSection('DOCUMENTS')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Commissioned Documents</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">{completedDocuments}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">100% SHA-256</span> verified
          </div>
        </div>

        {/* Disputed Transactions */}
        <div 
          onClick={() => setMasterAdminSection('WALLET')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
            openDisputes > 0 
              ? 'bg-rose-50/70 border-rose-300 shadow-xs' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Disputed Transactions</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-900 font-mono-code">{openDisputes}</div>
          <div className="text-[11px] text-rose-800 mt-1 flex items-center gap-1 font-semibold">
            {openDisputes > 0 ? 'Resolution action needed' : 'Zero active disputes'}
          </div>
        </div>

      </div>

      {/* Financial Health Snapshot Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">National Financial Settlement Summary</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
                DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live reconciliation of deponent fees, platform commissions, and professional payouts across MTN MoMo & Airtel Money.
            </p>
          </div>

          <button
            onClick={() => setMasterAdminSection('FINANCIAL')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            View Complete Revenue Analytics <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Money Processed
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-code">
              UGX {totalMoneyProcessed.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">Gross volume processed across all payment rails</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Total Platform Revenue
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 font-mono-code">
              UGX {totalPlatformRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700">5% transaction fee + PRO subscriptions</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
              Pending Settlement
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-900 font-mono-code">
              UGX {totalPendingSettlement.toLocaleString()}
            </div>
            <p className="text-[11px] text-blue-700">Awaiting ceremony completion or payout release</p>
          </div>

        </div>
      </div>

    </div>
  );
};
