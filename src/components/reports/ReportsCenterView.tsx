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
  GraduationCap
} from 'lucide-react';
import { TerminalReportModal } from './TerminalReportModal';

export const ReportsCenterView: React.FC = () => {
  const { students, classrooms } = useSchool();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">GES Terminal Report Cards Center</h2>
          <p className="text-xs text-gray-500">Official printable term assessments, subject breakdowns, conduct remarks, and promotion records</p>
        </div>

        <button
          onClick={() => {
            if (filteredStudents.length > 0) {
              setActiveReportStudent(filteredStudents[0]);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Batch Print Reports</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student to generate report card..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Classrooms ({students.length})</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List for Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student, idx) => (
          <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.firstName} className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {student.firstName} {student.lastName} {student.otherNames || ''}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">{student.admissionNumber}</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Class:</span>
                  <span className="font-semibold text-gray-800">{student.classroomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Academic Term:</span>
                  <span className="font-semibold text-teal-700">Term 3 (Promotional)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Evaluation:</span>
                  <span className="font-bold text-emerald-600">Complete (100% Calculated)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveReportStudent(student)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white rounded-lg text-xs font-bold transition-colors border border-teal-200 hover:border-teal-600 shadow-2xs"
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
