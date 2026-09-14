import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertTriangle, X } from 'lucide-react';

interface SecurityConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  actionButtonText: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  targetDetails?: {
    label: string;
    value: string;
  }[];
}

export const SecurityConfirmationModal: React.FC<SecurityConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionButtonText,
  isDestructive = false,
  requireReason = true,
  targetDetails
}) => {
  const [reason, setReason] = useState('');
  const [mfaCode, setMfaCode] = useState('884-921'); // Mock hardware token MFA
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide a mandatory justification for this administrative action.');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-start justify-between gap-3 ${
          isDestructive ? 'bg-red-50/70 border-red-100' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isDestructive ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-slate-900 text-white">
                  MFA SECURED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Master Admin Authentication Layer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {description}
          </p>

          {targetDetails && targetDetails.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              {targetDetails.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">{item.label}:</span>
                  <span className="font-bold text-slate-900 font-mono-code">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mandatory Reason */}
          {requireReason && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Audit Justification / Administrative Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="State the statutory or operational reason for this action (logged to immutable audit trail)..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-500 focus:outline-none placeholder:text-slate-400"
              />
              {error && <p className="text-red-600 font-semibold text-[11px]">{error}</p>}
            </div>
          )}

          {/* Simulated 2FA Token Indicator */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-blue-900">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-bold text-[11px]">Hardware Token 2FA Session</div>
                <div className="text-[10px] text-blue-700">Root Governance Session (Master Admin Verified)</div>
              </div>
            </div>
            <div className="font-mono-code font-bold bg-white px-2 py-1 rounded border border-blue-200 text-blue-800">
              {mfaCode}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {actionButtonText}
          </button>
        </div>

      </div>
    </div>
  );
};
