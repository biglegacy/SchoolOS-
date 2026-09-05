import { Student, Teacher, UserProfile, UserRole } from '../../types';

export interface ParentCandidate {
  parentId: string; // Unique identifier for candidate (e.g., phone or generated)
  fullName: string;
  phone: string;
  email: string;
  relationship: string;
  assignedStudentIds: string[];
  assignedStudents: { id: string; name: string; admissionNumber: string; classroomName: string }[];
  existingPortalUser?: UserProfile;
}

export interface TeacherCandidate {
  teacherId: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  assignedClasses: string[];
  existingPortalUser?: UserProfile;
}

export interface StudentCandidate {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  classroomName: string;
  level: string;
  guardianName?: string;
  guardianPhone?: string;
  existingPortalUser?: UserProfile;
}

/**
 * Generates a strong random alphanumeric password
 */
export const generateRandomPassword = (length = 9): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#%';
  
  let result = '';
  result += upper.charAt(Math.floor(Math.random() * upper.length));
  result += lower.charAt(Math.floor(Math.random() * lower.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));
  result += special.charAt(Math.floor(Math.random() * special.length));
  
  const allChars = upper + lower + digits + special;
  for (let i = 4; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle characters
  return result.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Cross-browser clipboard copy with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // continue to fallback
  }
  
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
};

/**
 * Normalizes phone numbers for WhatsApp / SMS messaging (defaulting to Ghana +233)
 */
export const normalizePhoneForMessaging = (rawPhone?: string): string => {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  
  // Ghana local format: e.g., 024XXXXXXX -> 23324XXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    return '233' + digits.slice(1);
  }
  // Already international format: e.g. 233XXXXXXXXX
  if (digits.startsWith('233') && digits.length >= 12) {
    return digits;
  }
  return digits;
};

/**
 * Constructs a professional Ghana school portal invitation notice
 */
export const buildCredentialMessage = (
  schoolName: string,
  portalUrl: string,
  user: {
    fullName: string;
    role: string;
    emailOrUsername: string;
    password?: string;
    linkedStudentsSummary?: string;
  }
): string => {
  const roleTitle = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  
  let msg = `Dear ${user.fullName},\n\n`;
  msg += `Your ${roleTitle} Portal account for ${schoolName} has been generated.\n\n`;
  msg += `Portal Login Access:\n`;
  msg += `• Portal Website: ${portalUrl}\n`;
  msg += `• Username / Email: ${user.emailOrUsername}\n`;
  if (user.password) {
    msg += `• Temporary Password: ${user.password}\n`;
  }
  msg += `• Access Role: ${roleTitle}\n`;
  
  if (user.linkedStudentsSummary) {
    msg += `• Assigned Student Ward(s): ${user.linkedStudentsSummary}\n`;
  }
  
  msg += `\nPlease log in to access your portal dashboard. We advise changing your temporary password upon first login.\n\n`;
  msg += `Best regards,\n${schoolName} Administration`;
  
  return msg;
};

/**
 * Derives parent candidates from student guardian rosters.
 * GUARANTEE: Each parent candidate is linked ONLY to their assigned student wards.
 */
export const getParentCandidates = (
  students: Student[],
  schoolUsers: UserProfile[]
): ParentCandidate[] => {
  const parentMap = new Map<string, ParentCandidate>();
  const parentUsers = schoolUsers.filter(u => u.role === 'parent');

  students.forEach(student => {
    // 1. Check primary guardians array
    const studentGuardians = Array.isArray(student.guardians) ? student.guardians : [];
    
    // Also consider legacy fields if guardians array is empty
    const guardianSources = studentGuardians.length > 0
      ? studentGuardians
      : (student.emergencyContact?.name
          ? [{
              name: student.emergencyContact.name,
              relationship: 'Guardian' as const,
              phone: student.emergencyContact.phone || '',
              email: ''
            }]
          : []);

    guardianSources.forEach(g => {
      const gName = (g.name || '').trim();
      const gPhone = (g.phone || '').trim();
      if (!gName && !gPhone) return;

      // Group key: Prefer phone if available, otherwise lowercase name
      const key = gPhone 
        ? gPhone.replace(/[^0-9]/g, '') 
        : gName.toLowerCase();

      if (!parentMap.has(key)) {
        // Check if an existing portal user matches this parent
        const matchedUser = parentUsers.find(u => {
          if (gPhone && u.phone && u.phone.replace(/[^0-9]/g, '') === gPhone.replace(/[^0-9]/g, '')) {
            return true;
          }
          if (g.email && u.email?.toLowerCase() === g.email.toLowerCase()) {
            return true;
          }
          if (u.linkedStudentIds && u.linkedStudentIds.includes(student.id)) {
            return true;
          }
          return false;
        });

        parentMap.set(key, {
          parentId: matchedUser?.id || `parent_cand_${key}`,
          fullName: gName || (matchedUser ? matchedUser.fullName : 'Parent / Guardian'),
          phone: gPhone || matchedUser?.phone || '',
          email: g.email || matchedUser?.email || '',
          relationship: g.relationship || 'Guardian',
          assignedStudentIds: [student.id],
          assignedStudents: [{
            id: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            admissionNumber: student.admissionNumber || '',
            classroomName: student.classroomName || ''
          }],
          existingPortalUser: matchedUser
        });
      } else {
        const existing = parentMap.get(key)!;
        if (!existing.assignedStudentIds.includes(student.id)) {
          existing.assignedStudentIds.push(student.id);
          existing.assignedStudents.push({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            admissionNumber: student.admissionNumber || '',
            classroomName: student.classroomName || ''
          });
        }
      }
    });
  });

  // Also include any registered parent users who might not have matched the student loop
  parentUsers.forEach(u => {
    const alreadyFound = Array.from(parentMap.values()).some(p => p.existingPortalUser?.id === u.id);
    if (!alreadyFound) {
      const assigned = (u.linkedStudentIds || []).map(sId => {
        const s = students.find(item => item.id === sId);
        return {
          id: sId,
          name: s ? `${s.firstName} ${s.lastName}`.trim() : sId,
          admissionNumber: s?.admissionNumber || '',
          classroomName: s?.classroomName || ''
        };
      });

      parentMap.set(`user_${u.id}`, {
        parentId: u.id,
        fullName: u.fullName,
        phone: u.phone || '',
        email: u.email,
        relationship: 'Parent / Guardian',
        assignedStudentIds: u.linkedStudentIds || [],
        assignedStudents: assigned,
        existingPortalUser: u
      });
    }
  });

  return Array.from(parentMap.values());
};

/**
 * Derives teacher candidates from school teachers roster
 */
export const getTeacherCandidates = (
  teachers: Teacher[],
  schoolUsers: UserProfile[]
): TeacherCandidate[] => {
  const teacherUsers = schoolUsers.filter(u => u.role === 'teacher');

  return teachers.map(teacher => {
    const matchedUser = teacherUsers.find(u => 
      u.teacherId === teacher.id || 
      u.id === teacher.userId ||
      (teacher.email && u.email?.toLowerCase() === teacher.email.toLowerCase()) ||
      (teacher.phone && u.phone && u.phone.replace(/[^0-9]/g, '') === teacher.phone.replace(/[^0-9]/g, ''))
    );

    const assignedClassList: string[] = [];
    if (teacher.assignedClassroomName) {
      assignedClassList.push(teacher.assignedClassroomName);
    }
    if (Array.isArray(teacher.assignedSubjects)) {
      teacher.assignedSubjects.forEach(as => {
        if (as.classroomName && !assignedClassList.includes(as.classroomName)) {
          assignedClassList.push(as.classroomName);
        }
      });
    }

    return {
      teacherId: teacher.id,
      staffId: teacher.staffId || 'STAFF',
      fullName: `${teacher.firstName} ${teacher.lastName}`.trim(),
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.qualification || 'Teacher',
      assignedClasses: assignedClassList,
      existingPortalUser: matchedUser
    };
  });
};

/**
 * Derives student candidates from school student admissions roster
 */
export const getStudentCandidates = (
  students: Student[],
  schoolUsers: UserProfile[]
): StudentCandidate[] => {
  const studentUsers = schoolUsers.filter(u => u.role === 'student');

  return students.map(student => {
    const matchedUser = studentUsers.find(u => 
      u.studentId === student.id || 
      (student.admissionNumber && (
        u.username?.toLowerCase() === student.admissionNumber.toLowerCase() ||
        u.email?.toLowerCase().startsWith(student.admissionNumber.toLowerCase() + '@')
      ))
    );

    const primaryGuardian = Array.isArray(student.guardians) && student.guardians.length > 0
      ? student.guardians[0]
      : undefined;

    return {
      studentId: student.id,
      admissionNumber: student.admissionNumber || '',
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      classroomName: student.classroomName || 'Unassigned',
      level: student.level || '',
      guardianName: primaryGuardian?.name || student.emergencyContact?.name,
      guardianPhone: primaryGuardian?.phone || student.emergencyContact?.phone,
      existingPortalUser: matchedUser
    };
  });
};
