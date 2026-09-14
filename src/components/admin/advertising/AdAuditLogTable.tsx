import React, { useState } from 'react';
import { AdAuditLog, AdAuditAction } from '../../../types/advertising';
import { AdService } from '../../../services/adService';
import { ShieldCheck, Clock, User, AlertTriangle, Filter, Search } from 'lucide-react';

interface AdAuditLogTableProps {
  logs: AdAuditLog[];
}

export const AdAuditLogTable: React.FC<AdAuditLogTableProps> = ({ logs }) => {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAdmin = log.adminEmail.toLowerCase().includes(q) || log.adminName.toLowerCase().includes(q);
      const matchCampaign = log.campaignName?.toLowerCase().includes(q) || false;
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAdmin && !matchCampaign && !matchDetails) return false;
    }
    return true;
  });

  const getActionBadge = (action: AdAuditAction) => {
    switch (action) {
      case 'GLOBAL_KILL_SWITCH_TOGGLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-red-100 text-red-900 border border-red-300">KILL SWITCH</span>;
      case 'APPROVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">APPROVE</span>;
      case 'REJECT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-rose-100 text-rose-900 border border-rose-300">REJECT</span>;
      case 'SUSPEND':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-100 text-amber-900 border border-amber-300">SUSPEND</span>;
      case 'REACTIVATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-100 text-blue-900 border border-blue-300">REACTIVATE</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-purple-100 text-purple-900 border border-purple-300">CREATE</span>;
      case 'ADMOB_TOGGLE':
      case 'ADMOB_CONFIG_UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">ADMOB</span>;
      case 'DIRECT_ADS_TOGGLE':
      case 'PLACEMENT_TOGGLE':
      case 'SPONSORED_PROS_TOGGLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-slate-100 text-slate-800 border border-slate-300">TOGGLE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-4" id="ad-audit-log-table-root">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Advertising Governance Audit Trail</h4>
          <p className="text-xs text-slate-500">Immutable record of every commercial decision, kill-switch toggle, and campaign approval.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-code"
          >
            <option value="ALL">All Actions</option>
            <option value="GLOBAL_KILL_SWITCH_TOGGLE">Kill Switch</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="SUSPEND">Suspend</option>
            <option value="REACTIVATE">Reactivate</option>
            <option value="CREATE">Create</option>
            <option value="ADMOB_CONFIG_UPDATE">AdMob Config</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-3 py-3 font-semibold">Admin Account</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Campaign / Target</th>
                <th className="px-4 py-3 font-semibold">Action Summary & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No advertising audit logs match your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const dateFormatted = new Date(log.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono-code text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.adminName}</div>
                        <div className="text-[10px] font-mono-code text-slate-400">{log.adminEmail}</div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="px-3 py-3 font-medium text-slate-800">
                        {log.campaignName ? (
                          <span className="font-bold text-slate-900">{log.campaignName}</span>
                        ) : (
                          <span className="text-slate-400 font-mono-code">Global Config</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs leading-relaxed max-w-md">
                        <div className="text-slate-700">{log.details}</div>
                        {log.reason && (
                          <div className="text-[11px] text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded mt-1 w-fit border border-amber-200">
                            Reason: {log.reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
