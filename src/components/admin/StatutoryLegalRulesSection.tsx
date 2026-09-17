import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LegalPolicyRule } from '../../types';
import { 
  Scale, 
  Wallet, 
  BookOpen, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react';

export const StatutoryLegalRulesSection: React.FC = () => {
  const { 
    policyRules, 
    updateLegalPolicy, 
    platformFeePercentage, 
    setPlatformFee 
  } = useApp();

  const [feeInput, setFeeInput] = useState(platformFeePercentage.toString());
  const [editingRule, setEditingRule] = useState<LegalPolicyRule | null>(null);

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(feeInput);
    if (!isNaN(val) && val >= 0 && val <= 30) {
      setPlatformFee(val);
    }
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      updateLegalPolicy(editingRule);
      setEditingRule(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="master-admin-statutory-rules-section">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              UGANDA STATUTORY CODEX
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ACTS OF PARLIAMENT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display-legal font-bold text-slate-900 mt-1">
            Statutory Legal Policy Matrix & Fee Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Configure statutory ceremony compliance rules, statutory fee schedules, and platform transaction commission parameters.
          </p>
        </div>
      </div>

      {/* Platform Fee Configuration Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          WALAYI Commission Fee Configurator
        </h3>
        <p className="text-xs text-slate-500">
          Set the platform commission percentage automatically retained upon successful jurat execution.
        </p>

        <form onSubmit={handleSaveFee} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commission Fee Rate (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="w-32 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-mono-code font-bold text-base focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Update Fee Rate
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div>Current Active Rate: <span className="font-bold text-blue-700">{platformFeePercentage}%</span></div>
            <div className="text-[11px] text-slate-500">Example: On a UGX 25,000 affidavit, platform retains UGX {Math.round(25000 * platformFeePercentage / 100).toLocaleString()}, practitioner receives UGX {Math.round(25000 * (1 - platformFeePercentage / 100)).toLocaleString()}.</div>
          </div>
        </form>
      </div>

      {/* Statutory Rules Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Statutory Policy Rules Matrix
        </h3>
        <p className="text-xs text-slate-500">
          The legal basis and authority limits codified under Uganda statutory instruments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policyRules.map((rule) => (
            <div
              key={rule.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{rule.authorityTitle}</h4>
                  <span className="text-[11px] font-mono-code text-blue-700">{rule.statutoryBasis}</span>
                </div>
                <button
                  onClick={() => setEditingRule(rule)}
                  className="p-1.5 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                <div>
                  <span className="font-semibold text-slate-800">Verification Requirement:</span> {rule.verificationRequirements}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Jurat Wording:</span>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 font-serif italic text-[11px] mt-1 text-slate-700">
                    "{rule.mandatoryJuratFormat}"
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 font-mono-code text-[11px]">
                  <span className="text-slate-500">Statutory Min Fee:</span>
                  <span className="font-bold text-slate-900">UGX {rule.minFeeUGX.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs m-auto">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-blue-100 text-blue-800">
                  EDIT STATUTORY RULE
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {editingRule.authorityTitle}
                </h3>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Basis (Act / Cap)</label>
                <input
                  type="text"
                  value={editingRule.statutoryBasis}
                  onChange={(e) => setEditingRule({ ...editingRule, statutoryBasis: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Requirements</label>
                <textarea
                  rows={2}
                  value={editingRule.verificationRequirements}
                  onChange={(e) => setEditingRule({ ...editingRule, verificationRequirements: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Jurat Format</label>
                <textarea
                  rows={2}
                  value={editingRule.mandatoryJuratFormat}
                  onChange={(e) => setEditingRule({ ...editingRule, mandatoryJuratFormat: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  Save Statutory Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
