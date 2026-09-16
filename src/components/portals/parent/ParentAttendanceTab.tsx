import React from 'react';
import { Student, AttendanceRecord } from '../../../types';
import { CalendarCheck, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { formatDate } from '../../../utils/formatting';

interface ParentAttendanceTabProps {
  child: Student;
  attendanceRecords: AttendanceRecord[];
  daysPresent: number;
  totalDays: number;
  attendanceRate: number | null;
}

export const ParentAttendanceTab: React.FC<ParentAttendanceTabProps> = ({
  child,
  attendanceRecords,
  daysPresent,
  totalDays,
  attendanceRate
}) => {
  const daysAbsent = Math.max(0, totalDays - daysPresent);
  const teacherRemarks = child.attendanceRemarks;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-slate-700" />
            <span>Attendance &amp; Punctuality Record</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified attendance statistics and term roll-call records for {child.firstName} {child.lastName}.
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          {attendanceRate !== null ? `${attendanceRate}% Attendance Rate` : 'Tracked Term'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Days Present</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {daysPresent} Days
          </div>
          <p className="text-xs text-slate-500">Out of {totalDays} total school days</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Days Absent / Off</span>
          <div className="text-2xl font-black text-slate-700 font-mono">
            {daysAbsent} Days
          </div>
          <p className="text-xs text-slate-500">Excused &amp; unexcused absences</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Attendance Rate</span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </div>
          <p className="text-xs text-slate-500">Target benchmark: ≥ 85%</p>
        </div>
      </div>

      {/* Teacher Attendance Remarks */}
      {teacherRemarks && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Form Tutor's Attendance Remark
          </span>
          <p className="text-xs text-slate-800 italic bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            "{teacherRemarks}"
          </p>
        </div>
      )}

      {/* Recent Logged Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Daily Roll-Call Entries ({attendanceRecords.length})
        </h3>

        {attendanceRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
            Term attendance has been entered as aggregate official totals ({daysPresent} out of {totalDays} days) by the Form Tutor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {attendanceRecords.slice(0, 15).map(record => (
              <div key={record.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{formatDate(record.date)}</span>
                  {record.remarks && <span className="text-slate-500 ml-2">({record.remarks})</span>}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase ${
                  record.status === 'present'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : record.status === 'late'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
