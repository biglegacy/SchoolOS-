import React, { useState, useEffect } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { AttendanceStatus } from '../../types';
import { 
  CalendarCheck2, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Save, 
  Sparkles,
  Users
} from 'lucide-react';
import { formatDate } from '../../utils/formatting';

export const AttendanceView: React.FC = () => {
  const { classrooms, students, attendance, markAttendanceBulk } = useSchool();
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('2026-08-28');
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: { status: AttendanceStatus; remarks?: string } }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const classStudents = students.filter(s => s.currentClassroomId === selectedClassroomId);

  // Load existing records or default to present
  useEffect(() => {
    const existing = attendance.filter(a => a.classroomId === selectedClassroomId && a.date === selectedDate);
    const newMap: { [studentId: string]: { status: AttendanceStatus; remarks?: string } } = {};

    classStudents.forEach(st => {
      const rec = existing.find(e => e.studentId === st.id);
      if (rec) {
        newMap[st.id] = { status: rec.status, remarks: rec.remarks };
      } else {
        newMap[st.id] = { status: 'present' };
      }
    });

    setAttendanceMap(newMap);
  }, [selectedClassroomId, selectedDate, students, attendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    setSaveSuccess(false);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
    setSaveSuccess(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: typeof attendanceMap = {};
    classStudents.forEach(st => {
      updated[st.id] = { ...attendanceMap[st.id], status };
    });
    setAttendanceMap(updated);
    setSaveSuccess(false);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    const records = classStudents.map(st => ({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      classroomId: selectedClassroomId,
      date: selectedDate,
      academicYear: '2026/2027',
      term: 'Term 3',
      status: attendanceMap[st.id]?.status || 'present',
      remarks: attendanceMap[st.id]?.remarks,
    }));

    await markAttendanceBulk(records);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Stats
  const total = classStudents.length;
  const mapValues = Object.values(attendanceMap) as Array<{ status: AttendanceStatus; remarks?: string }>;
  const presentCount = mapValues.filter(v => v.status === 'present').length;
  const lateCount = mapValues.filter(v => v.status === 'late').length;
  const absentCount = mapValues.filter(v => v.status === 'absent').length;
  const excusedCount = mapValues.filter(v => v.status === 'excused').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Daily Roll Call (Attendance)</h2>
          <p className="text-xs text-gray-500">Record daily classroom presence, late arrivals, and excused absences</p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
            </span>
          )}
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Roll Call'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Class & Date */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Select Classroom</label>
            <select
              value={selectedClassroomId}
              onChange={e => setSelectedClassroomId(e.target.value)}
              className="text-xs font-bold border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Register Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
          <span className="text-[11px] text-gray-400 font-semibold mr-1">Bulk:</span>
          <button
            onClick={() => handleMarkAll('present')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
          >
            ✓ All Present
          </button>
          <button
            onClick={() => handleMarkAll('late')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
          >
            All Late
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs font-bold transition-colors"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400">Total Enrolled</span>
          <div className="text-xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Present</span>
          <div className="text-xl font-bold text-emerald-800">{presentCount}</div>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-center">
          <span className="text-[10px] font-bold uppercase text-amber-700">Late</span>
          <div className="text-xl font-bold text-amber-800">{lateCount}</div>
        </div>
        <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 text-center">
          <span className="text-[10px] font-bold uppercase text-red-700">Absent</span>
          <div className="text-xl font-bold text-red-800">{absentCount}</div>
        </div>
        <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-teal-700">Attendance Rate</span>
          <div className="text-xl font-bold text-teal-900">{attendanceRate}%</div>
        </div>
      </div>

      {/* Attendance Register List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            {activeClassroom?.name} — Roll Call for {formatDate(selectedDate)}
          </h3>
          <span className="text-xs text-gray-500 font-medium">{classStudents.length} Students in Stream</span>
        </div>

        <div className="divide-y divide-gray-100">
          {classStudents.map((student, idx) => {
            const currentStatus = attendanceMap[student.id]?.status || 'present';
            const currentRemarks = attendanceMap[student.id]?.remarks || '';

            return (
              <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-mono font-bold text-gray-400">
                    {idx + 1}
                  </span>
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {student.firstName} {student.lastName} {student.otherNames || ''}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {student.admissionNumber} • {student.gender.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pl-9 sm:pl-0">
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        currentStatus === 'present' 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        currentStatus === 'late' 
                          ? 'bg-amber-500 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        currentStatus === 'absent' 
                          ? 'bg-red-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'excused')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        currentStatus === 'excused' 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Excused
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Remarks (e.g. sick, dentist)..."
                    value={currentRemarks}
                    onChange={e => handleRemarksChange(student.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
