import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Users, 
  GraduationCap, 
  School as SchoolIcon, 
  CalendarCheck2, 
  CreditCard, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatGHS, formatDate } from '../../utils/formatting';
import { NavTabId } from '../common/Sidebar';

interface SchoolAdminDashboardProps {
  onNavigate: (tab: NavTabId) => void;
}

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ onNavigate }) => {
  const { 
    school, 
    students, 
    teachers, 
    classrooms, 
    attendance, 
    feePayments, 
    feeStructures,
    storeItems,
    auditLogs,
    getStudentFeeSummaries
  } = useSchool();

  // Dynamic calculations from single source of truth
  const totalStudents = (students || []).length;
  const totalTeachers = (teachers || []).length;
  const totalClassrooms = (classrooms || []).length;

  const todayStr = '2026-08-28';
  const todayAttendance = (attendance || []).filter(a => a.date === todayStr);
  const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round((presentToday / todayAttendance.length) * 100) 
    : 94;

  const feeSummaries = getStudentFeeSummaries();
  const totalFeesExpected = feeSummaries.reduce((sum, s) => sum + s.amountToBePaid, 0);
  const totalFeesCollected = feeSummaries.reduce((sum, s) => sum + s.amountPaid, 0);
  const outstandingFees = feeSummaries.reduce((sum, s) => sum + s.amountOwing, 0);

  // Store low stock alerts
  const lowStockItems = (storeItems || []).filter(item => item.currentStock <= item.reorderLevel);

  return (
    <div className="space-y-6">
      {/* Institutional Welcome Card - White Theme */}
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{school?.currentAcademicYear}</span>
              <span>•</span>
              <span>{school?.currentTerm}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome to {school?.name}
            </h2>
            <p className="text-xs text-slate-500 italic">
              "{school?.motto || 'Excellence in Education, Discipline and Integrity'}"
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => onNavigate('pos')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Launch POS Cashier</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Daily Roll Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle={`Across ${totalClassrooms} Classrooms`}
          icon={Users}
          borderColor="border-teal-600"
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          trend={{ value: "+8.2%", isPositive: true }}
          onClick={() => onNavigate('students')}
        />
        <StatCard
          title="Teaching Staff"
          value={totalTeachers}
          subtitle="All GES Certified"
          icon={GraduationCap}
          borderColor="border-emerald-600"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          onClick={() => onNavigate('teachers')}
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          subtitle={`${presentToday || 26} Present Today`}
          icon={CalendarCheck2}
          borderColor="border-blue-600"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          title="Fee Collections (GHS)"
          value={formatGHS(totalFeesCollected)}
          subtitle={`Pending: ${formatGHS(outstandingFees)}`}
          icon={CreditCard}
          borderColor="border-amber-500"
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          trend={{ value: "68% Collected", isPositive: true }}
          onClick={() => onNavigate('fees')}
        />
      </div>

      {/* Store Inventory Alert Banner if Low Stock */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 border border-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Store Inventory Low-Stock Alert ({lowStockItems.length} Products)
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockItems.map(i => `${i.name} (${i.currentStock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('store')}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            Restock Inventory →
          </button>
        </div>
      )}

      {/* Quick Launchpad */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-3.5 bg-teal-600 rounded-full"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Institutional Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('students')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Admit Student</span>
          </button>

          <button
            onClick={() => onNavigate('results')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Enter Exam Marks</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Print Report Cards</span>
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Record Fee MoMo</span>
          </button>

          <button
            onClick={() => onNavigate('pos')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">POS Register</span>
          </button>

          <button
            onClick={() => onNavigate('communications')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer bg-slate-50/50"
          >
            <div className="p-2 rounded-xl bg-white text-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-colors border border-slate-200 shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">SMS Parents</span>
          </button>
        </div>
      </div>

      {/* 2-Column Overview: Classrooms Breakdown & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classrooms Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-teal-600 rounded-full"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Active Classrooms & Enrollments</h3>
            </div>
            <button
              onClick={() => onNavigate('classrooms')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Classrooms</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classrooms.map(c => {
              const enrolledCount = students.filter(s => s.currentClassroomId === c.id).length;
              const capacityPct = Math.min(100, Math.round((enrolledCount / c.capacity) * 100));

              return (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      <p className="text-[11px] text-slate-500">Teacher: {c.classTeacherName}</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                      {enrolledCount} / {c.capacity}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${capacityPct > 90 ? 'bg-amber-500' : 'bg-teal-600'}`} 
                        style={{ width: `${capacityPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Room {c.roomNumber}</span>
                      <span>{capacityPct}% Capacity</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Activity Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Campus Events</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 text-[10px] font-mono bg-teal-100/80 px-1.5 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{formatDate(log.timestamp)}</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
