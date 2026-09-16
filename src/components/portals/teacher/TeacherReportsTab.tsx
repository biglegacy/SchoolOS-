import React, { useState, useMemo } from 'react';
import { Student, Classroom, ExaminationResult } from '../../../types';
import { 
  FileText, 
  Search, 
  Printer, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  CalendarCheck
} from 'lucide-react';
import { calculateGhanaGrade } from '../../../utils/calculations';

interface TeacherReportsTabProps {
  students: Student[];
  classrooms: Classroom[];
  selectedClassroomId: string;
  onSelectClassroomId: (id: string) => void;
  allResults: ExaminationResult[];
  currentTerm: 'Term 1' | 'Term 2' | 'Term 3';
  academicYear: string;
  onViewReport: (student: Student) => void;
}

export const TeacherReportsTab: React.FC<TeacherReportsTabProps> = ({
  students,
  classrooms,
  selectedClassroomId,
  onSelectClassroomId,
  allResults,
  currentTerm,
  academicYear,
  onViewReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'pending'>('all');

  const classStudents = useMemo(() => {
    return students.filter(s => s.currentClassroomId === selectedClassroomId);
  }, [students, selectedClassroomId]);

  // Calculate stats for each student in the selected term
  const studentReportData = useMemo(() => {
    const list = classStudents.map(st => {
      const stResults = allResults.filter(
        r => r.studentId === st.id && (r.term === currentTerm || !r.term)
      );
      const subjectsCount = stResults.length;
      const totalScoreSum = stResults.reduce((acc, curr) => acc + (curr.totalScore || ((curr.classScore || 0) + (curr.examScore || 0))), 0);
      const avg = subjectsCount > 0 ? (totalScoreSum / subjectsCount) : 0;
      const grade = calculateGhanaGrade(avg);

      // Attendance
      const totalDays = st.attendanceTotal ?? 65;
      const daysPresent = st.attendancePresent ?? (totalDays > 0 ? totalDays - 2 : 60);
      const attRate = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : null;

      const isComplete = subjectsCount >= 4; // baseline complete if at least 4 subjects

      return {
        student: st,
        subjectsCount,
        average: avg.toFixed(1),
        numericAvg: avg,
        grade: grade.grade,
        remark: grade.remark,
        totalDays,
        daysPresent,
        attRate,
        isComplete
      };
    });

    // Compute class ranks
    const sorted = [...list].sort((a, b) => b.numericAvg - a.numericAvg);
    return list.map(item => {
      const rank = item.numericAvg > 0 ? (sorted.findIndex(s => s.student.id === item.student.id) + 1) : null;
      return { ...item, rank };
    });
  }, [classStudents, allResults, currentTerm]);

  const filteredData = studentReportData.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      `${item.student.firstName} ${item.student.lastName}`.toLowerCase().includes(q) ||
      (item.student.admissionNumber || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'complete') return item.isComplete;
    if (filterStatus === 'pending') return !item.isComplete;
    return true;
  });

  const selectedClass = classrooms.find(c => c.id === selectedClassroomId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <span>Class Terminal Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review academic rankings, attendance rates, and print official Terminal Reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
            {currentTerm} • {academicYear}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pupils or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['all', 'complete', 'pending'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                  filterStatus === tab ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-500">
          Showing {filteredData.length} of {studentReportData.length} pupil reports
        </span>
      </div>

      {/* Report Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 w-28 text-center">Subjects</th>
                <th className="py-3 px-4 w-28 text-center">Average</th>
                <th className="py-3 px-4 w-24 text-center">Grade</th>
                <th className="py-3 px-4 w-32 text-center">Attendance</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No student reports found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const { student: st, subjectsCount, average, grade, rank, attRate, daysPresent, totalDays, isComplete } = item;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {rank ? `#${rank}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden text-[11px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {st.photoUrl ? (
                              <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              `${st.firstName?.[0] || ''}${st.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{st.firstName} {st.lastName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{st.admissionNumber || st.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {subjectsCount} graded
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {average}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                          {grade}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="text-[11px] font-mono font-bold text-slate-800">
                          {daysPresent}/{totalDays}
                        </div>
                        {attRate !== null && (
                          <div className="text-[10px] text-slate-500">
                            {attRate}%
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Incomplete</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewReport(st)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs mx-auto"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
