import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  KeyRound, 
  ShieldCheck, 
  GraduationCap, 
  HeartHandshake, 
  UserCheck, 
  Lock, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Sparkles,
  Building2,
  AlertCircle,
  Calculator,
  User,
  Send,
  Share2,
  Power,
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { 
  getParentCandidates, 
  getTeacherCandidates, 
  getStudentCandidates,
  generateRandomPassword,
  copyToClipboard
} from './portalUtils';
import { GeneratePortalsModal } from './GeneratePortalsModal';
import { PortalDetailsModal } from './PortalDetailsModal';
import { SendCredentialsModal } from './SendCredentialsModal';

export const SchoolOwnerPortalsView: React.FC = () => {
  const { 
    school, 
    schoolUsers, 
    students, 
    allSchoolStudents, 
    teachers, 
    createUserAccount, 
    updateUserAccount, 
    deleteUserAccount, 
    repairParentStudentLinks 
  } = useSchool();
  const { currentUser, impersonatedSchoolId } = useAuth();

  // Active School ID Check (ensures multi-tenant and superAdmin impersonation isolation)
  const targetSchoolId = (currentUser?.role === 'superAdmin' && impersonatedSchoolId) 
    ? impersonatedSchoolId 
    : school?.id || currentUser?.schoolId;

  const canManagePortals = currentUser?.role === 'schoolOwner' || 
    currentUser?.role === 'principal' || 
    currentUser?.role === 'superAdmin';

  const availableStudents = allSchoolStudents || students || [];

  // Main UI Mode
  const [viewMode, setViewMode] = useState<'active' | 'generate_roster'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [rosterTab, setRosterTab] = useState<'parents' | 'teachers' | 'students'>('parents');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateModalInitialTab, setGenerateModalInitialTab] = useState<'parents' | 'teachers' | 'students' | 'custom'>('parents');
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [sendCredentialsUser, setSendCredentialsUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // States
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Derive Roster Candidates
  const parentCandidates = useMemo(() => {
    return getParentCandidates(availableStudents, schoolUsers);
  }, [availableStudents, schoolUsers]);

  const teacherCandidates = useMemo(() => {
    return getTeacherCandidates(teachers, schoolUsers);
  }, [teachers, schoolUsers]);

  const studentCandidates = useMemo(() => {
    return getStudentCandidates(availableStudents, schoolUsers);
  }, [availableStudents, schoolUsers]);

  // Ungenerated counts
  const unregParentsCount = parentCandidates.filter(p => !p.existingPortalUser).length;
  const unregTeachersCount = teacherCandidates.filter(t => !t.existingPortalUser).length;
  const unregStudentsCount = studentCandidates.filter(s => !s.existingPortalUser).length;
  const unregTotalCount = unregParentsCount + unregTeachersCount + unregStudentsCount;

  // Active Users Filter
  const filteredUsers = useMemo(() => {
    return schoolUsers.filter(u => {
      const matchesSearch = 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone && u.phone.includes(searchTerm));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && u.status !== 'inactive') ||
        (statusFilter === 'inactive' && u.status === 'inactive');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [schoolUsers, searchTerm, roleFilter, statusFilter]);

  // ACTION: Copy Credentials
  const handleCopyCredentials = async (user: UserProfile) => {
    const credText = 
      `School: ${school?.name || 'SchoolOS'}\n` +
      `Portal Link: ${window.location.origin}\n` +
      `Username/Email: ${user.email || user.username}\n` +
      `Password: ${user.password || 'password123'}\n` +
      `Role: ${user.role.toUpperCase()}`;

    const success = await copyToClipboard(credText);
    if (success) {
      setCopiedUserId(user.id);
      showToast(`Copied login credentials for ${user.fullName} to clipboard.`);
      setTimeout(() => setCopiedUserId(null), 2500);
    } else {
      alert("Clipboard access was restricted. Please use the View Details button to copy credentials manually.");
    }
  };

  // ACTION: Toggle Status (Disable / Enable)
  const handleToggleStatus = async (user: UserProfile) => {
    if (!canManagePortals) {
      alert("Permission denied. Only School Administrators can manage portal accounts.");
      return;
    }
    const nextStatus = user.status === 'inactive' ? 'active' : 'inactive';
    const key = `toggle_${user.id}`;
    setActionLoadingKey(key);
    try {
      await updateUserAccount(user.id, { status: nextStatus });
      showToast(`Portal access for ${user.fullName} has been ${nextStatus === 'active' ? 'enabled' : 'disabled'}.`);
      if (viewingUser && viewingUser.id === user.id) {
        setViewingUser({ ...viewingUser, status: nextStatus });
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update status: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ACTION: Regenerate Password Directly
  const handleDirectRegeneratePassword = async (user: UserProfile) => {
    if (!canManagePortals) {
      alert("Permission denied. Only School Administrators can manage portal accounts.");
      return;
    }
    const newPass = generateRandomPassword();
    const key = `regen_${user.id}`;
    setActionLoadingKey(key);
    try {
      await updateUserAccount(user.id, { password: newPass });
      showToast(`Regenerated password for ${user.fullName}: ${newPass}`);
      if (viewingUser && viewingUser.id === user.id) {
        setViewingUser({ ...viewingUser, password: newPass });
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to regenerate password: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ACTION: Reset Password Modal Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordValue.trim()) return;
    setActionLoadingKey('reset_modal');
    try {
      await updateUserAccount(resetPasswordUser.id, { password: newPasswordValue.trim() });
      showToast(`Updated password for ${resetPasswordUser.fullName}`);
      setResetPasswordUser(null);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to reset password: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // ACTION: Trigger User Deletion Confirmation
  const handleDeleteUser = (user: UserProfile) => {
    if (!canManagePortals) {
      showToast("Permission denied. Only School Administrators can revoke portal accounts.");
      return;
    }
    setUserToDelete(user);
  };

  // ACTION: Execute Permanent User Deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (!canManagePortals) {
      showToast("Permission denied. Only School Administrators can revoke portal accounts.");
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      await deleteUserAccount(userToDelete.id);
      showToast(`Successfully deleted portal account for ${userToDelete.fullName}`);
      if (viewingUser && viewingUser.id === userToDelete.id) {
        setViewingUser(null);
      }
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user account:', err);
      showToast(`Failed to delete account: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // ACTION: Update User Profile Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoadingKey('edit_modal');
    try {
      await updateUserAccount(editingUser.id, {
        fullName: editingUser.fullName.trim(),
        email: editingUser.email.trim(),
        phone: editingUser.phone?.trim(),
        role: editingUser.role,
        status: editingUser.status,
        linkedStudentIds: editingUser.role === 'parent' ? editingUser.linkedStudentIds : undefined,
      });

      setEditingUser(null);
      showToast(`Saved updates for ${editingUser.fullName}`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update user profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ACTION: Repair Parent Student Links
  const handleRepairLinks = async () => {
    if (!repairParentStudentLinks) return;
    setIsRepairing(true);
    try {
      const res = await repairParentStudentLinks();
      showToast(`Repaired parent links: ${res.repairedParents} parents & ${res.repairedStudents} students validated.`);
    } catch (err: any) {
      alert(`Error repairing parent links: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // 1-Click Generate Action for Parent Candidate (Roster view)
  const handleGenerateParentCandidate = async (candidate: any) => {
    const key = `gen_parent_${candidate.parentId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const phoneDigits = candidate.phone.replace(/[^0-9]/g, '');
      const loginEmail = candidate.email || (phoneDigits ? `parent.${phoneDigits}@portal.schoolos` : `parent.${Date.now()}@portal.schoolos`);
      const username = candidate.phone || candidate.fullName.toLowerCase().replace(/\s+/g, '.');

      // STRICT REQUIREMENT 3: Link ONLY assigned student wards of this parent!
      const user = await createUserAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.phone,
        role: 'parent',
        status: 'active',
        schoolId: targetSchoolId,
        schoolName: school?.name,
        linkedStudentIds: candidate.assignedStudentIds
      }, password);

      showToast(`Generated Parent Portal for ${candidate.fullName}`);
      setViewingUser(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate parent portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 1-Click Generate Action for Teacher Candidate (Roster view)
  const handleGenerateTeacherCandidate = async (candidate: any) => {
    const key = `gen_teacher_${candidate.teacherId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const staffCode = candidate.staffId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `staff${Date.now()}`;
      const loginEmail = candidate.email || `${staffCode}@teacher.${(school?.shortCode || 'school').toLowerCase()}.edu.gh`;
      const username = candidate.staffId || candidate.fullName.toLowerCase().replace(/\s+/g, '.');

      // STRICT REQUIREMENT 4: Correct teacher ID and schoolId
      const user = await createUserAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.phone,
        role: 'teacher',
        status: 'active',
        schoolId: targetSchoolId,
        schoolName: school?.name,
        teacherId: candidate.teacherId
      }, password);

      showToast(`Generated Teacher Portal for ${candidate.fullName}`);
      setViewingUser(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate teacher portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // 1-Click Generate Action for Student Candidate (Roster view)
  const handleGenerateStudentCandidate = async (candidate: any) => {
    const key = `gen_student_${candidate.studentId}`;
    setActionLoadingKey(key);
    try {
      const password = generateRandomPassword();
      const admCode = candidate.admissionNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `std${Date.now()}`;
      const loginEmail = `${admCode}@student.${(school?.shortCode || 'school').toLowerCase()}.edu.gh`;
      const username = candidate.admissionNumber || admCode;

      // STRICT REQUIREMENT 5: Correct student ID and schoolId
      const user = await createUserAccount({
        fullName: candidate.fullName,
        email: loginEmail,
        username: username,
        phone: candidate.guardianPhone || '',
        role: 'student',
        status: 'active',
        schoolId: targetSchoolId,
        schoolName: school?.name,
        studentId: candidate.studentId
      }, password);

      showToast(`Generated Student Portal for ${candidate.fullName}`);
      setViewingUser(user);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate student portal: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Metrics
  const activeTeachersCount = schoolUsers.filter(u => u.role === 'teacher').length;
  const activeParentsCount = schoolUsers.filter(u => u.role === 'parent').length;
  const activeStudentsCount = schoolUsers.filter(u => u.role === 'student').length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Portals & Users</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {school?.name || 'SchoolOS'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated portal login accounts for Teachers, Parents, Students, and Administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Repair Parent Links Button */}
          <button
            type="button"
            onClick={handleRepairLinks}
            disabled={isRepairing}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Validate and sync parent-student links in Cloud Firestore"
          >
            {isRepairing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />}
            <span>Validate Links</span>
          </button>

          {/* Generate Portals Main Button */}
          <button
            type="button"
            onClick={() => {
              setGenerateModalInitialTab('parents');
              setIsGenerateModalOpen(true);
            }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Generate Portals</span>
            {unregTotalCount > 0 && (
              <span className="bg-teal-900 text-teal-200 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {unregTotalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Teachers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeTeachersCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">Active Portals</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Roster: {teachers.length} Staff</span>
            {unregTeachersCount > 0 && <span className="font-bold">{unregTeachersCount} pending</span>}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Parents</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeParentsCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">Active Portals</span>
          </div>
          <div className="text-[11px] text-pink-700 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Guardians: {parentCandidates.length}</span>
            {unregParentsCount > 0 && <span className="font-bold">{unregParentsCount} pending</span>}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeStudentsCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">Active Portals</span>
          </div>
          <div className="text-[11px] text-cyan-700 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Enrolled: {availableStudents.length}</span>
            {unregStudentsCount > 0 && <span className="font-bold">{unregStudentsCount} pending</span>}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{schoolUsers.length}</span>
            <span className="text-[11px] text-teal-700 font-medium">In Cloud Firestore</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Auth Source: Firebase</span>
            <span className="text-emerald-700 font-bold">100% Synced</span>
          </div>
        </div>
      </div>

      {/* Primary View Toggle: Active Accounts vs Generate Portals (Roster) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            viewMode === 'active'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Active Portal Accounts ({schoolUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('generate_roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            viewMode === 'generate_roster'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Generate Portals / Unregistered Roster</span>
          {unregTotalCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              viewMode === 'generate_roster' ? 'bg-teal-900 text-teal-100' : 'bg-teal-100 text-teal-800'
            }`}>
              {unregTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* VIEW MODE 1: ACTIVE PORTALS DIRECTORY */}
      {viewMode === 'active' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, email, or phone..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Role Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {['all', 'teacher', 'parent', 'student', 'principal', 'accountant'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize cursor-pointer transition-all ${
                      roleFilter === role ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {role === 'all' ? 'All Roles' : role}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Active Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Portal Role</th>
                    <th className="py-3 px-4">Assigned Entity / Scope</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Users className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-700">No portal accounts found</p>
                          <p className="text-[11px]">No users match the current search and role filters.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setGenerateModalInitialTab('parents');
                              setIsGenerateModalOpen(true);
                            }}
                            className="text-teal-700 font-bold hover:underline text-xs"
                          >
                            Generate New Portal Account
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isUserActive = user.status !== 'inactive';
                      const isToggling = actionLoadingKey === `toggle_${user.id}`;
                      const isDeleting = actionLoadingKey === `delete_${user.id}`;
                      const isRegenerating = actionLoadingKey === `regen_${user.id}`;

                      // Scope label
                      let scopeLabel = <span className="text-slate-400 italic">Global School Staff</span>;
                      if (user.role === 'teacher') {
                        const t = teachers.find(item => item.id === user.teacherId || item.staffId === user.teacherId);
                        scopeLabel = (
                          <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            Staff ID: {t?.staffId || user.teacherId || 'STAFF'}
                          </span>
                        );
                      } else if (user.role === 'student') {
                        const s = availableStudents.find(item => item.id === user.studentId || item.admissionNumber === user.studentId);
                        scopeLabel = (
                          <span className="font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            Index: {s?.admissionNumber || user.studentId || 'N/A'} ({s?.classroomName || 'Class'})
                          </span>
                        );
                      } else if (user.role === 'parent') {
                        const count = user.linkedStudentIds?.length || 0;
                        scopeLabel = (
                          <span className="text-pink-800 bg-pink-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            {count} Student Ward(s) Linked
                          </span>
                        );
                      }

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* User Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase text-xs">
                                {user.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.fullName}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {user.email || user.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize tracking-wide ${
                              user.role === 'teacher' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              user.role === 'parent' ? 'bg-pink-50 text-pink-800 border border-pink-200' :
                              user.role === 'student' ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                              'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          {/* Assigned Scope */}
                          <td className="py-3 px-4">
                            {scopeLabel}
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {user.phone || '—'}
                          </td>

                          {/* Status Toggle Button */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(user)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                                isUserActive 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Click to toggle account access"
                            >
                              {isToggling ? (
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              )}
                              <span>{isUserActive ? 'Active' : 'Disabled'}</span>
                            </button>
                          </td>

                          {/* Actions Column */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* 1. View Portal Details */}
                              <button
                                type="button"
                                onClick={() => setViewingUser(user)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="View Portal Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 2. Copy Credentials */}
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(user)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Copy Login Credentials"
                              >
                                {copiedUserId === user.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              {/* 3. Send Credentials */}
                              <button
                                type="button"
                                onClick={() => setSendCredentialsUser(user)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Send Credentials via WhatsApp / SMS"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* 4. Regenerate Password */}
                              <button
                                type="button"
                                disabled={isRegenerating}
                                onClick={() => handleDirectRegeneratePassword(user)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                title="Regenerate Random Password"
                              >
                                {isRegenerating ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                                ) : (
                                  <KeyRound className="w-4 h-4" />
                                )}
                              </button>

                              {/* 5. Edit Account */}
                              <button
                                type="button"
                                onClick={() => setEditingUser(user)}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit User Details & Role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* 6. Revoke / Delete */}
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                title="Revoke & Delete Portal Account"
                              >
                                {isDeleting ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: GENERATE PORTALS / UNREGISTERED ROSTER */}
      {viewMode === 'generate_roster' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            
            {/* Sub-tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRosterTab('parents')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    rosterTab === 'parents'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Parents / Guardians ({parentCandidates.length})</span>
                  {unregParentsCount > 0 && (
                    <span className="bg-pink-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {unregParentsCount} pending
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRosterTab('teachers')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    rosterTab === 'teachers'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Teachers & Staff ({teachers.length})</span>
                  {unregTeachersCount > 0 && (
                    <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {unregTeachersCount} pending
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRosterTab('students')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    rosterTab === 'students'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Students ({availableStudents.length})</span>
                  {unregStudentsCount > 0 && (
                    <span className="bg-cyan-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {unregStudentsCount} pending
                    </span>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Click <b>Generate Portal</b> on any row to create and provision login access in Cloud Firestore.
              </div>
            </div>

            {/* ROSTER TAB: PARENTS */}
            {rosterTab === 'parents' && (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {parentCandidates.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No guardian contact records found in student admissions roster.
                  </div>
                ) : (
                  parentCandidates.map(candidate => {
                    const hasPortal = !!candidate.existingPortalUser;
                    const isGenerating = actionLoadingKey === `gen_parent_${candidate.parentId}`;

                    return (
                      <div key={candidate.parentId} className="py-3 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors rounded-xl">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{candidate.fullName}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Wards:</span>
                            {candidate.assignedStudents.map(s => (
                              <span key={s.id} className="text-[10px] bg-pink-50 border border-pink-200 text-pink-900 px-2 py-0.5 rounded-md font-medium">
                                {s.name} <span className="font-mono text-pink-700">({s.admissionNumber})</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                          {!hasPortal ? (
                            <button
                              type="button"
                              disabled={isGenerating}
                              onClick={() => handleGenerateParentCandidate(candidate)}
                              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Copy Credentials"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSendCredentialsUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Send Notice"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectRegeneratePassword(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Regenerate Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ROSTER TAB: TEACHERS */}
            {rosterTab === 'teachers' && (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {teacherCandidates.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No staff records found in the school teachers roster.
                  </div>
                ) : (
                  teacherCandidates.map(candidate => {
                    const hasPortal = !!candidate.existingPortalUser;
                    const isGenerating = actionLoadingKey === `gen_teacher_${candidate.teacherId}`;

                    return (
                      <div key={candidate.teacherId} className="py-3 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors rounded-xl">
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
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                          {!hasPortal ? (
                            <button
                              type="button"
                              disabled={isGenerating}
                              onClick={() => handleGenerateTeacherCandidate(candidate)}
                              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Copy Credentials"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSendCredentialsUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Send Notice"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectRegeneratePassword(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Regenerate Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ROSTER TAB: STUDENTS */}
            {rosterTab === 'students' && (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {studentCandidates.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No student admission records found in this school.
                  </div>
                ) : (
                  studentCandidates.map(candidate => {
                    const hasPortal = !!candidate.existingPortalUser;
                    const isGenerating = actionLoadingKey === `gen_student_${candidate.studentId}`;

                    return (
                      <div key={candidate.studentId} className="py-3 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors rounded-xl">
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
                            <button
                              type="button"
                              disabled={isGenerating}
                              onClick={() => handleGenerateStudentCandidate(candidate)}
                              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>Generate Portal</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Copy Credentials"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSendCredentialsUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Send Notice"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectRegeneratePassword(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Regenerate Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(candidate.existingPortalUser!)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  candidate.existingPortalUser?.status === 'active'
                                    ? 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={candidate.existingPortalUser?.status === 'active' ? 'Disable Portal Access' : 'Enable Portal Access'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(candidate.existingPortalUser!)}
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Revoke & Delete Portal Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE PORTALS WINDOW */}
      {isGenerateModalOpen && (
        <GeneratePortalsModal
          school={school}
          teachers={teachers}
          students={availableStudents}
          schoolUsers={schoolUsers}
          parentCandidates={parentCandidates}
          teacherCandidates={teacherCandidates}
          studentCandidates={studentCandidates}
          initialTab={generateModalInitialTab}
          onClose={() => setIsGenerateModalOpen(false)}
          onCreateAccount={createUserAccount}
          onViewDetails={(u) => setViewingUser(u)}
          onCopyCredentials={handleCopyCredentials}
          onOpenSendCredentials={(u) => setSendCredentialsUser(u)}
          onRegeneratePassword={handleDirectRegeneratePassword}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={(u) => setUserToDelete(u)}
          onToast={showToast}
        />
      )}

      {/* MODAL 2: VIEW PORTAL DETAILS */}
      {viewingUser && (
        <PortalDetailsModal
          user={viewingUser}
          school={school}
          students={availableStudents}
          teachers={teachers}
          onClose={() => setViewingUser(null)}
          onCopyCredentials={handleCopyCredentials}
          onOpenSendCredentials={(u) => setSendCredentialsUser(u)}
          onOpenResetPassword={(u) => {
            setResetPasswordUser(u);
            setNewPasswordValue(generateRandomPassword());
          }}
          onToggleStatus={handleToggleStatus}
          onEdit={(u) => setEditingUser(u)}
          onDelete={(u) => setUserToDelete(u)}
          isActionLoading={!!actionLoadingKey}
        />
      )}

      {/* MODAL 3: SEND PORTAL CREDENTIALS */}
      {sendCredentialsUser && (
        <SendCredentialsModal
          user={sendCredentialsUser}
          school={school}
          students={availableStudents}
          onClose={() => setSendCredentialsUser(null)}
          onToast={showToast}
        />
      )}

      {/* MODAL 4: EDIT USER PROFILE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Portal User Info</h3>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Login Identifier</label>
                <input
                  type="text"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Portal Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                >
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                  <option value="principal">Headteacher / Principal</option>
                  <option value="accountant">Accountant / Bursar</option>
                  <option value="schoolOwner">School Owner</option>
                </select>
              </div>

              {/* Parent Linked Student Wards Editor (STRICT REQUIREMENT 3) */}
              {editingUser.role === 'parent' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 text-xs">
                      Linked Student Wards
                    </label>
                    <span className="text-[10px] text-teal-700 font-semibold">
                      {editingUser.linkedStudentIds?.length || 0} Student(s) Assigned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Assign only the specific student(s) belonging to this parent.
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                    {availableStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No students registered in this school.</p>
                    ) : (
                      availableStudents.map(st => {
                        const isAssigned = (editingUser.linkedStudentIds || []).includes(st.id);
                        return (
                          <label
                            key={st.id}
                            className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isAssigned
                                ? 'bg-teal-50 border-teal-300 text-teal-950 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => {
                                  const current = editingUser.linkedStudentIds || [];
                                  const updated = e.target.checked
                                    ? [...current, st.id]
                                    : current.filter(id => id !== st.id);
                                  setEditingUser({ ...editingUser, linkedStudentIds: updated });
                                }}
                                className="w-3.5 h-3.5 text-teal-600 rounded"
                              />
                              <span>{st.firstName} {st.lastName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {st.admissionNumber || st.classroomName}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Account Active</span>
                <input
                  type="checkbox"
                  checked={editingUser.status !== 'inactive'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingKey === 'edit_modal'}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingKey === 'edit_modal' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET PASSWORD */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700">
                <KeyRound className="w-4 h-4" />
                <h3 className="font-bold text-sm text-slate-900">Reset Password</h3>
              </div>
              <button 
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assign a new login password for <b>{resetPasswordUser.fullName}</b>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue(generateRandomPassword())}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingKey === 'reset_modal'}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingKey === 'reset_modal' ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PERMANENT USER DELETION CONFIRMATION */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-slate-900">Revoke & Delete User Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently delete this portal account?
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingUser && setUserToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Details Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{userToDelete.fullName}</span>
                <span className="capitalize font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {userToDelete.role}
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px] space-y-0.5">
                <div>Email / Username: {userToDelete.email || userToDelete.username}</div>
                {userToDelete.phone && <div>Phone: {userToDelete.phone}</div>}
                {userToDelete.role === 'parent' && userToDelete.linkedStudentIds && userToDelete.linkedStudentIds.length > 0 && (
                  <div className="text-pink-700 font-sans text-xs pt-1 font-medium">
                    Linked Wards: {userToDelete.linkedStudentIds.length} student(s) will be unlinked.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
              <b>Warning:</b> This action is irreversible. The account record will be permanently deleted from Cloud Firestore and local storage. The user will immediately lose all portal access.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
