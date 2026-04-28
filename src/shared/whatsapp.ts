/**
 * Best-effort WhatsApp number normalization.
 *
 * Strips everything that's not a digit. Accepts numbers with or without the
 * country code; if the user typed only Brazilian local digits (10–11), we
 * prefix `55`. The output is the E.164 form WITHOUT the leading `+`, which is
 * exactly what wa.me expects:  https://wa.me/5541999999999
 */
export function normalizeWhatsapp(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  if (digits.length < 8) return undefined; // too short to be a real number
  // If the user clearly omitted the country code (10–11 digits), assume Brazil.
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** wa.me link from a normalized number (no `+`). Returns null if invalid. */
export function whatsappLink(normalized: string | undefined | null): string | null {
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

/** Pretty-format for display: "+55 41 99999-9999". Falls back to raw. */
export function displayWhatsapp(raw: string | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return raw;
  // Last 9 digits = local number; preceding 2 = area code; rest = country.
  const local = digits.slice(-9);
  const area = digits.slice(-11, -9);
  const country = digits.slice(0, -11) || '';
  const localPretty = local.length === 9
    ? `${local.slice(0, 5)}-${local.slice(5)}`
    : `${local.slice(0, 4)}-${local.slice(4)}`;
  return `+${country} ${area} ${localPretty}`.replace(/\s+/g, ' ').trim();
}
