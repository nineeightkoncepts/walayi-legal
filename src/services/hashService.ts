/**
 * Cryptographic SHA-256 Hashing & Document Integrity Verification Engine
 * Conforms to evidentiary verification standards for electronic instruments.
 */

export async function computeSha256(content: string | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof content === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(content).buffer as ArrayBuffer;
  } else {
    buffer = content;
  }

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure standard fallback implementation for edge environments
  return sha256Bytes(new Uint8Array(buffer));
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `WAL-UG-${year}-${randomPart}`;
}

/**
 * Generates a unique WALAYI Security Number.
 * Format: WY-XXXXXXXX (e.g., WY-8849KPLA)
 */
export function generateWalayiSecurityNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WY-${code}`;
}

export function generateSealSerialNumber(authorityType: string, id: string): string {
  const prefix = authorityType === 'commissioner_for_oaths' ? 'CFO' : 
                 authorityType === 'notary_public' ? 'NP' : 
                 authorityType === 'judicial_officer' ? 'JUD' : 'JP';
  const shortId = id.substring(0, 6).toUpperCase();
  const year = new Date().getFullYear();
  return `UG-${prefix}-${year}-${shortId}`;
}

// Pure standard SHA-256 implementation in JavaScript for synchronous hash chaining and fallback
function rightRotate(n: number, count: number): number {
  return (n >>> count) | (n << (32 - count));
}

export function sha256Bytes(bytes: Uint8Array | number[]): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = bytes.length * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const padded = Array.from(bytes);
  padded.push(0x80);
  while ((padded.length % 64) !== 56) padded.push(0x00);
  for (i = 0; i < padded.length; i++) {
    words[i >> 2] |= padded[i] << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength & 0xffffffff;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s2 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s3 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const temp1 = hash[7] + s3 + ch + k[i] + w[i];
      const temp2 = s2 + maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

export function sha256Sync(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return sha256Bytes(bytes);
}

export function computeAuditEventHashSync(
  prevHash: string,
  event: {
    id: string;
    timestamp: string;
    eventType: string;
    actorName: string;
    actorRole: string;
    details: string;
  }
): string {
  const canonicalString = `${prevHash}|${event.id}|${event.timestamp}|${event.eventType}|${event.actorName}|${event.actorRole}|${event.details}`;
  return sha256Sync(canonicalString);
}

/**
 * Computes a deterministic SHA-256 event hash for an audit log entry,
 * linking it to the previous event hash to create an append-only tamper-evident hash chain.
 */
export async function computeAuditEventHash(
  prevHash: string,
  event: {
    id: string;
    timestamp: string;
    eventType: string;
    actorName: string;
    actorRole: string;
    details: string;
  }
): Promise<string> {
  const canonicalString = `${prevHash}|${event.id}|${event.timestamp}|${event.eventType}|${event.actorName}|${event.actorRole}|${event.details}`;
  return computeSha256(canonicalString);
}

/**
 * Verifies an audit trail's cryptographic integrity by re-computing the hash chain.
 * Returns true if the chain is intact and uncorrupted, or false if any event was altered.
 */
export async function verifyAuditChainIntegrity(events: Array<{
  id: string;
  timestamp: string;
  eventType: string;
  actorName: string;
  actorRole: string;
  details: string;
  eventHash?: string;
  prevEventHash?: string;
}>): Promise<{ isValid: boolean; brokenAtEventId?: string; reason?: string }> {
  if (!events || events.length === 0) {
    return { isValid: true };
  }

  // Genesis previous hash for the first event
  const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    // If the event was created before chaining was deployed, we accept it if no eventHash exists
    if (!ev.eventHash) {
      continue;
    }

    if (ev.prevEventHash && ev.prevEventHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenAtEventId: ev.id,
        reason: `Broken chain link at event ${i + 1} (${ev.eventType}): expected previous hash ${expectedPrevHash.slice(0, 10)}... but found ${ev.prevEventHash.slice(0, 10)}...`
      };
    }

    const calculatedHash = await computeAuditEventHash(ev.prevEventHash || expectedPrevHash, ev);
    if (calculatedHash !== ev.eventHash) {
      return {
        isValid: false,
        brokenAtEventId: ev.id,
        reason: `Cryptographic hash mismatch at event ${i + 1} (${ev.eventType}): event data was altered after signing.`
      };
    }

    expectedPrevHash = ev.eventHash;
  }

  return { isValid: true };
}
