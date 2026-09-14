import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Award, 
  Sparkles, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Lock, 
  Cpu, 
  Server,
  Globe
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AboutLegalInfrastructureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutLegalInfrastructureModal: React.FC<AboutLegalInfrastructureModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn" id="about-legal-modal-root">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <BrandLogo variant="glyph" size="lg" light={true} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  STATUTORY RECOGNITION & COMPLIANCE
                </span>
                <span className="text-[11px] font-mono-code text-slate-400">v2.6 Enterprise</span>
              </div>
              <h2 className="text-xl font-display-legal font-bold text-white tracking-wide mt-1">
                WALAYI Uganda Legal Infrastructure
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
            id="btn-close-about-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          
          {/* Executive Overview */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-blue-950 text-sm">Official Platform Mandate & Legality</h3>
              <p className="text-xs text-blue-900/90 leading-relaxed">
                WALAYI is Uganda&apos;s sovereign digital commissioning platform, purpose-engineered to bridge the gap between judicial ceremonies, remote digital execution, and statutory compliance across the Republic of Uganda.
              </p>
            </div>
          </div>

          {/* Legal Framework Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Primary Statutory Acts & Enactments
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">Commissioners for Oaths (Advocates) Act, Cap. 5</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Empowers advocates holding valid practising certificates and high court warrants to administer solemn oaths, affirmations, and statutory declarations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">Electronic Transactions Act, 2011 (ETA 2011)</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Sections 5, 6, and 19 establish the full legal validity, admissibility, and enforceability of electronic records, electronic declarations, and digital signatures.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">Electronic Signatures Act, 2011 (ESA 2011)</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Regulates Advanced Electronic Signatures, asymmetric public-key cryptography, and verifiable hash digests to prevent repudiation and document tampering.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">Judiciary Uganda ECCMIS Interoperability</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Documents commissioned through WALAYI generate authenticated jurats and QR certificates fully structured for electronic filing in the High Court ECCMIS system.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">Advocates Act (Cap. 267) & Notaries Public Act (Cap. 53)</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Strict enforcement of statutory fee schedules, disciplinary audit trails, and legal authority boundaries for admitted Uganda legal practitioners.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <h5 className="font-bold text-xs text-slate-900">URSB & Institutional Verification</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Verifiable audit trails for corporate resolutions, title deed affidavits, land declarations, and banking compliance.
                </p>
              </div>

            </div>
          </div>

          {/* Cryptographic Standards */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-mono-code text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              Cryptographic Integrity Standards
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="font-bold text-slate-200">SHA-256 Digest</div>
                <div className="text-[11px] text-slate-400">Zero-knowledge mathematical hashing for tamper detection.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="font-bold text-slate-200">Immutable Jurat</div>
                <div className="text-[11px] text-slate-400">Unique certificate number bound to GPS, timestamp, and commissioner seal.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <div className="font-bold text-slate-200">Escrow Security</div>
                <div className="text-[11px] text-slate-400">MoMo escrow released only upon mutual signature and seal minting.</div>
              </div>
            </div>
          </div>

          {/* Attribution & Vision */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Award className="w-4 h-4 text-amber-600" />
              VISION & TECHNOLOGY STEWARDSHIP
            </div>
            <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
              <p>
                <strong>POWERED BY:</strong> <span className="font-mono-code font-bold text-blue-800">ENEN DIGITAL LABS</span>
              </p>
              <p>
                <strong>STRATEGIC VISION:</strong> Inspired by the <span className="font-mono-code font-semibold text-amber-800">RNB VISION 2060 Digital Transformation Agenda</span> for modernizing public sector administration, access to justice, and digital governance across Africa.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Official Legal Tech Standard • Republic of Uganda</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
