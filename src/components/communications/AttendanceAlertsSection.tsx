import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { triggerAttendanceAbsenceAlert } from '../../lib/communicationService';
import { UserCheck, CheckCircle2, AlertCircle, RefreshCw, Send, Smartphone } from 'lucide-react';
import { formatDate } from '../../utils/formatting';

export const AttendanceAlertsSection: React.FC = () => {
  const { school, students, classrooms, attendance, platformCommunication } = useSchool();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);
  const [alertStatus, setAlertStatus] = useState<string | null>(null);

  // Find absent students on selected date
  const absentRecords = useMemo(() => {
    return attendance.filter(a => {
      if (a.date !== selectedDate) return false;
      if (a.status !== 'absent') return false;
      if (selectedClassroom !== 'all' && a.classroomId !== selectedClassroom) return false;
      return true;
    });
  }, [attendance, selectedDate, selectedClassroom]);

  const absentStudents = useMemo(() => {
    return absentRecords.map(rec => {
      const student = students.find(s => s.id === rec.studentId);
      const classroom = classrooms.find(c => c.id === rec.classroomId);
      return {
        record: rec,
        student,
        classroomName: classroom?.name || 'Classroom'
      };
    }).filter(item => item.student !== undefined);
  }, [absentRecords, students, classrooms]);

  const handleSendAbsenceAlerts = async () => {
    if (!school || absentStudents.length === 0) return;
    setIsSending(true);
    setAlertStatus(null);

    let sent = 0;
    for (const item of absentStudents) {
      if (!item.student) continue;
      const phone = item.student.guardianPhone || item.student.guardians?.[0]?.phone;
      if (!phone) continue;

      try {
        await triggerAttendanceAbsenceAlert(
          school,
          {
            id: item.student.id,
            firstName: item.student.firstName,
            lastName: item.student.lastName,
            guardianPhone: phone,
            guardianName: item.student.guardianName || 'Guardian',
            classroomName: item.classroomName
          },
          selectedDate,
          platformCommunication
        );
        sent++;
      } catch (e) {
        console.warn('Absence alert err:', e);
      }
    }

    setIsSending(false);
    setAlertStatus(`Successfully dispatched ${sent} absence notification SMS to guardians!`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <UserCheck className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Attendance Absence Alerts</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Review daily attendance sheets and broadcast instant absence notices to guardians when a student is recorded absent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          />

          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">All Classes</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {alertStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{alertStatus}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recorded Absentees ({absentStudents.length}) - {formatDate(selectedDate)}
          </h4>
          {absentStudents.length > 0 && (
            <button
              type="button"
              disabled={isSending}
              onClick={handleSendAbsenceAlerts}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send SMS to All {absentStudents.length} Absent Guardians</span>
            </button>
          )}
        </div>

        {absentStudents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">No Absences Recorded</div>
            <p className="text-xs text-slate-500 mt-1">
              Either all students were present on this date or attendance has not yet been submitted.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {absentStudents.map(({ record, student, classroomName }) => {
              if (!student) return null;
              const phone = student.guardianPhone || student.guardians?.[0]?.phone;
              return (
                <div key={record.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{student.firstName} {student.lastName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{classroomName}</span>
                      <span>•</span>
                      <span>Guardian: {student.guardianName || student.guardians?.[0]?.name || 'Guardian'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {phone ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {phone}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                        Missing Phone
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Absent
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
