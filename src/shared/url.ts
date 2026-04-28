/**
 * Coerce a user-entered URL into a safe absolute href.
 *
 * Owners frequently type their YouTube/Instagram links without the
 * `https://` prefix (e.g. `youtube.com/@minha-igreja`). When that string is
 * used as an `<a href>` the browser treats it as a relative path. This helper
 * adds the missing scheme so the link always points outside the site.
 *
 * Returns `undefined` if the input is empty or only whitespace, so callers
 * can short-circuit cleanly.
 */
export function toExternalHref(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Honor explicit schemes the user may want.
  if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
  // Protocol-relative URLs are fine.
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  return `https://${trimmed.replace(/^\/+/, '')}`;
}
