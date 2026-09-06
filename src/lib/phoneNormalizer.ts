/**
 * Single Authoritative Ghanaian Phone Number Normalizer
 * Used across SchoolOS Communication Service, Super Admin, and Arkesel SMS Gateway
 *
 * Rules:
 * - Automatically normalizes to international E.164 format: +233XXXXXXXXX
 * - Removes spaces, hyphens, brackets, parentheses, unnecessary characters
 * - Converts valid local number beginning with "0" (e.g., 0241234567) to "+233241234567"
 * - Converts "233XXXXXXXXX" to "+233XXXXXXXXX"
 * - Leaves already correct "+233XXXXXXXXX" unchanged
 * - Prevents duplicate country codes such as "+233233..."
 * - Rejects obviously invalid numbers before attempting to send
 * - Never generates "00233", "0233", "233+", or other malformed formats
 */

export interface PhoneNormalizationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
  original: string;
}

export function normalizeGhanaPhoneNumber(rawPhone: string | null | undefined): PhoneNormalizationResult {
  const original = rawPhone ? String(rawPhone) : '';

  if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
    return {
      isValid: false,
      formatted: '',
      error: 'Recipient phone number is required.',
      original
    };
  }

  // 1. Strip spaces, hyphens, brackets, parentheses, dots, commas, slashes, underscores
  let cleaned = rawPhone.trim().replace(/[\s\-()[\]./,_]/g, '');

  // 2. Remove all characters except digits and '+'
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      formatted: '',
      error: 'Recipient phone number contains no valid digits.',
      original
    };
  }

  // 3. Normalize international prefix '00' or leading '+'
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // 4. Remove any internal accidental '+' signs (e.g. "233+241234567")
  cleaned = cleaned.replace(/\+/g, '');

  // 5. Prevent and collapse duplicate country codes (e.g. "233233241234567" -> "233241234567")
  while (cleaned.startsWith('233233')) {
    cleaned = cleaned.substring(3);
  }

  // 6. Handle "0233..." typo (accidental leading 0 before country code)
  if (cleaned.startsWith('0233') && cleaned.length >= 12) {
    cleaned = cleaned.substring(1);
    while (cleaned.startsWith('233233')) {
      cleaned = cleaned.substring(3);
    }
  }

  let nationalNumber = '';

  // 7. Extract 9-digit national subscriber number
  if (cleaned.startsWith('233')) {
    nationalNumber = cleaned.substring(3);
    // If someone wrote 2330241234567 (accidental 0 after 233)
    if (nationalNumber.startsWith('0')) {
      nationalNumber = nationalNumber.substring(1);
    }
  } else if (cleaned.startsWith('0')) {
    // Standard 10-digit local format: "0241234567"
    nationalNumber = cleaned.substring(1);
  } else if (cleaned.length === 9) {
    // 9 digits without 0 or 233: "241234567"
    nationalNumber = cleaned;
  } else {
    return {
      isValid: false,
      formatted: '',
      error: `Invalid Ghanaian phone number format "${original}". Expected 10 digits starting with 0 (e.g., 0241234567) or +233XXXXXXXXX.`,
      original
    };
  }

  // 8. Ghana national subscriber numbers must be exactly 9 digits
  if (nationalNumber.length !== 9 || !/^\d{9}$/.test(nationalNumber)) {
    return {
      isValid: false,
      formatted: '',
      error: `Invalid Ghanaian phone number length for "${original}". Expected 9 digits after +233, got ${nationalNumber.length}.`,
      original
    };
  }

  // 9. Standard E.164 output with '+233'
  const formatted = `+233${nationalNumber}`;

  return {
    isValid: true,
    formatted,
    original
  };
}

/**
 * Returns normalized +233XXXXXXXXX format, or empty string if invalid
 */
export function formatToGhanaE164(phone: string | null | undefined): string {
  const result = normalizeGhanaPhoneNumber(phone);
  return result.isValid ? result.formatted : '';
}

/**
 * Validates whether the given phone number is a valid Ghanaian number
 */
export function isValidGhanaPhone(phone: string | null | undefined): boolean {
  return normalizeGhanaPhoneNumber(phone).isValid;
}
