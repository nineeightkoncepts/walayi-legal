import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UploadedDocument {
  url: string;
  mimeType: string;
}

/**
 * Uploads the deponent's actual source document (PDF/DOCX bytes) to Firebase
 * Storage, keyed by the commissioning request it belongs to. This is what
 * makes it possible to later re-open the REAL file and overlay signatures
 * onto its own pages, rather than only ever generating a synthetic
 * certificate that never carried the original content.
 */
export async function uploadCommissioningDocument(requestId: string, file: File): Promise<UploadedDocument> {
  const safeName = file.name.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  const storagePath = `commissioningDocuments/${requestId}/original-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const mimeType = file.type || 'application/octet-stream';

  await uploadBytes(storageRef, file, { contentType: mimeType });
  const url = await getDownloadURL(storageRef);

  return { url, mimeType };
}

/**
 * Uploads a document a user has started but not yet submitted to a
 * Commissioner, keyed by a draft id rather than a commissioning request id
 * (a draft has no request yet). This is what lets "save as draft and
 * return later" actually preserve the original file, not just its name.
 */
export async function uploadDraftDocument(uploaderId: string, draftId: string, file: File): Promise<UploadedDocument> {
  const safeName = file.name.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  const storagePath = `draftDocuments/${uploaderId}/${draftId}/original-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const mimeType = file.type || 'application/octet-stream';

  await uploadBytes(storageRef, file, { contentType: mimeType });
  const url = await getDownloadURL(storageRef);

  return { url, mimeType };
}
