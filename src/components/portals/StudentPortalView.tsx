import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  User, 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { formatGHS } from '../../utils/formatting';

export const StudentPortalView: React.FC = () => {
  const { currentUser } = useAuth();
  const { students, classrooms, school } = useSchool();
  const [isReportOpen, setIsReportOpen] = useState(false);

  const me = students[0];
  const myClass = classrooms.find(c => c.id === me?.currentClassroomId);

  if (!me) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-teal-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-800/80 border border-indigo-700 text-indigo-200 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Student Learning Console</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Hello, {me.firstName}!
            </h2>
            <p className="text-xs text-indigo-100">
              Class: <b>{me.classroomName}</b> • Admission No: <b>{me.admissionNumber}</b>
            </p>
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4 text-indigo-700" />
            <span>My Term 3 Report Card</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-gray-400">Term 3 Overall Rank</span>
          <div className="text-2xl font-black text-teal-700">1st Position</div>
          <p className="text-[11px] text-gray-500">Out of 32 pupils in stream</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-gray-400">Overall Average</span>
          <div className="text-2xl font-black text-emerald-700">89.4%</div>
          <p className="text-[11px] text-gray-500">Grade 1 (Excellent)</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs text-center space-y-1">
          <span className="text-[10px] font-bold uppercase text-gray-400">Classroom Tutor</span>
          <div className="text-base font-bold text-gray-900 mt-1">{myClass?.classTeacherName || 'Mr. Osei-Tutu'}</div>
          <p className="text-[11px] text-gray-500">Room 104 • Block C</p>
        </div>
      </div>

      {/* Enrolled Curriculum Subjects */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>My Registered GES Curriculum Subjects</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(myClass?.subjects || ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies']).map((subj, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>{subj}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Grade 1</span>
            </div>
          ))}
        </div>
      </div>

      {isReportOpen && (
        <TerminalReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          student={me}
        />
      )}
    </div>
  );
};
