import React from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  Layers,
  Award,
  Globe2
} from 'lucide-react';
import { School, SubscriptionTier, AuditLog } from '../../types';
import { formatGHS, formatDate } from '../../utils/formatting';

interface SuperAdminPlatformReportsProps {
  schools: School[];
  plans: SubscriptionTier[];
  auditLogs: AuditLog[];
}

export const SuperAdminPlatformReports: React.FC<SuperAdminPlatformReportsProps> = ({
  schools,
  plans,
  auditLogs
}) => {
  const activeSchools = (schools || []).filter(s => s.status === 'active');
  const pendingSchools = (schools || []).filter(s => s.status === 'pending');
  const suspendedSchools = (schools || []).filter(s => s.status === 'suspended');

  // Revenue
  const termRevenue = activeSchools.reduce((sum, school) => {
    const plan = plans.find(p => p.id === school.planId || p.code === (school.subscriptionPlan || 'basic').toLowerCase());
    return sum + (plan ? plan.priceGHS : 0);
  }, 0);

  // Region breakdown
  const regionCounts: Record<string, number> = {};
  schools.forEach(s => {
    const r = s.region || 'Greater Accra';
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Platform Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro-level institutional analytics, regional adoption rates, and subscription economics.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reporting Period</span>
          <span className="text-xs font-bold text-teal-800 font-mono">Academic Year 2026 / Term 3</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gross Term ARR</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatGHS(termRevenue)}</div>
          <p className="text-[10px] text-slate-400">Recurring term billing revenue</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Institutions</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeSchools.length}</div>
          <p className="text-[10px] text-slate-400">Operating across Ghana</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Platform Health</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">99.98%</div>
          <p className="text-[10px] text-slate-400">Cloud Run container uptime</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Audit Actions</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{auditLogs.length}</div>
          <p className="text-[10px] text-slate-400">Recorded platform events</p>
        </div>
      </div>

      {/* Two Columns: Regional Distribution & Subscription Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Regional Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-teal-700" />
              <span>Regional School Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{schools.length} Total</span>
          </div>

          {Object.keys(regionCounts).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No regional data recorded
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(regionCounts).map(([region, count]) => {
                const pct = Math.round((count / Math.max(1, schools.length)) * 100);
                return (
                  <div key={region} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{region}</span>
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

        {/* Subscription Plan Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Tier Revenue Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{plans.length} Tiers</span>
          </div>

          <div className="space-y-3">
            {plans.map(plan => {
              const count = activeSchools.filter(s => (s.subscriptionPlan || '').toLowerCase() === plan.code.toLowerCase() || s.planId === plan.id).length;
              const subRev = count * plan.priceGHS;

              return (
                <div key={plan.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{plan.name} Tier</div>
                    <div className="text-[11px] text-slate-500">{count} Active Schools • {formatGHS(plan.priceGHS)} / term</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-teal-800">{formatGHS(subRev)}</div>
                    <div className="text-[10px] text-slate-400">Total Term Rev</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
