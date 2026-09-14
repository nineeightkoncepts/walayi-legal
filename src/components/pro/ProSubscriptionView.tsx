import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Check, 
  Crown, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ProSubscriptionView: React.FC = () => {
  const { currentUser, updateCurrentUser, addNotification } = useApp();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [momoPhone, setMomoPhone] = useState(currentUser.phone || '+256 772 491 002');
  const [provider, setProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [isActivating, setIsActivating] = useState(false);

  const priceUGX = billingCycle === 'MONTHLY' ? 75000 : 750000;

  const handleUpgrade = () => {
    setIsActivating(true);
    setTimeout(() => {
      updateCurrentUser({
        isProSubscriber: true
      });
      setIsActivating(false);
      addNotification(
        'WALAYI PRO Activated',
        `Your Pro Subscription is active (${billingCycle}). You now enjoy featured marketplace placement and custom seal branding.`,
        'SUCCESS'
      );
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16" id="pro-tier-container">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono-code border border-blue-200">
          <Crown className="w-4 h-4 text-blue-600" />
          FOR PRACTISING ADVOCATES & NOTARIES
        </div>
        <h1 className="text-3xl sm:text-4xl font-display-legal font-bold text-slate-900">
          WALAYI <span className="text-blue-600">PRO</span> for Legal Practitioners
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Scale your commissioning practice, secure featured client placement on the national marketplace, and unlock bespoke digital law firm seal stamps.
        </p>

        {/* Billing cycle toggle */}
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl gap-2 mt-4">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'MONTHLY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly (UGX 75,000)
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'YEARLY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Annual (UGX 750,000) <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-1 font-semibold">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Standard Tier */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Standard Tier</h3>
            <div className="text-2xl font-mono-code font-bold text-slate-900">
              UGX 0 <span className="text-xs text-slate-500 font-normal">/ month</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Basic statutory listing for enrolled Commissioners for Oaths and Notaries.
            </p>

            <ul className="space-y-3 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                Standard marketplace listing
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                HD End-to-End Encrypted Video Commissioning Room
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                Flat UGX 3,800 platform fee per commissioning
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 text-center">—</span>
                Standard queue routing
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 text-center">—</span>
                Standard generic statutory seal
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            Included by default upon credential verification
          </div>
        </div>

        {/* PRO Tier Card */}
        <div className="p-8 rounded-3xl bg-white border-2 border-blue-600 space-y-6 flex flex-col justify-between shadow-md relative">
          
          <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs font-mono-code">
            RECOMMENDED FOR ADVOCATES
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-900">WALAYI PRO</h3>
            </div>

            <div className="text-3xl font-mono-code font-extrabold text-slate-900">
              UGX {priceUGX.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {billingCycle === 'MONTHLY' ? 'month' : 'year'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Priority client dispatch, custom law firm embossing stamps, and verified PRO badge.
            </p>

            <ul className="space-y-3 text-xs text-slate-800 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <strong>Priority Featured Marketplace Placement</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <strong>Custom Law Firm Digital Seal & High Court Crest</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <strong>Instant Client Auto-Dispatch ("Available Now" Priority)</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Flat UGX 3,800 platform fee per commissioning
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Dedicated compliance vault assistant & annual PC renewal reminders
              </li>
            </ul>
          </div>

          {/* Upgrade CTA Form */}
          <div className="space-y-3 pt-2">
            
            {currentUser.isProSubscriber ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Active PRO Membership ({currentUser.fullName})
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('MTN_MOMO')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      provider === 'MTN_MOMO' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('AIRTEL_MONEY')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      provider === 'AIRTEL_MONEY' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Airtel Money
                  </button>
                </div>

                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono-code text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+256 77X XXX XXX"
                />

                <button
                  onClick={handleUpgrade}
                  disabled={isActivating}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                  id="btn-subscribe-pro"
                >
                  {isActivating ? (
                    'Confirming Mobile Money PIN...'
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Subscribe via {provider === 'MTN_MOMO' ? 'MTN' : 'Airtel'} (UGX {priceUGX.toLocaleString()})
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
