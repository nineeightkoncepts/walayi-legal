import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, AuthorityType } from '../../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Clock, 
  Award, 
  Video, 
  ChevronRight, 
  CheckCircle, 
  Building,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  Gavel,
  Scale,
  X
} from 'lucide-react';
import { ProfessionalProfileModal } from './ProfessionalProfileModal';
import { UserAvatar } from '../common/UserAvatar';
import { checkCommissionerConflict, ConflictCheckResult } from '../../utils/conflictValidation';

export const MarketplaceView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    setCurrentView, 
    setPreselectedCommissionerId 
  } = useApp();

  const [selectedAuthority, setSelectedAuthority] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileModalUser, setActiveProfileModalUser] = useState<UserProfile | null>(null);

  // Conflict warning modal state
  const [conflictModalData, setConflictModalData] = useState<{
    commissionerName: string;
    ruleViolated?: string;
    reason?: string;
    advice?: string;
  } | null>(null);

  // Professionals are users who are not pure deponents/clients or pure super admins
  const professionals = users.filter(u => 
    u.role === 'commissioner' || 
    u.role === 'notary' || 
    u.role === 'judicial_officer' || 
    u.role === 'justice_of_peace' ||
    (u.authorities && u.authorities.length > 0)
  );

  const filtered = professionals.filter(pro => {
    // Authority type filter
    if (selectedAuthority !== 'ALL') {
      const hasAuth = pro.authorities.some(a => a.type === selectedAuthority && a.status === 'VERIFIED');
      if (!hasAuth && pro.role !== selectedAuthority) return false;
    }

    // City filter
    if (selectedCity !== 'ALL' && !pro.stationCity.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }

    // Availability
    if (onlyAvailableNow && !pro.availableNow) return false;
    if (onlyRemote && !pro.allowsRemote) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pro.fullName.toLowerCase().includes(q);
      const matchFirm = (pro.firmName || pro.lawFirmName)?.toLowerCase().includes(q);
      const matchCourt = pro.court?.toLowerCase().includes(q);
      const matchBio = pro.bio?.toLowerCase().includes(q);
      if (!matchName && !matchFirm && !matchCourt && !matchBio) return false;
    }

    return true;
  });

  // Rank by real-time availability, rating, and experience
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (a.availableNow !== b.availableNow) {
      return a.availableNow ? -1 : 1;
    }
    return (b.rating || 5.0) - (a.rating || 5.0);
  });

  const handleSelectCommissioner = (pro: UserProfile) => {
    const conflict = checkCommissionerConflict({
      currentUser,
      commissioner: pro,
      deponentSelectionType: 'self',
      uploaderFirm: currentUser.firmName || currentUser.lawFirmName,
      isJudicialMatterHandling: false
    });

    if (conflict.hasConflict) {
      setConflictModalData({
        commissionerName: pro.fullName,
        ruleViolated: conflict.ruleViolated,
        reason: conflict.reason,
        advice: conflict.advice
      });
      return;
    }

    setPreselectedCommissionerId(pro.id);
    setCurrentView('new-commissioning');
  };

  return (
    <div className="space-y-6 pb-16" id="marketplace-view-container">
      
      {/* Header & Simplified Search */}
      <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 space-y-6 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0097A7] text-xs font-bold font-mono-code border border-teal-100">
            <Scale className="w-3.5 h-3.5" />
            ETHICAL STATUTORY COMMISSIONING DIRECTORY
          </div>
          <h1 className="text-2xl sm:text-3xl font-display-legal font-black text-[#0D1B3D] uppercase tracking-tight">
            FIND A COMMISSIONER
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search verified legal practitioners available for live statutory commissioning under Cap. 5 Laws of Uganda.
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by Name, City, Firm or Court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-[#0097A7] focus:ring-2 focus:ring-[#0097A7]/10 transition-all"
            id="input-marketplace-search"
          />
        </div>
      </div>

      {/* Practitioner List */}
      <div className="space-y-4">
        {sortedFiltered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm italic">
            No commissioners found matching your search.
          </div>
        ) : (
          sortedFiltered.map((pro) => {
            const conflict = checkCommissionerConflict({
              currentUser,
              commissioner: pro,
              deponentSelectionType: 'self',
              uploaderFirm: currentUser.firmName || currentUser.lawFirmName,
              isJudicialMatterHandling: false
            });

            const hasConflict = conflict.hasConflict;

            return (
              <div
                key={pro.id}
                className={`group bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${
                  hasConflict 
                    ? 'border-amber-200/80 bg-amber-50/20' 
                    : 'border-slate-100 hover:shadow-lg hover:border-[#0097A7]/30'
                }`}
                id={`practitioner-row-${pro.id}`}
              >
                <div 
                  className="flex items-center gap-5 w-full sm:w-auto cursor-pointer"
                  onClick={() => setActiveProfileModalUser(pro)}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={pro.avatarUrl || null}
                      name={pro.fullName}
                      size="lg"
                      shape="rounded"
                      className="border border-slate-100 shadow-sm"
                    />
                    {pro.availableNow && !hasConflict && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-tight truncate">
                        {pro.fullName}
                      </h3>
                      {hasConflict && (
                        <span className="text-[9px] font-mono-code font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          CONFLICT DETECTED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
                      <span className="text-[10px] font-black text-[#0097A7] uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">
                        {pro.isJudicialOfficer || pro.professionalCategory === 'judicial_officer'
                          ? `Judicial Officer • ${pro.judicialTitle || 'Magistrate'}`
                          : pro.professionalCategory === 'justice_of_the_peace'
                            ? 'Justice of the Peace'
                            : pro.professionalCategory === 'notary_public'
                              ? 'Notary Public'
                              : 'Commissioner for Oaths • Advocate'}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {pro.stationCity}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                      {(pro.firmName || pro.lawFirmName) && (
                        <span className="flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          {pro.firmName || pro.lawFirmName}
                        </span>
                      )}
                      {pro.court && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Gavel className="w-3 h-3 text-amber-500" />
                          {pro.court}
                        </span>
                      )}
                    </div>

                    {hasConflict && (
                      <p className="text-[10px] font-bold text-amber-800 mt-1">
                        {conflict.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="text-right hidden sm:block mr-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee</div>
                    <div className="text-sm font-black text-slate-900 font-mono-code">
                      UGX {pro.indicativeFeeUGX.toLocaleString()}
                    </div>
                  </div>
                  
                  {hasConflict ? (
                    <button
                      onClick={() => handleSelectCommissioner(pro)}
                      className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                      id={`btn-conflict-notice-${pro.id}`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      CONFLICT NOTICE
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectCommissioner(pro)}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                      id={`btn-commission-${pro.id}`}
                    >
                      COMMISSION MY DOCUMENT
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Profile & Credential Proof Modal */}
      {activeProfileModalUser && (
        <ProfessionalProfileModal
          user={activeProfileModalUser}
          onClose={() => setActiveProfileModalUser(null)}
          onSelectForCommission={() => {
            const chosen = activeProfileModalUser;
            setActiveProfileModalUser(null);
            handleSelectCommissioner(chosen);
          }}
        />
      )}

      {/* Conflict Explanation Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="marketplace-conflict-modal">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 animate-fadeIn">
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-700">
                    Statutory Ethical Guard
                  </span>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    Conflict of Interest Detected
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-950">
                {conflictModalData.reason}
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {conflictModalData.advice}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900">Legal Provisions Enforced:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>Commissioners for Oaths (Advocates) Act, Cap. 5</li>
                <li>Advocates (Professional Conduct and Etiquette) Regulations</li>
                <li>Uganda Code of Judicial Conduct</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setConflictModalData(null)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Select Another Independent Commissioner
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
