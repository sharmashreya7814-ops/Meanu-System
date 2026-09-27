import crypto from 'crypto';

const SECRET_KEY = process.env.AUTH_SECRET || 'qr-order-staff-jwt-secret-2026';

/**
 * Generates a cryptographic salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hashes a password using PBKDF2 with SHA-512 and salt
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

/**
 * Verifies a password against the stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = hashPassword(password, salt);
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    if (hashBuffer.length !== computedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * Signs an auth token for a staff session
 */
export function generateAuthToken(staffId: string, restaurantId: string): string {
  const payload = JSON.stringify({
    uid: staffId,
    rid: restaurantId,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  return `stf_${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes an auth token
 */
export function verifyAuthToken(token: string): { staffId: string; restaurantId: string } | null {
  try {
    if (!token || !token.startsWith('stf_')) {
      return null;
    }

    const raw = token.slice(4);
    const parts = raw.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [base64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64Payload)
      .digest('base64url');

    if (signature !== expectedSig) {
      return null;
    }

    const payloadJson = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const data = JSON.parse(payloadJson);

    if (data.exp && Date.now() > data.exp) {
      return null; // Expired
    }

    return {
      staffId: data.uid,
      restaurantId: data.rid,
    };
  } catch {
    return null;
  }
}
