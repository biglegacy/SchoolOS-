import React, { useState, useMemo, useEffect } from 'react';
import { Student, Classroom, TeacherSubjectAssignment, ExaminationResult } from '../../../types';
import { 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  HelpCircle,
  Award,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { calculateTotalScore, calculateGhanaGrade } from '../../../utils/calculations';

interface TeacherMarksTabProps {
  assignments: TeacherSubjectAssignment[];
  distinctSubjects: string[];
  distinctClassrooms: Classroom[];
  students: Student[];
  allResults: ExaminationResult[];
  sbaMax: number;
  examMax: number;
  currentTerm: 'Term 1' | 'Term 2' | 'Term 3';
  academicYear: string;
  onSaveMarks: (
    subject: string,
    classroomId: string,
    term: 'Term 1' | 'Term 2' | 'Term 3',
    marks: { [studentId: string]: { classScore: number; examScore: number; remarks?: string } }
  ) => Promise<void>;
}

export const TeacherMarksTab: React.FC<TeacherMarksTabProps> = ({
  assignments,
  distinctSubjects,
  distinctClassrooms,
  students,
  allResults,
  sbaMax,
  examMax,
  currentTerm,
  academicYear,
  onSaveMarks
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(distinctSubjects[0] || '');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(currentTerm);
  const [marksState, setMarksState] = useState<{ [studentId: string]: { classScore: number; examScore: number; remarks?: string } }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalMax = sbaMax + examMax;

  // Filter classrooms matching the selected subject
  const availableClassrooms = useMemo(() => {
    if (!selectedSubject) return distinctClassrooms;
    const matching = assignments.filter(a => a.subjectName.toLowerCase() === selectedSubject.toLowerCase());
    const ids = matching.map(a => a.classroomId);
    const filtered = distinctClassrooms.filter(c => ids.includes(c.id));
    return filtered.length > 0 ? filtered : distinctClassrooms;
  }, [selectedSubject, assignments, distinctClassrooms]);

  // Keep classroom selection synchronized
  useEffect(() => {
    if (availableClassrooms.length > 0) {
      if (!selectedClassroomId || !availableClassrooms.some(c => c.id === selectedClassroomId)) {
        setSelectedClassroomId(availableClassrooms[0].id);
      }
    }
  }, [availableClassrooms, selectedClassroomId]);

  // Students in selected classroom
  const classStudents = useMemo(() => {
    if (!selectedClassroomId) return [];
    return students.filter(s => s.currentClassroomId === selectedClassroomId);
  }, [students, selectedClassroomId]);

  // Initialize marks from existing results
  useEffect(() => {
    const initial: { [studentId: string]: { classScore: number; examScore: number; remarks?: string } } = {};
    classStudents.forEach(st => {
      const existing = allResults.find(
        r => r.studentId === st.id && 
             (r.subjectName?.toLowerCase() === selectedSubject.toLowerCase() || (r as any).subject?.toLowerCase() === selectedSubject.toLowerCase()) &&
             r.term === selectedTerm
      );
      if (existing) {
        initial[st.id] = {
          classScore: existing.classScore || 0,
          examScore: existing.examScore || 0,
          remarks: existing.teacherRemarks || '',
        };
      } else {
        initial[st.id] = { classScore: 0, examScore: 0, remarks: '' };
      }
    });
    setMarksState(initial);
  }, [selectedSubject, selectedClassroomId, selectedTerm, classStudents, allResults]);

  const handleScoreChange = (studentId: string, field: 'classScore' | 'examScore', val: number) => {
    const maxBound = field === 'classScore' ? sbaMax : examMax;
    const boundedVal = Math.max(0, Math.min(maxBound, val));
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { classScore: 0, examScore: 0 }),
        [field]: boundedVal
      }
    }));
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { classScore: 0, examScore: 0 }),
        remarks: val
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedClassroomId) return;
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await onSaveMarks(selectedSubject, selectedClassroomId, selectedTerm, marksState);
      setSuccessMessage(`Marks saved for ${classStudents.length} students in ${selectedSubject} (${selectedTerm}).`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Error saving marks:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Performance calculations
  const scoresArray = useMemo(() => {
    return classStudents.map(st => {
      const record = marksState[st.id] || { classScore: 0, examScore: 0 };
      return (record.classScore || 0) + (record.examScore || 0);
    });
  }, [classStudents, marksState]);

  const classAvg = useMemo(() => {
    if (scoresArray.length === 0) return 0;
    const sum = scoresArray.reduce((acc, c) => acc + c, 0);
    return (sum / scoresArray.length).toFixed(1);
  }, [scoresArray]);

  const highestScore = useMemo(() => {
    return scoresArray.length > 0 ? Math.max(...scoresArray) : 0;
  }, [scoresArray]);

  const lowestScore = useMemo(() => {
    return scoresArray.length > 0 ? Math.min(...scoresArray) : 0;
  }, [scoresArray]);

  const filteredStudents = classStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.otherNames || ''}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    return fullName.includes(q) || adm.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Subject & Classroom Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-700" />
              <span>SBA & Terminal Marks Entry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghana standard continuous assessment ({sbaMax}% SBA + {examMax}% Terminal Exam = 100% Total).
            </p>
          </div>

          {/* Quick Metrics Pill Bar */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Class Average</span>
              <span className="font-mono font-bold text-slate-900">{classAvg}%</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Highest</span>
              <span className="font-mono font-bold text-slate-900">{highestScore}%</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Lowest</span>
              <span className="font-mono font-bold text-slate-900">{lowestScore}%</span>
            </div>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              {distinctSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Classroom:</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              {availableClassrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Spreadsheet Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Students ({filteredStudents.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || filteredStudents.length === 0}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Marks'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 w-28 text-center">Class SBA ({sbaMax}%)</th>
                <th className="py-3 px-4 w-28 text-center">Exam ({examMax}%)</th>
                <th className="py-3 px-4 w-28 text-center">Total (100%)</th>
                <th className="py-3 px-4 w-24 text-center">Grade</th>
                <th className="py-3 px-4">Teacher Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found for this classroom.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const current = marksState[st.id] || { classScore: 0, examScore: 0, remarks: '' };
                  const total = (current.classScore || 0) + (current.examScore || 0);
                  const gradeInfo = calculateGhanaGrade(total);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {st.firstName?.[0]}{st.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{st.firstName} {st.lastName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{st.admissionNumber || st.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Class SBA Score */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={sbaMax}
                          value={current.classScore}
                          onChange={(e) => handleScoreChange(st.id, 'classScore', parseFloat(e.target.value) || 0)}
                          className="w-18 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
                      </td>

                      {/* Terminal Exam Score */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={examMax}
                          value={current.examScore}
                          onChange={(e) => handleScoreChange(st.id, 'examScore', parseFloat(e.target.value) || 0)}
                          className="w-18 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900 text-xs px-2.5 py-1 bg-slate-100 rounded-lg">
                          {total}
                        </span>
                      </td>

                      {/* Grade Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                          {gradeInfo.grade}
                        </span>
                      </td>

                      {/* Remark */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={current.remarks || ''}
                          onChange={(e) => handleRemarkChange(st.id, e.target.value)}
                          placeholder="Remark on performance..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800"
                        />
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
              Showing {filteredStudents.length} students in {selectedSubject}.
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Marks'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
