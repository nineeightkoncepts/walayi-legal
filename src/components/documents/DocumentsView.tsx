import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommissioningRequest } from '../../types';
import {
  FileText,
  ShieldCheck,
  Download,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Lock,
  QrCode,
  Layers,
  Trash2,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { AuditCertificateModal } from '../common/AuditCertificateModal';
import { downloadCertifiedInstrumentPdf } from '../../services/pdfService';

// Maps the many granular CommissioningRequest statuses onto the five
// stages the brief requires My Documents to show clearly.
const toDisplayStatus = (status: string): string => {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'DRAFT') return 'Draft';
  if (['SUBMITTED', 'PAYMENT_PENDING'].includes(status)) return 'Ready to Commission';
  if (['PAID', 'PROFESSIONAL_SELECTED'].includes(status)) return 'Awaiting Commissioner';
  if ([
    'ACCEPTED', 'DOCUMENT_REVIEW', 'ANNEXURES_REVIEW', 'DOCUMENT_LOCKED',
    'CEREMONY_SCHEDULED', 'CEREMONY_ACTIVE', 'OATH_ADMINISTERED', 'SIGNING',
    'COMMISSIONED', 'VERIFIED', 'DELIVERED'
  ].includes(status)) return 'In Progress';
  return status.replace(/_/g, ' ');
};

export const DocumentsView: React.FC = () => {
  const {
    requests,
    currentUser,
    setActiveCommissioningId,
    setCurrentView,
    drafts,
    setActiveDraftId,
    deleteDraftDocument
  } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<CommissioningRequest | null>(null);
  const [selectedTab, setSelectedTab] = useState<'instrument' | 'audit'>('instrument');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [draftPendingDeletion, setDraftPendingDeletion] = useState<string | null>(null);

  const myRequests = requests.filter(req => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'deponent') return req.deponentUserId === currentUser.id || req.deponentName.includes(currentUser.fullName);
    return req.assignedProfessionalId === currentUser.id || req.assignedProfessionalName?.includes(currentUser.fullName) || req.deponentUserId === currentUser.id;
  });

  const filtered = myRequests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.documentTitle.toLowerCase().includes(q);
      const matchCert = req.certificateNumber.toLowerCase().includes(q);
      const matchDeponent = req.deponentName.toLowerCase().includes(q);
      if (!matchTitle && !matchCert && !matchDeponent) return false;
    }
    return true;
  });

  const handleResumeDraft = (draftId: string) => {
    setActiveDraftId(draftId);
    setCurrentView('new-commissioning');
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraftDocument(draftId);
    setDraftPendingDeletion(null);
  };

  return (
    <div className="space-y-6 pb-16" id="documents-view-container">
      
      {/* Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono-code bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <FileText className="w-3.5 h-3.5" />
            INSTRUMENT REPOSITORY & JURAT REGISTRY
          </div>
          <h1 className="text-2xl font-display-legal font-bold text-slate-900">
            My Documents & Commissioning Records
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Inspect sworn affidavits, statutory declarations, cryptographic audit trails, and independently verifiable commissioning certificates.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveDraftId(null);
            setCurrentView('new-commissioning');
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition-colors"
          id="btn-doc-new-commission"
        >
          Commission New Instrument
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, certificate number, or deponent name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-blue-500 shadow-xs"
        >
          <option value="ALL">All Statuses ({myRequests.length})</option>
          <option value="COMPLETED">Completed</option>
          <option value="ACCEPTED">In Progress</option>
          <option value="PAID">Awaiting Commissioner</option>
        </select>
      </div>

      {/* Saved Drafts — uploaded but not yet submitted to a Commissioner */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Saved Drafts ({drafts.length})
          </h2>
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                id={`draft-row-${draft.id}`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-300">
                      {draft.status === 'READY_TO_COMMISSION' ? 'Ready to Commission' : 'Draft'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saved {new Date(draft.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {draft.documentTitle || draft.fileName || 'Untitled Draft'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{draft.fileName}</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setDraftPendingDeletion(draft.id)}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    id={`btn-delete-draft-${draft.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    onClick={() => handleResumeDraft(draft.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    id={`btn-resume-draft-${draft.id}`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Resume
                  </button>
                </div>

                {draftPendingDeletion === draft.id && (
                  <div className="w-full mt-2 p-3 rounded-xl bg-white border border-rose-200 space-y-2">
                    <p className="text-[11px] text-rose-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Delete this draft permanently? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setDraftPendingDeletion(null)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                        id={`btn-confirm-delete-draft-${draft.id}`}
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
            id={`doc-row-${req.id}`}
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono-code text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {req.certificateNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  req.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : req.status === 'ACCEPTED' || req.status === 'CEREMONY_ACTIVE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {toDisplayStatus(req.status || '')}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 truncate">
                {req.documentTitle}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Deponent: <strong className="text-slate-800">{req.deponentName}</strong></span>
                <span>•</span>
                <span>Commissioner: <strong className="text-slate-800">{req.assignedProfessionalName || 'Not yet assigned'}</strong></span>
                <span>•</span>
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono-code text-slate-400 truncate max-w-md pt-1">
                <Lock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">SHA-256: {req.documentSha256}</span>
              </div>
            </div>

            {/* Actions Stack */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              
              {req.status === 'COMPLETED' ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedTab('audit');
                      setSelectedDoc(req);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                    id={`btn-view-audit-${req.id}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Audit Certificate
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await downloadCertifiedInstrumentPdf(req);
                      } catch (e) {
                        setSelectedTab('instrument');
                        setSelectedDoc(req);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    id={`btn-download-pdf-${req.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setActiveCommissioningId(req.id);
                    setCurrentView('room');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  id={`btn-enter-room-${req.id}`}
                >
                  <Video className="w-4 h-4" />
                  Enter Ceremony Room
                </button>
              )}

            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing Certified Legal Instrument & Audit Certificate */}
      {selectedDoc && (
        <AuditCertificateModal
          request={selectedDoc}
          initialTab={selectedTab}
          onClose={() => setSelectedDoc(null)}
        />
      )}

    </div>
  );
};
