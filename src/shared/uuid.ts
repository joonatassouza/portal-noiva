/**
 * Lightweight UUID v4 wrapper. Uses Web Crypto when available, falls back to
 * Node's `crypto` randomUUID. Importing crypto/node directly in domain code
 * would couple it to Node, so we tunnel it through this shared util.
 */
export function randomUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Eslint-friendly require fallback for older Node environments.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomUUID: nodeUuid } = require('node:crypto');
  return nodeUuid();
}

/** URL-safe random token for invitations / one-time links. */
export function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomFillSync } = require('node:crypto');
    randomFillSync(arr);
  }
  return Buffer.from(arr).toString('base64url');
}
