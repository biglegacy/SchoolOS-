import React, { useState } from 'react';
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
  User
} from 'lucide-react';

export const SchoolOwnerPortalsView: React.FC = () => {
  const { school, schoolUsers, students, teachers, createUserAccount, updateUserAccount, deleteUserAccount } = useSchool();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State for new portal creation
  const [formData, setFormData] = useState<{
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
    role: 'teacher',
    password: '',
    status: 'active',
    teacherId: '',
    studentId: '',
    linkedStudentIds: [],
  });

  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleOpenCreateModal = (presetRole?: UserRole) => {
    const genPass = generateRandomPassword();
    setFormData({
      fullName: '',
      email: '',
      username: '',
      phone: '',
      role: presetRole || 'teacher',
      password: genPass,
      status: 'active',
      teacherId: '',
      studentId: '',
      linkedStudentIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setIsSubmitting(true);
    try {
      const emailOrUser = formData.email.trim();
      await createUserAccount({
        fullName: formData.fullName.trim(),
        email: emailOrUser,
        username: formData.username.trim() || emailOrUser,
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status,
        schoolId: school?.id,
        schoolName: school?.name,
        teacherId: formData.role === 'teacher' ? formData.teacherId : undefined,
        studentId: formData.role === 'student' ? formData.studentId : undefined,
        linkedStudentIds: formData.role === 'parent' ? formData.linkedStudentIds : undefined,
      }, formData.password.trim() || 'password123');

      setIsCreateModalOpen(false);
      showToast(`Created portal login account for ${formData.fullName}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await updateUserAccount(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        username: editingUser.username || editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status || 'active',
        teacherId: editingUser.role === 'teacher' ? editingUser.teacherId : undefined,
        studentId: editingUser.role === 'student' ? editingUser.studentId : undefined,
        linkedStudentIds: editingUser.role === 'parent' ? editingUser.linkedStudentIds : undefined,
      });

      setEditingUser(null);
      showToast(`Updated account details for ${editingUser.fullName}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordValue.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUserAccount(resetPasswordUser.id, {
        password: newPasswordValue.trim()
      });
      setResetPasswordUser(null);
      setNewPasswordValue('');
      showToast(`Password successfully reset for ${resetPasswordUser.fullName}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'inactive' ? 'active' : 'inactive';
    await updateUserAccount(user.id, { status: nextStatus });
    showToast(`Account for ${user.fullName} is now ${nextStatus.toUpperCase()}`);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (confirm(`Are you sure you want to permanently revoke portal access for ${user.fullName}?`)) {
      await deleteUserAccount(user.id);
      showToast(`Revoked portal account for ${user.fullName}`);
    }
  };

  const handleCopyCredentials = (user: UserProfile) => {
    const credText = `School: ${school?.name}\nPortal URL: ${window.location.origin}\nUsername/Email: ${user.email || user.username}\nPassword: ${user.password || 'password123'}\nRole: ${user.role}`;
    navigator.clipboard.writeText(credText);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast(`Copied login credentials for ${user.fullName} to clipboard`);
  };

  // Filter users
  const filteredUsers = schoolUsers.filter(u => {
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'schoolOwner':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase">School Owner</span>;
      case 'principal':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">Headteacher</span>;
      case 'teacher':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">Teacher</span>;
      case 'parent':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-800 border border-pink-200 uppercase">Parent</span>;
      case 'student':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 uppercase">Student</span>;
      case 'accountant':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">Accountant</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">{role}</span>;
    }
  };

  const totalTeachers = schoolUsers.filter(u => u.role === 'teacher').length;
  const totalParents = schoolUsers.filter(u => u.role === 'parent').length;
  const totalStudents = schoolUsers.filter(u => u.role === 'student').length;
  const totalOthers = schoolUsers.filter(u => u.role === 'principal' || u.role === 'accountant' || u.role === 'schoolOwner').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Portals & User Accounts</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-mono font-bold uppercase">
              {school?.shortCode || 'SCH'} Multi-Portal Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, assign, configure, and manage portal access credentials for Teachers, Parents, Students, Headteachers, and Bursars.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenCreateModal('teacher')}
            className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Generate Portal Account</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => { setRoleFilter('teacher'); setStatusFilter('all'); }}
          className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all ${roleFilter === 'teacher' ? 'border-teal-600 ring-2 ring-teal-100 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teachers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{totalTeachers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Staff Portals</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('parent'); setStatusFilter('all'); }}
          className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all ${roleFilter === 'parent' ? 'border-teal-600 ring-2 ring-teal-100 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parents</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{totalParents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Guardian Logins</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('student'); setStatusFilter('all'); }}
          className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all ${roleFilter === 'student' ? 'border-teal-600 ring-2 ring-teal-100 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Students</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{totalStudents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Student Learner Logins</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
          className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all ${roleFilter === 'all' ? 'border-teal-600 ring-2 ring-teal-100 shadow-xs' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">{schoolUsers.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Synchronized in Firebase</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
            />
          </div>

          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'teacher', label: 'Teachers' },
              { id: 'parent', label: 'Parents' },
              { id: 'student', label: 'Students' },
              { id: 'principal', label: 'Principals' },
              { id: 'accountant', label: 'Accountants' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {statusFilter === 'inactive' ? 'Showing Inactive Only' : 'Filter Inactive'}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No portal accounts match your filter</p>
            <p className="text-[11px] text-slate-400">Click "Generate Portal Account" above to register new logins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Portal Role</th>
                  <th className="py-3 px-4">Linked Student / Staff ID</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((user) => {
                  const isUserActive = user.status !== 'inactive';
                  
                  // Linked info resolver
                  let linkedLabel = '—';
                  if (user.role === 'teacher') {
                    const t = teachers.find(item => item.id === user.teacherId || item.staffId === user.teacherId);
                    linkedLabel = t ? `${t.fullName} (${t.staffId})` : (user.teacherId || 'Staff Member');
                  } else if (user.role === 'student') {
                    const s = students.find(item => item.id === user.studentId || item.admissionNumber === user.studentId);
                    linkedLabel = s ? `${s.firstName} ${s.lastName} (${s.admissionNumber})` : (user.studentId || 'Student');
                  } else if (user.role === 'parent' && user.linkedStudentIds && user.linkedStudentIds.length > 0) {
                    const linkedNames = user.linkedStudentIds.map(id => {
                      const s = students.find(item => item.id === id || item.admissionNumber === id);
                      return s ? `${s.firstName} (${s.admissionNumber})` : id;
                    }).join(', ');
                    linkedLabel = linkedNames || `${user.linkedStudentIds.length} Student Wards`;
                  }

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Linked Entity */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 text-[11px] max-w-[200px] truncate block" title={linkedLabel}>
                          {linkedLabel}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {user.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                            isUserActive 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle active/inactive status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span>{isUserActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Copy Credentials */}
                          <button
                            onClick={() => handleCopyCredentials(user)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Copy Portal Login Credentials"
                          >
                            {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetPasswordUser(user);
                              setNewPasswordValue(generateRandomPassword());
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset User Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Revoke Portal Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Generate Portal Account</h3>
                  <p className="text-[11px] text-slate-400">Assign role and credentials for {school?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Portal Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'teacher', label: 'Teacher' },
                    { id: 'parent', label: 'Parent' },
                    { id: 'student', label: 'Student' },
                    { id: 'principal', label: 'Principal' },
                    { id: 'accountant', label: 'Accountant' },
                  ].map(r => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setFormData({ ...formData, role: r.id as UserRole })}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                        formData.role === r.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwesi Boateng"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              {/* Email / Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Login ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="kwesi.boateng@school.edu.gh"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number (Ghana)</label>
                  <input
                    type="tel"
                    placeholder="+233 24 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Role Specific Linking */}
              {formData.role === 'teacher' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link to Staff Member Profile</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => {
                      const sel = teachers.find(t => t.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        teacherId: e.target.value,
                        fullName: sel ? sel.fullName : formData.fullName,
                        email: sel ? (sel.email || formData.email) : formData.email,
                        phone: sel ? (sel.phone || formData.phone) : formData.phone,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">-- Choose Existing Staff Member or Enter Below --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.staffId}) - {t.role}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'student' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link to Student Admission Record</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => {
                      const sel = students.find(s => s.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        studentId: e.target.value,
                        fullName: sel ? `${sel.firstName} ${sel.lastName}` : formData.fullName,
                        email: sel ? `${sel.admissionNumber.toLowerCase()}@school.edu.gh` : formData.email,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">-- Choose Student Record --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'parent' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Student Wards</label>
                  <select
                    multiple
                    size={3}
                    value={formData.linkedStudentIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setFormData({ ...formData, linkedStudentIds: selected });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple students linked to this parent.</p>
                </div>
              )}

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono pr-9 focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Account Status</p>
                  <p className="text-[11px] text-slate-500">Allow immediate portal sign-in</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Generate Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Portal User Info</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700">
                <KeyRound className="w-4 h-4" />
                <h3 className="font-bold text-sm text-slate-900">Reset Password</h3>
              </div>
              <button 
                onClick={() => setResetPasswordUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generate or assign a new login password for <b>{resetPasswordUser.fullName}</b>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue(generateRandomPassword())}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Generate
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
