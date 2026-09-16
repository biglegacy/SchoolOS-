import React from 'react';
import { Student, Classroom, ExaminationResult } from '../../../types';
import { FileText, Printer, Award, CalendarCheck, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { calculateGhanaGrade } from '../../../utils/calculations';

interface ParentReportsTabProps {
  child: Student;
  childClass?: Classroom;
  results: ExaminationResult[];
  academicAverage: string | null;
  attendanceRate: number | null;
  daysPresent: number;
  totalAttendanceLogged: number;
  currentTerm: string;
  academicYear: string;
  onViewReport: () => void;
}

export const ParentReportsTab: React.FC<ParentReportsTabProps> = ({
  child,
  childClass,
  results,
  academicAverage,
  attendanceRate,
  daysPresent,
  totalAttendanceLogged,
  currentTerm,
  academicYear,
  onViewReport
}) => {
  const numericAvg = academicAverage ? parseFloat(academicAverage) : 0;
  const gradeInfo = academicAverage ? calculateGhanaGrade(numericAvg) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText className="w-5 h-5 text-slate-700" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Terminal Report</h2>
              <p className="text-xs text-slate-500">
                Official terminal assessment and character appraisal for {child.firstName} {child.lastName}.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewReport}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>View &amp; Print Terminal Report</span>
        </button>
      </div>

      {/* Main Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-700 shrink-0">
              {child.photoUrl ? (
                <img src={child.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                `${child.firstName?.[0] || ''}${child.lastName?.[0] || ''}`
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{child.firstName} {child.lastName} {child.otherNames || ''}</h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Admission No: <strong className="text-slate-700">{child.admissionNumber || child.id}</strong>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Class: <span className="font-semibold text-slate-800">{childClass?.name || child.classroomName}</span> ({child.level})
              </div>
            </div>
          </div>

          <div className="text-right sm:text-right text-xs space-y-1">
            <div className="font-bold text-slate-900">{currentTerm} Assessment</div>
            <div className="font-mono text-slate-500">Academic Year: {academicYear}</div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Certified Official</span>
            </span>
          </div>
        </div>

        {/* Highlight Score & Attendance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500">Terminal Average</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {academicAverage ? `${academicAverage}%` : '—'}
            </div>
            <span className="text-xs text-slate-500">Across {results.length} subjects</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500">Overall Grade</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {gradeInfo ? gradeInfo.grade : '—'}
            </div>
            <span className="text-xs text-slate-500">{gradeInfo?.remark || 'Pending'}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500">Term Attendance</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {daysPresent} / {totalAttendanceLogged}
            </div>
            <span className="text-xs text-slate-500">{attendanceRate !== null ? `${attendanceRate}% rate` : 'Recorded'}</span>
          </div>
        </div>

        {/* Subjects list snapshot */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Assessed Subjects Breakdown
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4 text-center">Class SBA (30%)</th>
                  <th className="py-2.5 px-4 text-center">Exam (70%)</th>
                  <th className="py-2.5 px-4 text-center">Total (100%)</th>
                  <th className="py-2.5 px-4 text-center">Grade</th>
                  <th className="py-2.5 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No subject grades entered yet for this term.
                    </td>
                  </tr>
                ) : (
                  results.map((r, idx) => {
                    const total = r.totalScore || ((r.classScore || 0) + (r.examScore || 0));
                    const gr = calculateGhanaGrade(total);
                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.subjectName || (r as any).subject}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-700">{r.classScore ?? 0}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-700">{r.examScore ?? 0}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{total}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] border border-slate-200">
                            {gr.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 italic">{r.teacherRemarks || gr.remark}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer print prompt */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            For official school stamps, headteacher signature, and core competencies appraisal, open the complete report card.
          </span>
          <button
            type="button"
            onClick={onViewReport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Open Complete Report Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
