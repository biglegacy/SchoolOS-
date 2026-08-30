import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Student, School, ExaminationResult } from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Printer, 
  Award, 
  Calendar, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  HelpCircle
} from 'lucide-react';
import { formatDate } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

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
  const { school, results = [], examResults = [], classrooms = [], attendance = [], settings } = useSchool();
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

  // Compute actual aggregates if results exist
  const totalClassScore = termResults.reduce((acc, curr) => acc + (curr.classScore || 0), 0);
  const totalExamScore = termResults.reduce((acc, curr) => acc + (curr.examScore || 0), 0);
  const totalScoreSum = termResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
  const maxPossibleMarks = termResults.length * 100;
  const overallAverage = hasResults ? (totalScoreSum / termResults.length).toFixed(1) : '—';
  
  // Real Stanine Grade from Average
  const getOverallGrade = (avgStr: string) => {
    if (avgStr === '—') return { grade: '—', descriptor: 'Pending Assessment', badgeClass: 'bg-slate-100 text-slate-600' };
    const avg = parseFloat(avgStr);
    if (avg >= 80) return { grade: '1', descriptor: 'High Distinction', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    if (avg >= 70) return { grade: '2', descriptor: 'Distinction', badgeClass: 'bg-teal-100 text-teal-900 border-teal-300' };
    if (avg >= 60) return { grade: '3', descriptor: 'Credit', badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
    if (avg >= 50) return { grade: '4', descriptor: 'Pass', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
    return { grade: '5-9', descriptor: 'Needs Support', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300' };
  };

  const overallGradeInfo = getOverallGrade(overallAverage);

  // Real attendance
  const studentAttendance = attendance.filter(
    a => a.studentId === student.id && (a.term === selectedTerm || !a.term)
  );
  const totalLoggedDays = studentAttendance.length;
  const daysPresent = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const daysAbsent = studentAttendance.filter(a => a.status === 'absent').length;
  const attendanceRate = totalLoggedDays > 0 ? Math.round((daysPresent / totalLoggedDays) * 100) : null;

  // Real class size
  const classStudents = currentClass ? currentClass.studentCount || 1 : 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Terminal Progress Report"
      subtitle={`Official assessment record for ${student.firstName} ${student.lastName} (${student.admissionNumber})`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        
        {/* Top Controls (Hidden during print) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          
          {/* Term Switcher */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
            {(['Term 1', 'Term 2', 'Term 3'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTerm === t
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t} {t === 'Term 3' && '(Promotional)'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>GES Certified Format</span>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* PRINT-OPTIMIZED DOCUMENT BODY */}
        <div 
          ref={printRef}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-900 font-sans print:border-0 print:p-0 print:shadow-none print:m-0"
        >
          
          {/* 1. INSTITUTIONAL HEADER & BRANDING */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              
              {/* School Crest / Logo */}
              <div className="shrink-0">
                {school.logo ? (
                  <img 
                    src={school.logo} 
                    alt={school.name} 
                    className="w-20 h-20 rounded-2xl object-contain border-2 border-slate-200 shadow-xs bg-white p-1" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-teal-900 text-white flex flex-col items-center justify-center font-black shadow-xs">
                    <Building2 className="w-8 h-8 text-teal-300 mb-0.5" />
                    <span className="text-xs tracking-wider">{school.shortCode || 'SCH'}</span>
                  </div>
                )}
              </div>

              {/* School Metadata */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                    {school.name}
                  </h1>
                  {school.registrationNumber && (
                    <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200">
                      REG: {school.registrationNumber}
                    </span>
                  )}
                </div>

                {school.motto && (
                  <p className="text-xs text-slate-600 italic font-serif">
                    "{school.motto}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-slate-600">
                  {school.address && <span>{school.address}</span>}
                  {school.district && <span>• {school.district} District</span>}
                  {school.region && <span>• {school.region} Region, Ghana</span>}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono pt-0.5">
                  {school.phone && <span>Tel: {school.phone}</span>}
                  {school.email && <span>Email: {school.email}</span>}
                  {school.website && <span>Web: {school.website}</span>}
                </div>
              </div>

              {/* GES Accreditation Badge */}
              <div className="hidden md:flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center shrink-0 w-36">
                <GhanaFlagBadge size="sm" />
                <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider mt-1.5">
                  Ghana Education Service
                </span>
                <span className="text-[8.5px] text-slate-500 font-mono">SBA Standards</span>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-teal-900 text-white px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-300" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  Official Continuous Assessment & Terminal Progress Report
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-teal-200">
                {school.currentAcademicYear || '2026/2027'} • {selectedTerm} {selectedTerm === 'Term 3' ? '(Promotional)' : ''}
              </div>
            </div>
          </div>

          {/* 2. STUDENT BIODATA GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Student Full Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {student.firstName} {student.lastName} {student.otherNames || ''}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Student ID / Admission No.</span>
              <span className="font-mono font-bold text-teal-900 text-sm">
                {student.admissionNumber}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Class & Stream</span>
              <span className="font-bold text-slate-900 text-sm">
                {student.classroomName || 'Unassigned'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Class Tutor</span>
              <span className="font-bold text-slate-900">
                {currentClass?.classTeacherName || '—'}
              </span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Term Attendance</span>
              <span className="font-bold text-slate-900">
                {totalLoggedDays > 0 ? (
                  <span>{daysPresent} / {totalLoggedDays} Days ({attendanceRate}%)</span>
                ) : (
                  <span className="text-slate-400 font-normal italic">No attendance logged</span>
                )}
              </span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">House / Team</span>
              <span className="font-bold text-slate-900">
                {student.houseOrTeam || '—'}
              </span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Next Term Resumption</span>
              <span className="font-bold text-teal-900 font-mono">
                {settings.reopeningDate ? formatDate(settings.reopeningDate) : 'Sept 2026'}
              </span>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date of Issue</span>
              <span className="font-mono text-slate-700">
                {formatDate(new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* 3. EXECUTIVE ACADEMIC SUMMARY KPI STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-page-break-avoid">
            
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase block tracking-wider">Subjects Assessed</span>
                <div className="text-lg font-black text-teal-950">
                  {hasResults ? termResults.length : 0} <span className="text-xs font-normal text-teal-700">Courses</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Terminal Average</span>
                <div className="text-lg font-black text-emerald-950">
                  {hasResults ? `${overallAverage}%` : '—'}{' '}
                  {hasResults && (
                    <span className="text-xs font-bold text-emerald-700">(Grade {overallGradeInfo.grade})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Cumulative Total</span>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {hasResults ? totalScoreSum : '—'}{' '}
                  {hasResults && (
                    <span className="text-xs font-normal text-slate-400">/ {maxPossibleMarks}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-teal-900 text-white rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-200 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-200 uppercase block tracking-wider">Assessment Status</span>
                <div className="text-xs font-black uppercase text-white leading-tight">
                  {hasResults ? overallGradeInfo.descriptor : 'Pending Entry'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. ACADEMIC BREAKDOWN TABLE */}
          <div className="space-y-2 print-page-break-avoid">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>Continuous Assessment (SBA 30%) & Terminal Exam (70%) Breakdown</span>
              </h3>
              <span className="text-[10.5px] font-mono text-slate-500">
                GES Assessment Ratio: 30% SBA + 70% Terminal Examination
              </span>
            </div>

            {hasResults ? (
              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-800">Curriculum Subject</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-20">Class (30%)</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-20">Exam (70%)</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-24 bg-slate-800">Total (100%)</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-16">Grade</th>
                      <th className="py-2.5 px-2 text-center border-r border-slate-800 w-16">Pos</th>
                      <th className="py-2.5 px-3">Subject Teacher's Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {termResults.map((item, idx) => {
                      const total = item.totalScore || ((item.classScore || 0) + (item.examScore || 0));
                      let grade = item.grade || '1';
                      if (total >= 80) grade = '1';
                      else if (total >= 70) grade = '2';
                      else if (total >= 60) grade = '3';
                      else if (total >= 50) grade = '4';
                      else grade = '5';

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                            {item.subjectName || (item as any).subject || `Subject ${idx + 1}`}
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-200 text-slate-700">
                            {item.classScore ?? '—'}
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono border-r border-slate-200 text-slate-700">
                            {item.examScore ?? '—'}
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono font-black text-teal-900 bg-teal-50/50 border-r border-slate-200">
                            {total}
                          </td>

                          <td className="py-2.5 px-2 text-center font-bold border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              grade === '1' ? 'bg-emerald-100 text-emerald-900' :
                              grade === '2' ? 'bg-teal-100 text-teal-900' :
                              grade === '3' ? 'bg-cyan-100 text-cyan-900' :
                              grade === '4' ? 'bg-amber-100 text-amber-900' :
                              'bg-rose-100 text-rose-900'
                            }`}>
                              {grade}
                            </span>
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-200">
                            {item.position ? `${item.position}${item.position === 1 ? 'st' : item.position === 2 ? 'nd' : item.position === 3 ? 'rd' : 'th'}` : '—'}
                          </td>

                          <td className="py-2.5 px-3 text-slate-700 text-[11.5px] leading-snug">
                            {item.teacherRemarks || item.gradeRemark || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Table Footer */}
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                      <td className="py-2.5 px-3 uppercase text-[11px] font-black">
                        Cumulative Term Totals
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {totalClassScore}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {totalExamScore}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-teal-950 bg-teal-100/70">
                        {totalScoreSum} / {maxPossibleMarks}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-emerald-800">
                        Grade {overallGradeInfo.grade}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                        —
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-900 text-[11px]">
                        Terminal Average: {overallAverage}% • {overallGradeInfo.descriptor}
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
                  Continuous assessment (SBA) marks and examination scores have not yet been recorded for {student.firstName} for {selectedTerm}. Scores entered by teachers in the Continuous Assessment or Exams module will appear here.
                </p>
              </div>
            )}
          </div>

          {/* 5. GES GRADING SCALE REFERENCE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10.5px] print-page-break-avoid space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[9.5px]">
              Ghana Education Service (GES) Stanine Grading Reference:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Grade 1 (80-100%)</span>
                <span className="text-emerald-700 font-semibold">High Distinction</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Grade 2 (70-79%)</span>
                <span className="text-teal-700 font-semibold">Distinction</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Grade 3 (60-69%)</span>
                <span className="text-cyan-700 font-semibold">Credit</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Grade 4 (50-59%)</span>
                <span className="text-amber-700 font-semibold">Pass</span>
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Grade 5-9 (&lt;50%)</span>
                <span className="text-rose-700 font-semibold">Needs Support</span>
              </div>
            </div>
          </div>

          {/* 6. REMARKS, SIGNATURES & OFFICIAL STAMP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 text-xs print-page-break-avoid">
            
            {/* Class Teacher Section */}
            <div className="space-y-3">
              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-500 block tracking-wider">
                  Class Tutor's Remarks
                </span>
                <div className="text-slate-800 text-xs mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-serif italic">
                  {hasResults ? (
                    parseFloat(overallAverage) >= 70 ? (
                      `"${student.firstName} has demonstrated commendable academic mastery, discipline, and active participation in class activities throughout ${selectedTerm}."`
                    ) : (
                      `"${student.firstName} is encouraged to dedicate more time to study and revision in the upcoming term."`
                    )
                  ) : (
                    <span className="text-slate-400 not-italic">Teacher remarks will appear once terminal assessments are entered.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-end justify-between border-t border-dashed border-slate-300">
                <div>
                  <div className="font-bold text-slate-900">{currentClass?.classTeacherName || 'Class Teacher'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Form Tutor / Class Master</div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  Date: <span className="font-bold text-slate-800">{formatDate(new Date().toISOString())}</span>
                </div>
              </div>
            </div>

            {/* Headteacher Section */}
            <div className="space-y-3">
              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-500 block tracking-wider">
                  Head of Institution's Official Endorsement
                </span>
                <div className="text-slate-800 text-xs mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-serif italic">
                  {hasResults ? (
                    `"Official academic evaluation validated for ${selectedTerm} under the Ghana Education Service SBA standards framework."`
                  ) : (
                    <span className="text-slate-400 not-italic">End of term validation pending examination marks compilation.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-end justify-between border-t border-dashed border-slate-300">
                <div>
                  <div className="font-bold text-slate-900">Head of Institution</div>
                  <div className="text-[10px] text-slate-400 font-mono">Principal / Headteacher</div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3 text-teal-700" />
                    <span>SEALED & AUTHENTICATED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. WATERMARK & VERIFICATION */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
            <div>
              Powered by <b>SchoolOS Ghana</b> • Official Digital Academic Record
            </div>
            <div>
              Ref: <b className="text-slate-600 font-mono">{school.shortCode || 'SCH'}-{student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}-{selectedTerm}</b>
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
