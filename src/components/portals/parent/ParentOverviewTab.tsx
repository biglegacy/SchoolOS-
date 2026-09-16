import React from 'react';
import { Student, Classroom, ExaminationResult, Teacher } from '../../../types';
import { 
  Award, 
  CalendarCheck, 
  CreditCard, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  ArrowUpRight, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatGHS, formatGhanaPhone } from '../../../utils/formatting';
import { calculateGhanaGrade } from '../../../utils/calculations';

interface ParentOverviewTabProps {
  child: Student;
  childClass?: Classroom;
  classTeacher?: Teacher;
  academicAverage: string | null;
  attendanceRate: number | null;
  daysPresent: number;
  totalAttendanceLogged: number;
  outstandingBalance: number;
  totalBilled: number;
  totalPaid: number;
  isFullyPaid: boolean;
  results: ExaminationResult[];
  sbaMax: number;
  examMax: number;
  onNavigateTab: (tabId: 'reports' | 'fees' | 'attendance' | 'teacher' | 'announcements') => void;
  onViewReport: () => void;
}

export const ParentOverviewTab: React.FC<ParentOverviewTabProps> = ({
  child,
  childClass,
  classTeacher,
  academicAverage,
  attendanceRate,
  daysPresent,
  totalAttendanceLogged,
  outstandingBalance,
  totalBilled,
  totalPaid,
  isFullyPaid,
  results,
  sbaMax,
  examMax,
  onNavigateTab,
  onViewReport
}) => {
  const numericAvg = academicAverage ? parseFloat(academicAverage) : 0;
  const gradeInfo = academicAverage ? calculateGhanaGrade(numericAvg) : null;

  return (
    <div className="space-y-6">
      {/* 4 Key Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academic Standing */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Academic Grade</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">
              {gradeInfo ? gradeInfo.grade : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {academicAverage ? `${academicAverage}% Average • ${gradeInfo?.remark}` : 'Results pending release'}
            </p>
          </div>
        </div>

        {/* Term Attendance */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Term Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">
              {attendanceRate !== null ? `${attendanceRate}%` : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {daysPresent} of {totalAttendanceLogged} school days present
            </p>
          </div>
        </div>

        {/* School Fees */}
        <div 
          onClick={() => onNavigateTab('fees')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Fee Balance</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 font-mono truncate">
              {isFullyPaid ? 'Settled' : formatGHS(outstandingBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isFullyPaid ? 'All fees fully settled' : `Billed: ${formatGHS(totalBilled)}`}
            </p>
          </div>
        </div>

        {/* Class Enrollment */}
        <div 
          onClick={() => onNavigateTab('teacher')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Class & Tutor</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-black text-slate-900 truncate">
              {childClass?.name || child.classroomName || 'Class'}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Tutor: {classTeacher ? `${classTeacher.firstName} ${classTeacher.lastName}` : (childClass?.classTeacherName || 'Form Master')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split: Left Academic Subject Performance, Right Report & Teacher Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject Performance Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <span>Subject Performance Snapshot ({results.length} subjects)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Graded scores for the current academic session ({sbaMax}% SBA + {examMax}% Exam).
                </p>
              </div>

              <button
                type="button"
                onClick={onViewReport}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Report Card</span>
              </button>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Examination results are currently being processed by teachers. Check back shortly.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((res, idx) => {
                  const classScore = res.classScore || 0;
                  const examScore = res.examScore || 0;
                  const total = res.totalScore || (classScore + examScore);
                  const grade = calculateGhanaGrade(total);

                  return (
                    <div 
                      key={res.id || idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm">{res.subjectName || (res as any).subject}</span>
                        <div className="text-[11px] text-slate-500">
                          SBA: <strong className="text-slate-700">{classScore}/{sbaMax}</strong> • Exam: <strong className="text-slate-700">{examScore}/{examMax}</strong>
                          {res.teacherRemarks && <span> • <em>"{res.teacherRemarks}"</em></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm">{total}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-white border border-slate-200 text-slate-800 shadow-2xs">
                          {grade.grade}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Terminal Report & Teacher Quick Connect */}
        <div className="space-y-6">
          
          {/* Official Terminal Report Card Feature */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold">Official Terminal Report</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Official school report card formatted for academic review, printing, and digital archival.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Academic Standing:</span>
                <span className="font-bold text-slate-900">{gradeInfo ? `${gradeInfo.grade} (${gradeInfo.remark})` : 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Attendance:</span>
                <span className="font-mono font-bold text-slate-900">{daysPresent}/{totalAttendanceLogged} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Format:</span>
                <span className="font-bold text-slate-700">Official Print Design</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewReport}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>View &amp; Print Report Card</span>
            </button>
          </div>

          {/* Class Teacher Contact Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-700" />
              <span>Class Teacher / Form Tutor</span>
            </h3>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                {classTeacher ? `${classTeacher.firstName?.[0]}${classTeacher.lastName?.[0]}` : 'CT'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-xs truncate">
                  {classTeacher ? `${classTeacher.firstName} ${classTeacher.lastName}` : (childClass?.classTeacherName || 'Class Tutor')}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {classTeacher?.qualification || 'Form Master'} • {childClass?.name}
                </div>
              </div>
            </div>

            {classTeacher?.phone && (
              <div className="pt-2">
                <a
                  href={`sms:${classTeacher.phone}`}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Send SMS to Class Teacher</span>
                </a>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
