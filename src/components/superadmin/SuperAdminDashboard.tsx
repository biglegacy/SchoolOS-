import React from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  Ban, 
  CreditCard, 
  Layers, 
  Check, 
  X, 
  Eye, 
  Sliders, 
  Radio, 
  MessageSquare, 
  ArrowRight,
  ShieldAlert,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { School, SubscriptionTier, AuditLog } from '../../types';
import { formatGHS, formatDate } from '../../utils/formatting';
import { SuperAdminNavId } from './SuperAdminLayout';

interface SuperAdminDashboardProps {
  schools: School[];
  plans: SubscriptionTier[];
  auditLogs: AuditLog[];
  onNavigate: (nav: SuperAdminNavId) => void;
  onApproveSchool: (school: School) => void;
  onRejectSchool: (school: School) => void;
  onReviewSchool: (school: School) => void;
  onImpersonateSchool: (schoolId: string) => void;
  onOpenSchoolRegistration?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  schools,
  plans,
  auditLogs,
  onNavigate,
  onApproveSchool,
  onRejectSchool,
  onReviewSchool,
  onImpersonateSchool,
  onOpenSchoolRegistration
}) => {
  const pendingSchools = (schools || []).filter(s => s.status === 'pending');
  const activeSchools = (schools || []).filter(s => s.status === 'active');
  const suspendedSchools = (schools || []).filter(s => s.status === 'suspended');

  // Calculate actual revenue based on active schools & their plans
  const totalRevenue = activeSchools.reduce((sum, school) => {
    const plan = plans.find(p => p.id === school.planId || p.code === school.subscriptionPlan);
    return sum + (plan ? plan.priceGHS : 0);
  }, 0);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Subscription distribution calculation
  const planCounts: Record<string, number> = {};
  plans.forEach(p => { planCounts[p.code] = 0; });
  schools.forEach(s => {
    const code = s.subscriptionPlan || 'basic';
    planCounts[code] = (planCounts[code] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Greeting Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, Super Admin
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening across the SchoolOS platform.
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenSchoolRegistration && (
            <button
              onClick={onOpenSchoolRegistration}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register School</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('schools_pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              pendingSchools.length > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Schools {pendingSchools.length > 0 ? `(${pendingSchools.length})` : ''}</span>
          </button>

          <button
            onClick={() => onNavigate('plans')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Plans</span>
          </button>

          <button
            onClick={() => onNavigate('features')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Features</span>
          </button>

          <button
            onClick={() => onNavigate('sms')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <span>SMS Settings</span>
          </button>

          <button
            onClick={() => onNavigate('whatsapp')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>WhatsApp Settings</span>
          </button>
        </div>
      </div>

      {/* 6 Platform KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Schools */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Schools</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schools.length}</div>
          <p className="text-[10px] text-slate-400 truncate">Registered institutions</p>
        </div>

        {/* Pending Approvals */}
        <div className={`border rounded-xl p-4 shadow-2xs space-y-1 ${
          pendingSchools.length > 0
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              pendingSchools.length > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Pending
            </span>
            <Clock className={`w-4 h-4 ${pendingSchools.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black ${pendingSchools.length > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {pendingSchools.length}
          </div>
          <p className={`text-[10px] truncate ${pendingSchools.length > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            {pendingSchools.length > 0 ? 'Action required' : 'Awaiting review'}
          </p>
        </div>

        {/* Active Schools */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeSchools.length}</div>
          <p className="text-[10px] text-slate-400 truncate">Operational accounts</p>
        </div>

        {/* Suspended Schools */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Suspended</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{suspendedSchools.length}</div>
          <p className="text-[10px] text-slate-400 truncate">Restricted access</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subscriptions</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeSchools.length}</div>
          <p className="text-[10px] text-slate-400 truncate">Current term plans</p>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Term Revenue</span>
            <span className="text-xs font-mono font-bold text-teal-700">GH₵</span>
          </div>
          <div className="text-xl font-black text-slate-900 truncate">{formatGHS(totalRevenue)}</div>
          <p className="text-[10px] text-slate-400 truncate">Active billings sum</p>
        </div>

      </div>

      {/* Pending School Approvals Section (Compact & Prominent) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Pending School Approvals</h2>
            {pendingSchools.length > 0 && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-300">
                {pendingSchools.length} New
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate('schools_pending')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingSchools.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />
            <p className="font-medium text-slate-600">No pending school approvals</p>
            <p className="text-[11px] text-slate-400">All registered educational institutions have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">School Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Administrator</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                  <th className="py-2.5 px-3">Selected Plan</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pendingSchools.slice(0, 5).map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{school.name}</td>
                    <td className="py-3 px-3 text-slate-500">{school.district}, {school.region}</td>
                    <td className="py-3 px-3">
                      <div>{school.ownerName || 'School Admin'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{school.ownerPhone || school.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{formatDate(school.createdAt)}</td>
                    <td className="py-3 px-3">
                      <span className="bg-teal-50 text-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-200 uppercase">
                        {school.subscriptionPlan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onReviewSchool(school)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => onApproveSchool(school)}
                          className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectSchool(school)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Columns: Schools Overview & Subscriptions / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Schools Overview Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Schools Overview</h2>
            <button
              onClick={() => onNavigate('schools_all')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Schools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {schools.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-1">
              <Building2 className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No schools registered yet</p>
              <p className="text-[11px] text-slate-400">Schools will appear here once registered through the public portal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">School</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Expires</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {schools.slice(0, 6).map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[10px] text-slate-400">{school.district}, {school.region}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono font-bold uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {school.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          school.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : school.status === 'pending'
                            ? 'bg-amber-50 text-amber-900 border border-amber-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {formatDate(school.subscriptionExpiry)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onReviewSchool(school)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            View
                          </button>
                          {school.status === 'active' && (
                            <button
                              onClick={() => onImpersonateSchool(school.id)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Enter school live dashboard in Super Admin view"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-700" />
                              <span>View Dashboard</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Subscription Distribution & Recent Activity */}
        <div className="space-y-6">
          
          {/* Subscription Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Subscription Overview</h2>
              <button
                onClick={() => onNavigate('plans')}
                className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                Plans
              </button>
            </div>

            {schools.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No subscription data available
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map(plan => {
                  const count = planCounts[plan.code] || 0;
                  const pct = schools.length > 0 ? Math.round((count / schools.length) * 100) : 0;

                  return (
                    <div key={plan.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">{plan.name} ({formatGHS(plan.priceGHS)})</span>
                        <span className="text-slate-500 font-mono text-[11px]">{count} schools ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-700 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Platform Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Recent Platform Activity</h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                All Logs
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent activity
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
