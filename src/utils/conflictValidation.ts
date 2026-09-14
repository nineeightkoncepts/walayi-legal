import { UserProfile } from '../types';

export interface ConflictCheckResult {
  hasConflict: boolean;
  ruleViolated?: 'SELF_COMMISSIONING' | 'FIRM_CONFLICT' | 'JUDICIAL_CONFLICT';
  reason?: string;
  advice?: string;
}

/**
 * Normalizes firm names for robust comparison (case-insensitive, stripping punctuation)
 */
export function normalizeFirmName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Validates whether a given commissioner has an ethical conflict of interest with the transaction
 */
export function checkCommissionerConflict(params: {
  currentUser: UserProfile;
  commissioner: UserProfile;
  deponentSelectionType: 'self' | 'on_behalf';
  uploaderFirm?: string | null;
  isJudicialMatterHandling?: boolean;
}): ConflictCheckResult {
  const { currentUser, commissioner, deponentSelectionType, uploaderFirm, isJudicialMatterHandling } = params;

  // RULE 1: Self-commissioning prohibition
  // A Commissioner cannot commission their own document where they are the deponent.
  if (deponentSelectionType === 'self' && currentUser.id === commissioner.id) {
    return {
      hasConflict: true,
      ruleViolated: 'SELF_COMMISSIONING',
      reason: 'You cannot commission your own document as the deponent.',
      advice: 'Statutory ethical rules prohibit self-commissioning. Please select an independent Commissioner for Oaths.'
    };
  }

  // RULE 2: Firm conflict prohibition
  // A Commissioner cannot commission documents in matters where they or their firm are acting as Advocates for the client.
  const effectiveUploaderFirm = normalizeFirmName(uploaderFirm || currentUser.firmName || currentUser.lawFirmName);
  const commissionerFirm = normalizeFirmName(commissioner.firmName || commissioner.lawFirmName);

  if (effectiveUploaderFirm && commissionerFirm && effectiveUploaderFirm === commissionerFirm) {
    const rawFirmName = commissioner.firmName || commissioner.lawFirmName || uploaderFirm || 'the same firm';
    return {
      hasConflict: true,
      ruleViolated: 'FIRM_CONFLICT',
      reason: `Conflict of Interest Detected: This Commissioner is from the same firm (${rawFirmName}) as the uploader.`,
      advice: 'The Advocates Act and Commissioners for Oaths Act prohibit an advocate or commissioner from administering an oath in a matter where their law firm is on record.'
    };
  }

  // RULE 3: Judicial Officer conflict prohibition
  // A Judicial Officer cannot commission documents which arise from matters which they are handling by themselves.
  if (isJudicialMatterHandling && (commissioner.isJudicialOfficer || commissioner.professionalCategory === 'judicial_officer' || commissioner.id === currentUser.id)) {
    return {
      hasConflict: true,
      ruleViolated: 'JUDICIAL_CONFLICT',
      reason: 'Judicial Conflict: A Judicial Officer cannot commission documents arising from a matter they are handling.',
      advice: 'Professional ethics require judicial impartiality. Please select an independent Commissioner for Oaths for this instrument.'
    };
  }

  return { hasConflict: false };
}
