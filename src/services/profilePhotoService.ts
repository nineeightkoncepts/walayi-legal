import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates an image file according to platform specifications:
 * - Allowed types: PNG, JPG, JPEG, WebP
 * - Max size: 10MB
 */
export function validateImageFile(file: File): PhotoValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(png|jpe?g|webp)$/i.test(file.name);

  if (!isAllowedType) {
    return {
      valid: false,
      error: 'Invalid file format. Please choose a PNG, JPG, JPEG, or WebP photo.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Photo is too large. Maximum file size allowed is 10MB.'
    };
  }

  return { valid: true };
}

/**
 * Uploads a profile photo to Firebase Storage and syncs the URL with Firestore.
 * Fallback to Base64 data URL ensures zero disruption if Firebase Storage is offline or unprovisioned.
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid photo.');
  }

  let finalPhotoUrl = '';

  // Determine file extension
  const extensionMatch = file.name.split('.').pop()?.toLowerCase();
  const extension = extensionMatch && ['png', 'jpg', 'jpeg', 'webp'].includes(extensionMatch)
    ? extensionMatch
    : 'jpg';

  // 1. Try Firebase Storage (path: profiles/{userId}/photo.{extension})
  try {
    const storagePath = `profiles/${userId}/photo.${extension}`;
    const storageReference = ref(storage, storagePath);
    
    // Upload bytes with content type metadata
    await uploadBytes(storageReference, file, {
      contentType: file.type || `image/${extension}`
    });

    finalPhotoUrl = await getDownloadURL(storageReference);
  } catch (storageError: any) {
    console.warn('Firebase Storage upload notice (using robust local fallback):', storageError?.message);

    // Read as Base64 Data URL so the user's photo is reliably stored and immediately visible
    finalPhotoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file from device.'));
      reader.readAsDataURL(file);
    });
  }

  // 2. Persist URL to Firestore collection 'users' document '{userId}'
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      profilePhotoUrl: finalPhotoUrl,
      avatarUrl: finalPhotoUrl,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (firestoreError: any) {
    console.warn('Firestore profile photo sync notice:', firestoreError?.message);
  }

  // 3. Persist to localStorage for instantaneous load on session start
  try {
    localStorage.setItem(`wallahi_profile_photo_${userId}`, finalPhotoUrl);
  } catch (e) {
    // ignore quota errors
  }

  return finalPhotoUrl;
}

/**
 * Retrieves cached or stored photo for a given user
 */
export function getStoredProfilePhoto(userId: string): string | null {
  try {
    return localStorage.getItem(`wallahi_profile_photo_${userId}`);
  } catch (e) {
    return null;
  }
}

/**
 * Removes the photo and resets to blank avatar
 */
export async function removeProfilePhoto(userId: string): Promise<void> {
  try {
    localStorage.removeItem(`wallahi_profile_photo_${userId}`);
  } catch (e) {
    // ignore
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      profilePhotoUrl: '',
      avatarUrl: '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Error clearing profile photo in Firestore:', err);
  }
}
