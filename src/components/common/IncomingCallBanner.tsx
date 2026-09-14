import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isCommissionerLike } from '../../services/roleService';

// App-wide "you're being called" indicator. DailyCommissioningRoom already
// shows a full-screen ringing UI, but only once it's mounted for the exact
// request being called — which requires the user to have already navigated
// there. This banner is always mounted, so it's what actually lets the
// counterpart (whichever role) learn about the call and jump into the room
// no matter what screen they're currently on.
export const IncomingCallBanner: React.FC = () => {
  const {
    currentUser,
    requests,
    activeCommissioningId,
    currentView,
    setActiveCommissioningId,
    setCurrentView
  } = useApp();

  const myRole: 'deponent' | 'commissioner' = isCommissionerLike(currentUser.role) ? 'commissioner' : 'deponent';

  const incoming = requests.find(r => {
    const isMine = myRole === 'commissioner'
      ? r.commissionerId === currentUser.id
      : r.deponentUserId === currentUser.id;
    return isMine && r.liveCallState === 'RINGING' && !!r.callInitiatedByRole && r.callInitiatedByRole !== myRole;
  });

  const alreadyOpenInRoom = currentView === 'room' && activeCommissioningId === incoming?.id;

  if (!incoming || alreadyOpenInRoom) return null;

  const callerName = incoming.callInitiatedByName
    || (myRole === 'commissioner' ? incoming.deponentName : incoming.assignedProfessionalName)
    || 'the other party';

  const handleJoin = () => {
    setActiveCommissioningId(incoming.id);
    setCurrentView('room');
  };

  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none" id="incoming-call-banner">
      <button
        type="button"
        onClick={handleJoin}
        className="pointer-events-auto flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl transition-colors animate-slideUp"
        id="btn-incoming-call-banner"
      >
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <PhoneCall className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-semibold">
          Incoming statutory call from {callerName} — tap to join
        </span>
      </button>
    </div>
  );
};
