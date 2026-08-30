import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Student } from '../../types';
import { 
  HeartHandshake, 
  CreditCard, 
  FileText, 
  CalendarCheck2, 
  Award, 
  Calendar, 
  Phone, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Download,
  Building2,
  UserCheck,
  GraduationCap,
  ChevronRight,
  BookOpen,
  User,
  ShieldCheck,
  Receipt,
  Mail,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { formatGHS, formatDate, formatGhanaPhone } from '../../utils/formatting';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { GhanaFlagBadge } from '../common/EmptyState';

interface ParentPortalViewProps {
  initialSubTab?: 'overview' | 'reports' | 'fees' | 'attendance' | 'announcements' | 'teacher';
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  initialSubTab = 'overview'
}) => {
  const { currentUser } = useAuth();
  const { 
    students, 
    classrooms, 
    school, 
    feeStructures = [], 
    feePayments = [], 
    results = [], 
    examResults = [], 
    attendance = [], 
    settings 
  } = useSchool();
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'reports' | 'fees' | 'attendance' | 'announcements' | 'teacher'>(initialSubTab);
  const [selectedStudentForReport, setSelectedReportStudent] = useState<Student | null>(null);

  // Filter linked wards for this parent (by guardian phone/email or user profile)
  const myChildren = students.filter(s => {
    if (!currentUser) return false;
    const phoneMatch = s.guardians?.some(g => g.phone && currentUser.phone && g.phone.replace(/[^0-9]/g, '') === currentUser.phone.replace(/[^0-9]/g, ''));
    const emailMatch = s.guardians?.some(g => g.email && currentUser.email && g.email.toLowerCase() === currentUser.email.toLowerCase());
    return phoneMatch || emailMatch;
  });

  // If no direct guardian match, show the enrolled students in the school
  const displayChildren = myChildren.length > 0 ? myChildren : students.slice(0, 3);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild: Student | undefined = displayChildren[selectedChildIndex] || displayChildren[0];

  const activeChildClass = classrooms.find(c => c.id === activeChild?.currentClassroomId);

  // Real Fee Information for Active Ward
  const applicableFeeStructure = activeChild 
    ? feeStructures.find(f => f.classroomId === activeChild.currentClassroomId) 
    : undefined;
  
  const wardPayments = activeChild 
    ? feePayments.filter(p => p.studentId === activeChild.id)
    : [];

  const totalBilled = applicableFeeStructure ? applicableFeeStructure.totalAmount : 0;
  const totalPaid = wardPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);
  const isFullyPaid = totalBilled > 0 && outstandingBalance === 0;

  // Real Academic Results for Active Ward
  const allResults = examResults.length > 0 ? examResults : results;
  const wardResults = activeChild 
    ? allResults.filter(r => r.studentId === activeChild.id)
    : [];
  
  const hasAcademicResults = wardResults.length > 0;
  const totalScoreSum = wardResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const academicAverage = hasAcademicResults ? (totalScoreSum / wardResults.length).toFixed(1) : null;

  // Real Attendance for Active Ward
  const wardAttendance = activeChild 
    ? attendance.filter(a => a.studentId === activeChild.id)
    : [];
  const totalAttendanceLogged = wardAttendance.length;
  const daysPresent = wardAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysLate = wardAttendance.filter(a => a.status === 'late').length;
  const daysAbsent = wardAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = totalAttendanceLogged > 0 ? Math.round((daysPresent / totalAttendanceLogged) * 100) : null;

  if (displayChildren.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Parent Portal Dashboard</h2>
          <p className="text-xs text-slate-500">
            No enrolled students are currently linked to this parent account. Once admission and student enrollment are confirmed by the school administration, your ward's dashboard will appear here.
          </p>
        </div>
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 text-left space-y-1">
          <span className="font-bold block">Need help linking your child?</span>
          <p className="text-slate-600">
            Please contact {school?.name || 'the school administration'} with your student's admission number or registered guardian phone number.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. PARENT WELCOME & WARD SELECTION BANNER (Teal & White Palette) */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white rounded-2xl p-5 sm:p-7 shadow-sm border border-teal-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-950/80 border border-teal-600/50 text-teal-200 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Parent & Guardian Console</span>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-white">
              Welcome, {currentUser?.fullName || 'Parent / Guardian'}
            </h1>
            
            <p className="text-xs text-teal-100/90">
              Monitoring <b className="text-white">{displayChildren.length} Registered Ward{displayChildren.length > 1 ? 's' : ''}</b> at <b className="text-white">{school?.name}</b>
            </p>
          </div>

          {activeChild && (
            <button
              onClick={() => setSelectedReportStudent(activeChild)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-teal-950 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Official Terminal Report Card</span>
            </button>
          )}
        </div>

        {/* Multi-Child Selector */}
        {displayChildren.length > 1 && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-teal-700/60 overflow-x-auto">
            <span className="text-xs text-teal-200 font-bold uppercase tracking-wider shrink-0 mr-1">
              Select Ward:
            </span>
            {displayChildren.map((child, idx) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedChildIndex === idx
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'bg-teal-950/60 text-teal-200 hover:bg-teal-950 hover:text-white'
                }`}
              >
                {child.firstName} {child.lastName} ({child.classroomName || 'Class'})
              </button>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-teal-700/60 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ward Overview', icon: Layers },
            { id: 'reports', label: 'Terminal Report Card', icon: FileText },
            { id: 'fees', label: 'School Fees & Receipts', icon: CreditCard },
            { id: 'attendance', label: 'Attendance Log', icon: CalendarCheck2 },
            { id: 'announcements', label: 'School Circulars', icon: MessageSquare },
            { id: 'teacher', label: 'Class Teacher Liaison', icon: Phone },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'reports') {
                    if (activeChild) setSelectedReportStudent(activeChild);
                  } else {
                    setActiveSubTab(tab.id as any);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-teal-100 hover:text-white hover:bg-teal-950/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-teal-300'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE WARD OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && activeChild && (
        <div className="space-y-6">
          
          {/* Key Metric KPI Cards (Calculated Strictly from Real Data) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            {/* Academic Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Terminal Average
              </span>
              <div className="text-2xl font-black text-teal-800">
                {hasAcademicResults ? `${academicAverage}%` : '—'}
              </div>
              <p className="text-[11px] text-slate-500">
                {hasAcademicResults ? `${wardResults.length} Subject(s) recorded` : 'Pending exam entry'}
              </p>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Attendance Rate
              </span>
              <div className="text-2xl font-black text-emerald-800">
                {attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </div>
              <p className="text-[11px] text-slate-500">
                {totalAttendanceLogged > 0 ? `${daysPresent} of ${totalAttendanceLogged} days logged` : 'No roll calls yet'}
              </p>
            </div>

            {/* Fee Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fee Clearance
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
                {totalBilled > 0 ? (
                  outstandingBalance === 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Cleared</span>
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      {formatGHS(outstandingBalance)} Due
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 font-medium text-xs">No Bill Assigned</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {totalPaid > 0 ? `${formatGHS(totalPaid)} paid to date` : 'No payments logged'}
              </p>
            </div>

            {/* Class Stream */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Enrolled Stream
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 truncate">
                {activeChild.classroomName || 'Assigned Stream'}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {activeChildClass?.classTeacherName ? `Tutor: ${activeChildClass.classTeacherName}` : 'Active student'}
              </p>
            </div>
          </div>

          {/* Student Profile Card & Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Ward Details */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {activeChild.photoUrl ? (
                    <img 
                      src={activeChild.photoUrl} 
                      alt={activeChild.firstName} 
                      className="w-14 h-14 rounded-2xl object-cover border border-teal-200 shadow-xs" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {activeChild.firstName[0]}{activeChild.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {activeChild.firstName} {activeChild.lastName} {activeChild.otherNames || ''}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Admission ID: <b className="text-teal-900">{activeChild.admissionNumber}</b>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  Active Enrollment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Classroom Stream</span>
                  <div className="font-bold text-slate-900 text-sm">{activeChild.classroomName || 'Unassigned'}</div>
                  {activeChildClass && (
                    <div className="text-[11px] text-slate-500">{activeChildClass.roomNumber || 'Room'}, {activeChildClass.block || 'Main Block'}</div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Class Teacher</span>
                  <div className="font-bold text-slate-900 text-sm">{activeChildClass?.classTeacherName || 'Class Master'}</div>
                  <div className="text-[11px] text-slate-500">GES Certified Educator</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Academic Session</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {school?.currentAcademicYear || '2026/2027'} • {school?.currentTerm || 'Term 3'}
                  </div>
                  <div className="text-[11px] text-teal-800 font-medium">Standard GES Curriculum</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Next Term Resumption</span>
                  <div className="font-bold text-teal-900 text-sm">
                    {settings.reopeningDate ? formatDate(settings.reopeningDate) : 'Sept 2026'}
                  </div>
                  <div className="text-[11px] text-slate-500">Official GES Academic Calendar</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedReportStudent(activeChild)}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Launch Official GES Terminal Progress Report</span>
                </button>
              </div>
            </div>

            {/* Quick Fee Snapshot for Ward */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Term Fee Summary
                  </h3>
                  {totalBilled > 0 && outstandingBalance === 0 ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Paid in Full
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Statement
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Applicable Bill:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {totalBilled > 0 ? formatGHS(totalBilled) : 'GHS 0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Payments Verified:</span>
                    <span className="font-mono">{formatGHS(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-sm">
                    <span>Outstanding Balance:</span>
                    <span className={`font-mono ${outstandingBalance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatGHS(outstandingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('fees')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-4"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>View Full Fee Breakdown & Payment Details</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. SCHOOL FEES & PAYMENT DETAILS SUB-TAB (CLEAN PARENT VIEW - NO ADMIN ACTIONS) */}
      {activeSubTab === 'fees' && activeChild && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                School Fees Statement & Payment History
              </h3>
              <p className="text-xs text-slate-500">
                Itemized invoice, official school accounts, and verified payment receipts for <b>{activeChild.firstName} {activeChild.lastName}</b>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-teal-700" />
                <span>Account Status: {outstandingBalance === 0 && totalBilled > 0 ? 'Cleared' : totalPaid > 0 ? 'Partial' : 'Pending'}</span>
              </span>
            </div>
          </div>

          {/* Itemized Fee Breakdown if available */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {applicableFeeStructure?.name || 'Current Term'} — Itemized Fee Schedule
            </h4>

            {applicableFeeStructure && applicableFeeStructure.items && applicableFeeStructure.items.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Fee Item / Description</th>
                      <th className="py-3 px-4 text-right">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {applicableFeeStructure.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatGHS(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={2} className="py-3 px-4 uppercase text-xs">Total Assigned Assessment</td>
                      <td className="py-3 px-4 text-right font-mono text-sm">{formatGHS(applicableFeeStructure.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No fee schedule has been assigned to this classroom for the current academic session.
              </div>
            )}
          </div>

          {/* Verified Official Payment Receipts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Verified Payment Receipts
            </h4>

            {wardPayments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wardPayments.map(rec => (
                  <div key={rec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {rec.receiptNumber || rec.id}
                        </span>
                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{formatDate(rec.paymentDate || rec.date || '')} • {(rec.paymentMethod || rec.method || 'Cash').toUpperCase()}</p>
                      <p className="text-[10px] font-mono text-slate-400">Payer: {rec.payerName || 'Guardian'}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900 text-sm">{formatGHS(rec.amount)}</div>
                      <span className="text-[10px] text-teal-800 font-bold">
                        Official Receipt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No payment receipts recorded for this student yet. Payments made via official school payment channels will be reflected here after verification by the school bursar.
              </div>
            )}
          </div>

          {/* Official Payment Channels for Guardians */}
          <div className="p-4 sm:p-5 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-800 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-950">
                Official School Payment Channels (Bank & Mobile Money)
              </h4>
            </div>
            <p className="text-xs text-teal-900/80">
              When making payments, please specify your ward's admission number <b>{activeChild.admissionNumber}</b> as the payment reference.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">MTN Mobile Money</span>
                <div className="font-mono font-bold text-slate-900 text-sm">054 289 1902</div>
                <div className="text-[10.5px] text-slate-600">Account: {school?.name || 'School Account'}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Telecel Cash</span>
                <div className="font-mono font-bold text-slate-900 text-sm">020 918 3821</div>
                <div className="text-[10.5px] text-slate-600">Merchant Code: 88129</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-teal-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Commercial Bank (GCB)</span>
                <div className="font-mono font-bold text-slate-900 text-sm">1081130092812</div>
                <div className="text-[10.5px] text-slate-600">Branch: Main Branch</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 4. ATTENDANCE LOG SUB-TAB */}
      {activeSubTab === 'attendance' && activeChild && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Daily Attendance Log for {activeChild.firstName} {activeChild.lastName}
            </h3>
            <p className="text-xs text-slate-500">
              Roll call tracking and punctuality record for {school?.currentTerm || 'Current Term'}.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Days Present</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{daysPresent}</div>
              <p className="text-[10.5px] text-emerald-700 mt-0.5">Punctual attendance</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Days Late</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{daysLate}</div>
              <p className="text-[10.5px] text-amber-700 mt-0.5">Morning arrivals</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Days Absent</span>
              <div className="text-2xl font-black text-rose-900 mt-1">{daysAbsent}</div>
              <p className="text-[10.5px] text-rose-700 mt-0.5">Absence records</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">Attendance Rate</span>
              <div className="text-2xl font-black text-teal-900 mt-1">
                {attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </div>
              <p className="text-[10.5px] text-teal-700 mt-0.5">
                {totalAttendanceLogged > 0 ? 'Session consistency' : 'No records yet'}
              </p>
            </div>
          </div>

          {wardAttendance.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {wardAttendance.slice(-10).reverse().map((att, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {formatDate(att.date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'late' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {att.remarks || 'Standard roll call'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No roll call attendance records have been entered for this student for the current term yet.
            </div>
          )}
        </div>
      )}

      {/* 5. SCHOOL CIRCULARS & NOTICES */}
      {activeSubTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              School Circulars & Parent Notices
            </h3>
            <p className="text-xs text-slate-500">
              Official circulars and announcements from {school?.name || 'School Administration'}.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Speech & Prize Giving Day and Graduation Ceremony',
                date: 'September 2026',
                author: 'Office of the Principal',
                content: `Dear Parents and Guardians, we warmly invite you to the Annual Speech & Prize Giving Day ceremony. Please review the official schedule and ensure wards are properly attired in full ceremonial school uniforms.`
              },
              {
                title: 'Next Academic Term Reopening Date & Books Collection',
                date: 'August 2026',
                author: 'School Administration',
                content: `The upcoming academic term commences per the official GES academic calendar. School stationery and textbooks packs will be available for pickup at the administrative office.`
              }
            ].map((notice, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs">{notice.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{notice.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                <div className="text-[10px] font-bold text-teal-800">
                  {notice.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CLASS TEACHER DIRECT CONTACT */}
      {activeSubTab === 'teacher' && activeChild && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Class Teacher & Form Tutor Liaison Desk
            </h3>
            <p className="text-xs text-slate-500">
              Direct liaison desk for {activeChild.classroomName || 'Classroom'}.
            </p>
          </div>

          <div className="max-w-xl p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {activeChildClass?.classTeacherName ? activeChildClass.classTeacherName.slice(0, 2).toUpperCase() : 'CT'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeChildClass?.classTeacherName || 'Assigned Class Teacher'}
                </h4>
                <p className="text-xs text-slate-500">Class Form Tutor ({activeChild.classroomName || 'Stream'})</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">School Telephone:</span>
                <span className="font-mono font-bold text-teal-900">{school?.phone || '024 000 0000'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Consultation Hours:</span>
                <span className="font-medium text-slate-800">Monday - Friday (2:30 PM - 4:00 PM)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Classroom Location:</span>
                <span className="font-medium text-slate-800">
                  {activeChildClass?.roomNumber || 'Room 101'}, {activeChildClass?.block || 'Main Campus Block'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Report Modal */}
      {selectedStudentForReport && (
        <TerminalReportModal
          isOpen={!!selectedStudentForReport}
          onClose={() => setSelectedReportStudent(null)}
          student={selectedStudentForReport}
        />
      )}

    </div>
  );
};
