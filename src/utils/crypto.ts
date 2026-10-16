/**
 * Client-Side Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Zero server communication. All cryptographic operations occur strictly inside the browser.
 */

const PBKDF2_ITERATIONS = 100000;
const SENTINEL_TEXT = 'DAILY_DIARY_PIN_VERIFIED_V1';

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit encryption key from a user PIN using PBKDF2 and a random salt.
 */
export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary plaintext string using AES-GCM with a unique 12-byte IV.
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts AES-GCM ciphertext using the derived CryptoKey and stored IV.
 */
export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Sets up a new PIN security configuration:
 * Generates a random 16-byte salt, derives the key, and creates an encrypted verification token.
 */
export async function setupPinSecurity(pin: string): Promise<{
  salt: string;
  iv: string;
  verificationCipher: string;
  key: CryptoKey;
}> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPin(pin, salt);
  const { ciphertext, iv } = await encryptData(SENTINEL_TEXT, key);

  return {
    salt: bufferToBase64(salt),
    iv,
    verificationCipher: ciphertext,
    key,
  };
}

/**
 * Verifies a user PIN against stored verification parameters.
 * If correct, returns the derived CryptoKey; otherwise returns null.
 */
export async function verifyUserPin(
  pin: string,
  saltBase64: string,
  ivBase64: string,
  verificationCipher: string
): Promise<CryptoKey | null> {
  try {
    const salt = base64ToBuffer(saltBase64);
    const key = await deriveKeyFromPin(pin, salt);
    const decrypted = await decryptData(verificationCipher, ivBase64, key);

    if (decrypted === SENTINEL_TEXT) {
      return key;
    }
    return null;
  } catch (err) {
    // AES-GCM authentication tag mismatch or corrupted data
    return null;
  }
}
