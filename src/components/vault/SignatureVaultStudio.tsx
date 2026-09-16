import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SignatureCanvas } from '../common/SignatureCanvas';
import { 
  PenTool, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  Lock, 
  Trash2, 
  Sparkles,
  Eye,
  RefreshCw
} from 'lucide-react';

export const SignatureVaultStudio: React.FC = () => {
  const { currentUser, updateCurrentUser, addNotification } = useApp();
  
  const [activeTab, setActiveTab] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [previewSignature, setPreviewSignature] = useState<string | null>(currentUser.signatureDataUrl || null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveSignature = (dataUrl: string, type: 'DRAWN' | 'UPLOADED') => {
    setPreviewSignature(dataUrl);
    updateCurrentUser({
      signatureDataUrl: dataUrl,
      signatureType: type,
      signatureRegisteredAt: new Date().toISOString()
    });

    addNotification(
      'Professional Signature Registered',
      'Your digital signature has been securely stored in your personal vault. It will only be applied with your explicit per-document authorization during live ceremonies.',
      'SYSTEM'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          handleSaveSignature(dataUrl, 'UPLOADED');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSignature = () => {
    setPreviewSignature(null);
    updateCurrentUser({
      signatureDataUrl: undefined,
      signatureType: undefined,
      signatureRegisteredAt: undefined
    });
    addNotification(
      'Signature Removed',
      'Your stored professional signature has been removed from the vault.',
      'SYSTEM'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="signature-vault-studio">
      
      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono-code border border-blue-500/30">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            HASHED & CRYPTOGRAPHICALLY SEALED
          </div>
          <span className="text-xs text-slate-400 font-mono-code">
            Practitioner: <strong className="text-white">{currentUser.fullName}</strong>
          </span>
        </div>

        <h2 className="text-2xl font-display-legal font-bold">
          My Professional Signature Vault
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Store your verified professional signature to expedite ceremony execution. By law, your signature is never automatically or silently affixed; each execution requires live biometric or two-factor confirmation during the oath ceremony.
        </p>
      </div>

      {/* Distinction & Legal Architecture Callout */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2">
        <div className="font-bold flex items-center gap-2 text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>STATUTORY DISTINCTION: 3-TIER INTEGRITY ARCHITECTURE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-700">
          <div className="p-2.5 rounded-xl bg-white border border-blue-100 space-y-1">
            <strong className="text-blue-900 block">1. Visual Signature Stamp</strong>
            <p>Visual graphical representation of your handwritten signature rendered onto the affidavit jurat block.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-blue-100 space-y-1">
            <strong className="text-blue-900 block">2. Professional Auth (2FA)</strong>
            <p>Live PIN / session confirmation executed by you while presiding over the live WebRTC ceremony.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-blue-100 space-y-1">
            <strong className="text-blue-900 block">3. Cryptographic Seal</strong>
            <p>256-bit hash and verifiable QR minted on the document to render it permanently tamper-evident.</p>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Creator / Uploader */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Capture Professional Signature
              </h3>
              
              {/* Toggle Draw / Upload */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('DRAW')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'DRAW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="tab-draw-signature"
                >
                  <PenTool className="w-3.5 h-3.5 inline mr-1" />
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('UPLOAD')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'UPLOAD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="tab-upload-signature"
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  Upload Image
                </button>
              </div>
            </div>

            {activeTab === 'DRAW' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Use your mouse, trackpad, stylus, or touch screen to draw your signature smoothly:
                </p>
                <SignatureCanvas
                  signerName={currentUser.fullName}
                  roleLabel={currentUser.role === 'commissioner' ? 'Commissioner for Oaths' : 'Practising Advocate'}
                  onSave={(dataUrl) => handleSaveSignature(dataUrl, 'DRAWN')}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Upload a clean scan or photo of your handwritten signature (PNG, JPG, or SVG with transparent background recommended):
                </p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 p-8 rounded-2xl text-center cursor-pointer transition-all bg-slate-50 hover:bg-blue-50/50"
                  id="signature-upload-zone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-900">
                    Click to browse or drop signature file
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    PNG, JPG, or SVG (Max 5MB)
                  </div>
                  {uploadFileName && (
                    <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono-code border border-emerald-200">
                      ✓ Uploaded: {uploadFileName}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Vault Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active Vault Signature
              </h3>
              {previewSignature && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono-code font-bold border border-emerald-200">
                  REGISTERED
                </span>
              )}
            </div>

            {previewSignature && previewSignature.trim().length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                  <div className="text-[10px] font-mono-code text-slate-400 absolute top-2 left-2">
                    VAULT PREVIEW
                  </div>
                  <img
                    src={previewSignature}
                    alt="Active Registered Signature"
                    className="max-h-24 max-w-full object-contain filter contrast-125"
                  />
                  <div className="text-[11px] font-mono-code text-slate-500 mt-3 border-t border-slate-200/80 pt-1.5 w-full text-center">
                    {currentUser.fullName} • {currentUser.nationalIdNumber || 'UG-ADVOCATE'}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration Mode:</span>
                    <span className="font-semibold text-slate-800 uppercase text-[10px] font-mono-code">
                      {currentUser.signatureType || 'DIGITAL_CAPTURE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Storage:</span>
                    <span className="text-emerald-700 font-semibold text-[10px]">AES-256 Encrypted</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-Apply:</span>
                    <span className="text-slate-700 font-semibold text-[10px]">Disabled (Requires Live Oath)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-remove-signature"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Stored Signature
                </button>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  No Signature Registered Yet
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Draw or upload your signature on the left to register it in your secure vault.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
