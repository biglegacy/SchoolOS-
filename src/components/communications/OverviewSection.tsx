import React, { useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Send, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  UserCheck
} from 'lucide-react';
import { formatDate } from '../../utils/formatting';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const OverviewSection: React.FC<Props> = ({ onNavigateTab }) => {
  const { 
    school, 
    settings, 
    students, 
    communicationLogs, 
    allCommunicationLogs,
    getFeeDefaultersList
  } = useSchool();

  const logs = (allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs) || [];
  const schoolLogs = logs.filter(l => !school || l.schoolId === school.id);

  const defaulters = useMemo(() => {
    return getFeeDefaultersList();
  }, [getFeeDefaultersList]);

  const totalOwing = useMemo(() => {
    return defaulters.reduce((acc, d) => acc + d.amountOwing, 0);
  }, [defaulters]);

  const submittedLogs = schoolLogs.filter(l => l.status === 'submitted' || l.status === 'delivered');
  const failedLogs = schoolLogs.filter(l => l.status === 'failed');

  const recentLogs = schoolLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Top Gateway Status Card */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold">Arkesel SMS Gateway Infrastructure Connected</h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PROD LIVE
              </span>
            </div>
            <p className="text-xs text-teal-100/80 max-w-2xl">
              Sender Identity: <b className="font-mono text-white">{settings.smsSenderId || school?.shortCode || 'SCHOOLOS'}</b> • Direct telco routes active for MTN, Telecel, and AT Ghana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('defaulters')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Broadcast to Defaulters ({defaulters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('composer')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Defaulters */}
        <div 
          onClick={() => onNavigateTab('defaulters')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Fee Defaulters</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{defaulters.length}</div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">
            GH₵ {totalOwing.toLocaleString('en-GH', { minimumFractionDigits: 2 })} Total Due
          </div>
        </div>

        {/* Metric 2: Available SMS Balance */}
        <div 
          onClick={() => onNavigateTab('balance')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-teal-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>SMS Balance</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{settings.smsBalance || 0}</div>
          <div className="text-[11px] text-teal-700 font-bold mt-1">
            Credits Available
          </div>
        </div>

        {/* Metric 3: Submitted */}
        <div 
          onClick={() => onNavigateTab('sent')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Delivered / Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{submittedLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Gateway Accepted
          </div>
        </div>

        {/* Metric 4: Failed */}
        <div 
          onClick={() => onNavigateTab('failed')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-rose-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Failed Deliveries</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{failedLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {failedLogs.length > 0 ? 'Retry Available' : 'Clean Delivery Rate'}
          </div>
        </div>

      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onNavigateTab('defaulters')}
          className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-teal-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 w-fit">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
            <span>Targeted Defaulters Broadcast</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Filter by class, select individual defaulters, and send personalized fee reminders with live debt figures.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('emergency')}
          className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-rose-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-700 w-fit">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 flex items-center justify-between">
            <span>Emergency Priority Broadcast</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instant urgent alerts to all parents and staff for school closures, weather alerts, or safety notices.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700 w-fit">
            <UserCheck className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
            <span>Daily Attendance Absence SMS</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automatically review today's roll call and notify parents when a student is marked absent without prior notice.
          </p>
        </div>

      </div>

      {/* Recent Dispatches Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Recent SMS Transmissions
          </h4>
          <button
            type="button"
            onClick={() => onNavigateTab('sent')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No SMS messages have been dispatched yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map(log => {
              const isSubmitted = log.status === 'submitted' || log.status === 'delivered';
              return (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {log.recipientName || 'Guardian'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {log.recipient}
                      </span>
                      <span className="px-2 py-0.2 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {log.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5 font-sans">
                      {log.message}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
