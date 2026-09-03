import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Student, School, ExaminationResult } from '../../types';
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
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  Phone,
  Mail,
  Globe,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  BadgeCheck
} from 'lucide-react';
import { formatDate } from '../../utils/formatting';
import { calculateGhanaGrade, generateTeacherRemark, generateHeadTeacherRemark } from '../../utils/calculations';

interface TerminalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const TerminalReportModal: React.FC<TerminalReportModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { school, results = [], examResults = [], classrooms = [], attendance = [], students = [], settings } = useSchool();
  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(school?.currentTerm || 'Term 3');
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

  // Compute actual aggregates if results exist
  const totalClassScore = termResults.reduce((acc, curr) => acc + (curr.classScore || 0), 0);
  const totalExamScore = termResults.reduce((acc, curr) => acc + (curr.examScore || 0), 0);
  const totalScoreSum = termResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const maxPossibleMarks = termResults.length * totalMax;
  const overallAverage = hasResults && maxPossibleMarks > 0 
    ? ((totalScoreSum / maxPossibleMarks) * 100).toFixed(1) 
    : '—';
  
  const numericAvg = hasResults && overallAverage !== '—' ? parseFloat(overallAverage) : 0;
  const overallGradeInfo = hasResults ? calculateGhanaGrade(numericAvg) : { grade: '—' as any, remark: 'Pending Assessment', points: 0 };

  // Real attendance calculation from Firebase
  const studentAttendance = attendance.filter(
    a => a.studentId === student.id && (a.term === selectedTerm || !a.term)
  );
  const totalLoggedDays = studentAttendance.length;
  const daysPresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysLate = studentAttendance.filter(a => a.status === 'late').length;
  const daysAbsent = studentAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = totalLoggedDays > 0 ? Math.round((daysPresent / totalLoggedDays) * 100) : null;

  // Real class peer position calculation
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

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10, k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  // Promotion determination (especially for Term 3)
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
  const targetNextClass = student.nextClass || (currentClass?.level ? `Next Academic Form` : '');

  // Grade badge styling helper in Oxford Slate / Warm Bronze palette
  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case '1':
      case 'A':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case '2':
      case 'B+':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case '3':
      case 'B':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case '4':
      case 'C':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case '5':
      case 'D':
        return 'bg-orange-50 text-orange-900 border-orange-300';
      case '6':
      case 'E':
      case 'F':
        return 'bg-rose-50 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Terminal Progress Report"
      subtitle={`Official assessment transcript for ${student.firstName} ${student.lastName} (${student.admissionNumber})`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        
        {/* Print Stylesheet for Pristine A4 Output */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-hide {
                display: none !important;
              }
              .report-sheet {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
              .page-break-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `
        }} />

        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-hide">
          
          {/* Term Switcher */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
            {(['Term 1', 'Term 2', 'Term 3'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTerm === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t} {t === 'Term 3' && '(Promotional)'}
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {school.registrationNumber && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>REG: {school.registrationNumber}</span>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Transcript (A4)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL A4 TERMINAL PROGRESS REPORT DOCUMENT                             */}
        {/* ========================================================================= */}
        <div 
          ref={printRef}
          className="report-sheet bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-9 space-y-5 text-slate-900 font-sans"
        >
          
          {/* 1. INSTITUTIONAL HEADER & OFFICIAL IDENTITY */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
              
              {/* School Logo / Crest: Rendered ONLY if school has uploaded one */}
              {school.logo ? (
                <div className="shrink-0">
                  <img 
                    src={school.logo} 
                    alt={school.name || 'School Crest'} 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-contain border border-slate-200 bg-white p-1 shadow-2xs" 
                  />
                </div>
              ) : null}

              {/* School Information: Authentic Data Only */}
              <div className="flex-1 space-y-1">
                {school.name && (
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-serif">
                    {school.name}
                  </h1>
                )}

                {school.motto && (
                  <p className="text-xs text-amber-900 font-medium italic">
                    "{school.motto}"
                  </p>
                )}

                {/* Address & Location */}
                {(school.address || school.district || school.region) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 text-xs text-slate-600">
                    {school.address && <span>{school.address}</span>}
                    {school.district && <span>• {school.district} District</span>}
                    {school.region && <span>• {school.region} Region, Ghana</span>}
                  </div>
                )}

                {/* Contact Points */}
                {(school.phone || school.email || school.website) && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono pt-0.5">
                    {school.phone && <span>Tel: {school.phone}</span>}
                    {school.email && <span>Email: {school.email}</span>}
                    {school.website && <span>Web: {school.website}</span>}
                  </div>
                )}
              </div>

              {/* Official Academic Certificate Crest / Badge */}
              <div className="hidden sm:flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center shrink-0 w-36">
                <BadgeCheck className="w-5 h-5 text-amber-700 mb-0.5" />
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">
                  Official Record
                </span>
                <span className="text-[8.5px] text-slate-500 font-mono">Continuous Assessment</span>
              </div>
            </div>

            {/* Document Proclamation Bar */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Continuous Assessment &amp; Terminal Progress Report
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
                {school.currentAcademicYear && <span>{school.currentAcademicYear}</span>}
                {school.currentAcademicYear && <span>•</span>}
                <span>{selectedTerm} {selectedTerm === 'Term 3' ? '(Promotional)' : ''}</span>
              </div>
            </div>
          </div>

          {/* 2. STUDENT INFORMATION & BIODATA CARD */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3 page-break-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.firstName}
                    className="w-13 h-13 rounded-xl object-cover border border-slate-300 shadow-2xs bg-white shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-base shadow-2xs shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div>
                  <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Student Name</div>
                  <h3 className="text-base font-black text-slate-950">
                    {student.firstName} {student.lastName} {student.otherNames || ''}
                  </h3>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono">
                    <span className="font-bold text-slate-900">ID: {student.admissionNumber}</span>
                    {student.gender && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{student.gender}</span>
                      </>
                    )}
                    {student.dateOfBirth && (
                      <>
                        <span>•</span>
                        <span>DOB: {formatDate(student.dateOfBirth)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between gap-1 text-right">
                <div className="text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {student.classroomName || 'Current Class'} {student.level ? `(${student.level})` : ''}
                </div>
                {currentClass?.classTeacherName && (
                  <div className="text-[11px] text-slate-600">
                    Class Tutor: <b>{currentClass.classTeacherName}</b>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance & Session Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Sessions Opened</span>
                <span className="font-mono font-bold text-slate-900">
                  {totalLoggedDays > 0 ? `${totalLoggedDays} Days` : '—'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Sessions Attended</span>
                <span className="font-mono font-bold text-slate-900">
                  {totalLoggedDays > 0 ? `${daysPresent} Days (${attendanceRate}%)` : '—'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Class Peer Rank</span>
                <span className="font-bold text-slate-950 font-mono">
                  {computedClassPosition ? (
                    <span>{getOrdinalSuffix(computedClassPosition)} of {totalClassStudents} Pupils</span>
                  ) : (
                    <span>— of {totalClassStudents}</span>
                  )}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Next Term Reopening</span>
                <span className="font-bold text-slate-900 font-mono">
                  {settings?.reopeningDate ? formatDate(settings.reopeningDate) : 'Per Academic Calendar'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. ACADEMIC PERFORMANCE SUMMARY STRIP (4 KPIS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 page-break-avoid">
            
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Subjects Assessed</span>
                <div className="text-base font-black text-slate-950">
                  {hasResults ? termResults.length : 0} <span className="text-xs font-normal text-slate-500">Courses</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Terminal Average</span>
                <div className="text-base font-black text-slate-950">
                  {hasResults ? `${overallAverage}%` : '—'}
                  {hasResults && (
                    <span className="text-xs font-bold text-amber-800 ml-1.5">(Grade {overallGradeInfo.grade})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Aggregate Marks</span>
                <div className="text-base font-black text-slate-950 font-mono">
                  {hasResults ? totalScoreSum : '—'}{' '}
                  {hasResults && (
                    <span className="text-xs font-normal text-slate-400">/ {maxPossibleMarks}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Overall Performance</span>
                <div className="text-xs font-black uppercase text-amber-300 leading-tight">
                  {hasResults ? overallGradeInfo.remark : 'Pending Entry'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. ACADEMIC RESULTS TABLE */}
          <div className="space-y-2 page-break-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-800" />
                <span>Continuous Assessment (SBA {sbaMax}) &amp; Examination ({examMax}) Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Assessment Weighting: {sbaMax} SBA + {examMax} Exam = {totalMax} Maximum Marks
              </span>
            </div>

            {hasResults ? (
              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-800 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">Curriculum Subject</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-24">Class SBA ({sbaMax})</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-24">Exam ({examMax})</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-28 bg-slate-800 text-amber-300">Total ({totalMax})</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-20">Grade</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-20">Position</th>
                      <th className="py-2.5 px-3">Subject Tutor's Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {termResults.map((item, idx) => {
                      const total = item.totalScore || ((item.classScore || 0) + (item.examScore || 0));
                      const itemGradeInfo = calculateGhanaGrade(total, totalMax);
                      const displayGrade = item.grade || itemGradeInfo.grade;
                      const displayRemark = item.teacherRemarks || item.gradeRemark || itemGradeInfo.remark;

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200">
                            {idx + 1}
                          </td>

                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                            {item.subjectName || (item as any).subject || `Subject ${idx + 1}`}
                          </td>

                          <td className="py-2 px-2 text-center font-mono border-r border-slate-200 text-slate-700">
                            {item.classScore ?? '—'}
                          </td>

                          <td className="py-2 px-2 text-center font-mono border-r border-slate-200 text-slate-700">
                            {item.examScore ?? '—'}
                          </td>

                          <td className="py-2 px-2 text-center font-mono font-black text-slate-950 bg-slate-100/80 border-r border-slate-200">
                            {total}
                          </td>

                          <td className="py-2 px-2 text-center font-bold border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] border font-bold ${getGradeBadgeStyle(String(displayGrade))}`}>
                              {displayGrade}
                            </span>
                          </td>

                          <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-200">
                            {item.position ? getOrdinalSuffix(item.position) : '—'}
                          </td>

                          <td className="py-2 px-3 text-slate-700 text-[11.5px] leading-snug">
                            {displayRemark || 'Satisfactory achievement'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Table Footer */}
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                      <td colSpan={2} className="py-2.5 px-3 uppercase text-[10.5px] font-black border-r border-slate-300">
                        Cumulative Term Aggregate
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-300">
                        {totalClassScore}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-300">
                        {totalExamScore}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-slate-950 bg-amber-100/60 border-r border-slate-300">
                        {totalScoreSum} / {maxPossibleMarks}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-slate-900 border-r border-slate-300">
                        Grade {overallGradeInfo.grade}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-300">
                        {computedClassPosition ? getOrdinalSuffix(computedClassPosition) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 text-[11px]">
                        Overall: {overallAverage}% • {overallGradeInfo.remark}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">No Assessment Records Logged Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Continuous assessment (SBA) marks and examination scores have not yet been recorded for {student.firstName} for {selectedTerm}. Scores entered by teachers will appear here.
                </p>
              </div>
            )}
          </div>

          {/* 5. PROMOTION STATUS SECTION (TERMLY PROMOTIONS) */}
          {(isTerm3 || student.promotionStatus) && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 page-break-avoid ${
              promotionStatus === 'PROMOTED' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : promotionStatus === 'PROMOTED ON TRIAL'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : promotionStatus === 'NOT PROMOTED'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}>
              <div className="flex items-center gap-3 text-center sm:text-left">
                {promotionStatus === 'PROMOTED' && <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />}
                {promotionStatus === 'PROMOTED ON TRIAL' && <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />}
                {promotionStatus === 'NOT PROMOTED' && <XCircle className="w-5 h-5 text-rose-700 shrink-0" />}
                {promotionStatus === 'PENDING' && <Clock className="w-5 h-5 text-slate-600 shrink-0" />}
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider opacity-80">
                    Annual Promotional Decision:
                  </div>
                  <div className="text-sm font-black">
                    Status: <span className="underline uppercase tracking-wide">{promotionStatus}</span>
                    {isPromoted && targetNextClass && ` — Promoted to ${targetNextClass}`}
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono font-bold bg-white/80 px-3 py-1 rounded-lg border border-black/10">
                Academic Year Evaluation
              </div>
            </div>
          )}

          {/* 6. GES & WAEC GRADING SYSTEM REFERENCE KEY */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10.5px] page-break-avoid space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[9px]">
              Ghana Education Service (GES) / Basic School Assessment Scale Reference:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">A (80-100%)</span>
                <span className="text-emerald-700 font-semibold">Exemplary</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">B+ (75-79%)</span>
                <span className="text-blue-700 font-semibold">Very Good</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">B (70-74%)</span>
                <span className="text-slate-700 font-semibold">Good</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">C (60-69%)</span>
                <span className="text-amber-800 font-semibold">Credit</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">D (50-59%)</span>
                <span className="text-orange-800 font-semibold">Pass</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">E/F (&lt;50%)</span>
                <span className="text-rose-700 font-semibold">Needs Support</span>
              </div>
            </div>
          </div>

          {/* 7. TEACHER & PRINCIPAL OFFICIAL ENDORSEMENT SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t-2 border-slate-900 text-xs page-break-avoid">
            
            {/* Class Tutor / Form Master Endorsement */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  Class Tutor / Form Master Endorsement
                </span>
                <div className="text-slate-900 text-xs mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-serif italic min-h-[50px] flex items-center">
                  {hasResults ? (
                    `"${generateTeacherRemark(numericAvg)}"`
                  ) : (
                    <span className="text-slate-400 not-italic">Assessment remarks will be recorded upon compilation.</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-end justify-between border-t border-dashed border-slate-300">
                <div>
                  <div className="font-bold text-slate-900">
                    {currentClass?.classTeacherName || 'Form Tutor'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Class Teacher Signature</div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  Date: <span className="font-bold text-slate-800">{formatDate(new Date().toISOString())}</span>
                </div>
              </div>
            </div>

            {/* Principal / Head of Institution Endorsement */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  {school.principalTitle || 'Head of Institution'} Endorsement
                </span>
                <div className="text-slate-900 text-xs mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-serif italic min-h-[50px] flex items-center">
                  {hasResults ? (
                    `"${generateHeadTeacherRemark(numericAvg, isPromoted, targetNextClass)}"`
                  ) : (
                    <span className="text-slate-400 not-italic">Institutional validation pending marks compilation.</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-end justify-between border-t border-dashed border-slate-300">
                <div>
                  <div className="font-bold text-slate-900">
                    {school.principalName || (school.principalTitle || 'Head of Institution')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {school.principalTitle || 'Headteacher / Principal'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>AUTHENTICATED RECORD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. FOOTER & VERIFICATION CITATION */}
          <div className="pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[9.5px] text-slate-400 font-mono">
            <div>
              Generated via <b>SchoolOS Online</b> • Official Terminal Progress Transcript
            </div>
            <div>
              Reference: <b className="text-slate-700">{student.admissionNumber}-{selectedTerm.replace(/\s+/g, '')}</b>
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
