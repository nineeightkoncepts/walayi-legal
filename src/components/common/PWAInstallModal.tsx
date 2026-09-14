import React from 'react';
import {
  Download,
  Apple,
  Globe,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Streamlined install dialog. Leads with the one action that matters for the
 * current device: a direct install on Chromium/Android/Desktop, or short
 * platform-specific steps on iOS Safari / Firefox.
 */
export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isIOS, browserName, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      id="pwa-install-modal-root"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0D1B3D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
              <img src="/icon.svg" alt="WALAYI" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display-legal text-white">Install WALAYI</h2>
              <p className="text-[11px] text-slate-300">
                Add to your device — works offline, no app store needed.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Direct install (Chromium / Android / Desktop) */}
          {isInstallable && (
            <button
              type="button"
              onClick={async () => {
                await install();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              id="btn-pwa-direct-install-action"
            >
              <Download className="w-4 h-4" />
              Install on this device
            </button>
          )}

          {/* iOS Safari steps */}
          {isIOS && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Apple className="w-4 h-4" />
                On iPhone / iPad (Safari)
              </div>
              <ol className="space-y-2 text-slate-700 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#0097A7]">1.</span>
                  <span>
                    Tap <strong>Share</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-[#0097A7] mx-0.5" /> in the Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#0097A7]">2.</span>
                  <span>
                    Choose <strong>Add to Home Screen</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#0097A7]">3.</span>
                  <span>Tap <strong>Add</strong> — the WALAYI icon appears on your home screen.</span>
                </li>
              </ol>
            </div>
          )}

          {/* Firefox / desktop Safari fallback */}
          {!isInstallable && !isIOS && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Detected browser</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0097A7]" />
                  {browserName}
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0097A7] flex-shrink-0 mt-0.5" />
                  <span><strong>Chrome / Edge / Brave:</strong> use the install icon in the address bar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0097A7] flex-shrink-0 mt-0.5" />
                  <span><strong>Safari (macOS):</strong> File → Add to Dock.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
