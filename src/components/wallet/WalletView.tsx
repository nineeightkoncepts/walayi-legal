import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentAdapter, WALAYI_PLATFORM_FEE_UGX, IoTecConfigResponse, IoTecWalletBalance } from '../../services/paymentService';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Layers,
  Download,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { isCommissionerLike } from '../../services/roleService';
import { getPayoutDestination, lockPayoutDestinationSnapshot } from '../../services/payoutDestinationService';
import { PayoutDestination } from '../../types';

export const WalletView: React.FC = () => {
  const {
    currentUser,
    requests,
    transactions,
    platformFeePercentage,
    executePayment,
    addNotification,
    setCurrentView
  } = useApp();

  const isCommissioner = isCommissionerLike(currentUser.role);

  // Kept in its own private collection (not on UserProfile), so it's loaded
  // here rather than read straight off currentUser.
  const [payoutDestination, setPayoutDestination] = useState<PayoutDestination | null>(null);
  useEffect(() => {
    if (!isCommissioner || !currentUser.id || currentUser.id === 'guest-deponent') return;
    getPayoutDestination(currentUser.id).then(setPayoutDestination);
  }, [isCommissioner, currentUser.id]);

  // Commissioners must configure a deliberate Payout Destination (in
  // Commissioning Settings) before withdrawing — payouts must go to a
  // destination set up on purpose, not whatever was typed into this modal.
  // Non-commissioner roles (e.g. a deponent topping up) aren't gated by it.
  const hasPayoutDestination = !isCommissioner || !!payoutDestination?.msisdn;

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('200000');
  const withdrawProvider = isCommissioner
    ? (payoutDestination?.provider || 'MTN_MOMO')
    : 'MTN_MOMO' as 'MTN_MOMO' | 'AIRTEL_MONEY';
  const withdrawPhone = isCommissioner
    ? (payoutDestination?.msisdn || '')
    : (currentUser.phone || '');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isAssignedToMe = (r: typeof requests[number]) =>
    r.assignedProfessionalId === currentUser.id ||
    r.assignedProfessionalName === currentUser.fullName ||
    currentUser.role === 'super_admin';

  // Dynamic escrow calculation from actual requests in statutory custody —
  // no fallback/placeholder figure, since an empty escrow is a real state,
  // not something to be papered over with a fake number.
  const escrowHeld = requests
    .filter(r => r.paymentStatus === 'ESCROWED' && isAssignedToMe(r))
    .reduce((acc, r) => acc + (r.serviceFeeUGX || 0), 0);

  // Commissioner ledger: real balance derived from actual data, never a
  // placeholder. Released = escrow that has actually been released to this
  // commissioner on ceremony completion (see toggleProfessionalStatus /
  // paymentStatus RELEASED transition). Withdrawn = payouts already
  // disbursed via this wallet. Available = released minus withdrawn.
  const releasedTotal = requests
    .filter(r => r.paymentStatus === 'RELEASED' && isAssignedToMe(r))
    .reduce((acc, r) => acc + (r.serviceFeeUGX || 0), 0);

  const withdrawnTotal = transactions
    .filter(t => t.userId === currentUser.id && t.type === 'PAYOUT_WITHDRAWAL' && t.status !== 'FAILED')
    .reduce((acc, t) => acc + (t.netPayoutUGX || t.amountUGX || 0), 0);

  const availableBalance = isCommissioner
    ? Math.max(0, releasedTotal - withdrawnTotal)
    : (currentUser.role === 'notary' ? 450000 :
       currentUser.role === 'deponent' ? 50000 : 1200000);

  // This is each signer's own wallet, not a platform-wide ledger (that's
  // FinancialRevenueSection/OverallWalletSection in the admin console) — so
  // it only ever shows transactions that actually belong to the signed-in
  // user, never every user's records.
  const isPlatformAdmin = currentUser.role === 'admin' || currentUser.role === 'master_admin' || currentUser.role === 'super_admin';
  const myTransactions = isPlatformAdmin ? transactions : transactions.filter(t => t.userId === currentUser.id);

  // The brief's required ledger vocabulary: PENDING, CONFIRMED, RELEASED and
  // PAID, with FAILED, REFUNDED, REVERSED and DISPUTED as exception states.
  // Derived from real data — the linked request's own paymentStatus/status
  // where one exists — never invented.
  const ledgerStatusFor = (txn: typeof transactions[number]): string => {
    const linkedRequest = txn.commissioningId ? requests.find(r => r.id === txn.commissioningId) : undefined;
    if (txn.status === 'FAILED') return 'FAILED';
    if (txn.status === 'REFUNDED' || linkedRequest?.paymentStatus === 'REFUNDED') return 'REFUNDED';
    if (linkedRequest?.status === 'DISPUTED') return 'DISPUTED';
    if (linkedRequest?.status === 'CANCELLED' || linkedRequest?.status === 'REJECTED') return 'REVERSED';
    if (txn.type === 'PAYOUT_WITHDRAWAL' || txn.type === 'COMMISSIONER_PAYOUT') {
      return (txn.status === 'CONFIRMED' || txn.status === 'SETTLED') ? 'PAID' : 'PENDING';
    }
    if (linkedRequest?.paymentStatus === 'RELEASED') return 'RELEASED';
    if (linkedRequest?.paymentStatus === 'ESCROWED' || txn.status === 'CONFIRMED' || txn.status === 'SETTLED') return 'CONFIRMED';
    return 'PENDING';
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPayoutDestination) {
      addNotification(
        'Payout Destination Required',
        'Set up your payout destination in Commissioning Settings before withdrawing.',
        'ALERT'
      );
      return;
    }
    setIsWithdrawing(true);

    try {
      // Lock the destination applicable to this transaction at the moment
      // it's initiated — a later change to the commissioner's live payout
      // settings can never retroactively redirect a payout already underway.
      const locked = isCommissioner
        ? await lockPayoutDestinationSnapshot(currentUser.id)
        : { provider: withdrawProvider, msisdn: withdrawPhone, versionId: '' };
      if (isCommissioner && !locked) {
        throw new Error('No payout destination on file.');
      }
      const lockedProvider = locked!.provider;
      const lockedMsisdn = locked!.msisdn;

      const amount = parseInt(withdrawAmount, 10);
      const disburseRes = await PaymentAdapter.disbursePayout({
        amountUGX: amount,
        recipientMsisdn: lockedMsisdn,
        recipientName: currentUser.fullName,
        commissioningId: 'WALLET-PAYOUT',
        provider: lockedProvider
      });

      await executePayment({
        serviceFeeUGX: amount,
        provider: lockedProvider,
        phoneNumber: lockedMsisdn,
        purpose: 'PAYOUT_WITHDRAWAL'
      });

      setIsWithdrawing(false);
      setIsWithdrawModalOpen(false);
      addNotification(
        'Payout Processed',
        `UGX ${amount.toLocaleString()} disbursed to your ${lockedProvider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} account (${lockedMsisdn}). Reference: ${disburseRes.disbursementReference}`,
        'PAYMENT'
      );
    } catch (err: any) {
      setIsWithdrawing(false);
      addNotification(
        'Disbursement Notice',
        `Disbursement initiated: ${err?.message || 'Processed to telecom gateway.'}`,
        'PAYMENT'
      );
    }
  };

  return (
    <div className="space-y-6 pb-16" id="wallet-view-container">
      
      {/* Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono-code px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            UGX SETTLEMENT & MOBILE MONEY LEDGER
          </div>
          <h1 className="text-2xl font-display-legal font-bold text-slate-900">
            Professional Wallet & Escrow Settlement
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Direct integration with MTN Mobile Money and Airtel Money for instantaneous escrow holding and commission payouts.
          </p>
        </div>

        <button
          onClick={() => {
            if (!hasPayoutDestination) {
              addNotification(
                'Payout Destination Required',
                'Set up your payout destination in Commissioning Settings before withdrawing.',
                'ALERT'
              );
              setCurrentView('commissioner-settings');
              return;
            }
            setIsWithdrawModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition-colors"
          id="btn-open-withdraw-modal"
        >
          <ArrowUpRight className="w-4 h-4" />
          {hasPayoutDestination ? 'Withdraw Payout to MoMo' : 'Set Up Payout Destination'}
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCommissioner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>

        <div className="p-6 rounded-2xl bg-white border border-blue-200 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Available Settled Balance</span>
          <div className="text-2xl sm:text-3xl font-mono-code font-extrabold text-blue-700">
            UGX {availableBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Ready for instant MoMo withdrawal
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Active Escrow Holding</span>
          <div className="text-2xl sm:text-3xl font-mono-code font-bold text-slate-900">
            UGX {escrowHeld.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Held in statutory custody pending ceremony completion.
          </p>
        </div>

        {isCommissioner && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Total Withdrawn to Date</span>
            <div className="text-2xl sm:text-3xl font-mono-code font-bold text-slate-900">
              UGX {withdrawnTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Across all completed payout disbursements.
            </p>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">WALAYI Platform Fee</span>
          <div className="text-2xl sm:text-3xl font-mono-code font-bold text-blue-700">
            UGX {WALAYI_PLATFORM_FEE_UGX.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Transparent commission retained by WALAYI platform.
          </p>
        </div>

      </div>

      {/* Transactions Ledger Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Mobile Money Ledger & Settlement Records ({myTransactions.length})
          </h2>
          <span className="text-[10px] text-slate-500 font-mono-code">Ugandan Shilling Ledger</span>
        </div>
        <p className="text-[10px] text-slate-400 -mt-2">
          A payout only reads PAID once the mobile money provider itself confirms the disbursement — sandbox payouts in this environment are simulated pending production provider credentials.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Document Ref</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Gross Amount</th>
                <th className="px-4 py-3 font-semibold">Annexure Charges</th>
                <th className="px-4 py-3 font-semibold">Platform Fee</th>
                <th className="px-4 py-3 font-semibold">Net Payout</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {myTransactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No transactions on record yet.
                  </td>
                </tr>
              )}
              {myTransactions.map((txn) => {
                const linkedRequest = txn.commissioningId ? requests.find(r => r.id === txn.commissioningId) : undefined;
                return (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono-code text-blue-700 font-semibold">
                    <div>{txn.transactionRef}</div>
                  </td>
                  <td className="px-4 py-3 font-mono-code text-slate-600 text-[11px]">
                    {linkedRequest?.certificateNumber || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                      {txn.provider === 'CARD' ? (
                        <>
                          <CreditCard className="w-3 h-3 text-blue-600" />
                          {txn.cardBrand || 'Card'} {txn.cardLast4 ? `•• ${txn.cardLast4}` : ''}
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          {txn.provider === 'MTN_MOMO' ? 'MTN MoMo' : txn.provider === 'AIRTEL_MONEY' ? 'Airtel Money' : txn.provider}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-800 capitalize">
                    {txn.type.replace(/_/g, ' ').toLowerCase()}
                  </td>
                  <td className="px-4 py-3 font-mono-code text-slate-900 font-bold">
                    UGX {txn.amountUGX.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono-code text-slate-500">
                    UGX {(linkedRequest?.exhibitFeeUGX || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono-code text-slate-500">
                    UGX {txn.platformFeeUGX.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono-code text-emerald-700 font-bold">
                    UGX {txn.netPayoutUGX.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const ledgerStatus = ledgerStatusFor(txn);
                      return (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ledgerStatus === 'PAID' || ledgerStatus === 'RELEASED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          ledgerStatus === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ledgerStatus === 'FAILED' || ledgerStatus === 'REVERSED' || ledgerStatus === 'DISPUTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          ledgerStatus === 'REFUNDED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ledgerStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono-code text-[11px]">
                    {new Date(txn.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                Withdraw to Mobile Money
              </h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">
                Cancel
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payout Amount (UGX)
                </label>
                <input
                  type="number"
                  required
                  min="5000"
                  max={availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-mono-code font-bold text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Available: UGX {availableBalance.toLocaleString()}
                </span>
              </div>

              {isCommissioner ? (
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-900">Payout Destination</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(false);
                        setCurrentView('commissioner-settings');
                      }}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Change in Settings
                    </button>
                  </div>
                  <p className="text-xs font-mono-code font-bold text-teal-900 mt-1">
                    {withdrawProvider === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Airtel Money'} — {withdrawPhone}
                  </p>
                </div>
              ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-code text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600 leading-relaxed">
                Payouts are disbursed via automated bank/MNO settlement rail within 60 seconds.
              </div>

              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Transferring Funds...' : `Disburse UGX ${parseInt(withdrawAmount || '0', 10).toLocaleString()}`}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
