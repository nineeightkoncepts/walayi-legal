export type UserRole = 
  | 'user'
  | 'deponent' 
  | 'advocate' 
  | 'commissioner' 
  | 'notary' 
  | 'judicial_officer' 
  | 'justice_of_peace' 
  | 'law_firm_admin' 
  | 'super_admin'
  | 'admin'
  | 'master_admin';

export type OperatingView = 'ADMIN' | 'USER' | 'COMMISSIONER';

export type MasterAdminSection = 
  | 'OVERVIEW'
  | 'FINANCIAL'
  | 'WALLET'
  | 'DOCUMENTS'
  | 'PROFESSIONALS'
  | 'VERIFICATION_QUEUE'
  | 'ADMISSIONS'
  | 'ADVERTISING'
  | 'TRANSACTIONS'
  | 'PAYOUTS'
  | 'REFUNDS'
  | 'DISPUTES'
  | 'SUBSCRIPTIONS'
  | 'CEREMONIES'
  | 'USERS'
  | 'AUDIT_LOG'
  | 'AUDIT_LOGS'
  | 'LEGAL_RULES'
  | 'RULES_FEES'
  | 'SYSTEM_SETTINGS';

export * from './advertising';

export interface AdminAuditEvent {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType: 'USER' | 'CREDENTIAL' | 'TRANSACTION' | 'DOCUMENT' | 'POLICY' | 'FEE' | 'SYSTEM';
  targetId: string;
  targetName: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface DisputeItem {
  id: string;
  transactionId: string;
  commissioningId: string;
  deponentName: string;
  professionalName: string;
  amountUGX: number;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_REFUNDED' | 'RESOLVED_RELEASED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export type AuthorityType = 
  | 'commissioner_for_oaths' 
  | 'notary_public' 
  | 'judicial_officer' 
  | 'justice_of_the_peace'
  | 'advocate';

export type AuthorityStatus = 
  | 'REGISTERED' 
  | 'DOCUMENTS_SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'EXPIRING_SOON' 
  | 'RENEWAL_REQUIRED' 
  | 'MARKETPLACE_SUSPENDED' 
  | 'REJECTED';

export type LegalBasis = 
  | 'COMMISSIONER_ACT_CAP_5' 
  | 'NOTARIES_PUBLIC_ACT' 
  | 'JUDICIAL_OFFICE' 
  | 'JUSTICES_OF_PEACE_ACT' 
  | 'ADVOCATES_ACT';

export interface CredentialDocument {
  id: string;
  name: string;
  title?: string;
  type: 'practising_certificate' | 'chief_justice_commission' | 'notarial_appointment' | 'judicial_warrant' | 'jp_gazette_notice' | 'national_id' | string;
  authorityType?: AuthorityType;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  validFrom: string;
  validUntil: string;
  issuingAuthority: string;
  verificationReference: string;
  licenseNumber?: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
  rejectionReason?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  nationalIdNumber?: string; // NIN (Uganda NIRA format: CM... / CF...)
  stationCity: string;
  lawFirmName?: string;
  firmName?: string | null;
  isJudicialOfficer?: boolean;
  judicialTitle?: string | null;
  court?: string | null;
  professionalCategory?: 'judicial_officer' | 'commissioner_for_oaths' | 'justice_of_the_peace' | 'advocate' | 'notary_public' | 'other';
  phoneNumber?: string;
  address?: string;
  enrollmentNumber?: string;
  authorities: {
    type: AuthorityType;
    status: AuthorityStatus;
    basis: LegalBasis;
    yearOfAdmission?: number;
    practisingCertificateYear?: number;
    verifiedAt?: string;
    expiresAt?: string;
    licenceNumber?: string;
    courtStation?: string; // e.g., "High Court of Uganda at Kampala (Commercial Division)"
    institutionalDesignation?: string; // e.g. "Chief Magistrate", "Senior Superintendent of Prisons / JP"
  }[];
  isProSubscriber: boolean;
  proPlanName?: 'Standard' | 'Pro Advocate' | 'Chambers Premier';
  proExpiresAt?: string;
  rating: number;
  reviewCount: number;
  completedCeremoniesCount: number;
  averageResponseMinutes: number;
  indicativeFeeUGX: number;
  availableNow: boolean;
  allowsRemote: boolean;
  // Live presence heartbeat — ISO timestamp of this user's last active
  // moment in the app. A user is considered online while it's recent
  // (see isUserOnline in roleService); it is not the same as availableNow,
  // which is a manually-set "willing to take new work" preference.
  lastActiveAt?: string;
  // Commissioner-category admission gate. A commissioner-like account is
  // PENDING from sign-up until the Master Admin expressly admits them —
  // only ADMITTED accounts are searchable/selectable/able to receive
  // commissioning requests (enforced server-side, not just hidden in the
  // UI). Unset (null/undefined) for non-commissioner roles, and — by
  // design — for any commissioner account that existed before this gate,
  // so pre-existing accounts fail closed into a safe pending state rather
  // than being assumed admitted.
  admissionStatus?: 'PENDING' | 'ADMITTED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED' | null;
  admissionDecisionAt?: string;
  admissionDecisionBy?: string;
  admissionDecisionReason?: string;
  bio?: string;
  physicalChambersAddress?: string;
  signatureDataUrl?: string;
  signatureUploadedAt?: string;
  signatureType?: 'DRAWN' | 'UPLOADED';
  sealDesignType?: 'STANDARD' | 'CUSTOM';
  sealCustomBorder?: 'CLASSIC_DOUBLE' | 'ORNATE_GOLD' | 'OFFICIAL_SECURITY' | 'MODERN_GEOMETRIC';
  sealCustomTypography?: 'SERIF_LEGAL' | 'SANS_MODERN' | 'MONO_OFFICIAL';
  sealCustomEmbellishment?: 'COURT_SCALES' | 'NATIONAL_CREST' | 'UGANDA_CRANE' | 'LAW_SOCIETY';
  sealCustomColor?: string;
  judicialDesignation?: string;
  jpJurisdictionStation?: string;
  isPrisonOfficerJP?: boolean;
}

// A signer-chosen spot on the real uploaded document — captured by clicking
// the rendered PDF in PdfSignaturePlacer — for where a signature or the
// commissioner's digital stamp should be overlaid.
export interface DocumentMarkPlacement {
  /** 0-indexed page number within the original document. */
  page: number;
  /** Fraction (0-1) of the page width, from the left edge. */
  xRatio: number;
  /** Fraction (0-1) of the page height, from the TOP edge (screen convention). */
  yRatio: number;
}

export interface AnnexureItem {
  id: string;
  identifier: string; // e.g. "A", "B", "C", "D1", "D2"
  title?: string;
  description?: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  sha256: string;
  uploadedAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMMISSIONED';
  exhibitWording?: string;
  exhibitCommissionedAt?: string;
  exhibitCommissionerName?: string;
  exhibitLocation?: string;
  firstPageStampedUrl?: string;
}

export type DocumentType = 
  | 'affidavit_general' 
  | 'affidavit_of_service' 
  | 'statutory_declaration' 
  | 'deed_poll' 
  | 'notarial_attestation' 
  | 'power_of_attorney' 
  | 'court_pleading_verification';

export type SolemnisationType = 'holy_bible' | 'holy_quran' | 'solemn_affirmation' | 'custom_solemnisation';

export type CommissioningStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROFESSIONAL_SELECTED'
  | 'ACCEPTED'
  | 'DOCUMENT_REVIEW'
  | 'ANNEXURES_REVIEW'
  | 'DOCUMENT_LOCKED'
  | 'CEREMONY_SCHEDULED'
  | 'CEREMONY_ACTIVE'
  | 'OATH_ADMINISTERED'
  | 'SIGNING'
  | 'COMMISSIONED'
  | 'VERIFIED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'INTERRUPTED'
  | 'DISPUTED';

export type InstrumentValidityStatus = 'VALID' | 'REVOKED' | 'SUPERSEDED' | 'INVALID';

export type ExecutionMethod = 'SIGNATURE' | 'THUMBPRINT';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: 
    | 'DOCUMENT_UPLOADED'
    | 'SHA256_HASH_GENERATED'
    | 'ANNEXURE_ADDED'
    | 'ANNEXURE_REMOVED'
    | 'ANNEXURE_REPLACED'
    | 'ANNEXURE_CONFIRMED'
    | 'EXHIBIT_IDENTIFICATION_GENERATED'
    | 'EXHIBIT_IDENTIFICATION_ACCEPTED'
    | 'PAYMENT_ESCROWED'
    | 'COMMISSIONER_ASSIGNED'
    | 'CREDENTIALS_RECHECKED'
    | 'DOCUMENT_LOCKED'
    | 'VIDEO_SESSION_INITIATED'
    | 'DEPONENT_IDENTITY_VERIFIED'
    | 'SOLEMNISATION_SELECTED'
    | 'OATH_ADMINISTERED'
    | 'EXECUTION_METHOD_SELECTED'
    | 'THUMBPRINT_CAPTURE_STARTED'
    | 'THUMBPRINT_CAPTURED'
    | 'THUMBPRINT_RECAPTURED'
    | 'THUMBPRINT_CAPTURE_FAILED'
    | 'DEPONENT_SIGNED'
    | 'DEPONENT_EXECUTED'
    | 'COMMISSIONER_SIGNED'
    | 'DIGITAL_SEAL_APPLIED'
    | 'JURAT_ATTACHED'
    | 'VERIFICATION_QR_MINTED'
    | 'FUNDS_SETTLED'
    | 'DOCUMENT_COMMISSIONED'
    | 'DOCUMENT_VERIFIED'
    | 'TAMPER_CHECK_PASSED'
    | 'INSTRUMENT_REVOKED'
    | 'INSTRUMENT_SUPERSEDED';
  actorName: string;
  actorRole: string;
  ipAddress: string;
  deviceFingerprint: string;
  details: string;
  metadata?: Record<string, string | number | boolean>;
  // Cryptographic append-only chain fields
  eventHash?: string;
  prevEventHash?: string;
}

export interface CommissioningRequest {
  id: string;
  certificateNumber: string; // e.g. "WAL-UG-2026-8849"
  securityNumber?: string; // e.g. "WY-8849KPLA" - Unique WALAYI Security Number
  validityStatus?: InstrumentValidityStatus; // Statutory validity: VALID | REVOKED | SUPERSEDED
  revocationReason?: string;
  revokedAt?: string;
  supersededBySecurityNumber?: string;
  auditChainHash?: string; // Root or cumulative hash of the chained audit log
  documentTitle: string;
  documentType: DocumentType;
  deponentName: string;
  deponentNin: string;
  deponentPhone: string;
  deponentEmail: string;
  deponentUserId: string;
  uploaderId?: string;
  deponentId?: string | null;
  commissionerId?: string;
  uploaderFirm?: string | null;
  commissionerFirm?: string | null;
  isJudicialConflict?: boolean;
  judicialConflictDetails?: {
    type: 'self_case' | 'case_before_judicial_officer' | null;
    judicialOfficerId: string | null;
    matterDescription: string | null;
  };
  deponentSelectionType?: 'self' | 'on_behalf';
  deponentExecutionMethod?: ExecutionMethod;
  deponentSignatureDataUrl?: string;
  deponentThumbprintDataUrl?: string;
  deponentSignedAt?: string;
  // Where on the real uploaded document (page + ratio-based x/y, chosen by
  // clicking the rendered PDF) the deponent's mark should be placed. Unset
  // means the overlay falls back to a default position on the last page.
  deponentMarkPlacement?: DocumentMarkPlacement;

  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  assignedProfessionalAuthority?: AuthorityType;
  assignedProfessionalStation?: string;
  commissionerNin?: string; // Commissioner National ID Number (NIN)
  commissionerSignatureDataUrl?: string;
  commissionerSignedAt?: string;
  commissionerSealSerial?: string;
  // Where the commissioner's signature + digital stamp block should be
  // placed on the real document. Same fallback behaviour as above.
  commissionerMarkPlacement?: DocumentMarkPlacement;

  status: CommissioningStatus;
  ceremonyStep?: number;
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;

  rawFileUrl?: string;
  // The real MIME type of the uploaded file at rawFileUrl. Only when this is
  // exactly 'application/pdf' can the final instrument be built by overlaying
  // signatures directly onto the original document's own pages (pdf-lib can't
  // parse .doc/.docx) — otherwise the system falls back to a freshly composed
  // certificate PDF that doesn't carry the original file's content.
  originalMimeType?: string;
  documentContent?: string;
  fileName: string;
  fileSizeKb: number;
  documentSha256: string;
  finalDocumentSha256?: string;
  isDocumentLocked: boolean;

  hasAnnexures?: boolean;
  annexures?: AnnexureItem[];
  annexuresConfirmed?: boolean;
  annexuresCommissioned?: boolean;

  solemnisationType: SolemnisationType;
  statutoryWordingUsed: string;
  ceremonyLanguage: 'English' | 'Luganda' | 'Swahili';

  juratText?: string;
  juratLocation?: string;
  confirmedCommissioningDate?: string;
  confirmedCommissioningPlace?: string;

  serviceFeeUGX: number;
  exhibitFeeUGX?: number; // per exhibit
  platformFeeUGX: number; // 5% configurable
  totalAmountUGX: number;
  paymentMethod?: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'IOTEC_MOMO' | 'IOTEC_CARD' | 'CHAMBERS_WALLET';
  paymentReference?: string;
  paymentStatus: 'UNPAID' | 'PENDING' | 'ESCROWED' | 'RELEASED' | 'REFUNDED';

  dailyRoomUrl?: string;
  dailySessionId?: string;
  videoDurationSeconds?: number;

  // --- Live two-party session signalling (synced via Firestore) ---
  // Lets the deponent and commissioner, on two separate accounts/devices,
  // ring each other and join the same commissioning room in real time.
  liveCallState?: 'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED';
  callInitiatedByRole?: 'deponent' | 'commissioner';
  callInitiatedByName?: string;
  callConnectedAt?: string;
  deponentPresent?: boolean;
  commissionerPresent?: boolean;
  assignedProfessionalPhone?: string;

  auditTrail: AuditEvent[];
  verificationQrUrl?: string;
  rejectionReason?: string;
}

export interface CardPaymentDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand?: 'VISA' | 'MASTERCARD' | 'OTHER';
}

export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  commissioningId?: string;
  userId: string;
  userName: string;
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'IOTEC_PAY' | 'WALLET';
  paymentChannel?: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'WALLET';
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  gateway?: 'IOTEC' | 'DIRECT' | 'WALLET';
  type: 'COMMISSIONING_ESCROW' | 'PRO_SUBSCRIPTION' | 'PAYOUT_WITHDRAWAL' | 'PLATFORM_FEE' | 'COMMISSIONER_PAYOUT';
  amountUGX: number;
  platformFeeUGX: number;
  netPayoutUGX: number;
  status: 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'FAILED' | 'REFUNDED';
  timestamp: string;
  externalProviderTxnId?: string;
  iotecReference?: string;
  failureReason?: string;
}

export interface LegalPolicyRule {
  id: string;
  authorityType: AuthorityType;
  authorityTitle: string;
  statutoryBasis: string;
  requiresYearlyPractisingCert: boolean;
  requiresChiefJusticeWarrant: boolean;
  isRemoteCommissioningEnabled: boolean;
  defaultStatutoryOathEn: string;
  defaultStatutoryAffirmationEn: string;
  defaultLugandaOath: string;
  permittedDocumentTypes: DocumentType[];
  verificationRequirements?: string;
  mandatoryJuratFormat?: string;
  minFeeUGX?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'CEREMONY' | 'PAYMENT' | 'CREDENTIAL' | 'VERIFICATION' | 'SYSTEM' | 'ALERT' | 'SUCCESS' | 'INFO';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  // Ties this notification back to the record it's about, per the brief's
  // "link notifications to the relevant document or transaction" — the app
  // doesn't have deep-linking yet, but the data is captured either way.
  linkedId?: string;
  linkedType?: 'commissioningRequest' | 'transaction' | 'credentialDocument' | 'admission';
}

export interface ReviewItem {
  id: string;
  professionalId: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceType: string;
  date: string;
}

/**
 * Commissioner's fee pricing model and configuration.
 * The Commissioner sets their professional fee; WALAYI keeps a separate platform fee.
 */
export type CommissionerFeeModel = 'flat_rate' | 'per_item';

export interface CommissionerFeeSettings {
  commissionerId: string;
  model: CommissionerFeeModel;

  // Flat-rate model: one fee for any commissioning
  flatRateUGX?: number;

  // Per-item model: different fees for affidavit + each annexure
  affidavitFeeUGX?: number;
  annexureFeesUGX?: number; // per annexure/exhibit

  // Metadata
  updatedAt: string; // ISO timestamp
  updatedBy: string; // Commissioner's UID
  versionId: string; // Unique version ID for fee snapshots in transactions
}

/**
 * A snapshot of the commissioner's fee at the time a commissioning was initiated.
 * Locked in the commissioning request so fee changes don't affect ongoing transactions.
 */
export interface CommissioningFeeSnapshot {
  commissionerFeeUGX: number; // Professional fee due to commissioner
  platformFeeUGX: number;     // WALAYI platform fee
  commissionerFeeModelUsed: CommissionerFeeModel;
  feeSettingsVersionId: string; // Links back to the CommissionerFeeSettings version used
  calculatedAt: string; // ISO timestamp when fees were locked
}

/**
 * Represents a commissioning request with fee locking at initiation.
 * (Partial type — extend existing CommissioningRequest with these fields)
 */
export interface CommissioningRequestFeeFields {
  feeSnapshot?: CommissioningFeeSnapshot; // Locked at initiation; never changes for this transaction
  annexuresCount?: number; // Used with per-item fees to calculate total at lock time
}
