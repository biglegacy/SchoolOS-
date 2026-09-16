import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Student, Teacher, TeacherSubjectAssignment, TimetableSlot } from '../../types';
import { 
  GraduationCap, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  BookOpen, 
  Clock, 
  CalendarCheck, 
  MessageSquare, 
  ChevronDown, 
  School as SchoolIcon,
  CheckCircle2,
  Sparkles,
  Search,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { NavTabId } from '../common/Sidebar';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { TeacherOverviewTab } from './teacher/TeacherOverviewTab';
import { TeacherMarksTab } from './teacher/TeacherMarksTab';
import { TeacherAttendanceTab } from './teacher/TeacherAttendanceTab';
import { TeacherReportsTab } from './teacher/TeacherReportsTab';
import { TeacherStudentsTab } from './teacher/TeacherStudentsTab';
import { TeacherAssignmentsTab } from './teacher/TeacherAssignmentsTab';
import { TeacherTimetableTab } from './teacher/TeacherTimetableTab';
import { TeacherNoticesTab } from './teacher/TeacherNoticesTab';

interface TeacherPortalViewProps {
  onNavigate?: (tab: NavTabId) => void;
  initialSubTab?: 'overview' | 'assignments' | 'results' | 'attendance' | 'reports' | 'students' | 'timetable' | 'notices';
}

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({ 
  onNavigate,
  initialSubTab = 'overview'
}) => {
  const { currentUser } = useAuth();
  const { 
    classrooms, 
    students, 
    teachers,
    results = [],
    examResults = [], 
    recordExamResult,
    updateStudent,
    school
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'assignments' | 'results' | 'attendance' | 'reports' | 'students' | 'timetable' | 'notices'>(
    initialSubTab || 'overview'
  );
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);

  // Sync active sub-tab if initialSubTab prop changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabClick = (tabId: 'overview' | 'assignments' | 'results' | 'attendance' | 'reports' | 'students' | 'timetable' | 'notices') => {
    setActiveSubTab(tabId);
    if (onNavigate) {
      if (tabId === 'overview') onNavigate('teacher_portal');
      else if (tabId === 'results') onNavigate('results');
      else if (tabId === 'reports') onNavigate('reports');
      else if (tabId === 'students') onNavigate('students');
      else if (tabId === 'attendance') onNavigate('attendance');
      else if (tabId === 'notices') onNavigate('communications');
    }
  };

  // Active Teacher Profile Resolution
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    const matched = teachers.find(
      t => t.id === currentUser?.teacherId || t.id === currentUser?.id || (currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    return matched?.id || teachers[0]?.id || '';
  });

  const activeTeacher: Teacher | undefined = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // Derive teaching assignments
  const assignments: TeacherSubjectAssignment[] = useMemo(() => {
    if (!activeTeacher) return [];
    if (activeTeacher.assignedSubjects && activeTeacher.assignedSubjects.length > 0) {
      return activeTeacher.assignedSubjects;
    }
    const legacyClass = classrooms.find(c => c.id === activeTeacher.assignedClassroomId);
    if (legacyClass && activeTeacher.subjectsTaught && activeTeacher.subjectsTaught.length > 0) {
      return activeTeacher.subjectsTaught.map(s => ({
        id: `asgn_${s}_${legacyClass.id}`,
        subjectName: s,
        classroomId: legacyClass.id,
        classroomName: legacyClass.name
      }));
    }
    if (legacyClass) {
      return (legacyClass.subjects || ['Mathematics', 'English Language', 'Integrated Science']).map(s => ({
        id: `asgn_${s}_${legacyClass.id}`,
        subjectName: s,
        classroomId: legacyClass.id,
        classroomName: legacyClass.name
      }));
    }
    return [];
  }, [activeTeacher, classrooms]);

  // Distinct subjects taught by this teacher
  const distinctSubjects = useMemo(() => {
    const list = assignments.map(a => a.subjectName);
    return Array.from(new Set(list));
  }, [assignments]);

  // Distinct classrooms taught by this teacher
  const distinctClassroomIds = useMemo(() => {
    const ids = assignments.map(a => a.classroomId);
    if (activeTeacher?.assignedClassroomId) ids.push(activeTeacher.assignedClassroomId);
    return Array.from(new Set(ids));
  }, [assignments, activeTeacher]);

  const distinctClassrooms = useMemo(() => {
    const cls = classrooms.filter(c => distinctClassroomIds.includes(c.id));
    return cls.length > 0 ? cls : classrooms;
  }, [classrooms, distinctClassroomIds]);

  // Total unique students taught by this teacher
  const myStudents = useMemo(() => {
    const sts = students.filter(s => distinctClassroomIds.includes(s.currentClassroomId));
    return sts.length > 0 ? sts : students;
  }, [students, distinctClassroomIds]);

  // Primary selected classroom for tabs
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(() => {
    return distinctClassrooms[0]?.id || classrooms[0]?.id || '';
  });

  useEffect(() => {
    if (distinctClassrooms.length > 0 && (!selectedClassroomId || !distinctClassrooms.some(c => c.id === selectedClassroomId))) {
      setSelectedClassroomId(distinctClassrooms[0].id);
    }
  }, [distinctClassrooms, selectedClassroomId]);

  const allResults = useMemo(() => {
    return examResults.length > 0 ? examResults : results;
  }, [examResults, results]);

  const sbaMax = school?.sbaMaxScore ?? 30;
  const examMax = school?.examMaxScore ?? 70;
  const currentTerm = (school?.currentTerm || 'Term 3') as 'Term 1' | 'Term 2' | 'Term 3';
  const academicYear = school?.currentAcademicYear || '2025/2026';

  // Count pending assessments for this teacher's assignments
  const pendingAssessmentsCount = useMemo(() => {
    let pending = 0;
    assignments.forEach(asgn => {
      const classSts = students.filter(s => s.currentClassroomId === asgn.classroomId);
      classSts.forEach(st => {
        const found = allResults.find(
          r => r.studentId === st.id &&
               (r.subjectName?.toLowerCase() === asgn.subjectName.toLowerCase() || (r as any).subject?.toLowerCase() === asgn.subjectName.toLowerCase()) &&
               r.term === currentTerm
        );
        if (!found || (found.classScore === 0 && found.examScore === 0)) {
          pending++;
        }
      });
    });
    return pending;
  }, [assignments, students, allResults, currentTerm]);

  // Save Marks handler
  const handleSaveMarks = async (
    subject: string,
    classroomId: string,
    term: 'Term 1' | 'Term 2' | 'Term 3',
    marksMap: { [studentId: string]: { classScore: number; examScore: number; remarks?: string } }
  ) => {
    const targetClass = classrooms.find(c => c.id === classroomId);
    const promises = Object.entries(marksMap).map(async ([studentId, mark]) => {
      const st = students.find(s => s.id === studentId);
      if (!st) return;
      const total = (mark.classScore || 0) + (mark.examScore || 0);
      await recordExamResult({
        studentId,
        studentName: `${st.firstName} ${st.lastName}`,
        admissionNumber: st.admissionNumber,
        classroomId,
        classroomName: targetClass?.name || 'Classroom',
        subjectName: subject,
        assessmentType: 'continuous_assessment',
        classScore: mark.classScore || 0,
        examScore: mark.examScore || 0,
        totalScore: total,
        term,
        academicYear,
        teacherRemarks: mark.remarks || ''
      });
    });
    await Promise.all(promises);
  };

  // Save Attendance handler
  const handleSaveAttendance = async (
    attendanceMap: { [studentId: string]: { present: number; total: number; remarks?: string } }
  ) => {
    const entries = Object.entries(attendanceMap);
    for (const [studentId, data] of entries) {
      await updateStudent(studentId, {
        attendancePresent: data.present,
        attendanceTotal: data.total,
        attendanceRemarks: data.remarks
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. MODERN TEACHER HEADER & PROFILE BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Teacher Profile Snapshot */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0 border border-slate-800">
              {activeTeacher?.photoUrl ? (
                <img 
                  src={activeTeacher.photoUrl} 
                  alt={activeTeacher.firstName} 
                  className="w-full h-full object-cover rounded-2xl" 
                />
              ) : (
                `${activeTeacher?.firstName?.[0] || 'T'}${activeTeacher?.lastName?.[0] || ''}`
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {activeTeacher ? `${activeTeacher.firstName} ${activeTeacher.lastName}` : 'Teacher Workspace'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {activeTeacher?.staffId || 'Staff Tutor'}
                </span>
                {activeTeacher?.assignedClassroomName && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Form Tutor: {activeTeacher.assignedClassroomName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{activeTeacher?.qualification || 'Certified Educator'}</span>
                <span>•</span>
                <span>{school?.name || 'SchoolOS'}</span>
                <span>•</span>
                <span className="font-mono font-semibold text-slate-700">{currentTerm} ({academicYear})</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts / Teacher Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {teachers.length > 1 && (
              <div className="relative">
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:bg-white"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.assignedClassroomName || 'Teacher'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleTabClick('results')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'results'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Enter Marks</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('attendance')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'attendance'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Term Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('reports')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'reports'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MODERN SUB-NAV TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'results', label: `SBA & Marks (${sbaMax}/${examMax})`, icon: FileSpreadsheet, badge: pendingAssessmentsCount > 0 ? `${pendingAssessmentsCount} Pending` : undefined },
            { id: 'attendance', label: 'Term Attendance', icon: CalendarCheck },
            { id: 'reports', label: 'Terminal Reports', icon: FileText },
            { id: 'students', label: 'Pupils Directory', icon: Users, count: myStudents.length },
            { id: 'assignments', label: 'Teaching Load', icon: BookOpen, count: assignments.length },
            { id: 'timetable', label: 'Timetable', icon: Clock },
            { id: 'notices', label: 'Staff Notices', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-100 text-amber-800 border border-amber-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE TAB CONTENT VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <TeacherOverviewTab
          teacher={activeTeacher}
          assignments={assignments}
          distinctSubjects={distinctSubjects}
          distinctClassrooms={distinctClassrooms}
          myStudents={myStudents}
          currentTerm={currentTerm}
          academicYear={academicYear}
          pendingAssessmentsCount={pendingAssessmentsCount}
          onNavigateTab={handleTabClick}
          onViewReport={(st) => setSelectedReportStudent(st)}
        />
      )}

      {activeSubTab === 'results' && (
        <TeacherMarksTab
          assignments={assignments}
          distinctSubjects={distinctSubjects}
          distinctClassrooms={distinctClassrooms}
          students={students}
          allResults={allResults}
          sbaMax={sbaMax}
          examMax={examMax}
          currentTerm={currentTerm}
          academicYear={academicYear}
          onSaveMarks={handleSaveMarks}
        />
      )}

      {activeSubTab === 'attendance' && (
        <TeacherAttendanceTab
          students={students}
          classrooms={distinctClassrooms}
          selectedClassroomId={selectedClassroomId}
          onSelectClassroomId={setSelectedClassroomId}
          currentTerm={currentTerm}
          academicYear={academicYear}
          onSaveAttendance={handleSaveAttendance}
          onViewReport={(st) => setSelectedReportStudent(st)}
        />
      )}

      {activeSubTab === 'reports' && (
        <TeacherReportsTab
          students={students}
          classrooms={distinctClassrooms}
          selectedClassroomId={selectedClassroomId}
          onSelectClassroomId={setSelectedClassroomId}
          allResults={allResults}
          currentTerm={currentTerm}
          academicYear={academicYear}
          onViewReport={(st) => setSelectedReportStudent(st)}
        />
      )}

      {activeSubTab === 'students' && (
        <TeacherStudentsTab
          students={students}
          classrooms={distinctClassrooms}
          selectedClassroomId={selectedClassroomId}
          onSelectClassroomId={setSelectedClassroomId}
          onViewReport={(st) => setSelectedReportStudent(st)}
        />
      )}

      {activeSubTab === 'assignments' && (
        <TeacherAssignmentsTab
          assignments={assignments}
          distinctClassrooms={distinctClassrooms}
          students={students}
          onGoToMarks={(subject, classId) => {
            handleTabClick('results');
          }}
        />
      )}

      {activeSubTab === 'timetable' && (
        <TeacherTimetableTab
          timetable={activeTeacher?.timetable}
          classrooms={distinctClassrooms}
        />
      )}

      {activeSubTab === 'notices' && (
        <TeacherNoticesTab
          currentTerm={currentTerm}
          academicYear={academicYear}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. TERMINAL REPORT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedReportStudent && (
        <TerminalReportModal
          isOpen={true}
          onClose={() => setSelectedReportStudent(null)}
          student={selectedReportStudent}
          term={currentTerm}
          academicYear={academicYear}
        />
      )}
    </div>
  );
};
