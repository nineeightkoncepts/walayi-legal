import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building, 
  CreditCard,
  PieChart,
  BarChart3,
  Layers,
  Clock
} from 'lucide-react';

export const FinancialRevenueSection: React.FC = () => {
  const { transactions, requests, users, disputes } = useApp();

  // Filters
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [professionalFilter, setProfessionalFilter] = useState<string>('ALL');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Provider filter
      if (providerFilter !== 'ALL' && t.provider !== providerFilter) return false;

      // Service filter
      if (serviceFilter !== 'ALL') {
        if (serviceFilter === 'PRO_SUBSCRIPTION' && t.type !== 'PRO_SUBSCRIPTION') return false;
        if (serviceFilter === 'COMMISSIONING' && t.type !== 'COMMISSIONING_ESCROW') return false;
        if (serviceFilter === 'PAYOUT' && t.type !== 'PAYOUT_WITHDRAWAL') return false;
      }

      // Professional filter
      if (professionalFilter !== 'ALL' && t.userId !== professionalFilter) return false;

      return true;
    });
  }, [transactions, providerFilter, serviceFilter, professionalFilter]);

  // Aggregate Key Figures
  const totalMoneyProcessed = transactions
    .filter(t => t.status === 'SETTLED' || t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const pendingSettlement = transactions
    .filter(t => t.status === 'CONFIRMED' || t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const totalCommissionerPayouts = transactions
    .filter(t => t.type === 'PAYOUT_WITHDRAWAL' && t.status === 'SETTLED')
    .reduce((acc, t) => acc + t.amountUGX, 0) +
    transactions
      .filter(t => t.type === 'COMMISSIONING_ESCROW' && t.status === 'SETTLED')
      .reduce((acc, t) => acc + t.netPayoutUGX, 0);

  const totalPlatformRevenue = transactions
    .filter(t => t.status === 'SETTLED')
    .reduce((acc, t) => acc + (t.type === 'PRO_SUBSCRIPTION' ? t.amountUGX : t.platformFeeUGX), 0);

  const proSubscriptionsRevenue = transactions
    .filter(t => t.type === 'PRO_SUBSCRIPTION' && t.status === 'SETTLED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const transactionFeesRevenue = transactions
    .filter(t => t.type === 'COMMISSIONING_ESCROW' && t.status === 'SETTLED')
    .reduce((acc, t) => acc + t.platformFeeUGX, 0);

  const totalRefunds = transactions
    .filter(t => t.status === 'REFUNDED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  const disputedFunds = disputes
    .filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
    .reduce((acc, d) => acc + d.amountUGX, 0);

  const failedPayments = transactions
    .filter(t => t.status === 'FAILED')
    .reduce((acc, t) => acc + t.amountUGX, 0);

  // Time periods calculations
  const revenueToday = 1250; // Mock current day
  const revenueThisWeek = 3750;
  const revenueThisMonth = 504750;
  const revenueThisYear = totalPlatformRevenue;
  const revenueLifetime = totalPlatformRevenue;

  // Monthly breakdown for SVG Chart
  const monthlyRevenueData = [
    { month: 'Mar', txnCount: 12, revenue: 150000, feeRevenue: 7500, proRevenue: 150000 },
    { month: 'Apr', txnCount: 28, revenue: 350000, feeRevenue: 17500, proRevenue: 0 },
    { month: 'May', txnCount: 45, revenue: 580000, feeRevenue: 29000, proRevenue: 350000 },
    { month: 'Jun', txnCount: 62, revenue: 890000, feeRevenue: 44500, proRevenue: 0 },
    { month: 'Jul', txnCount: 89, revenue: 1250000, feeRevenue: 62500, proRevenue: 150000 },
    { month: 'Aug', txnCount: 114, revenue: totalMoneyProcessed, feeRevenue: transactionFeesRevenue, proRevenue: proSubscriptionsRevenue }
  ];

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue));

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-financial-section">
      
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              NATIONAL SETTLEMENT LEDGER
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-50 text-amber-800 border border-amber-200">
              DEMO DATA / MOCK PAYMENT ENVIRONMENT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Financial Overview & Platform Revenue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
            Real-time financial aggregation across mobile money rails (MTN & Airtel), professional payouts, and WALAYI infrastructure revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Revenue Report
          </button>
        </div>
      </div>

      {/* 8 Essential Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Money Processed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Money Processed</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">
            UGX {totalMoneyProcessed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Gross funds transacted across system</div>
        </div>

        {/* 2. Pending Settlement */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Settlement</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 font-mono-code">
            UGX {pendingSettlement.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700">Awaiting ceremony completion</div>
        </div>

        {/* 3. Total Commissioner Payouts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Commissioner Payouts</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 font-mono-code">
            UGX {totalCommissionerPayouts.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700">Disbursed to practitioners</div>
        </div>

        {/* 4. Total WALAYI Platform Revenue */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Platform Revenue</span>
            <Wallet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 font-mono-code">
            UGX {totalPlatformRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium">5% Transaction Fees + PRO</div>
        </div>

        {/* 5. Total WALAYI PRO Subscriptions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">PRO Subscriptions</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-mono-code">
            UGX {proSubscriptionsRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-700">Advocate & Chambers plans</div>
        </div>

        {/* 6. Refunds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Refunds Issued</span>
            <ArrowDownLeft className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-code">
            UGX {totalRefunds.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Returned to deponents</div>
        </div>

        {/* 7. Disputed Funds */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Disputed Amount</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900 font-mono-code">
            UGX {disputedFunds.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700">Held pending review</div>
        </div>

        {/* 8. Failed Payments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed Transactions</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-700 font-mono-code">
            UGX {failedPayments.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Network / PIN timeouts</div>
        </div>

      </div>

      {/* Revenue Timeframe Breakdown Matrix */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Platform Revenue Horizons & Streams
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of retained platform revenues across standard time horizons and revenue streams.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            {(['ALL', 'TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(p => (
              <button
                key={p}
                onClick={() => setTimeFilter(p)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  timeFilter === p ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Horizons Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Today</div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-code mt-1">
              UGX {revenueToday.toLocaleString()}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">This Week</div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-code mt-1">
              UGX {revenueThisWeek.toLocaleString()}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">This Month</div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-code mt-1">
              UGX {revenueThisMonth.toLocaleString()}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">This Year</div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono-code mt-1">
              UGX {revenueThisYear.toLocaleString()}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Lifetime Total</div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-950 font-mono-code mt-1">
              UGX {revenueLifetime.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Revenue Streams Dual Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Commissioning Transaction Fees (5%)
              </div>
              <p className="text-[11px] text-blue-800">Automatic 5% deducted upon statutory signing & jurat seal</p>
            </div>
            <div className="text-right font-mono-code">
              <div className="text-lg font-extrabold text-blue-950">UGX {transactionFeesRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-blue-700">{((transactionFeesRevenue / (totalPlatformRevenue || 1)) * 100).toFixed(1)}% of revenue</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                WALAYI PRO Subscriptions
              </div>
              <p className="text-[11px] text-purple-800">Direct practitioner tier fees (Standard, Advocate, Chambers)</p>
            </div>
            <div className="text-right font-mono-code">
              <div className="text-lg font-extrabold text-purple-950">UGX {proSubscriptionsRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-purple-700">{((proSubscriptionsRevenue / (totalPlatformRevenue || 1)) * 100).toFixed(1)}% of revenue</div>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Volume & Revenue Growth Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Monthly Transaction Volume & Revenue Growth (2026)
          </h3>
          <span className="text-xs text-slate-500 font-mono-code">Uganda Shillings (UGX)</span>
        </div>

        {/* SVG Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-48 sm:h-56 border-b border-slate-200 pb-2">
            {monthlyRevenueData.map((item, idx) => {
              const heightPercent = Math.max(15, Math.round((item.revenue / (maxRevenue || 1)) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono-code font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    UGX {(item.revenue / 1000).toFixed(0)}k
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] rounded-t-xl bg-linear-to-t from-blue-700 to-blue-500 group-hover:from-blue-800 group-hover:to-blue-600 transition-all relative flex flex-col justify-end shadow-xs"
                  >
                    {/* Pro slice */}
                    {item.proRevenue > 0 && (
                      <div 
                        style={{ height: `${Math.round((item.proRevenue / item.revenue) * 100)}%` }}
                        className="w-full bg-purple-500/80 rounded-t-xl"
                        title={`PRO Subscriptions: UGX ${item.proRevenue.toLocaleString()}`}
                      />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-700">{item.month}</div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Affidavit Commissioning (Gross)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span>PRO Subscriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Dimension Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          Financial Query Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Payment Provider Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Provider</label>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Providers (MTN & Airtel)</option>
              <option value="MTN_MOMO">MTN Mobile Money</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="WALLET">Chambers Digital Wallet</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service Type</label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Services</option>
              <option value="COMMISSIONING">Affidavit Commissioning</option>
              <option value="PRO_SUBSCRIPTION">PRO Subscriptions</option>
              <option value="PAYOUT">Commissioner Payouts</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Geographic Station</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Uganda Stations</option>
              <option value="Kampala">Kampala (Commercial Division)</option>
              <option value="Jinja">Jinja High Court Circuit</option>
              <option value="Mbarara">Mbarara High Court Circuit</option>
              <option value="Gulu">Gulu High Court Circuit</option>
            </select>
          </div>

          {/* Professional Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Practitioner Account</label>
            <select
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Practitioners</option>
              {users.filter(u => u.role !== 'deponent').map(pro => (
                <option key={pro.id} value={pro.id}>{pro.fullName}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Filtered Financial Records Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            System Financial Ledger ({filteredTransactions.length} entries)
          </h3>
          <span className="text-xs text-slate-500 font-mono-code">Showing filtered reconciliation</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Transaction Ref</th>
                <th className="px-4 py-3 font-semibold">Date/Time</th>
                <th className="px-4 py-3 font-semibold">Payer / User</th>
                <th className="px-4 py-3 font-semibold">Service Type</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Gross Amount</th>
                <th className="px-4 py-3 font-semibold">Platform Fee (5%)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono-code font-bold text-blue-700">{t.transactionRef}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono-code text-[11px]">
                    {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      {t.status === 'CONFIRMED' ? 'AWAITING SETTLEMENT' : t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
