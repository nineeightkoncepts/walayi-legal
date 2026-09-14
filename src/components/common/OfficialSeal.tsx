import React from 'react';
import { AuthorityType } from '../../types';

interface OfficialSealProps {
  authorityType: AuthorityType;
  officialName: string;
  stationOrCourt: string;
  serialNumber: string;
  year?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const OfficialSeal: React.FC<OfficialSealProps> = ({
  authorityType,
  officialName,
  stationOrCourt,
  serialNumber,
  year = new Date().getFullYear(),
  size = 'md'
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

  return (
    <div 
      className={`relative rounded-full border-4 border-double border-blue-800 bg-blue-50/50 p-2 flex flex-col items-center justify-center text-center shadow-xs select-none ${sizeClasses[size]}`}
      id={`official-seal-${serialNumber}`}
    >
      <div className="absolute inset-1 rounded-full border border-dashed border-blue-600/40 pointer-events-none" />
      
      <div className="text-[7px] font-display-legal font-bold tracking-widest text-blue-900 uppercase leading-none mb-1">
        {sub}
      </div>

      <div className="w-full px-1 border-y border-blue-800/40 py-0.5 my-0.5">
        <div className="font-bold text-blue-950 uppercase tracking-tighter truncate text-[9px]">
          {officialName}
        </div>
        <div className="text-[7px] text-blue-800 font-semibold">
          {title}
        </div>
      </div>

      <div className="text-[6.5px] text-blue-700 font-mono-code truncate max-w-[90%]">
        {stationOrCourt || 'KAMPALA, UGANDA'}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[6px] font-mono-code text-blue-800">
        <span>★</span>
        <span>{serialNumber}</span>
        <span>★</span>
      </div>

      <div className="text-[6px] text-blue-900 font-bold">
        {year}
      </div>
    </div>
  );
};
