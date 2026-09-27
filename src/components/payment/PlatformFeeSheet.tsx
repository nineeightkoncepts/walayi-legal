import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Receipt,
  Smartphone,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { PaymentTransaction } from '../../types';
import { useApp } from '../../context/AppContext';

/**
 * Platform fee confirmation + REAL escrow collection.
 *
 * This used to fake success on a timer regardless of what actually happened
 * ("A payment request being initiated must not by itself be treated as
 * successful payment" — WALAYI Operating Blueprint §10) — the button just
 * waited ~1.6s and called onPaymentSuccess unconditionally. It now
 * initiates a genuine ioTec Pay mobile money collection (server-side,
 * server.ts / api/payments/iotec/collect) and polls the real transaction
 * status until the provider confirms SUCCESS or FAILED — onPaymentSuccess
 * only ever fires once the payment has genuinely been confirmed upstream.
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

type PaymentState = 'FORM' | 'COLLECTING' | 'AWAITING_APPROVAL' | 'DONE' | 'FAILED';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

export const PlatformFeeSheet: React.FC<PlatformFeeSheetProps> = ({
  amountUGX,
  serviceFeeUGX,
  platformFeeUGX,
  commissioningId,
  deponentName,
  deponentPhone,
  documentTitle,
  commissionerName,
  onPaymentSuccess,
  onCancel,
}) => {
  const { currentUser } = useApp();
  const [state, setState] = useState<PaymentState>('FORM');
  const [provider, setProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [phoneNumber, setPhoneNumber] = useState(deponentPhone || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const pollStatus = (ref: string) => {
    pollTimerRef.current = setTimeout(async () => {
      pollAttemptsRef.current += 1;
      try {
        const res = await fetch(`/api/payments/iotec/status/${encodeURIComponent(ref)}`);
        if (!res.ok) throw new Error(`Status check failed (HTTP ${res.status})`);
        const data = await res.json();

        if (data.status === 'SUCCESS') {
          const transaction: PaymentTransaction = {
            id: `TXN-${Date.now()}`,
            transactionRef: ref,
            commissioningId,
            userId: currentUser.id,
            userName: deponentName,
            provider,
            paymentChannel: 'MOBILE_MONEY',
            phoneNumber: data.phoneNumber || phoneNumber,
            gateway: 'IOTEC',
            type: 'COMMISSIONING_ESCROW',
            amountUGX: data.amountUGX ?? amountUGX,
            platformFeeUGX,
            netPayoutUGX: serviceFeeUGX,
            status: 'CONFIRMED',
            timestamp: new Date().toISOString(),
            externalProviderTxnId: data.externalTxnId,
            iotecReference: ref,
          };
          setState('DONE');
          setTimeout(() => onPaymentSuccess(transaction, ref), 900);
          return;
        }

        if (data.status === 'FAILED') {
          setErrorMessage(data.failureReason || 'Payment was declined or the PIN entry failed.');
          setState('FAILED');
          return;
        }

        // Still PENDING — keep polling until the provider actually answers.
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setErrorMessage('No confirmation received yet from the mobile money provider. Please check your phone, or try again.');
          setState('FAILED');
          return;
        }
        pollStatus(ref);
      } catch (err: any) {
        // A transient network hiccup checking status is not itself a
        // payment failure — keep polling rather than failing the whole
        // transaction over a dropped status-check request.
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setErrorMessage(err?.message || 'Could not confirm payment status.');
          setState('FAILED');
          return;
        }
        pollStatus(ref);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleConfirm = async () => {
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 9) {
      setErrorMessage('Enter a valid mobile money number to receive the payment prompt.');
      return;
    }

    setErrorMessage(null);
    setState('COLLECTING');
    pollAttemptsRef.current = 0;

    try {
      const res = await fetch('/api/payments/iotec/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUGX,
          channel: 'MOBILE_MONEY',
          provider,
          phoneNumber: cleanPhone,
          commissioningId,
          description: documentTitle || 'Statutory Commissioning',
          deponentName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.reference) {
        throw new Error(data?.error || 'Could not initiate the mobile money payment.');
      }

      setReference(data.reference);
      setState('AWAITING_APPROVAL');
      pollStatus(data.reference);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment initiation failed. Please try again.');
      setState('FAILED');
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setReference(null);
    pollAttemptsRef.current = 0;
    setState('FORM');
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
            <h3 className="text-lg font-black text-[#0D1B3D]">Payment Confirmed</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Mobile money payment verified. Proceeding to the commissioning room…
            </p>
          </div>
        ) : state === 'AWAITING_APPROVAL' ? (
          <div
            className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3 animate-fadeIn"
            id="platform-fee-awaiting-approval-banner"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center mx-auto text-amber-700">
              <Smartphone className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-[#0D1B3D]">Check Your Phone</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              A mobile money prompt was sent to <strong>{phoneNumber}</strong>. Enter your PIN to
              authorize the payment. This confirms automatically once received — do not close this page.
            </p>
            {reference && (
              <p className="text-[10px] text-slate-400 font-mono-code">Ref: {reference}</p>
            )}
          </div>
        ) : state === 'FAILED' ? (
          <div
            className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3 animate-fadeIn"
            id="platform-fee-failed-banner"
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center mx-auto text-rose-700">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#0D1B3D]">Payment Not Confirmed</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl bg-[#0D1B3D] hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              id="btn-retry-platform-fee"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Provider + phone number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Mobile Money Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['MTN_MOMO', 'AIRTEL_MONEY'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      provider === p
                        ? 'bg-blue-50 border-[#0097A7] text-[#0D1B3D]'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                    id={`btn-fee-provider-${p}`}
                  >
                    {p === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Airtel Money'}
                  </button>
                ))}
              </div>

              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pt-1">
                Mobile Money Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0772 000 000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono-code focus:outline-none focus:border-[#0097A7] focus:ring-2 focus:ring-[#0097A7]/10"
                  id="input-fee-phone-number"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={state === 'COLLECTING'}
              className="w-full py-4 rounded-2xl bg-[#0097A7] hover:bg-[#00838F] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-300"
              id="btn-confirm-platform-fee"
            >
              {state === 'COLLECTING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Payment Request…</span>
                </>
              ) : (
                <>
                  <span>Pay UGX {amountUGX.toLocaleString()} & Continue</span>
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
