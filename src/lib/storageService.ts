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
  PlatformCommunicationSettings
} from '../types';
import { 
  INITIAL_SCHOOLS, 
  INITIAL_USERS, 
  INITIAL_PLANS,
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_CLASSROOMS, 
  INITIAL_SUBJECTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_EXAMINATIONS, 
  INITIAL_RESULTS, 
  INITIAL_FEE_STRUCTURES, 
  INITIAL_FEE_PAYMENTS, 
  INITIAL_STORE_ITEMS, 
  INITIAL_POS_TRANSACTIONS, 
  INITIAL_MESSAGES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SETTINGS,
  INITIAL_PLATFORM_COMMUNICATION
} from './mockData';

const DB_KEY = 'schoolos_online_v2_db';

export interface DatabaseState {
  schools: School[];
  users: UserProfile[];
  plans: SubscriptionTier[];
  students: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  examinations: Examination[];
  results: ExaminationResult[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  storeItems: StoreItem[];
  posTransactions: POSTransaction[];
  messages: BroadcastMessage[];
  auditLogs: AuditLog[];
  settings: Record<string, SchoolSettings>;
  platformCommunication: PlatformCommunicationSettings;
}

export const loadInitialDatabase = (): DatabaseState => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && Array.isArray(parsed.schools)) {
        // Ensure Super Admin account exists
        const hasSuperAdmin = parsed.users.some((u: UserProfile) => u.email === 'su@admin' || u.role === 'superAdmin');
        if (!hasSuperAdmin) {
          parsed.users = [...INITIAL_USERS, ...parsed.users];
        }
        if (!parsed.plans || parsed.plans.length === 0) {
          parsed.plans = INITIAL_PLANS;
        }
        if (!parsed.platformCommunication) {
          parsed.platformCommunication = INITIAL_PLATFORM_COMMUNICATION;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage DB, resetting to initial state:', e);
  }

  const defaultState: DatabaseState = {
    schools: INITIAL_SCHOOLS,
    users: INITIAL_USERS,
    plans: INITIAL_PLANS,
    students: INITIAL_STUDENTS,
    teachers: INITIAL_TEACHERS,
    classrooms: INITIAL_CLASSROOMS,
    subjects: INITIAL_SUBJECTS,
    attendance: INITIAL_ATTENDANCE,
    examinations: INITIAL_EXAMINATIONS,
    results: INITIAL_RESULTS,
    feeStructures: INITIAL_FEE_STRUCTURES,
    feePayments: INITIAL_FEE_PAYMENTS,
    storeItems: INITIAL_STORE_ITEMS,
    posTransactions: INITIAL_POS_TRANSACTIONS,
    messages: INITIAL_MESSAGES,
    auditLogs: INITIAL_AUDIT_LOGS,
    settings: {},
    platformCommunication: INITIAL_PLATFORM_COMMUNICATION,
  };

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultState));
  } catch {
    // ignore
  }

  return defaultState;
};

export const saveDatabase = (state: DatabaseState) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to local storage state:', e);
  }
};

export const resetDatabaseToSeed = (): DatabaseState => {
  localStorage.removeItem(DB_KEY);
  return loadInitialDatabase();
};
