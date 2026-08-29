import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  GraduationCap, 
  CalendarCheck2, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Award,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { NavTabId } from '../common/Sidebar';

interface TeacherPortalViewProps {
  onNavigate: (tab: NavTabId) => void;
}

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { classrooms, students, examResults } = useSchool();

  const assignedClass = classrooms[0];
  const myStudents = students.filter(s => s.currentClassroomId === assignedClass?.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Teacher Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-600 text-emerald-200 text-xs font-semibold">
              <span>Faculty Workspace</span>
              <span>•</span>
              <span>GES Licensed Teacher</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Welcome back, {currentUser?.fullName}!
            </h2>
            <p className="text-xs text-emerald-100">
              Assigned Class Teacher: <b>{assignedClass?.name} ({assignedClass?.level})</b>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors"
            >
              Take Today's Roll Call
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Enter Marks (30/70)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Students"
          value={myStudents.length}
          subtitle={`Class: ${assignedClass?.name}`}
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          title="Subjects Taught"
          value={assignedClass?.subjects?.length || 8}
          subtitle="English, Maths, Science, Twi, etc."
          icon={BookOpen}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Terminal Reports"
          value={`${myStudents.length} Ready`}
          subtitle="Term 3 Promotional Records"
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => onNavigate('reports')}
        />
      </div>

      {/* Classroom Quick Access Roster */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Classroom Student Roster ({assignedClass?.name})</h3>
            <p className="text-xs text-gray-500">Continuous Assessment & Progress Tracking</p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <span>Open Attendance Register</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {myStudents.map(student => (
            <div key={student.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.firstName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-xs truncate">{student.firstName} {student.lastName}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{student.admissionNumber}</div>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
