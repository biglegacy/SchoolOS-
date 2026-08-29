import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  ArrowUpRightSquare, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Users, 
  Save 
} from 'lucide-react';
import { GhanaFlagBadge } from '../common/EmptyState';

export const PromotionWorkflowView: React.FC = () => {
  const { classrooms, students, executePromotion } = useSchool();
  const [sourceClassroomId, setSourceClassroomId] = useState(classrooms[0]?.id || '');
  const [targetClassroomId, setTargetClassroomId] = useState(classrooms[1]?.id || classrooms[0]?.id || '');
  const [newAcademicYear, setNewAcademicYear] = useState('2027/2028');
  
  const classStudents = students.filter(s => s.currentClassroomId === sourceClassroomId);
  const sourceClass = classrooms.find(c => c.id === sourceClassroomId);
  const targetClass = classrooms.find(c => c.id === targetClassroomId);

  // Status mapping per student: promote | repeat | graduate
  const [decisions, setDecisions] = useState<{ [studentId: string]: 'promote' | 'repeat' | 'graduate' }>({});
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);

  const getDecision = (studentId: string): 'promote' | 'repeat' | 'graduate' => {
    return decisions[studentId] || 'promote';
  };

  const setStudentDecision = (studentId: string, decision: 'promote' | 'repeat' | 'graduate') => {
    setDecisions(prev => ({ ...prev, [studentId]: decision }));
  };

  const handleBulkSet = (decision: 'promote' | 'repeat' | 'graduate') => {
    const updated: typeof decisions = {};
    classStudents.forEach(st => {
      updated[st.id] = decision;
    });
    setDecisions(updated);
  };

  const handleCommitPromotion = async () => {
    if (!targetClass && Object.values(decisions).some(d => d === 'promote')) {
      alert('Please select a valid destination classroom for promoted pupils.');
      return;
    }

    if (window.confirm(`Are you ready to commit promotional rollover for ${classStudents.length} students into ${newAcademicYear}? This will update active classroom rosters and archive academic history.`)) {
      setIsCommitting(true);
      const studentActions = classStudents.map(st => ({
        studentId: st.id,
        action: getDecision(st.id),
      }));

      await executePromotion({
        sourceClassroomId,
        targetClassroomId,
        academicYear: newAcademicYear,
        students: studentActions,
      });

      setIsCommitting(false);
      setCommitSuccess(`Successfully promoted ${classStudents.length} students to ${targetClass?.name || 'next grade'} for Academic Year ${newAcademicYear}!`);
      setTimeout(() => setCommitSuccess(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Academic Year Promotion Workflow</h2>
          <p className="text-xs text-gray-500">End-of-year rollover: promote, retain, or graduate students into new academic levels</p>
        </div>

        <div className="flex items-center gap-2">
          {commitSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> {commitSuccess}
            </span>
          )}
          <button
            onClick={handleCommitPromotion}
            disabled={isCommitting || classStudents.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <ArrowUpRightSquare className="w-4 h-4" />
            <span>{isCommitting ? 'Processing Rollover...' : 'Execute Promotion Rollover'}</span>
          </button>
        </div>
      </div>

      {/* Classroom Selection Flow Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Source Class (Current Year)</label>
            <select
              value={sourceClassroomId}
              onChange={e => {
                setSourceClassroomId(e.target.value);
                setDecisions({});
              }}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center pt-2">
            <span className="text-[10px] font-bold uppercase text-gray-400 mb-1">New Academic Session</span>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
              <span>{newAcademicYear}</span>
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Destination Class (Next Level)</label>
            <select
              value={targetClassroomId}
              onChange={e => setTargetClassroomId(e.target.value)}
              className="w-full text-xs font-bold border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Control */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Quick Bulk Select:</span>
            <button
              type="button"
              onClick={() => handleBulkSet('promote')}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md font-bold text-xs"
            >
              Promote All ({classStudents.length})
            </button>
            <button
              type="button"
              onClick={() => handleBulkSet('repeat')}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-xs"
            >
              Retain / Repeat All
            </button>
            <button
              type="button"
              onClick={() => handleBulkSet('graduate')}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold text-xs"
            >
              Graduate All
            </button>
          </div>

          <div className="text-[11px] text-gray-500 font-medium">
            Reviewing <b>{classStudents.length}</b> enrolled pupils from <b>{sourceClass?.name}</b>
          </div>
        </div>
      </div>

      {/* Promotion Roster Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Student Decision Roster • {sourceClass?.name} → {targetClass?.name}
          </h3>
          <span className="text-xs text-gray-500 font-medium">Auto-Archiving Previous Grade</span>
        </div>

        <div className="divide-y divide-gray-100">
          {classStudents.map((student, idx) => {
            const currentDecision = getDecision(student.id);

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
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {student.admissionNumber} • Current: {student.classroomName}
                    </div>
                  </div>
                </div>

                {/* Individual Action Switcher */}
                <div className="flex items-center gap-2 pl-9 sm:pl-0">
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setStudentDecision(student.id, 'promote')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        currentDecision === 'promote' 
                          ? 'bg-teal-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowUpRightSquare className="w-3.5 h-3.5" />
                      <span>Promote to {targetClass?.name || 'Next Grade'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentDecision(student.id, 'repeat')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        currentDecision === 'repeat' 
                          ? 'bg-amber-500 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Repeat {sourceClass?.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentDecision(student.id, 'graduate')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        currentDecision === 'graduate' 
                          ? 'bg-purple-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Graduate Alumni</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
