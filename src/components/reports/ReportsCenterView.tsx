import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Student } from '../../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Printer, 
  Award, 
  CheckCircle2, 
  Download, 
  Layers,
  GraduationCap,
  Building2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { TerminalReportModal } from './TerminalReportModal';

export const ReportsCenterView: React.FC = () => {
  const { students, classrooms, school } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [activeReportStudent, setActiveReportStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName} ${s.otherNames || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || s.currentClassroomId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>GES Standards Continuous Assessment</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Terminal Report Cards Center
            </h2>
            <p className="text-xs text-slate-300">
              Generate, preview, and print official Ghana Education Service (SBA) report cards for {school?.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (filteredStudents.length > 0) {
                  setActiveReportStudent(filteredStudents[0]);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Batch Print Class Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-800"
          >
            <option value="all">All Classrooms ({students.length} Pupils)</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div 
            key={student.id} 
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-400 transition-all hover:shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.firstName} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {student.firstName} {student.lastName} {student.otherNames || ''}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{student.admissionNumber}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Classroom:</span>
                  <span className="font-bold text-slate-800">{student.classroomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session:</span>
                  <span className="font-bold text-teal-800">{school?.currentAcademicYear || '2025/2026'} • {school?.currentTerm || 'Term 3'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment Status:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Graded & Promoted</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveReportStudent(student)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white rounded-xl text-xs font-bold transition-all border border-teal-200 hover:border-teal-700 shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Preview & Print Report Card</span>
            </button>
          </div>
        ))}
      </div>

      {/* Terminal Report Card Modal */}
      {activeReportStudent && (
        <TerminalReportModal
          isOpen={!!activeReportStudent}
          onClose={() => setActiveReportStudent(null)}
          student={activeReportStudent}
        />
      )}
    </div>
  );
};
