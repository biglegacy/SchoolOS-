import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Student } from '../../types';
import { 
  User, 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2,
  CalendarCheck2,
  MessageSquare,
  Layers,
  Sparkles,
  MapPin,
  TrendingUp,
  Download,
  GraduationCap,
  CreditCard,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { formatGHS, formatDate } from '../../utils/formatting';
import { calculateStudentFeeBalance } from '../../utils/calculations';

interface StudentPortalViewProps {
  initialSubTab?: 'overview' | 'results' | 'reports' | 'fees' | 'attendance' | 'timetable' | 'notices';
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  initialSubTab = 'overview'
}) => {
  const { currentUser } = useAuth();
  const { 
    students, 
    classrooms, 
    school, 
    results = [], 
    examResults = [], 
    attendance = [],
    feeStructures = [],
    feePayments = [],
    settings 
  } = useSchool();
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'results' | 'reports' | 'fees' | 'attendance' | 'timetable' | 'notices'>(initialSubTab);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Match student by currentUser studentId or email/phone or first active student
  const me: Student | undefined = students.find(s => 
    s.id === currentUser?.studentId || 
    (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase())
  ) || students[0];

  const myClass = classrooms.find(c => c.id === me?.currentClassroomId);

  // Standardized Fee Calculations for this student
  const applicableFeeStructure = me 
    ? feeStructures.find(f => f.classroomId === me.currentClassroomId)
    : undefined;
  const myFeePayments = me 
    ? feePayments.filter(p => p.studentId === me.id)
    : [];
  const amountToBePaid = (me && typeof me.feesAmount === 'number' && !isNaN(me.feesAmount) && me.feesAmount >= 0)
    ? me.feesAmount
    : (applicableFeeStructure ? applicableFeeStructure.totalAmount : 0);
  const amountPaid = myFeePayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const { amountOwing, paymentStatus } = calculateStudentFeeBalance(amountToBePaid, amountPaid);

  // Real assessments data for this student
  const allResults = examResults.length > 0 ? examResults : results;
  const myResults = me ? allResults.filter(r => r.studentId === me.id) : [];
  const hasResults = myResults.length > 0;

  const totalScoreAggregate = myResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const overallAverage = hasResults ? (totalScoreAggregate / myResults.length).toFixed(1) : null;

  // Real attendance data for this student
  const myAttendance = me ? attendance.filter(a => a.studentId === me.id) : [];
  const totalDaysLogged = myAttendance.length;
  const daysPresent = myAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysLate = myAttendance.filter(a => a.status === 'late').length;
  const daysAbsent = myAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = totalDaysLogged > 0 ? Math.round((daysPresent / totalDaysLogged) * 100) : null;

  if (!me) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Student Learning Portal</h2>
          <p className="text-xs text-slate-500">
            No active student profile found. Once enrolled by the school administration, your learning dashboard, terminal reports, and attendance records will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. STUDENT PROFILE WELCOME HEADER (White Theme) */}
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {me.photoUrl ? (
              <img src={me.photoUrl} alt={me.firstName} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-2xs">
                {me.firstName[0]}{me.lastName[0]}
              </div>
            )}
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                <span>Student Learning Console</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {me.firstName} {me.lastName} {me.otherNames || ''}
              </h1>
              <p className="text-xs text-slate-500">
                Class: <b className="text-slate-900">{me.classroomName || 'Assigned Class'}</b> • Admission No: <b className="text-sky-600 font-mono">{me.admissionNumber}</b> {me.houseOrTeam && `• House: ${me.houseOrTeam}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('fees')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-700" />
              <span>Fee Status ({paymentStatus})</span>
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Official Report Card</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'My Overview', icon: Layers },
            { id: 'results', label: 'Continuous Assessment & Exams', icon: FileSpreadsheet },
            { id: 'reports', label: 'My Terminal Report', icon: FileText },
            { id: 'fees', label: 'My Fee Statement', icon: CreditCard },
            { id: 'attendance', label: 'My Attendance Log', icon: CalendarCheck2 },
            { id: 'timetable', label: 'Classroom Timetable', icon: Clock },
            { id: 'notices', label: 'School Notices', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'reports') {
                    setIsReportOpen(true);
                  } else {
                    setActiveSubTab(tab.id as any);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. STUDENT OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Performance Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assessed Subjects</span>
              <div className="text-2xl font-black text-teal-800 mt-1">
                {myResults.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {myClass?.subjects ? `${myClass.subjects.length} Registered Courses` : 'Active term courses'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Terminal Average</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {overallAverage ? `${overallAverage}%` : '—'}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {overallAverage ? 'Based on entered marks' : 'Pending exams entry'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Attendance Rate</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalDaysLogged > 0 ? `${daysPresent} of ${totalDaysLogged} roll calls` : 'No roll calls logged'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Academic Session</span>
              <div className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                {school?.currentAcademicYear || '2026/2027'}
              </div>
              <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                {school?.currentTerm || 'Term 3'}
              </p>
            </div>
          </div>

          {/* Enrolled Subjects & Class Teacher */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Registered Subjects Grid */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>My Enrolled Subjects & Scores</span>
                </h3>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.8 rounded-lg border border-teal-200">
                  {hasResults ? `${myResults.length} Assessed` : 'Active Term'}
                </span>
              </div>

              {hasResults ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myResults.map((item, idx) => {
                    const total = item.totalScore || ((item.classScore || 0) + (item.examScore || 0));
                    return (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {item.subjectName || (item as any).subject || `Subject ${idx + 1}`}
                          </h4>
                          <p className="text-[10.5px] text-slate-500">
                            Class: {item.classScore ?? '—'}/30 • Exam: {item.examScore ?? '—'}/70
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-teal-950 text-sm">{total}%</span>
                          <span className="block text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                            Grade {item.grade || '1'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">No assessment marks entered yet for this session.</p>
                  <p className="text-[11px] text-slate-400">Class continuous assessments and terminal examination scores will appear here once submitted by your teachers.</p>
                </div>
              )}
            </div>

            {/* Class Tutor & Room Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Form Teacher & Class Desk
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-900 text-white flex items-center justify-center font-bold text-sm">
                    {myClass?.classTeacherName ? myClass.classTeacherName.slice(0, 2).toUpperCase() : 'CT'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {myClass?.classTeacherName || 'Class Master / Tutor'}
                    </h4>
                    <p className="text-[10.5px] text-slate-500">GES Certified Educator</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Classroom:</span>
                    <span className="font-bold text-slate-800">{me.classroomName || 'Assigned Stream'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-bold text-slate-800">{myClass?.roomNumber || 'Room 101'}, {myClass?.block || 'Main Block'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resumption:</span>
                    <span className="font-bold text-teal-800">
                      {settings.reopeningDate ? formatDate(settings.reopeningDate) : 'Sept 2026'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsReportOpen(true)}
                className="w-full py-2.5 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Open Terminal Report Card</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. MY ASSESSMENT RESULTS SUB-TAB */}
      {activeSubTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Continuous Assessment (SBA 30%) & Terminal Examination (70%)
              </h3>
              <p className="text-xs text-slate-500">
                Academic Session: {school?.currentAcademicYear || '2026/2027'} • {school?.currentTerm || 'Term 3'}
              </p>
            </div>

            {hasResults && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-xl">
                  Cumulative Total: {totalScoreAggregate} / {myResults.length * 100} ({overallAverage}%)
                </span>
              </div>
            )}
          </div>

          {hasResults ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-3 text-center">Class SBA (30%)</th>
                    <th className="py-3 px-3 text-center">Exam (70%)</th>
                    <th className="py-3 px-3 text-center bg-slate-800">Total (100%)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-4">Subject Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {myResults.map((item, idx) => {
                    const total = item.totalScore || ((item.classScore || 0) + (item.examScore || 0));
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.subjectName || (item as any).subject || `Subject ${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">{item.classScore ?? '—'}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">{item.examScore ?? '—'}</td>
                        <td className="py-3 px-3 text-center font-mono font-black text-teal-950 bg-teal-50/60">{total}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-900">
                            Grade {item.grade || '1'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">{item.teacherRemarks || item.gradeRemark || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">No exam scores or SBA marks recorded yet.</p>
              <p className="text-[11px] text-slate-400">Your subject marks will be compiled here once entered by teachers.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. MY FEE STATEMENT SUB-TAB */}
      {activeSubTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                School Fees Statement & Account Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Official billing statement and verified receipts for <b>{me.firstName} {me.lastName}</b> ({me.admissionNumber}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                paymentStatus === 'Paid' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : paymentStatus === 'Partially Paid'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <Receipt className="w-3.5 h-3.5" />
                <span>Payment Status: <b>{paymentStatus}</b></span>
              </span>
            </div>
          </div>

          {/* Standard 3-Card Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Amount to Be Paid
              </span>
              <div className="text-lg font-black text-slate-900">
                {formatGHS(amountToBePaid)}
              </div>
              <span className="text-[10px] text-slate-500">Assigned fee for {school?.currentTerm || 'current term'}</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block mb-1">
                Amount Paid
              </span>
              <div className="text-lg font-black text-emerald-700">
                {formatGHS(amountPaid)}
              </div>
              <span className="text-[10px] text-emerald-700">Total verified bursary payments</span>
            </div>

            <div className={`p-4 rounded-xl border ${amountOwing > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${amountOwing > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                Amount Owing / Balance
              </span>
              <div className={`text-lg font-black ${amountOwing > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {formatGHS(amountOwing)}
              </div>
              <span className="text-[10px] text-slate-500">
                {amountOwing > 0 ? 'Outstanding balance' : 'Zero balance — All clear (₵0.00)'}
              </span>
            </div>
          </div>

          {/* Itemized Fee Structure */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {applicableFeeStructure?.name || 'Class Fee Schedule'} — Breakdown
            </h4>

            {applicableFeeStructure && applicableFeeStructure.items && applicableFeeStructure.items.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Item Name / Description</th>
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

          {/* Verified Official Receipts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Verified Payment Receipts
            </h4>

            {myFeePayments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myFeePayments.map(rec => (
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
                      {(rec.transactionReference || rec.reference) && (
                        <p className="text-[10px] font-mono text-teal-700 font-medium">
                          Ref: {rec.transactionReference || rec.reference}
                        </p>
                      )}
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
                No fee payment receipts recorded yet for this session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MY ATTENDANCE LOG SUB-TAB */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Personal Term Attendance Record
            </h3>
            <p className="text-xs text-slate-500">
              Recorded daily roll call entries for {school?.currentAcademicYear || '2026/2027'} {school?.currentTerm || 'Term 3'}.
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
              <p className="text-[10.5px] text-amber-700 mt-0.5">Late arrival recorded</p>
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
                {totalDaysLogged > 0 ? `${totalDaysLogged} total sessions` : 'No logs yet'}
              </p>
            </div>
          </div>

          {myAttendance.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myAttendance.slice(-10).reverse().map((att, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{formatDate(att.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'late' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{att.remarks || 'Recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No roll call attendance records logged yet for this student.
            </div>
          )}
        </div>
      )}

      {/* 4. WEEKLY TIMETABLE SUB-TAB */}
      {activeSubTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              Weekly Classroom Timetable ({me.classroomName || 'Current Class'})
            </h3>
            <p className="text-xs text-slate-500">
              Monday through Friday period allocations per the standard Ghana Education Service basic timetable.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Monday</th>
                  <th className="py-3 px-3">Tuesday</th>
                  <th className="py-3 px-3">Wednesday</th>
                  <th className="py-3 px-3">Thursday</th>
                  <th className="py-3 px-3">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { time: '08:00 - 09:15', mon: 'English Language', tue: 'Mathematics', wed: 'English Language', thu: 'Mathematics', fri: 'Science Practical' },
                  { time: '09:15 - 10:30', mon: 'Mathematics', tue: 'Integrated Science', wed: 'Computing / ICT', thu: 'Ghanaian Language', fri: 'Creative Arts' },
                  { time: '10:30 - 11:00', mon: 'Snack Break', tue: 'Snack Break', wed: 'Snack Break', thu: 'Snack Break', fri: 'Snack Break', isBreak: true },
                  { time: '11:00 - 12:15', mon: 'Integrated Science', tue: 'OWOP', wed: 'RME', thu: 'English Grammar', fri: 'P.H.E & Sports' },
                  { time: '12:15 - 01:15', mon: 'Ghanaian Language', tue: 'Creative Arts', wed: 'OWOP', thu: 'Computing Lab', fri: 'Debate / Clubs' },
                  { time: '01:15 - 02:00', mon: 'Library Reading', tue: 'RME', wed: 'Mathematics', thu: 'Science Review', fri: 'Closing Roll Call' }
                ].map((row, idx) => (
                  <tr key={idx} className={row.isBreak ? 'bg-amber-50/70 font-bold text-amber-900' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{row.time}</td>
                    <td className="py-2.5 px-3">{row.mon}</td>
                    <td className="py-2.5 px-3">{row.tue}</td>
                    <td className="py-2.5 px-3">{row.wed}</td>
                    <td className="py-2.5 px-3">{row.thu}</td>
                    <td className="py-2.5 px-3">{row.fri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STUDENT NOTICES SUB-TAB */}
      {activeSubTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              School Announcements & Student Bulletins
            </h3>
            <p className="text-xs text-slate-500">
              Important school updates from the headteacher and form teachers.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { 
                title: 'Speech and Prize-Giving Day Ceremony', 
                date: 'September 2026', 
                content: 'The Annual Graduation and Prize Distribution ceremony will celebrate outstanding student achievements. Pupils receiving awards must report in full ceremonial uniform.' 
              },
              { 
                title: 'Term Vacation and Next Term Reopening', 
                date: 'August 2026', 
                content: `Vacation commences at the close of term. The next academic session will reopen per the official school calendar. Ensure all library books are returned before vacation.` 
              }
            ].map((n, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{n.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Report Modal */}
      {isReportOpen && (
        <TerminalReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          student={me}
        />
      )}

    </div>
  );
};
