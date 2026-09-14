import React, { useState } from 'react';
import { Scale, Sparkles, Award, ShieldCheck, Smartphone, Apple, Globe, Download } from 'lucide-react';
import { PWAInstallModal } from '../common/PWAInstallModal';

export const Footer: React.FC = () => {
  const [showPwaModal, setShowPwaModal] = useState(false);

  return (
    <footer className="w-full border-t border-slate-200 bg-white/90 backdrop-blur-sm text-slate-500 py-4 px-4 sm:px-6 lg:px-8 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        
        {/* Brand & Attribution */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white text-[9px]">
              <Scale className="w-2.5 h-2.5 text-white" />
            </div>
            <span>WALAYI</span>
          </div>
          
          <span className="text-slate-300 hidden sm:inline">•</span>
          
          <span className="font-mono-code font-bold text-blue-700 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            POWERED BY ENEN DIGITAL LABS
          </span>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <span className="font-mono-code font-semibold text-amber-700 inline-flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            INSPIRED BY RNB VISION 2060
          </span>
        </div>

        {/* Multi-Platform & PWA Install Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono-code">
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

          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Cap. 5 & ETA 2011 Compliant
          </span>
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
