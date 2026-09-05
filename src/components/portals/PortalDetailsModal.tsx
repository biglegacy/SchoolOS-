import React, { useState } from 'react';
import { UserProfile, School, Student, Teacher } from '../../types';
import { 
  X, 
  Copy, 
  Check, 
  KeyRound, 
  Send, 
  Power, 
  ShieldCheck, 
  User, 
  GraduationCap, 
  HeartHandshake, 
  Calendar, 
  Building2, 
  Eye, 
  EyeOff, 
  Edit2, 
  Phone, 
  Mail, 
  Layers,
  Trash2
} from 'lucide-react';
import { copyToClipboard } from './portalUtils';

interface PortalDetailsModalProps {
  user: UserProfile;
  school: School | null;
  students: Student[];
  teachers: Teacher[];
  onClose: () => void;
  onCopyCredentials: (user: UserProfile) => void;
  onOpenSendCredentials: (user: UserProfile) => void;
  onOpenResetPassword: (user: UserProfile) => void;
  onToggleStatus: (user: UserProfile) => Promise<void>;
  onEdit: (user: UserProfile) => void;
  onDelete?: (user: UserProfile) => void;
  isActionLoading?: boolean;
}

export const PortalDetailsModal: React.FC<PortalDetailsModalProps> = ({
  user,
  school,
  students,
  teachers,
  onClose,
  onCopyCredentials,
  onOpenSendCredentials,
  onOpenResetPassword,
  onToggleStatus,
  onEdit,
  onDelete,
  isActionLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const isUserActive = user.status !== 'inactive';

  // Role info and icon
  const getRoleIcon = () => {
    switch (user.role) {
      case 'teacher': return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case 'parent': return <HeartHandshake className="w-5 h-5 text-pink-600" />;
      case 'student': return <User className="w-5 h-5 text-cyan-600" />;
      default: return <ShieldCheck className="w-5 h-5 text-teal-600" />;
    }
  };

  // Find linked teacher info
  const linkedTeacher = user.role === 'teacher' 
    ? teachers.find(t => t.id === user.teacherId || t.staffId === user.teacherId)
    : null;

  // Find linked student info (for student role)
  const linkedStudent = user.role === 'student'
    ? students.find(s => s.id === user.studentId || s.admissionNumber === user.studentId)
    : null;

  // Find linked student wards (for parent role)
  const linkedWards = user.role === 'parent' && user.linkedStudentIds
    ? user.linkedStudentIds.map(sId => students.find(s => s.id === sId || s.admissionNumber === sId)).filter(Boolean) as Student[]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              {getRoleIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{user.fullName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isUserActive 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {isUserActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium capitalize">
                {user.role} Portal Account • {school?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Credentials Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Login Credentials</span>
            <span className="text-[10px] font-mono text-teal-700 font-bold">Cloud Firestore & Auth</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Username / Email</span>
              <div className="flex items-center justify-between gap-1 font-mono text-slate-800 font-bold">
                <span className="truncate">{user.email || user.username}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(user.email || user.username || '', 'username')}
                  className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                  title="Copy Username"
                >
                  {copiedKey === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Login Password</span>
              <div className="flex items-center justify-between gap-1 font-mono text-slate-800 font-bold">
                <span>{showPassword ? (user.password || 'password123') : '••••••••••••'}</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.password || 'password123', 'password')}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedKey === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
            <span className="text-slate-500">Portal Website:</span>
            <span className="font-mono text-slate-700 font-semibold truncate max-w-[250px]">{window.location.origin}</span>
          </div>
        </div>

        {/* Role-Specific Linked Information */}
        <div className="space-y-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Assigned Scope & Identification
          </span>

          {user.role === 'teacher' && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">Teacher Record: {linkedTeacher?.fullName || user.fullName}</span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Staff ID: {linkedTeacher?.staffId || user.teacherId || 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Authorized for GES 30/70 SBA continuous scoring, attendance tracking, and class management.
              </p>
            </div>
          )}

          {user.role === 'student' && (
            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950">{linkedStudent ? `${linkedStudent.firstName} ${linkedStudent.lastName}` : user.fullName}</span>
                <span className="font-mono text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-bold">
                  Index: {linkedStudent?.admissionNumber || user.studentId || 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-cyan-800">
                Classroom: <b>{linkedStudent?.classroomName || 'Assigned Stream'}</b> • Academic Level: <b>{linkedStudent?.level || 'Basic'}</b>
              </div>
            </div>
          )}

          {user.role === 'parent' && (
            <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-950">Authorized Student Ward(s)</span>
                <span className="text-[10px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded font-bold">
                  {linkedWards.length} Student(s) Linked
                </span>
              </div>
              {linkedWards.length === 0 ? (
                <p className="text-[11px] text-pink-700 italic">No student wards linked to this parent yet. Click Edit to assign.</p>
              ) : (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {linkedWards.map(w => (
                    <div key={w.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-pink-100 text-xs">
                      <span className="font-semibold text-slate-800">{w.firstName} {w.lastName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{w.admissionNumber} ({w.classroomName})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Details & Identifiers */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.phone || 'No phone recorded'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">School ID: {user.schoolId || school?.id}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 col-span-2">
              <span>Doc ID: {user.id}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Toggle Status */}
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => onToggleStatus(user)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isUserActive
                  ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isUserActive ? 'Disable Access' : 'Enable Access'}</span>
            </button>

            {/* Regenerate Password */}
            <button
              type="button"
              onClick={() => onOpenResetPassword(user)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Regenerate Password</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Copy All */}
            <button
              type="button"
              onClick={() => onCopyCredentials(user)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Info</span>
            </button>

            {/* Send Notice */}
            <button
              type="button"
              onClick={() => onOpenSendCredentials(user)}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Notice</span>
            </button>

            {/* Delete Account */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(user)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Permanently Delete Portal Account"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Account</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
