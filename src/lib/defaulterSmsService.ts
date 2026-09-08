import { 
  Student, 
  School, 
  FeeStructure, 
  FeePayment, 
  UserProfile, 
  SMSDispatchRecord,
  DefaulterDispatchItem,
  DefaultersBroadcastResult,
  CommunicationLog,
  SmsMessage
} from '../types';
import { normalizeGhanaPhoneNumber } from './phoneNormalizer';
import { calculateSmsSegments } from './smsPolicy';
import { sanitizeSenderId } from './arkeselService';

export interface DefaulterStudentView {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classroomId: string;
  classroomName: string;
  parentName: string;
  rawPhone: string;
  normalizedPhone: string;
  isPhoneValid: boolean;
  phoneError?: string;
  amountToBePaid: number;
  amountPaid: number;
  amountOwing: number;
  term: string;
  academicYear: string;
}

/**
 * Authoritative extraction of fee defaulters based purely on real school fee structures and payment receipts.
 * Outstanding Balance = Total Fees/Amount Due - Total Valid Payments - Approved Adjustments
 */
export function getSchoolFeeDefaulters(
  school: School | null,
  students: Student[],
  feeStructures: FeeStructure[],
  feePayments: FeePayment[],
  parents?: UserProfile[],
  options?: {
    classroomId?: string;
    term?: string;
    academicYear?: string;
    searchQuery?: string;
  }
): DefaulterStudentView[] {
  if (!school) return [];

  const targetTerm = options?.term || school.currentTerm || 'Term 3';
  const targetYear = options?.academicYear || school.currentAcademicYear || '2026/2027';

  // 1. Filter students belonging to this school who are actively enrolled
  const activeStudents = students.filter(s => {
    if (s.schoolId !== school.id) return false;
    if (s.status === 'withdrawn' || s.status === 'graduated') return false;
    if (options?.classroomId && options.classroomId !== 'all' && s.currentClassroomId !== options.classroomId) return false;
    return true;
  });

  const defaulters: DefaulterStudentView[] = [];

  for (const student of activeStudents) {
    // 2. Determine fees billed / amount to be paid
    const applicableFee = feeStructures.find(f => f.classroomId === student.currentClassroomId) || feeStructures.find(f => !f.classroomId);
    const amountToBePaid = (typeof student.feesAmount === 'number' && !isNaN(student.feesAmount) && student.feesAmount >= 0)
      ? student.feesAmount
      : (applicableFee ? applicableFee.totalAmount : 0);

    // If no fee is configured or billed for this student/classroom, they are not a defaulter
    if (amountToBePaid <= 0) continue;

    // 3. Sum total valid payments for this student
    const studentPayments = (feePayments || []).filter(p => p.studentId === student.id && p.schoolId === school.id);
    const amountPaid = studentPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 4. Calculate actual outstanding balance
    const amountOwing = Math.max(0, amountToBePaid - amountPaid);

    // Strict Defaulter Condition: Outstanding balance must be strictly greater than 0
    if (amountOwing <= 0) continue;

    // 5. Authoritatively resolve guardian / parent phone and name
    let parentPhone = (student.guardianPhone || '').trim();
    let parentName = (student.guardianName || '').trim();

    if (!parentPhone && student.guardians && student.guardians.length > 0) {
      const primaryGuardian = student.guardians.find(g => g.isPrimary) || student.guardians[0];
      parentPhone = (primaryGuardian.phone || '').trim();
      if (!parentName) parentName = (primaryGuardian.name || '').trim();
    }

    if (!parentPhone && student.emergencyContact?.phone) {
      parentPhone = student.emergencyContact.phone.trim();
      if (!parentName) parentName = student.emergencyContact.name?.trim() || '';
    }

    if (!parentPhone && parents && parents.length > 0 && student.parentId) {
      const linkedParent = parents.find(p => p.id === student.parentId);
      if (linkedParent?.phone) {
        parentPhone = linkedParent.phone.trim();
        if (!parentName) parentName = linkedParent.fullName?.trim() || '';
      }
    }

    const studentFullName = `${student.firstName} ${student.lastName} ${student.otherNames || ''}`.trim();
    if (!parentName) {
      parentName = `${student.firstName}'s Parent/Guardian`;
    }

    // 6. Validate & Normalize Ghanaian phone number to E.164 (+233)
    const norm = normalizeGhanaPhoneNumber(parentPhone);

    const record: DefaulterStudentView = {
      studentId: student.id,
      studentName: studentFullName,
      admissionNumber: student.admissionNumber || student.id,
      classroomId: student.currentClassroomId,
      classroomName: student.classroomName || 'Unassigned Class',
      parentName,
      rawPhone: parentPhone,
      normalizedPhone: norm.isValid ? norm.formatted : '',
      isPhoneValid: norm.isValid,
      phoneError: norm.isValid ? undefined : (parentPhone ? norm.error || 'Invalid Ghanaian number' : 'No phone number configured'),
      amountToBePaid,
      amountPaid,
      amountOwing,
      term: student.term || applicableFee?.term || targetTerm,
      academicYear: student.academicYear || applicableFee?.academicYear || targetYear
    };

    // 7. Optional search query filtering
    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const matchName = record.studentName.toLowerCase().includes(q);
      const matchId = record.admissionNumber.toLowerCase().includes(q);
      const matchParent = record.parentName.toLowerCase().includes(q);
      const matchPhone = record.rawPhone.includes(q) || record.normalizedPhone.includes(q);
      if (!matchName && !matchId && !matchParent && !matchPhone) {
        continue;
      }
    }

    defaulters.push(record);
  }

  // Sort by highest balance owing first
  return defaulters.sort((a, b) => b.amountOwing - a.amountOwing);
}

/**
 * Resolves templated variables into personalized message text for a specific defaulter
 */
export function resolvePersonalizedMessage(
  template: string,
  item: DefaulterStudentView | DefaulterDispatchItem,
  schoolName: string
): string {
  const formattedBalance = `GH₵${item.amountOwing.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const firstName = item.studentName.split(' ')[0] || item.studentName;
  const lastName = item.studentName.split(' ').slice(1).join(' ') || item.studentName;

  let message = template
    .replace(/{studentName}/gi, item.studentName)
    .replace(/{firstName}/gi, firstName)
    .replace(/{lastName}/gi, lastName)
    .replace(/{studentId}/gi, item.admissionNumber || item.studentId)
    .replace(/{admissionNumber}/gi, item.admissionNumber || item.studentId)
    .replace(/{parentName}/gi, item.parentName)
    .replace(/{guardianName}/gi, item.parentName)
    .replace(/{amountOwing}/gi, formattedBalance)
    .replace(/{balance}/gi, formattedBalance)
    .replace(/{classroom}/gi, item.classroomName)
    .replace(/{classroomName}/gi, item.classroomName)
    .replace(/{term}/gi, item.term || 'current term')
    .replace(/{academicYear}/gi, item.academicYear || 'current academic year')
    .replace(/{schoolName}/gi, schoolName);

  // Clean double spaces and trim
  message = message.replace(/\s+/g, ' ').trim();

  // NCA / Ghana Telecom requirement: Official sender identity must appear in SMS body
  if (!message.toLowerCase().includes(schoolName.toLowerCase())) {
    message = `${schoolName}: ${message}`;
  }

  return message;
}

/**
 * Default standard Ghanaian school fee payment reminder template
 */
export const DEFAULT_DEFAULTER_SMS_TEMPLATE = 
  'Dear {parentName}, this is a payment notice from {schoolName}. {studentName} ({classroom}) has an outstanding school fee balance of {amountOwing} for {term}. Please make payment at the bursary or via official school MoMo channels. Thank you.';

/**
 * Controlled, authoritative Defaulters SMS broadcast execution engine.
 * Never silently fails; creates individual dispatch and communication log records;
 * updates SMS usage only for gateway-submitted messages.
 */
export async function executeDefaultersBroadcast(
  school: School,
  selectedDefaulters: DefaulterStudentView[],
  templateMessage: string,
  sentByUser: UserProfile | null,
  options?: {
    senderId?: string;
    apiKey?: string;
    onProgress?: (progress: {
      total: number;
      current: number;
      submitted: number;
      failed: number;
      currentStudentName: string;
      record: SMSDispatchRecord;
    }) => void;
  }
): Promise<{
  result: DefaultersBroadcastResult;
  newLogs: CommunicationLog[];
  newSmsMessages: SmsMessage[];
  creditsUsed: number;
}> {
  const broadcastId = `BCAST-DEF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const registeredSchoolName = school.name.trim();
  const approvedSenderId = sanitizeSenderId(registeredSchoolName, school.shortCode, options?.senderId || school.approvedSenderId);
  const sentBy = sentByUser?.fullName || 'School Administrator';

  const records: SMSDispatchRecord[] = [];
  const newLogs: CommunicationLog[] = [];
  const newSmsMessages: SmsMessage[] = [];

  let submittedCount = 0;
  let failedCount = 0;
  let creditsUsed = 0;

  const total = selectedDefaulters.length;

  for (let i = 0; i < total; i++) {
    const item = selectedDefaulters[i];
    const dispatchId = `DISP-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const notificationId = `NOTIF-${broadcastId}-${item.studentId}`;
    const personalizedMessage = resolvePersonalizedMessage(templateMessage, item, registeredSchoolName);
    const segmentStats = calculateSmsSegments(personalizedMessage);
    const segments = segmentStats.segments;

    // 1. Phone number validation check
    const phoneNorm = normalizeGhanaPhoneNumber(item.rawPhone);

    if (!phoneNorm.isValid || !phoneNorm.formatted) {
      // Record failed immediately without calling Arkesel Gateway
      const failureReason = item.rawPhone ? (phoneNorm.error || 'Invalid Ghanaian phone number format (+233)') : 'No parent phone number configured';
      failedCount++;

      const failedRecord: SMSDispatchRecord = {
        broadcastId,
        notificationId,
        dispatchId,
        schoolId: school.id,
        recipientId: item.studentId,
        studentId: item.studentId,
        studentName: item.studentName,
        admissionNumber: item.admissionNumber,
        classroomName: item.classroomName,
        recipientName: item.parentName,
        phoneNumber: item.rawPhone || 'Missing Phone',
        rawPhoneNumber: item.rawPhone,
        message: personalizedMessage,
        amountOwing: item.amountOwing,
        status: 'FAILED',
        segments,
        errorMessage: failureReason,
        createdAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        sentBy,
        category: 'DEFAULTER_BROADCAST'
      };

      records.push(failedRecord);

      // Create failure communication log
      const commLog: CommunicationLog = {
        id: dispatchId,
        messageId: dispatchId,
        idempotencyKey: dispatchId,
        schoolId: school.id,
        schoolName: registeredSchoolName,
        type: 'sms',
        recipient: item.rawPhone || 'No Phone',
        recipientName: item.parentName,
        senderName: registeredSchoolName,
        senderIdentity: approvedSenderId,
        provider: 'Arkesel SMS Gateway',
        status: 'failed',
        message: personalizedMessage,
        category: 'DEFAULTER_BROADCAST',
        relatedRecordId: item.studentId,
        providerResponse: `Validation Error: ${failureReason}`,
        failureReason,
        costGHS: 0,
        smsSegments: segments,
        timestamp: new Date().toISOString(),
        academicYear: item.academicYear || school.currentAcademicYear || '2026/2027',
        term: item.term || school.currentTerm || 'Term 3',
        createdBy: sentByUser?.email || 'system'
      };

      newLogs.push(commLog);
      newSmsMessages.push({
        id: dispatchId,
        messageId: dispatchId,
        idempotencyKey: dispatchId,
        schoolId: school.id,
        recipient: item.rawPhone || 'No Phone',
        sender: approvedSenderId,
        message: personalizedMessage,
        status: 'failed',
        costGHS: 0,
        smsSegments: segments,
        failureReason,
        createdAt: new Date().toISOString(),
        createdBy: sentByUser?.email || 'system',
        academicYear: item.academicYear,
        term: item.term
      });

      if (options?.onProgress) {
        options.onProgress({
          total,
          current: i + 1,
          submitted: submittedCount,
          failed: failedCount,
          currentStudentName: item.studentName,
          record: failedRecord
        });
      }
      continue;
    }

    // 2. Dispatch to Central Arkesel SMS Gateway via server proxy
    const formattedRecipient = phoneNorm.formatted;
    let dispatchStatus: 'SUBMITTED' | 'FAILED' = 'FAILED';
    let gatewayResponse = '';
    let gatewayMessageId = '';
    let errorMessage = '';

    try {
      const response = await fetch('/api/communication/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          schoolName: registeredSchoolName,
          approvedSenderId,
          recipient: formattedRecipient,
          recipientName: item.parentName,
          message: personalizedMessage,
          category: 'DEFAULTER_BROADCAST',
          relatedRecordId: item.studentId,
          idempotencyKey: dispatchId,
          messageId: dispatchId,
          apiKey: options?.apiKey || undefined,
          userRole: sentByUser?.role || 'admin'
        })
      });

      const responseText = await response.text();
      let responseData: any = null;
      try {
        responseData = responseText && responseText.trim() ? JSON.parse(responseText) : null;
      } catch {
        responseData = { error: responseText ? responseText.slice(0, 160) : `HTTP ${response.status}` };
      }

      if (response.ok && (responseData?.success || responseData?.status === 'submitted' || responseData?.status === 'accepted')) {
        dispatchStatus = 'SUBMITTED';
        gatewayMessageId = responseData.messageId || dispatchId;
        gatewayResponse = responseData.providerResponse || 'Arkesel accepted SMS submission for carrier delivery';
        submittedCount++;
        creditsUsed += segments;
      } else {
        dispatchStatus = 'FAILED';
        errorMessage = responseData?.error || responseData?.failureReason || responseData?.message || `Gateway returned HTTP ${response.status}`;
        failedCount++;
      }
    } catch (netErr: any) {
      dispatchStatus = 'FAILED';
      errorMessage = netErr?.message || 'Network connection failed while reaching SMS gateway';
      failedCount++;
    }

    const timestamp = new Date().toISOString();
    const record: SMSDispatchRecord = {
      broadcastId,
      notificationId,
      dispatchId,
      schoolId: school.id,
      recipientId: item.studentId,
      studentId: item.studentId,
      studentName: item.studentName,
      admissionNumber: item.admissionNumber,
      classroomName: item.classroomName,
      recipientName: item.parentName,
      phoneNumber: formattedRecipient,
      rawPhoneNumber: item.rawPhone,
      message: personalizedMessage,
      amountOwing: item.amountOwing,
      status: dispatchStatus,
      segments,
      gatewayResponse: dispatchStatus === 'SUBMITTED' ? gatewayResponse : undefined,
      gatewayMessageId: dispatchStatus === 'SUBMITTED' ? gatewayMessageId : undefined,
      errorMessage: dispatchStatus === 'FAILED' ? errorMessage : undefined,
      createdAt: timestamp,
      submittedAt: dispatchStatus === 'SUBMITTED' ? timestamp : undefined,
      failedAt: dispatchStatus === 'FAILED' ? timestamp : undefined,
      sentBy,
      category: 'DEFAULTER_BROADCAST'
    };

    records.push(record);

    const commLog: CommunicationLog = {
      id: dispatchId,
      messageId: gatewayMessageId || dispatchId,
      idempotencyKey: dispatchId,
      schoolId: school.id,
      schoolName: registeredSchoolName,
      type: 'sms',
      recipient: formattedRecipient,
      recipientName: item.parentName,
      senderName: registeredSchoolName,
      senderIdentity: approvedSenderId,
      provider: 'Arkesel SMS Gateway',
      status: dispatchStatus === 'SUBMITTED' ? 'submitted' : 'failed',
      message: personalizedMessage,
      category: 'DEFAULTER_BROADCAST',
      relatedRecordId: item.studentId,
      providerResponse: dispatchStatus === 'SUBMITTED' ? gatewayResponse : errorMessage,
      failureReason: dispatchStatus === 'FAILED' ? errorMessage : undefined,
      costGHS: dispatchStatus === 'SUBMITTED' ? Number((segments * 0.04).toFixed(2)) : 0,
      smsSegments: segments,
      timestamp,
      academicYear: item.academicYear || school.currentAcademicYear || '2026/2027',
      term: item.term || school.currentTerm || 'Term 3',
      createdBy: sentByUser?.email || 'system'
    };

    newLogs.push(commLog);
    newSmsMessages.push({
      id: dispatchId,
      messageId: gatewayMessageId || dispatchId,
      idempotencyKey: dispatchId,
      schoolId: school.id,
      recipient: formattedRecipient,
      sender: approvedSenderId,
      message: personalizedMessage,
      status: dispatchStatus === 'SUBMITTED' ? 'submitted' : 'failed',
      costGHS: dispatchStatus === 'SUBMITTED' ? Number((segments * 0.04).toFixed(2)) : 0,
      smsSegments: segments,
      failureReason: dispatchStatus === 'FAILED' ? errorMessage : undefined,
      createdAt: timestamp,
      createdBy: sentByUser?.email || 'system',
      academicYear: item.academicYear,
      term: item.term
    });

    if (options?.onProgress) {
      options.onProgress({
        total,
        current: i + 1,
        submitted: submittedCount,
        failed: failedCount,
        currentStudentName: item.studentName,
        record
      });
    }
  }

  const result: DefaultersBroadcastResult = {
    broadcastId,
    totalRecipients: total,
    submittedCount,
    failedCount,
    totalCostGHS: Number((creditsUsed * 0.04).toFixed(2)),
    records
  };

  return {
    result,
    newLogs,
    newSmsMessages,
    creditsUsed
  };
}
