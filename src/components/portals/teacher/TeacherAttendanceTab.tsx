import React, { useState, useEffect } from 'react';
import { Student, Classroom } from '../../../types';
import { 
  CalendarCheck, 
  Save, 
  CheckCircle2, 
  Users, 
  Calendar, 
  HelpCircle,
  Sparkles,
  Search,
  Check,
  FileText
} from 'lucide-react';

interface TeacherAttendanceTabProps {
  students: Student[];
  classrooms: Classroom[];
  selectedClassroomId: string;
  onSelectClassroomId: (id: string) => void;
  currentTerm: string;
  academicYear: string;
  onSaveAttendance: (attendanceMap: { [studentId: string]: { present: number; total: number; remarks?: string } }) => Promise<void>;
  onViewReport: (student: Student) => void;
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  students,
  classrooms,
  selectedClassroomId,
  onSelectClassroomId,
  currentTerm,
  academicYear,
  onSaveAttendance,
  onViewReport
}) => {
  const [termTotalDays, setTermTotalDays] = useState<number>(65);
  const [attendanceState, setAttendanceState] = useState<{
    [studentId: string]: { present: number; total: number; remarks: string }
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Filter students by selected classroom
  const classStudents = students.filter(s => s.currentClassroomId === selectedClassroomId);

  // Initialize or update attendance state from students
  useEffect(() => {
    const initial: { [studentId: string]: { present: number; total: number; remarks: string } } = {};
    let detectedTotal = 65;

    classStudents.forEach(st => {
      const stTotal = st.attendanceTotal ?? 65;
      const stPresent = st.attendancePresent ?? (stTotal > 0 ? stTotal - 2 : 60);
      if (st.attendanceTotal && st.attendanceTotal > 0) {
        detectedTotal = st.attendanceTotal;
      }
      initial[st.id] = {
        present: Math.max(0, Math.min(stTotal, stPresent)),
        total: stTotal,
        remarks: st.attendanceRemarks || (stPresent >= stTotal * 0.9 ? 'Regular & Punctual' : 'Satisfactory attendance')
      };
    });

    setTermTotalDays(detectedTotal);
    setAttendanceState(initial);
  }, [selectedClassroomId, classStudents.length]);

  const handlePresentChange = (studentId: string, val: number) => {
    const studentTotal = attendanceState[studentId]?.total ?? termTotalDays;
    const bounded = Math.max(0, Math.min(studentTotal, val));
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { total: studentTotal, remarks: '' }),
        present: bounded
      }
    }));
  };

  const handleTotalChange = (studentId: string, val: number) => {
    const boundedTotal = Math.max(1, Math.min(150, val));
    setAttendanceState(prev => {
      const currentPresent = prev[studentId]?.present ?? boundedTotal;
      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || { remarks: '' }),
          total: boundedTotal,
          present: Math.min(currentPresent, boundedTotal)
        }
      };
    });
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { present: 0, total: termTotalDays }),
        remarks: val
      }
    }));
  };

  const applyGlobalTotalDays = () => {
    if (termTotalDays < 1) return;
    setAttendanceState(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const curPresent = updated[st.id]?.present ?? (termTotalDays - 2);
        updated[st.id] = {
          ...(updated[st.id] || { remarks: 'Regular & Punctual' }),
          total: termTotalDays,
          present: Math.min(curPresent, termTotalDays)
        };
      });
      return updated;
    });
  };

  const markAllFullAttendance = () => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      classStudents.forEach(st => {
        const total = updated[st.id]?.total || termTotalDays;
        updated[st.id] = {
          total,
          present: total,
          remarks: 'Perfect attendance'
        };
      });
      return updated;
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSavedSuccess(null);
    try {
      await onSaveAttendance(attendanceState);
      setSavedSuccess(`Saved attendance records for ${classStudents.length} students in ${currentTerm}. These appear on terminal reports.`);
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      console.error("Failed to save attendance:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = classStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.otherNames || ''}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    return fullName.includes(q) || adm.includes(q);
  });

  const selectedClass = classrooms.find(c => c.id === selectedClassroomId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Guidance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <CalendarCheck className="w-5 h-5 text-slate-700" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Term Attendance Records</h2>
              <p className="text-xs text-slate-500">
                Input total school days and days attended for each pupil. Recorded attendance displays directly on official Terminal Reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Classroom Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Class:</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => onSelectClassroomId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          {/* Academic Term Info */}
          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTerm} • {academicYear}</span>
          </div>
        </div>
      </div>

      {/* Global Quick-Set Controls */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">Global Term School Days:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={150}
              value={termTotalDays}
              onChange={(e) => setTermTotalDays(parseInt(e.target.value) || 0)}
              className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-slate-800"
            />
            <button
              type="button"
              onClick={applyGlobalTotalDays}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Apply to All Students
            </button>
          </div>
          <button
            type="button"
            onClick={markAllFullAttendance}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Mark 100% Present
          </button>
        </div>

        {/* Search inside class */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pupils..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-800"
          />
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {selectedClass?.name || 'Class'} Roster ({filteredStudents.length} students)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || filteredStudents.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Attendance Records'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 w-32 text-center">Days Present</th>
                <th className="py-3 px-4 w-32 text-center">Total Term Days</th>
                <th className="py-3 px-4 w-28 text-center">Rate</th>
                <th className="py-3 px-4">Attendance Remarks</th>
                <th className="py-3 px-4 w-28 text-center">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found for this class.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const att = attendanceState[st.id] || { present: 0, total: termTotalDays, remarks: '' };
                  const rate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
                  const isHigh = rate >= 90;
                  const isMed = rate >= 75 && rate < 90;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                            {st.photoUrl ? (
                              <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              `${st.firstName?.[0] || ''}${st.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{st.firstName} {st.lastName} {st.otherNames || ''}</div>
                            <div className="text-[10px] font-mono text-slate-500">{st.admissionNumber || st.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Days Present */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={att.total}
                          value={att.present}
                          onChange={(e) => handlePresentChange(st.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
                      </td>

                      {/* Total Term Days */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={1}
                          max={150}
                          value={att.total}
                          onChange={(e) => handleTotalChange(st.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
                      </td>

                      {/* Rate badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                          isHigh ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isMed ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {rate}%
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={att.remarks}
                          onChange={(e) => handleRemarkChange(st.id, e.target.value)}
                          placeholder="e.g. Regular and punctual"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewReport(st)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total {filteredStudents.length} pupil records loaded.
            </span>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Attendance'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
