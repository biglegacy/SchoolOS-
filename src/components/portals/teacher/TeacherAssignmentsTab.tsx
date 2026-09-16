import React from 'react';
import { TeacherSubjectAssignment, Classroom, Student } from '../../../types';
import { BookOpen, Users, FileSpreadsheet, ArrowRight, Layers } from 'lucide-react';

interface TeacherAssignmentsTabProps {
  assignments: TeacherSubjectAssignment[];
  distinctClassrooms: Classroom[];
  students: Student[];
  onGoToMarks: (subject: string, classId: string) => void;
}

export const TeacherAssignmentsTab: React.FC<TeacherAssignmentsTabProps> = ({
  assignments,
  distinctClassrooms,
  students,
  onGoToMarks
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <span>My Teaching Load &amp; Subject Assignments</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of allocated curriculum subjects, assigned classes, and pupil headcounts.
          </p>
        </div>
        <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          {assignments.length} Course Allocations
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No subject teaching assignments allocated yet.
          </div>
        ) : (
          assignments.map((asgn, idx) => {
            const matchingClass = distinctClassrooms.find(c => c.id === asgn.classroomId);
            const classStudentsCount = students.filter(s => s.currentClassroomId === asgn.classroomId).length;

            return (
              <div
                key={asgn.id || idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Standard Subject
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {matchingClass?.level || 'Grade'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {asgn.subjectName}
                  </h3>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Classroom:</span>
                      <span className="font-bold text-slate-800">{asgn.classroomName || matchingClass?.name || 'Assigned Class'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Enrolled Pupils:</span>
                      <span className="font-mono font-bold text-slate-800">{classStudentsCount} Pupils</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onGoToMarks(asgn.subjectName, asgn.classroomId)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Enter Marks for this Class</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
