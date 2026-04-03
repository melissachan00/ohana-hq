/**
 * SHA-256 hashing utility for answer validation.
 */
const Hash = (() => {
  async function sha256(str) {
    const data = new TextEncoder().encode(str);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Synchronous check using pre-computed hash cache
  const cache = new Map();

  async function precompute(str) {
    const hash = await sha256(str);
    cache.set(str, hash);
    return hash;
  }

  function check(input, expectedHash) {
    const cached = cache.get(input);
    if (cached) return cached === expectedHash;
    // Compute async and cache for next time
    precompute(input);
    return false;
  }

  async function checkAsync(input, expectedHash) {
    const hash = await sha256(input);
    cache.set(input, hash);
    return hash === expectedHash;
  }

  return { check, checkAsync, sha256 };
})();
