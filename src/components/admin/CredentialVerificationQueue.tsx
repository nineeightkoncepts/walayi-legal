import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CredentialDocument, AuthorityType } from '../../types';
import { SecurityConfirmationModal } from './SecurityConfirmationModal';
import { UserAvatar } from '../common/UserAvatar';
import { 
  ShieldCheck, 
  FileText, 
  Check, 
  X, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Lock,
  Scale,
  Building
} from 'lucide-react';

export const CredentialVerificationQueue: React.FC = () => {
  const { credentialDocs, users, reviewCredentialDocument, addNotification } = useApp();

  const [selectedDoc, setSelectedDoc] = useState<{ userId: string; doc: CredentialDocument } | null>(null);
  
  // Security Modal state for Rejections
  const [rejectTarget, setRejectTarget] = useState<{ userId: string; doc: CredentialDocument } | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Flatten all documents with associated user info
  const allDocs: { user: typeof users[0]; doc: CredentialDocument }[] = [];
  Object.entries(credentialDocs).forEach(([userId, docs]) => {
    const user = users.find(u => u.id === userId);
    if (user && Array.isArray(docs)) {
      (docs as CredentialDocument[]).forEach((doc: CredentialDocument) => {
        allDocs.push({ user, doc });
      });
    }
  });

  const pendingDocs = allDocs.filter(d => d.doc.status === 'PENDING');
  const verifiedDocs = allDocs.filter(d => d.doc.status === 'VERIFIED');
  const rejectedDocs = allDocs.filter(d => d.doc.status === 'REJECTED');

  const [activeSubTab, setActiveSubTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');

  const handleApprove = (userId: string, docId: string, authType?: AuthorityType) => {
    const authority = authType || 'commissioner_for_oaths';
    reviewCredentialDocument(userId, docId, 'VERIFIED', authority, 'Practitioner warrant verified against Law Council Roll.');
    addNotification('Credential Approved', `Document verified for ${authority.replace(/_/g, ' ')}.`, 'SUCCESS');
    setSelectedDoc(null);
  };

  const handleOpenRejectModal = (userId: string, doc: CredentialDocument) => {
    setRejectTarget({ userId, doc });
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectTarget) {
      reviewCredentialDocument(
        rejectTarget.userId,
        rejectTarget.doc.id,
        'REJECTED',
        rejectTarget.doc.authorityType || 'commissioner_for_oaths',
        reason
      );
      setRejectTarget(null);
      setSelectedDoc(null);
    }
  };

  const displayedDocs = activeSubTab === 'PENDING' ? pendingDocs : activeSubTab === 'VERIFIED' ? verifiedDocs : rejectedDocs;

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-verification-queue">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
              STATUTORY CREDENTIAL DESK
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              CHIEF JUSTICE COMMISSION AUDIT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Credential Verification & Warrant Review Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Examine uploaded statutory instruments, practising certificates, and Law Council enrollment certificates before granting marketplace access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl font-mono-code font-bold text-xs ${
            pendingDocs.length > 0
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {pendingDocs.length} Pending Actions
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Review Queue ({pendingDocs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('VERIFIED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'VERIFIED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Verified Documents ({verifiedDocs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'REJECTED'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected Submissions ({rejectedDocs.length})
        </button>
      </div>

      {/* Queue Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedDocs.map(({ user, doc }) => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar src={user.avatarUrl || null} name={user.fullName} size="md" shape="rounded" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{user.fullName}</h3>
                  <p className="text-xs text-slate-500">{user.lawFirmName || user.stationCity} • {user.email}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold border ${
                doc.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : doc.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {doc.status}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Document Title:</span>
                <span className="font-bold text-slate-900">{doc.title || doc.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Target Authority:</span>
                <span className="font-bold text-blue-700 capitalize">{(doc.authorityType || doc.type || 'commissioner_for_oaths').replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Licence / Ref #:</span>
                <span className="font-mono-code font-bold text-slate-800">{doc.licenseNumber || doc.verificationReference || 'PENDING_AUDIT'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Uploaded Date:</span>
                <span className="font-mono-code text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedDoc({ userId: user.id, doc })}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Examine Instrument
              </button>

              {doc.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(user.id, doc.id, doc.authorityType)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(user.id, doc)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Inspector & Statutory Checklist Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden text-xs max-h-[90vh] flex flex-col m-auto">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-100 text-blue-800">
                  STATUTORY CREDENTIAL INSPECTOR
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedDoc.doc.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Illustrative layout only — not a rendering of the uploaded document */}
              <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 text-center space-y-3">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono-code font-bold bg-amber-200/70 text-amber-900 uppercase tracking-wider">
                  Sample layout — inspect the actual uploaded file separately
                </span>
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display-legal font-bold text-base text-slate-900 uppercase">
                    Practitioner Warrant / Credential
                  </h4>
                  <p className="text-[11px] text-slate-500 font-serif">
                    Statutory basis and appointing authority as declared by the practitioner
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-100 font-mono-code text-[11px] text-slate-800">
                  Declared licence / reference: {selectedDoc.doc.licenseNumber || 'Not provided'}
                </div>
              </div>

              {/* Statutory verification checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Before approving, manually confirm:
                </div>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>The Chief Justice Commission seal and signature on the uploaded document are genuine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>The practising certificate is current and checked against the Law Council roll</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>The High Court roll number is checked against the Uganda Gazette</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  WALAYI does not automatically verify these against any external register — this remains a manual review step.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>

              {selectedDoc.doc.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRejectModal(selectedDoc.userId, selectedDoc.doc)}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reject Credential
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoc.userId, selectedDoc.doc.id, selectedDoc.doc.authorityType)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Authorize & Approve
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Security Confirmation Modal for Rejections */}
      <SecurityConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        title="Reject Practitioner Credential"
        description="Provide a formal reason for rejecting this legal instrument. The practitioner will receive an official notification and be required to re-upload."
        actionButtonText="Confirm Rejection"
        isDestructive={true}
        targetDetails={rejectTarget ? [
          { label: 'Document', value: rejectTarget.doc.title },
          { label: 'Authority', value: rejectTarget.doc.authorityType }
        ] : []}
      />

    </div>
  );
};
