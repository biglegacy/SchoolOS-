import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { AttendanceStatus, Student, Teacher, TeacherSubjectAssignment, TimetableSlot } from '../../types';
import { 
  GraduationCap, 
  CalendarCheck2, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Award,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Save,
  Check,
  X,
  Phone,
  MessageSquare,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Eye,
  Filter,
  UserCheck,
  Building,
  ShieldCheck,
  HelpCircle,
  School as SchoolIcon,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { NavTabId } from '../common/Sidebar';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { Modal } from '../common/Modal';
import { formatDate, formatGhanaPhone } from '../../utils/formatting';
import { calculateTotalScore, calculateGhanaGrade } from '../../utils/calculations';

interface TeacherPortalViewProps {
  onNavigate?: (tab: NavTabId) => void;
  initialSubTab?: 'overview' | 'assignments' | 'attendance' | 'results' | 'reports' | 'students' | 'timetable' | 'notices';
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
    attendance = [], 
    markAttendanceBulk, 
    recordExamResult,
    updateTeacher,
    school
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'assignments' | 'attendance' | 'results' | 'reports' | 'students' | 'timetable' | 'notices'>(initialSubTab);
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);

  // Sync active sub-tab if initialSubTab prop changes (e.g. from Sidebar clicks)
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

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
    // Fallback if legacy single classroom or subjectsTaught
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
    return classrooms.filter(c => distinctClassroomIds.includes(c.id));
  }, [classrooms, distinctClassroomIds]);

  // Total unique students taught by this teacher
  const myStudents = useMemo(() => {
    return students.filter(s => distinctClassroomIds.includes(s.currentClassroomId));
  }, [students, distinctClassroomIds]);

  // Group assignments by Subject for hierarchical views
  const assignmentsBySubject = useMemo(() => {
    const map: { [subject: string]: TeacherSubjectAssignment[] } = {};
    assignments.forEach(asgn => {
      if (!map[asgn.subjectName]) map[asgn.subjectName] = [];
      map[asgn.subjectName].push(asgn);
    });
    return map;
  }, [assignments]);

  // ----------------------------------------------------
  // ATTENDANCE STATE & WORKFLOW (Subject & Class Specific)
  // ----------------------------------------------------
  const [attSubject, setAttSubject] = useState<string>('');
  const [attClassroomId, setAttClassroomId] = useState<string>('');
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: { status: AttendanceStatus; remarks?: string } }>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  // Sync default selection for Attendance
  useEffect(() => {
    if (distinctSubjects.length > 0 && (!attSubject || !distinctSubjects.includes(attSubject))) {
      setAttSubject(distinctSubjects[0]);
    }
  }, [distinctSubjects, attSubject]);

  const attAvailableClassrooms = useMemo(() => {
    if (!attSubject) return distinctClassrooms;
    const matchingAssignments = assignments.filter(a => a.subjectName.toLowerCase() === attSubject.toLowerCase());
    const classIds = matchingAssignments.map(a => a.classroomId);
    return distinctClassrooms.filter(c => classIds.includes(c.id));
  }, [attSubject, assignments, distinctClassrooms]);

  useEffect(() => {
    if (attAvailableClassrooms.length > 0 && (!attClassroomId || !attAvailableClassrooms.some(c => c.id === attClassroomId))) {
      setAttClassroomId(attAvailableClassrooms[0].id);
    }
  }, [attAvailableClassrooms, attClassroomId]);

  const attStudents = useMemo(() => {
    if (!attClassroomId) return [];
    return students.filter(s => s.currentClassroomId === attClassroomId);
  }, [students, attClassroomId]);

  // Load existing attendance for this class & subject & date
  useEffect(() => {
    const map: { [studentId: string]: { status: AttendanceStatus; remarks?: string } } = {};
    attStudents.forEach(st => {
      const existing = attendance.find(
        a => a.studentId === st.id && 
             a.date === attDate && 
             (a.subjectName === attSubject || !a.subjectName)
      );
      if (existing) {
        map[st.id] = { status: existing.status, remarks: existing.remarks };
      } else {
        map[st.id] = { status: 'present' };
      }
    });
    setAttendanceMap(map);
  }, [attDate, attClassroomId, attSubject, attStudents, attendance]);

  const handleAttStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleAttRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleMarkAllAttendance = (status: AttendanceStatus) => {
    const updated: typeof attendanceMap = {};
    attStudents.forEach(st => {
      updated[st.id] = { ...attendanceMap[st.id], status };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!attClassroomId || attStudents.length === 0) return;
    setIsSavingAttendance(true);

    const records = attStudents.map(st => ({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      classroomId: attClassroomId,
      subjectName: attSubject,
      date: attDate,
      academicYear: school?.currentAcademicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      term: school?.currentTerm || 'Term 3',
      status: attendanceMap[st.id]?.status || 'present',
      remarks: attendanceMap[st.id]?.remarks,
      recordedBy: activeTeacher ? `${activeTeacher.firstName} ${activeTeacher.lastName}` : currentUser?.fullName,
    }));

    await markAttendanceBulk(records);
    setIsSavingAttendance(false);
    setAttendanceSuccess(`Saved roll call for ${attSubject} (${attStudents.length} pupils)!`);
    setTimeout(() => setAttendanceSuccess(null), 3500);
  };

  // ----------------------------------------------------
  // SBA & MARKS ENTRY STATE & WORKFLOW
  // ----------------------------------------------------
  const [marksSubject, setMarksSubject] = useState<string>('');
  const [marksClassroomId, setMarksClassroomId] = useState<string>('');
  const [marksAssessmentType, setMarksAssessmentType] = useState<'30_70' | 'sba_only' | 'exam_only'>('30_70');
  const [marksTerm, setMarksTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(school?.currentTerm || 'Term 3');
  const [marksState, setMarksState] = useState<{ [studentId: string]: { classScore: number; examScore: number; remarks?: string } }>({});
  const [isSavingMarks, setIsSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState<string | null>(null);

  const sbaMax = school?.sbaMaxScore ?? 30;
  const examMax = school?.examMaxScore ?? 70;
  const totalMax = sbaMax + examMax;

  // Sync default selection for Marks
  useEffect(() => {
    if (distinctSubjects.length > 0 && (!marksSubject || !distinctSubjects.includes(marksSubject))) {
      setMarksSubject(distinctSubjects[0]);
    }
  }, [distinctSubjects, marksSubject]);

  const marksAvailableClassrooms = useMemo(() => {
    if (!marksSubject) return distinctClassrooms;
    const matchingAssignments = assignments.filter(a => a.subjectName.toLowerCase() === marksSubject.toLowerCase());
    const classIds = matchingAssignments.map(a => a.classroomId);
    return distinctClassrooms.filter(c => classIds.includes(c.id));
  }, [marksSubject, assignments, distinctClassrooms]);

  useEffect(() => {
    if (marksAvailableClassrooms.length > 0 && (!marksClassroomId || !marksAvailableClassrooms.some(c => c.id === marksClassroomId))) {
      setMarksClassroomId(marksAvailableClassrooms[0].id);
    }
  }, [marksAvailableClassrooms, marksClassroomId]);

  const marksStudents = useMemo(() => {
    if (!marksClassroomId) return [];
    return students.filter(s => s.currentClassroomId === marksClassroomId);
  }, [students, marksClassroomId]);

  const allResults = useMemo(() => {
    return examResults.length > 0 ? examResults : results;
  }, [examResults, results]);

  // Load existing marks
  useEffect(() => {
    const initial: { [studentId: string]: { classScore: number; examScore: number; remarks?: string } } = {};
    marksStudents.forEach(st => {
      const existing = allResults.find(
        r => r.studentId === st.id && 
             (r.subjectName?.toLowerCase() === marksSubject.toLowerCase() || (r as any).subject?.toLowerCase() === marksSubject.toLowerCase()) &&
             r.term === marksTerm
      );
      if (existing) {
        initial[st.id] = {
          classScore: existing.classScore || 0,
          examScore: existing.examScore || 0,
          remarks: existing.teacherRemarks || '',
        };
      } else {
        initial[st.id] = { classScore: 0, examScore: 0, remarks: '' };
      }
    });
    setMarksState(initial);
  }, [marksSubject, marksClassroomId, marksTerm, marksStudents, allResults]);

  const handleScoreChange = (studentId: string, field: 'classScore' | 'examScore', val: number) => {
    const maxBound = field === 'classScore' ? sbaMax : examMax;
    const boundedVal = Math.max(0, Math.min(maxBound, val));
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: isNaN(boundedVal) ? 0 : boundedVal,
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      }
    }));
  };

  const handleSaveMarks = async () => {
    if (!marksClassroomId || !marksSubject || marksStudents.length === 0) return;
    setIsSavingMarks(true);

    const selectedClass = classrooms.find(c => c.id === marksClassroomId);

    // Compute ranks and positions based on total score
    const studentTotals = marksStudents.map(st => {
      const entry = marksState[st.id] || { classScore: 0, examScore: 0 };
      const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
      return { studentId: st.id, total };
    });

    studentTotals.sort((a, b) => b.total - a.total);
    const positionsMap: { [studentId: string]: number } = {};
    studentTotals.forEach((item, idx) => {
      if (idx > 0 && item.total === studentTotals[idx - 1].total) {
        positionsMap[item.studentId] = positionsMap[studentTotals[idx - 1].studentId];
      } else {
        positionsMap[item.studentId] = idx + 1;
      }
    });

    for (const st of marksStudents) {
      const entry = marksState[st.id] || { classScore: 0, examScore: 0 };
      const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
      const gradeInfo = calculateGhanaGrade(total, totalMax);

      await recordExamResult({
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        classroomId: marksClassroomId,
        classroomName: selectedClass?.name || 'Classroom',
        subject: marksSubject,
        subjectName: marksSubject,
        academicYear: school?.currentAcademicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        term: marksTerm,
        examType: marksAssessmentType === 'sba_only' 
          ? `Continuous Assessment (SBA ${sbaMax})` 
          : marksAssessmentType === 'exam_only' 
          ? `Terminal Examination (${examMax})` 
          : `Continuous Assessment (${sbaMax}) & Terminal Exam (${examMax})`,
        classScore: entry.classScore,
        examScore: entry.examScore,
        totalScore: total,
        grade: gradeInfo.grade,
        gradeRemark: gradeInfo.remark,
        position: positionsMap[st.id] || 1,
        totalStudents: marksStudents.length,
        teacherRemarks: entry.remarks || (total >= (0.8 * totalMax) ? 'Exemplary academic effort and understanding.' : total >= (0.6 * totalMax) ? 'Good work, encourage consistent revision.' : 'Needs focused study and remedial support.'),
      });
    }

    setIsSavingMarks(false);
    setMarksSuccess(`Successfully saved marks for ${marksSubject} in ${selectedClass?.name || 'Class'}!`);
    setTimeout(() => setMarksSuccess(null), 3500);
  };

  // ----------------------------------------------------
  // ROSTER & STUDENT DIRECTORY STATE
  // ----------------------------------------------------
  const [rosterClassFilter, setRosterClassFilter] = useState<string>('all');
  const [rosterSearch, setRosterSearch] = useState('');

  const filteredRosterStudents = useMemo(() => {
    return myStudents.filter(st => {
      if (rosterClassFilter !== 'all' && st.currentClassroomId !== rosterClassFilter) return false;
      const term = rosterSearch.toLowerCase();
      const fullName = `${st.firstName} ${st.lastName} ${st.otherNames || ''}`.toLowerCase();
      return fullName.includes(term) || st.admissionNumber.toLowerCase().includes(term);
    });
  }, [myStudents, rosterClassFilter, rosterSearch]);

  // ----------------------------------------------------
  // TIMETABLE STATE & ACTIONS
  // ----------------------------------------------------
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlotSubj, setNewSlotSubj] = useState('');
  const [newSlotClassId, setNewSlotClassId] = useState('');
  const [newSlotDay, setNewSlotDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [newSlotPeriod, setNewSlotPeriod] = useState('Period 1');
  const [newSlotTime, setNewSlotTime] = useState('08:00 - 08:45 AM');
  const [newSlotRoom, setNewSlotRoom] = useState('Room 101');

  const teacherTimetable: TimetableSlot[] = useMemo(() => {
    return activeTeacher?.timetable || [];
  }, [activeTeacher]);

  const handleAddTimetableSlot = async () => {
    if (!activeTeacher || !newSlotSubj || !newSlotClassId) return;
    const targetClass = classrooms.find(c => c.id === newSlotClassId);
    if (!targetClass) return;

    const newSlot: TimetableSlot = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectName: newSlotSubj,
      classroomId: targetClass.id,
      classroomName: targetClass.name,
      day: newSlotDay,
      period: newSlotPeriod,
      startTime: newSlotTime.split('-')[0]?.trim() || '08:00 AM',
      endTime: newSlotTime.split('-')[1]?.trim() || '08:45 AM',
      room: newSlotRoom,
    };

    const updated = [...teacherTimetable, newSlot];
    await updateTeacher(activeTeacher.id, { timetable: updated });
    setIsAddSlotOpen(false);
  };

  const handleRemoveTimetableSlot = async (slotId: string) => {
    if (!activeTeacher) return;
    const updated = teacherTimetable.filter(s => s.id !== slotId);
    await updateTeacher(activeTeacher.id, { timetable: updated });
  };

  // Quick navigation shortcut from assignment cards
  const navigateToAttendance = (subj: string, classId: string) => {
    setAttSubject(subj);
    setAttClassroomId(classId);
    setActiveSubTab('attendance');
  };

  const navigateToMarks = (subj: string, classId: string) => {
    setMarksSubject(subj);
    setMarksClassroomId(classId);
    setActiveSubTab('results');
  };

  const navigateToStudents = (classId: string) => {
    setRosterClassFilter(classId);
    setActiveSubTab('students');
  };

  // ----------------------------------------------------
  // PENDING ATTENDANCE & ASSESSMENTS SUMMARY
  // ----------------------------------------------------
  const pendingAttendanceCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let pending = 0;
    assignments.forEach(asgn => {
      const hasRecord = attendance.some(
        a => a.classroomId === asgn.classroomId && a.subjectName === asgn.subjectName && a.date === today
      );
      if (!hasRecord) pending++;
    });
    return pending;
  }, [assignments, attendance]);

  const pendingAssessmentsCount = useMemo(() => {
    let pending = 0;
    assignments.forEach(asgn => {
      const classSts = students.filter(s => s.currentClassroomId === asgn.classroomId);
      if (classSts.length === 0) return;
      const hasMarks = classSts.some(st => 
        allResults.some(r => r.studentId === st.id && (r.subjectName === asgn.subjectName || (r as any).subject === asgn.subjectName))
      );
      if (!hasMarks) pending++;
    });
    return pending;
  }, [assignments, students, allResults]);

  return (
    <div id="teacher-portal-view" className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* ========================================================================= */}
      {/* TEACHER PORTAL HERO HEADER (WHITE WELCOME CARD) */}
      {/* ========================================================================= */}
      <div 
        id="teacher-portal-hero-card"
        className="bg-white text-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Teacher Profile & Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold tracking-wide shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                <span>Subject Teacher Portal</span>
              </span>

              {activeTeacher?.assignedClassroomName && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Form Master: {activeTeacher.assignedClassroomName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {activeTeacher ? `${activeTeacher.firstName} ${activeTeacher.lastName}` : currentUser?.fullName || 'Faculty Member'}
              </h1>
              
              {/* Teacher profile switcher */}
              {teachers.length > 1 && (
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  aria-label="Switch Active Instructor Profile"
                  className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="bg-white text-slate-900">
                      {t.firstName} {t.lastName} ({t.staffId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-2.5 flex-wrap font-medium">
              <span className="bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                Staff ID: <b className="font-mono text-slate-900">{activeTeacher?.staffId || 'STAFF-001'}</b>
              </span>
              <span>•</span>
              <span className="bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                Teaching: <b className="text-slate-900">{distinctSubjects.length} Subjects</b> across <b className="text-slate-900">{distinctClassrooms.length} Classes</b>
              </span>
              <span>•</span>
              <span className="bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                Term: <b className="text-slate-900">{school?.currentAcademicYear || '2026/2027'} ({school?.currentTerm || 'Term 3'})</b>
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="hero-nav-assignments-btn"
              onClick={() => setActiveSubTab('assignments')}
              className={`px-3.5 py-2.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeSubTab === 'assignments'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeSubTab === 'assignments' ? 'text-white' : 'text-slate-500'}`} />
              <span>My Assignments</span>
            </button>
            <button
              id="hero-nav-attendance-btn"
              onClick={() => setActiveSubTab('attendance')}
              className={`px-3.5 py-2.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeSubTab === 'attendance'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <CalendarCheck2 className={`w-4 h-4 ${activeSubTab === 'attendance' ? 'text-white' : 'text-slate-500'}`} />
              <span>Take Roll Call</span>
            </button>
            <button
              id="hero-nav-results-btn"
              onClick={() => setActiveSubTab('results')}
              className={`px-3.5 py-2.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeSubTab === 'results'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${activeSubTab === 'results' ? 'text-white' : 'text-slate-500'}`} />
              <span>Enter Marks ({sbaMax}/{examMax})</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div id="teacher-portal-subnav-bar" className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'assignments', label: 'My Teaching Load', icon: BookOpen, count: assignments.length },
            { id: 'attendance', label: 'Daily Roll Call', icon: CalendarCheck2, badge: pendingAttendanceCount > 0 ? `${pendingAttendanceCount} Pending` : undefined },
            { id: 'results', label: `SBA & Marks (${sbaMax}/${examMax})`, icon: FileSpreadsheet, badge: pendingAssessmentsCount > 0 ? `${pendingAssessmentsCount} Pending` : undefined },
            { id: 'students', label: 'My Pupils Directory', icon: Users, count: myStudents.length },
            { id: 'reports', label: 'GES Terminal Reports', icon: FileText },
            { id: 'timetable', label: 'Weekly Timetable', icon: Clock },
            { id: 'notices', label: 'Staff Notices', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs border border-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW DASHBOARD SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* STATS METRIC CARDS (CLEAN WHITE CARDS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Subjects */}
            <div 
              onClick={() => setActiveSubTab('assignments')}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">My Subjects</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-sky-100">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900">{distinctSubjects.length}</div>
                <p className="text-[11px] text-slate-500 truncate mt-1" title={distinctSubjects.join(', ')}>
                  {distinctSubjects.length > 0 ? distinctSubjects.join(', ') : 'None assigned'}
                </p>
              </div>
            </div>

            {/* Card 2: Classrooms */}
            <div 
              onClick={() => setActiveSubTab('assignments')}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Classrooms</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900">{distinctClassrooms.length}</div>
                <p className="text-[11px] text-slate-500 truncate mt-1">
                  {distinctClassrooms.map(c => c.name).join(', ') || 'No classes'}
                </p>
              </div>
            </div>

            {/* Card 3: Pupils */}
            <div 
              onClick={() => setActiveSubTab('students')}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Pupils I Teach</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900">{myStudents.length}</div>
                <p className="text-[11px] text-slate-500 mt-1">Across all assigned streams</p>
              </div>
            </div>

            {/* Card 4: Pending Attendance */}
            <div 
              onClick={() => setActiveSubTab('attendance')}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-amber-700 tracking-wider">Roll Call Due</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-amber-700">{pendingAttendanceCount}</div>
                <p className="text-[11px] text-slate-500 mt-1">Today&apos;s pending classes</p>
              </div>
            </div>

            {/* Card 5: Pending Marks */}
            <div 
              onClick={() => setActiveSubTab('results')}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer group col-span-2 sm:col-span-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wider">Marks Ready</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-emerald-700">{assignments.length}</div>
                <p className="text-[11px] text-slate-500 mt-1">SBA ({sbaMax}) / Exam ({examMax})</p>
              </div>
            </div>

          </div>

          {/* ACTIVE TEACHING LOAD MATRIX (WHITE CARD) */}
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    My Active Teaching Load & Direct Actions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a subject and classroom to immediately take daily roll call or input {sbaMax}/{examMax} assessment scores
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('assignments')}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-xl border border-sky-200 transition-colors self-start sm:self-auto"
              >
                <span>View All Assignments</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-2 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Teaching Assignments Allocated</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  An administrator has not yet assigned subjects or classrooms to your teacher profile. Please contact the Headmaster or School Admin to allocate your classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((asgn, idx) => {
                  const targetClass = classrooms.find(c => c.id === asgn.classroomId);
                  const classPupils = students.filter(s => s.currentClassroomId === asgn.classroomId);
                  const today = new Date().toISOString().split('T')[0];
                  const hasAttToday = attendance.some(
                    a => a.classroomId === asgn.classroomId && a.subjectName === asgn.subjectName && a.date === today
                  );

                  return (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-sky-400 hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-lg border border-sky-200">
                            {asgn.subjectName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {classPupils.length} pupils
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 mt-2.5">{asgn.classroomName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Level: {targetClass?.level || 'Basic'} • Room: {targetClass?.roomNumber || 'Assigned Room'}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md ${
                            hasAttToday 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {hasAttToday ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {hasAttToday ? 'Roll call marked today' : 'Roll call pending today'}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Navigation Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => navigateToAttendance(asgn.subjectName, asgn.classroomId)}
                          className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5 text-sky-700" />
                          <span>Roll Call</span>
                        </button>
                        <button
                          onClick={() => navigateToMarks(asgn.subjectName, asgn.classroomId)}
                          className="py-2 px-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Enter Marks</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TWO-COLUMN WHITE CARDS: TIMETABLE & GES GUIDANCE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Today's Teaching Schedule (White Card) */}
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Teaching Timetable Highlights</span>
                </h3>
                <button
                  onClick={() => setActiveSubTab('timetable')}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200"
                >
                  <span>Full Timetable</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {teacherTimetable.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>No timetable teaching periods registered yet.</p>
                  <button
                    onClick={() => setActiveSubTab('timetable')}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Configure Teaching Periods</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {teacherTimetable.slice(0, 6).map((slot, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{slot.subjectName}</span>
                          <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-bold border border-sky-200">{slot.classroomName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">{slot.day} • {slot.period} ({slot.startTime} - {slot.endTime})</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{slot.room || 'Classroom'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GES Curriculum & Teacher Quick Guidance (White Card) */}
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <span>GES Assessment & Standard Policy</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-sky-900 block text-sm">Configured Assessment Model ({sbaMax}/{examMax})</span>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    The current school policy allocates <b>{sbaMax} marks</b> for Continuous Assessment (Class SBA, Projects & Tests) and <b>{examMax} marks</b> for Terminal Examination, totaling <b>{totalMax} marks</b>. Standard letter grades and terminal remarks adapt automatically.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 block text-sm">Lesson Attendance Roll Calls</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Roll calls are recorded per individual subject and classroom stream. Daily marks update the institutional attendance registers in real-time.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MY ASSIGNMENTS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">My Teaching Load & Allocations</h2>
              <p className="text-xs text-slate-500">Complete listing of all assigned subjects and classrooms for this academic year</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
                Allocations: <b>{assignments.length} Total</b>
              </span>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white text-slate-900 rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No subjects or classrooms have been assigned to your profile yet. School administrators can configure your allocations in the Faculty Management portal.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.entries(assignmentsBySubject) as [string, TeacherSubjectAssignment[]][]).map(([subjName, asgnList]) => {
                const totalStudents = asgnList.reduce((acc, curr) => {
                  const count = students.filter(s => s.currentClassroomId === curr.classroomId).length;
                  return acc + count;
                }, 0);

                return (
                  <div key={subjName} className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">{subjName}</h3>
                          <p className="text-xs text-slate-500">
                            Taught across <b className="text-slate-900">{asgnList.length} Classrooms</b> ({totalStudents} total enrolled pupils)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAttSubject(subjName);
                            setActiveSubTab('attendance');
                          }}
                          className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 transition-colors cursor-pointer"
                        >
                          Roll Call
                        </button>
                        <button
                          onClick={() => {
                            setMarksSubject(subjName);
                            setActiveSubTab('results');
                          }}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                        >
                          Enter Marks ({sbaMax}/{examMax})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {asgnList.map((asgn, idx) => {
                        const targetClass = classrooms.find(c => c.id === asgn.classroomId);
                        const classPupils = students.filter(s => s.currentClassroomId === asgn.classroomId);

                        return (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3 shadow-2xs">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{asgn.classroomName}</h4>
                                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                                  {classPupils.length} pupils
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Form Master: {targetClass?.classTeacherName || 'None assigned'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                              <button
                                onClick={() => navigateToAttendance(asgn.subjectName, asgn.classroomId)}
                                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded border border-slate-200 transition-colors text-center cursor-pointer"
                              >
                                Roll Call
                              </button>
                              <button
                                onClick={() => navigateToMarks(asgn.subjectName, asgn.classroomId)}
                                className="flex-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded transition-colors text-center shadow-2xs cursor-pointer"
                              >
                                Marks
                              </button>
                              <button
                                onClick={() => navigateToStudents(asgn.classroomId)}
                                className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 transition-colors cursor-pointer"
                                title="View Class Pupils"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ATTENDANCE ROLL CALL SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Subject Attendance Roll Call</h2>
              <p className="text-xs text-slate-500">Record lesson presence, tardiness, and absences for your assigned classes</p>
            </div>

            {attendanceSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{attendanceSuccess}</span>
              </div>
            )}

            {/* Selectors Bar: Subject -> Classroom -> Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Select Subject *</label>
                <select
                  value={attSubject}
                  onChange={e => setAttSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  {distinctSubjects.length === 0 ? (
                    <option value="">No subjects assigned</option>
                  ) : (
                    distinctSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">2. Select Classroom *</label>
                <select
                  value={attClassroomId}
                  onChange={e => setAttClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  {attAvailableClassrooms.length === 0 ? (
                    <option value="">No classrooms for this subject</option>
                  ) : (
                    attAvailableClassrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">3. Roll Call Date *</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={attDate}
                    onChange={e => setAttDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setAttDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleMarkAllAttendance('present')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllAttendance('absent')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Mark All Absent
                </button>
              </div>

              {attStudents.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-900">{attStudents.length} Students</span> in active class roster
                </div>
              )}
            </div>
          </div>

          {/* Students Roll Call Table (White Card Container) */}
          {attStudents.length === 0 ? (
            <div className="bg-white text-slate-900 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students enrolled in the selected classroom. Select another class or add students.
            </div>
          ) : (
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Pupil Name</th>
                      <th className="px-4 py-3">Adm No.</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attStudents.map((st, idx) => {
                      const currentStatus = attendanceMap[st.id]?.status || 'present';
                      const currentRemarks = attendanceMap[st.id]?.remarks || '';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">{st.admissionNumber}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(status => {
                                const isSel = currentStatus === status;
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleAttStatusChange(st.id, status)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                                      isSel
                                        ? status === 'present'
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : status === 'late'
                                          ? 'bg-amber-500 text-white shadow-2xs'
                                          : status === 'absent'
                                          ? 'bg-rose-600 text-white shadow-2xs'
                                          : 'bg-sky-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="e.g. Arrived late, Excused sick"
                              value={currentRemarks}
                              onChange={e => handleAttRemarksChange(st.id, e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-600">
                  Saving records for <b className="text-slate-900">{attSubject}</b> on <b className="text-slate-900">{formatDate(attDate)}</b>
                </span>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAttendance ? 'Saving Records...' : 'Save Attendance Roll'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SBA & MARKS ENTRY SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">SBA & Terminal Examination Marks</h2>
              <p className="text-xs text-slate-500">
                School Assessment Model: Continuous Assessment (Class SBA {sbaMax} Marks) + Terminal Examination ({examMax} Marks) = {totalMax} Total Marks
              </p>
            </div>

            {marksSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{marksSuccess}</span>
              </div>
            )}

            {/* Selectors Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Subject *</label>
                <select
                  value={marksSubject}
                  onChange={e => setMarksSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  {distinctSubjects.length === 0 ? (
                    <option value="">No subjects assigned</option>
                  ) : (
                    distinctSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">2. Classroom *</label>
                <select
                  value={marksClassroomId}
                  onChange={e => setMarksClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  {marksAvailableClassrooms.length === 0 ? (
                    <option value="">No classrooms for this subject</option>
                  ) : (
                    marksAvailableClassrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">3. Assessment Type *</label>
                <select
                  value={marksAssessmentType}
                  onChange={e => setMarksAssessmentType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  <option value="30_70">Full Assessment (SBA {sbaMax} + Exam {examMax} = {totalMax})</option>
                  <option value="sba_only">SBA Continuous Assessment ({sbaMax} Max)</option>
                  <option value="exam_only">Terminal Examination ({examMax} Max)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4. Academic Term *</label>
                <select
                  value={marksTerm}
                  onChange={e => setMarksTerm(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Marks Entry Table (White Card) */}
          {marksStudents.length === 0 ? (
            <div className="bg-white text-slate-900 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students found in the selected classroom. Select another classroom from the options above.
            </div>
          ) : (
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Pupil Name</th>
                      <th className="px-4 py-3">Adm No.</th>
                      <th className="px-4 py-3 text-center">Class SBA ({sbaMax})</th>
                      <th className="px-4 py-3 text-center">Exam ({examMax})</th>
                      <th className="px-4 py-3 text-center">Total ({totalMax})</th>
                      <th className="px-4 py-3 text-center">Grade</th>
                      <th className="px-4 py-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksStudents.map((st, idx) => {
                      const entry = marksState[st.id] || { classScore: 0, examScore: 0, remarks: '' };
                      const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
                      const gradeInfo = calculateGhanaGrade(total, totalMax);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">{st.admissionNumber}</td>
                          
                          {/* SBA Class Score */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={sbaMax}
                              step="0.5"
                              value={entry.classScore || ''}
                              onChange={e => handleScoreChange(st.id, 'classScore', parseFloat(e.target.value) || 0)}
                              disabled={marksAssessmentType === 'exam_only'}
                              placeholder={`0-${sbaMax}`}
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
                            />
                          </td>

                          {/* Terminal Exam Score */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={examMax}
                              step="0.5"
                              value={entry.examScore || ''}
                              onChange={e => handleScoreChange(st.id, 'examScore', parseFloat(e.target.value) || 0)}
                              disabled={marksAssessmentType === 'sba_only'}
                              placeholder={`0-${examMax}`}
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
                            />
                          </td>

                          {/* Total Score */}
                          <td className="px-4 py-3 text-center font-black text-sky-800 font-mono text-sm">
                            {total}
                          </td>

                          {/* Grade Badge */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black ${
                              gradeInfo.grade === 'A' ? 'bg-emerald-600 text-white' :
                              gradeInfo.grade === 'B+' || gradeInfo.grade === 'B' ? 'bg-blue-600 text-white' :
                              gradeInfo.grade === 'C' ? 'bg-sky-600 text-white' :
                              gradeInfo.grade === 'D' ? 'bg-amber-500 text-white' :
                              'bg-rose-600 text-white'
                            }`}>
                              {gradeInfo.grade}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder={gradeInfo.remark}
                              value={entry.remarks || ''}
                              onChange={e => handleRemarksChange(st.id, e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                  Ready to commit scores for <b className="text-slate-900">{marksSubject}</b> in <b className="text-slate-900">{marksAvailableClassrooms.find(c => c.id === marksClassroomId)?.name || 'Class'}</b>
                </span>

                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={isSavingMarks}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingMarks ? 'Saving Marks...' : `Save All Marks (${sbaMax}/${examMax})`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MY STUDENTS ROSTER SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Pupils Taught Directory</h2>
                <p className="text-xs text-slate-500">Students enrolled in your assigned subjects and classrooms with guardian contact information</p>
              </div>

              <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Total: {filteredRosterStudents.length} Pupils
              </span>
            </div>

            {/* Filter & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <select
                  value={rosterClassFilter}
                  onChange={e => setRosterClassFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                >
                  <option value="all">All My Assigned Classrooms ({distinctClassrooms.length})</option>
                  {distinctClassrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Grid (White Cards) */}
          {filteredRosterStudents.length === 0 ? (
            <div className="bg-white text-slate-900 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students found matching your filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRosterStudents.map(st => {
                const targetClass = classrooms.find(c => c.id === st.currentClassroomId);
                
                return (
                  <div key={st.id} className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-3.5 hover:border-sky-400 transition-all">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{st.firstName} {st.lastName}</h4>
                          <span className="text-[11px] font-mono text-sky-700">{st.admissionNumber}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {targetClass?.name || 'Class'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Gender:</span>
                          <span className="font-semibold text-slate-900">{st.gender}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Guardian:</span>
                          <span className="font-medium text-slate-900">{st.guardianName || 'Parent / Guardian'}</span>
                        </div>
                        {st.guardianPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Contact:</span>
                            <a 
                              href={`tel:${st.guardianPhone}`}
                              className="text-sky-700 hover:text-sky-900 font-mono font-semibold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{formatGhanaPhone(st.guardianPhone)}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => setSelectedReportStudent(st)}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-700" />
                        <span>View Progress Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TERMINAL REPORTS PREVIEW SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">GES Terminal Report Cards</h2>
              <p className="text-xs text-slate-500">
                Official terminal progress reports aggregating continuous assessment ({sbaMax} SBA) and terminal examination ({examMax} Exam) across all subjects
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStudents.map(st => {
              const targetClass = classrooms.find(c => c.id === st.currentClassroomId);
              return (
                <div key={st.id} className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-sky-400 transition-all">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{st.firstName} {st.lastName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{st.admissionNumber} • {targetClass?.name}</p>
                  </div>

                  <button
                    onClick={() => setSelectedReportStudent(st)}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Report Card</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MY TIMETABLE SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">My Subject Timetable & Schedule</h2>
              <p className="text-xs text-slate-500">Weekly teaching schedule across all your assigned classrooms</p>
            </div>

            <button
              onClick={() => {
                setNewSlotSubj(distinctSubjects[0] || '');
                setNewSlotClassId(distinctClassrooms[0]?.id || '');
                setIsAddSlotOpen(true);
              }}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Teaching Period</span>
            </button>
          </div>

          {/* Day Selector for Mobile/Desktop */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => {
              const isSel = selectedDay === day;
              const daySlots = teacherTimetable.filter(s => s.day === day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isSel
                      ? 'bg-sky-600 text-white shadow-xs border border-sky-500'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isSel ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {daySlots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots List for Selected Day (White Card) */}
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {selectedDay}&apos;s Teaching Schedule
            </h3>

            {teacherTimetable.filter(s => s.day === selectedDay).length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-xs text-slate-500 space-y-3 bg-slate-50">
                <p>No teaching periods scheduled for {selectedDay}.</p>
                <button
                  onClick={() => {
                    setNewSlotDay(selectedDay);
                    setNewSlotSubj(distinctSubjects[0] || '');
                    setNewSlotClassId(distinctClassrooms[0]?.id || '');
                    setIsAddSlotOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Period for {selectedDay}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {teacherTimetable
                  .filter(s => s.day === selectedDay)
                  .map(slot => (
                    <div key={slot.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{slot.subjectName}</h4>
                            <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded">
                              {slot.classroomName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {slot.period} • {slot.startTime} - {slot.endTime} • Room: {slot.room || 'Assigned Room'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveTimetableSlot(slot.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                        title="Remove Period"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. STAFF NOTICES SUB-TAB (WHITE CARD THEME) */}
      {/* ========================================================================= */}
      {activeSubTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Faculty & Staff Circulars</h2>
              <p className="text-xs text-slate-500">Official administrative notices, staff meeting announcements, and academic updates</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: `Submission of Term 3 SBA Continuous Assessment Marks (${sbaMax}/${examMax})`,
                date: 'Academic Term Update',
                sender: 'Office of Academic Affairs & GES Coordinator',
                content: `All subject teachers are reminded to finalize and enter Continuous Assessment (${sbaMax} Marks SBA) for all assigned classrooms ahead of the terminal examination moderation.`,
                priority: 'High',
              },
              {
                title: 'Subject Department Moderation Meetings',
                date: 'Scheduled Friday 2:00 PM',
                sender: 'Headmaster / Academic Board',
                content: 'Subject teachers will convene with department leads on Friday at 2:00 PM for standardizing terminal assessment papers and continuous assessment portfolios.',
                priority: 'Normal',
              },
              {
                title: 'Standard Terminal Report Generation Schedule',
                date: 'Term End Protocol',
                sender: 'School Administration',
                content: 'GES terminal report cards will be printed automatically once subject scores are compiled. Form masters and subject teachers may preview student results in the portal.',
                priority: 'Normal',
              }
            ].map((notice, idx) => (
              <div key={idx} className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{notice.title}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      notice.priority === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {notice.priority}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 shrink-0">{notice.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                <div className="text-xs text-sky-800 font-semibold pt-2 border-t border-slate-100">
                  Issued by: {notice.sender}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD TIMETABLE PERIOD MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Add Timetable Period"
        subtitle="Schedule a subject teaching period for a specific classroom"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
            <select
              value={newSlotSubj}
              onChange={e => setNewSlotSubj(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {distinctSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Classroom *</label>
            <select
              value={newSlotClassId}
              onChange={e => setNewSlotClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {distinctClassrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day *</label>
              <select
                value={newSlotDay}
                onChange={e => setNewSlotDay(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Period Label *</label>
              <input
                type="text"
                value={newSlotPeriod}
                onChange={e => setNewSlotPeriod(e.target.value)}
                placeholder="e.g. Period 1, Lesson 2"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
              <input
                type="text"
                value={newSlotTime}
                onChange={e => setNewSlotTime(e.target.value)}
                placeholder="e.g. 08:00 - 08:45 AM"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room / Location</label>
              <input
                type="text"
                value={newSlotRoom}
                onChange={e => setNewSlotRoom(e.target.value)}
                placeholder="e.g. Room 101, Science Lab"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddSlotOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTimetableSlot}
              disabled={!newSlotSubj || !newSlotClassId}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Save Period
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* TERMINAL REPORT MODAL */}
      {/* ========================================================================= */}
      <TerminalReportModal
        isOpen={!!selectedReportStudent}
        onClose={() => setSelectedReportStudent(null)}
        student={selectedReportStudent}
      />
    </div>
  );
};
