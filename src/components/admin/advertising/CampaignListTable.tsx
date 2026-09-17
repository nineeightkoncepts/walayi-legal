import React, { useState } from 'react';
import { Advertisement, AdStatus } from '../../../types/advertising';
import { AdService } from '../../../services/adService';
import { useApp } from '../../../context/AppContext';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  PlayCircle, 
  Calendar, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Eye,
  MousePointer,
  Sparkles,
  AlertTriangle,
  Tag,
  Clock
} from 'lucide-react';

interface CampaignListTableProps {
  campaigns: Advertisement[];
  onEditAd: (ad: Advertisement) => void;
  onRefresh: () => void;
}

export const CampaignListTable: React.FC<CampaignListTableProps> = ({
  campaigns,
  onEditAd,
  onRefresh
}) => {
  const { currentUser } = useApp();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Dialog Modals State
  const [actionTargetAd, setActionTargetAd] = useState<Advertisement | null>(null);
  const [actionType, setActionType] = useState<'REJECT' | 'SUSPEND' | 'SCHEDULE' | 'DELETE' | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Filter Logic
  const filteredCampaigns = campaigns.filter(ad => {
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'ACTIVE') {
        if (ad.status !== 'LIVE' && ad.status !== 'APPROVED') return false;
      } else if (ad.status !== selectedStatus) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ad.campaignName.toLowerCase().includes(q);
      const matchAdv = ad.advertiserName.toLowerCase().includes(q);
      const matchType = ad.advertisementType.toLowerCase().includes(q);
      const matchPlacement = ad.placement.toLowerCase().includes(q);
      if (!matchName && !matchAdv && !matchType && !matchPlacement) return false;
    }

    return true;
  });

  const handleApprove = (ad: Advertisement) => {
    AdService.approveAd(ad.id, currentUser.email, currentUser.fullName);
    onRefresh();
  };

  const handleReactivate = (ad: Advertisement) => {
    AdService.reactivateAd(ad.id, currentUser.email, currentUser.fullName);
    onRefresh();
  };

  const handleConfirmAction = () => {
    if (!actionTargetAd || !actionType) return;

    if (actionType === 'REJECT') {
      AdService.rejectAd(actionTargetAd.id, reasonInput || 'Policy non-compliance', currentUser.email, currentUser.fullName);
    } else if (actionType === 'SUSPEND') {
      AdService.suspendAd(actionTargetAd.id, reasonInput || 'Administrative hold', currentUser.email, currentUser.fullName);
    } else if (actionType === 'SCHEDULE') {
      AdService.scheduleAd(actionTargetAd.id, newStartDate, newEndDate, currentUser.email, currentUser.fullName);
    } else if (actionType === 'DELETE') {
      AdService.deleteAd(actionTargetAd.id, currentUser.email, currentUser.fullName);
    }

    setActionTargetAd(null);
    setActionType(null);
    setReasonInput('');
    onRefresh();
  };

  const getStatusBadge = (status: AdStatus) => {
    switch (status) {
      case 'LIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />LIVE</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-100 text-blue-800 border border-blue-300 w-fit">APPROVED</span>;
      case 'SCHEDULED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 w-fit">SCHEDULED</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">PENDING REVIEW</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-slate-100 text-slate-700 border border-slate-300 w-fit">DRAFT</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-red-100 text-red-800 border border-red-300 w-fit">SUSPENDED</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-slate-200 text-slate-700 border border-slate-300 w-fit">EXPIRED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-rose-100 text-rose-800 border border-rose-300 w-fit">REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-4" id="campaign-list-table-container">
      
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Status Pill Filters */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: `All (${campaigns.length})` },
            { id: 'LIVE', label: 'Live' },
            { id: 'PENDING_REVIEW', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'SUSPENDED', label: 'Suspended' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              id={`filter-ad-status-${tab.id.toLowerCase()}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns, advertisers..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            id="input-search-campaigns"
          />
        </div>

      </div>

      {/* Campaign Directory Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Campaign & Creative</th>
                <th className="px-3 py-3 font-semibold">Type & Placement</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Schedule</th>
                <th className="px-3 py-3 font-semibold text-right">Performance</th>
                <th className="px-4 py-3 font-semibold text-right">Master Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No advertisement campaigns found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors" id={`row-ad-${ad.id}`}>
                      
                      {/* Campaign & Creative */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {ad.imageUrl && ad.imageUrl.trim().length > 0 ? (
                              <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Tag className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 max-w-[220px]">
                            <div className="font-bold text-slate-900 truncate" title={ad.campaignName}>
                              {ad.campaignName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-code truncate">
                              {ad.advertiserName}
                            </div>
                            <div className="text-[10px] text-blue-600 truncate flex items-center gap-1 mt-0.5">
                              <span>Priority: {ad.priority}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Placement */}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-slate-100 text-slate-700 border border-slate-200 capitalize inline-block">
                            {ad.advertisementType.replace(/_/g, ' ')}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono-code">
                            Slot: {ad.placement.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          {getStatusBadge(ad.status)}
                          {ad.suspensionReason && (
                            <div className="text-[10px] text-red-600 max-w-[150px] truncate" title={ad.suspensionReason}>
                              Note: {ad.suspensionReason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-3 py-3 font-mono-code text-[11px] text-slate-600">
                        <div>From: <strong className="text-slate-800">{ad.startDate}</strong></div>
                        <div>To: <strong className="text-slate-800">{ad.endDate}</strong></div>
                      </td>

                      {/* Performance */}
                      <td className="px-3 py-3 text-right font-mono-code text-[11px]">
                        <div className="flex items-center justify-end gap-1 text-slate-900 font-bold">
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>{ad.impressions.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-blue-700">
                          <MousePointer className="w-3 h-3 text-blue-400" />
                          <span>{ad.clicks.toLocaleString()} clicks ({ctr}%)</span>
                        </div>
                        {ad.leads > 0 && (
                          <div className="text-[10px] text-emerald-700 font-bold">
                            {ad.leads} leads
                          </div>
                        )}
                      </td>

                      {/* Master Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Approve Action */}
                          {(ad.status === 'PENDING_REVIEW' || ad.status === 'DRAFT') && (
                            <button
                              onClick={() => handleApprove(ad)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Approve Campaign"
                              id={`btn-approve-ad-${ad.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject Action */}
                          {ad.status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => {
                                setActionTargetAd(ad);
                                setActionType('REJECT');
                                setReasonInput('');
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Reject Campaign"
                              id={`btn-reject-ad-${ad.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Suspend Action */}
                          {(ad.status === 'LIVE' || ad.status === 'APPROVED') && (
                            <button
                              onClick={() => {
                                setActionTargetAd(ad);
                                setActionType('SUSPEND');
                                setReasonInput('');
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Suspend Campaign"
                              id={`btn-suspend-ad-${ad.id}`}
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reactivate Action */}
                          {ad.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleReactivate(ad)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Reactivate Campaign"
                              id={`btn-reactivate-ad-${ad.id}`}
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Schedule Dates Modal Trigger */}
                          <button
                            onClick={() => {
                              setActionTargetAd(ad);
                              setActionType('SCHEDULE');
                              setNewStartDate(ad.startDate);
                              setNewEndDate(ad.endDate);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Reschedule Duration"
                            id={`btn-reschedule-ad-${ad.id}`}
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Edit Modal Trigger */}
                          <button
                            onClick={() => onEditAd(ad)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Edit Campaign Details"
                            id={`btn-edit-ad-${ad.id}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Action */}
                          <button
                            onClick={() => {
                              setActionTargetAd(ad);
                              setActionType('DELETE');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Campaign"
                            id={`btn-delete-ad-${ad.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Prompt Modal for Actions */}
      {actionTargetAd && actionType && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 m-auto">
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-display-legal font-bold text-base text-slate-900">
                {actionType === 'REJECT' && 'Reject Advertisement Campaign'}
                {actionType === 'SUSPEND' && 'Suspend Advertisement Campaign'}
                {actionType === 'SCHEDULE' && 'Update Campaign Schedule'}
                {actionType === 'DELETE' && 'Confirm Delete Campaign'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Target: <strong className="text-slate-900">{actionTargetAd.campaignName}</strong> ({actionTargetAd.advertiserName})
            </p>

            {/* Input reason for Reject or Suspend */}
            {(actionType === 'REJECT' || actionType === 'SUSPEND') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Statutory Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="State the reason for this administrative decision..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="textarea-action-reason"
                />
              </div>
            )}

            {/* Date inputs for Schedule */}
            {actionType === 'SCHEDULE' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-code focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Delete notice */}
            {actionType === 'DELETE' && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                Warning: This will permanently remove the advertisement from the database and record an audit log event.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionTargetAd(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer ${
                  actionType === 'DELETE' || actionType === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                id="btn-confirm-action-submit"
              >
                Confirm {actionType}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
