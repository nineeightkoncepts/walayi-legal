import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'compact' | 'prominent' | 'footer';
}

/**
 * A single, streamlined "Install app" affordance.
 * - On Chromium/Android/Desktop it fires the native install prompt directly.
 * - Everywhere else (iOS Safari, Firefox) it opens a short guide modal.
 * The control hides itself once the app is already installed.
 */
export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) setShowModal(true);
    } else {
      setShowModal(true);
    }
  };

  const base =
    'inline-flex items-center gap-2 font-bold cursor-pointer transition-colors';

  const styles: Record<string, string> = {
    nav: `${base} px-3 py-1.5 rounded-xl text-xs bg-[#0D1B3D] hover:bg-[#0a1530] text-white border border-white/10`,
    prominent: `${base} justify-center px-5 py-3 rounded-2xl text-sm bg-[#0D1B3D] hover:bg-[#0a1530] text-white shadow-sm w-full`,
    footer: `${base} text-xs text-slate-500 hover:text-[#0097A7]`,
    compact: `${base} p-2 rounded-xl text-slate-600 hover:text-[#0097A7] hover:bg-slate-100`,
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${styles[variant]} ${className}`}
        id={`btn-pwa-install-${variant}`}
        title="Install the WALAYI app"
        aria-label="Install the WALAYI app"
      >
        <Download className={`w-4 h-4 ${variant === 'nav' ? 'text-[#0097A7]' : ''}`} />
        {variant !== 'compact' && <span>Install app</span>}
      </button>

      {showModal && (
        <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};
