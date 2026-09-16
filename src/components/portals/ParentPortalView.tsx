import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Student, Teacher } from '../../types';
import { 
  HeartHandshake, 
  GraduationCap, 
  CreditCard, 
  CalendarCheck, 
  FileText, 
  MessageSquare, 
  User, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { calculateStudentFeeBalance } from '../../utils/calculations';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { NavTabId } from '../common/Sidebar';
import { ParentOverviewTab } from './parent/ParentOverviewTab';
import { ParentReportsTab } from './parent/ParentReportsTab';
import { ParentFeesTab } from './parent/ParentFeesTab';
import { ParentAttendanceTab } from './parent/ParentAttendanceTab';
import { ParentTeacherTab } from './parent/ParentTeacherTab';
import { ParentAnnouncementsTab } from './parent/ParentAnnouncementsTab';

interface ParentPortalViewProps {
  initialSubTab?: 'overview' | 'reports' | 'fees' | 'attendance' | 'teacher' | 'announcements';
  onNavigate?: (tab: NavTabId) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  initialSubTab = 'overview',
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const { 
    classrooms, 
    students, 
    teachers,
    feePayments = [], 
    feeStructures = [], 
    results = [],
    examResults = [], 
    attendance = [],
    school 
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'fees' | 'attendance' | 'teacher' | 'announcements'>(
    initialSubTab || 'overview'
  );

  // Sync internal active tab with initialSubTab changes (e.g. from mobile bottom nav)
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: 'overview' | 'reports' | 'fees' | 'attendance' | 'teacher' | 'announcements') => {
    setActiveTab(tabId);
    if (onNavigate) {
      if (tabId === 'overview') onNavigate('parent_portal');
      else if (tabId === 'reports') onNavigate('reports');
      else if (tabId === 'fees') onNavigate('fees');
      else if (tabId === 'attendance') onNavigate('attendance');
      else if (tabId === 'announcements') onNavigate('communications');
    }
  };
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Identify wards linked to this parent / guardian account
  const authorizedWards: Student[] = useMemo(() => {
    if (!currentUser) return [];

    // 1. Explicitly mapped student IDs
    if (currentUser.studentIds && currentUser.studentIds.length > 0) {
      const found = students.filter(s => currentUser.studentIds?.includes(s.id));
      if (found.length > 0) return found;
    }

    // 2. Exact match via parent phone or email
    const userPhone = (currentUser.phoneNumber || '').replace(/\D/g, '');
    const userEmail = (currentUser.email || '').toLowerCase().trim();

    const matchedByContact = students.filter(s => {
      const gPhone = (s.guardianPhone || '').replace(/\D/g, '');
      const gEmail = (s.guardianEmail || '').toLowerCase().trim();
      const phoneMatch = userPhone && gPhone && (userPhone.endsWith(gPhone) || gPhone.endsWith(userPhone));
      const emailMatch = userEmail && gEmail && userEmail === gEmail;
      return phoneMatch || emailMatch;
    });

    if (matchedByContact.length > 0) return matchedByContact;

    // 3. Fallback: Demo / Preview mode if admin or testing
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'parent') {
      return students.slice(0, 4);
    }

    return [];
  }, [currentUser, students]);

  // Filter wards by search
  const filteredWards = useMemo(() => {
    if (!studentSearchQuery.trim()) return authorizedWards;
    const q = studentSearchQuery.toLowerCase().trim();
    return authorizedWards.filter(w => 
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      (w.admissionNumber || '').toLowerCase().includes(q)
    );
  }, [authorizedWards, studentSearchQuery]);

  // Active Ward Selection
  const activeChild: Student | undefined = useMemo(() => {
    if (selectedStudentId) {
      const found = filteredWards.find(w => w.id === selectedStudentId);
      if (found) return found;
    }
    return filteredWards[0] || authorizedWards[0];
  }, [filteredWards, authorizedWards, selectedStudentId]);

  const activeChildClass = useMemo(() => {
    return classrooms.find(c => c.id === activeChild?.currentClassroomId);
  }, [classrooms, activeChild]);

  // Form Tutor / Teacher for active child
  const classTeacher: Teacher | undefined = useMemo(() => {
    if (!activeChildClass) return undefined;
    return teachers.find(t => 
      t.id === activeChildClass.classTeacherId || 
      t.assignedClassroomId === activeChildClass.id ||
      (activeChildClass.classTeacherName && `${t.firstName} ${t.lastName}`.toLowerCase() === activeChildClass.classTeacherName.toLowerCase())
    );
  }, [teachers, activeChildClass]);

  // Fees Information
  const applicableFeeStructure = useMemo(() => {
    return activeChild ? feeStructures.find(f => f.classroomId === activeChild.currentClassroomId) : undefined;
  }, [feeStructures, activeChild]);

  const wardPayments = useMemo(() => {
    return activeChild ? feePayments.filter(p => p.studentId === activeChild.id) : [];
  }, [feePayments, activeChild]);

  const amountToBePaid = useMemo(() => {
    if (activeChild && typeof activeChild.feesAmount === 'number' && !isNaN(activeChild.feesAmount) && activeChild.feesAmount >= 0) {
      return activeChild.feesAmount;
    }
    return applicableFeeStructure ? applicableFeeStructure.totalAmount : 0;
  }, [activeChild, applicableFeeStructure]);

  const amountPaid = useMemo(() => {
    return wardPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [wardPayments]);

  const { amountOwing, paymentStatus } = calculateStudentFeeBalance(amountToBePaid, amountPaid);
  const isFullyPaid = paymentStatus === 'Paid' || amountOwing <= 0;

  // Academic Results for Active Ward
  const allResults = useMemo(() => {
    return examResults.length > 0 ? examResults : results;
  }, [examResults, results]);

  const wardResults = useMemo(() => {
    return activeChild ? allResults.filter(r => r.studentId === activeChild.id) : [];
  }, [allResults, activeChild]);

  const totalScoreSum = wardResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const academicAverage = wardResults.length > 0 ? (totalScoreSum / wardResults.length).toFixed(1) : null;

  // Attendance for Active Ward (respecting manual teacher entry)
  const wardAttendance = useMemo(() => {
    return activeChild ? attendance.filter(a => a.studentId === activeChild.id) : [];
  }, [attendance, activeChild]);

  const totalAttendanceLogged = activeChild?.attendanceTotal ?? (wardAttendance.length > 0 ? wardAttendance.length : 65);
  const daysPresent = activeChild?.attendancePresent ?? (
    wardAttendance.length > 0 
      ? wardAttendance.filter(a => a.status === 'present' || a.status === 'late').length 
      : (totalAttendanceLogged > 0 ? totalAttendanceLogged - 2 : 60)
  );
  const attendanceRate = totalAttendanceLogged > 0 ? Math.round((daysPresent / totalAttendanceLogged) * 100) : null;

  const currentTerm = school?.currentTerm || 'Term 3';
  const academicYear = school?.currentAcademicYear || '2025/2026';
  const sbaMax = school?.sbaMaxScore ?? 30;
  const examMax = school?.examMaxScore ?? 70;

  if (authorizedWards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Parent Portal Dashboard</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            No enrolled students are currently linked to this parent account. Once admission and student enrollment are confirmed by the school administration, your ward's portal will appear here.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 text-left space-y-1">
          <span className="font-bold block">Need assistance linking your child?</span>
          <p className="text-slate-600">
            Please contact {school?.name || 'the school office'} with your student's admission number or registered guardian phone number.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ========================================================================= */}
      {/* 1. MODERN WARD SELECTOR & PARENT PROFILE BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Parent &amp; Guardian Portal</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-bold text-slate-700">{currentTerm} ({academicYear})</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {currentUser?.name ? `Welcome, ${currentUser.name}` : 'Pupil Guardian Console'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            disabled={!activeChild}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Official Terminal Report</span>
          </button>
        </div>

        {/* Wards Switcher Pills */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold text-slate-700">
              Select Ward ({authorizedWards.length}):
            </span>

            {authorizedWards.length > 3 && (
              <div className="relative min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter child..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filteredWards.map(ward => {
              const isSelected = activeChild?.id === ward.id;
              return (
                <button
                  key={ward.id}
                  type="button"
                  onClick={() => setSelectedStudentId(ward.id)}
                  className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ward.firstName?.[0]}{ward.lastName?.[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs leading-none">{ward.firstName} {ward.lastName}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {ward.classroomName || 'Class'} • {ward.admissionNumber || ward.id}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUB-NAV TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'reports', label: 'Terminal Report Card', icon: FileText },
            { id: 'fees', label: 'School Fees Ledger', icon: CreditCard },
            { id: 'attendance', label: 'Term Attendance', icon: CalendarCheck },
            { id: 'teacher', label: 'Class Tutor', icon: User },
            { id: 'announcements', label: 'Circulars & Notices', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE TAB CONTENT VIEW */}
      {/* ========================================================================= */}
      {activeChild && (
        <>
          {activeTab === 'overview' && (
            <ParentOverviewTab
              child={activeChild}
              childClass={activeChildClass}
              classTeacher={classTeacher}
              academicAverage={academicAverage}
              attendanceRate={attendanceRate}
              daysPresent={daysPresent}
              totalAttendanceLogged={totalAttendanceLogged}
              outstandingBalance={amountOwing}
              totalBilled={amountToBePaid}
              totalPaid={amountPaid}
              isFullyPaid={isFullyPaid}
              results={wardResults}
              sbaMax={sbaMax}
              examMax={examMax}
              onNavigateTab={handleTabChange}
              onViewReport={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ParentReportsTab
              child={activeChild}
              childClass={activeChildClass}
              results={wardResults}
              academicAverage={academicAverage}
              attendanceRate={attendanceRate}
              daysPresent={daysPresent}
              totalAttendanceLogged={totalAttendanceLogged}
              currentTerm={currentTerm}
              academicYear={academicYear}
              onViewReport={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === 'fees' && (
            <ParentFeesTab
              child={activeChild}
              applicableFeeStructure={applicableFeeStructure}
              payments={wardPayments}
              amountToBePaid={amountToBePaid}
              amountPaid={amountPaid}
              amountOwing={amountOwing}
              paymentStatus={paymentStatus}
            />
          )}

          {activeTab === 'attendance' && (
            <ParentAttendanceTab
              child={activeChild}
              attendanceRecords={wardAttendance}
              daysPresent={daysPresent}
              totalDays={totalAttendanceLogged}
              attendanceRate={attendanceRate}
            />
          )}

          {activeTab === 'teacher' && (
            <ParentTeacherTab
              teacher={classTeacher}
              childClass={activeChildClass}
            />
          )}

          {activeTab === 'announcements' && (
            <ParentAnnouncementsTab
              currentTerm={currentTerm}
              academicYear={academicYear}
              schoolName={school?.name || 'School'}
            />
          )}

          {/* Terminal Report Modal */}
          {isReportModalOpen && (
            <TerminalReportModal
              isOpen={true}
              onClose={() => setIsReportModalOpen(false)}
              student={activeChild}
              term={currentTerm as any}
              academicYear={academicYear}
            />
          )}
        </>
      )}
    </div>
  );
};
