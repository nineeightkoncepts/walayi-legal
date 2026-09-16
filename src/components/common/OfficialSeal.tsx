import React from 'react';
import { AuthorityType } from '../../types';

interface OfficialSealProps {
  authorityType: AuthorityType;
  officialName: string;
  stationOrCourt: string;
  serialNumber: string;
  year?: number;
  size?: 'sm' | 'md' | 'lg';
  // The commissioner's own configured stamp (Seal Studio) — when provided,
  // the seal actually applied during commissioning reflects what they
  // designed, instead of always rendering the same fixed default look.
  borderStyle?: 'DOUBLE_RING' | 'SERRATED_NOTARIAL' | 'ORNATE_HIGH_COURT';
  emblem?: 'SCALES_OF_JUSTICE' | 'CRANE_UGANDA' | 'COURT_CREST' | 'NONE';
  inkColor?: string;
}

export const OfficialSeal: React.FC<OfficialSealProps> = ({
  authorityType,
  officialName,
  stationOrCourt,
  serialNumber,
  year = new Date().getFullYear(),
  size = 'md',
  borderStyle = 'DOUBLE_RING',
  emblem = 'SCALES_OF_JUSTICE',
  inkColor = '#1E3A8A'
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24 text-[6px]',
    md: 'w-36 h-36 text-[8px]',
    lg: 'w-48 h-48 text-[10px]'
  };

  const title = authorityType === 'commissioner_for_oaths' ? 'COMMISSIONER FOR OATHS' :
                authorityType === 'notary_public' ? 'NOTARY PUBLIC' :
                authorityType === 'judicial_officer' ? 'JUDICIAL OFFICER' :
                authorityType === 'justice_of_the_peace' ? 'JUSTICE OF THE PEACE' : 'ADVOCATE';

  const sub = authorityType === 'commissioner_for_oaths' ? 'UGANDA • CAP. 5' :
              authorityType === 'notary_public' ? 'UGANDA • CAP. 18' :
              authorityType === 'judicial_officer' ? 'JUDICIARY OF UGANDA' : 'UGANDA GAZETTED';

  const emblemGlyph = emblem === 'SCALES_OF_JUSTICE' ? '⚖️' : emblem === 'CRANE_UGANDA' ? '🇺🇬' : emblem === 'COURT_CREST' ? '★ ★ ★' : null;

  return (
    <div
      className={`relative rounded-full p-2 flex flex-col items-center justify-center text-center shadow-xs select-none bg-blue-50/50 ${
        borderStyle === 'SERRATED_NOTARIAL' ? 'border-8 border-dashed' :
        borderStyle === 'ORNATE_HIGH_COURT' ? 'border-4 border-double ring-2 ring-offset-1 ring-slate-300' :
        'border-4 border-double'
      } ${sizeClasses[size]}`}
      style={{ borderColor: inkColor, color: inkColor }}
      id={`official-seal-${serialNumber}`}
    >
      <div className="absolute inset-1 rounded-full border border-dashed pointer-events-none" style={{ borderColor: `${inkColor}66` }} />

      <div className="text-[7px] font-display-legal font-bold tracking-widest uppercase leading-none mb-1" style={{ color: inkColor }}>
        {sub}
      </div>

      <div className="w-full px-1 border-y py-0.5 my-0.5" style={{ borderColor: `${inkColor}66` }}>
        <div className="font-bold uppercase tracking-tighter truncate text-[9px]" style={{ color: inkColor }}>
          {officialName}
        </div>
        <div className="text-[7px] font-semibold" style={{ color: inkColor }}>
          {title}
        </div>
      </div>

      {emblemGlyph && (
        <div className="text-[9px] my-0.5">{emblemGlyph}</div>
      )}

      <div className="text-[6.5px] font-mono-code truncate max-w-[90%]" style={{ color: inkColor }}>
        {stationOrCourt || 'KAMPALA, UGANDA'}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[6px] font-mono-code" style={{ color: inkColor }}>
        <span>★</span>
        <span>{serialNumber}</span>
        <span>★</span>
      </div>

      <div className="text-[6px] font-bold" style={{ color: inkColor }}>
        {year}
      </div>
    </div>
  );
};
