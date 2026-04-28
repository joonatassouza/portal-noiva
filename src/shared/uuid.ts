/**
 * Lightweight UUID v4 wrapper.
 *
 * Node 20+ and all modern browsers expose `globalThis.crypto` with both
 * `randomUUID()` and `getRandomValues()`, so we can rely on the Web Crypto
 * API exclusively without coupling the domain layer to `node:crypto`.
 */
export function randomUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  throw new Error('Web Crypto API not available — Node 20+ or a modern browser is required.');
}

/** URL-safe random token for invitations / one-time links. */
export function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis === 'undefined' || !globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto API not available — Node 20+ or a modern browser is required.');
  }
  globalThis.crypto.getRandomValues(arr);
  // Buffer is available in Node; fall back to manual base64url for browsers.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(arr).toString('base64url');
  }
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
