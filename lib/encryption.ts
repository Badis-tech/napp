import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.API_KEYS_ENCRYPTION_KEY || 
  '0123456789abcdef0123456789abcdef'; // 32 chars = 256-bit key

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

if (ENCRYPTION_KEY.length !== 32) {
  console.warn('⚠️ API_KEYS_ENCRYPTION_KEY should be 32 characters for 256-bit AES');
}

/**
 * Encrypts a value (API key) using AES-256-GCM
 * Returns: iv:encryptedData:authTag (base64 encoded)
 */
export function encryptApiKey(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine: iv:encrypted:authTag for decryption
  const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]);
  return combined.toString('base64');
}

/**
 * Decrypts an encrypted API key
 */
export function decryptApiKey(encrypted: string): string {
  try {
    const combined = Buffer.from(encrypted, 'base64');
    
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(combined.length - AUTH_TAG_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Masks an API key for display (shows only last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

/**
 * Masks a full encrypted key string for display
 */
export function maskEncryptedKey(): string {
  return '*'.repeat(20) + '...';
}
