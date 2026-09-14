import React from 'react';
import { Advertisement, AdAnalyticsSummary } from '../../../types/advertising';
import { AdService } from '../../../services/adService';
import { 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Award,
  Users,
  BarChart2
} from 'lucide-react';

interface AdAnalyticsViewProps {
  campaigns: Advertisement[];
  analytics: AdAnalyticsSummary;
}

export const AdAnalyticsView: React.FC<AdAnalyticsViewProps> = ({
  campaigns,
  analytics
}) => {
  const admobConfig = AdService.getAdMobConfig();

  // Sort top campaigns by impressions or clicks
  const topCampaigns = [...campaigns]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6" id="ad-analytics-view-root">
      
      {/* High Level Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Impressions */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code">
            <span>Direct Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {analytics.totalImpressions.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-mono-code">
            Verified direct views served
          </p>
        </div>

        {/* Metric 2: Clicks & CTR */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code">
            <span>Direct Clicks & CTR</span>
            <MousePointer className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-indigo-700">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-600 font-mono-code font-bold">
            Average CTR: {analytics.avgCtr}%
          </p>
        </div>

        {/* Metric 3: Leads Captured */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code">
            <span>Verified Leads</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-emerald-700">
            {analytics.totalLeads.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-mono-code">
            Direct CTA inquiries & appointments
          </p>
        </div>

        {/* Metric 4: Total Advertising Revenue (UGX + USD) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code">
            <span>Advertising Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono-code text-amber-800">
            UGX {(analytics.directAdRevenueUGX / 1000000).toFixed(1)}M
          </div>
          <p className="text-[10px] text-slate-500 font-mono-code">
            Direct: UGX {analytics.directAdRevenueUGX.toLocaleString()} • AdMob: ${analytics.admobRevenueUSD.toFixed(2)}
          </p>
        </div>

      </div>

      {/* Subsystem Comparison Breakdown (Direct vs AdMob) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Channel A: WALAYI Direct Advertising */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h4 className="font-bold text-sm text-slate-900">CHANNEL A: WALAYI DIRECT ADVERTISING</h4>
            </div>
            <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
              High Value
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-slate-900">{analytics.activeCampaignsCount}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">Active Campaigns</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-slate-900">{analytics.sponsoredProsCount}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">Sponsored Pros</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-slate-900">{analytics.pendingReviewCount}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">Pending Review</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            WALAYI Direct connects institutional sponsors, law firms, CLE providers, and banks directly with verified legal practitioners and deponents.
          </p>
        </div>

        {/* Channel B: Google AdMob Programmatic */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h4 className="font-bold text-sm text-slate-900">CHANNEL B: GOOGLE ADMOB PROGRAMMATIC</h4>
            </div>
            <span className={`text-xs font-mono-code px-2 py-0.5 rounded font-bold ${
              admobConfig.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {admobConfig.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-slate-900">{admobConfig.testImpressions}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">Programmatic Views</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-slate-900">{admobConfig.testClicks}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">AdMob Clicks</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-base font-bold font-mono-code text-emerald-700">${admobConfig.estimatedRevenueUSD.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 font-mono-code">Estimated USD</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Google AdMob serves fill banners on discovery screens in compliant mobile and web viewports.
          </p>
        </div>

      </div>

      {/* Top Performing Campaigns Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          Top Performing Campaigns Breakdown
        </h4>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono-code border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Campaign Name</th>
                <th className="px-3 py-3 font-semibold">Advertiser</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold text-right">Impressions</th>
                <th className="px-3 py-3 font-semibold text-right">Clicks</th>
                <th className="px-3 py-3 font-semibold text-right">CTR</th>
                <th className="px-3 py-3 font-semibold text-right">Leads</th>
                <th className="px-4 py-3 font-semibold text-right">Spent (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {topCampaigns.map(c => {
                const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 truncate max-w-[200px]">
                      {c.campaignName}
                    </td>
                    <td className="px-3 py-3 font-mono-code text-slate-600">
                      {c.advertiserName}
                    </td>
                    <td className="px-3 py-3 capitalize font-mono-code text-[11px]">
                      {c.advertisementType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-code">{c.impressions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono-code font-bold text-blue-700">{c.clicks.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono-code text-emerald-700 font-semibold">{ctr}%</td>
                    <td className="px-3 py-3 text-right font-mono-code font-bold">{c.leads}</td>
                    <td className="px-4 py-3 text-right font-mono-code text-slate-900 font-bold">
                      {c.spentUGX ? `UGX ${c.spentUGX.toLocaleString()}` : 'House / N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
