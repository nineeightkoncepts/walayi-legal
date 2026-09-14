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
  Layers
} from 'lucide-react';
import { AuditCertificateModal } from '../common/AuditCertificateModal';
import { downloadCertifiedInstrumentPdf } from '../../services/pdfService';

export const DocumentsView: React.FC = () => {
  const { requests, currentUser, setActiveCommissioningId, setCurrentView } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<CommissioningRequest | null>(null);
  const [selectedTab, setSelectedTab] = useState<'instrument' | 'audit'>('instrument');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
            Inspect sworn affidavits, statutory declarations, cryptographic audit trails, and certificates ready for ECCMIS filing.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('new-commissioning')}
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
          <option value="COMPLETED">Completed & Sealed</option>
          <option value="ACCEPTED">In Ceremony / Active</option>
          <option value="PAID">Paid / Escrowed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

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
                  {(req.status || '').replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 truncate">
                {req.documentTitle}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Deponent: <strong className="text-slate-800">{req.deponentName}</strong></span>
                <span>•</span>
                <span>Commissioner: <strong className="text-slate-800">{req.assignedProfessionalName || 'Adv. Kajubi Lovelock'}</strong></span>
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
