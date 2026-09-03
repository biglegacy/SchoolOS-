import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
  PlatformCommunicationSettings,
  CommunicationLog,
  SmsMessage,
  SubscriptionTransaction,
  PaystackPlatformConfig,
  PaystackInitializeParams,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  SubscriptionReminderResult,
  DynamicReferenceResponse,
  PaystackFeeInitializeParams,
  PaystackFeeInitializeResponse,
  TransactionType
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
  INITIAL_PLATFORM_COMMUNICATION,
  INITIAL_PAYSTACK_CONFIG,
  INITIAL_SUBSCRIPTION_TRANSACTIONS
} from './mockData';
import { DatabaseState } from './storageService';

// Firestore Collection References
export const COLLECTIONS = {
  SCHOOLS: 'schools',
  USERS: 'users',
  PLANS: 'plans',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSROOMS: 'classrooms',
  SUBJECTS: 'subjects',
  ATTENDANCE: 'attendance',
  EXAMINATIONS: 'examinations',
  RESULTS: 'results',
  FEE_STRUCTURES: 'feeStructures',
  FEE_PAYMENTS: 'feePayments',
  STORE_ITEMS: 'storeItems',
  POS_TRANSACTIONS: 'posTransactions',
  MESSAGES: 'messages',
  AUDIT_LOGS: 'auditLogs',
  COMMUNICATION_LOGS: 'communicationLogs',
  SMS_MESSAGES: 'smsMessages',
  SCHOOL_SETTINGS: 'schoolSettings',
  PLATFORM_SETTINGS: 'platformSettings',
  SUBSCRIPTION_TRANSACTIONS: 'subscriptionTransactions',
};

/**
 * Recursively cleans objects/arrays before writing to Firestore, stripping out any `undefined` values.
 * Firestore throws an "Unsupported field value: undefined" exception if any key contains `undefined`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Seed Firestore with initial data if collections are empty
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (!db) return;
  try {
    const fetchSchoolsPromise = getDocs(collection(db, COLLECTIONS.SCHOOLS));
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore seed check timed out')), 4000)
    );

    const schoolsSnap = await Promise.race([fetchSchoolsPromise, timeoutPromise]);
    if (schoolsSnap && (schoolsSnap as any).empty) {
      console.log('🌱 Seeding initial SchoolOS platform data to Firestore...');
      const batch = writeBatch(db);

      // Seed Schools
      for (const s of INITIAL_SCHOOLS) {
        batch.set(doc(db, COLLECTIONS.SCHOOLS, s.id), sanitizeForFirestore(s));
      }

      // Seed Users
      for (const u of INITIAL_USERS) {
        batch.set(doc(db, COLLECTIONS.USERS, u.id), sanitizeForFirestore(u));
      }

      // Seed Subscription Plans
      for (const p of INITIAL_PLANS) {
        batch.set(doc(db, COLLECTIONS.PLANS, p.id), sanitizeForFirestore(p));
      }

      // Seed Students
      for (const st of INITIAL_STUDENTS) {
        batch.set(doc(db, COLLECTIONS.STUDENTS, st.id), sanitizeForFirestore(st));
      }

      // Seed Teachers
      for (const t of INITIAL_TEACHERS) {
        batch.set(doc(db, COLLECTIONS.TEACHERS, t.id), sanitizeForFirestore(t));
      }

      // Seed Classrooms
      for (const c of INITIAL_CLASSROOMS) {
        batch.set(doc(db, COLLECTIONS.CLASSROOMS, c.id), sanitizeForFirestore(c));
      }

      // Seed Subjects
      for (const sub of INITIAL_SUBJECTS) {
        batch.set(doc(db, COLLECTIONS.SUBJECTS, sub.id), sanitizeForFirestore(sub));
      }

      // Seed Examinations & Results
      for (const exam of INITIAL_EXAMINATIONS) {
        batch.set(doc(db, COLLECTIONS.EXAMINATIONS, exam.id), sanitizeForFirestore(exam));
      }
      for (const res of INITIAL_RESULTS) {
        batch.set(doc(db, COLLECTIONS.RESULTS, res.id), sanitizeForFirestore(res));
      }

      // Seed Fee Structures & Payments
      for (const fee of INITIAL_FEE_STRUCTURES) {
        batch.set(doc(db, COLLECTIONS.FEE_STRUCTURES, fee.id), sanitizeForFirestore(fee));
      }
      for (const pay of INITIAL_FEE_PAYMENTS) {
        batch.set(doc(db, COLLECTIONS.FEE_PAYMENTS, pay.id), sanitizeForFirestore(pay));
      }

      // Seed Store & POS
      for (const item of INITIAL_STORE_ITEMS) {
        batch.set(doc(db, COLLECTIONS.STORE_ITEMS, item.id), sanitizeForFirestore(item));
      }
      for (const tx of INITIAL_POS_TRANSACTIONS) {
        batch.set(doc(db, COLLECTIONS.POS_TRANSACTIONS, tx.id), sanitizeForFirestore(tx));
      }

      // Seed Platform Communication
      batch.set(
        doc(db, COLLECTIONS.PLATFORM_SETTINGS, 'communication'), 
        sanitizeForFirestore(INITIAL_PLATFORM_COMMUNICATION)
      );

      // Seed Audit Logs
      for (const log of INITIAL_AUDIT_LOGS) {
        batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), sanitizeForFirestore(log));
      }

      await batch.commit();
      console.log('✅ Firestore seeding completed successfully.');
    }
  } catch (error) {
    console.info('Firestore initial seed/connection notice:', (error as any)?.message || error);
  }
}

// Live real-time multicast listener for the entire database state from Cloud Firestore
const activeSubscribers = new Set<(data: Partial<DatabaseState>) => void>();
let globalUnsubs: Unsubscribe[] = [];
let cachedIncomingState: Partial<DatabaseState> = {};

function notifyAllSubscribers(incoming: Partial<DatabaseState>) {
  cachedIncomingState = { ...cachedIncomingState, ...incoming };
  activeSubscribers.forEach(cb => {
    try {
      cb(incoming);
    } catch (e) {
      console.warn('Error in Firestore subscriber callback:', e);
    }
  });
}

function startGlobalFirestoreListeners() {
  if (!db || globalUnsubs.length > 0) return;

  const handleSyncError = (colName: string, err: any) => {
    if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('Could not reach Cloud Firestore')) {
      // Graceful offline caching notification
      console.info(`Firestore ${colName} listener is operating with offline persistent cache.`);
    } else {
      console.warn(`Firestore ${colName} sync notice:`, err?.message || err);
    }
  };

  const unsubs: Unsubscribe[] = [];

  // Schools listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SCHOOLS), (snapshot) => {
      const schools = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as School));
      notifyAllSubscribers({ schools });
    }, (err) => handleSyncError('schools', err))
  );

  // Users listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      notifyAllSubscribers({ users });
    }, (err) => handleSyncError('users', err))
  );

  // Plans listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.PLANS), (snapshot) => {
      const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionTier));
      notifyAllSubscribers({ plans });
    }, (err) => handleSyncError('plans', err))
  );

  // Students listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.STUDENTS), (snapshot) => {
      const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      notifyAllSubscribers({ students });
    }, (err) => handleSyncError('students', err))
  );

  // Teachers listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.TEACHERS), (snapshot) => {
      const teachers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
      notifyAllSubscribers({ teachers });
    }, (err) => handleSyncError('teachers', err))
  );

  // Classrooms listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.CLASSROOMS), (snapshot) => {
      const classrooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
      notifyAllSubscribers({ classrooms });
    }, (err) => handleSyncError('classrooms', err))
  );

  // Subjects listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SUBJECTS), (snapshot) => {
      const subjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      notifyAllSubscribers({ subjects });
    }, (err) => handleSyncError('subjects', err))
  );

  // Attendance listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.ATTENDANCE), (snapshot) => {
      const attendance = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      notifyAllSubscribers({ attendance });
    }, (err) => handleSyncError('attendance', err))
  );

  // Examinations listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.EXAMINATIONS), (snapshot) => {
      const examinations = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Examination));
      notifyAllSubscribers({ examinations });
    }, (err) => handleSyncError('examinations', err))
  );

  // Results listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.RESULTS), (snapshot) => {
      const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExaminationResult));
      notifyAllSubscribers({ results });
    }, (err) => handleSyncError('results', err))
  );

  // Fee Structures listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.FEE_STRUCTURES), (snapshot) => {
      const feeStructures = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeeStructure));
      notifyAllSubscribers({ feeStructures });
    }, (err) => handleSyncError('feeStructures', err))
  );

  // Fee Payments listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.FEE_PAYMENTS), (snapshot) => {
      const feePayments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
      notifyAllSubscribers({ feePayments });
    }, (err) => handleSyncError('feePayments', err))
  );

  // Store Items listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.STORE_ITEMS), (snapshot) => {
      const storeItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StoreItem));
      notifyAllSubscribers({ storeItems });
    }, (err) => handleSyncError('storeItems', err))
  );

  // POS Transactions listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.POS_TRANSACTIONS), (snapshot) => {
      const posTransactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as POSTransaction));
      notifyAllSubscribers({ posTransactions });
    }, (err) => handleSyncError('posTransactions', err))
  );

  // Messages listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.MESSAGES), (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BroadcastMessage));
      notifyAllSubscribers({ messages });
    }, (err) => handleSyncError('messages', err))
  );

  // Audit Logs listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.AUDIT_LOGS), (snapshot) => {
      const auditLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
      notifyAllSubscribers({ auditLogs });
    }, (err) => handleSyncError('auditLogs', err))
  );

  // Communication Logs listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.COMMUNICATION_LOGS), (snapshot) => {
      const communicationLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommunicationLog));
      notifyAllSubscribers({ communicationLogs });
    }, (err) => handleSyncError('communicationLogs', err))
  );

  // Platform settings listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.PLATFORM_SETTINGS), (snapshot) => {
      const commDoc = snapshot.docs.find(d => d.id === 'communication');
      const paystackDoc = snapshot.docs.find(d => d.id === 'paystack');
      const updates: Partial<DatabaseState> = {};
      if (commDoc) {
        updates.platformCommunication = commDoc.data() as PlatformCommunicationSettings;
      }
      if (paystackDoc) {
        updates.platformPaystack = paystackDoc.data() as PaystackPlatformConfig;
      }
      if (Object.keys(updates).length > 0) {
        notifyAllSubscribers(updates);
      }
    }, (err) => handleSyncError('platformSettings', err))
  );

  // Subscription Transactions listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SUBSCRIPTION_TRANSACTIONS), (snapshot) => {
      const subscriptionTransactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionTransaction));
      notifyAllSubscribers({ subscriptionTransactions });
    }, (err) => handleSyncError('subscriptionTransactions', err))
  );

  // School settings listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SCHOOL_SETTINGS), (snapshot) => {
      const settingsMap: Record<string, SchoolSettings> = {};
      snapshot.docs.forEach(d => {
        settingsMap[d.id] = d.data() as SchoolSettings;
      });
      notifyAllSubscribers({ settings: settingsMap });
    }, (err) => handleSyncError('schoolSettings', err))
  );

  globalUnsubs = unsubs;
}

export function subscribeToFirestore(
  onDataChange: (data: Partial<DatabaseState>) => void
): () => void {
  if (!db) {
    return () => {};
  }

  activeSubscribers.add(onDataChange);

  // If there is cached state already received, provide it immediately
  if (Object.keys(cachedIncomingState).length > 0) {
    onDataChange(cachedIncomingState);
  }

  // Start listeners if this is the first subscriber
  if (globalUnsubs.length === 0) {
    startGlobalFirestoreListeners();
  }

  return () => {
    activeSubscribers.delete(onDataChange);
    if (activeSubscribers.size === 0) {
      globalUnsubs.forEach(unsub => unsub());
      globalUnsubs = [];
    }
  };
}

// ----------------------------------------------------
// DIRECT FIRESTORE CRUD OPERATIONS
// ----------------------------------------------------

export async function fsRegisterSchool(
  school: School, 
  owner: UserProfile, 
  auditLog: AuditLog
): Promise<void> {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.SCHOOLS, school.id), sanitizeForFirestore(school));
    batch.set(doc(db, COLLECTIONS.USERS, owner.id), sanitizeForFirestore(owner));
    batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, auditLog.id), sanitizeForFirestore(auditLog));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.SCHOOLS}/${school.id}`);
  }
}

export async function fsUpdateSchool(schoolId: string, data: Partial<School>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.SCHOOLS}/${schoolId}`);
  }
}

export async function fsCreateUser(user: UserProfile): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.USERS}/${user.id}`);
  }
}

export async function fsUpdateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), sanitizeForFirestore(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.USERS}/${userId}`);
  }
}

export async function fsDeleteUser(userId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `/${COLLECTIONS.USERS}/${userId}`);
  }
}

export async function fsAddStudent(student: Student): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(student));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.STUDENTS}/${student.id}`);
  }
}

export async function fsUpdateStudent(studentId: string, data: Partial<Student>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.STUDENTS, studentId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.STUDENTS}/${studentId}`);
  }
}

export async function fsDeleteStudent(studentId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `/${COLLECTIONS.STUDENTS}/${studentId}`);
  }
}

export async function fsAddTeacher(teacher: Teacher): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.TEACHERS, teacher.id), sanitizeForFirestore(teacher));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.TEACHERS}/${teacher.id}`);
  }
}

export async function fsUpdateTeacher(teacherId: string, data: Partial<Teacher>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.TEACHERS, teacherId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.TEACHERS}/${teacherId}`);
  }
}

export async function fsDeleteTeacher(teacherId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEACHERS, teacherId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `/${COLLECTIONS.TEACHERS}/${teacherId}`);
  }
}

export async function fsAddClassroom(classroom: Classroom): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.CLASSROOMS, classroom.id), sanitizeForFirestore(classroom));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.CLASSROOMS}/${classroom.id}`);
  }
}

export async function fsUpdateClassroom(classroomId: string, data: Partial<Classroom>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.CLASSROOMS, classroomId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.CLASSROOMS}/${classroomId}`);
  }
}

export async function fsAddSubject(subject: Subject): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.SUBJECTS, subject.id), sanitizeForFirestore(subject));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.SUBJECTS}/${subject.id}`);
  }
}

export async function fsMarkAttendanceBulk(records: AttendanceRecord[]): Promise<void> {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    for (const rec of records) {
      batch.set(doc(db, COLLECTIONS.ATTENDANCE, rec.id), sanitizeForFirestore(rec));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `/${COLLECTIONS.ATTENDANCE}`);
  }
}

export async function fsAddExamination(exam: Examination): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.EXAMINATIONS, exam.id), sanitizeForFirestore(exam));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.EXAMINATIONS}/${exam.id}`);
  }
}

export async function fsSaveResults(results: ExaminationResult[]): Promise<void> {
  if (!db) return;
  try {
    const batch = writeBatch(db);
    for (const res of results) {
      batch.set(doc(db, COLLECTIONS.RESULTS, res.id), sanitizeForFirestore(res));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `/${COLLECTIONS.RESULTS}`);
  }
}

export async function fsAddFeeStructure(fee: FeeStructure): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.FEE_STRUCTURES, fee.id), sanitizeForFirestore(fee));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.FEE_STRUCTURES}/${fee.id}`);
  }
}

export async function fsRecordFeePayment(payment: FeePayment): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.FEE_PAYMENTS, payment.id), sanitizeForFirestore(payment));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.FEE_PAYMENTS}/${payment.id}`);
  }
}

export async function fsAddStoreItem(item: StoreItem): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.STORE_ITEMS, item.id), sanitizeForFirestore(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.STORE_ITEMS}/${item.id}`);
  }
}

export async function fsUpdateStoreItem(itemId: string, data: Partial<StoreItem>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.STORE_ITEMS, itemId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.STORE_ITEMS}/${itemId}`);
  }
}

export async function fsRecordPOSTransaction(tx: POSTransaction): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.POS_TRANSACTIONS, tx.id), sanitizeForFirestore(tx));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.POS_TRANSACTIONS}/${tx.id}`);
  }
}

export async function fsSendBroadcastMessage(msg: BroadcastMessage): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.MESSAGES, msg.id), sanitizeForFirestore(msg));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.MESSAGES}/${msg.id}`);
  }
}

export async function fsAddAuditLog(log: AuditLog): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.AUDIT_LOGS}/${log.id}`);
  }
}

export async function fsCreatePlan(plan: SubscriptionTier): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.PLANS, plan.id), sanitizeForFirestore(plan));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.PLANS}/${plan.id}`);
  }
}

export async function fsUpdatePlan(planId: string, data: Partial<SubscriptionTier>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.PLANS, planId), sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.PLANS}/${planId}`);
  }
}

export async function fsDeletePlan(planId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PLANS, planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `/${COLLECTIONS.PLANS}/${planId}`);
  }
}

export async function fsUpdatePlatformCommunication(settings: Partial<PlatformCommunicationSettings>): Promise<void> {
  if (!db) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.PLATFORM_SETTINGS, 'communication'), 
      sanitizeForFirestore(settings), 
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.PLATFORM_SETTINGS}/communication`);
  }
}

export async function fsUpdateSchoolSettings(schoolId: string, settings: Partial<SchoolSettings>): Promise<void> {
  if (!db) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.SCHOOL_SETTINGS, schoolId), 
      sanitizeForFirestore(settings), 
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.SCHOOL_SETTINGS}/${schoolId}`);
  }
}

export async function fsAddCommunicationLog(log: CommunicationLog): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.COMMUNICATION_LOGS, log.id), sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.COMMUNICATION_LOGS}/${log.id}`);
  }
}

export async function fsDeleteCommunicationLog(logId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.COMMUNICATION_LOGS, logId));
    await deleteDoc(doc(db, COLLECTIONS.SMS_MESSAGES, logId)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `/${COLLECTIONS.COMMUNICATION_LOGS}/${logId}`);
  }
}

export async function fsAddSmsMessage(sms: SmsMessage): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, COLLECTIONS.SMS_MESSAGES, sms.id), sanitizeForFirestore(sms));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.SMS_MESSAGES}/${sms.id}`);
  }
}

// ----------------------------------------------------
// SUBSCRIPTION TRANSACTIONS & PAYSTACK PERSISTENCE
// ----------------------------------------------------

export async function fsRecordSubscriptionTransaction(tx: SubscriptionTransaction): Promise<void> {
  if (!db) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.SUBSCRIPTION_TRANSACTIONS, tx.id), 
      sanitizeForFirestore(tx),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `/${COLLECTIONS.SUBSCRIPTION_TRANSACTIONS}/${tx.id}`);
  }
}

export async function fsUpdateSubscriptionTransaction(txId: string, updates: Partial<SubscriptionTransaction>): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(
      doc(db, COLLECTIONS.SUBSCRIPTION_TRANSACTIONS, txId), 
      sanitizeForFirestore(updates) as Record<string, any>
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.SUBSCRIPTION_TRANSACTIONS}/${txId}`);
  }
}

export async function fsSavePaystackConfig(config: Partial<PaystackPlatformConfig>): Promise<void> {
  if (!db) return;
  try {
    await setDoc(
      doc(db, COLLECTIONS.PLATFORM_SETTINGS, 'paystack'), 
      sanitizeForFirestore({
        ...config,
        updatedAt: new Date().toISOString()
      }), 
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.PLATFORM_SETTINGS}/paystack`);
  }
}

export async function fsRenewSchoolSubscription(
  schoolId: string, 
  planId: string, 
  term: string, 
  academicYear: string, 
  amountGHS: number,
  txReference: string
): Promise<void> {
  if (!db) return;
  try {
    // 1 term = approx 4 months (~120 days)
    const nextExpiry = new Date();
    nextExpiry.setDate(nextExpiry.getDate() + 120);

    const schoolUpdates: Partial<School> = {
      planId: planId,
      subscriptionPlan: planId.replace('plan_', ''),
      status: 'active',
      subscriptionExpiry: nextExpiry.toISOString().split('T')[0],
      currentTerm: (term as any) || 'Term 2',
      currentAcademicYear: academicYear || '2025/2026',
      updatedAt: new Date().toISOString()
    };

    await updateDoc(
      doc(db, COLLECTIONS.SCHOOLS, schoolId), 
      sanitizeForFirestore(schoolUpdates) as Record<string, any>
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `/${COLLECTIONS.SCHOOLS}/${schoolId}`);
  }
}

// ----------------------------------------------------
// FULL-STACK PAYSTACK API CLIENT METHODS
// ----------------------------------------------------

export async function apiInitializePaystackTransaction(params: PaystackInitializeParams): Promise<PaystackInitializeResponse> {
  const response = await fetch('/api/paystack/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to initialize Paystack payment');
  }
  return data;
}

export async function apiVerifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Verification failed');
  }
  return data.verification;
}

export async function apiSavePaystackConfig(config: Partial<PaystackPlatformConfig>): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/paystack/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to save Paystack settings');
  }
  return data;
}

export async function apiTestPaystackConnection(secretKey?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/paystack/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secretKey })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Paystack test failed');
  }
  return data;
}

export async function apiTriggerSubscriptionReminders(schools: School[], academicYear?: string, term?: string): Promise<SubscriptionReminderResult> {
  const response = await fetch('/api/subscriptions/run-reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schools, academicYear, term })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to dispatch subscription reminders');
  }
  return data;
}

// ----------------------------------------------------
// DYNAMIC TRANSACTION REFERENCE CLIENT SERVICES
// ----------------------------------------------------

export async function apiGenerateDynamicReference(
  type: TransactionType = 'general',
  schoolId?: string,
  prefix?: string
): Promise<DynamicReferenceResponse> {
  try {
    const response = await fetch('/api/transactions/generate-reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, schoolId, prefix })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return data;
    }
    throw new Error(data.error || 'Backend reference generation returned unsuccessful');
  } catch (err: any) {
    console.warn('Backend reference generator unreachable, utilizing client cryptosecure generator fallback:', err?.message);
    return generateClientFallbackReference(type, schoolId, prefix);
  }
}

export function generateClientFallbackReference(
  type: TransactionType = 'general',
  schoolId?: string,
  customPrefix?: string
): DynamicReferenceResponse {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hours}${mins}${secs}`;

  let typePrefix = 'TXN';
  let receiptPrefix = 'REC';

  switch (type) {
    case 'subscription':
      typePrefix = 'SCH-SUB';
      receiptPrefix = 'REC-SUB';
      break;
    case 'fee_payment':
      typePrefix = 'SCH-FEE';
      receiptPrefix = 'REC-FEE';
      break;
    case 'pos_sale':
      typePrefix = 'POS-SALE';
      receiptPrefix = 'REC-POS';
      break;
    default:
      typePrefix = customPrefix || 'TXN';
      receiptPrefix = 'REC';
      break;
  }

  // Generate 6 hex entropy characters using window.crypto
  let entropyHex = '';
  let entropyReceipt = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(3);
    window.crypto.getRandomValues(bytes);
    entropyHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const recBytes = new Uint8Array(2);
    window.crypto.getRandomValues(recBytes);
    entropyReceipt = Array.from(recBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } else {
    entropyHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    entropyReceipt = Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  const reference = `${typePrefix}-${dateStr}-${timeStr}-${entropyHex}`;
  const receiptNumber = `${receiptPrefix}-${dateStr}-${entropyReceipt}`;

  return {
    success: true,
    reference,
    receiptNumber,
    timestamp: now.toISOString(),
    type
  };
}

export async function apiInitializePaystackFeeTransaction(
  params: PaystackFeeInitializeParams
): Promise<PaystackFeeInitializeResponse> {
  const response = await fetch('/api/paystack/initialize-fee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to initialize online fee payment');
  }
  return data;
}



