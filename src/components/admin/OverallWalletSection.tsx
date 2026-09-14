import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentTransaction, DisputeItem } from '../../types';
import { SecurityConfirmationModal } from './SecurityConfirmationModal';
import { UserAvatar } from '../common/UserAvatar';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  Scale, 
  Eye,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const OverallWalletSection: React.FC = () => {
  const { 
    transactions, 
    disputes, 
    processRefund, 
    resolveDispute, 
    requests, 
    users 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'WALLET' | 'HISTORY' | 'RECONCILIATION' | 'PAYOUTS' | 'REFUNDS' | 'DISPUTES'>('WALLET');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  
  // Confirmation Modal state for refunds
  const [refundTargetTxn, setRefundTargetTxn] = useState<PaymentTransaction | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Dispute resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [disputeAction, setDisputeAction] = useState<'REFUND' | 'RELEASE' | 'DISMISS' | null>(null);

  // Financial calculations
  const grossVolume = transactions
    .filter(t => t.status === 'SETTLED' || t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const pendingSettlement = transactions
    .filter(t => t.status === 'CONFIRMED' || t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const availablePlatformRevenue = transactions
    .filter(t => t.status === 'SETTLED')
    .reduce((acc, t) => acc + (t.type === 'PRO_SUBSCRIPTION' ? t.amountUGX : t.platformFeeUGX), 0);

  const commissionerFundsAwaitingPayout = transactions
    .filter(t => t.type === 'COMMISSIONING_ESCROW' && t.status === 'SETTLED')
    .reduce((acc, t) => acc + t.netPayoutUGX, 0);

  const completedPayouts = transactions
    .filter(t => t.type === 'PAYOUT_WITHDRAWAL' && t.status === 'SETTLED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const totalRefunds = transactions
    .filter(t => t.status === 'REFUNDED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const txnCount = transactions.length;

  const handleOpenRefundModal = (txn: PaymentTransaction) => {
    setRefundTargetTxn(txn);
    setIsRefundModalOpen(true);
  };

  const handleExecuteRefund = async (reason: string) => {
    if (refundTargetTxn) {
      await processRefund(refundTargetTxn.id, reason);
      setRefundTargetTxn(null);
      if (selectedTxn && selectedTxn.id === refundTargetTxn.id) {
        setSelectedTxn({ ...selectedTxn, status: 'REFUNDED' });
      }
    }
  };

  const handleConfirmDisputeResolution = (reason: string) => {
    if (selectedDispute && disputeAction) {
      resolveDispute(selectedDispute.id, disputeAction, reason);
      setSelectedDispute(null);
      setDisputeAction(null);
    }
  };

  // Filtered transactions for History tab
  const filteredHistory = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.transactionRef.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q) ||
      (t.externalProviderTxnId && t.externalProviderTxnId.toLowerCase().includes(q)) ||
      t.phoneNumber.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-wallet-section">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              CENTRAL DIGITAL WALLET LEDGER
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
              DEMO DATA / MOCK PAYMENT ENVIRONMENT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Overall Digital Wallet & Treasury Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Real-time balance monitoring, automated Mobile Money payment reconciliation, practitioner payout disbursement, and refund management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono-code font-bold text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            LEDGER SIGNATURE: VALID
          </span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'WALLET', label: 'View Wallet Balances', icon: Wallet },
          { id: 'HISTORY', label: `Transaction History (${transactions.length})`, icon: FileText },
          { id: 'RECONCILIATION', label: 'Payment Rail Reconciliation', icon: RefreshCw },
          { id: 'PAYOUTS', label: 'Practitioner Payouts', icon: ArrowUpRight },
          { id: 'REFUNDS', label: 'Refund Management', icon: RotateCcw },
          { id: 'DISPUTES', label: `Disputes Queue (${disputes.filter(d => d.status === 'OPEN').length})`, icon: AlertCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VIEW WALLET (Key Balances Grid) */}
      {activeTab === 'WALLET' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Current Platform Gross Balance
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-code">
                UGX {grossVolume.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">{txnCount} total transactions logged</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Available Platform Revenue
              </span>
              <div className="text-2xl font-extrabold text-emerald-950 font-mono-code">
                UGX {availablePlatformRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">WALAYI net accrued commission</p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                Funds Pending Settlement
              </span>
              <div className="text-2xl font-extrabold text-blue-950 font-mono-code">
                UGX {pendingSettlement.toLocaleString()}
              </div>
              <p className="text-[11px] text-blue-700">Awaiting ceremony jurat sealing</p>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                Funds Awaiting Payout
              </span>
              <div className="text-2xl font-extrabold text-indigo-950 font-mono-code">
                UGX {commissionerFundsAwaitingPayout.toLocaleString()}
              </div>
              <p className="text-[11px] text-indigo-700">Due to commissioners</p>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Payouts</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono-code">
                UGX {completedPayouts.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">Transferred to MTN/Airtel Wallets</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Refunds Issued</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono-code">
                UGX {totalRefunds.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">Credited back to deponents</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaction Count</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono-code">
                {txnCount} operations
              </div>
              <p className="text-[11px] text-slate-500">100% cryptographic integrity</p>
            </div>

          </div>

          {/* Quick Payout / Action Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-slate-900">Immediate Treasury Actions</h3>
            <p className="text-xs text-slate-500">
              Manage platform liquidity and execute batch settlement to Uganda mobile money telecommunications switches.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setActiveTab('RECONCILIATION')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Run Gateway Reconciliation Check
              </button>
              <button
                onClick={() => setActiveTab('REFUNDS')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Manage Client Refunds
              </button>
              <button
                onClick={() => setActiveTab('DISPUTES')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Review Dispute Cases ({disputes.filter(d => d.status === 'OPEN').length})
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: TRANSACTION HISTORY & DRILLDOWN */}
      {activeTab === 'HISTORY' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Complete Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Click any transaction to open full audit drilldown and payout details.</p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Txn Ref, Payer, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ref ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Payer / User</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Gross</th>
                  <th className="px-4 py-3 font-semibold">Platform (5%)</th>
                  <th className="px-4 py-3 font-semibold">Net Payout</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono-code font-bold text-blue-700">{t.transactionRef}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono-code text-[11px]">
                      {new Date(t.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{t.userName}</td>
                    <td className="px-4 py-3 capitalize">{t.type.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-code bg-slate-100 border border-slate-200 text-slate-800">
                        {t.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono-code font-bold text-slate-900">UGX {t.amountUGX.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono-code text-emerald-700 font-semibold">UGX {t.platformFeeUGX.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono-code text-indigo-700 font-semibold">UGX {t.netPayoutUGX.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        t.status === 'SETTLED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : t.status === 'CONFIRMED' || t.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : t.status === 'REFUNDED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedTxn(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Drilldown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: RECONCILIATION */}
      {activeTab === 'RECONCILIATION' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Payment Gateway Switch Reconciliation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated matching between MTN Mobile Money Uganda Gateway, Airtel Money Switch, and WALAYI Ledger.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              RECONCILIATION: 100% MATCHED
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm">MTN Uganda MoMo Gateway</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-amber-900 space-y-1 font-mono-code">
                <div>Total Batches Received: 114</div>
                <div>Matched Transaction Volume: UGX 1,750,000</div>
                <div>Discrepancies: 0 UGX</div>
                <div>Webhook Latency: 420ms</div>
              </div>
              <div className="pt-2 text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ledger hash verified against telecom transaction journal.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-red-50/50 border border-red-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-950 text-sm">Airtel Money Uganda Gateway</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-red-900 space-y-1 font-mono-code">
                <div>Total Batches Received: 68</div>
                <div>Matched Transaction Volume: UGX 890,000</div>
                <div>Discrepancies: 0 UGX</div>
                <div>Webhook Latency: 380ms</div>
              </div>
              <div className="pt-2 text-[11px] text-red-800 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ledger hash verified against telecom transaction journal.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: PAYOUTS */}
      {activeTab === 'PAYOUTS' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Commissioner Payout Disbursement Desk</h3>
              <p className="text-xs text-slate-500">Review and disburse net commissioned earnings to legal practitioners.</p>
            </div>
            <span className="text-xs font-mono-code font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              Pending Payouts: UGX {commissionerFundsAwaitingPayout.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Practitioner</th>
                  <th className="px-4 py-3 font-semibold">Designation / Chambers</th>
                  <th className="px-4 py-3 font-semibold">Mobile Money Number</th>
                  <th className="px-4 py-3 font-semibold">Awaiting Payout</th>
                  <th className="px-4 py-3 font-semibold">Completed Ceremonies</th>
                  <th className="px-4 py-3 font-semibold text-right">Disburse Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.filter(u => u.role !== 'deponent').map(pro => (
                  <tr key={pro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <UserAvatar src={pro.avatarUrl || null} name={pro.fullName} size="xs" />
                      {pro.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{pro.lawFirmName || pro.stationCity}</td>
                    <td className="px-4 py-3 font-mono-code text-slate-800">{pro.phone}</td>
                    <td className="px-4 py-3 font-mono-code font-bold text-indigo-700">
                      UGX {pro.role === 'commissioner' ? '250,000' : '450,000'}
                    </td>
                    <td className="px-4 py-3 font-mono-code">{pro.completedCeremoniesCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert(`Simulated payout disbursement of UGX 250,000 triggered via MTN MoMo to ${pro.phone}`)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Disburse Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REFUNDS */}
      {activeTab === 'REFUNDS' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Refund Administration & Deponent Reversals</h3>
              <p className="text-xs text-slate-500">
                Execute client fee reversals with strict mandatory security justifications and cryptographic audit trail logging.
              </p>
            </div>
            <span className="text-xs font-mono-code font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Refunds Settled: UGX {totalRefunds.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Transactions Eligible for Refund:
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ref ID</th>
                    <th className="px-4 py-3 font-semibold">Client Name</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Amount (UGX)</th>
                    <th className="px-4 py-3 font-semibold">Current Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono-code font-bold text-blue-700">{t.transactionRef}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{t.userName}</td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">{t.phoneNumber}</td>
                      <td className="px-4 py-3 font-mono-code font-bold text-slate-900">UGX {t.amountUGX.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          t.status === 'REFUNDED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status !== 'REFUNDED' ? (
                          <button
                            onClick={() => handleOpenRefundModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Process Refund
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Already Refunded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DISPUTES */}
      {activeTab === 'DISPUTES' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Client Ceremony Dispute Queue</h3>
              <p className="text-xs text-slate-500">
                Arbitrate client-commissioner disputes and issue binding statutory resolutions.
              </p>
            </div>
            <span className="text-xs font-mono-code font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
              Open Disputes: {disputes.filter(d => d.status === 'OPEN').length}
            </span>
          </div>

          <div className="space-y-4">
            {disputes.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code font-bold text-blue-700 text-xs">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      d.status === 'OPEN'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono-code text-[11px]">
                    Filed: {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Deponent (Complainant):</span>
                    <span className="font-bold text-slate-900">{d.deponentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Presiding Commissioner:</span>
                    <span className="font-bold text-slate-900">{d.professionalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Disputed Amount:</span>
                    <span className="font-bold font-mono-code text-rose-800">UGX {d.amountUGX.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 text-slate-700 text-xs">
                  <span className="font-bold text-slate-900">Dispute Reason: </span>
                  {d.reason}
                </div>

                {d.status === 'OPEN' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-end">
                    <button
                      onClick={() => {
                        setSelectedDispute(d);
                        setDisputeAction('REFUND');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Grant Full Refund to Deponent
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDispute(d);
                        setDisputeAction('RELEASE');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Release Funds to Commissioner
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDispute(d);
                        setDisputeAction('DISMISS');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Dismiss Dispute
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Drilldown Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-100 text-blue-800">
                  TRANSACTION DRILLDOWN
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1 font-mono-code">
                  {selectedTxn.transactionRef}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 font-mono-code">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Amount:</span>
                  <span className="font-bold text-slate-900">UGX {selectedTxn.amountUGX.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Commission (5%):</span>
                  <span className="font-bold text-emerald-700">UGX {selectedTxn.platformFeeUGX.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Professional Net Payout:</span>
                  <span className="font-bold text-indigo-700">UGX {selectedTxn.netPayoutUGX.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Payment Switch:</span>
                  <span className="font-bold text-slate-900">{selectedTxn.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">External Gateway Ref:</span>
                  <span className="font-bold text-blue-700">{selectedTxn.externalProviderTxnId || 'N/A (Direct Mobile)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold text-slate-900">{selectedTxn.status}</span>
                </div>
              </div>

              <div className="text-slate-600 text-[11px] space-y-1">
                <div><strong>Payer Name:</strong> {selectedTxn.userName} ({selectedTxn.phoneNumber})</div>
                <div><strong>Timestamp:</strong> {new Date(selectedTxn.timestamp).toISOString()}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {selectedTxn.status !== 'REFUNDED' ? (
                <button
                  onClick={() => {
                    handleOpenRefundModal(selectedTxn);
                    setSelectedTxn(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Initiate Refund
                </button>
              ) : (
                <span className="text-slate-400 font-semibold text-xs">Transaction Refunded</span>
              )}

              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Security Confirmation Modal for Refunds */}
      <SecurityConfirmationModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onConfirm={handleExecuteRefund}
        title="Confirm Payment Refund"
        description="Executing a refund will reverse the fee to the client's mobile money wallet and flag the commissioning certificate as cancelled. This action is permanently logged."
        actionButtonText="Authorize Refund"
        isDestructive={true}
        targetDetails={refundTargetTxn ? [
          { label: 'Transaction Ref', value: refundTargetTxn.transactionRef },
          { label: 'Client', value: refundTargetTxn.userName },
          { label: 'Refund Amount', value: `UGX ${refundTargetTxn.amountUGX.toLocaleString()}` },
          { label: 'Mobile Number', value: refundTargetTxn.phoneNumber }
        ] : []}
      />

      {/* Security Confirmation Modal for Dispute Resolution */}
      <SecurityConfirmationModal
        isOpen={selectedDispute !== null && disputeAction !== null}
        onClose={() => {
          setSelectedDispute(null);
          setDisputeAction(null);
        }}
        onConfirm={handleConfirmDisputeResolution}
        title={`Confirm Dispute Action: ${disputeAction}`}
        description={`You are about to issue a formal Master Admin arbitration ruling on dispute ${selectedDispute?.id}.`}
        actionButtonText={`Confirm ${disputeAction}`}
        isDestructive={disputeAction === 'REFUND'}
        targetDetails={selectedDispute ? [
          { label: 'Dispute ID', value: selectedDispute.id },
          { label: 'Deponent', value: selectedDispute.deponentName },
          { label: 'Commissioner', value: selectedDispute.professionalName },
          { label: 'Amount', value: `UGX ${selectedDispute.amountUGX.toLocaleString()}` }
        ] : []}
      />

    </div>
  );
};
