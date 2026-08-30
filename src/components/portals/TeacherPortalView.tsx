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
  ChevronDown
} from 'lucide-react';
import { NavTabId } from '../common/Sidebar';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { Modal } from '../common/Modal';
import { formatDate, formatGhanaPhone } from '../../utils/formatting';
import { calculateTotalScore, getGESGrade, getGradeRemarks, calculateGhanaGrade } from '../../utils/calculations';

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
    subjects,
    results = [],
    examResults = [], 
    attendance = [], 
    markAttendanceBulk, 
    recordExamResult,
    updateTeacher,
    school,
    settings
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'assignments' | 'attendance' | 'results' | 'reports' | 'students' | 'timetable' | 'notices'>(initialSubTab);
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);

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

  // Group assignments by Classroom
  const assignmentsByClassroom = useMemo(() => {
    const map: { [classroomId: string]: TeacherSubjectAssignment[] } = {};
    assignments.forEach(asgn => {
      if (!map[asgn.classroomId]) map[asgn.classroomId] = [];
      map[asgn.classroomId].push(asgn);
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
    const boundedVal = field === 'classScore' ? Math.max(0, Math.min(30, val)) : Math.max(0, Math.min(70, val));
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
      const total = calculateTotalScore(entry.classScore, entry.examScore);
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
      const total = calculateTotalScore(entry.classScore, entry.examScore);
      const gradeInfo = calculateGhanaGrade(total);

      await recordExamResult({
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        classroomId: marksClassroomId,
        classroomName: selectedClass?.name || 'Classroom',
        subject: marksSubject,
        subjectName: marksSubject,
        academicYear: school?.currentAcademicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        term: marksTerm,
        examType: marksAssessmentType === 'sba_only' ? 'Continuous Assessment (SBA 30%)' : marksAssessmentType === 'exam_only' ? 'Terminal Examination (70%)' : 'Continuous Assessment (30%) & Terminal Exam (70%)',
        classScore: entry.classScore,
        examScore: entry.examScore,
        totalScore: total,
        grade: gradeInfo.grade,
        gradeRemark: gradeInfo.remark,
        position: positionsMap[st.id] || 1,
        totalStudents: marksStudents.length,
        teacherRemarks: entry.remarks || (total >= 80 ? 'Exemplary academic effort and understanding.' : total >= 60 ? 'Good work, encourage consistent revision.' : 'Needs focused study and remedial support.'),
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
    <div className="space-y-5 animate-in fade-in duration-200 pb-16">
      
      {/* Subject Teacher Portal Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/90 border border-teal-500/50 text-teal-300 text-xs font-bold tracking-wide">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Subject Teacher Portal</span>
              </span>

              {activeTeacher?.assignedClassroomName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Form Master: {activeTeacher.assignedClassroomName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {activeTeacher ? `${activeTeacher.firstName} ${activeTeacher.lastName}` : currentUser?.fullName || 'Faculty Member'}
              </h1>
              
              {/* Teacher profile switcher for preview / testing */}
              {teachers.length > 1 && (
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  aria-label="Switch Active Instructor Profile"
                  className="bg-slate-800 text-teal-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.staffId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
              <span>Staff ID: <b className="font-mono text-teal-300">{activeTeacher?.staffId || 'STAFF-001'}</b></span>
              <span>•</span>
              <span>Teaching: <b className="text-white">{distinctSubjects.length} Subjects</b> across <b className="text-white">{distinctClassrooms.length} Classes</b></span>
              <span>•</span>
              <span>Term: <b className="text-teal-300">{school?.currentAcademicYear || '2026/2027'} ({school?.currentTerm || 'Term 3'})</b></span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('assignments')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>My Assignments</span>
            </button>
            <button
              onClick={() => setActiveSubTab('attendance')}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Take Roll Call</span>
            </button>
            <button
              onClick={() => setActiveSubTab('results')}
              className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
              <span>Enter Marks</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-slate-800 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: Layers },
            { id: 'assignments', label: 'My Assignments', icon: BookOpen, count: assignments.length },
            { id: 'attendance', label: 'Attendance Roll Call', icon: CalendarCheck2, badge: pendingAttendanceCount > 0 ? `${pendingAttendanceCount} pending` : undefined },
            { id: 'results', label: 'SBA & Marks (30/70)', icon: FileSpreadsheet, badge: pendingAssessmentsCount > 0 ? `${pendingAssessmentsCount} pending` : undefined },
            { id: 'students', label: 'My Students', icon: Users, count: myStudents.length },
            { id: 'reports', label: 'Terminal Reports', icon: FileText },
            { id: 'timetable', label: 'My Timetable', icon: Clock },
            { id: 'notices', label: 'Staff Notices', icon: MessageSquare },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-teal-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-400 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. OVERVIEW DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">My Subjects</span>
              <div className="text-2xl font-black text-teal-800 mt-1">{distinctSubjects.length}</div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5" title={distinctSubjects.join(', ')}>
                {distinctSubjects.length > 0 ? distinctSubjects.join(', ') : 'None assigned'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">My Classrooms</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{distinctClassrooms.length}</div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {distinctClassrooms.map(c => c.name).join(', ') || 'No classes'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pupils I Teach</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{myStudents.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all streams</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pending Attendance</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingAttendanceCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Today&apos;s roll calls</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pending Marks</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{pendingAssessmentsCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">SBA 30% / Exam 70%</p>
            </div>
          </div>

          {/* Teaching Load Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>My Active Teaching Load & Allocations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct shortcuts to take attendance or enter marks for each assigned subject and class
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('assignments')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Teaching Assignments Allocated</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  An administrator has not yet assigned subjects or classrooms to your teacher profile. Please contact the Headmaster or Admin to allocate your classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {assignments.map((asgn, idx) => {
                  const targetClass = classrooms.find(c => c.id === asgn.classroomId);
                  const classPupils = students.filter(s => s.currentClassroomId === asgn.classroomId);
                  const today = new Date().toISOString().split('T')[0];
                  const hasAttToday = attendance.some(
                    a => a.classroomId === asgn.classroomId && a.subjectName === asgn.subjectName && a.date === today
                  );

                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {asgn.subjectName}
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {classPupils.length} pupils
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-2">{asgn.classroomName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Level: {targetClass?.level || 'Basic'} • Room: {targetClass?.roomNumber || 'Assigned'}
                        </p>

                        <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                          <span className={`inline-flex items-center gap-1 font-medium ${hasAttToday ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {hasAttToday ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {hasAttToday ? 'Roll call marked today' : 'Roll call pending today'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                        <button
                          onClick={() => navigateToAttendance(asgn.subjectName, asgn.classroomId)}
                          className="py-1.5 px-2 bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CalendarCheck2 className="w-3 h-3" />
                          <span>Attendance</span>
                        </button>
                        <button
                          onClick={() => navigateToMarks(asgn.subjectName, asgn.classroomId)}
                          className="py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Enter Marks</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Schedule & Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Today's Teaching Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span>Weekly Timetable Summary</span>
                </h3>
                <button
                  onClick={() => setActiveSubTab('timetable')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  Full Timetable →
                </button>
              </div>

              {teacherTimetable.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                  <p>No timetable periods registered yet.</p>
                  <button
                    onClick={() => setActiveSubTab('timetable')}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Configure teaching periods in My Timetable
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {teacherTimetable.slice(0, 5).map((slot, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{slot.subjectName}</span>
                          <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-medium border border-teal-200">{slot.classroomName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{slot.day} • {slot.period} ({slot.startTime} - {slot.endTime})</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{slot.room || 'Classroom'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Performance & Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>Subject Teacher Quick Guidance</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                  <span className="font-bold text-teal-900 block">GES 30/70 Standard Assessment</span>
                  <p className="text-teal-800 text-[11px]">
                    Ghana Education Service standard divides marks into 30% Continuous Assessment (SBA) and 70% Terminal Examination.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 block">Subject Attendance Tracking</span>
                  <p className="text-slate-600 text-[11px]">
                    Roll calls are recorded per subject and classroom to track individual lesson participation.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. MY ASSIGNMENTS TAB */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">My Teaching Assignments</h2>
              <p className="text-xs text-slate-500">Overview of all subjects and classrooms allocated to your teaching schedule</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Total Load: <b>{assignments.length} allocations</b>
              </span>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No subjects or classrooms have been assigned to your profile yet. School administrators can configure your allocations in the Faculty Management portal.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by Subject */}
              {(Object.entries(assignmentsBySubject) as [string, TeacherSubjectAssignment[]][]).map(([subjName, asgnList]) => {
                const totalStudents = asgnList.reduce((acc, curr) => {
                  const count = students.filter(s => s.currentClassroomId === curr.classroomId).length;
                  return acc + count;
                }, 0);

                return (
                  <div key={subjName} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{subjName}</h3>
                          <p className="text-xs text-slate-500">
                            Taught across <b className="text-slate-800">{asgnList.length} Classrooms</b> ({totalStudents} total pupils)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAttSubject(subjName);
                            setActiveSubTab('attendance');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Roll Call
                        </button>
                        <button
                          onClick={() => {
                            setMarksSubject(subjName);
                            setActiveSubTab('results');
                          }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                          Enter Marks
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {asgnList.map((asgn, idx) => {
                        const targetClass = classrooms.find(c => c.id === asgn.classroomId);
                        const classPupils = students.filter(s => s.currentClassroomId === asgn.classroomId);
                        const today = new Date().toISOString().split('T')[0];
                        const hasAttToday = attendance.some(
                          a => a.classroomId === asgn.classroomId && a.subjectName === asgn.subjectName && a.date === today
                        );

                        return (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{asgn.classroomName}</h4>
                                <span className="text-[10.5px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {classPupils.length} pupils
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Form Master: {targetClass?.classTeacherName || 'None assigned'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                              <button
                                onClick={() => navigateToAttendance(asgn.subjectName, asgn.classroomId)}
                                className="flex-1 py-1 px-2 bg-white hover:bg-teal-50 text-teal-800 text-[11px] font-bold rounded border border-teal-200 transition-colors text-center cursor-pointer"
                              >
                                Take Roll Call
                              </button>
                              <button
                                onClick={() => navigateToMarks(asgn.subjectName, asgn.classroomId)}
                                className="flex-1 py-1 px-2 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold rounded transition-colors text-center shadow-xs cursor-pointer"
                              >
                                Enter Marks
                              </button>
                              <button
                                onClick={() => navigateToStudents(asgn.classroomId)}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
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

      {/* ----------------------------------------------------------------- */}
      {/* 3. ATTENDANCE ROLL CALL (Subject & Classroom Specific) */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Subject Attendance Roll Call</h2>
              <p className="text-xs text-slate-500">Record lesson presence, tardiness, and absences for your assigned classes</p>
            </div>

            {attendanceSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setAttDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
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
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">{attStudents.length} Students</span> in roster
                </div>
              )}
            </div>
          </div>

          {/* Students Roll Call Table */}
          {attStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students enrolled in the selected classroom. Select another class or add students.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
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
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : status === 'late'
                                          ? 'bg-amber-500 text-white shadow-xs'
                                          : status === 'absent'
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                              placeholder="e.g. Arrived 15m late, Reported sick"
                              value={currentRemarks}
                              onChange={e => handleAttRemarksChange(st.id, e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Saving records for <b>{attSubject}</b> on <b>{formatDate(attDate)}</b>
                </span>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAttendance ? 'Saving Records...' : 'Save Attendance Roll'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. SBA & MARKS ENTRY (Subject -> Classroom -> Assessment Type) */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">SBA & Terminal Examination Marks</h2>
              <p className="text-xs text-slate-500">
                GES Standard 30% Continuous Assessment (Class Tests, Projects) + 70% Terminal Examination
              </p>
            </div>

            {marksSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{marksSuccess}</span>
              </div>
            )}

            {/* Structured Workflow Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Subject *</label>
                <select
                  value={marksSubject}
                  onChange={e => setMarksSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="30_70">Full Assessment (SBA 30% + Exam 70%)</option>
                  <option value="sba_only">SBA Continuous Assessment (30% Max)</option>
                  <option value="exam_only">Terminal Examination (70% Max)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4. Academic Term *</label>
                <select
                  value={marksTerm}
                  onChange={e => setMarksTerm(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Marks Entry Table */}
          {marksStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students found in the selected classroom. Select another classroom from the options above.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Pupil Name</th>
                      <th className="px-4 py-3">Adm No.</th>
                      <th className="px-4 py-3 text-center">Class SBA (30)</th>
                      <th className="px-4 py-3 text-center">Exam (70)</th>
                      <th className="px-4 py-3 text-center">Total (100)</th>
                      <th className="px-4 py-3 text-center">Grade</th>
                      <th className="px-4 py-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksStudents.map((st, idx) => {
                      const entry = marksState[st.id] || { classScore: 0, examScore: 0, remarks: '' };
                      const total = calculateTotalScore(entry.classScore, entry.examScore);
                      const gradeInfo = calculateGhanaGrade(total);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">{st.admissionNumber}</td>
                          
                          {/* SBA Class Score (max 30) */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              step="0.5"
                              value={entry.classScore || ''}
                              onChange={e => handleScoreChange(st.id, 'classScore', parseFloat(e.target.value) || 0)}
                              disabled={marksAssessmentType === 'exam_only'}
                              placeholder="0-30"
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            />
                          </td>

                          {/* Terminal Exam Score (max 70) */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              step="0.5"
                              value={entry.examScore || ''}
                              onChange={e => handleScoreChange(st.id, 'examScore', parseFloat(e.target.value) || 0)}
                              disabled={marksAssessmentType === 'sba_only'}
                              placeholder="0-70"
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            />
                          </td>

                          {/* Total Score */}
                          <td className="px-4 py-3 text-center font-black text-slate-900 font-mono">
                            {total}
                          </td>

                          {/* Grade Badge */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                              gradeInfo.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              gradeInfo.grade === 'B+' || gradeInfo.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              gradeInfo.grade === 'C' ? 'bg-teal-100 text-teal-800' :
                              gradeInfo.grade === 'D' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
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
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Ready to commit scores for <b>{marksSubject}</b> in <b>{marksAvailableClassrooms.find(c => c.id === marksClassroomId)?.name || 'Class'}</b>
                </span>

                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={isSavingMarks}
                  className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMarks ? 'Saving Marks...' : 'Save All Marks (30/70)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. MY STUDENTS ROSTER & GUARDIANS */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Pupils Taught Directory</h2>
                <p className="text-xs text-slate-500">Students enrolled in your assigned subjects and classrooms with guardian contact information</p>
              </div>

              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
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
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <select
                  value={rosterClassFilter}
                  onChange={e => setRosterClassFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="all">All My Assigned Classrooms ({distinctClassrooms.length})</option>
                  {distinctClassrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Grid / Table */}
          {filteredRosterStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              No students found matching your filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRosterStudents.map(st => {
                const targetClass = classrooms.find(c => c.id === st.currentClassroomId);
                
                return (
                  <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-teal-300 transition-all">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{st.firstName} {st.lastName}</h4>
                          <span className="text-[11px] font-mono text-slate-500">{st.admissionNumber}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          {targetClass?.name || 'Class'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Gender:</span>
                          <span className="font-semibold text-slate-800">{st.gender}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Guardian:</span>
                          <span className="font-medium text-slate-800">{st.guardianName || 'Parent / Guardian'}</span>
                        </div>
                        {st.guardianPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Contact:</span>
                            <a 
                              href={`tel:${st.guardianPhone}`}
                              className="text-teal-700 hover:text-teal-800 font-mono font-semibold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{formatGhanaPhone(st.guardianPhone)}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => setSelectedReportStudent(st)}
                        className="w-full py-1.5 px-3 bg-slate-50 hover:bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-slate-200 hover:border-teal-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Terminal Progress Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. TERMINAL REPORTS PREVIEW */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">GES Terminal Report Cards</h2>
              <p className="text-xs text-slate-500">
                Official terminal progress reports aggregating continuous assessment (30%) and terminal exam (70%) across all subjects
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStudents.map(st => {
              const targetClass = classrooms.find(c => c.id === st.currentClassroomId);
              return (
                <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 hover:border-teal-300 transition-all">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{st.firstName} {st.lastName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{st.admissionNumber} • {targetClass?.name}</p>
                  </div>

                  <button
                    onClick={() => setSelectedReportStudent(st)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
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

      {/* ----------------------------------------------------------------- */}
      {/* 7. MY TIMETABLE */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSel ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600'}`}>
                    {daySlots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slots List for Selected Day */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {selectedDay}&apos;s Teaching Schedule
            </h3>

            {teacherTimetable.filter(s => s.day === selectedDay).length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
                <p>No teaching periods scheduled for {selectedDay}.</p>
                <button
                  onClick={() => {
                    setNewSlotDay(selectedDay);
                    setNewSlotSubj(distinctSubjects[0] || '');
                    setNewSlotClassId(distinctClassrooms[0]?.id || '');
                    setIsAddSlotOpen(true);
                  }}
                  className="text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  + Add Period for {selectedDay}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {teacherTimetable
                  .filter(s => s.day === selectedDay)
                  .map(slot => (
                    <div key={slot.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{slot.subjectName}</h4>
                            <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                              {slot.classroomName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {slot.period} • {slot.startTime} - {slot.endTime} • Room: {slot.room || 'Assigned Room'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveTimetableSlot(slot.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* ----------------------------------------------------------------- */}
      {/* 8. STAFF NOTICES */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Faculty & Staff Circulars</h2>
              <p className="text-xs text-slate-500">Official administrative notices, staff meeting announcements, and academic updates</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Submission of Term 3 SBA Continuous Assessment Marks',
                date: 'September 2026',
                sender: 'Office of Academic Affairs & GES Coordinator',
                content: 'All subject teachers are reminded to finalize and enter the 30% Continuous Assessment (SBA) marks for all assigned classrooms ahead of the terminal examination moderation.',
                priority: 'High',
              },
              {
                title: 'Subject Department Moderation Meetings',
                date: 'September 2026',
                sender: 'Headmaster / Academic Board',
                content: 'Subject teachers will convene with department leads on Friday at 2:00 PM for standardizing terminal assessment papers and continuous assessment portfolios.',
                priority: 'Normal',
              },
              {
                title: 'Standard Terminal Report Generation Schedule',
                date: 'September 2026',
                sender: 'School Administration',
                content: 'GES terminal report cards will be printed automatically once subject scores are compiled. Form masters and subject teachers may preview student results in the portal.',
                priority: 'Normal',
              }
            ].map((notice, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{notice.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      notice.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {notice.priority}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">{notice.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                <div className="text-[11px] text-teal-700 font-semibold pt-1">
                  Issued by: {notice.sender}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD TIMETABLE PERIOD MODAL */}
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room / Location</label>
              <input
                type="text"
                value={newSlotRoom}
                onChange={e => setNewSlotRoom(e.target.value)}
                placeholder="e.g. Room 101, Science Lab"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              Save Period
            </button>
          </div>
        </div>
      </Modal>

      {/* TERMINAL REPORT MODAL */}
      <TerminalReportModal
        isOpen={!!selectedReportStudent}
        onClose={() => setSelectedReportStudent(null)}
        student={selectedReportStudent}
      />
    </div>
  );
};
