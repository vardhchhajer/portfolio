// crypto.js — AES-GCM 256-bit encryption via Web Crypto API (ES module)

/**
 * Generate a new AES-GCM 256-bit key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a chunk of data with AES-GCM.
 * @param {ArrayBuffer|Uint8Array} chunk
 * @param {CryptoKey} key
 * @returns {Promise<{iv: Uint8Array, ciphertext: ArrayBuffer}>}
 */
export async function encryptChunk(chunk, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    chunk
  );
  return { iv, ciphertext };
}

/**
 * Decrypt a chunk of data with AES-GCM.
 * @param {ArrayBuffer|Uint8Array} ciphertext
 * @param {CryptoKey} key
 * @param {Uint8Array} iv
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptChunk(ciphertext, key, iv) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
}

/**
 * Encode encryption artifacts into a shareable base64 token.
 * Format: [4-byte key length][raw key][12-byte IV][ciphertext]
 * @param {CryptoKey} key
 * @param {Uint8Array} iv
 * @param {ArrayBuffer} ciphertext
 * @returns {Promise<string>}
 */
export async function encodeShareToken(key, iv, ciphertext) {
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const ctBytes = new Uint8Array(ciphertext);

  // Pack: [1 byte key len][raw key][12 byte iv][ciphertext]
  const keyLen = rawKey.byteLength;
  const total = 1 + keyLen + iv.byteLength + ctBytes.byteLength;
  const packed = new Uint8Array(total);
  let offset = 0;

  packed[offset] = keyLen;
  offset += 1;

  packed.set(rawKey, offset);
  offset += keyLen;

  packed.set(iv, offset);
  offset += iv.byteLength;

  packed.set(ctBytes, offset);

  return uint8ToBase64(packed);
}

/**
 * Decode a share token back into key, iv, and ciphertext.
 * @param {string} token
 * @returns {Promise<{key: CryptoKey, iv: Uint8Array, ciphertext: ArrayBuffer}>}
 */
export async function decodeShareToken(token) {
  const packed = base64ToUint8(token);
  let offset = 0;

  const keyLen = packed[offset];
  offset += 1;

  const rawKey = packed.slice(offset, offset + keyLen);
  offset += keyLen;

  const iv = packed.slice(offset, offset + 12);
  offset += 12;

  const ciphertext = packed.slice(offset).buffer;

  const key = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return { key, iv, ciphertext };
}

/**
 * Convert bytes to a hex string representation.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {number} [maxLen=256]
 * @returns {string}
 */
export function bytesToHex(bytes, maxLen = 256) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const len = Math.min(arr.length, maxLen);
  const lines = [];
  for (let i = 0; i < len; i += 16) {
    const slice = arr.slice(i, Math.min(i + 16, len));
    const hexPart = Array.from(slice)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    const asciiPart = Array.from(slice)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');
    const addr = i.toString(16).padStart(8, '0');
    lines.push(`${addr}  ${hexPart.padEnd(48, ' ')}  |${asciiPart}|`);
  }
  if (arr.length > maxLen) {
    lines.push(`... (${arr.length - maxLen} more bytes)`);
  }
  return lines.join('\n');
}

/* ── Helpers ─────────────────────────────────────────── */

function uint8ToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
