import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { calculateTotalScore, getGESGrade, getGradeRemarks, calculatePositions } from '../../utils/calculations';
import { 
  FileSpreadsheet, 
  Save, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { GhanaFlagBadge } from '../common/EmptyState';

export const ResultsAndExamsView: React.FC = () => {
  const { school, updateSchoolInfo, classrooms, students, examResults, recordExamResult } = useSchool();
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState('English Language');
  const [selectedTerm, setSelectedTerm] = useState('Term 3');
  const [examType, setExamType] = useState('End of Term Examination');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic SBA and Exam maximums configured by school owner
  const sbaMax = school?.sbaMaxScore ?? 30;
  const examMax = school?.examMaxScore ?? 70;
  const totalMax = sbaMax + examMax;

  const activeClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const activeSubjects = activeClassroom?.subjects || [
    'English Language',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'Ghanaian Language (Twi)',
    'Computing',
    'Religious and Moral Education (RME)',
    'Creative Arts'
  ];
  const classStudents = students.filter(s => s.currentClassroomId === (selectedClassroomId || activeClassroom?.id));

  // Maintain local score entries
  const [scores, setScores] = useState<{ [studentId: string]: { classScore: number; examScore: number } }>(() => {
    const initial: { [studentId: string]: { classScore: number; examScore: number } } = {};
    classStudents.forEach(st => {
      const existing = examResults.find(
        r => r.studentId === st.id && r.subject === selectedSubject && r.term === selectedTerm
      );
      initial[st.id] = {
        classScore: existing ? existing.classScore : 0,
        examScore: existing ? existing.examScore : 0,
      };
    });
    return initial;
  });

  const handleClassScoreChange = (studentId: string, val: number) => {
    const clamped = Math.max(0, Math.min(sbaMax, Number(val) || 0));
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], classScore: clamped }
    }));
    setSaveSuccess(false);
  };

  const handleExamScoreChange = (studentId: string, val: number) => {
    const clamped = Math.max(0, Math.min(examMax, Number(val) || 0));
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], examScore: clamped }
    }));
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    // Compute totals and ranks
    const studentTotals = classStudents.map(st => {
      const entry = scores[st.id] || { classScore: 0, examScore: 0 };
      const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
      return { studentId: st.id, totalScore: total };
    });

    const positions = calculatePositions(studentTotals);

    for (const st of classStudents) {
      const entry = scores[st.id] || { classScore: 0, examScore: 0 };
      const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
      const grade = getGESGrade(total, totalMax);
      const pos = positions[st.id] || 1;

      await recordExamResult({
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        classroomId: selectedClassroomId,
        classroomName: activeClassroom?.name || 'Classroom',
        subject: selectedSubject,
        academicYear: '2026/2027',
        term: selectedTerm as any,
        examType,
        classScore: entry.classScore,
        examScore: entry.examScore,
        totalScore: total,
        grade,
        position: pos,
        remarks: getGradeRemarks(grade),
      });
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Examinations & Continuous Assessment</h2>
          <p className="text-xs text-gray-500">Official GES 30% Class Score + 70% Exam Score auto-grading and rankings</p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Scores & Positions Saved!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Processing Rankings...' : 'Save Assessment Scores'}</span>
          </button>
        </div>
      </div>

      {/* Control Selection Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Classroom</label>
            <select
              value={selectedClassroomId || activeClassroom?.id || ''}
              onChange={e => setSelectedClassroomId(e.target.value)}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {activeSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Academic Term</label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3 (Promotional)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Exam Type</label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value)}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="End of Term Examination">End of Term Examination</option>
              <option value="Mid-Term Assessment">Mid-Term Assessment</option>
              <option value="Mock BECE Examination">Mock BECE Examination</option>
            </select>
          </div>
        </div>
      </div>

      {/* GES Formula Info Pill */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-teal-900 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <GhanaFlagBadge size="sm" />
          <span className="font-bold">Active Assessment Scoring Model:</span>
          <span>Class SBA (Max {sbaMax}) + Exam (Max {examMax}) = Total ({totalMax} Points)</span>
        </div>
        <span className="text-[10px] bg-teal-200 text-teal-950 font-bold px-2 py-0.5 rounded-full">
          {sbaMax}/{examMax} Model Active
        </span>
      </div>

      {/* Marks Entry Grid Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            {activeClassroom?.name || 'Classroom'} • {selectedSubject} ({selectedTerm})
          </h3>
          <span className="text-xs text-gray-500 font-medium">{classStudents.length} Students Evaluated</span>
        </div>

        {/* Mobile Scores Card List (Hidden on tablet/desktop) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {classStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No students enrolled in this classroom. Admit students to record assessments.
            </div>
          ) : (
            classStudents.map((student) => {
              const entry = scores[student.id] || { classScore: 0, examScore: 0 };
              const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
              const grade = getGESGrade(total, totalMax);
              const remarks = getGradeRemarks(grade);

              return (
                <div key={student.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {student.admissionNumber}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg">
                        {total}/{totalMax}
                      </span>
                      <span className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-xs font-black ${
                        grade === 'A' || grade === 'B+' ? 'bg-emerald-100 text-emerald-800' :
                        grade === 'B' || grade === 'C' ? 'bg-teal-100 text-teal-800' :
                        grade === 'D' ? 'bg-blue-100 text-blue-800' :
                        grade === 'E' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {grade}
                      </span>
                    </div>
                  </div>

                  {/* Score Input Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Class SBA ({sbaMax})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={sbaMax}
                        value={entry.classScore}
                        onChange={e => handleClassScoreChange(student.id, Number(e.target.value))}
                        className="w-full px-3 py-2 text-center font-bold text-gray-900 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Exam Score ({examMax})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={examMax}
                        value={entry.examScore}
                        onChange={e => handleExamScoreChange(student.id, Number(e.target.value))}
                        className="w-full px-3 py-2 text-center font-bold text-gray-900 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 italic">
                    Remarks: <span className="font-semibold text-gray-700 not-italic">{remarks}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-4 py-3">Admission #</th>
                <th className="px-4 py-3 text-center">Class SBA ({sbaMax})</th>
                <th className="px-4 py-3 text-center">Exam ({examMax})</th>
                <th className="px-4 py-3 text-center font-bold text-gray-900">Total ({totalMax})</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-5 py-3 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500 font-medium bg-gray-50/50">
                    No students found in this class. Admit pupils or choose another classroom to enter examination marks.
                  </td>
                </tr>
              ) : (
                classStudents.map((student, idx) => {
                  const entry = scores[student.id] || { classScore: 0, examScore: 0 };
                  const total = calculateTotalScore(entry.classScore, entry.examScore, sbaMax, examMax);
                  const grade = getGESGrade(total, totalMax);
                  const remarks = getGradeRemarks(grade);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900 text-sm">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-gray-400">
                        {student.admissionNumber}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={sbaMax}
                          value={entry.classScore}
                          onChange={e => handleClassScoreChange(student.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-center font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={examMax}
                          value={entry.examScore}
                          onChange={e => handleExamScoreChange(student.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-center font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                          {total}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-full text-xs font-black ${
                          grade === 'A' || grade === 'B+' ? 'bg-emerald-100 text-emerald-800' :
                          grade === 'B' || grade === 'C' ? 'bg-teal-100 text-teal-800' :
                          grade === 'D' ? 'bg-blue-100 text-blue-800' :
                          grade === 'E' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-medium text-gray-700 text-xs">
                        {remarks}
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
