import { 
  School, 
  UserProfile, 
  Student, 
  Teacher, 
  Classroom, 
  Subject, 
  AttendanceRecord, 
  Examination, 
  ExaminationResult, 
  FeeStructure, 
  FeePayment, 
  StoreItem, 
  POSTransaction, 
  BroadcastMessage, 
  AuditLog, 
  SchoolSettings,
  SubscriptionTier,
  FeatureKey,
  UserRole,
  PlatformCommunicationSettings
} from '../types';

export const INITIAL_PLANS: SubscriptionTier[] = [
  {
    id: 'plan_basic',
    name: 'BASIC',
    code: 'basic',
    priceGHS: 350,
    billingPeriod: 'term',
    description: 'Essential academic and administrative core for Ghanaian basic and preparatory schools.',
    studentLimit: 250,
    isActive: true,
    displayOrder: 1,
    features: [
      'students',
      'teachers',
      'classrooms',
      'subjects',
      'attendance',
      'results',
      'reports',
      'fees',
      'settings',
      'teacher_portal',
      'parent_portal',
      'student_portal',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_standard',
    name: 'STANDARD',
    code: 'standard',
    priceGHS: 550,
    billingPeriod: 'term',
    description: 'Expanded academic, examination, inventory, and point-of-sale operational tools.',
    studentLimit: 600,
    isActive: true,
    displayOrder: 2,
    features: [
      'students',
      'teachers',
      'classrooms',
      'subjects',
      'attendance',
      'results',
      'examinations',
      'reports',
      'promotions',
      'fees',
      'store',
      'pos',
      'communications',
      'users_portals',
      'settings',
      'teacher_portal',
      'parent_portal',
      'student_portal',
      'accountant_portal',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_premium',
    name: 'PREMIUM',
    code: 'premium',
    priceGHS: 850,
    billingPeriod: 'term',
    description: 'Complete enterprise suite with multi-channel SMS/WhatsApp broadcasts, advanced analytics, and priority infrastructure.',
    studentLimit: 2500,
    isActive: true,
    displayOrder: 3,
    features: [
      'students',
      'teachers',
      'classrooms',
      'subjects',
      'attendance',
      'results',
      'examinations',
      'reports',
      'promotions',
      'fees',
      'store',
      'pos',
      'communications',
      'analytics',
      'users_portals',
      'settings',
      'teacher_portal',
      'parent_portal',
      'student_portal',
      'accountant_portal',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const checkFeatureAccess = (
  school: School | null, 
  feature: FeatureKey, 
  userRole?: UserRole, 
  plans: SubscriptionTier[] = INITIAL_PLANS
): boolean => {
  // Super Admins have platform-wide access
  if (userRole === 'superAdmin') return true;
  if (!school) return false;

  // 1. Check school-specific custom override first
  if (school.featureOverrides && school.featureOverrides[feature] !== undefined) {
    return Boolean(school.featureOverrides[feature]);
  }

  // 2. Lookup plan
  const planCode = (school.subscriptionPlan || 'basic').toLowerCase();
  const matchedPlan = plans.find(p => p.id === school.planId || p.code === planCode) || 
    plans.find(p => (planCode === 'enterprise' && p.code === 'premium') || (planCode === 'starter' && p.code === 'basic')) ||
    plans[0];

  if (!matchedPlan) return false;
  return matchedPlan.features.includes(feature);
};

// Initial platform Super Admin account (Mandatory credentials: su@admin / suadmin123)
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_superadmin_01',
    uid: 'auth_superadmin_01',
    email: 'su@admin',
    password: 'suadmin123',
    fullName: 'System Super Administrator',
    role: 'superAdmin',
    phone: '+233 20 000 0001',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PLATFORM_COMMUNICATION: PlatformCommunicationSettings = {
  sms: {
    provider: 'hubtel',
    apiKey: '',
    apiSecret: '',
    senderId: 'SCHOOLOS',
    apiUrl: 'https://api.hubtel.com/v1/messages/send',
    isActive: false,
  },
  whatsapp: {
    provider: 'meta',
    apiKey: '',
    apiSecret: '',
    phoneNumberId: '',
    businessAccountId: '',
    apiUrl: 'https://graph.facebook.com/v18.0',
    isActive: false,
  },
};

export const INITIAL_SETTINGS: SchoolSettings = {
  schoolId: '',
  smsProvider: 'hubtel',
  smsSenderId: 'SCHOOL',
  smsBalance: 0,
  gradingScale: [
    { grade: '1', minScore: 80, maxScore: 100, remark: 'Excellent' },
    { grade: '2', minScore: 70, maxScore: 79, remark: 'Very Good' },
    { grade: '3', minScore: 60, maxScore: 69, remark: 'Good' },
    { grade: '4', minScore: 50, maxScore: 59, remark: 'Credit' },
    { grade: '5', minScore: 40, maxScore: 49, remark: 'Pass' },
    { grade: '6', minScore: 0, maxScore: 39, remark: 'Fail' },
  ],
  receiptHeader: 'Official Fee Receipt',
  receiptFooter: 'Thank you for your payment. Keep this receipt for official clearance.',
  reopeningDate: '2026-09-08',
  vacationDate: '2026-12-18',
};

// Zero dummy records - Clean initial arrays
export const INITIAL_SCHOOLS: School[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_CLASSROOMS: Classroom[] = [];
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_EXAMINATIONS: Examination[] = [];
export const INITIAL_RESULTS: ExaminationResult[] = [];
export const INITIAL_FEE_STRUCTURES: FeeStructure[] = [];
export const INITIAL_FEE_PAYMENTS: FeePayment[] = [];
export const INITIAL_STORE_ITEMS: StoreItem[] = [];
export const INITIAL_POS_TRANSACTIONS: POSTransaction[] = [];
export const INITIAL_MESSAGES: BroadcastMessage[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
