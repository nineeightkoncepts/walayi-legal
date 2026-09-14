import React from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Home } from 'lucide-react';

export const AccessDenied: React.FC<{ featureName?: string }> = ({
  featureName = 'this feature',
}) => {
  const { setCurrentView, currentUser } = useApp();

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-4 inline-block p-4 rounded-full bg-rose-100">
          <Lock className="w-8 h-8 text-rose-600" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
          Access Denied
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your account role (<strong>{currentUser.role}</strong>) does not have access to {featureName}.
        </p>

        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 mb-6 text-left">
          <p className="text-xs font-semibold text-slate-700 mb-1">Your role:</p>
          <p className="text-xs text-slate-600 font-mono uppercase">{currentUser.role}</p>
        </div>

        <button
          onClick={() => setCurrentView('home')}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </button>
      </div>
    </main>
  );
};
