import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { SecurityConfirmationModal } from './SecurityConfirmationModal';
import { UserAvatar } from '../common/UserAvatar';
import {
  Check,
  X,
  Ban,
  CheckCheck
} from 'lucide-react';

type AdmissionTab = 'PENDING' | 'ADMITTED' | 'REJECTED' | 'SUSPENDED';

export const CommissionerAdmissionQueue: React.FC = () => {
  const { commissionerAdmissions, setCommissionerAdmission } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<AdmissionTab>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [showBulkAdmitConfirm, setShowBulkAdmitConfirm] = useState(false);

  // Any account without an explicit admissionStatus (created before this
  // field existed, or seeded data) is treated as PENDING — fails closed
  // into "needs review" rather than being assumed admitted.
  const statusOf = (u: UserProfile): AdmissionTab =>
    (u.admissionStatus as AdmissionTab) || 'PENDING';

  const pending = commissionerAdmissions.filter(u => statusOf(u) === 'PENDING');
  const admitted = commissionerAdmissions.filter(u => statusOf(u) === 'ADMITTED');
  const rejected = commissionerAdmissions.filter(u => statusOf(u) === 'REJECTED');
  const suspended = commissionerAdmissions.filter(u => statusOf(u) === 'SUSPENDED');

  const displayed =
    activeSubTab === 'PENDING' ? pending :
    activeSubTab === 'ADMITTED' ? admitted :
    activeSubTab === 'REJECTED' ? rejected : suspended;

  const handleAdmit = (u: UserProfile) => {
    setCommissionerAdmission(u.id, 'ADMITTED', 'Admitted by Master Admin after review.');
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectTarget) {
      setCommissionerAdmission(rejectTarget.id, 'REJECTED', reason);
      setRejectTarget(null);
    }
  };

  const handleConfirmSuspend = (reason: string) => {
    if (suspendTarget) {
      setCommissionerAdmission(suspendTarget.id, 'SUSPENDED', reason);
      setSuspendTarget(null);
    }
  };

  // Admits every account currently sitting in Pending Review in one action —
  // for when a batch of professionals (e.g. from a prior onboarding push)
  // all need marketplace access at once rather than clicking Admit one by
  // one. Deliberately scoped to PENDING only: reinstating a REJECTED or
  // SUSPENDED account stays a one-by-one, deliberate decision.
  const handleConfirmBulkAdmit = (reason: string) => {
    const justification = reason.trim() || 'Bulk admitted by Master Admin.';
    pending.forEach((u) => {
      setCommissionerAdmission(u.id, 'ADMITTED', justification);
    });
  };

  const tabButtonClass = (tab: AdmissionTab, activeColor: string) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      activeSubTab === tab
        ? `${activeColor} text-white shadow-xs`
        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-admissions-queue">

      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
              COMMISSIONER ADMISSION DESK
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Commissioner Admission Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            No commissioner-category account appears on the public marketplace until it is expressly admitted here. Review each applicant before granting marketplace participation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <button
              onClick={() => setShowBulkAdmitConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              id="btn-bulk-admit-all-pending"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Admit All Pending ({pending.length})
            </button>
          )}
          <span className={`px-3 py-1.5 rounded-xl font-mono-code font-bold text-xs ${
            pending.length > 0
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {pending.length} Awaiting Admission
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button onClick={() => setActiveSubTab('PENDING')} className={tabButtonClass('PENDING', 'bg-amber-600')}>
          Pending Review ({pending.length})
        </button>
        <button onClick={() => setActiveSubTab('ADMITTED')} className={tabButtonClass('ADMITTED', 'bg-emerald-600')}>
          Admitted ({admitted.length})
        </button>
        <button onClick={() => setActiveSubTab('SUSPENDED')} className={tabButtonClass('SUSPENDED', 'bg-orange-600')}>
          Suspended ({suspended.length})
        </button>
        <button onClick={() => setActiveSubTab('REJECTED')} className={tabButtonClass('REJECTED', 'bg-red-600')}>
          Rejected ({rejected.length})
        </button>
      </div>

      {/* Queue Items */}
      {displayed.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-400">
          No accounts in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((u) => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              id={`admission-card-${u.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={u.avatarUrl || null} name={u.fullName} size="md" shape="rounded" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{u.fullName}</h3>
                    <p className="text-xs text-slate-500 truncate">{u.lawFirmName || u.stationCity} • {u.email}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold border shrink-0 ${
                  statusOf(u) === 'ADMITTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : statusOf(u) === 'PENDING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : statusOf(u) === 'SUSPENDED'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {statusOf(u)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Category:</span>
                  <span className="font-bold text-slate-900 capitalize">{(u.role || '').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Station:</span>
                  <span className="font-bold text-blue-700">{u.stationCity || 'Not set'}</span>
                </div>
                {u.admissionDecisionAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Last Decision:</span>
                    <span className="font-mono-code text-slate-500">{new Date(u.admissionDecisionAt).toLocaleString()}</span>
                  </div>
                )}
                {u.admissionDecisionReason && (
                  <div className="pt-1 text-slate-600 italic">"{u.admissionDecisionReason}"</div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {statusOf(u) !== 'ADMITTED' && (
                  <button
                    onClick={() => handleAdmit(u)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    id={`btn-admit-${u.id}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Admit to Marketplace
                  </button>
                )}
                {statusOf(u) === 'ADMITTED' && (
                  <button
                    onClick={() => setSuspendTarget(u)}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    id={`btn-suspend-${u.id}`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Suspend
                  </button>
                )}
                {statusOf(u) !== 'REJECTED' && (
                  <button
                    onClick={() => setRejectTarget(u)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    id={`btn-reject-${u.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SecurityConfirmationModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        title="Reject Commissioner Admission"
        description="Provide a formal reason for rejecting this applicant. They will receive an in-app notification and will not appear on the marketplace."
        actionButtonText="Confirm Rejection"
        isDestructive={true}
        targetDetails={rejectTarget ? [
          { label: 'Applicant', value: rejectTarget.fullName },
          { label: 'Email', value: rejectTarget.email }
        ] : []}
      />

      <SecurityConfirmationModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleConfirmSuspend}
        title="Suspend Marketplace Access"
        description="Provide a formal reason for suspending this commissioner's marketplace participation. They will be removed from the marketplace and notified."
        actionButtonText="Confirm Suspension"
        isDestructive={true}
        targetDetails={suspendTarget ? [
          { label: 'Commissioner', value: suspendTarget.fullName },
          { label: 'Email', value: suspendTarget.email }
        ] : []}
      />

      <SecurityConfirmationModal
        isOpen={showBulkAdmitConfirm}
        onClose={() => setShowBulkAdmitConfirm(false)}
        onConfirm={handleConfirmBulkAdmit}
        title="Admit All Pending Commissioners"
        description={`This grants marketplace participation to all ${pending.length} account(s) currently awaiting review, in one action. Each will be notified and become visible on the public marketplace immediately.`}
        actionButtonText={`Admit All ${pending.length}`}
        requireReason={false}
        targetDetails={pending.map((u) => ({ label: u.fullName, value: u.email }))}
      />

    </div>
  );
};
