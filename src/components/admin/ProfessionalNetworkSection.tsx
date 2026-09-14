import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, AuthorityType, AuthorityStatus } from '../../types';
import { SecurityConfirmationModal } from './SecurityConfirmationModal';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Users, 
  Scale, 
  Building, 
  Landmark, 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Ban, 
  RotateCcw, 
  Sparkles, 
  Star, 
  FileText,
  Clock
} from 'lucide-react';

export const ProfessionalNetworkSection: React.FC = () => {
  const { 
    users, 
    toggleProfessionalStatus, 
    updateAuthorityStatus, 
    addNotification, 
    setMasterAdminSection 
  } = useApp();

  const [activeAuthorityTab, setActiveAuthorityTab] = useState<'ALL' | 'COMMISSIONER' | 'NOTARY' | 'JUDICIAL' | 'JUSTICE_PEACE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Security Modal state for Suspensions
  const [suspensionTarget, setSuspensionTarget] = useState<UserProfile | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // All legal professionals
  const professionals = users.filter(u => u.role !== 'deponent');

  const filteredPros = professionals.filter(pro => {
    // Tab filter
    if (activeAuthorityTab === 'COMMISSIONER' && !pro.authorities.some(a => a.type === 'commissioner_for_oaths')) return false;
    if (activeAuthorityTab === 'NOTARY' && !pro.authorities.some(a => a.type === 'notary_public')) return false;
    if (activeAuthorityTab === 'JUDICIAL' && !pro.authorities.some(a => a.type === 'judicial_officer')) return false;
    if (activeAuthorityTab === 'JUSTICE_PEACE' && !pro.authorities.some(a => a.type === 'justice_of_the_peace')) return false;

    // Search filter
    const q = searchQuery.toLowerCase();
    return (
      pro.fullName.toLowerCase().includes(q) ||
      pro.email.toLowerCase().includes(q) ||
      (pro.lawFirmName && pro.lawFirmName.toLowerCase().includes(q)) ||
      (pro.stationCity && pro.stationCity.toLowerCase().includes(q))
    );
  });

  const handleApproveAuthority = (userId: string, authType: AuthorityType) => {
    updateAuthorityStatus(userId, authType, 'VERIFIED');
    addNotification('Practitioner Verified', `Authority ${authType} approved by Master Admin.`, 'SUCCESS');
  };

  const handleRejectAuthority = (userId: string, authType: AuthorityType) => {
    updateAuthorityStatus(userId, authType, 'REJECTED');
    addNotification('Practitioner Authority Rejected', `Authority ${authType} rejected.`, 'ALERT');
  };

  const handleOpenSuspendModal = (pro: UserProfile) => {
    setSuspensionTarget(pro);
    setIsSuspendModalOpen(true);
  };

  const handleConfirmSuspension = (reason: string) => {
    if (suspensionTarget) {
      const isCurrentlySuspended = suspensionTarget.authorities.every(a => a.status === 'SUSPENDED');
      toggleProfessionalStatus(suspensionTarget.id, !isCurrentlySuspended, reason);
      setSuspensionTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-professionals-section">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              LEGAL PRACTITIONER ROLL OVERSIGHT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              HIGH COURT & LAW COUNCIL DIRECTORY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Professional Network & Authority Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Manage statutory enrollment status, inspect practising certificate credentials, suspend compromised accounts, and audit market availability.
          </p>
        </div>

        <button
          onClick={() => setMasterAdminSection('VERIFICATION_QUEUE')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          Review Pending Credentials
        </button>
      </div>

      {/* Authority Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'ALL', label: `All Practitioners (${professionals.length})`, icon: Users },
          { id: 'COMMISSIONER', label: 'Commissioners for Oaths (Cap. 5)', icon: Scale },
          { id: 'NOTARY', label: 'Notaries Public', icon: Building },
          { id: 'JUDICIAL', label: 'Judicial Officers', icon: Landmark },
          { id: 'JUSTICE_PEACE', label: 'Justices of the Peace', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAuthorityTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAuthorityTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="w-full max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by practitioner name, law firm, city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Practitioner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPros.map((pro) => {
          const isSuspended = pro.authorities.every(a => a.status === 'SUSPENDED');
          return (
            <div
              key={pro.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar src={pro.avatarUrl || null} name={pro.fullName} size="lg" shape="rounded" />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900">{pro.fullName}</h3>
                      {pro.isProSubscriber && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{pro.lawFirmName || pro.stationCity} • {pro.email}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {pro.rating} rating
                      </span>
                      <span>• {pro.completedCeremoniesCount} ceremonies</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold border ${
                    isSuspended
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isSuspended ? 'SUSPENDED' : 'ENROLLED'}
                  </span>
                  <button
                    onClick={() => handleOpenSuspendModal(pro)}
                    className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                      isSuspended ? 'text-emerald-700 hover:text-emerald-800' : 'text-red-600 hover:text-red-800'
                    }`}
                  >
                    {isSuspended ? 'Reinstate Access' : 'Suspend Account'}
                  </button>
                </div>
              </div>

              {/* Sub-Authorities List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono-code">
                  Statutory Enrolled Authorities:
                </span>

                <div className="space-y-2">
                  {pro.authorities.map((auth, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 capitalize">
                          {auth.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-code">
                          {auth.licenceNumber || 'Statutory Ex-Officio'} • PC Year: {auth.practisingCertificateYear || 2026}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
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
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                            title="Approve Authority"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {auth.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleRejectAuthority(pro.id, auth.type)}
                            className="p-1 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition-colors cursor-pointer"
                            title="Reject Authority"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Security Confirmation Modal for Account Suspensions */}
      <SecurityConfirmationModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={handleConfirmSuspension}
        title={suspensionTarget?.authorities.every(a => a.status === 'SUSPENDED') ? 'Reinstate Practitioner' : 'Suspend Legal Practitioner'}
        description={
          suspensionTarget?.authorities.every(a => a.status === 'SUSPENDED')
            ? `Reinstating ${suspensionTarget?.fullName} will restore their statutory commissioning authority and marketplace listings.`
            : `Suspending ${suspensionTarget?.fullName} will immediately revoke their ability to accept affidavits and sign digital jurats across the WALAYI platform.`
        }
        actionButtonText={suspensionTarget?.authorities.every(a => a.status === 'SUSPENDED') ? 'Confirm Reinstatement' : 'Confirm Suspension'}
        isDestructive={!suspensionTarget?.authorities.every(a => a.status === 'SUSPENDED')}
        targetDetails={suspensionTarget ? [
          { label: 'Practitioner', value: suspensionTarget.fullName },
          { label: 'Email', value: suspensionTarget.email },
          { label: 'Chambers', value: suspensionTarget.lawFirmName || 'N/A' }
        ] : []}
      />

    </div>
  );
};
