import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download } from 'lucide-react';
import { PWAInstallModal } from '../common/PWAInstallModal';

export const Footer: React.FC = () => {
  const { setCurrentView } = useApp();
  const [showPwaModal, setShowPwaModal] = useState(false);

  return (
    <footer className="w-full border-t border-slate-200 bg-white/90 backdrop-blur-sm text-slate-500 py-4 px-4 sm:px-6 lg:px-8 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">

        {/* Approved brand logos — subordinate in size to the application itself */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <img
            src="/assets/brand/walayi-logo.jpg"
            alt="WALAYI — Sworn. Witnessed. Sealed."
            className="h-5 sm:h-6 w-auto object-contain"
          />
          <span className="text-slate-300">•</span>
          <img
            src="/assets/brand/enen-digital-labs-logo.png"
            alt="Enen Digital Labs"
            className="h-5 sm:h-6 w-auto object-contain"
          />
        </div>

        {/* Legal links, install badge & attribution */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-500 font-mono-code">
          <button
            type="button"
            onClick={() => setCurrentView('privacy')}
            className="font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            id="btn-footer-privacy-notice"
          >
            Privacy Notice
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setCurrentView('terms')}
            className="font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            id="btn-footer-terms-conditions"
          >
            Terms and Conditions
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition-colors cursor-pointer"
            id="btn-footer-pwa-modal"
          >
            <Download className="w-3 h-3 text-[#0097A7]" />
            <span>Install app</span>
          </button>
          <span>•</span>
          <span>© 2026 WALAYI</span>
        </div>

      </div>

      {showPwaModal && (
        <PWAInstallModal
          isOpen={showPwaModal}
          onClose={() => setShowPwaModal(false)}
        />
      )}
    </footer>
  );
};
