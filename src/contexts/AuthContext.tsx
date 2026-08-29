import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, School } from '../types';
import { loadInitialDatabase, DatabaseState, saveDatabase } from '../lib/storageService';
import { 
  seedFirestoreIfEmpty, 
  subscribeToFirestore, 
  fsRegisterSchool, 
  fsUpdateUser 
} from '../lib/firestoreService';

export interface LoginResult {
  success: boolean;
  error?: 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'INVALID';
  message?: string;
  schoolName?: string;
  role?: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  currentSchool: School | null;
  impersonatedSchoolId: string | null;
  allSchools: School[];
  allUsers: UserProfile[];
  login: (emailOrUsername: string, password?: string) => Promise<LoginResult> | LoginResult;
  logout: () => void;
  registerSchool: (
    schoolData: Partial<School>, 
    ownerData: { name: string; email: string; phone: string; password?: string }
  ) => Promise<{ success: boolean; message: string; schoolId?: string }>;
  impersonateSchool: (schoolId: string | null) => void;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  syncStateFromStorage: () => void;
  isFirestoreLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState<DatabaseState>(() => loadInitialDatabase());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('schoolos_current_user_id') || null;
  });
  const [impersonatedSchoolId, setImpersonatedSchoolId] = useState<string | null>(null);
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);

  // Initialize and subscribe to Cloud Firestore
  useEffect(() => {
    let isMounted = true;

    // Seed Firestore if first launch
    seedFirestoreIfEmpty().then(() => {
      if (isMounted) setIsFirestoreLive(true);
    });

    // Real-time Firestore subscription
    const unsubscribe = subscribeToFirestore((incoming) => {
      setDbState(prev => {
        const next = { ...prev, ...incoming };
        saveDatabase(next); // Cache for instant startup
        return next;
      });
      if (isMounted) setIsFirestoreLive(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const syncStateFromStorage = () => {
    const updated = loadInitialDatabase();
    setDbState(updated);
  };

  const currentUser = currentUserId 
    ? dbState.users.find(u => u.id === currentUserId || u.email?.toLowerCase() === currentUserId?.toLowerCase()) || null 
    : null;

  const targetSchoolId = (currentUser?.role === 'superAdmin' && impersonatedSchoolId)
    ? impersonatedSchoolId
    : currentUser?.schoolId;

  const currentSchool = targetSchoolId 
    ? dbState.schools.find(s => s.id === targetSchoolId) || null
    : null;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('schoolos_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('schoolos_current_user_id');
      setImpersonatedSchoolId(null);
    }
  }, [currentUser]);

  const impersonateSchool = (schoolId: string | null) => {
    setImpersonatedSchoolId(schoolId);
  };

  const login = (emailOrUsername: string, password?: string): LoginResult => {
    const cleanQuery = (emailOrUsername || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check for Super Admin account
    if (cleanQuery === 'su@admin' || cleanQuery === 'superadmin') {
      if (cleanPassword !== 'suadmin123') {
        return {
          success: false,
          error: 'INVALID',
          message: 'Invalid credentials. Please verify your username and password.'
        };
      }
      
      let suUser = dbState.users.find(u => u.email.toLowerCase() === 'su@admin' || u.role === 'superAdmin');
      if (!suUser) {
        suUser = {
          id: 'user_superadmin_01',
          uid: 'auth_superadmin_01',
          email: 'su@admin',
          password: 'suadmin123',
          fullName: 'System Super Administrator',
          role: 'superAdmin',
          phone: '+233 20 000 0001',
          createdAt: new Date().toISOString(),
        };
        const nextState = { ...dbState, users: [suUser, ...dbState.users] };
        setDbState(nextState);
        saveDatabase(nextState);
      }

      setCurrentUserId(suUser.id);
      return { success: true, role: 'superAdmin' };
    }

    // Find matching user in database (Firestore synced)
    const targetUser = dbState.users.find(u => 
      u.email?.toLowerCase() === cleanQuery || 
      (u.username && u.username.toLowerCase() === cleanQuery) ||
      u.id?.toLowerCase() === cleanQuery ||
      (u.teacherId && u.teacherId.toLowerCase() === cleanQuery) ||
      (u.studentId && u.studentId.toLowerCase() === cleanQuery)
    );

    if (!targetUser) {
      return {
        success: false,
        error: 'INVALID',
        message: 'Invalid credentials. Please verify your username/email and password.'
      };
    }

    // Check if user account is deactivated
    if (targetUser.status === 'inactive') {
      return {
        success: false,
        error: 'SUSPENDED',
        message: 'Your user account has been deactivated by the school administrator. Please contact your school.'
      };
    }

    // Validate password if user has one stored
    if (targetUser.password && targetUser.password !== cleanPassword) {
      return {
        success: false,
        error: 'INVALID',
        message: 'Invalid email or password. Please try again.'
      };
    }

    // If user is Super Admin
    if (targetUser.role === 'superAdmin') {
      setCurrentUserId(targetUser.id);
      return { success: true, role: 'superAdmin' };
    }

    // If user belongs to a school, enforce approval and active status from Firestore
    if (targetUser.schoolId) {
      const userSchool = dbState.schools.find(s => s.id === targetUser.schoolId);

      if (!userSchool) {
        return {
          success: false,
          error: 'INVALID',
          message: 'The educational institution associated with this account could not be found.'
        };
      }

      if (userSchool.status === 'pending') {
        return {
          success: false,
          error: 'PENDING',
          schoolName: userSchool.name,
          message: `Your school registration for ${userSchool.name} is currently awaiting Super Admin approval. Full portal access will be unlocked once approved.`
        };
      }

      if (userSchool.status === 'rejected') {
        return {
          success: false,
          error: 'REJECTED',
          schoolName: userSchool.name,
          message: `The registration for ${userSchool.name} was declined. Please contact platform support.`
        };
      }

      if (userSchool.status === 'suspended') {
        return {
          success: false,
          error: 'SUSPENDED',
          schoolName: userSchool.name,
          message: `Account access for ${userSchool.name} has been suspended by Platform Administration.`
        };
      }
    }

    // Account is approved and active
    setCurrentUserId(targetUser.id);
    return { success: true, role: targetUser.role };
  };

  const logout = () => {
    setCurrentUserId(null);
    setImpersonatedSchoolId(null);
    localStorage.removeItem('schoolos_current_user_id');
  };

  const updateCurrentUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...data };
    
    // Update local state
    const updatedUsers = dbState.users.map(u => u.id === currentUser.id ? updatedUser : u);
    const nextState = { ...dbState, users: updatedUsers };
    setDbState(nextState);
    saveDatabase(nextState);

    // Sync to Cloud Firestore
    await fsUpdateUser(currentUser.id, data);
  };

  const registerSchool = async (
    schoolData: Partial<School>, 
    ownerData: { name: string; email: string; phone: string; password?: string }
  ): Promise<{ success: boolean; message: string; schoolId?: string }> => {
    const schoolId = `school_${Date.now()}`;
    const ownerId = `user_${Date.now()}`;

    const newSchool: School = {
      id: schoolId,
      name: schoolData.name || 'New Educational Institution',
      shortCode: (schoolData.shortCode || (schoolData.name || 'SCH').slice(0, 4)).toUpperCase(),
      logo: schoolData.logo || '', // Do not automatically assign a logo; leave empty until School Owner uploads
      motto: schoolData.motto || 'Knowledge, Discipline and Excellence',
      address: schoolData.address || 'Accra, Ghana',
      district: schoolData.district || 'Ga East Municipal',
      region: schoolData.region || 'Greater Accra',
      phone: schoolData.phone || ownerData.phone,
      email: schoolData.email || ownerData.email,
      website: schoolData.website || '',
      registrationNumber: schoolData.registrationNumber || `GES/REG/${Date.now().toString().slice(-5)}`,
      status: 'pending', // Awaiting Super Admin approval
      subscriptionPlan: schoolData.subscriptionPlan || 'basic',
      planId: schoolData.planId || 'plan_basic',
      subscriptionExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      featureOverrides: {},
      ownerId,
      ownerName: ownerData.name,
      ownerEmail: ownerData.email,
      ownerPhone: ownerData.phone,
      currentAcademicYear: '2026/2027',
      currentTerm: 'Term 3',
      currency: 'GHS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newOwner: UserProfile = {
      id: ownerId,
      uid: `auth_${ownerId}`,
      email: ownerData.email.trim(),
      username: ownerData.email.trim(),
      password: ownerData.password || 'password123',
      fullName: ownerData.name.trim(),
      role: 'schoolOwner',
      status: 'active',
      schoolId,
      schoolName: newSchool.name,
      phone: ownerData.phone.trim(),
      createdAt: new Date().toISOString(),
    };

    const newAuditLog = {
      id: `log_${Date.now()}`,
      schoolId,
      schoolName: newSchool.name,
      userId: ownerId,
      userEmail: ownerData.email,
      userRole: 'schoolOwner' as UserRole,
      action: 'SCHOOL_REGISTRATION_SUBMITTED',
      details: `School registration submitted for ${newSchool.name}. Status: Pending Super Admin Approval.`,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update local state
    const nextState: DatabaseState = {
      ...dbState,
      schools: [newSchool, ...dbState.schools],
      users: [newOwner, ...dbState.users],
      auditLogs: [newAuditLog, ...dbState.auditLogs],
    };

    setDbState(nextState);
    saveDatabase(nextState);

    // Save directly into Cloud Firestore as single source of truth
    await fsRegisterSchool(newSchool, newOwner, newAuditLog);

    return {
      success: true,
      message: 'Your school registration has been submitted and is awaiting approval by Super Admin.',
      schoolId
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSchool,
        impersonatedSchoolId,
        allSchools: dbState.schools,
        allUsers: dbState.users,
        login,
        logout,
        registerSchool,
        impersonateSchool,
        updateCurrentUserProfile,
        syncStateFromStorage,
        isFirestoreLive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
