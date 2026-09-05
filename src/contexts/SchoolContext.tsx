import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  School, 
  Student, 
  Teacher, 
  Classroom, 
  Subject, 
  AttendanceRecord, 
  AttendanceStatus, 
  Examination, 
  ExaminationResult, 
  TerminalReport, 
  FeeStructure, 
  FeePayment, 
  StudentFeeSummary, 
  StoreItem, 
  POSTransaction, 
  BroadcastMessage, 
  AuditLog, 
  SchoolSettings, 
  SubscriptionPlan,
  SubscriptionTier,
  FeatureKey,
  UserProfile,
  SMSBroadcastRecipient,
  PlatformCommunicationSettings,
  CommunicationLog,
  SendCommunicationParams,
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
import { loadInitialDatabase, saveDatabase, DatabaseState, resetDatabaseToSeed } from '../lib/storageService';
import { checkFeatureAccess, INITIAL_PLANS, INITIAL_PLATFORM_COMMUNICATION, INITIAL_PAYSTACK_CONFIG, INITIAL_SUBSCRIPTION_TRANSACTIONS } from '../lib/mockData';
import { useAuth } from './AuthContext';
import { calculateGhanaGrade, calculatePositions, generateTeacherRemark, generateHeadTeacherRemark, calculateStudentFeeBalance } from '../utils/calculations';
import {
  sendCentralCommunication,
  triggerFeePaymentNotification,
  triggerAttendanceAbsenceAlert,
  triggerExamResultAlert
} from '../lib/communicationService';
import {
  subscribeToFirestore,
  fsUpdateSchool,
  fsCreateUser,
  fsUpdateUser,
  fsDeleteUser,
  fsAddStudent,
  fsUpdateStudent,
  fsDeleteStudent,
  fsAddTeacher,
  fsUpdateTeacher,
  fsDeleteTeacher,
  fsAddClassroom,
  fsUpdateClassroom,
  fsAddSubject,
  fsMarkAttendanceBulk,
  fsAddExamination,
  fsSaveResults,
  fsAddFeeStructure,
  fsRecordFeePayment,
  fsAddStoreItem,
  fsUpdateStoreItem,
  fsRecordPOSTransaction,
  fsSendBroadcastMessage,
  fsAddAuditLog,
  fsAddCommunicationLog,
  fsDeleteCommunicationLog,
  fsCreatePlan,
  fsUpdatePlan,
  fsDeletePlan,
  fsUpdatePlatformCommunication,
  fsUpdateSchoolSettings,
  fsRecordSubscriptionTransaction,
  fsUpdateSubscriptionTransaction,
  fsSavePaystackConfig,
  fsRenewSchoolSubscription,
  apiInitializePaystackTransaction,
  apiVerifyPaystackTransaction,
  apiSavePaystackConfig,
  apiTestPaystackConnection,
  apiTriggerSubscriptionReminders,
  apiGenerateDynamicReference,
  apiInitializePaystackFeeTransaction
} from '../lib/firestoreService';

interface SchoolContextType {
  // Current active school
  school: School | null;
  allSchools: School[];
  plans: SubscriptionTier[];
  
  // Entities filtered by active school
  students: Student[];
  allSchoolStudents: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  examinations: Examination[];
  results: ExaminationResult[];
  examResults: ExaminationResult[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  storeItems: StoreItem[];
  posTransactions: POSTransaction[];
  posSales: POSTransaction[];
  messages: BroadcastMessage[];
  auditLogs: AuditLog[];
  communicationLogs: CommunicationLog[];
  allCommunicationLogs: CommunicationLog[];
  subscriptionTransactions: SubscriptionTransaction[];
  allSubscriptionTransactions: SubscriptionTransaction[];
  settings: SchoolSettings;
  schoolUsers: UserProfile[];
  allUsers: UserProfile[];

  // Feature Access Check
  hasAccess: (feature: FeatureKey) => boolean;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  linkStudentToParent: (studentId: string, parentId: string) => Promise<void>;
  unlinkStudentFromParent: (studentId: string, parentId: string) => Promise<void>;
  repairParentStudentLinks: () => Promise<{ repairedParents: number; repairedStudents: number; details: string[] }>;

  // Teacher Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>) => Promise<Teacher>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  // Classroom Actions
  addClassroom: (classroom: Omit<Classroom, 'id' | 'schoolId' | 'studentCount' | 'createdAt' | 'updatedAt'>) => Promise<Classroom>;
  updateClassroom: (id: string, data: Partial<Classroom>) => Promise<void>;

  // Subject Actions
  addSubject: (subject: Omit<Subject, 'id' | 'schoolId' | 'createdAt'>) => Promise<Subject>;

  // Attendance Actions
  markAttendance: (records: Array<{ studentId: string; studentName: string; admissionNumber: string; status: AttendanceStatus; remarks?: string }>, classroomId: string, date: string) => Promise<void>;
  markAttendanceBulk: (records: Array<{ studentId: string; studentName: string; classroomId: string; date: string; academicYear?: string; term?: string; status: AttendanceStatus; remarks?: string }>, notifyAbsentGuardians?: boolean) => Promise<void>;
  getAttendanceForDate: (classroomId: string, date: string) => AttendanceRecord[];

  // Examination & Results Actions
  addExamination: (exam: Omit<Examination, 'id' | 'schoolId' | 'createdAt'>) => Promise<Examination>;
  saveResults: (results: Array<Omit<ExaminationResult, 'id' | 'schoolId' | 'createdAt' | 'updatedAt' | 'grade' | 'gradeRemark'>>) => Promise<void>;
  recordExamResult: (result: any) => Promise<void>;
  generateTerminalReport: (studentId: string, term: 'Term 1' | 'Term 2' | 'Term 3', academicYear: string) => TerminalReport | null;

  // Promotion Workflow
  promoteStudents: (promotions: Array<{ studentId: string; nextClassroomId?: string; action: 'promote' | 'repeat' | 'graduate' }>) => Promise<void>;
  executePromotion: (options: { currentClassroomId: string; nextClassroomId: string; academicYear: string; promotedStudentIds: string[]; repeatedStudentIds: string[] }) => Promise<void>;

  // Fee Management Actions
  addFeeStructure: (structure: Omit<FeeStructure, 'id' | 'schoolId' | 'createdAt'>) => Promise<FeeStructure>;
  recordFeePayment: (payment: Omit<FeePayment, 'id' | 'schoolId' | 'createdAt'>, sendReceiptSMS?: boolean) => Promise<FeePayment>;
  getStudentFeeSummaries: () => StudentFeeSummary[];

  // Store & POS Actions
  addStoreItem: (item: Omit<StoreItem, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>) => Promise<StoreItem>;
  updateStoreItem: (id: string, data: Partial<StoreItem>) => Promise<void>;
  updateStoreStock: (itemId: string, newStock: number, type?: string, reason?: string) => Promise<void>;
  processPOSTransaction: (tx: Omit<POSTransaction, 'id' | 'schoolId' | 'receiptNumber' | 'createdAt'>) => Promise<POSTransaction>;
  processPOSSale: (saleData: any) => Promise<POSTransaction>;

  // Broadcast & Communications Actions
  sendBroadcastMessage: (msg: Omit<BroadcastMessage, 'id' | 'schoolId' | 'costGHS' | 'status' | 'sentAt'>) => Promise<BroadcastMessage>;
  sendSMSBroadcast: (recipientGroup: any, message: string, recipientCount?: number) => Promise<BroadcastMessage>;
  sendDirectCommunication: (params: Omit<SendCommunicationParams, 'schoolId' | 'schoolName'>) => Promise<CommunicationLog>;

  // Super Admin Platform Actions
  approveSchool: (schoolId: string) => Promise<void>;
  rejectSchool: (schoolId: string) => Promise<void>;
  suspendSchool: (schoolId: string) => Promise<void>;
  updateAnySchool: (schoolId: string, data: Partial<School>) => Promise<void>;
  updateSchoolSubscription: (schoolId: string, plan: SubscriptionPlan, expiryDate: string) => Promise<void>;
  createPlan: (plan: Omit<SubscriptionTier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SubscriptionTier>;
  updatePlan: (id: string, data: Partial<SubscriptionTier>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  setSchoolFeatureOverride: (schoolId: string, feature: FeatureKey, enabled: boolean | null) => Promise<void>;
  assignSchoolPlan: (schoolId: string, planId: string, planCode: string, expiryDate?: string) => Promise<void>;

  // Paystack & Subscription Payments
  platformPaystack: PaystackPlatformConfig;
  updatePlatformPaystack: (settings: Partial<PaystackPlatformConfig>) => Promise<void>;
  testPaystackGateway: (secretKey?: string) => Promise<{ success: boolean; message: string }>;
  initializeSchoolSubscription: (params: { planId?: string; tierCode?: string; academicYear?: string; term?: string; email: string; phone?: string; callbackUrl?: string }) => Promise<PaystackInitializeResponse>;
  verifySchoolSubscription: (reference: string) => Promise<PaystackVerifyResponse>;
  recordSubscriptionPayment: (tx: SubscriptionTransaction) => Promise<void>;
  triggerTermRenewalReminders: (academicYear?: string, term?: string) => Promise<SubscriptionReminderResult>;
  generateTransactionReference: (type?: TransactionType, schoolId?: string, prefix?: string) => Promise<DynamicReferenceResponse>;
  initializeStudentFeePayment: (params: PaystackFeeInitializeParams) => Promise<PaystackFeeInitializeResponse>;

  // User Accounts Management
  createUserAccount: (userData: Omit<UserProfile, 'id' | 'uid' | 'createdAt'>, initialPassword?: string) => Promise<UserProfile>;
  updateUserAccount: (id: string, data: Partial<UserProfile>) => Promise<void>;
  deleteUserAccount: (id: string) => Promise<void>;

  // Settings Actions
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  updateSchoolInfo: (data: Partial<School>) => Promise<void>;

  // Super Admin Centralized Communication
  platformCommunication: PlatformCommunicationSettings;
  updatePlatformCommunication: (settings: Partial<PlatformCommunicationSettings>) => Promise<void>;

  // Utilities
  resetDemoData: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentSchool, currentUser, syncStateFromStorage } = useAuth();
  const [dbState, setDbState] = useState<DatabaseState>(() => loadInitialDatabase());

  // Subscribe to Firestore for real-time live synchronization
  useEffect(() => {
    const unsubscribe = subscribeToFirestore((incoming) => {
      setDbState(prev => {
        const next = { ...prev, ...incoming };
        saveDatabase(next);
        return next;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateStateAndPersist = (updater: (prev: DatabaseState) => DatabaseState) => {
    setDbState(prev => {
      const next = updater(prev);
      saveDatabase(next);
      setTimeout(() => syncStateFromStorage(), 0);
      return next;
    });
  };

  const activeSchoolId = currentSchool?.id || '';

  const logAction = (action: string, details: string, targetSchoolId?: string): AuditLog => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schoolId: targetSchoolId || activeSchoolId,
      schoolName: currentSchool?.name || 'SchoolOS Platform',
      userId: currentUser?.id || 'system',
      userEmail: currentUser?.email || 'admin@schoolos.online',
      userRole: currentUser?.role || 'superAdmin',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    // Sync audit log to Firestore
    fsAddAuditLog(newLog).catch(err => console.warn('Audit log firestore sync warning:', err));
    return newLog;
  };

  // Determine if the active logged-in user is a Parent
  const isParent = currentUser?.role === 'parent';

  // Explicit parent linked student IDs (from user profile linkedStudentIds AND student parentIds array matching this parent)
  const parentLinkedStudentIds = useMemo(() => {
    if (!isParent || !currentUser) return new Set<string>();
    const ids = new Set<string>();
    (currentUser.linkedStudentIds || []).forEach(id => {
      if (id) ids.add(id);
    });
    // Check students for this school where parentId or parentIds array includes current user ID
    dbState.students.forEach(s => {
      if (s.schoolId === activeSchoolId) {
        if (s.parentId === currentUser.id || (s.parentIds && s.parentIds.includes(currentUser.id))) {
          ids.add(s.id);
        }
      }
    });
    return ids;
  }, [isParent, currentUser, dbState.students, activeSchoolId]);

  // All students belonging to the active school (for administrative / staff queries)
  const allSchoolStudents = useMemo(() => {
    return dbState.students.filter(s => s.schoolId === activeSchoolId);
  }, [dbState.students, activeSchoolId]);

  // Filtered entity sets for the active school & role
  const school = dbState.schools.find(s => s.id === activeSchoolId) || dbState.schools[0] || null;

  // The role-scoped students list:
  // IF Parent: ONLY return students explicitly linked to this parent in this school. If none are linked, return [] (never return all school students!)
  // IF Admin / Staff / SuperAdmin: return all school students.
  const students = useMemo(() => {
    if (isParent) {
      return dbState.students.filter(s => s.schoolId === activeSchoolId && parentLinkedStudentIds.has(s.id));
    }
    return allSchoolStudents;
  }, [isParent, dbState.students, activeSchoolId, parentLinkedStudentIds, allSchoolStudents]);

  const teachers = dbState.teachers.filter(t => t.schoolId === activeSchoolId);
  const classrooms = dbState.classrooms.filter(c => c.schoolId === activeSchoolId);
  const subjects = dbState.subjects.filter(sub => activeSchoolId ? sub.schoolId === activeSchoolId : false);

  // Attendance: Parent only sees attendance records for their linked wards
  const attendance = useMemo(() => {
    const schoolAttendance = dbState.attendance.filter(a => a.schoolId === activeSchoolId);
    if (isParent) {
      return schoolAttendance.filter(a => parentLinkedStudentIds.has(a.studentId));
    }
    return schoolAttendance;
  }, [isParent, dbState.attendance, activeSchoolId, parentLinkedStudentIds]);

  const examinations = dbState.examinations.filter(e => e.schoolId === activeSchoolId);

  // Results: Parent only sees results for their linked wards
  const results = useMemo(() => {
    const schoolResults = dbState.results.filter(r => r.schoolId === activeSchoolId);
    if (isParent) {
      return schoolResults.filter(r => parentLinkedStudentIds.has(r.studentId));
    }
    return schoolResults;
  }, [isParent, dbState.results, activeSchoolId, parentLinkedStudentIds]);

  const feeStructures = dbState.feeStructures.filter(f => f.schoolId === activeSchoolId);

  // Fee Payments: Parent only sees fee payment receipts for their linked wards
  const feePayments = useMemo(() => {
    const schoolPayments = dbState.feePayments.filter(p => p.schoolId === activeSchoolId);
    if (isParent) {
      return schoolPayments.filter(p => parentLinkedStudentIds.has(p.studentId));
    }
    return schoolPayments;
  }, [isParent, dbState.feePayments, activeSchoolId, parentLinkedStudentIds]);

  const storeItems = dbState.storeItems.filter(i => i.schoolId === activeSchoolId);
  const posTransactions = dbState.posTransactions.filter(p => p.schoolId === activeSchoolId);
  const messages = dbState.messages.filter(m => m.schoolId === activeSchoolId);
  const auditLogs = currentUser?.role === 'superAdmin' 
    ? dbState.auditLogs 
    : dbState.auditLogs.filter(l => l.schoolId === activeSchoolId);

  const defaultSettings: SchoolSettings = {
    schoolId: activeSchoolId,
    smsProvider: 'arkesel',
    smsSenderId: school?.shortCode || 'SCHOOLOS',
    smsBalance: 850,
    gradingScale: [
      { grade: 'A', minScore: 80, maxScore: 100, remark: 'Exemplary' },
      { grade: 'B+', minScore: 75, maxScore: 79, remark: 'Very Good' },
      { grade: 'B', minScore: 70, maxScore: 74, remark: 'Good' },
      { grade: 'C', minScore: 60, maxScore: 69, remark: 'Credit' },
      { grade: 'D', minScore: 50, maxScore: 59, remark: 'Pass' },
      { grade: 'E', minScore: 45, maxScore: 49, remark: 'Weak Pass' },
      { grade: 'F', minScore: 0, maxScore: 44, remark: 'Fail' }
    ],
    receiptHeader: [
      school?.name,
      school?.address,
      school?.district ? `${school.district} District` : '',
      school?.phone ? `Tel: ${school.phone}` : ''
    ].filter(Boolean).join('\n'),
    receiptFooter: 'Official school receipt. Valid upon institutional endorsement.',
    reopeningDate: school?.currentAcademicYear ? '' : '',
    vacationDate: '',
  };

  const settings = dbState.settings[activeSchoolId] || defaultSettings;

  // Student CRUD with bidirectional Parent-Student relationship sync
  const addStudent = async (studentData: Omit<Student, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>): Promise<Student> => {
    const newId = `student_${Date.now()}`;
    const targetParentIds = Array.isArray(studentData.parentIds) 
      ? studentData.parentIds.filter(Boolean)
      : (studentData.parentId ? [studentData.parentId] : []);

    const newStudent: Student = {
      ...studentData,
      id: newId,
      schoolId: activeSchoolId,
      parentId: targetParentIds[0] || undefined,
      parentIds: targetParentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('ENROLL_STUDENT', `Enrolled new student ${newStudent.firstName} ${newStudent.lastName} (${newStudent.admissionNumber}) into ${newStudent.classroomName}`);
      
      // Update linkedStudentIds on assigned parent user accounts
      const updatedUsers = prev.users.map(u => {
        if (targetParentIds.includes(u.id)) {
          const currentLinks = u.linkedStudentIds || [];
          if (!currentLinks.includes(newId)) {
            return { ...u, linkedStudentIds: [...currentLinks, newId] };
          }
        }
        return u;
      });

      return {
        ...prev,
        students: [newStudent, ...prev.students],
        users: updatedUsers,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddStudent(newStudent);

    // Sync Firestore parent user records
    for (const pId of targetParentIds) {
      const parentUser = dbState.users.find(u => u.id === pId);
      if (parentUser) {
        const nextLinks = Array.from(new Set([...(parentUser.linkedStudentIds || []), newId]));
        await fsUpdateUser(pId, { linkedStudentIds: nextLinks });
      }
    }

    return newStudent;
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const targetParentIds = data.parentIds !== undefined 
      ? data.parentIds.filter(Boolean) 
      : (data.parentId !== undefined ? (data.parentId ? [data.parentId] : []) : undefined);

    updateStateAndPersist(prev => {
      const target = prev.students.find(s => s.id === id);
      const oldParentIds = target?.parentIds || (target?.parentId ? [target.parentId] : []);
      const newParentIds = targetParentIds !== undefined ? targetParentIds : oldParentIds;

      const updatedStudent: Student = {
        ...(target || ({} as Student)),
        ...data,
        parentId: newParentIds[0] || undefined,
        parentIds: newParentIds,
        updatedAt: new Date().toISOString()
      };

      const updatedStudents = prev.students.map(s => s.id === id ? updatedStudent : s);
      const log = logAction('UPDATE_STUDENT', `Updated profile of student ${target?.firstName || ''} ${target?.lastName || id}`);

      // Sync parent user records if parentIds were modified
      let updatedUsers = prev.users;
      if (targetParentIds !== undefined) {
        updatedUsers = prev.users.map(u => {
          if (u.role === 'parent' && u.schoolId === activeSchoolId) {
            const currentLinks = u.linkedStudentIds || [];
            if (newParentIds.includes(u.id)) {
              if (!currentLinks.includes(id)) {
                return { ...u, linkedStudentIds: [...currentLinks, id] };
              }
            } else if (oldParentIds.includes(u.id) && !newParentIds.includes(u.id)) {
              return { ...u, linkedStudentIds: currentLinks.filter(sId => sId !== id) };
            }
          }
          return u;
        });
      }

      return {
        ...prev,
        students: updatedStudents,
        users: updatedUsers,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateStudent(id, {
      ...data,
      parentId: targetParentIds ? (targetParentIds[0] || undefined) : data.parentId,
      parentIds: targetParentIds
    });

    // Sync Firestore parent users if parentIds were modified
    if (targetParentIds !== undefined) {
      const currentStudent = dbState.students.find(s => s.id === id);
      const oldParentIds = currentStudent?.parentIds || (currentStudent?.parentId ? [currentStudent.parentId] : []);
      
      // Update newly linked parents
      for (const pId of targetParentIds) {
        const parentUser = dbState.users.find(u => u.id === pId);
        if (parentUser) {
          const nextLinks = Array.from(new Set([...(parentUser.linkedStudentIds || []), id]));
          await fsUpdateUser(pId, { linkedStudentIds: nextLinks });
        }
      }
      // Clean unlinked parents
      for (const oldPId of oldParentIds) {
        if (!targetParentIds.includes(oldPId)) {
          const parentUser = dbState.users.find(u => u.id === oldPId);
          if (parentUser && parentUser.linkedStudentIds) {
            const nextLinks = parentUser.linkedStudentIds.filter(sId => sId !== id);
            await fsUpdateUser(oldPId, { linkedStudentIds: nextLinks });
          }
        }
      }
    }
  };

  const deleteStudent = async (id: string) => {
    updateStateAndPersist(prev => {
      const target = prev.students.find(s => s.id === id);
      const log = logAction('WITHDRAW_STUDENT', `Withdrew student record ${target?.firstName} ${target?.lastName} (${target?.admissionNumber})`);
      
      // Remove student from any linked parents
      const updatedUsers = prev.users.map(u => {
        if (u.role === 'parent' && u.linkedStudentIds?.includes(id)) {
          return { ...u, linkedStudentIds: u.linkedStudentIds.filter(sId => sId !== id) };
        }
        return u;
      });

      return {
        ...prev,
        students: prev.students.filter(s => s.id !== id),
        users: updatedUsers,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsDeleteStudent(id);
  };

  const linkStudentToParent = async (studentId: string, parentId: string) => {
    const student = dbState.students.find(s => s.id === studentId);
    const parent = dbState.users.find(u => u.id === parentId);
    if (!student || !parent) return;

    const currentParents = student.parentIds || (student.parentId ? [student.parentId] : []);
    const nextStudentParents = Array.from(new Set([...currentParents, parentId]));
    const nextParentStudents = Array.from(new Set([...(parent.linkedStudentIds || []), studentId]));

    await updateStudent(studentId, { parentId: nextStudentParents[0], parentIds: nextStudentParents });
    await updateUserAccount(parentId, { linkedStudentIds: nextParentStudents });
  };

  const unlinkStudentFromParent = async (studentId: string, parentId: string) => {
    const student = dbState.students.find(s => s.id === studentId);
    const parent = dbState.users.find(u => u.id === parentId);
    if (!student || !parent) return;

    const currentParents = student.parentIds || (student.parentId ? [student.parentId] : []);
    const nextStudentParents = currentParents.filter(id => id !== parentId);
    const nextParentStudents = (parent.linkedStudentIds || []).filter(id => id !== studentId);

    await updateStudent(studentId, { parentId: nextStudentParents[0] || undefined, parentIds: nextStudentParents });
    await updateUserAccount(parentId, { linkedStudentIds: nextParentStudents });
  };

  // Safe migration and repair mechanism for parent-student relationships
  const repairParentStudentLinks = async (): Promise<{ repairedParents: number; repairedStudents: number; details: string[] }> => {
    let repairedParentsCount = 0;
    let repairedStudentsCount = 0;
    const details: string[] = [];

    updateStateAndPersist(prev => {
      const schoolStudents = prev.students.filter(s => s.schoolId === activeSchoolId);
      const validStudentIds = new Set(schoolStudents.map(s => s.id));

      // 1. Audit and clean up parent user records
      const updatedUsers = prev.users.map(u => {
        if (u.role === 'parent' && u.schoolId === activeSchoolId) {
          const rawLinks = u.linkedStudentIds || [];
          const validLinks = rawLinks.filter(sId => validStudentIds.has(sId));
          if (validLinks.length !== rawLinks.length) {
            repairedParentsCount++;
            details.push(`Cleaned unverified linked student IDs for parent ${u.fullName} (${u.email})`);
            return { ...u, linkedStudentIds: validLinks };
          }
        }
        return u;
      });

      // 2. Audit and clean up student records
      const parentUserIds = new Set(updatedUsers.filter(u => u.role === 'parent' && u.schoolId === activeSchoolId).map(u => u.id));
      const updatedStudents = prev.students.map(s => {
        if (s.schoolId === activeSchoolId) {
          const rawParents = s.parentIds || (s.parentId ? [s.parentId] : []);
          const validParents = rawParents.filter(pId => parentUserIds.has(pId));
          if (validParents.length !== rawParents.length || (s.parentId && !validParents.includes(s.parentId))) {
            repairedStudentsCount++;
            details.push(`Corrected parent references on student ${s.firstName} ${s.lastName} (${s.admissionNumber})`);
            return {
              ...s,
              parentId: validParents[0] || undefined,
              parentIds: validParents,
              updatedAt: new Date().toISOString()
            };
          }
        }
        return s;
      });

      const log = logAction('REPAIR_PARENT_STUDENT_LINKS', `Repaired parent-student relationships: ${repairedParentsCount} parents and ${repairedStudentsCount} students cleaned.`);

      return {
        ...prev,
        users: updatedUsers,
        students: updatedStudents,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    return {
      repairedParents: repairedParentsCount,
      repairedStudents: repairedStudentsCount,
      details
    };
  };

  // Teacher CRUD
  const addTeacher = async (teacherData: Omit<Teacher, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>): Promise<Teacher> => {
    const newId = `teacher_${Date.now()}`;
    const newTeacher: Teacher = {
      ...teacherData,
      id: newId,
      schoolId: activeSchoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('ADD_STAFF', `Added teacher ${newTeacher.firstName} ${newTeacher.lastName} (Staff ID: ${newTeacher.staffId})`);
      return {
        ...prev,
        teachers: [newTeacher, ...prev.teachers],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddTeacher(newTeacher);
    return newTeacher;
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    updateStateAndPersist(prev => {
      const updatedTeachers = prev.teachers.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t);
      const target = prev.teachers.find(t => t.id === id);
      const log = logAction('UPDATE_STAFF', `Updated staff record for ${target?.firstName} ${target?.lastName}`);
      return {
        ...prev,
        teachers: updatedTeachers,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateTeacher(id, data);
  };

  const deleteTeacher = async (id: string) => {
    updateStateAndPersist(prev => {
      const target = prev.teachers.find(t => t.id === id);
      const log = logAction('DEACTIVATE_STAFF', `Deactivated teacher ${target?.firstName} ${target?.lastName}`);
      return {
        ...prev,
        teachers: prev.teachers.filter(t => t.id !== id),
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsDeleteTeacher(id);
  };

  // Classroom CRUD
  const addClassroom = async (classroomData: Omit<Classroom, 'id' | 'schoolId' | 'studentCount' | 'createdAt' | 'updatedAt'>): Promise<Classroom> => {
    const newId = `class_${Date.now()}`;
    const newClassroom: Classroom = {
      ...classroomData,
      id: newId,
      schoolId: activeSchoolId,
      studentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('CREATE_CLASSROOM', `Created classroom stream ${newClassroom.name} (${newClassroom.level})`);
      return {
        ...prev,
        classrooms: [...prev.classrooms, newClassroom],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddClassroom(newClassroom);
    return newClassroom;
  };

  const updateClassroom = async (id: string, data: Partial<Classroom>) => {
    updateStateAndPersist(prev => {
      const updated = prev.classrooms.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c);
      const target = prev.classrooms.find(c => c.id === id);
      const log = logAction('UPDATE_CLASSROOM', `Updated classroom ${target?.name}`);
      return {
        ...prev,
        classrooms: updated,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateClassroom(id, data);
  };

  // Subject CRUD
  const addSubject = async (subjectData: Omit<Subject, 'id' | 'schoolId' | 'createdAt'>): Promise<Subject> => {
    const newId = `sub_${Date.now()}`;
    const newSubject: Subject = {
      ...subjectData,
      id: newId,
      schoolId: activeSchoolId,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('ADD_SUBJECT', `Added curriculum subject ${newSubject.name} (${newSubject.code})`);
      return {
        ...prev,
        subjects: [...prev.subjects, newSubject],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddSubject(newSubject);
    return newSubject;
  };

  // Attendance
  const markAttendance = async (
    records: Array<{ studentId: string; studentName: string; admissionNumber: string; status: AttendanceStatus; remarks?: string }>, 
    classroomId: string, 
    date: string
  ) => {
    const newRecords: AttendanceRecord[] = records.map(r => ({
      id: `att_${classroomId}_${r.studentId}_${date}`,
      schoolId: activeSchoolId,
      classroomId,
      studentId: r.studentId,
      studentName: r.studentName,
      admissionNumber: r.admissionNumber,
      date,
      status: r.status,
      remarks: r.remarks,
      term: school?.currentTerm || 'Term 2',
      academicYear: school?.currentAcademicYear || '2025/2026',
      recordedBy: currentUser?.fullName || 'Class Teacher',
      createdAt: new Date().toISOString(),
    }));

    updateStateAndPersist(prev => {
      const filtered = prev.attendance.filter(a => !(a.classroomId === classroomId && a.date === date));
      const classroom = prev.classrooms.find(c => c.id === classroomId);
      const presentCount = records.filter(r => r.status === 'present').length;
      const log = logAction('MARK_ATTENDANCE', `Recorded daily roll call for ${classroom?.name || 'Classroom'} on ${date}: ${presentCount}/${records.length} present.`);
      
      return {
        ...prev,
        attendance: [...newRecords, ...filtered],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsMarkAttendanceBulk(newRecords);
  };

  const getAttendanceForDate = (classroomId: string, date: string): AttendanceRecord[] => {
    return attendance.filter(a => a.classroomId === classroomId && a.date === date);
  };

  // Examinations & Results
  const addExamination = async (examData: Omit<Examination, 'id' | 'schoolId' | 'createdAt'>): Promise<Examination> => {
    const newId = `exam_${Date.now()}`;
    const newExam: Examination = {
      ...examData,
      id: newId,
      schoolId: activeSchoolId,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('CREATE_EXAMINATION', `Scheduled examination session: ${newExam.name}`);
      return {
        ...prev,
        examinations: [newExam, ...prev.examinations],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddExamination(newExam);
    return newExam;
  };

  const saveResults = async (resultsToSave: Array<Omit<ExaminationResult, 'id' | 'schoolId' | 'createdAt' | 'updatedAt' | 'grade' | 'gradeRemark'>>) => {
    const processed: ExaminationResult[] = resultsToSave.map(r => {
      const total = Math.min(100, Math.max(0, Math.round(r.classScore + r.examScore)));
      const gradeInfo = calculateGhanaGrade(total);
      return {
        ...r,
        id: `res_${r.examinationId}_${r.studentId}_${r.subjectId}`,
        schoolId: activeSchoolId,
        totalScore: total,
        grade: gradeInfo.grade,
        gradeRemark: gradeInfo.remark,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const withPositions = calculatePositions(processed);

    updateStateAndPersist(prev => {
      const existingFiltered = prev.results.filter(existing => 
        !withPositions.some(p => p.examinationId === existing.examinationId && p.studentId === existing.studentId && p.subjectId === existing.subjectId)
      );
      const log = logAction('ENTER_EXAM_SCORES', `Submitted Continuous Assessment & Exam marks for ${withPositions.length} student result entries.`);

      return {
        ...prev,
        results: [...withPositions, ...existingFiltered],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsSaveResults(withPositions);
  };

  const generateTerminalReport = (studentId: string, term: 'Term 1' | 'Term 2' | 'Term 3', academicYear: string): TerminalReport | null => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentResults = results.filter(r => r.studentId === studentId && (r.term === term || (!r.term && term === 'Term 3')) && (r.academicYear === academicYear || !r.academicYear));
    
    // Real Attendance stats
    const studentAttendance = attendance.filter(a => a.studentId === studentId && (a.term === term || !a.term) && (a.academicYear === academicYear || !a.academicYear));
    const totalDays = studentAttendance.length;
    const daysPresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const daysAbsent = studentAttendance.filter(a => a.status === 'absent').length;
    const percentageAttendance = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;

    const subjectBreakdown = studentResults.map(res => ({
      subjectName: res.subjectName,
      classScore: res.classScore,
      examScore: res.examScore,
      total: res.totalScore,
      grade: res.grade,
      position: res.position || 0,
      remarks: res.teacherRemarks || res.gradeRemark || ''
    }));

    const totalScores = (studentResults || []).reduce((acc, curr) => acc + (curr?.totalScore || 0), 0);
    const overallAverage = studentResults.length > 0 ? Math.round(totalScores / studentResults.length) : 0;
    const overallGradeInfo = studentResults.length > 0 ? calculateGhanaGrade(overallAverage) : { grade: '—', remark: 'Pending Assessment' };

    const classStudents = students.filter(s => s.currentClassroomId === student.currentClassroomId);
    const totalStudentsInClass = classStudents.length;
    const overallPosition = studentResults[0]?.position || 0;

    const promoted = studentResults.length > 0 && overallAverage >= 50;
    const nextLevel = student.level ? `Promoted to Next Form` : '';

    return {
      id: `report_${studentId}_${term}_${academicYear}`,
      schoolId: activeSchoolId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName} ${student.otherNames || ''}`.trim(),
      admissionNumber: student.admissionNumber,
      classroomId: student.currentClassroomId,
      classroomName: student.classroomName,
      academicYear,
      term,
      subjects: subjectBreakdown,
      attendanceSummary: {
        totalDays,
        daysPresent,
        daysAbsent,
        percentageAttendance,
      },
      overallAverage,
      overallGrade: overallGradeInfo.grade,
      overallPosition,
      totalStudentsInClass,
      classTeacherRemarks: studentResults.length > 0 ? generateTeacherRemark(overallAverage) : 'Assessments pending entry.',
      headTeacherRemarks: studentResults.length > 0 ? generateHeadTeacherRemark(overallAverage, promoted, nextLevel) : 'End of term review pending marks finalization.',
      promoted,
      nextClass: nextLevel,
      reopeningDate: settings.reopeningDate,
      dateIssued: new Date().toISOString().split('T')[0],
    };
  };

  // Promotion Workflow
  const promoteStudents = async (promotions: Array<{ studentId: string; nextClassroomId?: string; action: 'promote' | 'repeat' | 'graduate' }>) => {
    updateStateAndPersist(prev => {
      const updatedStudents = prev.students.map(std => {
        const promo = promotions.find(p => p.studentId === std.id);
        if (!promo) return std;

        if (promo.action === 'graduate') {
          return { ...std, status: 'graduated' as const, updatedAt: new Date().toISOString() };
        }

        if (promo.action === 'promote' && promo.nextClassroomId) {
          const nextClass = prev.classrooms.find(c => c.id === promo.nextClassroomId);
          return {
            ...std,
            currentClassroomId: promo.nextClassroomId,
            classroomName: nextClass?.name || std.classroomName,
            level: nextClass?.level || std.level,
            updatedAt: new Date().toISOString()
          };
        }

        return std;
      });

      const log = logAction('EXECUTE_PROMOTION', `Processed batch promotion workflow for ${promotions.length} students.`);
      return {
        ...prev,
        students: updatedStudents,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    for (const p of promotions) {
      if (p.action === 'graduate') {
        await fsUpdateStudent(p.studentId, { status: 'graduated' });
      } else if (p.action === 'promote' && p.nextClassroomId) {
        const nextClass = classrooms.find(c => c.id === p.nextClassroomId);
        await fsUpdateStudent(p.studentId, {
          currentClassroomId: p.nextClassroomId,
          classroomName: nextClass?.name,
          level: nextClass?.level
        });
      }
    }
  };

  // Fees & Payments
  const addFeeStructure = async (structureData: Omit<FeeStructure, 'id' | 'schoolId' | 'createdAt'>): Promise<FeeStructure> => {
    const newId = `fee_struct_${Date.now()}`;
    const newStructure: FeeStructure = {
      ...structureData,
      id: newId,
      schoolId: activeSchoolId,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('CREATE_FEE_STRUCTURE', `Created fee bill structure: ${newStructure.name} (${newStructure.totalAmount} GHS)`);
      return {
        ...prev,
        feeStructures: [newStructure, ...prev.feeStructures],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddFeeStructure(newStructure);
    return newStructure;
  };

  const recordFeePayment = async (paymentData: Omit<FeePayment, 'id' | 'schoolId' | 'createdAt'>, sendReceiptSMS: boolean = true): Promise<FeePayment> => {
    // Dynamic collision-resistant reference and receipt generation
    let dynamicRef: DynamicReferenceResponse | null = null;
    const existingRef = (paymentData as any).reference || paymentData.transactionReference;
    
    if (!existingRef || existingRef.startsWith('TX-') || existingRef.startsWith('PAY-TEMP-')) {
      try {
        dynamicRef = await apiGenerateDynamicReference('fee_payment', activeSchoolId);
      } catch (e) {
        console.warn('Fallback reference generator used for fee payment:', e);
      }
    }

    const finalReference = dynamicRef?.reference || existingRef || `SCH-FEE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const finalReceiptNumber = paymentData.receiptNumber || dynamicRef?.receiptNumber || `REC-FEE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${finalReference.slice(-4)}`;
    const newId = `pay_${finalReference}`;

    const newPayment: FeePayment = {
      ...paymentData,
      id: newId,
      schoolId: activeSchoolId,
      reference: finalReference,
      transactionReference: finalReference,
      receiptNumber: finalReceiptNumber,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const mode = (newPayment.paymentMethod || newPayment.method || 'momo').toUpperCase();
      const log = logAction('RECORD_PAYMENT', `Received GH₵ ${newPayment.amount} via ${mode} from ${newPayment.payerName} for student ${newPayment.studentName} (${newPayment.admissionNumber || ''}). Ref: ${finalReference}, Receipt: ${finalReceiptNumber}`);
      return {
        ...prev,
        feePayments: [newPayment, ...prev.feePayments],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsRecordFeePayment(newPayment);

    // Auto-trigger central SMS receipt if payer phone or student guardian phone exists
    if (sendReceiptSMS && school) {
      try {
        const student = students.find(s => s.id === newPayment.studentId);
        const payerPhone = newPayment.payerPhone || student?.guardianPhone;
        if (payerPhone) {
          const commLog = await triggerFeePaymentNotification(
            school,
            {
              id: newPayment.id,
              studentName: newPayment.studentName,
              amount: newPayment.amount,
              payerName: newPayment.payerName,
              payerPhone,
              receiptNumber: finalReceiptNumber,
              term: newPayment.term || school.currentTerm,
              paymentMethod: newPayment.paymentMethod
            },
            dbState.platformCommunication || INITIAL_PLATFORM_COMMUNICATION
          );
          if (commLog) {
            updateStateAndPersist(prev => ({
              ...prev,
              communicationLogs: [commLog, ...(prev.communicationLogs || [])]
            }));
          }
        }
      } catch (err) {
        console.warn('Could not dispatch automated fee receipt SMS:', err);
      }
    }

    return newPayment;
  };

  const getStudentFeeSummaries = (): StudentFeeSummary[] => {
    return students.map(student => {
      const applicableFee = feeStructures.find(f => f.classroomId === student.currentClassroomId) || feeStructures.find(f => !f.classroomId);
      // Priority: If student has custom/entered feesAmount during registration/profile, use that. Otherwise use classroom fee structure total.
      const amountToBePaid = (typeof student.feesAmount === 'number' && !isNaN(student.feesAmount) && student.feesAmount >= 0)
        ? student.feesAmount
        : (applicableFee ? applicableFee.totalAmount : 0);
      
      const payments = (feePayments || []).filter(p => p.studentId === student.id);
      const amountPaid = (payments || []).reduce((acc, curr) => acc + (curr?.amount || 0), 0);
      
      const calc = calculateStudentFeeBalance(amountToBePaid, amountPaid);

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName} ${student.otherNames || ''}`.trim(),
        admissionNumber: student.admissionNumber,
        classroomId: student.currentClassroomId,
        classroomName: student.classroomName,
        academicYear: student.academicYear || applicableFee?.academicYear || school?.currentAcademicYear || '2026/2027',
        term: student.term || applicableFee?.term || school?.currentTerm || 'Term 3',
        amountToBePaid: calc.amountToBePaid,
        amountPaid: calc.amountPaid,
        amountOwing: calc.amountOwing,
        paymentStatus: calc.paymentStatus,
        totalBilled: calc.amountToBePaid,
        totalPaid: calc.amountPaid,
        balance: calc.amountOwing,
        status: calc.statusCode,
        lastPaymentDate: payments[0]?.paymentDate || payments[0]?.date,
      };
    });
  };

  // Store & POS
  const addStoreItem = async (itemData: Omit<StoreItem, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>): Promise<StoreItem> => {
    const newId = `item_${Date.now()}`;
    const newItem: StoreItem = {
      ...itemData,
      id: newId,
      schoolId: activeSchoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('ADD_STORE_ITEM', `Added store inventory product: ${newItem.name} (SKU: ${newItem.sku})`);
      return {
        ...prev,
        storeItems: [newItem, ...prev.storeItems],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsAddStoreItem(newItem);
    return newItem;
  };

  const updateStoreItem = async (id: string, data: Partial<StoreItem>) => {
    updateStateAndPersist(prev => {
      const updated = prev.storeItems.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
      const target = prev.storeItems.find(i => i.id === id);
      const log = logAction('UPDATE_STORE_ITEM', `Updated inventory/stock for ${target?.name}`);
      return {
        ...prev,
        storeItems: updated,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateStoreItem(id, data);
  };

  const processPOSTransaction = async (txData: Omit<POSTransaction, 'id' | 'schoolId' | 'receiptNumber' | 'createdAt'>): Promise<POSTransaction> => {
    let dynamicRef: DynamicReferenceResponse | null = null;
    try {
      dynamicRef = await apiGenerateDynamicReference('pos_sale', activeSchoolId);
    } catch (err) {
      console.warn('POS Dynamic Reference generation fallback:', err);
    }

    const reference = dynamicRef?.reference || (txData as any).reference || `POS-SALE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const receiptNumber = dynamicRef?.receiptNumber || (txData as any).receiptNumber || `REC-POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${reference.slice(-4)}`;
    const txId = `pos_${reference}`;

    const newTx: POSTransaction = {
      ...txData,
      id: txId,
      schoolId: activeSchoolId,
      reference,
      transactionReference: reference,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const updatedStore = prev.storeItems.map(item => {
        const sold = txData.items.find(i => i.itemId === item.id);
        if (sold) {
          const nextStock = Math.max(0, item.currentStock - sold.quantity);
          return { ...item, currentStock: nextStock, updatedAt: new Date().toISOString() };
        }
        return item;
      });

      const log = logAction('POS_CHECKOUT', `Processed POS sale ${receiptNumber} (Ref: ${reference}) for GH₵ ${newTx.total} (${newTx.paymentMethod.toUpperCase()}) by ${newTx.cashierName}`);

      return {
        ...prev,
        storeItems: updatedStore,
        posTransactions: [newTx, ...prev.posTransactions],
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsRecordPOSTransaction(newTx);
    return newTx;
  };

  // Broadcast & SMS
  const sendBroadcastMessage = async (msgData: Omit<BroadcastMessage, 'id' | 'schoolId' | 'costGHS' | 'status' | 'sentAt'>): Promise<BroadcastMessage> => {
    const newId = `msg_${Date.now()}`;
    const costPerSms = 0.10;
    const totalCost = Number((msgData.recipientCount * costPerSms).toFixed(2));

    const newMsg: BroadcastMessage = {
      ...msgData,
      id: newId,
      schoolId: activeSchoolId,
      costGHS: totalCost,
      status: 'delivered',
      sentAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const currentSetting = prev.settings[activeSchoolId] || defaultSettings;
      const updatedSettings = {
        ...prev.settings,
        [activeSchoolId]: {
          ...currentSetting,
          smsBalance: Math.max(0, currentSetting.smsBalance - msgData.recipientCount)
        }
      };

      const log = logAction('SEND_SMS_BROADCAST', `Sent broadcast to ${newMsg.recipientGroup} (${newMsg.recipientCount} recipients) via ${newMsg.senderId}. Cost: GH₵ ${totalCost}`);

      return {
        ...prev,
        messages: [newMsg, ...prev.messages],
        settings: updatedSettings,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsSendBroadcastMessage(newMsg);
    return newMsg;
  };

  // Super Admin Platform Operations
  const approveSchool = async (schoolId: string) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === schoolId ? { ...s, status: 'active' as const, updatedAt: new Date().toISOString() } : s);
      const target = prev.schools.find(s => s.id === schoolId);
      const log = logAction('APPROVE_SCHOOL_REGISTRATION', `Approved registration for ${target?.name}. Full access activated.`, schoolId);

      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(schoolId, { status: 'active' });
  };

  const rejectSchool = async (schoolId: string) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === schoolId ? { ...s, status: 'rejected' as const, updatedAt: new Date().toISOString() } : s);
      const target = prev.schools.find(s => s.id === schoolId);
      const log = logAction('REJECT_SCHOOL_REGISTRATION', `Rejected registration for ${target?.name}.`, schoolId);

      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(schoolId, { status: 'rejected' });
  };

  const suspendSchool = async (schoolId: string) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === schoolId ? { ...s, status: 'suspended' as const, updatedAt: new Date().toISOString() } : s);
      const target = prev.schools.find(s => s.id === schoolId);
      const log = logAction('SUSPEND_SCHOOL_ACCESS', `Suspended platform access for ${target?.name}.`, schoolId);

      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(schoolId, { status: 'suspended' });
  };

  const updateAnySchool = async (schoolId: string, data: Partial<School>) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === schoolId ? { ...s, ...data, updatedAt: new Date().toISOString() } : s);
      const target = prev.schools.find(s => s.id === schoolId);
      const log = logAction('UPDATE_SCHOOL_DETAILS', `Updated institutional records for ${target?.name || schoolId}`, schoolId);

      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(schoolId, data);
  };

  const updateSchoolSubscription = async (schoolId: string, plan: SubscriptionPlan, expiryDate: string) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === schoolId ? { ...s, subscriptionPlan: plan, subscriptionExpiry: expiryDate, updatedAt: new Date().toISOString() } : s);
      const target = prev.schools.find(s => s.id === schoolId);
      const log = logAction('UPDATE_SUBSCRIPTION_PLAN', `Updated subscription for ${target?.name} to ${plan.toUpperCase()} tier (Expires: ${expiryDate})`, schoolId);

      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(schoolId, { subscriptionPlan: plan, subscriptionExpiry: expiryDate });
  };

  // Settings
  const updateSettings = async (newSettingsData: Partial<SchoolSettings>) => {
    updateStateAndPersist(prev => {
      const updated = {
        ...prev.settings,
        [activeSchoolId]: {
          ...(prev.settings[activeSchoolId] || defaultSettings),
          ...newSettingsData
        }
      };
      const log = logAction('UPDATE_SCHOOL_SETTINGS', 'Updated institutional configuration and communication parameters.');
      return {
        ...prev,
        settings: updated,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchoolSettings(activeSchoolId, newSettingsData);
  };

  const updateSchoolInfo = async (data: Partial<School>) => {
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => s.id === activeSchoolId ? { ...s, ...data, updatedAt: new Date().toISOString() } : s);
      const log = logAction('UPDATE_INSTITUTION_PROFILE', `Updated institutional profile details for ${school?.name}`);
      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(activeSchoolId, data);
  };

  const updatePlatformCommunication = async (settingsData: Partial<PlatformCommunicationSettings>) => {
    updateStateAndPersist(prev => {
      const current = prev.platformCommunication || INITIAL_PLATFORM_COMMUNICATION;
      const updated: PlatformCommunicationSettings = {
        sms: {
          ...current.sms,
          ...(settingsData.sms || {})
        },
        whatsapp: {
          ...current.whatsapp,
          ...(settingsData.whatsapp || {})
        }
      };
      const log = logAction('UPDATE_PLATFORM_COMMUNICATION', 'Updated platform centralized SMS/WhatsApp gateway configurations');
      return {
        ...prev,
        platformCommunication: updated,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdatePlatformCommunication(settingsData);
  };

  // Plan Management Actions (Super Admin)
  const createPlan = async (planData: Omit<SubscriptionTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionTier> => {
    const newId = `plan_${Date.now()}`;
    const newPlan: SubscriptionTier = {
      ...planData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateStateAndPersist(prev => {
      const log = logAction('CREATE_SUBSCRIPTION_PLAN', `Created new SaaS tier: ${newPlan.name} (₵${newPlan.priceGHS}/${newPlan.billingPeriod})`);
      return {
        ...prev,
        plans: [...(prev.plans || INITIAL_PLANS), newPlan],
        auditLogs: [log, ...prev.auditLogs]
      };
    });
    await fsCreatePlan(newPlan);
    return newPlan;
  };

  const updatePlan = async (id: string, data: Partial<SubscriptionTier>) => {
    updateStateAndPersist(prev => {
      const plansList = prev.plans || INITIAL_PLANS;
      const updated = plansList.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
      const target = plansList.find(p => p.id === id);
      const log = logAction('UPDATE_SUBSCRIPTION_PLAN', `Updated SaaS tier configurations for ${target?.name || id}`);
      return {
        ...prev,
        plans: updated,
        auditLogs: [log, ...prev.auditLogs]
      };
    });
    await fsUpdatePlan(id, data);
  };

  const deletePlan = async (id: string) => {
    updateStateAndPersist(prev => {
      const plansList = prev.plans || INITIAL_PLANS;
      const target = plansList.find(p => p.id === id);
      const filtered = plansList.filter(p => p.id !== id);
      const log = logAction('DELETE_SUBSCRIPTION_PLAN', `Deleted subscription tier: ${target?.name || id}`);
      return {
        ...prev,
        plans: filtered,
        auditLogs: [log, ...prev.auditLogs]
      };
    });
    await fsDeletePlan(id);
  };

  const setSchoolFeatureOverride = async (targetSchoolId: string, feature: FeatureKey, enabled: boolean | null) => {
    const target = dbState.schools.find(s => s.id === targetSchoolId);
    const currentOverrides = { ...(target?.featureOverrides || {}) };
    if (enabled === null) {
      delete currentOverrides[feature];
    } else {
      currentOverrides[feature] = enabled;
    }

    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => {
        if (s.id !== targetSchoolId) return s;
        return {
          ...s,
          featureOverrides: currentOverrides,
          updatedAt: new Date().toISOString()
        };
      });
      const log = logAction('FEATURE_OVERRIDE', `Set override for feature "${feature}" to ${enabled === null ? 'DEFAULT' : enabled ? 'ENABLED' : 'DISABLED'} for ${target?.name || targetSchoolId}`, targetSchoolId);
      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(targetSchoolId, { featureOverrides: currentOverrides });
  };

  const assignSchoolPlan = async (targetSchoolId: string, planId: string, planCode: string, expiryDate?: string) => {
    const defaultExpiry = expiryDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    updateStateAndPersist(prev => {
      const updatedSchools = prev.schools.map(s => {
        if (s.id !== targetSchoolId) return s;
        return {
          ...s,
          planId,
          subscriptionPlan: planCode as SubscriptionPlan,
          subscriptionExpiry: defaultExpiry,
          updatedAt: new Date().toISOString()
        };
      });
      const target = prev.schools.find(s => s.id === targetSchoolId);
      const log = logAction('ASSIGN_SCHOOL_PLAN', `Assigned plan ${planCode.toUpperCase()} to ${target?.name || targetSchoolId}`, targetSchoolId);
      return {
        ...prev,
        schools: updatedSchools,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateSchool(targetSchoolId, { 
      planId, 
      subscriptionPlan: planCode as SubscriptionPlan, 
      subscriptionExpiry: defaultExpiry 
    });
  };

  // User Accounts Management with Parent-Student relationship sync
  const createUserAccount = async (userData: Omit<UserProfile, 'id' | 'uid' | 'createdAt'>, initialPassword?: string): Promise<UserProfile> => {
    const newId = `user_${Date.now()}`;
    const selectedStudentIds = (userData.role === 'parent' && Array.isArray(userData.linkedStudentIds))
      ? userData.linkedStudentIds.filter(Boolean)
      : [];

    const newUser: UserProfile = {
      ...userData,
      id: newId,
      uid: `auth_${newId}`,
      password: initialPassword || userData.password || 'password123',
      linkedStudentIds: userData.role === 'parent' ? selectedStudentIds : undefined,
      createdAt: new Date().toISOString(),
    };

    updateStateAndPersist(prev => {
      const log = logAction('CREATE_USER_PORTAL_ACCOUNT', `Created portal account for ${newUser.fullName} (${newUser.role}) with ${selectedStudentIds.length} linked student(s)`);
      
      // Update parentIds on assigned students
      let updatedStudents = prev.students;
      if (userData.role === 'parent' && selectedStudentIds.length > 0) {
        updatedStudents = prev.students.map(s => {
          if (selectedStudentIds.includes(s.id) && s.schoolId === (userData.schoolId || activeSchoolId)) {
            const currentParents = s.parentIds || (s.parentId ? [s.parentId] : []);
            if (!currentParents.includes(newId)) {
              return {
                ...s,
                parentId: currentParents[0] || newId,
                parentIds: [...currentParents, newId],
                updatedAt: new Date().toISOString()
              };
            }
          }
          return s;
        });
      }

      return {
        ...prev,
        users: [newUser, ...prev.users],
        students: updatedStudents,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsCreateUser(newUser);

    // Sync Firestore students
    if (userData.role === 'parent' && selectedStudentIds.length > 0) {
      for (const sId of selectedStudentIds) {
        const student = dbState.students.find(s => s.id === sId);
        if (student) {
          const currentParents = student.parentIds || (student.parentId ? [student.parentId] : []);
          const nextParents = Array.from(new Set([...currentParents, newId]));
          await fsUpdateStudent(sId, { parentId: nextParents[0], parentIds: nextParents });
        }
      }
    }

    return newUser;
  };

  const updateUserAccount = async (id: string, data: Partial<UserProfile>) => {
    updateStateAndPersist(prev => {
      const targetUser = prev.users.find(u => u.id === id);
      const isParentUser = (data.role || targetUser?.role) === 'parent';
      const oldLinkedIds = targetUser?.linkedStudentIds || [];
      const newLinkedIds = (isParentUser && data.linkedStudentIds !== undefined) 
        ? data.linkedStudentIds.filter(Boolean) 
        : oldLinkedIds;

      const updatedUser: UserProfile = {
        ...(targetUser || ({} as UserProfile)),
        ...data,
        linkedStudentIds: isParentUser ? newLinkedIds : undefined,
      };

      const updatedUsers = prev.users.map(u => u.id === id ? updatedUser : u);
      const log = logAction('UPDATE_USER_PORTAL_ACCOUNT', `Updated profile credentials for user account ${id}`);

      // Sync affected students' parentIds
      let updatedStudents = prev.students;
      if (isParentUser && data.linkedStudentIds !== undefined) {
        updatedStudents = prev.students.map(s => {
          if (s.schoolId === (updatedUser.schoolId || activeSchoolId)) {
            const currentParents = s.parentIds || (s.parentId ? [s.parentId] : []);
            if (newLinkedIds.includes(s.id)) {
              if (!currentParents.includes(id)) {
                return {
                  ...s,
                  parentId: currentParents[0] || id,
                  parentIds: [...currentParents, id],
                  updatedAt: new Date().toISOString()
                };
              }
            } else if (oldLinkedIds.includes(s.id) && !newLinkedIds.includes(s.id)) {
              const nextParents = currentParents.filter(pId => pId !== id);
              return {
                ...s,
                parentId: nextParents[0] || undefined,
                parentIds: nextParents,
                updatedAt: new Date().toISOString()
              };
            }
          }
          return s;
        });
      }

      return {
        ...prev,
        users: updatedUsers,
        students: updatedStudents,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    await fsUpdateUser(id, data);

    // Sync Firestore student records if linkedStudentIds were modified
    if (data.linkedStudentIds !== undefined) {
      const targetUser = dbState.users.find(u => u.id === id);
      const oldLinkedIds = targetUser?.linkedStudentIds || [];
      const newLinkedIds = data.linkedStudentIds.filter(Boolean);

      // Add parent to newly linked students
      for (const sId of newLinkedIds) {
        const student = dbState.students.find(s => s.id === sId);
        if (student) {
          const currentParents = student.parentIds || (student.parentId ? [student.parentId] : []);
          const nextParents = Array.from(new Set([...currentParents, id]));
          await fsUpdateStudent(sId, { parentId: nextParents[0], parentIds: nextParents });
        }
      }
      // Remove parent from unlinked students
      for (const oldSId of oldLinkedIds) {
        if (!newLinkedIds.includes(oldSId)) {
          const student = dbState.students.find(s => s.id === oldSId);
          if (student && (student.parentIds || student.parentId)) {
            const currentParents = student.parentIds || (student.parentId ? [student.parentId] : []);
            const nextParents = currentParents.filter(pId => pId !== id);
            await fsUpdateStudent(oldSId, { parentId: nextParents[0] || undefined, parentIds: nextParents });
          }
        }
      }
    }
  };

  const deleteUserAccount = async (id: string) => {
    const target = dbState.users.find(u => u.id === id || u.uid === id);
    const userId = target?.id || id;
    const isParentUser = target?.role === 'parent';

    updateStateAndPersist(prev => {
      const updatedUsers = prev.users.filter(u => u.id !== userId && u.uid !== userId);
      const log = logAction('DELETE_USER_PORTAL_ACCOUNT', `Permanently deleted user account for ${target?.fullName || userId} (${target?.role || 'user'})`);

      // If parent user is deleted, remove their ID from all linked students
      let updatedStudents = prev.students;
      if (isParentUser) {
        updatedStudents = prev.students.map(s => {
          if (s.parentId === userId || s.parentIds?.includes(userId)) {
            const currentParents = s.parentIds || (s.parentId ? [s.parentId] : []);
            const nextParents = currentParents.filter(pId => pId !== userId);
            return {
              ...s,
              parentId: nextParents[0] || undefined,
              parentIds: nextParents,
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });
      }

      return {
        ...prev,
        users: updatedUsers,
        students: updatedStudents,
        auditLogs: [log, ...prev.auditLogs]
      };
    });

    try {
      await fsDeleteUser(userId);
    } catch (fsErr) {
      console.warn('Firestore user deletion notice:', fsErr);
    }

    // Sync Firestore students if parent was unlinked
    if (isParentUser) {
      const affected = dbState.students.filter(s => s.parentId === userId || s.parentIds?.includes(userId));
      for (const st of affected) {
        const currentParents = st.parentIds || (st.parentId ? [st.parentId] : []);
        const nextParents = currentParents.filter(pId => pId !== userId);
        try {
          await fsUpdateStudent(st.id, {
            parentId: nextParents[0] || undefined,
            parentIds: nextParents
          });
        } catch (stErr) {
          console.warn('Firestore student parent sync notice:', stErr);
        }
      }
    }
  };

  const plans = dbState.plans || INITIAL_PLANS;
  const schoolUsers = dbState.users.filter(u => u.schoolId === activeSchoolId);
  const allUsersList = dbState.users;

  const sendDirectCommunication = async (params: Omit<SendCommunicationParams, 'schoolId' | 'schoolName'>): Promise<CommunicationLog> => {
    if (!school) {
      throw new Error('No active school selected for communication transmission.');
    }
    const log = await sendCentralCommunication(
      {
        ...params,
        schoolId: school.id,
        schoolName: school.name,
        registeredPhone: school.registeredPhone || school.phone
      },
      school,
      dbState.platformCommunication || INITIAL_PLATFORM_COMMUNICATION
    );

    updateStateAndPersist(prev => ({
      ...prev,
      communicationLogs: [log, ...(prev.communicationLogs || [])]
    }));

    return log;
  };

  // Convenience aliases and adapters
  const markAttendanceBulk = async (
    records: Array<{ studentId: string; studentName: string; classroomId: string; date: string; academicYear?: string; term?: string; status: AttendanceStatus; remarks?: string }>,
    notifyAbsentGuardians: boolean = false
  ) => {
    if (records.length === 0) return;
    const classroomId = records[0].classroomId;
    const date = records[0].date;
    const formatted = records.map(r => {
      const student = students.find(s => s.id === r.studentId);
      return {
        studentId: r.studentId,
        studentName: r.studentName,
        admissionNumber: student?.admissionNumber || '',
        status: r.status,
        remarks: r.remarks,
      };
    });
    await markAttendance(formatted, classroomId, date);

    // Auto-alert absent students' guardians if requested or triggered
    if (notifyAbsentGuardians && school) {
      const classroomObj = classrooms.find(c => c.id === classroomId);
      const absentRecords = records.filter(r => r.status === 'absent');
      for (const rec of absentRecords) {
        const stu = students.find(s => s.id === rec.studentId);
        if (stu && stu.guardianPhone) {
          try {
            const log = await triggerAttendanceAbsenceAlert(
              school,
              {
                id: stu.id,
                firstName: stu.firstName,
                lastName: stu.lastName,
                classroomName: classroomObj?.name || 'Classroom',
                guardianPhone: stu.guardianPhone,
                guardianName: stu.guardianName
              },
              date,
              dbState.platformCommunication || INITIAL_PLATFORM_COMMUNICATION
            );
            if (log) {
              updateStateAndPersist(prev => ({
                ...prev,
                communicationLogs: [log, ...(prev.communicationLogs || [])]
              }));
            }
          } catch (e) {
            console.warn('Failed to send absence alert SMS:', e);
          }
        }
      }
    }
  };

  const recordExamResult = async (resultData: any) => {
    const student = students.find(s => s.id === resultData.studentId);
    await saveResults([{
      examinationId: resultData.examinationId || 'exam_terminal_2026_t3',
      studentId: resultData.studentId,
      studentName: resultData.studentName || `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
      admissionNumber: student?.admissionNumber || resultData.admissionNumber || 'STU-001',
      classroomId: resultData.classroomId,
      classroomName: resultData.classroomName || 'Classroom',
      subjectId: resultData.subjectId || `sub_${resultData.subject?.toLowerCase().replace(/\s+/g, '_') || 'gen'}`,
      subjectName: resultData.subjectName || resultData.subject,
      academicYear: resultData.academicYear || school?.currentAcademicYear || '2025/2026',
      term: resultData.term || school?.currentTerm || 'Term 2',
      classScore: Number(resultData.classScore) || 0,
      examScore: Number(resultData.examScore) || 0,
      totalScore: Number(resultData.totalScore) || 0,
      position: resultData.position || 1,
      teacherRemarks: resultData.remarks || '',
    }]);
  };

  const executePromotion = async (options: { currentClassroomId: string; nextClassroomId: string; academicYear: string; promotedStudentIds: string[]; repeatedStudentIds: string[] }) => {
    const list: Array<{ studentId: string; nextClassroomId?: string; action: 'promote' | 'repeat' | 'graduate' }> = [
      ...options.promotedStudentIds.map(id => ({ studentId: id, nextClassroomId: options.nextClassroomId, action: 'promote' as const })),
      ...options.repeatedStudentIds.map(id => ({ studentId: id, nextClassroomId: options.currentClassroomId, action: 'repeat' as const })),
    ];
    await promoteStudents(list);
  };

  const updateStoreStock = async (itemId: string, newStock: number, _type?: string, _reason?: string) => {
    await updateStoreItem(itemId, { currentStock: newStock });
  };

  const processPOSSale = async (saleData: any): Promise<POSTransaction> => {
    const formattedItems = (saleData.items || []).map((c: any) => {
      const uPrice = c.unitPrice || c.item?.sellingPrice || c.price || 0;
      const q = c.quantity || 1;
      return {
        itemId: c.itemId || c.item?.id || `item_${Date.now()}`,
        name: c.itemName || c.item?.name || c.name || 'Store Item',
        quantity: q,
        unitPrice: uPrice,
        subtotal: uPrice * q,
      };
    });

    const sub = formattedItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);

    return await processPOSTransaction({
      items: formattedItems,
      subtotal: sub,
      discount: 0,
      total: sub,
      paymentMethod: saleData.paymentMethod || 'cash',
      customerName: saleData.studentName || saleData.customerName || 'Walk-in Customer',
      customerType: saleData.customerType || 'student',
      cashierName: saleData.cashierName || currentUser?.fullName || 'Cashier',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const sendSMSBroadcast = async (recipientGroup: any, message: string, recipientCount?: number): Promise<BroadcastMessage> => {
    const count = recipientCount || (recipientGroup === 'all' ? students.length + teachers.length : recipientGroup === 'parents' ? students.length : recipientGroup === 'teachers' ? teachers.length : 1);
    const validGroup: SMSBroadcastRecipient = typeof recipientGroup === 'string' && (
      recipientGroup === 'all_parents' || 
      recipientGroup === 'all_guardians' || 
      recipientGroup === 'fee_defaulters' || 
      recipientGroup === 'all_staff' || 
      recipientGroup === 'staff' || 
      recipientGroup === 'class_parents' || 
      recipientGroup === 'class_guardians' || 
      recipientGroup === 'defaulters' || 
      recipientGroup === 'custom'
    ) ? recipientGroup : 'custom';

    return await sendBroadcastMessage({
      type: 'sms',
      senderId: settings.smsSenderId || school?.shortCode || 'SCHOOLOS',
      recipientGroup: validGroup,
      recipientCount: count,
      message,
      sentBy: currentUser?.fullName || 'School Administrator',
    });
  };

  const hasAccess = (feature: FeatureKey): boolean => {
    return checkFeatureAccess(school, feature, currentUser?.role, plans);
  };

  const resetDemoData = () => {
    const fresh = resetDatabaseToSeed();
    setDbState(fresh);
  };

  // Paystack & Subscription Management
  const updatePlatformPaystack = async (settings: Partial<PaystackPlatformConfig>): Promise<void> => {
    const updated: PaystackPlatformConfig = {
      ...(dbState.platformPaystack || INITIAL_PAYSTACK_CONFIG),
      ...settings,
      updatedAt: new Date().toISOString()
    };

    setDbState(prev => ({
      ...prev,
      platformPaystack: updated
    }));

    await fsSavePaystackConfig(updated);
    try {
      await apiSavePaystackConfig(updated);
    } catch (e) {
      console.warn('API save paystack notice:', e);
    }

    await fsAddAuditLog({
      id: `audit-${Date.now()}`,
      schoolId: 'platform-wide',
      schoolName: 'Platform Super Admin',
      userId: currentUser?.id || 'super-admin',
      userName: currentUser?.fullName || 'Super Administrator',
      userEmail: currentUser?.email || 'admin@schoolos.online',
      userRole: currentUser?.role || 'superAdmin',
      action: 'update_paystack_config',
      details: `Updated central Paystack Gateway configuration (Mode: ${updated.isLive ? 'Live' : 'Test'}).`,
      timestamp: new Date().toISOString(),
    });
  };

  const testPaystackGateway = async (secretKey?: string): Promise<{ success: boolean; message: string }> => {
    return await apiTestPaystackConnection(secretKey);
  };

  const initializeSchoolSubscription = async (params: { 
    planId?: string; 
    tierCode?: string; 
    academicYear?: string; 
    term?: string; 
    email: string; 
    phone?: string; 
    callbackUrl?: string 
  }): Promise<PaystackInitializeResponse> => {
    const targetSchoolId = school?.id || '';
    const targetSchoolName = school?.name || '';

    const result = await apiInitializePaystackTransaction({
      schoolId: targetSchoolId,
      schoolName: targetSchoolName,
      planId: params.planId || school?.planId || 'plan_basic',
      tierCode: params.tierCode || school?.subscriptionPlan || 'basic',
      academicYear: params.academicYear || school?.currentAcademicYear || '',
      term: params.term || school?.currentTerm || 'Term 1',
      email: params.email,
      phone: params.phone || school?.phone,
      callbackUrl: params.callbackUrl
    });

    // Record pending transaction locally and in Firestore
    const pendingTx: SubscriptionTransaction = {
      id: `tx-sub-${result.reference}`,
      schoolId: targetSchoolId,
      schoolName: targetSchoolName,
      schoolCode: school?.shortCode,
      planId: params.planId || school?.planId || 'plan_basic',
      tierName: result.tierName,
      academicYear: params.academicYear || school?.currentAcademicYear || '2025/2026',
      term: params.term || school?.currentTerm || 'Term 2',
      amountGHS: result.amountGHS,
      amountPesewas: result.amountPesewas,
      currency: 'GHS',
      reference: result.reference,
      status: 'pending',
      customerEmail: params.email,
      customerPhone: params.phone || school?.phone,
      customerName: currentUser?.fullName || school?.ownerName,
      receiptNumber: result.receiptNumber || `REC-${new Date().getFullYear()}-SUB-${result.reference.slice(-4)}`,
      createdAt: new Date().toISOString(),
    };

    await recordSubscriptionPayment(pendingTx);
    return result;
  };

  const generateTransactionReference = async (
    type: TransactionType = 'general',
    schoolId?: string,
    prefix?: string
  ): Promise<DynamicReferenceResponse> => {
    return await apiGenerateDynamicReference(type, schoolId || activeSchoolId, prefix);
  };

  const initializeStudentFeePayment = async (
    params: PaystackFeeInitializeParams
  ): Promise<PaystackFeeInitializeResponse> => {
    return await apiInitializePaystackFeeTransaction({
      ...params,
      schoolId: params.schoolId || activeSchoolId,
      schoolName: params.schoolName || school?.name
    });
  };

  const verifySchoolSubscription = async (reference: string): Promise<PaystackVerifyResponse> => {
    const result = await apiVerifyPaystackTransaction(reference);

    if (result.success && (result.status === 'success' || (result as any).status === 'paid')) {
      const targetSchoolId = school?.id || result.schoolId || '';
      const planId = `plan_${(result.tierName || 'basic').toLowerCase()}`;
      const academicYear = (result as any).academicYear || school?.currentAcademicYear || '2025/2026';
      const term = (result as any).term || school?.currentTerm || 'Term 2';

      // Update school subscription expiration in Firestore and state
      if (targetSchoolId) {
        await fsRenewSchoolSubscription(
          targetSchoolId,
          planId,
          term,
          academicYear,
          result.amountGHS,
          reference
        );

        setDbState(prev => {
          const nextExpiry = new Date();
          nextExpiry.setDate(nextExpiry.getDate() + 120);

          return {
            ...prev,
            schools: prev.schools.map(s => {
              if (s.id === targetSchoolId) {
                return {
                  ...s,
                  status: 'active',
                  planId: planId,
                  subscriptionPlan: (result.tierName || 'basic').toLowerCase(),
                  subscriptionExpiry: nextExpiry.toISOString().split('T')[0],
                  currentTerm: term as any,
                  currentAcademicYear: academicYear,
                  updatedAt: new Date().toISOString()
                };
              }
              return s;
            })
          };
        });
      }

      // Update local transaction state
      const matchingTx = (dbState.subscriptionTransactions || []).find(t => t.reference === reference);
      if (matchingTx) {
        const updatedTx: SubscriptionTransaction = {
          ...matchingTx,
          status: 'success',
          paidAt: result.paidAt || new Date().toISOString(),
          paymentChannel: result.paymentChannel || 'mobile_money',
          receiptNumber: result.receiptNumber || matchingTx.receiptNumber,
          gatewayResponse: 'Payment Successful',
          updatedAt: new Date().toISOString()
        };
        await fsUpdateSubscriptionTransaction(matchingTx.id, updatedTx);

        setDbState(prev => ({
          ...prev,
          subscriptionTransactions: (prev.subscriptionTransactions || []).map(t => t.id === matchingTx.id ? updatedTx : t)
        }));
      }

      await fsAddAuditLog({
        id: `audit-${Date.now()}`,
        schoolId: targetSchoolId || 'platform',
        schoolName: school?.name || '',
        userId: currentUser?.id || 'system',
        userName: currentUser?.fullName || '',
        userEmail: currentUser?.email || '',
        userRole: currentUser?.role || 'schoolOwner',
        action: 'paystack_subscription_renewed',
        details: `Successfully paid GH₵${result.amountGHS} for ${result.tierName || 'Platform'} subscription (${term}). Reference: ${reference}.`,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  };

  const recordSubscriptionPayment = async (tx: SubscriptionTransaction): Promise<void> => {
    setDbState(prev => ({
      ...prev,
      subscriptionTransactions: [tx, ...(prev.subscriptionTransactions || []).filter(t => t.id !== tx.id)]
    }));

    await fsRecordSubscriptionTransaction(tx);
  };

  const triggerTermRenewalReminders = async (academicYear?: string, term?: string): Promise<SubscriptionReminderResult> => {
    const result = await apiTriggerSubscriptionReminders(
      dbState.schools, 
      academicYear || '2025/2026', 
      term || 'Term 2'
    );

    await fsAddAuditLog({
      id: `audit-${Date.now()}`,
      schoolId: 'platform-wide',
      schoolName: 'Platform Super Admin',
      userId: currentUser?.id || 'super-admin',
      userName: currentUser?.fullName || 'Super Administrator',
      userEmail: currentUser?.email || 'admin@schoolos.online',
      userRole: currentUser?.role || 'superAdmin',
      action: 'dispatch_term_subscription_reminders',
      details: `Dispatched automated SMS renewal reminders to ${result.remindersSent} schools with active contact numbers.`,
      timestamp: new Date().toISOString(),
    });

    return result;
  };

  return (
    <SchoolContext.Provider
      value={{
        school,
        allSchools: dbState.schools,
        plans,
        students,
        allSchoolStudents,
        teachers,
        classrooms,
        subjects,
        attendance,
        examinations,
        results,
        examResults: results,
        feeStructures,
        feePayments,
        storeItems,
        posTransactions,
        posSales: posTransactions,
        messages,
        auditLogs,
        communicationLogs: (dbState.communicationLogs || []).filter(c => currentUser?.role === 'superAdmin' || c.schoolId === activeSchoolId),
        allCommunicationLogs: dbState.communicationLogs || [],
        subscriptionTransactions: (dbState.subscriptionTransactions || []).filter(t => currentUser?.role === 'superAdmin' || t.schoolId === activeSchoolId),
        allSubscriptionTransactions: dbState.subscriptionTransactions || [],
        settings,
        schoolUsers,
        allUsers: allUsersList,

        hasAccess,

        addStudent,
        updateStudent,
        deleteStudent,
        linkStudentToParent,
        unlinkStudentFromParent,
        repairParentStudentLinks,

        addTeacher,
        updateTeacher,
        deleteTeacher,

        addClassroom,
        updateClassroom,

        addSubject,

        markAttendance,
        markAttendanceBulk,
        getAttendanceForDate,

        addExamination,
        saveResults,
        recordExamResult,
        generateTerminalReport,

        promoteStudents,
        executePromotion,

        addFeeStructure,
        recordFeePayment,
        getStudentFeeSummaries,

        addStoreItem,
        updateStoreItem,
        updateStoreStock,
        processPOSTransaction,
        processPOSSale,

        sendBroadcastMessage,
        sendSMSBroadcast,
        sendDirectCommunication,

        approveSchool,
        rejectSchool,
        suspendSchool,
        updateAnySchool,
        updateSchoolSubscription,
        createPlan,
        updatePlan,
        deletePlan,
        setSchoolFeatureOverride,
        assignSchoolPlan,

        platformPaystack: dbState.platformPaystack || INITIAL_PAYSTACK_CONFIG,
        updatePlatformPaystack,
        testPaystackGateway,
        initializeSchoolSubscription,
        verifySchoolSubscription,
        recordSubscriptionPayment,
        triggerTermRenewalReminders,
        generateTransactionReference,
        initializeStudentFeePayment,

        createUserAccount,
        updateUserAccount,
        deleteUserAccount,

        updateSettings,
        updateSchoolInfo,
        platformCommunication: dbState.platformCommunication || INITIAL_PLATFORM_COMMUNICATION,
        updatePlatformCommunication,
        resetDemoData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
