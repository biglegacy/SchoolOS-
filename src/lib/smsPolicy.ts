import { SubscriptionTier, CommunicationCategory, School } from '../types';
import { normalizeGhanaPhoneNumber } from './phoneNormalizer';

/**
 * SMS Policy and Idempotency Guard for SchoolOS Online
 * Enforces:
 * 1. Tier-based SMS feature gating (Basic vs Standard vs Premium)
 * 2. Strict idempotency key generation and duplicate prevention
 * 3. GSM-7 character length & multipart segment calculation (160 chars / segment)
 * 4. Recipient phone deduplication (1 phone number = 1 SMS per broadcast)
 * 5. Ghana NCA/Arkesel Sender ID sanitization (max 11 chars alphanumeric)
 */

export type SmsFeatureType = 
  | 'manual_parent_sms'
  | 'fee_payment_receipt'
  | 'fee_payment_reminder'
  | 'fee_deadline_alert'
  | 'attendance_absence_alert'
  | 'exam_result_notification'
  | 'pta_meeting_notification'
  | 'school_reopening_closure'
  | 'classroom_group_sms'
  | 'bulk_sms'
  | 'scheduled_sms'
  | 'automated_campaign'
  | 'emergency_broadcast';

export interface SmsGateResult {
  allowed: boolean;
  minTierRequired: 'basic' | 'standard' | 'premium';
  tierName: string;
  reason?: string;
}

/**
 * Validates whether a school's subscription plan permits a specific SMS operation.
 * 
 * - Basic (GH₵ 1,500/term, 500 SMS): Manual SMS, fee payment receipts, important notices, attendance.
 * - Standard (GH₵ 2,500/term, 1,500 SMS): Adds PTA SMS, fee reminders, bulk SMS, classroom groups, scheduled SMS, exam reports.
 * - Premium (GH₵ 4,000/term, 4,000 SMS): Adds automated recurring campaigns, emergency broadcasts, priority routing, whole-school broadcasts.
 */
export function checkSmsFeatureGating(
  planCode: string | undefined,
  featureType: SmsFeatureType
): SmsGateResult {
  const code = (planCode || 'basic').toLowerCase().trim();
  const normalizedTier = code === 'starter' ? 'basic' : code === 'enterprise' ? 'premium' : code;

  // Basic tier features
  const basicFeatures: SmsFeatureType[] = [
    'manual_parent_sms',
    'fee_payment_receipt',
    'attendance_absence_alert'
  ];

  // Standard tier features
  const standardFeatures: SmsFeatureType[] = [
    ...basicFeatures,
    'fee_payment_reminder',
    'fee_deadline_alert',
    'exam_result_notification',
    'pta_meeting_notification',
    'school_reopening_closure',
    'classroom_group_sms',
    'bulk_sms',
    'scheduled_sms'
  ];

  // Premium tier features (all features)
  if (normalizedTier === 'premium') {
    return {
      allowed: true,
      minTierRequired: 'basic',
      tierName: 'Premium'
    };
  }

  if (normalizedTier === 'standard') {
    const isAllowed = standardFeatures.includes(featureType);
    return {
      allowed: isAllowed,
      minTierRequired: isAllowed ? 'standard' : 'premium',
      tierName: 'Standard',
      reason: isAllowed 
        ? undefined 
        : 'Automated SMS campaigns and whole-school emergency broadcasts require the Premium plan.'
    };
  }

  // Basic tier
  const isAllowedInBasic = basicFeatures.includes(featureType);
  const minTier: 'basic' | 'standard' | 'premium' = isAllowedInBasic 
    ? 'basic' 
    : standardFeatures.includes(featureType) 
      ? 'standard' 
      : 'premium';

  return {
    allowed: isAllowedInBasic,
    minTierRequired: minTier,
    tierName: 'Basic',
    reason: isAllowedInBasic
      ? undefined
      : minTier === 'standard'
        ? 'PTA meeting SMS, fee reminders, exam notifications, and bulk SMS require upgrading to the Standard plan.'
        : 'This feature requires the Premium plan.'
  };
}

/**
 * Calculates the number of SMS segments for a given message.
 * Standard GSM-7 character encoding:
 * 1 segment: 1 - 160 characters
 * Concatenated/multipart SMS: 153 characters per segment header
 */
export function calculateSmsSegments(message: string): {
  charCount: number;
  segments: number;
  charsRemainingInSegment: number;
} {
  const charCount = message ? message.length : 0;
  if (charCount === 0) {
    return { charCount: 0, segments: 1, charsRemainingInSegment: 160 };
  }

  if (charCount <= 160) {
    return {
      charCount,
      segments: 1,
      charsRemainingInSegment: 160 - charCount
    };
  }

  // Multipart messages use 153 characters per segment due to UDH header
  const segments = Math.ceil(charCount / 153);
  const charsRemainingInSegment = (segments * 153) - charCount;
  return {
    charCount,
    segments,
    charsRemainingInSegment
  };
}

/**
 * Deduplicates a list of Ghanaian recipient phone numbers.
 * Ensures that if multiple parents/guardians share the same phone number,
 * or if a parent has multiple children, only ONE SMS is dispatched to that number.
 */
export function deduplicatePhoneNumbers(
  recipients: Array<{ phone: string; name?: string; studentName?: string; id?: string }>
): Array<{ phone: string; normalizedPhone: string; name?: string; studentNames: string[] }> {
  const phoneMap = new Map<string, { phone: string; normalizedPhone: string; name?: string; studentNames: string[] }>();

  for (const item of recipients) {
    if (!item.phone || !item.phone.trim()) continue;
    const norm = normalizeGhanaPhoneNumber(item.phone);
    if (!norm.isValid) continue;

    const key = norm.formatted; // E.164 +233XXXXXXXXX
    const existing = phoneMap.get(key);
    if (existing) {
      if (item.studentName && !existing.studentNames.includes(item.studentName)) {
        existing.studentNames.push(item.studentName);
      }
      if (!existing.name && item.name) {
        existing.name = item.name;
      }
    } else {
      phoneMap.set(key, {
        phone: item.phone,
        normalizedPhone: norm.formatted,
        name: item.name,
        studentNames: item.studentName ? [item.studentName] : []
      });
    }
  }

  return Array.from(phoneMap.values());
}

/**
 * Generates an authoritative idempotency key for an SMS request.
 * Guarantees that:
 * 1. Fast double-clicks generate the identical key and are stopped.
 * 2. Automated triggers for the same event (e.g. payment receipt, student absence on date)
 *    produce the exact same key and cannot send twice.
 */
export function generateSmsIdempotencyKey(params: {
  schoolId: string;
  recipient: string;
  category: string;
  relatedRecordId?: string;
  messageHash?: string;
}): string {
  const normRecipient = normalizeGhanaPhoneNumber(params.recipient).formatted.replace(/\D/g, '');
  if (params.relatedRecordId && params.relatedRecordId.trim()) {
    // Event-bound idempotency (e.g. fee payment, roll call absence, terminal report card)
    return `sms_evt_${params.schoolId}_${params.category}_${params.relatedRecordId}_${normRecipient}`.slice(0, 120);
  }

  // Non-event manual action: bound to 60-second window + content hash to stop double clicks and page refresh duplicates
  const contentHash = params.messageHash || 'manual';
  const timeWindow = Math.floor(Date.now() / 60000); // 1-minute window
  return `sms_req_${params.schoolId}_${normRecipient}_${contentHash}_${timeWindow}`.slice(0, 120);
}

/**
 * Sanitizes a school's registered name or short code to produce a valid
 * Ghanaian NCA / Arkesel Alphanumeric Sender ID (max 11 characters).
 */
export function resolveSchoolSenderId(school: {
  name: string;
  shortCode?: string;
  approvedSenderId?: string;
}): string {
  if (school.approvedSenderId && school.approvedSenderId.trim()) {
    const cleaned = school.approvedSenderId.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 11);
    }
  }

  if (school.shortCode && school.shortCode.trim()) {
    const cleaned = school.shortCode.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 11);
    }
  }

  // Generate from school name
  const words = school.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 11).toUpperCase();
  }
  if (words.length === 2) {
    return `${words[0].slice(0, 5)}${words[1].slice(0, 6)}`.toUpperCase().slice(0, 11);
  }
  // 3+ words: take first word + acronym
  const firstWord = words[0].slice(0, 6).toUpperCase();
  const acronym = words.slice(1).map(w => w[0]).join('').toUpperCase();
  return `${firstWord}${acronym}`.slice(0, 11);
}
