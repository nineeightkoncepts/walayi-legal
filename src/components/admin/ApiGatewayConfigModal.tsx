import React, { useState } from 'react';
import { ApiConfigService, ApiGatewayConfig } from '../../services/apiConfigService';
import { 
  X, 
  Key, 
  Smartphone, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ExternalLink,
  ShieldCheck,
  Server,
  Lock
} from 'lucide-react';

interface ApiGatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiGatewayConfigModal: React.FC<ApiGatewayConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiGatewayConfig>(() => ApiConfigService.loadConfig());
  const [activeTab, setActiveTab] = useState<'MTN' | 'AIRTEL' | 'DAILY'>('MTN');
  
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ loading: false });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    ApiConfigService.saveConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestMtn = async () => {
    setTestStatus({ loading: true });
    const res = await ApiConfigService.testMtnConnection(config.mtnMomo);
    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs
    });
  };

  const handleTestAirtel = async () => {
    setTestStatus({ loading: true });
    const res = await ApiConfigService.testAirtelConnection(config.airtelMoney);
    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs
    });
  };

  const handleTestDaily = async () => {
    setTestStatus({ loading: true });
    const res = await ApiConfigService.testDailyConnection(config.dailyCo);
    setTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn" id="api-gateway-config-modal-overlay">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display-legal font-bold text-lg text-white">
                  API Secrets & Gateway Configuration
                </h2>
                <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SYSTEM KEYS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure MTN MoMo, Airtel Money OpenAPI, and Daily.Co WebRTC video endpoints.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close API Configuration"
            id="btn-close-api-config"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab('MTN'); setTestStatus({ loading: false }); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'MTN'
                ? 'bg-white border-slate-200 text-amber-700 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="tab-btn-mtn-momo"
          >
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span>MTN Mobile Money</span>
            {config.mtnMomo.isConfigured && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => { setActiveTab('AIRTEL'); setTestStatus({ loading: false }); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'AIRTEL'
                ? 'bg-white border-slate-200 text-red-700 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="tab-btn-airtel-money"
          >
            <Smartphone className="w-4 h-4 text-red-500" />
            <span>Airtel Money OpenAPI</span>
            {config.airtelMoney.isConfigured && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => { setActiveTab('DAILY'); setTestStatus({ loading: false }); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-white border-slate-200 text-blue-700 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            id="tab-btn-daily-co"
          >
            <Video className="w-4 h-4 text-blue-500" />
            <span>Daily.co Video WebRTC</span>
            {config.dailyCo.isConfigured && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* MTN MOMO TAB */}
          {activeTab === 'MTN' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">MTN Mobile Money Uganda (MoMo API)</p>
                  <p className="text-amber-800 leading-relaxed">
                    Processes escrow deposits from Ugandan deponents via MTN MoMo Collection API. Supports instant USSD prompt generation and payment webhook confirmations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>API User ID (X-Reference-Id UUID)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                          const r = Math.random() * 16 | 0;
                          const v = c === 'x' ? r : (r & 0x3 | 0x8);
                          return v.toString(16);
                        });
                        setConfig({
                          ...config,
                          mtnMomo: { ...config.mtnMomo, userId: uuid }
                        });
                      }}
                      className="text-[10px] text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                    >
                      + Generate UUID v4
                    </button>
                  </label>
                  <input
                    type="text"
                    value={config.mtnMomo.userId}
                    onChange={(e) => setConfig({
                      ...config,
                      mtnMomo: { ...config.mtnMomo, userId: e.target.value }
                    })}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    id="input-mtn-user-id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Environment
                  </label>
                  <select
                    value={config.mtnMomo.targetEnv}
                    onChange={(e) => setConfig({
                      ...config,
                      mtnMomo: { ...config.mtnMomo, targetEnv: e.target.value as 'sandbox' | 'live' }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    id="select-mtn-env"
                  >
                    <option value="sandbox">Sandbox (Testing / Mock USSD)</option>
                    <option value="live">Live Production (MTN Uganda Production)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Primary Subscription Key (Ocp-Apim-Subscription-Key)</span>
                    <span className="text-[10px] text-slate-400 font-mono-code font-normal">Stored securely in local session</span>
                  </label>
                  <input
                    type="password"
                    value={config.mtnMomo.subscriptionKey}
                    onChange={(e) => setConfig({
                      ...config,
                      mtnMomo: { ...config.mtnMomo, subscriptionKey: e.target.value }
                    })}
                    placeholder="Enter your MTN MoMo Primary Subscription Key"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    id="input-mtn-subscription-key"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    API Key / Secret Token
                  </label>
                  <input
                    type="password"
                    value={config.mtnMomo.apiKey}
                    onChange={(e) => setConfig({
                      ...config,
                      mtnMomo: { ...config.mtnMomo, apiKey: e.target.value }
                    })}
                    placeholder="Enter your MTN MoMo API Key Secret"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    id="input-mtn-api-key"
                  />
                </div>
              </div>

              {/* Step-by-Step Developer Guide for MTN MoMo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 font-display-legal">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    How to get your MTN MoMo API Secrets (Step-by-Step):
                  </span>
                  <a
                    href="https://momodeveloper.mtn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 underline"
                  >
                    <span>Open MTN MoMo Developer Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Log in or register at <strong>momodeveloper.mtn.com</strong>.
                  </li>
                  <li>
                    Go to <strong>Products</strong> &rarr; Select <strong>Collections</strong> &rarr; Click <strong>Subscribe</strong>.
                  </li>
                  <li>
                    Copy your <strong>Primary Subscription Key</strong> (Ocp-Apim-Subscription-Key) and paste it into the field above.
                  </li>
                  <li>
                    Click the <strong>Generate UUID v4</strong> button above to populate a valid <em>API User ID</em>.
                  </li>
                  <li>
                    For Sandbox testing, select <strong>Sandbox</strong> or switch to <strong>Live</strong> for MTN Uganda production settlement.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestMtn}
                  disabled={testStatus.loading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-test-mtn-connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin text-amber-600' : ''}`} />
                  {testStatus.loading ? 'Testing Connection...' : 'Test MTN Connection'}
                </button>

                <span className="text-[11px] text-slate-500">
                  Target Currency: <strong className="text-slate-800">UGX (Ugandan Shillings)</strong>
                </span>
              </div>
            </div>
          )}

          {/* AIRTEL MONEY TAB */}
          {activeTab === 'AIRTEL' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 space-y-1">
                  <p className="font-bold">Airtel Money Uganda OpenAPI</p>
                  <p className="text-red-800 leading-relaxed">
                    Direct integration with Airtel Uganda B2C and C2B escrow rails for deponent payments and advocate instant fee settlements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client ID (Airtel Developer Portal)
                  </label>
                  <input
                    type="text"
                    value={config.airtelMoney.clientId}
                    onChange={(e) => setConfig({
                      ...config,
                      airtelMoney: { ...config.airtelMoney, clientId: e.target.value }
                    })}
                    placeholder="Enter Airtel Money Client ID"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    id="input-airtel-client-id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Environment
                  </label>
                  <select
                    value={config.airtelMoney.targetEnv}
                    onChange={(e) => setConfig({
                      ...config,
                      airtelMoney: { ...config.airtelMoney, targetEnv: e.target.value as 'staging' | 'production' }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-white"
                    id="select-airtel-env"
                  >
                    <option value="staging">Staging (Sandbox Mock)</option>
                    <option value="production">Production (Live Airtel UG)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Secret Key
                  </label>
                  <input
                    type="password"
                    value={config.airtelMoney.clientSecret}
                    onChange={(e) => setConfig({
                      ...config,
                      airtelMoney: { ...config.airtelMoney, clientSecret: e.target.value }
                    })}
                    placeholder="Enter Airtel Money Client Secret"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    id="input-airtel-client-secret"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN / Encryption Key
                  </label>
                  <input
                    type="password"
                    value={config.airtelMoney.pin}
                    onChange={(e) => setConfig({
                      ...config,
                      airtelMoney: { ...config.airtelMoney, pin: e.target.value }
                    })}
                    placeholder="Enter Airtel Money Security PIN / RSA Key"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    id="input-airtel-pin"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestAirtel}
                  disabled={testStatus.loading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-test-airtel-connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin text-red-600' : ''}`} />
                  {testStatus.loading ? 'Testing Connection...' : 'Test Airtel Connection'}
                </button>

                <span className="text-[11px] text-slate-500">
                  Country Code: <strong className="text-slate-800">UG (+256)</strong>
                </span>
              </div>
            </div>
          )}

          {/* DAILY.CO TAB */}
          {activeTab === 'DAILY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Daily.co WebRTC Video Infrastructure</p>
                  <p className="text-blue-800 leading-relaxed">
                    Provides low-latency, end-to-end encrypted statutory video rooms with cloud recording archives for legal evidential compliance under the Electronic Transactions Act 2011.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Domain URL
                  </label>
                  <input
                    type="text"
                    value={config.dailyCo.domain}
                    onChange={(e) => setConfig({
                      ...config,
                      dailyCo: { ...config.dailyCo, domain: e.target.value }
                    })}
                    placeholder="e.g. https://wallahi.daily.co"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    id="input-daily-domain"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily API Key (REST Management Key)
                  </label>
                  <input
                    type="password"
                    value={config.dailyCo.apiKey}
                    onChange={(e) => setConfig({
                      ...config,
                      dailyCo: { ...config.dailyCo, apiKey: e.target.value }
                    })}
                    placeholder="Enter your Daily.co API Key"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    id="input-daily-api-key"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Room Name Prefix
                  </label>
                  <input
                    type="text"
                    value={config.dailyCo.roomPrefix}
                    onChange={(e) => setConfig({
                      ...config,
                      dailyCo: { ...config.dailyCo, roomPrefix: e.target.value }
                    })}
                    placeholder="wallahi-commissioning-"
                    className="w-full px-3 py-2 text-xs font-mono-code rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    id="input-daily-prefix"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.dailyCo.enableE2EE}
                      onChange={(e) => setConfig({
                        ...config,
                        dailyCo: { ...config.dailyCo, enableE2EE: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Force End-to-End Encryption (E2EE)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 ml-6">
                    Statutory requirement for confidential witness testimony
                  </span>
                </div>
              </div>

              {/* Step-by-Step Developer Guide for Daily.co */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 font-display-legal">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    How to get your Daily.co API Secrets (Step-by-Step):
                  </span>
                  <a
                    href="https://dashboard.daily.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 underline"
                  >
                    <span>Open Daily.co Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Log in to your account at <strong>dashboard.daily.co</strong> (or sign up for free).
                  </li>
                  <li>
                    Click on <strong>Developers</strong> on the left navigation menu.
                  </li>
                  <li>
                    Under <strong>API keys</strong>, click <em>Create API key</em> and copy the generated secret key. Paste it into the <strong>Daily API Key</strong> field above.
                  </li>
                  <li>
                    Your <strong>Daily Domain</strong> is your Daily workspace URL (e.g. <code>https://your-domain.daily.co</code>), visible at the top of your Daily dashboard.
                  </li>
                  <li>
                    Click <strong>Test Daily.Co Signaling</strong> to verify handshake, then click <strong>Save & Apply Credentials</strong>.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestDaily}
                  disabled={testStatus.loading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-test-daily-connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin text-blue-600' : ''}`} />
                  {testStatus.loading ? 'Testing Domain...' : 'Test Daily.Co Signaling'}
                </button>

                <span className="text-[11px] text-slate-500">
                  WebRTC Protocol: <strong className="text-slate-800">SFU Low Latency</strong>
                </span>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testStatus.message && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 border ${
              testStatus.success 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {testStatus.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div className="flex-1">
                <span>{testStatus.message}</span>
                {testStatus.latencyMs && (
                  <span className="font-mono-code text-[10px] opacity-80 ml-2">({testStatus.latencyMs}ms)</span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Credentials encrypted in local storage & synced with environment</span>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Saved!
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              id="btn-save-api-config"
            >
              <Save className="w-4 h-4" />
              Save & Apply Credentials
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
