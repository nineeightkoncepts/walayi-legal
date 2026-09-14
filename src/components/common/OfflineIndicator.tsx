import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside 
      aria-label="Network Status" 
      aria-live="polite" 
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 text-xs font-medium border border-amber-500/40 shadow-xl backdrop-blur-md animate-slideUp" 
      id="pwa-offline-banner"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
      <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div>
        <span className="font-bold text-amber-300">Offline Mode</span>
        <span className="text-slate-300 ml-1.5 text-[11px]">Cached local statutes and drafts available.</span>
      </div>
    </aside>
  );
};
