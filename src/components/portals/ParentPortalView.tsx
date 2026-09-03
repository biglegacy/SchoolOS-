import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingUp,
  Search,
  X,
  UserX
} from 'lucide-react';
import { formatGHS, formatDate, formatGhanaPhone } from '../../utils/formatting';
import { calculateStudentFeeBalance } from '../../utils/calculations';
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
    students = [], 
    classrooms = [], 
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Authorized wards for this parent (strictly retrieved by parent ID authentication)
  const authorizedWards = useMemo(() => {
    return students;
  }, [students]);

  // Instant real-time search filtering across name, admission number, student ID, classroom, and level
  const filteredWards = useMemo(() => {
    if (!searchQuery.trim()) return authorizedWards;
    const q = searchQuery.toLowerCase().trim();
    return authorizedWards.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.otherNames || ''}`.toLowerCase();
      const adm = (s.admissionNumber || '').toLowerCase();
      const id = (s.id || '').toLowerCase();
      const cls = (s.classroomName || '').toLowerCase();
      const lvl = (s.level || '').toLowerCase();
      return fullName.includes(q) || adm.includes(q) || id.includes(q) || cls.includes(q) || lvl.includes(q);
    });
  }, [authorizedWards, searchQuery]);

  // Keep active selected student synchronized with search results
  useEffect(() => {
    if (filteredWards.length > 0) {
      if (!selectedStudentId || !filteredWards.some(w => w.id === selectedStudentId)) {
        setSelectedStudentId(filteredWards[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [filteredWards, selectedStudentId]);

  const activeChild: Student | undefined = filteredWards.find(w => w.id === selectedStudentId) || filteredWards[0];

  const activeChildClass = classrooms.find(c => c.id === activeChild?.currentClassroomId);

  // Real Fee Information for Active Ward
  const applicableFeeStructure = activeChild 
    ? feeStructures.find(f => f.classroomId === activeChild.currentClassroomId) 
    : undefined;
  
  const wardPayments = activeChild 
    ? feePayments.filter(p => p.studentId === activeChild.id)
    : [];

  const amountToBePaid = (activeChild && typeof activeChild.feesAmount === 'number' && !isNaN(activeChild.feesAmount) && activeChild.feesAmount >= 0)
    ? activeChild.feesAmount
    : (applicableFeeStructure ? applicableFeeStructure.totalAmount : 0);
  const amountPaid = wardPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const { amountOwing, paymentStatus } = calculateStudentFeeBalance(amountToBePaid, amountPaid);
  const totalBilled = amountToBePaid;
  const totalPaid = amountPaid;
  const outstandingBalance = amountOwing;
  const isFullyPaid = paymentStatus === 'Paid';

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

  if (authorizedWards.length === 0) {
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
      
      {/* 1. PARENT WELCOME & PROMINENT STUDENT SEARCH BAR */}
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
              <span>Parent & Guardian Console</span>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Welcome, {currentUser?.fullName || 'Parent / Guardian'}
            </h1>
            
            <p className="text-xs text-slate-500">
              Monitoring <b className="text-slate-900">{authorizedWards.length} Registered Ward{authorizedWards.length > 1 ? 's' : ''}</b> at <b className="text-slate-900">{school?.name}</b>
            </p>
          </div>

          {activeChild && (
            <button
              onClick={() => setSelectedReportStudent(activeChild)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Official Terminal Report Card</span>
            </button>
          )}
        </div>

        {/* PROMINENT STUDENT SEARCH BAR */}
        <div className="pt-2">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your registered wards by student name, admission #, student ID, or classroom..."
              className="w-full pl-10 pr-28 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 rounded-xl text-xs font-medium text-slate-900 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-14 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute right-3">
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                {filteredWards.length} {filteredWards.length === 1 ? 'ward' : 'wards'}
              </span>
            </div>
          </div>
        </div>

        {/* MULTI-CHILD SELECTION STRIP / WARD CARDS */}
        {filteredWards.length > 0 ? (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                {searchQuery ? 'Search Results / Select Ward:' : 'Your Registered Wards:'}
              </span>
              {searchQuery && (
                <span className="text-xs text-teal-800 font-medium">
                  Showing matches for "{searchQuery}"
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredWards.map((child) => {
                const isSelected = activeChild?.id === child.id;
                const childPayments = feePayments.filter(p => p.studentId === child.id);
                const childBilled = (typeof child.feesAmount === 'number' && child.feesAmount >= 0)
                  ? child.feesAmount
                  : (feeStructures.find(f => f.classroomId === child.currentClassroomId)?.totalAmount || 0);
                const childPaid = childPayments.reduce((acc, c) => acc + (c.amount || 0), 0);
                const childOwing = Math.max(0, childBilled - childPaid);

                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedStudentId(child.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/90 border-teal-600 shadow-2xs ring-1 ring-teal-600'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {child.photoUrl ? (
                        <img
                          src={child.photoUrl}
                          alt={child.firstName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {child.firstName} {child.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          <span className="font-mono text-teal-900 font-semibold">{child.admissionNumber}</span> • {child.classroomName || 'Class'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {childOwing === 0 ? (
                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          Fees Paid
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                          {formatGHS(childOwing)} Due
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* EMPTY STATE WHEN NO STUDENT MATCHES SEARCH QUERY */
          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">No Registered Wards Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No students linked to your account match "<b>{searchQuery}</b>". Please check the spelling of the name, student ID, admission number, or classroom.
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search Filter</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
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
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
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
                    Student Fee Status
                  </h3>
                  {paymentStatus === 'Paid' ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Paid (₵0.00)
                    </span>
                  ) : paymentStatus === 'Partially Paid' ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Partially Paid
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Unpaid
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Amount to Be Paid:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {amountToBePaid > 0 ? formatGHS(amountToBePaid) : 'GH₵ 0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold">{formatGHS(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-sm">
                    <span>Amount Owing / Balance:</span>
                    <span className={`font-mono ${amountOwing === 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {formatGHS(amountOwing)}
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
              <span className="text-[10px] text-slate-500">Total assigned for academic term</span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block mb-1">
                Amount Paid
              </span>
              <div className="text-lg font-black text-emerald-700">
                {formatGHS(amountPaid)}
              </div>
              <span className="text-[10px] text-emerald-700">Verified receipts to date</span>
            </div>

            <div className={`p-4 rounded-xl border ${amountOwing > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${amountOwing > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                Amount Owing / Balance
              </span>
              <div className={`text-lg font-black ${amountOwing > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {formatGHS(amountOwing)}
              </div>
              <span className="text-[10px] text-slate-500">
                {amountOwing > 0 ? 'Outstanding balance remaining' : 'Fully settled (₵0.00)'}
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
                No payment receipts recorded for this student yet. Payments made via official school payment channels will be reflected here after verification by the school bursar.
              </div>
            )}
          </div>

          {/* Official Payment Channels for Guardians */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Official School Payment Channels
              </h4>
            </div>

            {school?.bankAccountNumber || school?.momoNumber || school?.paymentInstructions ? (
              <>
                <p className="text-xs text-slate-600">
                  When making payments, please specify your ward's admission number <b className="text-slate-900">{activeChild.admissionNumber}</b> as the payment reference.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
                  {school?.momoNumber && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                        {school?.momoProvider || 'Mobile Money'}
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-sm tracking-wide">{school.momoNumber}</div>
                      {school.momoAccountName && (
                        <div className="text-[11px] text-slate-600">Account: {school.momoAccountName}</div>
                      )}
                    </div>
                  )}

                  {(school?.bankName || school?.bankAccountNumber) && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                        {school.bankName || 'Bank Deposit / Transfer'}
                      </span>
                      {school.bankAccountNumber && (
                        <div className="font-mono font-bold text-slate-900 text-sm tracking-wide">{school.bankAccountNumber}</div>
                      )}
                      {school.bankAccountName && (
                        <div className="text-[11px] text-slate-600">Account: {school.bankAccountName}</div>
                      )}
                      {school.bankBranch && (
                        <div className="text-[10.5px] text-slate-500">Branch: {school.bankBranch}</div>
                      )}
                    </div>
                  )}

                  {school?.paymentInstructions && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Payment Instructions
                      </span>
                      <p className="text-xs text-slate-700 whitespace-pre-line">{school.paymentInstructions}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                Official bank and mobile money payment details have not yet been published in the system. Please contact the school accounts office or bursary directly for fee settlement instructions.
              </div>
            )}
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
              Official circulars and announcements {school?.name ? `from ${school.name}` : ''}.
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
