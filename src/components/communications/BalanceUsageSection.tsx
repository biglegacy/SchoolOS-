import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { CreditCard, TrendingUp, AlertCircle, ArrowUpRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const BalanceUsageSection: React.FC = () => {
  const { school, settings, communicationLogs, allCommunicationLogs, plans } = useSchool();

  const logs = (allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs) || [];
  const schoolLogs = logs.filter(l => !school || l.schoolId === school.id);

  const balance = settings?.smsBalance ?? 0;
  const totalDispatched = schoolLogs.length;
  const submittedCount = schoolLogs.filter(l => l.status === 'submitted' || l.status === 'delivered').length;
  const failedCount = schoolLogs.filter(l => l.status === 'failed').length;

  const totalCostGHS = schoolLogs.reduce((acc, l) => acc + (l.costGHS || 0.04), 0);

  // Category breakdown
  const categoryCounts = schoolLogs.reduce((acc, l) => {
    const cat = l.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activePlan = plans.find(p => p.id === school?.planId || p.tierCode === school?.planId) || plans[0];

  return (
    <div className="space-y-6">
      {/* Balance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200">Available SMS Balance</span>
            <span className="p-2 bg-white/10 rounded-xl">
              <CreditCard className="w-5 h-5 text-teal-100" />
            </span>
          </div>
          <div className="text-3xl font-black">{balance} <span className="text-base font-normal text-teal-200">Credits</span></div>
          <div className="text-xs text-teal-100 flex items-center gap-1.5 pt-2 border-t border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Dedicated Arkesel Gateway Route • Plan: <b>{activePlan?.name || 'Standard'}</b></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Messages Submitted</span>
          <div className="text-2xl font-black text-slate-900">{submittedCount}</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Gateway Accepted
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Estimated SMS Cost</span>
          <div className="text-2xl font-black text-slate-900">
            GH₵ {totalCostGHS.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500">
            Avg GH₵ 0.040 per SMS
          </span>
        </div>
      </div>

      {/* Top-up Options & Rate Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Credit Top-Up Bundles (MTN MoMo / Telecel Cash)</span>
          </h4>
          <p className="text-xs text-slate-500">
            Recharge your school's SMS account instantly via mobile money or bank transfer. Credits never expire.
          </p>

          <div className="space-y-2.5">
            {[
              { credits: 1000, priceGHS: 45, popular: false },
              { credits: 2500, priceGHS: 100, popular: true },
              { credits: 5000, priceGHS: 190, popular: false },
              { credits: 10000, priceGHS: 360, popular: false }
            ].map(bundle => (
              <div 
                key={bundle.credits}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  bundle.popular ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{bundle.credits.toLocaleString()} SMS Credits</span>
                    {bundle.popular && (
                      <span className="px-2 py-0.2 bg-teal-600 text-white rounded-full text-[9px] font-black uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">Instant Arkesel automated delivery</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">GH₵ {bundle.priceGHS}</div>
                  <span className="text-[10px] text-teal-700 font-bold">GH₵ {(bundle.priceGHS / bundle.credits).toFixed(3)}/SMS</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <a 
              href="mailto:support@schoolos.online?subject=SMS%20Credit%20Top-up" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
            >
              <span>Contact SchoolOS Accounts Desk for Custom Bulk Packages</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Usage Distribution By Communication Channel</span>
          </h4>

          <div className="space-y-3">
            {[
              { label: 'Fee Defaulters & Payment Notices', key: 'fee_reminder', count: (categoryCounts['fee_reminder'] || 0) + (categoryCounts['defaulters_broadcast'] || 0), color: 'bg-amber-500' },
              { label: 'Attendance Absence Notices', key: 'attendance_alert', count: categoryCounts['attendance_alert'] || 0, color: 'bg-blue-500' },
              { label: 'Terminal Exam Results', key: 'exam_results', count: categoryCounts['exam_results'] || 0, color: 'bg-purple-500' },
              { label: 'General School Announcements', key: 'announcement', count: categoryCounts['announcement'] || 0, color: 'bg-teal-500' },
              { label: 'Emergency Alerts', key: 'emergency', count: categoryCounts['emergency'] || 0, color: 'bg-rose-500' }
            ].map(cat => {
              const pct = totalDispatched > 0 ? Math.round((cat.count / totalDispatched) * 100) : 0;
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{cat.label}</span>
                    <span className="text-slate-500">{cat.count} messages ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${cat.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
            <div className="font-bold text-slate-800">Carrier Routing SLA</div>
            <p className="text-[11px] leading-relaxed">
              Arkesel routes priority traffic through direct SMPP interconnects with MTN Ghana, Telecel Ghana, and AT. Average carrier submission latency is 400ms - 900ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
