import { UserProfile, CommissioningRequest, LegalPolicyRule, ReviewItem, CredentialDocument, AdminAuditEvent, DisputeItem, PaymentTransaction } from '../types';

export const MASTER_ADMIN_USER: UserProfile = {
  id: 'master-admin-ambrose',
  fullName: 'Ambrose (Master Admin)',
  email: 'admin@walayi.ug',
  phone: '+256 700 000 001',
  role: 'master_admin',
  avatarUrl: '',
  nationalIdNumber: 'CM88011234AB5K',
  stationCity: 'Kampala (WALAYI Master HQ)',
  isProSubscriber: true,
  proPlanName: 'Chambers Premier',
  rating: 5.0,
  reviewCount: 0,
  completedCeremoniesCount: 0,
  averageResponseMinutes: 0,
  indicativeFeeUGX: 0,
  availableNow: true,
  allowsRemote: true,
  authorities: [],
  bio: 'WALAYI Platform Master Administrator with global authority oversight, financial reconciliation, and statutory audit rights.'
};

export const LAWYER_KATO_USER: UserProfile = {
  id: 'lawyer-kato',
  fullName: 'Adv. Kato Paul',
  email: 'kato.paul@kaa.co.ug',
  phone: '+256 772 889 110',
  role: 'deponent',
  avatarUrl: '',
  nationalIdNumber: 'CM89021984KL3M',
  stationCity: 'Kampala',
  firmName: 'Kampala Associated Advocates',
  lawFirmName: 'Kampala Associated Advocates',
  professionalCategory: 'advocate',
  isJudicialOfficer: false,
  isProSubscriber: true,
  rating: 4.9,
  reviewCount: 42,
  completedCeremoniesCount: 65,
  averageResponseMinutes: 10,
  indicativeFeeUGX: 15000,
  availableNow: true,
  allowsRemote: true,
  physicalChambersAddress: 'Plot 41-43 Nakasero Road, Kampala',
  authorities: [
    {
      type: 'advocate',
      status: 'VERIFIED',
      basis: 'ADVOCATES_ACT',
      yearOfAdmission: 2018,
      practisingCertificateYear: 2026,
      licenceNumber: 'ADV/2026/0882',
      verifiedAt: '2026-01-01'
    }
  ],
  bio: 'Practising Advocate at Kampala Associated Advocates preparing statutory declarations and litigation affidavits for clients.'
};

export const COMMISSIONER_KAJUBI_USER: UserProfile = {
  id: 'cfo-kajubi',
  fullName: 'Adv. Kajubi Lovelock',
  email: 'kajubilovelock2026@gmail.com',
  phone: '+256 701 842 911',
  role: 'commissioner',
  avatarUrl: '',
  nationalIdNumber: 'CM84022109KP1X',
  stationCity: 'Kampala Central',
  lawFirmName: 'Lovelock Advocates & Commissioners',
  firmName: 'Lovelock Advocates & Commissioners',
  professionalCategory: 'commissioner_for_oaths',
  isJudicialOfficer: false,
  physicalChambersAddress: 'Plot 18 Lumumba Avenue, 4th Floor, Nakasero, Kampala',
  authorities: [
    {
      type: 'advocate',
      status: 'VERIFIED',
      basis: 'ADVOCATES_ACT',
      yearOfAdmission: 2014,
      practisingCertificateYear: 2026,
      licenceNumber: 'ADV/2026/0491',
      verifiedAt: '2026-01-01'
    },
    {
      type: 'commissioner_for_oaths',
      status: 'VERIFIED',
      basis: 'COMMISSIONER_ACT_CAP_5',
      courtStation: 'High Court of Uganda (Commercial & Civil Division)',
      licenceNumber: 'CFO/2026/0491',
      verifiedAt: '2026-01-01',
      expiresAt: '2028-12-31'
    }
  ],
  isProSubscriber: true,
  proPlanName: 'Pro Advocate',
  proExpiresAt: '2026-12-31',
  rating: 5.0,
  reviewCount: 16,
  completedCeremoniesCount: 28,
  averageResponseMinutes: 2,
  indicativeFeeUGX: 10000,
  availableNow: true,
  allowsRemote: true,
  bio: 'Advocate of the High Court of Uganda and gazetted Commissioner for Oaths. Authorised to administer statutory affidavits, declarations, and court instruments.'
};

export const COMMISSIONER_SARAH_USER: UserProfile = {
  id: 'cfo-sarah',
  fullName: 'Adv. Sarah Nabukeera',
  email: 'sarah.nabukeera@kaa.co.ug',
  phone: '+256 782 550 120',
  role: 'commissioner',
  avatarUrl: '',
  nationalIdNumber: 'CF87019283KL9P',
  stationCity: 'Kampala',
  lawFirmName: 'Kampala Associated Advocates',
  firmName: 'Kampala Associated Advocates',
  professionalCategory: 'commissioner_for_oaths',
  isJudicialOfficer: false,
  physicalChambersAddress: 'Plot 41 Nakasero Road, Kampala',
  authorities: [
    {
      type: 'advocate',
      status: 'VERIFIED',
      basis: 'ADVOCATES_ACT',
      yearOfAdmission: 2012,
      practisingCertificateYear: 2026,
      licenceNumber: 'ADV/2026/0118',
      verifiedAt: '2026-01-01'
    },
    {
      type: 'commissioner_for_oaths',
      status: 'VERIFIED',
      basis: 'COMMISSIONER_ACT_CAP_5',
      courtStation: 'High Court of Uganda',
      licenceNumber: 'CFO/2026/0118',
      verifiedAt: '2026-01-01',
      expiresAt: '2028-12-31'
    }
  ],
  isProSubscriber: true,
  proPlanName: 'Chambers Premier',
  rating: 4.9,
  reviewCount: 22,
  completedCeremoniesCount: 45,
  averageResponseMinutes: 4,
  indicativeFeeUGX: 12000,
  availableNow: true,
  allowsRemote: true,
  bio: 'Senior Associate and Commissioner for Oaths specializing in civil, banking and commercial statutory instruments.'
};

export const JUDICIAL_OFFICER_AKELLO_USER: UserProfile = {
  id: 'jo-akello',
  fullName: 'Her Worship Brenda Akello',
  email: 'bakello@judiciary.go.ug',
  phone: '+256 752 990 011',
  role: 'judicial_officer',
  avatarUrl: '',
  nationalIdNumber: 'CF81023948MM4J',
  stationCity: 'Mengo, Kampala',
  isJudicialOfficer: true,
  judicialTitle: 'Chief Magistrate',
  court: 'Mengo Chief Magistrate Court',
  professionalCategory: 'judicial_officer',
  authorities: [
    {
      type: 'judicial_officer',
      status: 'VERIFIED',
      basis: 'JUDICIAL_OFFICE',
      courtStation: 'Mengo Chief Magistrate Court',
      institutionalDesignation: 'Chief Magistrate',
      verifiedAt: '2026-01-01'
    }
  ],
  isProSubscriber: false,
  rating: 5.0,
  reviewCount: 8,
  completedCeremoniesCount: 14,
  averageResponseMinutes: 5,
  indicativeFeeUGX: 15000,
  availableNow: true,
  allowsRemote: true,
  bio: 'Chief Magistrate presiding at Mengo Chief Magistrate Court. Statutory judicial authority under the Magistrates Courts Act.'
};

export const COMMISSIONER_TUMUSIIME_USER: UserProfile = {
  id: 'cfo-tumusiime',
  fullName: 'Adv. Brian Tumusiime',
  email: 'brian@lovelocklaw.ug',
  phone: '+256 772 334 556',
  role: 'commissioner',
  avatarUrl: '',
  nationalIdNumber: 'CM86034928TY3E',
  stationCity: 'Kampala Central',
  lawFirmName: 'Lovelock Advocates & Commissioners',
  firmName: 'Lovelock Advocates & Commissioners',
  professionalCategory: 'commissioner_for_oaths',
  isJudicialOfficer: false,
  authorities: [
    {
      type: 'commissioner_for_oaths',
      status: 'VERIFIED',
      basis: 'COMMISSIONER_ACT_CAP_5',
      courtStation: 'High Court of Uganda',
      verifiedAt: '2026-01-01'
    }
  ],
  isProSubscriber: false,
  rating: 4.8,
  reviewCount: 10,
  completedCeremoniesCount: 19,
  averageResponseMinutes: 3,
  indicativeFeeUGX: 10000,
  availableNow: true,
  allowsRemote: true,
  bio: 'Associate Advocate and Commissioner for Oaths at Lovelock Advocates & Commissioners.'
};

export const CLIENT_FLORENCE_USER: UserProfile = {
  id: 'client-florence',
  fullName: 'Florence Kia',
  email: 'florencekia7@gmail.com',
  phone: '+256 772 491 002',
  role: 'deponent',
  avatarUrl: '',
  nationalIdNumber: 'CF92018104LK7A',
  stationCity: 'Kampala',
  firmName: null,
  isJudicialOfficer: false,
  professionalCategory: 'other',
  isProSubscriber: false,
  rating: 5.0,
  reviewCount: 0,
  completedCeremoniesCount: 0,
  averageResponseMinutes: 0,
  indicativeFeeUGX: 0,
  availableNow: true,
  allowsRemote: true,
  authorities: [],
  bio: 'Client on WALAYI Digital Oath platform commissioning statutory declarations and legal affidavits.'
};

export const SUPER_ADMIN_USER: UserProfile = {
  id: 'super-admin-nakitto',
  fullName: 'Patricia Nakitto (Super Admin)',
  email: 'superadmin@walayi.ug',
  phone: '+256 701 999 000',
  role: 'super_admin',
  avatarUrl: '',
  nationalIdNumber: 'CF87019842LK9P',
  stationCity: 'Kampala (Law Council Directorate)',
  isProSubscriber: true,
  proPlanName: 'Chambers Premier',
  rating: 5.0,
  reviewCount: 0,
  completedCeremoniesCount: 0,
  averageResponseMinutes: 0,
  indicativeFeeUGX: 0,
  availableNow: true,
  allowsRemote: true,
  authorities: [],
  bio: 'Super Administrator with rights to manage registered users, assign administrative and commissioner roles, and oversee national credential verification.'
};

export const INITIAL_USERS: UserProfile[] = [
  MASTER_ADMIN_USER,
  SUPER_ADMIN_USER,
  LAWYER_KATO_USER,
  COMMISSIONER_KAJUBI_USER,
  COMMISSIONER_SARAH_USER,
  JUDICIAL_OFFICER_AKELLO_USER,
  COMMISSIONER_TUMUSIIME_USER,
  CLIENT_FLORENCE_USER
];

export const INITIAL_CREDENTIAL_DOCS: Record<string, CredentialDocument[]> = {
  'cfo-kajubi': [
    {
      id: 'cred-kajubi-101',
      name: '2026 Practising Certificate (Uganda Law Council)',
      type: 'practising_certificate',
      fileName: 'PC_2026_Adv_Kajubi_Lovelock.pdf',
      fileSize: '1.4 MB',
      uploadedAt: '2026-01-10T09:30:00Z',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
      issuingAuthority: 'Uganda Law Council / High Court of Uganda',
      verificationReference: 'ULC-PC-2026-0491',
      status: 'VERIFIED'
    },
    {
      id: 'cred-kajubi-102',
      name: 'Commissioner for Oaths Commission (Chief Justice of Uganda)',
      type: 'chief_justice_commission',
      fileName: 'CJ_Commission_Kajubi_Lovelock.pdf',
      fileSize: '2.1 MB',
      uploadedAt: '2026-01-10T09:32:00Z',
      validFrom: '2024-03-15',
      validUntil: '2028-03-14',
      issuingAuthority: 'Office of the Chief Justice of Uganda',
      verificationReference: 'CJ-CFO-WARRANT-2026-0491',
      status: 'VERIFIED'
    }
  ]
};

// Ready-to-verify completed demonstration instrument
export const INITIAL_REQUESTS: CommissioningRequest[] = [
  {
    id: 'req-demo-001',
    certificateNumber: 'WAL-UG-2026-8849',
    securityNumber: 'WY-8849KPLA',
    documentTitle: 'Affidavit of Land Ownership & Boundaries (Mengo Block 28 Plot 442)',
    documentType: 'affidavit_general',
    deponentName: 'Florence Kia',
    deponentNin: 'CF92018104LK7A',
    deponentPhone: '+256 772 491 002',
    deponentEmail: 'florencekia7@gmail.com',
    deponentUserId: 'client-florence',
    uploaderId: 'client-florence',
    deponentId: 'client-florence',
    commissionerId: 'cfo-kajubi',
    assignedProfessionalId: 'cfo-kajubi',
    assignedProfessionalName: 'Adv. Kajubi Lovelock',
    assignedProfessionalAuthority: 'commissioner_for_oaths',
    assignedProfessionalStation: 'Kampala Central',
    commissionerNin: 'CM84022109KP1X',
    uploaderFirm: null,
    commissionerFirm: 'Lovelock Advocates & Commissioners',
    isJudicialConflict: false,
    deponentSelectionType: 'self',
    deponentExecutionMethod: 'SIGNATURE',
    deponentSignedAt: '2026-09-02T10:15:00Z',
    commissionerSignedAt: '2026-09-02T10:18:00Z',
    commissionerSealSerial: 'UG-CFO-2026-KAJUBI',
    status: 'COMPLETED',
    validityStatus: 'VALID',
    createdAt: '2026-09-02T09:45:00Z',
    completedAt: '2026-09-02T10:20:00Z',
    fileName: 'Affidavit_of_Land_Ownership_Mengo_Block28.pdf',
    fileSizeKb: 342,
    documentSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    finalDocumentSha256: 'b5a2c9b1f7d8e4c3a2b1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9',
    isDocumentLocked: true,
    solemnisationType: 'holy_bible',
    statutoryWordingUsed: 'I swear by Almighty God that the contents of this affidavit are true to the best of my knowledge, information, and belief. So help me God.',
    ceremonyLanguage: 'English',
    serviceFeeUGX: 10000,
    platformFeeUGX: 3800,
    totalAmountUGX: 13800,
    paymentMethod: 'MTN_MOMO',
    paymentReference: 'MTN-UG-948102948',
    paymentStatus: 'RELEASED',
    dailySessionId: 'daily-sess-ug-49218',
    annexures: [
      {
        id: 'annex-1',
        identifier: 'A',
        description: 'Certified Duplicate Certificate of Title (Kyadondo Block 28 Plot 442)',
        fileName: 'Title_Deed_Exhibit_A.pdf',
        fileSize: '1.2 MB',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploadedAt: '2026-09-02T09:46:00Z',
        status: 'CONFIRMED'
      },
      {
        id: 'annex-2',
        identifier: 'B',
        description: 'LC1 Village Executive Recommendation Letter',
        fileName: 'LC1_Verification_Exhibit_B.pdf',
        fileSize: '410 KB',
        sha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        uploadedAt: '2026-09-02T09:47:00Z',
        status: 'CONFIRMED'
      }
    ],
    auditChainHash: '5fe4dfe281b7fef203502f4b3c71ebea821516d0dc126abd800ee0fd1f2cd7ea',
    auditTrail: [
      {
        id: 'aud-001',
        timestamp: '2026-09-02T09:45:00Z',
        eventType: 'DOCUMENT_UPLOADED',
        actorName: 'Florence Kia',
        actorRole: 'deponent',
        ipAddress: '197.239.4.88 (Kampala)',
        deviceFingerprint: 'CLIENT-DEVICE-NODE',
        details: 'Affidavit PDF uploaded. SHA-256 integrity locked.',
        prevEventHash: '0000000000000000000000000000000000000000000000000000000000000000',
        eventHash: 'b9bd2f85a0b3927a5f61ff9585e7bd84ca292fceea9580fd39d44002a7ead7b9'
      },
      {
        id: 'aud-002',
        timestamp: '2026-09-02T09:48:00Z',
        eventType: 'PAYMENT_ESCROWED',
        actorName: 'MTN Mobile Money Uganda Switch',
        actorRole: 'Payment Gateway',
        ipAddress: '10.0.1.20',
        deviceFingerprint: 'MOMO-GW-UG',
        details: 'Statutory fee UGX 13,800 escrowed via reference MTN-UG-948102948.',
        prevEventHash: 'b9bd2f85a0b3927a5f61ff9585e7bd84ca292fceea9580fd39d44002a7ead7b9',
        eventHash: '2692371bcb6267ee5d778aabe6ef57f815921993b253a0b137831e6c45002e03'
      },
      {
        id: 'aud-003',
        timestamp: '2026-09-02T10:10:00Z',
        eventType: 'VIDEO_SESSION_INITIATED',
        actorName: 'Adv. Kajubi Lovelock',
        actorRole: 'commissioner',
        ipAddress: '41.210.142.10 (Kampala Nakasero)',
        deviceFingerprint: 'CFO-TERMINAL-01',
        details: 'Statutory video ceremony commenced. Both parties connected.',
        prevEventHash: '2692371bcb6267ee5d778aabe6ef57f815921993b253a0b137831e6c45002e03',
        eventHash: '661b44f03b959a72a05947c78011e8586b7ddedd388079e385fe3590bbf99eb0'
      },
      {
        id: 'aud-004',
        timestamp: '2026-09-02T10:14:00Z',
        eventType: 'OATH_ADMINISTERED',
        actorName: 'Florence Kia',
        actorRole: 'deponent',
        ipAddress: '197.239.4.88 (Kampala)',
        deviceFingerprint: 'CLIENT-DEVICE-NODE',
        details: 'Solemn oath taken on Holy Bible in English.',
        prevEventHash: '661b44f03b959a72a05947c78011e8586b7ddedd388079e385fe3590bbf99eb0',
        eventHash: '72cd0aec6d11841a6154da57c05092b0a75caf2a423e3848b410a8baf7f4c125'
      },
      {
        id: 'aud-005',
        timestamp: '2026-09-02T10:18:00Z',
        eventType: 'DOCUMENT_COMMISSIONED',
        actorName: 'Adv. Kajubi Lovelock',
        actorRole: 'commissioner',
        ipAddress: '41.210.142.10 (Kampala Nakasero)',
        deviceFingerprint: 'CFO-TERMINAL-01',
        details: 'Electronic jurat and official High Court seal applied. Evidentiary audit certificate generated.',
        prevEventHash: '72cd0aec6d11841a6154da57c05092b0a75caf2a423e3848b410a8baf7f4c125',
        eventHash: '5fe4dfe281b7fef203502f4b3c71ebea821516d0dc126abd800ee0fd1f2cd7ea'
      }
    ]
  }
];

export const INITIAL_LEGAL_POLICY_RULES: LegalPolicyRule[] = [
  {
    id: 'rule-cfo',
    authorityType: 'commissioner_for_oaths',
    authorityTitle: 'Commissioner for Oaths',
    statutoryBasis: 'Commissioners for Oaths (Advocates) Act, Cap. 5, Laws of Uganda',
    requiresYearlyPractisingCert: true,
    requiresChiefJusticeWarrant: true,
    isRemoteCommissioningEnabled: true,
    defaultStatutoryOathEn: "I swear by Almighty God that the contents of this affidavit are true to the best of my knowledge, information, and belief, so help me God.",
    defaultStatutoryAffirmationEn: "I do solemnly and sincerely affirm and declare that the contents of this declaration are true to the best of my knowledge, information, and belief.",
    defaultLugandaOath: "Nze, ndayira mu linnya lya Katonda Omuyinza w'ebintu byonna nti ebiwandiikiddwa mu kiwandiiko kino bya mazima, era bwe kityo Katonda annyambe.",
    permittedDocumentTypes: [
      'affidavit_general',
      'affidavit_of_service',
      'statutory_declaration',
      'deed_poll',
      'court_pleading_verification'
    ]
  },
  {
    id: 'rule-notary',
    authorityType: 'notary_public',
    authorityTitle: 'Notary Public',
    statutoryBasis: 'Notaries Public Act, Cap. 18, Laws of Uganda',
    requiresYearlyPractisingCert: true,
    requiresChiefJusticeWarrant: true,
    isRemoteCommissioningEnabled: true,
    defaultStatutoryOathEn: "I do solemnly declare and attest that the document produced hereto is true, genuine, and properly executed in my presence.",
    defaultStatutoryAffirmationEn: "I do solemnly and sincerely affirm that the execution of this instrument is true and correct.",
    defaultLugandaOath: "Nze, nzikiriza era nkakasa mu bwesimbu nti ebiwandiikiddwa mu kiwandiiko kino bya mazima.",
    permittedDocumentTypes: [
      'notarial_attestation',
      'power_of_attorney',
      'statutory_declaration',
      'affidavit_general'
    ]
  }
];

export const INITIAL_REVIEWS: ReviewItem[] = [];

export const INITIAL_ADMIN_AUDIT_LOGS: AdminAuditEvent[] = [
  {
    id: 'audit-log-001',
    adminEmail: 'admin@wallahi.ug',
    adminName: 'Ambrose (Master Admin)',
    action: 'CREDENTIAL_APPROVED',
    targetType: 'CREDENTIAL',
    targetId: 'cfo-kajubi',
    targetName: 'Adv. Kajubi Lovelock (Chief Justice Warrant CFO/2026/0491)',
    timestamp: '2026-08-30T09:15:00Z',
    previousStatus: 'UNDER_REVIEW',
    newStatus: 'VERIFIED',
    reason: 'Verified against Uganda Law Council Roll & Chief Justice Gazette Warrant CJ-CFO-WARRANT-2026-0491'
  },
  {
    id: 'audit-log-002',
    adminEmail: 'admin@wallahi.ug',
    adminName: 'Ambrose (Master Admin)',
    action: 'PLATFORM_FEE_UPDATED',
    targetType: 'FEE',
    targetId: 'config-fee',
    targetName: 'WALAYI Platform Commission Fee',
    timestamp: '2026-08-29T14:30:00Z',
    previousStatus: '6%',
    newStatus: '5%',
    reason: 'Standardized national electronic commissioning fee rate'
  }
];

export const INITIAL_DISPUTES: DisputeItem[] = [];

export const INITIAL_PLATFORM_TRANSACTIONS: PaymentTransaction[] = [];


