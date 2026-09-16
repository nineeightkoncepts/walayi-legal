import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CommissioningRequest } from '../../types';
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Download, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  FileCheck2
} from 'lucide-react';

export const DocumentsManagementSection: React.FC = () => {
  const { requests } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CommissioningRequest | null>(null);

  const filteredDocs進 = useMemo(() => {
    return requests.filter(r => {
      // Category filter
      if (categoryFilter !== 'ALL' && r.serviceCategory !== categoryFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // Search query
      const q = searchQuery.toLowerCase();
      return (
        r.certificateNumber.toLowerCase().includes(q) ||
        r.documentTitle.toLowerCase().includes(q) ||
        r.deponentName.toLowerCase().includes(q) ||
        (r.assignedProfessionalName && r.assignedProfessionalName.toLowerCase().includes(q)) ||
        r.documentSha256.toLowerCase().includes(q)
      );
    });
  }, [requests, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-documents-section">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              IMMUTABLE DOCUMENT ARCHIVE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            System Document Management & Legal Hash Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Audit system-wide commissioned instruments, verify cryptographic SHA-256 digests, and inspect statutory jurat compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code font-bold px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            Total Records: {requests.length}
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'All Instruments' },
          { id: 'AFFIDAVIT', label: 'Affidavits (Cap. 5)' },
          { id: 'STATUTORY_DECLARATION', label: 'Statutory Declarations' },
          { id: 'NOTARIAL_DEED', label: 'Notarial Attestations' },
          { id: 'DEED_POLL', label: 'Deed Polls (Name Change)' },
          { id: 'COMMERCIAL_CONTRACT', label: 'Commercial Agreements' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Status Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Certificate #, Hash, Title, Deponent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed / Commissioned</option>
            <option value="ACCEPTED">Accepted / Scheduled</option>
            <option value="CEREMONY_ACTIVE">Ceremony Active</option>
            <option value="PENDING">Pending Assignment</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Certificate ID</th>
                <th className="px-4 py-3 font-semibold">Document Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Deponent</th>
                <th className="px-4 py-3 font-semibold">Presiding Commissioner</th>
                <th className="px-4 py-3 font-semibold">Fee (UGX)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDocs進.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono-code font-bold text-blue-700">{r.certificateNumber}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.documentTitle}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{r.serviceCategory.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="px-4 py-3">{r.deponentName}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.assignedProfessionalName}</td>
                  <td className="px-4 py-3 font-mono-code font-bold text-slate-900">UGX {r.totalAmountUGX.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.status === 'CEREMONY_ACTIVE' || r.status === 'ACCEPTED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedDoc(r)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Inspection Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-xs">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-100 text-blue-800">
                  STATUTORY METADATA INSPECTOR
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1 font-mono-code">
                  {selectedDoc.certificateNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Document Title</span>
                <div className="text-sm font-bold text-slate-900">{selectedDoc.documentTitle}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Deponent:</span>
                  <span className="font-bold text-slate-900">{selectedDoc.deponentName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Commissioner:</span>
                  <span className="font-bold text-slate-900">{selectedDoc.assignedProfessionalName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Ceremony Date:</span>
                  <span className="font-mono-code text-slate-800">{new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Statutory Basis:</span>
                  <span className="font-semibold text-blue-700">Commissioners for Oaths (Cap. 5)</span>
                </div>
              </div>

              {/* SHA-256 Hashes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Cryptographic SHA-256 Root Digest:
                </span>
                <div className="p-3 rounded-xl bg-slate-900 font-mono-code text-[11px] text-emerald-400 break-all select-all border border-slate-800">
                  {selectedDoc.documentSha256}
                </div>
              </div>

              {selectedDoc.finalDocumentSha256 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Final Sealed Document SHA-256:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono-code text-[11px] text-blue-400 break-all select-all border border-slate-800">
                    {selectedDoc.finalDocumentSha256}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
