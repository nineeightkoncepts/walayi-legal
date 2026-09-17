import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, AuthorityType, AuthorityStatus } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { UserManagementSection } from './UserManagementSection';
import { 
  Scale, 
  ShieldCheck, 
  Users, 
  FileText, 
  Check, 
  X, 
  Search, 
  AlertTriangle, 
  Settings, 
  Wallet,
  Building,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    users, 
    requests, 
    transactions, 
    platformFeePercentage,
    setPlatformFee,
    updateAuthorityStatus,
    addNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'USERS' | 'CREDENTIALS' | 'REQUESTS' | 'FEES' | 'AUDIT_LOGS'>('USERS');
  const [feeInput, setFeeInput] = useState(platformFeePercentage.toString());
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all authorities across users that need review or management
  const candidatePros = users.filter(u => u.role !== 'deponent');

  const handleApproveAuthority = (userId: string, authType: AuthorityType) => {
    updateAuthorityStatus(userId, authType, 'VERIFIED');
    addNotification('Authority Approved', `Practitioner authority for ${authType.toUpperCase()} marked as VERIFIED. Marketplace access enabled.`, 'SUCCESS');
  };

  const handleRejectAuthority = (userId: string, authType: AuthorityType) => {
    updateAuthorityStatus(userId, authType, 'REJECTED');
    addNotification('Authority Rejected', `Practitioner authority for ${authType.toUpperCase()} marked as REJECTED.`, 'ALERT');
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(feeInput);
    if (!isNaN(val) && val >= 0 && val <= 30) {
      setPlatformFee(val);
      addNotification('Fee Updated', `WALAYI Platform Fee updated to ${val}%.`, 'SUCCESS');
    }
  };

  return (
    <div className="space-y-6 pb-16" id="super-admin-dashboard-container">
      
      {/* Admin Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono-code px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            PLATFORM ADMINISTRATION CONSOLE
          </div>
          <h1 className="text-2xl font-display-legal font-bold text-slate-900">
            Super Administrator & Professional Review Desk
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Oversee practitioner credential validations, monitor statutory ceremony audits, inspect SHA-256 hashes, and configure national escrow fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
            SUPER_ADMIN ACTIVE
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'USERS', label: 'User & Role Governance', icon: Users },
          { id: 'CREDENTIALS', label: 'Practitioner Review Queue', icon: ShieldCheck },
          { id: 'REQUESTS', label: 'All Commissioning Records', icon: FileText },
          { id: 'FEES', label: 'Escrow & Platform Fees', icon: Wallet },
          { id: 'AUDIT_LOGS', label: 'Cryptographic Hash Ledger', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id={`tab-admin-${tab.id.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 0: User Management & Role Assignment */}
      {activeTab === 'USERS' && <UserManagementSection />}

      {/* TAB 1: Practitioner Credentials Queue */}
      {activeTab === 'CREDENTIALS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code">
              Verified & Pending Legal Practitioners ({candidatePros.length})
            </h2>
          </div>

          <div className="space-y-4">
            {candidatePros.map((pro) => (
              <div
                key={pro.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={pro.avatarUrl || null} name={pro.fullName} size="lg" shape="rounded" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{pro.fullName}</h3>
                        {pro.isProSubscriber && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">PRO</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{pro.lawFirmName || pro.stationCity} • {pro.email}</p>
                    </div>
                  </div>

                  <div className="text-xs font-mono-code text-slate-500">
                    NIN: <span className="text-slate-800 font-semibold">{pro.nationalIdNumber || 'CM...'}</span>
                  </div>
                </div>

                {/* Sub-Authorities List for this user */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-blue-700 uppercase font-mono-code">
                    Enrolled Statutory Authorities:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pro.authorities.map((auth, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 capitalize">
                            {auth.type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {auth.licenceNumber || 'Direct Judicial Ex-Officio'} • {auth.courtStation || 'Kampala'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            PC Year: {auth.practisingCertificateYear || 2026}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            auth.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : auth.status === 'UNDER_REVIEW'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {auth.status}
                          </span>

                          {auth.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleApproveAuthority(pro.id, auth.type)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                              title="Approve Authority"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {auth.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleRejectAuthority(pro.id, auth.type)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition-colors cursor-pointer"
                              title="Reject Authority"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: All Commissioning Records */}
      {activeTab === 'REQUESTS' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code">
            System-Wide Commissioning Records ({requests.length})
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Certificate ID</th>
                  <th className="px-4 py-3 font-semibold">Document Title</th>
                  <th className="px-4 py-3 font-semibold">Deponent</th>
                  <th className="px-4 py-3 font-semibold">Presiding Commissioner</th>
                  <th className="px-4 py-3 font-semibold">Fee (UGX)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono-code text-blue-700 font-bold">{r.certificateNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.documentTitle}</td>
                    <td className="px-4 py-3">{r.deponentName}</td>
                    <td className="px-4 py-3">{r.assignedProfessionalName}</td>
                    <td className="px-4 py-3 font-mono-code text-slate-800">UGX {r.totalAmountUGX.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Fee & Escrow Configuration */}
      {activeTab === 'FEES' && (
        <div className="max-w-xl p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            WALAYI Escrow & Platform Fee Configuration
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure the percentage retained by the WALAYI infrastructure on every completed legal commissioning transaction.
          </p>

          <form onSubmit={handleSaveFee} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Fee Percentage (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-mono-code font-bold text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
              <div>Example standard fee (UGX 25,000 affidavit):</div>
              <div className="text-slate-900 font-mono-code">
                Platform retains: UGX {Math.round(25000 * parseFloat(feeInput || '0') / 100).toLocaleString()} • Commissioner receives: UGX {Math.round(25000 * (1 - parseFloat(feeInput || '0') / 100)).toLocaleString()}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
            >
              Update Platform Fee
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Cryptographic Ledger & Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            National Cryptographic Audit Trail & SHA-256 Ledger
          </h2>

          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-code font-bold text-blue-700">{r.certificateNumber}</span>
                  <span className="text-slate-500 font-mono-code text-[11px]">{new Date(r.createdAt).toISOString()}</span>
                </div>
                <div className="text-slate-900 font-semibold">{r.documentTitle}</div>
                <div className="p-2.5 rounded-xl bg-white font-mono-code text-[11px] text-blue-800 break-all select-all border border-slate-200">
                  ROOT DIGEST: {r.documentSha256}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                  <span>Presiding: {r.assignedProfessionalName}</span>
                  <span className="text-emerald-700 font-medium">✓ Immutable Block Signed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
