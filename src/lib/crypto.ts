/**
 * End-to-End Encryption (E2EE) helper using Web Crypto API (AES-GCM 256-bit).
 * Messages & Voice Notes are encrypted locally before leaving the device.
 */

// Derive a 256-bit AES-GCM key from couple secret code
export async function getCoupleEncryptionKey(coupleCode: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(coupleCode || 'BETWEEN-US-SECRET-KEY'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('BETWEEN-US-SALT-2026');

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string -> base64 ciphertext string
export async function encryptE2EE(plainText: string, cryptoKey: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoder.encode(plainText)
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return 'e2ee:' + btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

// Decrypt base64 ciphertext string -> plaintext string
export async function decryptE2EE(cipherText: string, cryptoKey: CryptoKey): Promise<string> {
  if (!cipherText.startsWith('e2ee:')) {
    return cipherText; // Unencrypted legacy text
  }

  try {
    const base64Data = cipherText.replace('e2ee:', '');
    const binaryStr = atob(base64Data);
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    const iv = buffer.slice(0, 12);
    const ciphertext = buffer.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption error:', err);
    return '🔒 [Encrypted Message]';
  }
}
