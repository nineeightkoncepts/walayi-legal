import React from 'react';
import { UserProfile } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Building, 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Award, 
  Video, 
  Lock,
  Phone,
  Mail,
  ChevronRight,
  Gavel,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { INITIAL_REVIEWS } from '../../data/mockData';
import { checkCommissionerConflict } from '../../utils/conflictValidation';
import { UserAvatar } from '../common/UserAvatar';
import { isUserOnline, formatLastSeen } from '../../services/presenceService';

interface ProfessionalProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onSelectForCommission: () => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  user,
  onClose,
  onSelectForCommission
}) => {
  const { currentUser, credentialDocs } = useApp();
  const docs = credentialDocs[user.id] || [];
  const reviews = INITIAL_REVIEWS.filter(r => r.professionalId === user.id);

  const conflict = checkCommissionerConflict({
    currentUser,
    commissioner: user,
    deponentSelectionType: 'self',
    uploaderFirm: currentUser.firmName || currentUser.lawFirmName,
    isJudicialMatterHandling: false
  });

  return (
    <div className="fixed inset-0 z-50 flex p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" id="professional-profile-modal">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden m-auto text-slate-900">
        
        {/* Modal Top Header */}
        <div className="relative p-6 bg-slate-50 border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            id="btn-close-pro-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <UserAvatar
                src={user.avatarUrl || null}
                name={user.fullName}
                size="xl"
                shape="rounded"
                className="border-2 border-blue-600 shadow-sm"
              />
              {isUserOnline(user.lastActiveAt) && !conflict.hasConflict && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online now" />
              )}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
                {user.isProSubscriber && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    PRO
                  </span>
                )}
                {conflict.hasConflict && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    ETHICAL CONFLICT
                  </span>
                )}
              </div>

              <div className="text-xs text-[#0097A7] font-bold flex flex-wrap items-center justify-center sm:justify-start gap-1">
                {user.isJudicialOfficer || user.professionalCategory === 'judicial_officer'
                  ? `Judicial Officer • ${user.judicialTitle || 'Magistrate'}`
                  : user.professionalCategory === 'justice_of_the_peace'
                    ? 'Justice of the Peace'
                    : user.professionalCategory === 'notary_public'
                      ? 'Notary Public'
                      : 'Commissioner for Oaths • Advocate'}
              </div>

              {(user.firmName || user.lawFirmName) && (
                <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {user.firmName || user.lawFirmName}
                </p>
              )}

              {user.court && (
                <p className="text-xs text-amber-800 flex items-center justify-center sm:justify-start gap-1">
                  <Gavel className="w-3.5 h-3.5 text-amber-600" />
                  {user.court}
                </p>
              )}

              <p className="text-xs text-blue-600 font-medium flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {user.physicalChambersAddress || user.stationCity}
              </p>

              <p className={`text-xs font-bold flex items-center justify-center sm:justify-start gap-1.5 ${
                isUserOnline(user.lastActiveAt) ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isUserOnline(user.lastActiveAt) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {formatLastSeen(user.lastActiveAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Conflict Banner if conflict exists */}
          {conflict.hasConflict && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5" id="pro-modal-conflict-banner">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Statutory Ethical Safeguard Alert</span>
              </div>
              <p className="text-xs text-amber-900">
                {conflict.reason}
              </p>
              <p className="text-[11px] text-amber-800 italic">
                {conflict.advice}
              </p>
            </div>
          )}

          {/* Statutory Authorities Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Legal Authorities
            </h3>

            <div className="space-y-2">
              {user.authorities.map((auth, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {auth.type === 'commissioner_for_oaths' ? 'Commissioner for Oaths' :
                         auth.type === 'notary_public' ? 'Notary Public' :
                         auth.type === 'judicial_officer' ? 'Judicial Officer (Magistrate / Registrar)' :
                         auth.type === 'justice_of_the_peace' ? 'Justice of the Peace' : 'Advocate of High Court'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        VERIFIED
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      {auth.basis === 'COMMISSIONER_ACT_CAP_5' ? 'Appointed under Commissioners for Oaths (Advocates) Act, Cap. 5' :
                       auth.basis === 'NOTARIES_PUBLIC_ACT' ? 'Enrolled under Notaries Public Act, Cap. 18' :
                       auth.basis === 'JUDICIAL_OFFICE' ? 'Authority derived ex-officio from Judicial Office (Magistrates Courts Act)' :
                       auth.basis === 'JUSTICES_OF_PEACE_ACT' ? 'Gazetted under Justices of the Peace Act, Cap. 15' : 'Advocates Act'}
                    </div>

                    {auth.licenceNumber && (
                      <div className="text-[11px] font-mono-code text-blue-700 font-semibold">
                        Warrant / Licence Ref: {auth.licenceNumber}
                      </div>
                    )}
                    {auth.courtStation && (
                      <div className="text-[11px] text-slate-500">
                        Station: {auth.courtStation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practitioner Bio */}
          {user.bio && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono-code">
                Professional Background
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {user.bio}
              </p>
            </div>
          )}

          {/* Deponent Reviews */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Deponent Feedback & Ratings
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-2">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{rev.clientName}</span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        {'★'.repeat(rev.rating)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                    <div className="text-[10px] text-slate-400">{rev.serviceType} • {rev.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                Deponents consistently award 5-star ratings for punctuality and statutory clarity.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Indicative Fee:</span>
            <div className="text-base font-mono-code font-bold text-slate-900">
              UGX {user.indicativeFeeUGX.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {conflict.hasConflict ? (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                title={conflict.reason}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Conflict of Interest (Disabled)
              </button>
            ) : (
              <button
                onClick={onSelectForCommission}
                className="px-5 py-2.5 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                id="btn-confirm-select-pro"
              >
                Commission with {user.fullName.split(' ')[0]}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
