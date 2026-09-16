import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Printer, 
  Award, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  Layers,
  TrendingUp,
  CheckCircle2,
  FileSpreadsheet,
  BadgeCheck,
  User,
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  School as SchoolIcon,
  Phone,
  Mail,
  Globe,
  MapPin,
  Compass,
  FileCheck
} from 'lucide-react';
import { formatDate, getOrdinalSuffix } from '../../utils/formatting';
import { calculateGhanaGrade, generateTeacherRemark, generateHeadTeacherRemark } from '../../utils/calculations';
import { evaluateStudentCompetencies, CoreCompetencyEvaluation } from '../../utils/competencies';

interface TerminalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialTerm?: 'Term 1' | 'Term 2' | 'Term 3';
}

export const TerminalReportModal: React.FC<TerminalReportModalProps> = ({
  isOpen,
  onClose,
  student,
  initialTerm,
}) => {
  const { school, results = [], examResults = [], classrooms = [], attendance = [], students = [], settings } = useSchool();
  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(
    initialTerm || school?.currentTerm || 'Term 3'
  );
  const printRef = useRef<HTMLDivElement>(null);

  if (!student || !school) return null;

  const currentClass = classrooms.find(c => c.id === student.currentClassroomId);
  const allResults = examResults.length > 0 ? examResults : results;
  
  // Real results for this student and term
  const termResults = allResults.filter(
    r => r.studentId === student.id && (r.term === selectedTerm || (!r.term && selectedTerm === 'Term 3'))
  );

  const hasResults = termResults.length > 0;

  // Dynamic SBA and Exam Max Scores from School Settings
  const sbaMax = school?.sbaMaxScore ?? 30;
  const examMax = school?.examMaxScore ?? 70;
  const totalMax = sbaMax + examMax;

  // Aggregates & Statistics from authentic records
  const totalClassScore = termResults.reduce((acc, curr) => acc + (curr.classScore || 0), 0);
  const totalExamScore = termResults.reduce((acc, curr) => acc + (curr.examScore || 0), 0);
  const totalScoreSum = termResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const maxPossibleMarks = termResults.length * totalMax;
  const overallAverage = hasResults && maxPossibleMarks > 0 
    ? ((totalScoreSum / maxPossibleMarks) * 100).toFixed(1) 
    : '—';
  
  const numericAvg = hasResults && overallAverage !== '—' ? parseFloat(overallAverage) : 0;
  const overallGradeInfo = hasResults ? calculateGhanaGrade(numericAvg) : { grade: '—' as any, remark: 'Pending Assessment', points: 0 };

  // Authentic Attendance Calculation (Supports manual teacher entry and logged roll calls)
  const studentAttendance = attendance.filter(
    a => a.studentId === student.id && (a.term === selectedTerm || !a.term)
  );
  const totalLoggedDays = studentAttendance.length;
  const daysPresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysLate = studentAttendance.filter(a => a.status === 'late').length;
  const daysAbsent = studentAttendance.filter(a => a.status === 'absent').length;

  const displayTotalDays = student.attendanceTotal !== undefined && student.attendanceTotal !== null && student.attendanceTotal > 0
    ? student.attendanceTotal
    : (totalLoggedDays > 0 ? totalLoggedDays : 60);

  const displayDaysPresent = student.attendancePresent !== undefined && student.attendancePresent !== null
    ? student.attendancePresent
    : (totalLoggedDays > 0 ? daysPresent : displayTotalDays);

  const displayDaysAbsent = Math.max(0, displayTotalDays - displayDaysPresent);
  const attendanceRate = displayTotalDays > 0 ? Math.round((displayDaysPresent / displayTotalDays) * 100) : null;

  // Peer Class Position & Rank Calculation
  const classStudentsList = students.filter(s => s.currentClassroomId === student.currentClassroomId);
  const totalClassStudents = classStudentsList.length > 0 ? classStudentsList.length : (currentClass?.studentCount || 1);

  const studentAverages = classStudentsList.map(st => {
    const stResults = allResults.filter(
      r => r.studentId === st.id && (r.term === selectedTerm || (!r.term && selectedTerm === 'Term 3'))
    );
    const total = stResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
    const count = stResults.length;
    const avg = count > 0 ? total / count : -1;
    return { studentId: st.id, avg, count };
  }).filter(item => item.count > 0);

  studentAverages.sort((a, b) => b.avg - a.avg);
  const studentRankIndex = studentAverages.findIndex(item => item.studentId === student.id);
  const computedClassPosition = studentRankIndex >= 0 ? studentRankIndex + 1 : (termResults[0]?.position || null);

  // Automatically Select the 5 Core Competencies based on actual student results
  const coreCompetencies: CoreCompetencyEvaluation[] = evaluateStudentCompetencies(
    termResults.map(r => ({
      subjectName: r.subjectName || (r as any).subject || '',
      classScore: r.classScore,
      examScore: r.examScore,
      totalScore: r.totalScore || ((r.classScore || 0) + (r.examScore || 0)),
      grade: r.grade,
    })),
    numericAvg,
    attendanceRate
  );

  // Conduct & Attitude Evaluation based on actual records
  const conductEvaluation = (() => {
    if (numericAvg >= 80 && (attendanceRate === null || attendanceRate >= 85)) {
      return {
        status: 'Exemplary',
        remark: 'Exhibits high moral discipline, exemplary courtesy, and respect for school regulations.',
      };
    }
    if (numericAvg >= 65 && (attendanceRate === null || attendanceRate >= 75)) {
      return {
        status: 'Very Good',
        remark: 'Obedient, cooperative, and maintains positive, respectful relations with staff and peers.',
      };
    }
    if (numericAvg >= 50) {
      return {
        status: 'Satisfactory',
        remark: 'Displays good behaviour and responds positively to institutional direction and mentorship.',
      };
    }
    return {
      status: 'Fair / Needs Guidance',
      remark: 'Requires closer monitoring, improved class attention, and active commitment to school rules.',
    };
  })();

  const participationEvaluation = (() => {
    if (numericAvg >= 75) {
      return {
        status: 'Active & Engaged',
        remark: 'Participates proactively in lessons, collaborative work, and extracurricular activities.',
      };
    }
    if (numericAvg >= 55) {
      return {
        status: 'Consistent',
        remark: 'Demonstrates steady participation; encouraged to contribute more freely in class discussions.',
      };
    }
    return {
      status: 'Developing',
      remark: 'Shows cautious involvement in class interactions; consistent encouragement at home advised.',
    };
  })();

  // Promotion Determination (Term 3 Promotional Assessment)
  const isTerm3 = selectedTerm === 'Term 3';
  let promotionStatus: 'PROMOTED' | 'NOT PROMOTED' | 'PROMOTED ON TRIAL' | 'PENDING' | 'GRADUATED' = 'PENDING';
  if (student.promotionStatus) {
    promotionStatus = student.promotionStatus;
  } else if (isTerm3 && hasResults) {
    if (numericAvg >= 50) {
      promotionStatus = 'PROMOTED';
    } else if (numericAvg >= 45) {
      promotionStatus = 'PROMOTED ON TRIAL';
    } else {
      promotionStatus = 'NOT PROMOTED';
    }
  }

  const isPromoted = promotionStatus === 'PROMOTED' || promotionStatus === 'PROMOTED ON TRIAL';
  const targetNextClass = student.nextClass || (currentClass?.level ? `Next Academic Grade` : '');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Student Terminal Report"
      subtitle={`Academic assessment report for ${student.firstName} ${student.lastName} (${student.admissionNumber})`}
      maxWidth="5xl"
    >
      <div className="space-y-4">
        
        {/* Print Stylesheet for High-Fidelity Pure Black, White & Grey A4 Print & PDF Output */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm 8mm 10mm;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide interactive UI controls on print */
              .print-hide, .print-hide * {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              /* Remove modal wrapper constraints */
              .fixed.inset-0 {
                position: static !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
              }
              .max-h-\\[80vh\\] {
                max-height: none !important;
                overflow: visible !important;
                padding: 0 !important;
              }
              .report-sheet {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .page-break-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          `
        }} />

        {/* Top Control Bar (Hidden when Printing) */}
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-hide">
          
          {/* Term Switcher */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 p-1 rounded-lg">
            {(['Term 1', 'Term 2', 'Term 3'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedTerm === t
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                {t} {t === 'Term 3' && '(Promotional)'}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {school.registrationNumber && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-black rounded-lg text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>REG: {school.registrationNumber}</span>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PURE BLACK, WHITE & GREY PROFESSIONAL A4 TERMINAL REPORT                  */}
        {/* Background: White only • Text: Black only • Headers: Subtle Grey          */}
        {/* Borders: Thin Grey/Black • Zero Color Accents                             */}
        {/* ========================================================================= */}
        <div 
          ref={printRef}
          className="report-sheet bg-white rounded-lg border border-gray-400 p-6 sm:p-8 space-y-4 text-black font-sans"
        >
          
          {/* 1. INSTITUTIONAL HEADER & IDENTIFIERS */}
          <div className="border-b-2 border-black pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
              
              {/* School Logo / Seal */}
              <div className="shrink-0 flex items-center justify-center">
                {school.logo ? (
                  <img 
                    src={school.logo} 
                    alt={school.name || 'School Emblem'} 
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded object-contain border border-gray-400 bg-white p-1" 
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded bg-gray-100 text-black flex flex-col items-center justify-center border border-gray-400 p-2">
                    <SchoolIcon className="w-8 h-8 text-black mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-center line-clamp-1">
                      {school.name ? school.name.slice(0, 10) : 'SchoolOS'}
                    </span>
                  </div>
                )}
              </div>

              {/* School Information */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                    Official Academic Report
                  </span>
                  {school.registrationNumber && (
                    <span className="text-[10px] font-mono text-gray-700">
                      Reg. Number: {school.registrationNumber}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-serif">
                  {school.name || 'SchoolOS Academic Institution'}
                </h1>

                {school.motto && (
                  <p className="text-xs text-gray-800 italic font-medium">
                    "{school.motto}"
                  </p>
                )}

                {/* Address & Location */}
                {(school.address || school.district || school.region) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 text-xs text-gray-800">
                    {school.address && <span>{school.address}</span>}
                    {school.district && <span>• {school.district} District</span>}
                    {school.region && <span>• {school.region} Region</span>}
                  </div>
                )}

                {/* Contact Information */}
                {(school.phone || school.email || school.website) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-0.5 text-[11px] text-gray-800 font-mono pt-0.5">
                    {school.phone && <span>Tel: {school.phone}</span>}
                    {school.email && <span>Email: {school.email}</span>}
                    {school.website && <span>Web: {school.website}</span>}
                  </div>
                )}
              </div>

              {/* Verification Seal Block */}
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded border border-gray-400 bg-gray-100 text-center shrink-0 w-36">
                <BadgeCheck className="w-6 h-6 text-black mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                  Verified Copy
                </span>
                <span className="text-[9px] text-gray-700 font-mono">Terminal Record</span>
              </div>
            </div>

            {/* Document Title Banner: Grey shaded background with black text */}
            <div className="mt-3.5 pt-2 border-t border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-200 text-black px-4 py-2 rounded border border-gray-400">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-black" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
                  Terminal Assessment &amp; Progress Report
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-black flex items-center gap-2">
                {school.currentAcademicYear && <span>{school.currentAcademicYear}</span>}
                {school.currentAcademicYear && <span>•</span>}
                <span>{selectedTerm} {selectedTerm === 'Term 3' ? '(Promotional)' : ''}</span>
              </div>
            </div>
          </div>

          {/* 2. STUDENT INFORMATION & BIODATA SECTION */}
          <div className="bg-white rounded border border-gray-400 page-break-avoid overflow-hidden">
            {/* Grey Section Header */}
            <div className="bg-gray-100 px-4 py-1.5 border-b border-gray-300 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                Student Identification &amp; Biodata
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-800">
                Class: {student.classroomName || currentClass?.name || 'Class Roster'} {student.level ? `(${student.level})` : ''}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-300 pb-3">
                
                <div className="flex items-center gap-3.5">
                  {/* Student Photograph */}
                  <div className="shrink-0">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded object-cover border border-black bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded bg-gray-100 text-black flex flex-col items-center justify-center border border-gray-400">
                        <User className="w-7 h-7 text-gray-700" />
                        <span className="text-[9px] font-mono mt-0.5 text-black uppercase">Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Name and Identifiers */}
                  <div>
                    <div className="text-[9.5px] font-bold text-gray-700 uppercase tracking-wider">Student Name</div>
                    <h2 className="text-base sm:text-lg font-black text-black tracking-tight">
                      {student.firstName} {student.lastName} {student.otherNames || ''}
                    </h2>
                    
                    <div className="text-xs text-black flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 font-mono">
                      <span className="font-bold text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-400">
                        ID: {student.admissionNumber}
                      </span>
                      {student.gender && (
                        <span className="capitalize text-gray-800">
                          Gender: <b>{student.gender}</b>
                        </span>
                      )}
                      {student.dateOfBirth && (
                        <span className="text-gray-800">
                          DOB: <b>{formatDate(student.dateOfBirth)}</b>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Class & Academic Details */}
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between gap-1 text-right">
                  <div className="text-xs font-bold text-black bg-gray-100 px-3 py-1 rounded border border-gray-400">
                    Class: <b>{student.classroomName || currentClass?.name || 'Class Roster'}</b>
                  </div>
                  {currentClass?.classTeacherName && (
                    <div className="text-[11px] text-gray-800">
                      Form Tutor: <b className="text-black">{currentClass.classTeacherName}</b>
                    </div>
                  )}
                  {student.houseOrTeam && (
                    <div className="text-[11px] text-gray-700 font-mono">
                      House/Team: <b>{student.houseOrTeam}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Session & Attendance Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-gray-700 block tracking-wider">Sessions Opened</span>
                  <span className="font-mono font-bold text-black">
                    {totalLoggedDays > 0 ? `${totalLoggedDays} Days` : '—'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-gray-700 block tracking-wider">Days Present</span>
                  <span className="font-mono font-bold text-black">
                    {totalLoggedDays > 0 ? `${daysPresent} Days (${attendanceRate}%)` : '—'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-gray-700 block tracking-wider">Class Peer Rank</span>
                  <span className="font-bold text-black font-mono">
                    {computedClassPosition ? (
                      <span>{getOrdinalSuffix(computedClassPosition)} of {totalClassStudents} Pupils</span>
                    ) : (
                      <span>— of {totalClassStudents}</span>
                    )}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-gray-700 block tracking-wider">Next Term Resumes</span>
                  <span className="font-bold text-black font-mono">
                    {settings?.reopeningDate ? formatDate(settings.reopeningDate) : 'Per School Calendar'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PERFORMANCE SUMMARY STRIP (GREY SHADED TILES WITH THIN BORDERS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 page-break-avoid">
            
            <div className="bg-gray-100 p-2.5 rounded border border-gray-400 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-white border border-gray-400 text-black flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider block">Subjects Taken</span>
                <div className="text-sm font-black text-black">
                  {hasResults ? termResults.length : 0} <span className="text-[11px] font-normal text-gray-700">Courses</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-2.5 rounded border border-gray-400 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-white border border-gray-400 text-black flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider block">Terminal Average</span>
                <div className="text-sm font-black text-black">
                  {hasResults ? `${overallAverage}%` : '—'}
                  {hasResults && (
                    <span className="text-xs font-bold text-black ml-1">({overallGradeInfo.grade})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-2.5 rounded border border-gray-400 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-white border border-gray-400 text-black flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider block">Total Marks</span>
                <div className="text-sm font-black text-black font-mono">
                  {hasResults ? totalScoreSum : '—'}{' '}
                  {hasResults && (
                    <span className="text-xs font-normal text-gray-700">/ {maxPossibleMarks}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-2.5 rounded border border-gray-400 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-white border border-gray-400 text-black flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider block">Performance</span>
                <div className="text-xs font-black uppercase text-black truncate">
                  {hasResults ? overallGradeInfo.remark : 'Pending Results'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. ACADEMIC PERFORMANCE TABLE */}
          <div className="space-y-1.5 page-break-avoid">
            {/* Section Header: Grey Shaded with Black Text */}
            <div className="bg-gray-100 px-3 py-1.5 rounded-t border border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-black" />
                <span>Academic Subject Performance Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-gray-700">
                Weighting: {sbaMax} Class SBA + {examMax} Examination = {totalMax} Maximum Marks
              </span>
            </div>

            {hasResults ? (
              <div className="overflow-x-auto rounded-b border border-t-0 border-gray-400">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    {/* Table Header: Light Grey Shade with Black Text */}
                    <tr className="bg-gray-200 text-black font-bold uppercase text-[10px] tracking-wider border-b border-gray-400">
                      <th className="py-2 px-3 border-r border-gray-300 w-10 text-center">#</th>
                      <th className="py-2 px-3 border-r border-gray-300">Subject</th>
                      <th className="py-2 px-2 text-center border-r border-gray-300 w-24">Class Score ({sbaMax})</th>
                      <th className="py-2 px-2 text-center border-r border-gray-300 w-24">Exam Score ({examMax})</th>
                      <th className="py-2 px-2 text-center border-r border-gray-300 w-26 font-black bg-gray-300/60">Total ({totalMax})</th>
                      <th className="py-2 px-2 text-center border-r border-gray-300 w-18">Grade</th>
                      <th className="py-2 px-2 text-center border-r border-gray-300 w-20">Position</th>
                      <th className="py-2 px-3">Subject Teacher's Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 font-medium">
                    {termResults.map((item, idx) => {
                      const total = item.totalScore || ((item.classScore || 0) + (item.examScore || 0));
                      const itemGradeInfo = calculateGhanaGrade(total, totalMax);
                      const displayGrade = item.grade || itemGradeInfo.grade;
                      const displayRemark = item.teacherRemarks || item.gradeRemark || itemGradeInfo.remark;

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-3 text-center font-mono text-gray-600 border-r border-gray-300">
                            {idx + 1}
                          </td>

                          <td className="py-2 px-3 font-bold text-black border-r border-gray-300">
                            {item.subjectName || (item as any).subject || `Subject ${idx + 1}`}
                          </td>

                          <td className="py-2 px-2 text-center font-mono border-r border-gray-300 text-black">
                            {item.classScore ?? '—'}
                          </td>

                          <td className="py-2 px-2 text-center font-mono border-r border-gray-300 text-black">
                            {item.examScore ?? '—'}
                          </td>

                          <td className="py-2 px-2 text-center font-mono font-black text-black bg-gray-100 border-r border-gray-300">
                            {total}
                          </td>

                          <td className="py-2 px-2 text-center border-r border-gray-300">
                            <span className="px-2 py-0.5 rounded text-[10.5px] border border-gray-400 bg-gray-100 text-black font-bold">
                              {displayGrade}
                            </span>
                          </td>

                          <td className="py-2 px-2 text-center font-mono text-black border-r border-gray-300">
                            {item.position ? getOrdinalSuffix(item.position) : '—'}
                          </td>

                          <td className="py-2 px-3 text-black text-[11px] leading-snug">
                            {displayRemark || 'Satisfactory achievement'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Table Footer: Light Grey Shade with Black Text */}
                  <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400 text-black">
                      <td colSpan={2} className="py-2 px-3 uppercase text-[10px] font-black border-r border-gray-300">
                        Cumulative Term Aggregate
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-black border-r border-gray-300">
                        {totalClassScore}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-black border-r border-gray-300">
                        {totalExamScore}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-black text-black bg-gray-200 border-r border-gray-300">
                        {totalScoreSum} / {maxPossibleMarks}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-black border-r border-gray-300">
                        {overallGradeInfo.grade}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-black border-r border-gray-300">
                        {computedClassPosition ? getOrdinalSuffix(computedClassPosition) : '—'}
                      </td>
                      <td className="py-2 px-3 font-bold text-black text-[11px]">
                        Average: {overallAverage}% • {overallGradeInfo.remark}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-b p-8 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-gray-500 mx-auto" />
                <h4 className="font-bold text-sm text-black">No Assessment Records Available</h4>
                <p className="text-xs text-gray-700 max-w-md mx-auto">
                  Continuous assessment (SBA) marks and examination scores have not yet been recorded for {student.firstName} for {selectedTerm}.
                </p>
              </div>
            )}
          </div>

          {/* 5. CORE COMPETENCIES SECTION */}
          <div className="space-y-1.5 page-break-avoid">
            {/* Section Header: Grey Shaded with Black Text */}
            <div className="bg-gray-100 px-3 py-1.5 rounded-t border border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-black" />
                <span>National Curriculum Core Competencies &amp; Skills Assessment</span>
              </h3>
              <span className="text-[10px] text-gray-700 font-mono">
                System-evaluated from subject achievements, continuous assessments &amp; discipline
              </span>
            </div>

            <div className="rounded-b border border-t-0 border-gray-400 overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Table Header: Light Grey Shade with Black Text */}
                  <tr className="bg-gray-200 border-b border-gray-400 text-black font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3 w-10 text-center border-r border-gray-300">#</th>
                    <th className="py-2 px-3 border-r border-gray-300 w-56">Core Competency Area</th>
                    <th className="py-2 px-3 border-r border-gray-300 w-44">Domain / Academic Basis</th>
                    <th className="py-2 px-2 text-center border-r border-gray-300 w-28">Attainment Level</th>
                    <th className="py-2 px-3">Evaluative Observation &amp; Demonstrated Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {coreCompetencies.map((comp, cIdx) => (
                    <tr key={comp.id} className={cIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-center font-mono text-gray-600 border-r border-gray-300">
                        {cIdx + 1}
                      </td>

                      <td className="py-2 px-3 font-bold text-black border-r border-gray-300">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                          <span>{comp.name}</span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-[11px] text-gray-800 border-r border-gray-300">
                        <div>{comp.domain}</div>
                        {comp.relevantSubject && (
                          <span className="text-[10px] text-gray-700 font-mono">
                            Ref: {comp.relevantSubject}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-2 text-center border-r border-gray-300">
                        <span className="inline-block px-2 py-0.5 rounded text-[10.5px] border border-gray-400 bg-gray-100 text-black font-bold">
                          {comp.level}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-black text-[11px] leading-snug">
                        {comp.diagnosticRemark}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. ATTENDANCE & CONDUCT / GENERAL EVALUATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 page-break-avoid">
            
            {/* Attendance & Punctuality Record */}
            <div className="rounded border border-gray-400 bg-white overflow-hidden space-y-0">
              <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-black" />
                  <span>Attendance &amp; Punctuality Record</span>
                </h4>
              </div>

              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-[9px] uppercase font-bold text-gray-700 block">Total Days</span>
                    <span className="text-sm font-black text-black font-mono">{displayTotalDays}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-[9px] uppercase font-bold text-gray-700 block">Present</span>
                    <span className="text-sm font-black text-black font-mono">{displayDaysPresent}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-[9px] uppercase font-bold text-gray-700 block">Absent</span>
                    <span className="text-sm font-black text-black font-mono">{displayDaysAbsent}</span>
                  </div>
                </div>

                <div className="pt-0.5">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-gray-800">Attendance Rate:</span>
                    <span className="font-bold font-mono text-black">
                      {attendanceRate !== null ? `${attendanceRate}%` : 'Not Tracked'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                    <div 
                      className="bg-black h-full rounded-full transition-all" 
                      style={{ width: `${attendanceRate ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Conduct & Participation Profile */}
            <div className="rounded border border-gray-400 bg-white overflow-hidden space-y-0">
              <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-black" />
                  <span>Conduct &amp; Participation Profile</span>
                </h4>
              </div>

              <div className="p-3 space-y-2 text-xs">
                <div className="bg-gray-50 p-2 rounded border border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-700">Conduct / Behaviour:</span>
                    <span className="font-bold text-black bg-gray-200 px-2 py-0.5 rounded text-[10.5px] border border-gray-400">
                      {conductEvaluation.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-black mt-1 leading-snug">
                    {conductEvaluation.remark}
                  </p>
                </div>

                <div className="bg-gray-50 p-2 rounded border border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-700">Class Participation:</span>
                    <span className="font-bold text-black bg-gray-200 px-2 py-0.5 rounded text-[10.5px] border border-gray-400">
                      {participationEvaluation.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-black mt-1 leading-snug">
                    {participationEvaluation.remark}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 7. PROMOTION & ADVANCEMENT STATUS SECTION (GREY SHADED WITH BLACK TEXT) */}
          {(isTerm3 || student.promotionStatus) && (
            <div className="p-3.5 rounded border border-gray-400 bg-gray-100 text-black flex flex-col sm:flex-row items-center justify-between gap-3 page-break-avoid">
              <div className="flex items-center gap-3 text-center sm:text-left">
                {promotionStatus === 'PROMOTED' && <CheckCircle className="w-5 h-5 text-black shrink-0" />}
                {promotionStatus === 'PROMOTED ON TRIAL' && <AlertTriangle className="w-5 h-5 text-black shrink-0" />}
                {promotionStatus === 'NOT PROMOTED' && <XCircle className="w-5 h-5 text-black shrink-0" />}
                {promotionStatus === 'PENDING' && <Clock className="w-5 h-5 text-black shrink-0" />}
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-gray-800">
                    Annual Academic Promotion Decision:
                  </div>
                  <div className="text-sm font-black text-black">
                    Status: <span className="underline uppercase tracking-wide">{promotionStatus}</span>
                    {isPromoted && targetNextClass && ` — Advanced to ${targetNextClass}`}
                  </div>
                  <div className="text-[11px] text-gray-800 mt-0.5">
                    {isPromoted 
                      ? 'Student has satisfied the academic prerequisites and attained required grade competencies.'
                      : 'Requires targeted reinforcement of foundational competencies before full advancement.'}
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded border border-gray-400 text-black shrink-0">
                Next Term Resumes: {settings?.reopeningDate ? formatDate(settings.reopeningDate) : 'Per School Calendar'}
              </div>
            </div>
          )}

          {/* 8. STANDARD ASSESSMENT SCALE KEY (GREY SHADED REFERENCE TABLE) */}
          <div className="bg-white border border-gray-400 rounded overflow-hidden text-[10.5px] page-break-avoid">
            <div className="bg-gray-100 px-3 py-1 border-b border-gray-300 font-bold uppercase tracking-wider text-black text-[9px]">
              Standard Basic Academic Assessment Scale Reference:
            </div>
            <div className="p-2 grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">A (80-100%)</span>
                <span className="text-gray-800 font-medium">Exemplary</span>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">B+ (75-79%)</span>
                <span className="text-gray-800 font-medium">Very Good</span>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">B (70-74%)</span>
                <span className="text-gray-800 font-medium">Good</span>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">C (60-69%)</span>
                <span className="text-gray-800 font-medium">Credit</span>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">D (50-59%)</span>
                <span className="text-gray-800 font-medium">Pass</span>
              </div>
              <div className="bg-gray-50 border border-gray-300 p-1.5 rounded flex items-center justify-between">
                <span className="font-bold text-black">E/F (&lt;50%)</span>
                <span className="text-gray-800 font-medium">Needs Support</span>
              </div>
            </div>
          </div>

          {/* 9. OFFICIAL REMARKS & ENDORSEMENTS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t-2 border-black text-xs page-break-avoid">
            
            {/* Class Tutor Remarks */}
            <div className="rounded border border-gray-400 bg-white overflow-hidden">
              <div className="bg-gray-100 px-3 py-1 border-b border-gray-300">
                <span className="text-[10px] uppercase font-bold text-black block tracking-wider">
                  Class Tutor's Comprehensive Remarks
                </span>
              </div>
              <div className="p-3 text-black text-xs leading-relaxed font-serif italic min-h-[48px] flex items-center">
                {hasResults ? (
                  `"${generateTeacherRemark(numericAvg)}"`
                ) : (
                  <span className="text-gray-500 not-italic">Assessment remarks will be recorded upon marks finalization.</span>
                )}
              </div>
            </div>

            {/* Principal / Headteacher Remarks */}
            <div className="rounded border border-gray-400 bg-white overflow-hidden">
              <div className="bg-gray-100 px-3 py-1 border-b border-gray-300">
                <span className="text-[10px] uppercase font-bold text-black block tracking-wider">
                  {school.principalTitle || 'Head of Institution'} Official Remarks
                </span>
              </div>
              <div className="p-3 text-black text-xs leading-relaxed font-serif italic min-h-[48px] flex items-center">
                {hasResults ? (
                  `"${generateHeadTeacherRemark(numericAvg, isPromoted, targetNextClass)}"`
                ) : (
                  <span className="text-gray-500 not-italic">Institutional validation pending marks compilation.</span>
                )}
              </div>
            </div>
          </div>

          {/* 10. OFFICIAL SIGNATURES & INSTITUTIONAL SEAL SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dashed border-gray-400 page-break-avoid text-xs">
            
            {/* 1. Class Tutor Signature Block */}
            <div className="space-y-1 text-center sm:text-left bg-gray-50 p-2.5 rounded border border-gray-300">
              <div className="h-9 flex items-end justify-center sm:justify-start">
                <span className="font-serif italic text-sm text-black font-bold border-b border-black pb-0.5 px-3">
                  {currentClass?.classTeacherName || 'Class Tutor Signature'}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-300">
                <div className="font-bold text-black">
                  {currentClass?.classTeacherName || 'Form Tutor'}
                </div>
                <div className="text-[10px] text-gray-700 font-mono">Class Teacher Signature &amp; Date</div>
              </div>
            </div>

            {/* 2. Head of Institution Signature & Seal Block */}
            <div className="space-y-1 text-center sm:text-left bg-gray-50 p-2.5 rounded border border-gray-300">
              <div className="h-9 flex items-end justify-center sm:justify-start gap-2">
                <span className="font-serif italic text-sm text-black font-bold border-b border-black pb-0.5 px-3">
                  {school.principalName || 'Institutional Head'}
                </span>
                <div className="hidden sm:inline-flex items-center text-[9px] font-mono text-black bg-gray-200 px-1.5 py-0.5 rounded border border-gray-400">
                  <ShieldCheck className="w-3 h-3 mr-0.5" /> SEAL
                </div>
              </div>
              <div className="pt-1 border-t border-gray-300">
                <div className="font-bold text-black">
                  {school.principalName || (school.principalTitle || 'Headteacher / Principal')}
                </div>
                <div className="text-[10px] text-gray-700 font-mono">
                  {school.principalTitle || 'Head of Institution'} Stamp &amp; Signature
                </div>
              </div>
            </div>

            {/* 3. Parent / Guardian Acknowledgement Block */}
            <div className="space-y-1 text-center sm:text-left bg-gray-50 p-2.5 rounded border border-gray-300">
              <div className="h-9 flex items-end justify-center sm:justify-start">
                <span className="font-serif italic text-xs text-gray-600 border-b border-gray-400 pb-0.5 px-3 w-full text-center sm:text-left">
                  ................................................
                </span>
              </div>
              <div className="pt-1 border-t border-gray-300">
                <div className="font-bold text-black truncate">
                  {student.guardianName || student.guardians?.[0]?.name || 'Parent / Legal Guardian'}
                </div>
                <div className="text-[10px] text-gray-700 font-mono">Parent / Guardian Signature</div>
              </div>
            </div>
          </div>

          {/* 11. FOOTER & VERIFICATION CITATION */}
          <div className="pt-2 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[9px] text-gray-700 font-mono">
            <div>
              Generated via <b>SchoolOS Online</b> • Official Academic Management System
            </div>
            <div>
              Transcript Ref: <b className="text-black">{student.admissionNumber}-{selectedTerm.replace(/\s+/g, '')}-{school.currentAcademicYear || new Date().getFullYear()}</b>
            </div>
            <div>
              Date Issued: <b className="text-black">{formatDate(new Date().toISOString())}</b>
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
