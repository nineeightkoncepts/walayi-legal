import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { PayoutDestination } from '../types';

/**
 * Fetch a commissioner's current payout destination. Kept in its own
 * collection (not on their UserProfile) so it can never be read by anyone
 * but its owner or an admin — see firestore.rules.
 */
export async function getPayoutDestination(commissionerId: string): Promise<PayoutDestination | null> {
  try {
    const ref = doc(db, 'payoutDestinations', commissionerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      commissionerId: data.commissionerId || commissionerId,
      provider: data.provider || 'MTN_MOMO',
      msisdn: data.msisdn || '',
      accountHolderName: data.accountHolderName || '',
      verificationStatus: data.verificationStatus || 'UNVERIFIED',
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
      updatedBy: data.updatedBy || '',
      versionId: data.versionId || '',
    };
  } catch (err) {
    console.warn('Failed to fetch payout destination:', err);
    return null;
  }
}

/**
 * Save (create or replace) a commissioner's payout destination. Every save
 * gets a new versionId so a transaction that has already locked in a prior
 * version is unaffected by a later change — see lockPayoutDestinationSnapshot.
 */
export async function savePayoutDestination(
  commissionerId: string,
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY',
  msisdn: string,
  accountHolderName: string
): Promise<PayoutDestination> {
  const versionId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const destination: PayoutDestination = {
    commissionerId,
    provider,
    msisdn,
    accountHolderName,
    verificationStatus: 'UNVERIFIED',
    updatedAt: new Date().toISOString(),
    updatedBy: commissionerId,
    versionId,
  };

  const ref = doc(db, 'payoutDestinations', commissionerId);
  await setDoc(ref, { ...destination, updatedAt: serverTimestamp() });

  return destination;
}

/**
 * Locks the payout destination applicable to a transaction at the moment
 * that transaction is initiated, so a later change to the commissioner's
 * live settings can never retroactively redirect an already-initiated payout.
 */
export async function lockPayoutDestinationSnapshot(commissionerId: string): Promise<{
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY';
  msisdn: string;
  accountHolderName: string;
  versionId: string;
} | null> {
  const destination = await getPayoutDestination(commissionerId);
  if (!destination) return null;
  return {
    provider: destination.provider,
    msisdn: destination.msisdn,
    accountHolderName: destination.accountHolderName,
    versionId: destination.versionId,
  };
}
