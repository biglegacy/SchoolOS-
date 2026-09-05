import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  School, 
  Student, 
  Teacher, 
  UserRole 
} from '../../types';
import { 
  X, 
  Search, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  GraduationCap, 
  HeartHandshake, 
  User, 
  Check, 
  Copy, 
  Send, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle, 
  Building2, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  SlidersHorizontal,
  Power,
  Trash2
} from 'lucide-react';
import { 
  ParentCandidate, 
  TeacherCandidate, 
  StudentCandidate, 
  generateRandomPassword,
  copyToClipboard
} from './portalUtils';

interface GeneratePortalsModalProps {
  school: School | null;
  teachers: Teacher[];
  students: Student[];
  schoolUsers: UserProfile[];
  parentCandidates: ParentCandidate[];
  teacherCandidates: TeacherCandidate[];
  studentCandidates: StudentCandidate[];
  onClose: () => void;
  onCreateAccount: (userData: Omit<UserProfile, 'id' | 'uid' | 'createdAt'>, password?: string) => Promise<UserProfile>;
  onViewDetails: (user: UserProfile) => void;
  onCopyCredentials: (user: UserProfile) => void;
  onOpenSendCredentials: (user: UserProfile) => void;
  onRegeneratePassword: (user: UserProfile) => Promise<void>;
  onToggleStatus?: (user: UserProfile) => Promise<void>;
  onDeleteUser?: (user: UserProfile) => void;
  onToast: (msg: string) => void;
  initialTab?: 'parents' | 'teachers' | 'students' | 'custom';
}

export const GeneratePortalsModal: React.FC<GeneratePortalsModalProps> = ({
  school,
  teachers,
  students,
  schoolUsers,
  parentCandidates,
  teacherCandidates,
  studentCandidates,
  onClose,
  onCreateAccount,
  onViewDetails,
  onCopyCredentials,
  onOpenSendCredentials,
  onRegeneratePassword,
  onToggleStatus,
  onDeleteUser,
  onToast,
  initialTab = 'parents'
}) => {
  const [activeTab, setActiveTab] = useState<'parents' | 'teachers' | 'students' | 'custom'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unregistered' | 'registered'>('all');
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  // Custom Form State
  const [customForm, setCustomForm] = useState<{
    fullName: string;
    email: string;
    username: string;
    phone: string;
    role: UserRole;
    password: string;
    status: 'active' | 'inactive';
    teacherId: string;
    studentId: string;
    linkedStudentIds: string[];
  }>({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    role: 'parent',
    password: generateRandomPassword(),
    status: 'active',
    teacherId: '',
    studentId: '',
    linkedStudentIds: []
  });
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  // Filtered Parents
  const filteredParents = useMemo(() => {
    return parentCandidates.filter(p => {
      const matchesSearch = 
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.assignedStudents.some(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const isRegistered = !!p.existingPortalUser;
      if (statusFilter === 'unregistered') return matchesSearch && !isRegistered;
      if (statusFilter === 'registered') return matchesSearch && isRegistered;
      return matchesSearch;
    });
  }, [parentCandidates, searchQuery, statusFilter]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teacherCandidates.filter(t => {
      const matchesSearch = 
        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase());

      const isRegistered = !!t.existingPortalUser;
      if (statusFilter === 'unregistered') return matchesSearch && !isRegistered;
      if (statusFilter === 'registered') return matchesSearch && isRegistered;
      return matchesSearch;
    });
  }, [teacherCandidates, searchQuery, statusFilter]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentCandidates.filter(s => {
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classroomName.toLowerCase().includes(searchQuery.toLowerCase());

      const isRegistered = !!s.existingPortalUser;
      if (statusFilter === 'unregistered') return matchesSearch && !isRegistered;
      if (statusFilter === 'registered') return matchesSearch && isRegistered;
      return matchesSearch;
    });
  }, [studentCandidates, searchQuery, statusFilter]);

  // 1-Click Generate Action for a Parent
  const handleGenerateParent = async (candidate: ParentCandidate) => {
    const key = `parent_${candidate.parentId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const phoneDigits = candidate.phone.replace(/[^0-9]/g, '');
      const loginEmail = candidate.email || (phoneDigits ? `parent.${phoneDigits}@portal.schoolos` : `parent.${Date.now()}@portal.schoolos`);
      const username = candidate.phone || candidate.fullName.toLowerCase().replace(/\s+/g, '.');

      // STRICT REQUIREMENT 3: Link ONLY assigned student wards of this parent!
      const user = await onCreateAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.phone,
        role: 'parent',
        status: 'active',
        schoolId: school?.id,
        schoolName: school?.name,
        linkedStudentIds: candidate.assignedStudentIds // Strictly scoped
      }, password);

      onToast(`Generated Parent Portal for ${candidate.fullName}`);
      onViewDetails(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate parent portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 1-Click Generate Action for a Teacher
  const handleGenerateTeacher = async (candidate: TeacherCandidate) => {
    const key = `teacher_${candidate.teacherId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const staffCode = candidate.staffId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `staff${Date.now()}`;
      const loginEmail = candidate.email || `${staffCode}@teacher.${(school?.shortCode || 'school').toLowerCase()}.edu.gh`;
      const username = candidate.staffId || candidate.fullName.toLowerCase().replace(/\s+/g, '.');

      // STRICT REQUIREMENT 4: Correct teacher ID and schoolId
      const user = await onCreateAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.phone,
        role: 'teacher',
        status: 'active',
        schoolId: school?.id,
        schoolName: school?.name,
        teacherId: candidate.teacherId // Bound to teacher ID
      }, password);

      onToast(`Generated Teacher Portal for ${candidate.fullName}`);
      onViewDetails(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate teacher portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 1-Click Generate Action for a Student
  const handleGenerateStudent = async (candidate: StudentCandidate) => {
    const key = `student_${candidate.studentId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const admCode = candidate.admissionNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `std${Date.now()}`;
      const loginEmail = `${admCode}@student.${(school?.shortCode || 'school').toLowerCase()}.edu.gh`;
      const username = candidate.admissionNumber || admCode;

      // STRICT REQUIREMENT 5: Correct student ID and schoolId
      const user = await onCreateAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.guardianPhone || '',
        role: 'student',
        status: 'active',
        schoolId: school?.id,
        schoolName: school?.name,
        studentId: candidate.studentId // Bound to student ID
      }, password);

      onToast(`Generated Student Portal for ${candidate.fullName}`);
      onViewDetails(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate student portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Pre-fill Custom Form with Candidate info
  const handleCustomizeParent = (candidate: ParentCandidate) => {
    setCustomForm({
      fullName: candidate.fullName,
      email: candidate.email || (candidate.phone ? `parent.${candidate.phone.replace(/[^0-9]/g, '')}@portal.schoolos` : ''),
      username: candidate.phone || candidate.fullName.toLowerCase().replace(/\s+/g, '.'),
      phone: candidate.phone,
      role: 'parent',
      password: generateRandomPassword(),
      status: 'active',
      teacherId: '',
      studentId: '',
      linkedStudentIds: candidate.assignedStudentIds
    });
    setActiveTab('custom');
  };

  const handleCustomizeTeacher = (candidate: TeacherCandidate) => {
    setCustomForm({
      fullName: candidate.fullName,
      email: candidate.email || `${candidate.staffId.toLowerCase()}@teacher.portal`,
      username: candidate.staffId,
      phone: candidate.phone,
      role: 'teacher',
      password: generateRandomPassword(),
      status: 'active',
      teacherId: candidate.teacherId,
      studentId: '',
      linkedStudentIds: []
    });
    setActiveTab('custom');
  };

  const handleCustomizeStudent = (candidate: StudentCandidate) => {
    setCustomForm({
      fullName: candidate.fullName,
      email: `${candidate.admissionNumber.toLowerCase()}@student.portal`,
      username: candidate.admissionNumber,
      phone: candidate.guardianPhone || '',
      role: 'student',
      password: generateRandomPassword(),
      status: 'active',
      teacherId: '',
      studentId: candidate.studentId,
      linkedStudentIds: []
    });
    setActiveTab('custom');
  };

  // Custom Form Submission
  const handleCustomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.fullName.trim() || !customForm.email.trim()) {
      alert("Please provide at least a full name and email/username.");
      return;
    }

    setActionLoadingKey('custom_submit');
    try {
      const emailOrUser = customForm.email.trim();
      const user = await onCreateAccount({
        fullName: customForm.fullName.trim(),
        email: emailOrUser,
        username: customForm.username.trim() || emailOrUser,
        phone: customForm.phone.trim(),
        role: customForm.role,
        status: customForm.status,
        schoolId: school?.id,
        schoolName: school?.name,
        teacherId: customForm.role === 'teacher' ? customForm.teacherId : undefined,
        studentId: customForm.role === 'student' ? customForm.studentId : undefined,
        linkedStudentIds: customForm.role === 'parent' ? customForm.linkedStudentIds : undefined,
      }, customForm.password.trim() || 'password123');

      onToast(`Created portal login account for ${customForm.fullName}`);
      onViewDetails(user);
    } catch (err: any) {
      console.error(err);
      alert(`Error creating portal account: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Count ungenerated
  const unregParentsCount = parentCandidates.filter(p => !p.existingPortalUser).length;
  const unregTeachersCount = teacherCandidates.filter(t => !t.existingPortalUser).length;
  const unregStudentsCount = studentCandidates.filter(s => !s.existingPortalUser).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Generate Portals</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {school?.name || 'SchoolOS'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generate authenticated portal access for Parents, Teachers, Students, and School Staff.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Categories Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('parents'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'parents'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Parents</span>
            {unregParentsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'parents' ? 'bg-pink-800 text-white' : 'bg-pink-100 text-pink-700'
              }`}>
                {unregParentsCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Teachers</span>
            {unregTeachersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'teachers' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {unregTeachersCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Students</span>
            {unregStudentsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'students' ? 'bg-cyan-800 text-white' : 'bg-cyan-100 text-cyan-700'
              }`}>
                {unregStudentsCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'custom'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Custom Form</span>
          </button>
        </div>

        {/* Search & Filter Toolbar (for roster tabs) */}
        {activeTab !== 'custom' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unregistered')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'unregistered' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending Only
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('registered')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === 'registered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active Only
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: PARENTS */}
        {activeTab === 'parents' && (
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {filteredParents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No parents found matching the filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredParents.map(candidate => {
                  const hasPortal = !!candidate.existingPortalUser;
                  const isLoading = actionLoadingKey === `parent_${candidate.parentId}`;

                  return (
                    <div 
                      key={candidate.parentId} 
                      className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{candidate.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                            {candidate.relationship || 'Guardian'}
                          </span>
                          {hasPortal ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full">
                              Portal Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-full">
                              Not Generated
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          {candidate.phone && <span>📞 {candidate.phone}</span>}
                          {candidate.email && <span>✉️ {candidate.email}</span>}
                        </div>

                        {/* STRICT REQUIREMENT 3: Assigned Student Wards Only */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Wards:</span>
                          {candidate.assignedStudents.map(s => (
                            <span 
                              key={s.id} 
                              className="text-[10px] bg-pink-50 border border-pink-200 text-pink-900 px-2 py-0.5 rounded-md font-medium"
                            >
                              {s.name} <span className="font-mono text-pink-700">({s.admissionNumber})</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                        {!hasPortal ? (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleGenerateParent(candidate)}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomizeParent(candidate)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Customize
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onViewDetails(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="View Portal Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onCopyCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Copy Credentials"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSendCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Send Portal Notice"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRegeneratePassword(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Regenerate Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {onToggleStatus && (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEACHERS */}
        {activeTab === 'teachers' && (
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {filteredTeachers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No teachers found matching the filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTeachers.map(candidate => {
                  const hasPortal = !!candidate.existingPortalUser;
                  const isLoading = actionLoadingKey === `teacher_${candidate.teacherId}`;

                  return (
                    <div 
                      key={candidate.teacherId} 
                      className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{candidate.fullName}</span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                            {candidate.staffId}
                          </span>
                          {hasPortal ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full">
                              Portal Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-full">
                              Not Generated
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          {candidate.phone && <span>📞 {candidate.phone}</span>}
                          {candidate.email && <span>✉️ {candidate.email}</span>}
                        </div>

                        {candidate.assignedClasses.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Streams:</span>
                            {candidate.assignedClasses.map(cls => (
                              <span 
                                key={cls} 
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                        {!hasPortal ? (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleGenerateTeacher(candidate)}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomizeTeacher(candidate)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Customize
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onViewDetails(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="View Portal Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onCopyCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Copy Credentials"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSendCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Send Portal Notice"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRegeneratePassword(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Regenerate Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {onToggleStatus && (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No students found matching the filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map(candidate => {
                  const hasPortal = !!candidate.existingPortalUser;
                  const isLoading = actionLoadingKey === `student_${candidate.studentId}`;

                  return (
                    <div 
                      key={candidate.studentId} 
                      className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{candidate.fullName}</span>
                          <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded font-bold">
                            {candidate.admissionNumber}
                          </span>
                          {hasPortal ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full">
                              Portal Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-full">
                              Not Generated
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Class: <b>{candidate.classroomName}</b></span>
                          {candidate.level && <span>Level: {candidate.level}</span>}
                          {candidate.guardianName && <span>Guardian: {candidate.guardianName}</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                        {!hasPortal ? (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleGenerateStudent(candidate)}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomizeStudent(candidate)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Customize
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onViewDetails(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="View Portal Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onCopyCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Copy Credentials"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSendCredentials(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Send Portal Notice"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRegeneratePassword(candidate.existingPortalUser!)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Regenerate Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {onToggleStatus && (
                              <button
                                type="button"
                                onClick={() => onToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CUSTOM / STAFF FORM */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomFormSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Role Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">Select Portal Role</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { role: 'parent', label: 'Parent', icon: HeartHandshake, color: 'text-pink-600' },
                  { role: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'text-emerald-600' },
                  { role: 'student', label: 'Student', icon: User, color: 'text-cyan-600' },
                  { role: 'principal', label: 'Principal', icon: ShieldCheck, color: 'text-teal-600' },
                  { role: 'accountant', label: 'Accountant', icon: Building2, color: 'text-amber-600' }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = customForm.role === item.role;

                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setCustomForm({ ...customForm, role: item.role as UserRole })}
                      className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Linking Dropdowns */}
            {customForm.role === 'teacher' && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <label className="block font-bold text-emerald-950">Link to Teacher Profile (Staff Record)</label>
                <select
                  value={customForm.teacherId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const teacher = teachers.find(t => t.id === tId);
                    setCustomForm({
                      ...customForm,
                      teacherId: tId,
                      fullName: teacher?.fullName || customForm.fullName,
                      email: teacher?.email || customForm.email,
                      phone: teacher?.phone || customForm.phone
                    });
                  }}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Existing Staff Member --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.staffId || 'Staff'}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {customForm.role === 'student' && (
              <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-1.5 text-xs">
                <label className="block font-bold text-cyan-950">Link to Student Admission Record</label>
                <select
                  value={customForm.studentId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const student = students.find(s => s.id === sId);
                    setCustomForm({
                      ...customForm,
                      studentId: sId,
                      fullName: student ? `${student.firstName} ${student.lastName}` : customForm.fullName,
                      username: student?.admissionNumber || customForm.username
                    });
                  }}
                  className="w-full p-2 bg-white border border-cyan-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Existing Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) - {s.classroomName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {customForm.role === 'parent' && (
              <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-pink-950">Link Student Wards (Only this parent's children)</label>
                  <span className="text-[10px] text-pink-800 font-bold">{customForm.linkedStudentIds.length} Selected</span>
                </div>
                <p className="text-[11px] text-pink-800">
                  Select only the specific student(s) that belong to this parent. This parent will only have access to their assigned children.
                </p>
                <div className="max-h-36 overflow-y-auto border border-pink-200 rounded-lg p-2 bg-white space-y-1">
                  {students.map(s => {
                    const isChecked = customForm.linkedStudentIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 p-1 hover:bg-pink-50 rounded cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomForm({ ...customForm, linkedStudentIds: [...customForm.linkedStudentIds, s.id] });
                            } else {
                              setCustomForm({ ...customForm, linkedStudentIds: customForm.linkedStudentIds.filter(id => id !== s.id) });
                            }
                          }}
                          className="rounded text-pink-600 focus:ring-pink-500"
                        />
                        <span className="font-semibold text-slate-800">{s.firstName} {s.lastName}</span>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">({s.admissionNumber} - {s.classroomName})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Core Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customForm.fullName}
                  onChange={(e) => setCustomForm({ ...customForm, fullName: e.target.value })}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Login Email / Address *</label>
                <input
                  type="email"
                  required
                  value={customForm.email}
                  onChange={(e) => setCustomForm({ ...customForm, email: e.target.value })}
                  placeholder="e.g. user@school.edu.gh"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Contact Phone (Ghana)</label>
                <input
                  type="tel"
                  value={customForm.phone}
                  onChange={(e) => setCustomForm({ ...customForm, phone: e.target.value })}
                  placeholder="e.g. 024 123 4567"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Login Username (Optional)</label>
                <input
                  type="text"
                  value={customForm.username}
                  onChange={(e) => setCustomForm({ ...customForm, username: e.target.value })}
                  placeholder="e.g. staff.mensah or ST-001"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Password & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setCustomForm({ ...customForm, password: generateRandomPassword() })}
                    className="text-[10px] text-teal-700 hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    required
                    value={customForm.password}
                    onChange={(e) => setCustomForm({ ...customForm, password: e.target.value })}
                    className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCustomPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Account Access Status</label>
                <select
                  value={customForm.status}
                  onChange={(e) => setCustomForm({ ...customForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                >
                  <option value="active">Active (Permitted to Log In)</option>
                  <option value="inactive">Disabled (Login Blocked)</option>
                </select>
              </div>
            </div>

            {/* Submit Toolbar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('parents')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl cursor-pointer"
              >
                Back to Roster
              </button>

              <button
                type="submit"
                disabled={actionLoadingKey === 'custom_submit'}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoadingKey === 'custom_submit' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Save & Generate Account</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
