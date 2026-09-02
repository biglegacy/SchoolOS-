export type UserRole = 
  | 'superAdmin' 
  | 'schoolOwner' 
  | 'principal' 
  | 'teacher' 
  | 'accountant' 
  | 'parent' 
  | 'student';

export type SchoolStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export type SubscriptionPlan = 'basic' | 'standard' | 'premium' | 'starter' | 'enterprise' | string;

export type PlanBillingPeriod = 'term' | 'annual' | 'monthly';

export type FeatureKey =
  | 'students'
  | 'teachers'
  | 'classrooms'
  | 'subjects'
  | 'attendance'
  | 'results'
  | 'examinations'
  | 'reports'
  | 'promotions'
  | 'fees'
  | 'store'
  | 'pos'
  | 'communications'
  | 'analytics'
  | 'users_portals'
  | 'settings'
  | 'teacher_portal'
  | 'parent_portal'
  | 'student_portal'
  | 'accountant_portal';

export interface SubscriptionTier {
  id: string;
  name: string;
  code: string;
  priceGHS: number;
  billingPeriod: PlanBillingPeriod;
  description: string;
  features: FeatureKey[];
  studentLimit: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  shortCode?: string;
  logo?: string;
  motto?: string;
  address: string;
  district: string;
  region: string; // Greater Accra, Ashanti, Central, Eastern, Western, etc.
  phone: string;
  registeredPhone?: string; // Official school registered phone number for communication identity
  email: string;
  website?: string;
  registrationNumber?: string;
  status: SchoolStatus;
  subscriptionPlan: SubscriptionPlan;
  planId?: string;
  subscriptionExpiry: string;
  featureOverrides?: Partial<Record<FeatureKey, boolean>>;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  currentAcademicYear: string;
  currentTerm: 'Term 1' | 'Term 2' | 'Term 3';
  currency?: string; // 'GHS'
  sbaMaxScore?: number; // Default: 30
  examMaxScore?: number; // Default: 70
  assessmentRatio?: '30/70' | '50/50' | '40/60' | '20/80' | '30/50' | 'custom' | string;
  // School Communication Identity
  communicationSenderName?: string;
  communicationSenderNumber?: string;
  communicationSenderType?: 'sms' | 'whatsapp' | 'both';
  communicationEnabled?: boolean;
  approvedSenderId?: string; // Provider-approved alphanumeric sender ID (max 11 chars)
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  username?: string;
  password?: string;
  fullName: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  schoolId?: string;
  schoolName?: string;
  phone?: string;
  avatarUrl?: string;
  teacherId?: string;
  studentId?: string;
  linkedStudentIds?: string[]; // For parents
  createdAt: string;
  updatedAt?: string;
}

export interface Guardian {
  name: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Sibling' | 'Other';
  phone: string;
  email?: string;
  occupation?: string;
  isPrimary?: boolean;
}

export interface Student {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  ghanaCardNumber?: string; // GHA-XXXXXXXXX-X
  currentClassroomId: string;
  classroomName: string;
  level: string; // "Primary 4", "JHS 2", "Basic 3", etc.
  admissionDate: string;
  status: 'active' | 'withdrawn' | 'graduated' | 'suspended';
  photoUrl?: string;
  guardians: Guardian[];
  medicalConditions?: string;
  allergies?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  houseOrTeam?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubjectAssignment {
  id?: string;
  subjectId?: string;
  subjectName: string;
  classroomId: string;
  classroomName: string;
}

export interface TimetableSlot {
  id: string;
  schoolId?: string;
  teacherId?: string;
  teacherName?: string;
  subjectName: string;
  classroomId: string;
  classroomName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "08:45"
  period?: string;   // e.g. "Period 1"
  periodName?: string; // e.g. "Period 1"
  room?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  userId?: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female';
  ghanaCardNumber?: string;
  qualification: string;
  specialization?: string;
  dateJoined?: string;
  employmentDate?: string;
  status: 'active' | 'on_leave' | 'inactive';
  photoUrl?: string;
  assignedClassroomId?: string; // Optional: If serving as Form Tutor / Class Master
  assignedClassroomName?: string;
  assignedClassroomIds?: string[];
  subjectsTaught?: string[];
  assignedSubjects?: TeacherSubjectAssignment[];
  timetable?: TimetableSlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Classroom {
  id: string;
  schoolId: string;
  name: string; // e.g. "Basic 4 Gold", "JHS 2 Green", "KG 2 Alpha"
  level: string; // "KG 1", "KG 2", "Primary 1".."Primary 6", "JHS 1".."JHS 3", "SHS 1".."SHS 3"
  section?: string;
  academicYear: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  capacity: number;
  classTeacherId?: string;
  classTeacherName?: string;
  studentCount: number;
  subjects: string[]; // Subject IDs / Names
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  category: 'Core' | 'Elective' | 'Vocational';
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classroomId: string;
  classroomName?: string;
  subjectId?: string;
  subjectName?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  term?: string;
  academicYear?: string;
  recordedBy?: string;
  recordedById?: string;
  createdAt?: string;
}

export interface Examination {
  id: string;
  schoolId: string;
  name: string;
  academicYear: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  startDate: string;
  endDate: string;
  status: 'draft' | 'ongoing' | 'grading' | 'published';
  targetClassrooms: string[];
  createdAt: string;
}

export interface ExaminationResult {
  id: string;
  schoolId: string;
  examinationId?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classroomId: string;
  classroomName: string;
  subjectId?: string;
  subjectName: string;
  subject?: string;
  assessmentType?: 'sba' | 'class_test' | 'assignment' | 'project' | 'exam' | 'continuous_assessment' | string;
  classScore: number; // 0-30% Continuous Assessment
  examScore: number; // 0-70% Terminal Examination
  totalScore: number; // 0-100%
  grade: 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'F' | string;
  gradeRemark: string;
  position?: number;
  totalStudents?: number;
  teacherRemarks?: string;
  enteredBy?: string;
  enteredById?: string;
  academicYear?: string;
  term?: 'Term 1' | 'Term 2' | 'Term 3' | string;
  examType?: string;
  classAverage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TerminalReport {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classroomId: string;
  classroomName: string;
  academicYear: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  subjects: Array<{
    subjectName: string;
    classScore: number;
    examScore: number;
    total: number;
    grade: string;
    position: number;
    remarks: string;
  }>;
  attendanceSummary: {
    totalDays: number;
    daysPresent: number;
    daysAbsent: number;
    percentageAttendance: number;
  };
  overallAverage: number;
  overallGrade: string;
  overallPosition: number;
  totalStudentsInClass: number;
  classTeacherRemarks: string;
  headTeacherRemarks: string;
  promoted: boolean;
  nextClass?: string;
  reopeningDate?: string;
  dateIssued: string;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  mandatory: boolean;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  name: string;
  classroomId?: string;
  classroomName?: string;
  academicYear: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  items: FeeItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
}

export type PaymentMethod = 
  | 'mtn_momo' 
  | 'telecel_cash' 
  | 'bank_deposit' 
  | 'cash' 
  | 'cheque' 
  | 'card'
  | 'momo' 
  | 'bank';

export interface FeePayment {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  classroomId?: string;
  classroomName: string;
  feeStructureId?: string;
  receiptNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  method?: PaymentMethod;
  transactionReference?: string;
  reference?: string;
  payerName: string;
  payerPhone?: string;
  recordedBy?: string;
  receivedBy?: string;
  paymentDate: string;
  date?: string;
  term?: 'Term 1' | 'Term 2' | 'Term 3' | string;
  academicYear?: string;
  remarks?: string;
  notes?: string;
  createdAt?: string;
}

export interface StudentFeeSummary {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classroomId?: string;
  classroomName: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  lastPaymentDate?: string;
}

export type ProductCategory = 
  | 'uniforms' 
  | 'books' 
  | 'stationery' 
  | 'accessories' 
  | 'other'
  | 'Uniform' 
  | 'Textbooks' 
  | 'Exercise Books' 
  | 'Stationery' 
  | 'Accessories' 
  | 'Canteen';

export interface StoreItem {
  id: string;
  schoolId: string;
  name: string;
  category: ProductCategory;
  sku: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit?: string;
  supplier?: string;
  status?: string;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface POSCartItem {
  item: StoreItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface POSReceipt {
  id: string;
  schoolId: string;
  receiptNumber: string;
  items: Array<{
    itemId: string;
    itemName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  studentId?: string;
  studentName?: string;
  cashierName: string;
  timestamp: string;
  status: 'completed' | 'refunded';
}

export interface POSTransaction {
  id: string;
  schoolId: string;
  reference?: string;
  transactionReference?: string;
  receiptNumber: string;
  items: Array<{
    itemId: string;
    name: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  changeGiven?: number;
  customerType?: 'student' | 'guardian' | 'staff' | 'visitor';
  customerName?: string;
  studentAdmissionNumber?: string;
  cashierName: string;
  date?: string;
  createdAt: string;
}

export type SMSBroadcastRecipient = 
  | 'all_parents' 
  | 'all_guardians' 
  | 'fee_defaulters' 
  | 'all_staff' 
  | 'staff' 
  | 'class_parents' 
  | 'class_guardians' 
  | 'defaulters' 
  | 'custom';

export interface BroadcastMessage {
  id: string;
  schoolId: string;
  type: 'sms' | 'whatsapp' | 'announcement';
  recipientGroup: SMSBroadcastRecipient;
  targetClassroomId?: string;
  recipientCount: number;
  message: string;
  senderId: string;
  status: 'delivered' | 'pending' | 'failed';
  costGHS: number;
  sentBy: string;
  sentAt: string;
}

export interface AuditLog {
  id: string;
  schoolId?: string;
  schoolName?: string;
  userId: string;
  userName?: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SchoolSettings {
  schoolId: string;
  smsProvider: 'arkesel' | 'twilio' | 'mnotify';
  smsSenderId: string;
  smsBalance: number;
  momoMerchantNumber?: string;
  gradingScale: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
    remark: string;
  }>;
  receiptHeader: string;
  receiptFooter: string;
  reopeningDate: string;
  vacationDate: string;
  sbaMaxScore?: number;
  examMaxScore?: number;
  assessmentRatio?: string;
}

export type CommunicationCategory = 
  | 'fee_receipt' 
  | 'fee_reminder' 
  | 'attendance_alert' 
  | 'exam_results' 
  | 'broadcast' 
  | 'announcement'
  | 'test' 
  | 'notice';

export interface CommunicationProviderConfig {
  id: string;
  type: 'sms' | 'whatsapp' | 'email';
  provider: string; // e.g. 'arkesel', 'mnotify', 'meta', 'twilio', 'infobip'
  name: string; // Display name e.g. "Arkesel SMS Gateway", "Meta Cloud WhatsApp API"
  apiKey: string;
  apiSecret?: string;
  apiUrl: string;
  senderId?: string; // Default platform fallback sender ID e.g. "SCHOOLOS"
  phoneNumberId?: string; // WhatsApp Phone Number ID
  businessAccountId?: string; // WABA ID
  webhookSecret?: string;
  isActive: boolean;
  isPrimary?: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformCommunicationSettings {
  sms: {
    provider: 'arkesel' | 'twilio' | 'mnotify' | string;
    apiKey: string;
    apiSecret?: string;
    senderId: string;
    apiUrl: string;
    isActive: boolean;
    lastTestedAt?: string;
    lastTestStatus?: 'success' | 'failed' | 'untested';
    lastTestMessage?: string;
  };
  whatsapp: {
    provider: 'meta' | 'twilio' | 'infobip' | string;
    apiKey: string;
    apiSecret?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    apiUrl: string;
    isActive: boolean;
    lastTestedAt?: string;
    lastTestStatus?: 'success' | 'failed' | 'untested';
    lastTestMessage?: string;
  };
  providers?: CommunicationProviderConfig[];
  automatedTriggers?: {
    feePaymentReceipts: boolean;
    attendanceAbsenceAlerts: boolean;
    examResultsPublication: boolean;
    generalAnnouncements: boolean;
  };
  updatedAt?: string;
}

export interface CommunicationLog {
  id: string;
  schoolId: string;
  schoolName: string; // Authoritative registered school name
  type: 'sms' | 'whatsapp' | 'email' | 'system';
  recipient: string; // e.g. "0244123456"
  recipientName?: string; // e.g. "Mr. Kwame Mensah"
  senderName: string; // Registered school name
  senderIdentity: string; // School's registered phone or approved sender ID
  provider: string; // e.g. "Arkesel SMS Gateway", "Meta Cloud API"
  status: 'delivered' | 'sent' | 'failed' | 'pending';
  message: string;
  category: CommunicationCategory;
  relatedRecordId?: string; // e.g. paymentId, attendanceId, examId
  providerResponse?: string;
  costGHS?: number;
  timestamp: string;
}

export interface SendCommunicationParams {
  schoolId: string;
  schoolName?: string;
  registeredPhone?: string;
  type: 'sms' | 'whatsapp';
  recipient: string;
  recipientName?: string;
  message: string;
  category: CommunicationCategory;
  relatedRecordId?: string;
  targetClassroomId?: string;
}

export interface CommunicationTestParams {
  channel: 'sms' | 'whatsapp';
  provider: string;
  apiKey: string;
  apiSecret?: string;
  apiUrl: string;
  senderId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  testRecipient: string;
  testMessage?: string;
  simulatedSchoolName?: string;
}

// ----------------------------------------------------
// PAYSTACK & SUBSCRIPTION TYPES
// ----------------------------------------------------

export type SubscriptionPaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned';
export type SubscriptionSchoolStatus = 'active' | 'grace_period' | 'expired' | 'pending_payment';

export interface PaystackPlatformConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret?: string;
  currency: string; // Default: 'GHS'
  isLive: boolean; // false = test mode, true = live mode
  isActive: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestMessage?: string;
  updatedAt?: string;
}

export interface SubscriptionTransaction {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode?: string;
  planId: string;
  tierName: string; // 'BASIC' | 'STANDARD' | 'PREMIUM' | string
  academicYear: string; // e.g. '2025/2026'
  term: string; // e.g. 'Term 2'
  amountGHS: number;
  amountPesewas: number; // amount in pesewas (amountGHS * 100)
  currency: string; // 'GHS'
  reference: string; // SchoolOS unique transaction reference e.g. 'SCH-SUB-17251829-ABCD'
  paystackReference?: string;
  paystackAuthorizationUrl?: string;
  status: SubscriptionPaymentStatus;
  paymentChannel?: 'mobile_money' | 'card' | 'bank' | 'qr' | 'ussd' | string;
  channelDetails?: {
    cardType?: string;
    last4?: string;
    bank?: string;
    mobileNetwork?: string; // MTN, Vodafone, AirtelTigo
    customerPhone?: string;
  };
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  receiptNumber: string; // e.g. 'REC-2026-SUB-1042'
  paidAt?: string;
  gatewayResponse?: string;
  smsReceiptSent?: boolean;
  smsReceiptLogId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaystackInitializeParams {
  schoolId: string;
  planId?: string;
  tierCode?: string;
  academicYear?: string;
  term?: string;
  email: string;
  phone?: string;
  schoolName?: string;
  callbackUrl?: string;
}

export interface PaystackInitializeResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  receiptNumber?: string;
  amountGHS: number;
  amountPesewas: number;
  tierName: string;
  message?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  status: SubscriptionPaymentStatus;
  reference: string;
  amountGHS: number;
  currency: string;
  paidAt?: string;
  paymentChannel?: string;
  receiptNumber?: string;
  tierName?: string;
  schoolId?: string;
  transaction?: SubscriptionTransaction;
  message?: string;
  error?: string;
}

export interface SubscriptionReminderResult {
  totalProcessed: number;
  remindersSent: number;
  schoolsNotified: Array<{
    schoolId: string;
    schoolName: string;
    recipientPhone: string;
    planName: string;
    amountGHS: number;
    daysRemaining: number;
    status: string;
  }>;
}

export type TransactionType = 'subscription' | 'fee_payment' | 'pos_sale' | 'general';

export interface DynamicReferenceRequest {
  type: TransactionType;
  schoolId?: string;
  prefix?: string;
}

export interface DynamicReferenceResponse {
  success: boolean;
  reference: string;
  receiptNumber: string;
  timestamp: string;
  type: TransactionType;
}

export interface PaystackFeeInitializeParams {
  schoolId: string;
  schoolName?: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  classroomId?: string;
  classroomName?: string;
  amountGHS: number;
  payerEmail: string;
  payerPhone?: string;
  payerName?: string;
  academicYear?: string;
  term?: string;
  callbackUrl?: string;
}

export interface PaystackFeeInitializeResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  receiptNumber: string;
  amountGHS: number;
  amountPesewas: number;
  message?: string;
  error?: string;
}




