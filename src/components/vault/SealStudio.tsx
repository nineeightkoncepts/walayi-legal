import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  Sparkles, 
  Crown, 
  Check, 
  ShieldCheck, 
  Scale, 
  Building, 
  Palette, 
  Type, 
  CircleDot,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const SealStudio: React.FC = () => {
  const { currentUser, updateCurrentUser, addNotification, executePayment } = useApp();

  const [sealTier, setSealTier] = useState<'STANDARD' | 'CUSTOM'>(
    currentUser.sealDesign?.designType === 'CUSTOM' ? 'CUSTOM' : 'STANDARD'
  );
  
  // Customization controls
  const [borderStyle, setBorderStyle] = useState<'DOUBLE_RING' | 'SERRATED_NOTARIAL' | 'ORNATE_HIGH_COURT'>(
    currentUser.sealDesign?.borderStyle || 'DOUBLE_RING'
  );
  const [fontFamily, setFontFamily] = useState<'SERIF_CLASSIC' | 'SANS_MODERN' | 'GOTHIC_LEGAL'>(
    currentUser.sealDesign?.fontFamily || 'SERIF_CLASSIC'
  );
  const [emblem, setEmblem] = useState<'SCALES_OF_JUSTICE' | 'CRANE_UGANDA' | 'COURT_CREST' | 'NONE'>(
    currentUser.sealDesign?.emblem || 'SCALES_OF_JUSTICE'
  );
  const [inkColor, setInkColor] = useState<string>(
    currentUser.sealDesign?.inkColor || '#1E3A8A' // Deep Blue
  );
  const [includeChambers, setIncludeChambers] = useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const customPriceUGX = currentUser.isProSubscriber ? 0 : 20000;

  const authorityLabel = currentUser.role === 'commissioner' ? 'COMMISSIONER FOR OATHS' :
                         currentUser.role === 'notary' ? 'NOTARY PUBLIC' :
                         currentUser.role === 'judicial_officer' ? 'JUDICIAL OFFICER' :
                         currentUser.role === 'justice_of_peace' ? 'JUSTICE OF THE PEACE' : 'ADVOCATE OF THE HIGH COURT';

  const statutoryRef = currentUser.role === 'commissioner' ? 'CAP. 5 LAWS OF UGANDA' :
                       currentUser.role === 'notary' ? 'CAP. 18 LAWS OF UGANDA' :
                       currentUser.role === 'justice_of_peace' ? 'CAP. 15 LAWS OF UGANDA' : 'HIGH COURT OF UGANDA';

  const handleSaveSeal = async () => {
    if (sealTier === 'CUSTOM' && !currentUser.isProSubscriber && currentUser.sealDesign?.designType !== 'CUSTOM') {
      setIsPurchasing(true);
      try {
        await executePayment({
          serviceFeeUGX: customPriceUGX,
          provider: 'MTN_MOMO',
          phoneNumber: currentUser.phone || '+256772491002',
          purpose: 'COMMISSIONING_ESCROW'
        });
        setIsPurchasing(false);
      } catch (e) {
        setIsPurchasing(false);
      }
    }

    updateCurrentUser({
      sealDesign: {
        designType: sealTier,
        borderStyle,
        fontFamily,
        emblem,
        inkColor,
        updatedAt: new Date().toISOString()
      }
    });

    addNotification(
      'Seal Design Saved',
      `Your ${sealTier === 'CUSTOM' ? 'Custom Chambers Seal' : 'Standard Statutory Seal'} is active and will be used during document commissioning.`,
      'SYSTEM'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="seal-studio-container">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono-code border border-blue-500/30">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            WALAYI PROFESSIONAL SEAL STUDIO
          </div>
          {currentUser.isProSubscriber && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-code flex items-center gap-1 font-bold">
              <Crown className="w-3 h-3 text-amber-400" />
              PRO UNLOCKED (FREE BESPOKE SEALS)
            </span>
          )}
        </div>

        <h2 className="text-2xl font-display-legal font-bold">
          Statutory & Chambers Digital Seal Studio
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Configure your official digital stamp. The engine pulls your verified full name, practising station, and statutory warrant basis directly from your verified credentials.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tier Selection (Standard vs Custom) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              1. Choose Seal Tier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSealTier('STANDARD')}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer space-y-2 ${
                  sealTier === 'STANDARD'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Standard Statutory Seal</span>
                  <span className="text-[10px] font-mono-code font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    FREE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Default statutory double-ring layout compliant with the Commissioners for Oaths Act.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSealTier('CUSTOM')}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer space-y-2 relative ${
                  sealTier === 'CUSTOM'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Custom Chambers Seal
                  </span>
                  <span className="text-[10px] font-mono-code font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {currentUser.isProSubscriber ? 'PRO FREE' : 'UGX 20,000'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bespoke law firm crests, ornate borders, custom typography & ink customization.
                </p>
              </button>
            </div>
          </div>

          {/* Customization Options */}
          {sealTier === 'CUSTOM' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-900">
                2. Bespoke Styling Controls
              </h3>

              {/* Border Styles */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5 text-blue-600" />
                  Border Construction
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DOUBLE_RING', label: 'Classic Double' },
                    { id: 'SERRATED_NOTARIAL', label: 'Serrated Notarial' },
                    { id: 'ORNATE_HIGH_COURT', label: 'High Court Ornate' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBorderStyle(b.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        borderStyle === b.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  Statutory Typography
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SERIF_CLASSIC', label: 'Playfair Legal' },
                    { id: 'SANS_MODERN', label: 'Modern Clean' },
                    { id: 'GOTHIC_LEGAL', label: 'Monospace Code' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFontFamily(t.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        fontFamily === t.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emblem */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  Center Legal Emblem
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'SCALES_OF_JUSTICE', label: 'Scales ⚖️' },
                    { id: 'CRANE_UGANDA', label: 'Crest 🇺🇬' },
                    { id: 'COURT_CREST', label: 'Star ★' },
                    { id: 'NONE', label: 'Text Only' }
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEmblem(e.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        emblem === e.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink Color */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Statutory Ink Tone
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#1E3A8A', name: 'High Court Blue' },
                    { color: '#0F172A', name: 'Judicial Obsidian' },
                    { color: '#881337', name: 'Chambers Burgundy' },
                    { color: '#064E3B', name: 'Statutory Emerald' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setInkColor(c.color)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-all ${
                        inkColor === c.color ? 'ring-2 ring-blue-500 border-transparent shadow-xs' : 'border-slate-200'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.color }} />
                      <span className="text-[11px] text-slate-700">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Chambers display */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeChambers}
                    onChange={(e) => setIncludeChambers(e.target.checked)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span>
                    Include Law Firm / Chambers Name (<strong className="text-slate-900">{currentUser.lawFirmName || 'Chambers of Advocate'}</strong>) on stamp ring
                  </span>
                </label>
              </div>

            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleSaveSeal}
            disabled={isPurchasing}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            id="btn-save-seal-design"
          >
            {isPurchasing ? 'Processing Mobile Money...' : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activate & Save {sealTier === 'CUSTOM' ? 'Custom Chambers Seal' : 'Standard Statutory Seal'}
              </>
            )}
          </button>

        </div>

        {/* Right Column: Live Seal Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Live Seal Preview
              </h3>
              <span className="text-[10px] font-mono-code text-slate-400">
                100% VECTOR SVG
              </span>
            </div>

            {/* Visual Stamp Card */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              
              {/* Dynamic SVG Seal */}
              <div 
                className={`relative rounded-full p-4 flex flex-col items-center justify-center text-center select-none shadow-sm transition-all ${
                  borderStyle === 'SERRATED_NOTARIAL' ? 'border-8 border-dashed' :
                  borderStyle === 'ORNATE_HIGH_COURT' ? 'border-4 border-double ring-4 ring-offset-2 ring-slate-300' :
                  'border-4 border-double'
                }`}
                style={{ 
                  borderColor: inkColor,
                  color: inkColor,
                  width: '240px',
                  height: '240px'
                }}
                id="live-studio-seal-preview"
              >
                <div 
                  className="absolute inset-1 rounded-full border pointer-events-none" 
                  style={{ borderColor: `${inkColor}40` }}
                />

                {/* Top subtitle */}
                <div className="text-[8px] font-display-legal font-bold tracking-widest uppercase leading-none mb-1">
                  UGANDA • {statutoryRef}
                </div>

                {/* Law Firm Name if enabled */}
                {includeChambers && currentUser.lawFirmName && (
                  <div className="text-[7.5px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-[180px]">
                    {currentUser.lawFirmName}
                  </div>
                )}

                {/* Center Content */}
                <div className="w-full px-2 border-y py-1 my-1" style={{ borderColor: `${inkColor}60` }}>
                  <div className="font-bold uppercase tracking-tight text-[11px] font-display-legal truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[8px] font-semibold tracking-wider">
                    {authorityLabel}
                  </div>
                </div>

                {/* Emblem */}
                {emblem !== 'NONE' && (
                  <div className="text-xs my-0.5">
                    {emblem === 'SCALES_OF_JUSTICE' ? '⚖️' : emblem === 'CRANE_UGANDA' ? '🇺🇬' : '★ ★ ★'}
                  </div>
                )}

                {/* Station */}
                <div className="text-[7.5px] font-mono-code truncate max-w-[180px]">
                  {currentUser.stationCity || 'KAMPALA, UGANDA'}
                </div>

                <div className="text-[7.5px] font-bold mt-1">
                  YEAR {new Date().getFullYear()} • CFO-WAL
                </div>
              </div>

            </div>

            {/* Metadata Summary */}
            <div className="text-xs text-slate-600 space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono-code text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Verified Name:</span>
                <span className="font-bold text-slate-900">{currentUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authority Class:</span>
                <span className="text-blue-700 font-bold">{authorityLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Station / Chambers:</span>
                <span className="text-slate-700">{currentUser.stationCity || 'Kampala'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
