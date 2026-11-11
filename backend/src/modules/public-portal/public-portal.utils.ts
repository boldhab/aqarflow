/**
 * Pakistani phone number validator and normalizer.
 * Supports:
 * - +92 3xx xxxxxxx
 * - 0092 3xx xxxxxxx
 * - 92 3xx xxxxxxx
 * - 03xx xxxxxxx
 * - 3xx xxxxxxx
 * Normalizes to: +923XXXXXXXXX
 */
export function validateAndNormalizePakistaniPhone(phone: string): { isValid: boolean; normalized?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false };
  }

  // Remove spaces, dashes, dots, parentheses
  const cleaned = phone.trim().replace(/[\s\-().]/g, '');

  const pakPhoneRegex = /^(?:\+92|0092|92|0)?(3\d{9})$/;
  const match = cleaned.match(pakPhoneRegex);

  if (!match) {
    return { isValid: false };
  }

  return {
    isValid: true,
    normalized: `+92${match[1]}`,
  };
}

/**
 * Strips HTML tags and control characters from string input.
 */
export function sanitizeInput(input?: string | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control chars
    .trim();
}
