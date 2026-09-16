import React, { useEffect, useState } from 'react';
import { Scale, Sparkles, Award, ArrowRight, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  autoDismissMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, autoDismissMs = 2800 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1120] text-white p-6 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      id="splash-screen-root"
    >
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-6">
        
        {/* Emblem */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 border border-blue-400/30 animate-pulse">
            <Scale className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900 border border-blue-400/40 text-[10px] font-mono-code font-bold text-blue-300">
            UG
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-display-legal font-bold tracking-tight text-white">
            WALAYI
          </h1>
          <p className="text-sm text-slate-300 font-sans tracking-wide">
            Digital Oath & Commissioning Workflow for Uganda
          </p>
        </div>

        {/* Vision & Power Statement Banner Cards */}
        <div className="w-full space-y-2 pt-4">
          <div className="py-2.5 px-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-bold font-mono-code uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>POWERED BY ENEN DIGITAL LABS</span>
          </div>

          <div className="py-2.5 px-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-mono-code uppercase tracking-wider flex items-center justify-center gap-2 shadow-inner">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>INSPIRED BY RNB VISION 2060 DIGITAL TRANSFORMATION AGENDA</span>
          </div>
        </div>

        {/* Enter / Skip CTA button */}
        <div className="pt-4">
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
            id="btn-enter-platform"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Footer minimal tag */}
      <div className="absolute bottom-6 text-[10px] text-slate-500 font-mono-code flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        Secured with cryptographic audit trails
      </div>
    </div>
  );
};
