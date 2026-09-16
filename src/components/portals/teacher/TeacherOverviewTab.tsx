import React from 'react';
import { Teacher, Classroom, Student, TeacherSubjectAssignment, TimetableSlot } from '../../../types';
import { 
  BookOpen, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  CalendarCheck, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface TeacherOverviewTabProps {
  teacher?: Teacher;
  assignments: TeacherSubjectAssignment[];
  distinctSubjects: string[];
  distinctClassrooms: Classroom[];
  myStudents: Student[];
  currentTerm: string;
  academicYear: string;
  pendingAssessmentsCount: number;
  onNavigateTab: (tabId: 'assignments' | 'results' | 'attendance' | 'reports' | 'students' | 'timetable' | 'notices') => void;
  onViewReport: (student: Student) => void;
}

export const TeacherOverviewTab: React.FC<TeacherOverviewTabProps> = ({
  teacher,
  assignments,
  distinctSubjects,
  distinctClassrooms,
  myStudents,
  currentTerm,
  academicYear,
  pendingAssessmentsCount,
  onNavigateTab,
  onViewReport
}) => {
  // Today's day name
  const dayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' as any
  ];
  const todayIndex = new Date().getDay();
  const currentDayName = (todayIndex >= 1 && todayIndex <= 5) ? dayNames[todayIndex] : 'Monday';

  const todaySlots = (teacher?.timetable || []).filter(s => s.day === currentDayName);

  return (
    <div className="space-y-6">
      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subjects */}
        <div 
          onClick={() => onNavigateTab('assignments')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">My Subjects</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{distinctSubjects.length}</div>
            <p className="text-xs text-slate-500 truncate mt-1">
              {distinctSubjects.length > 0 ? distinctSubjects.join(', ') : 'None assigned'}
            </p>
          </div>
        </div>

        {/* Classes */}
        <div 
          onClick={() => onNavigateTab('assignments')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Classes Taught</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{distinctClassrooms.length}</div>
            <p className="text-xs text-slate-500 truncate mt-1">
              {distinctClassrooms.map(c => c.name).join(', ') || 'No active classes'}
            </p>
          </div>
        </div>

        {/* Pupils */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Total Pupils</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">{myStudents.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              Enrolled in your classes
            </p>
          </div>
        </div>

        {/* Continuous Assessment Progress */}
        <div 
          onClick={() => onNavigateTab('results')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">SBA & Marks</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900">
              {pendingAssessmentsCount > 0 ? (
                <span className="text-amber-700">{pendingAssessmentsCount}</span>
              ) : (
                <span className="text-emerald-700">100%</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {pendingAssessmentsCount > 0 ? 'Pupils pending marks entry' : 'All term scores captured'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Split: Left Today's Schedule & Quick Actions, Right Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Teacher Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Enter SBA Marks</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Term Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Terminal Reports</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Pupils Roster</span>
              </button>
            </div>
          </div>

          {/* Assigned Classes & Subject Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>My Teaching Assignments ({assignments.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignments.slice(0, 6).map((asgn, idx) => {
                const matchingClass = distinctClassrooms.find(c => c.id === asgn.classroomId);
                const count = myStudents.filter(s => s.currentClassroomId === asgn.classroomId).length;
                return (
                  <div 
                    key={asgn.id || idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{asgn.subjectName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {asgn.classroomName || matchingClass?.name || 'Classroom'} • {count} pupils
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('results')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      Marks
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Student Terminal Reports Ready */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Pupil Reports Spotlight</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>All reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {myStudents.slice(0, 5).map(st => (
                <div key={st.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 font-bold text-slate-700 text-[10px] flex items-center justify-center shrink-0">
                      {st.firstName?.[0]}{st.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{st.firstName} {st.lastName}</div>
                      <div className="text-[10px] text-slate-500">{st.classroomName} • {st.admissionNumber || st.id}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewReport(st)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>View Report</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Schedule & Term Notes */}
        <div className="space-y-6">
          
          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Today's Classes ({currentDayName})</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {todaySlots.length} Periods
              </span>
            </div>

            {todaySlots.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No active timetable periods scheduled for today.
              </div>
            ) : (
              <div className="space-y-2">
                {todaySlots.map((slot, idx) => (
                  <div 
                    key={slot.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{slot.subjectName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {slot.classroomName} {slot.room ? `• ${slot.room}` : ''}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer text-center block"
            >
              Full Weekly Timetable
            </button>
          </div>

          {/* Academic Calendar Reminder */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold">Academic Session</h3>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Term:</span>
                <span className="font-bold text-slate-900">{currentTerm}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Academic Year:</span>
                <span className="font-bold text-slate-900">{academicYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Continuous Assessment:</span>
                <span className="font-bold text-slate-900">30% SBA / 70% Exam</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ensure continuous assessment scores and term attendance records are locked before final report printing.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
