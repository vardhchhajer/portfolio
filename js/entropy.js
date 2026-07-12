// entropy.js — Shannon entropy calculation (ES module)

/**
 * Calculate Shannon entropy of a byte sequence.
 * Returns bits per byte (0 = uniform, 8 = maximum entropy / perfectly random).
 *
 * Formula: H = -Σ p(x) · log₂(p(x))
 *
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {number} Entropy in bits per byte (0–8)
 */
export function shannonEntropy(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const len = bytes.length;

  if (len === 0) return 0;

  // Count byte frequencies (256 possible values)
  const freq = new Float64Array(256);
  for (let i = 0; i < len; i++) {
    freq[bytes[i]]++;
  }

  // Calculate entropy
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Returns a human-readable label for an entropy value.
 * @param {number} entropy - bits per byte (0–8)
 * @returns {string}
 */
export function entropyLabel(entropy) {
  if (entropy < 1) return 'Very Low (repetitive)';
  if (entropy < 3) return 'Low (structured)';
  if (entropy < 5) return 'Medium (mixed)';
  if (entropy < 7) return 'High (compressed)';
  return 'Very High (random/encrypted)';
}
