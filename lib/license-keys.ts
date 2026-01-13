// License key generation and validation utilities
import crypto from 'crypto';

// Alphabet without ambiguous characters (no I, O, 0, 1)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a cryptographically random license key.
 * Format: STCH-XXXX-XXXX-XXXX-XXXX
 * Example: STCH-K7HN-2MRG-XVBP-9LQT
 */
export function generateLicenseKey(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let group = '';
    for (let c = 0; c < 4; c++) {
      const randomBytes = crypto.randomBytes(1);
      const idx = randomBytes[0] % ALPHABET.length;
      group += ALPHABET[idx];
    }
    groups.push(group);
  }
  return `STCH-${groups.join('-')}`;
}

/**
 * Validate license key format.
 * Returns true if the key matches STCH-XXXX-XXXX-XXXX-XXXX pattern.
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;

  // Normalize: uppercase and trim
  const normalized = key.toUpperCase().trim();

  // Check format: STCH-XXXX-XXXX-XXXX-XXXX
  const pattern = /^STCH-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(normalized);
}

/**
 * Normalize a license key (uppercase, trim whitespace).
 */
export function normalizeLicenseKey(key: string): string {
  return key.toUpperCase().trim();
}

/**
 * Mask a license key for display.
 * STCH-ABCD-EFGH-IJKL-MNOP → STCH-****-****-****-MNOP
 */
export function maskLicenseKey(key: string): string {
  const parts = key.split('-');
  if (parts.length !== 5) return key;
  return `${parts[0]}-****-****-****-${parts[4]}`;
}
