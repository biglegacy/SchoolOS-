/**
 * Centralized Ghanaian Phone Number Normalization Utility
 * Strictly enforces international E.164 format (+233XXXXXXXXX) for Arkesel SMS.
 */

export interface PhoneNormalizationResult {
  isValid: boolean;
  formatted: string;
  original: string;
  error?: string;
}

export function normalizeGhanaPhoneNumber(phone: string | null | undefined): PhoneNormalizationResult {
  const original = phone === null || phone === undefined ? '' : String(phone).trim();

  if (!original) {
    return {
      isValid: false,
      formatted: '',
      original,
      error: 'Phone number is required.'
    };
  }

  let cleaned = original.replace(/[\s\-_()[\]{}.\\/]/g, '');

  if (cleaned.startsWith('00233')) {
    cleaned = '+233' + cleaned.slice(5);
  } else if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  while (cleaned.startsWith('+233233')) {
    cleaned = '+233' + cleaned.slice(7);
  }
  while (cleaned.startsWith('233233')) {
    cleaned = '233' + cleaned.slice(6);
  }

  let nationalDigits = '';

  if (cleaned.startsWith('+233')) {
    nationalDigits = cleaned.slice(4).replace(/\D/g, '');
  } else if (cleaned.startsWith('233')) {
    nationalDigits = cleaned.slice(3).replace(/\D/g, '');
  } else if (cleaned.startsWith('0')) {
    nationalDigits = cleaned.slice(1).replace(/\D/g, '');
  } else {
    nationalDigits = cleaned.replace(/\D/g, '');
  }

  if (nationalDigits.length !== 9) {
    return {
      isValid: false,
      formatted: '',
      original,
      error: `Invalid length: Expected 9 national digits after +233, but got ${nationalDigits.length} (${cleaned}).`
    };
  }

  const validGhanaPrefixes = [
    '24', '54', '55', '59', '25',
    '20', '50',
    '27', '57', '26'
  ];

  const prefix = nationalDigits.slice(0, 2);
  if (!validGhanaPrefixes.includes(prefix)) {
    return {
      isValid: false,
      formatted: `+233${nationalDigits}`,
      original,
      error: `Unrecognized Ghana telecom network code: "0${prefix}". Valid codes include MTN (024,054,055,059,025), Telecel (020,050), and AT (027,057,026).`
    };
  }

  return {
    isValid: true,
    formatted: `+233${nationalDigits}`,
    original
  };
}

export function formatToGhanaE164(phone: string | null | undefined): string {
  const result = normalizeGhanaPhoneNumber(phone);
  return result.isValid ? result.formatted : (result.formatted || '');
}
