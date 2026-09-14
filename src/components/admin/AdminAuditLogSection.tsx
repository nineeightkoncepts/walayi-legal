import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Lock, 
  Clock, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  Wallet,
  Scale
} from 'lucide-react';

export const AdminAuditLogSection: React.FC = () => {
  const { adminAuditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = adminAuditLogs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q) ||
      log.adminEmail.toLowerCase().includes(q) ||
      log.targetName.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-audit-logs-section">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-slate-900 text-white">
              APPEND-ONLY AUDIT LEDGER
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              IMMUTABLE RECORD
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Master Administrative Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Every credential approval, refund authorization, dispute ruling, fee adjustment, and account suspension is cryptographically stamped and permanently logged.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code font-bold px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            {adminAuditLogs.length} Total Audit Entries
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, target, actor, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREDENTIAL_APPROVED">Credential Approved</option>
            <option value="CREDENTIAL_REJECTED">Credential Rejected</option>
            <option value="REFUND_ISSUED">Refund Issued</option>
            <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
            <option value="PRACTITIONER_SUSPENDED">Practitioner Suspended</option>
            <option value="PRACTITIONER_REINSTATED">Practitioner Reinstated</option>
            <option value="PLATFORM_FEE_UPDATED">Platform Fee Updated</option>
            <option value="LEGAL_POLICY_UPDATED">Legal Policy Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${
                    log.action.includes('REJECTED') || log.action.includes('SUSPENDED') || log.action.includes('REFUND')
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : log.action.includes('APPROVED') || log.action.includes('REINSTATED')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-900">{log.targetName}</span>
                  <span className="text-slate-400 font-mono-code text-[11px]">({log.targetType}: {log.targetId})</span>
                </div>

                <div className="flex items-center gap-2 font-mono-code text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(log.timestamp).toISOString()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium">Actor: </span>
                  <span className="font-semibold text-slate-800">{log.adminName}</span> ({log.adminEmail})
                </div>
                {log.previousStatus && (
                  <div>
                    <span className="text-slate-500 font-medium">State Transition: </span>
                    <span className="text-rose-700 line-through mr-1">{log.previousStatus}</span>
                    <span className="text-emerald-700 font-bold">→ {log.newStatus}</span>
                  </div>
                )}
                <div className="sm:col-span-3">
                  <span className="text-slate-500 font-medium">Administrative Reason: </span>
                  <span className="italic text-slate-700 font-serif">"{log.reason}"</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
