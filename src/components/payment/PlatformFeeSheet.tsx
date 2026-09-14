import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { PaymentTransaction } from '../../types';

/**
 * Platform fee confirmation sheet.
 *
 * This replaces the previous third-party payment gateway integration on the
 * user-facing commissioning flow. Users are no longer routed through an
 * external mobile-money / card gateway. Instead they confirm the flat WALAYI
 * platform fee, and the request is marked as escrowed so the ceremony room
 * unlocks. Fee collection / commissioner settlement is handled off-platform.
 *
 * The prop shape mirrors the old sheet so existing call sites work unchanged:
 * `onPaymentSuccess(transaction, reference)` is fired once the user confirms.
 */
interface PlatformFeeSheetProps {
  amountUGX: number;
  serviceFeeUGX: number;
  platformFeeUGX: number;
  commissioningId?: string;
  deponentName: string;
  deponentPhone?: string;
  documentTitle?: string;
  commissionerName?: string;
  onPaymentSuccess: (transaction: PaymentTransaction, reference: string) => void;
  onCancel?: () => void;
}

export const PlatformFeeSheet: React.FC<PlatformFeeSheetProps> = ({
  amountUGX,
  serviceFeeUGX,
  platformFeeUGX,
  commissioningId,
  deponentName,
  deponentPhone,
  commissionerName,
  onPaymentSuccess,
  onCancel,
}) => {
  const [state, setState] = useState<'IDLE' | 'CONFIRMING' | 'DONE'>('IDLE');

  const handleConfirm = () => {
    setState('CONFIRMING');

    const reference = `WY-FEE-${Date.now()}`;
    const transaction: PaymentTransaction = {
      id: `TXN-${Date.now()}`,
      transactionRef: reference,
      commissioningId,
      userId: 'client-user',
      userName: deponentName,
      provider: 'WALLET',
      paymentChannel: 'WALLET',
      phoneNumber: deponentPhone,
      gateway: 'DIRECT',
      type: 'COMMISSIONING_ESCROW',
      amountUGX,
      platformFeeUGX,
      netPayoutUGX: serviceFeeUGX,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
      externalProviderTxnId: reference,
    };

    // Brief confirming state, then hand back to the caller.
    setTimeout(() => {
      setState('DONE');
      setTimeout(() => onPaymentSuccess(transaction, reference), 900);
    }, 700);
  };

  return (
    <div
      className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn"
      id="platform-fee-sheet"
    >
      {/* Header */}
      <div className="bg-[#0D1B3D] text-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">WALAYI Platform Fee</h3>
            <p className="text-[11px] text-slate-300">
              Statutory Digital Commissioning (Cap. 5 Laws of Uganda)
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Amount banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Payable
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono-code text-[#0D1B3D]">
              <span className="text-sm font-bold text-slate-500 mr-1">UGX</span>
              {amountUGX.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Service Fee: UGX {serviceFeeUGX.toLocaleString()} • Platform Fee (flat): UGX{' '}
              {platformFeeUGX.toLocaleString()}
            </p>
          </div>

          {commissionerName && (
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Presiding Commissioner
              </span>
              <div className="text-xs font-black text-slate-900">{commissionerName}</div>
              <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 sm:justify-end">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Confirmed after Step 14
              </div>
            </div>
          )}
        </div>

        {/* Fee breakdown */}
        <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
          <div className="flex items-center justify-between px-4 py-3 text-xs">
            <span className="text-slate-500 font-medium">Commissioner Service Fee</span>
            <span className="font-mono-code font-bold text-slate-900">
              UGX {serviceFeeUGX.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              WALAYI Platform Fee (flat)
            </span>
            <span className="font-mono-code font-bold text-slate-900">
              UGX {platformFeeUGX.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs bg-slate-50/60">
            <span className="text-slate-700 font-black uppercase tracking-wider">Total</span>
            <span className="font-mono-code font-black text-[#0D1B3D]">
              UGX {amountUGX.toLocaleString()}
            </span>
          </div>
        </div>

        {state === 'DONE' ? (
          <div
            className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn"
            id="platform-fee-confirmed-banner"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#0D1B3D]">Fee Confirmed</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Platform fee recorded. Proceeding to the commissioning room…
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={state === 'CONFIRMING'}
              className="w-full py-4 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-200"
              id="btn-confirm-platform-fee"
            >
              {state === 'CONFIRMING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Confirming…</span>
                </>
              ) : (
                <>
                  <span>Confirm UGX {amountUGX.toLocaleString()} & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel &amp; Return
              </button>
            )}
          </div>
        )}

        <div className="text-[10px] text-slate-400 font-medium text-center leading-relaxed border-t border-slate-100 pt-4">
          <p>
            Pursuant to the Electronic Transactions Act 2011 and Cap. 5 Laws of Uganda, the
            certified instrument is issued only after the commissioner applies the electronic
            jurat, official seal, and unique WALAYI Security Number.
          </p>
        </div>
      </div>
    </div>
  );
};
