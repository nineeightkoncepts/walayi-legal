import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  CommissionerFeeSettings,
  CommissioningFeeSnapshot,
  CommissionerFeeModel,
} from '../types';

/**
 * Fetch the current fee settings for a commissioner.
 * Commissioners have at most one active fee settings doc.
 */
export async function getCommissionerFeeSettings(
  commissionerId: string
): Promise<CommissionerFeeSettings | null> {
  try {
    const settingsRef = doc(db, 'commissionerFeeSettings', commissionerId);
    const snap = await getDoc(settingsRef);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    return {
      commissionerId: data.commissionerId || commissionerId,
      model: data.model || 'flat_rate',
      flatRateUGX: data.flatRateUGX,
      affidavitFeeUGX: data.affidavitFeeUGX,
      annexureFeesUGX: data.annexureFeesUGX,
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
      updatedBy: data.updatedBy || '',
      versionId: data.versionId || '',
    };
  } catch (err) {
    console.warn('Failed to fetch commissioner fee settings:', err);
    return null;
  }
}

/**
 * Save or update fee settings for a commissioner.
 * Each update creates a new version ID for locking fees in transactions.
 */
export async function saveCommissionerFeeSettings(
  commissionerId: string,
  model: CommissionerFeeModel,
  flatRateUGX?: number,
  affidavitFeeUGX?: number,
  annexureFeesUGX?: number
): Promise<CommissionerFeeSettings | null> {
  try {
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const settings: CommissionerFeeSettings = {
      commissionerId,
      model,
      flatRateUGX,
      affidavitFeeUGX,
      annexureFeesUGX,
      updatedAt: new Date().toISOString(),
      updatedBy: commissionerId,
      versionId,
    };

    const settingsRef = doc(db, 'commissionerFeeSettings', commissionerId);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    });

    return settings;
  } catch (err) {
    console.error('Failed to save commissioner fee settings:', err);
    return null;
  }
}

/**
 * Calculate and lock fees at the point of commissioning initiation.
 * This snapshot is stored with the commissioning request and never changes,
 * even if the commissioner later adjusts their rates.
 */
export async function createFeeSnapshot(
  commissionerId: string,
  annexuresCount: number = 0,
  platformFeeUGX: number = 500 // Default platform fee (example)
): Promise<CommissioningFeeSnapshot | null> {
  try {
    const settings = await getCommissionerFeeSettings(commissionerId);

    if (!settings) {
      // Fallback: no settings configured yet
      return {
        commissionerFeeUGX: 50000, // Default fallback (50k UGX)
        platformFeeUGX,
        commissionerFeeModelUsed: 'flat_rate',
        feeSettingsVersionId: 'default',
        calculatedAt: new Date().toISOString(),
      };
    }

    let commissionerFeeUGX = 0;

    if (settings.model === 'flat_rate') {
      commissionerFeeUGX = settings.flatRateUGX || 50000;
    } else if (settings.model === 'per_item') {
      // Per-item: affidavit fee + (annexure fee × count)
      const affidavitFee = settings.affidavitFeeUGX || 30000;
      const annexureFee = settings.annexureFeesUGX || 5000;
      commissionerFeeUGX = affidavitFee + annexureFee * annexuresCount;
    }

    return {
      commissionerFeeUGX,
      platformFeeUGX,
      commissionerFeeModelUsed: settings.model,
      feeSettingsVersionId: settings.versionId,
      calculatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to create fee snapshot:', err);
    return null;
  }
}

/**
 * Validate fee input (ensures reasonable ranges, no negative values, etc.)
 */
export function validateFees(model: CommissionerFeeModel, flatRate?: number, affidavit?: number, annexure?: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (model === 'flat_rate') {
    if (!flatRate || flatRate < 0) {
      errors.push('Flat rate must be a positive number.');
    }
  } else if (model === 'per_item') {
    if (!affidavit || affidavit < 0) {
      errors.push('Affidavit fee must be a positive number.');
    }
    if (!annexure || annexure < 0) {
      errors.push('Annexure fee must be a positive number.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
