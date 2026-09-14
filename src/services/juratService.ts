import { SolemnisationType, AuthorityType } from '../types';

export interface JuratParams {
  deponentName: string;
  commissionerName: string;
  commissionerAuthority: AuthorityType;
  courtStationOrCity: string;
  solemnisationType: SolemnisationType;
  date: Date;
  certificateNumber: string;
  licenceNumber?: string;
  language?: 'English' | 'Luganda' | 'Swahili';
}

export function generateStatutoryJurat(params: JuratParams): string {
  const {
    deponentName,
    commissionerName,
    commissionerAuthority,
    courtStationOrCity,
    solemnisationType,
    date,
    certificateNumber,
    licenceNumber
  } = params;

  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let solemnisationClause = 'SWORN';
  if (solemnisationType === 'solemn_affirmation') {
    solemnisationClause = 'AFFIRMED';
  }

  let religiousDetail = '';
  if (solemnisationType === 'holy_bible') {
    religiousDetail = ' (on the Holy Bible)';
  } else if (solemnisationType === 'holy_quran') {
    religiousDetail = ' (on the Holy Qur\'an)';
  } else if (solemnisationType === 'solemn_affirmation') {
    religiousDetail = ' (solemnly and sincerely affirming)';
  }

  let authorityTitle = 'COMMISSIONER FOR OATHS';
  if (commissionerAuthority === 'notary_public') {
    authorityTitle = 'NOTARY PUBLIC';
  } else if (commissionerAuthority === 'judicial_officer') {
    authorityTitle = 'MAGISTRATE / REGISTRAR (EX-OFFICIO COMMISSIONER)';
  } else if (commissionerAuthority === 'justice_of_the_peace') {
    authorityTitle = 'JUSTICE OF THE PEACE';
  }

  return `${solemnisationClause}${religiousDetail} by the said ${deponentName.toUpperCase()} at ${courtStationOrCity.toUpperCase()} this ${day} day of ${month}, ${year}.

BEFORE ME:
_______________________________________
${commissionerName.toUpperCase()}
${authorityTitle}
${licenceNumber ? `Licence/Ref: ${licenceNumber}` : 'Authority: Derived pursuant to Applicable Law'}
Digital Jurat Certificate ID: ${certificateNumber}
Electronic Jurat authenticated via WALAYI Legal Infrastructure`;
}

export function getStatutoryOathText(solemnisationType: SolemnisationType, language: 'English' | 'Luganda' | 'Swahili' = 'English'): string {
  if (language === 'Luganda') {
    if (solemnisationType === 'solemn_affirmation') {
      return "Nze, nzikiriza era nkakasa mu bwesimbu nti ebiwandiikiddwa mu kiwandiiko kino bya mazima nga bwe ntegeera era bwe nzikiriza.";
    } else {
      return "Nze, ndayira mu linnya lya Katonda Omuyinza w'ebintu byonna nti ebiwandiikiddwa mu kiwandiiko kino bya mazima, era bwe kityo Katonda annyambe.";
    }
  }

  if (solemnisationType === 'holy_bible') {
    return "I swear by Almighty God that the contents of this affidavit are true to the best of my knowledge, information, and belief, so help me God.";
  } else if (solemnisationType === 'holy_quran') {
    return "I swear by Allah, the Almighty, the Most Gracious, the Most Merciful, that the contents of this my deposition are true to the best of my knowledge, information, and belief.";
  } else {
    return "I do solemnly and sincerely affirm and declare that the contents of this affidavit/declaration are true to the best of my knowledge, information, and belief.";
  }
}

export interface ExhibitParams {
  identifier: string; // e.g. "A", "B", "C", "D1"
  deponentName: string;
  commissionerName: string;
  commissionerAuthority: AuthorityType;
  courtStationOrCity: string;
  date: Date;
  certificateNumber: string;
  licenceNumber?: string;
  solemnisationType?: SolemnisationType;
}

export function generateStatutoryExhibitWording(params: ExhibitParams): string {
  const {
    identifier,
    deponentName,
    commissionerName,
    commissionerAuthority,
    courtStationOrCity,
    date,
    certificateNumber,
    licenceNumber,
    solemnisationType = 'holy_bible'
  } = params;

  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const swornOrAffirmed = solemnisationType === 'solemn_affirmation' ? 'affirmed/declared' : 'sworn/declared';

  let authorityTitle = 'COMMISSIONER FOR OATHS';
  if (commissionerAuthority === 'notary_public') {
    authorityTitle = 'NOTARY PUBLIC';
  } else if (commissionerAuthority === 'judicial_officer') {
    authorityTitle = 'MAGISTRATE / REGISTRAR (EX-OFFICIO COMMISSIONER)';
  } else if (commissionerAuthority === 'justice_of_the_peace') {
    authorityTitle = 'JUSTICE OF THE PEACE';
  }

  return `This is the exhibit marked "${identifier}" referred to in the annexed affidavit of ${deponentName.toUpperCase()} ${swornOrAffirmed} before me this ${day} day of ${month}, ${year}, at ${courtStationOrCity.toUpperCase()}.

BEFORE ME:
_______________________________________
${commissionerName.toUpperCase()}
${authorityTitle}
${licenceNumber ? `Licence/Ref: ${licenceNumber}` : 'Authority: Statutory Commission'}
Document Master ID: ${certificateNumber}
Exhibit Identification Ref: EXHIBIT-${identifier.toUpperCase()}`;
}

