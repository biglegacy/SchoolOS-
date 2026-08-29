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
  INITIAL_PLATFORM_COMMUNICATION
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
  SCHOOL_SETTINGS: 'schoolSettings',
  PLATFORM_SETTINGS: 'platformSettings',
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
    const schoolsSnap = await getDocs(collection(db, COLLECTIONS.SCHOOLS));
    if (schoolsSnap.empty) {
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
    console.warn('Firestore initial check/seed warning:', error);
  }
}

// Live real-time listener for the entire database state from Cloud Firestore
export function subscribeToFirestore(
  onDataChange: (data: Partial<DatabaseState>) => void
): () => void {
  if (!db) {
    return () => {};
  }

  const unsubs: Unsubscribe[] = [];

  // Schools listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SCHOOLS), (snapshot) => {
      const schools = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as School));
      onDataChange({ schools });
    }, (err) => console.error('Firestore schools sync error:', err))
  );

  // Users listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      onDataChange({ users });
    }, (err) => console.error('Firestore users sync error:', err))
  );

  // Plans listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.PLANS), (snapshot) => {
      const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionTier));
      onDataChange({ plans });
    }, (err) => console.error('Firestore plans sync error:', err))
  );

  // Students listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.STUDENTS), (snapshot) => {
      const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      onDataChange({ students });
    }, (err) => console.error('Firestore students sync error:', err))
  );

  // Teachers listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.TEACHERS), (snapshot) => {
      const teachers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
      onDataChange({ teachers });
    }, (err) => console.error('Firestore teachers sync error:', err))
  );

  // Classrooms listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.CLASSROOMS), (snapshot) => {
      const classrooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
      onDataChange({ classrooms });
    }, (err) => console.error('Firestore classrooms sync error:', err))
  );

  // Subjects listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SUBJECTS), (snapshot) => {
      const subjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      onDataChange({ subjects });
    }, (err) => console.error('Firestore subjects sync error:', err))
  );

  // Attendance listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.ATTENDANCE), (snapshot) => {
      const attendance = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      onDataChange({ attendance });
    }, (err) => console.error('Firestore attendance sync error:', err))
  );

  // Examinations listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.EXAMINATIONS), (snapshot) => {
      const examinations = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Examination));
      onDataChange({ examinations });
    }, (err) => console.error('Firestore examinations sync error:', err))
  );

  // Results listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.RESULTS), (snapshot) => {
      const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExaminationResult));
      onDataChange({ results });
    }, (err) => console.error('Firestore results sync error:', err))
  );

  // Fee Structures listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.FEE_STRUCTURES), (snapshot) => {
      const feeStructures = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeeStructure));
      onDataChange({ feeStructures });
    }, (err) => console.error('Firestore feeStructures sync error:', err))
  );

  // Fee Payments listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.FEE_PAYMENTS), (snapshot) => {
      const feePayments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
      onDataChange({ feePayments });
    }, (err) => console.error('Firestore feePayments sync error:', err))
  );

  // Store Items listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.STORE_ITEMS), (snapshot) => {
      const storeItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StoreItem));
      onDataChange({ storeItems });
    }, (err) => console.error('Firestore storeItems sync error:', err))
  );

  // POS Transactions listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.POS_TRANSACTIONS), (snapshot) => {
      const posTransactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as POSTransaction));
      onDataChange({ posTransactions });
    }, (err) => console.error('Firestore posTransactions sync error:', err))
  );

  // Messages listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.MESSAGES), (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BroadcastMessage));
      onDataChange({ messages });
    }, (err) => console.error('Firestore messages sync error:', err))
  );

  // Audit Logs listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.AUDIT_LOGS), (snapshot) => {
      const auditLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
      onDataChange({ auditLogs });
    }, (err) => console.error('Firestore auditLogs sync error:', err))
  );

  // Platform settings listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.PLATFORM_SETTINGS), (snapshot) => {
      const commDoc = snapshot.docs.find(d => d.id === 'communication');
      if (commDoc) {
        onDataChange({ platformCommunication: commDoc.data() as PlatformCommunicationSettings });
      }
    }, (err) => console.error('Firestore platformSettings sync error:', err))
  );

  // School settings listener
  unsubs.push(
    onSnapshot(collection(db, COLLECTIONS.SCHOOL_SETTINGS), (snapshot) => {
      const settingsMap: Record<string, SchoolSettings> = {};
      snapshot.docs.forEach(d => {
        settingsMap[d.id] = d.data() as SchoolSettings;
      });
      onDataChange({ settings: settingsMap });
    }, (err) => console.error('Firestore schoolSettings sync error:', err))
  );

  return () => {
    unsubs.forEach(unsub => unsub());
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
