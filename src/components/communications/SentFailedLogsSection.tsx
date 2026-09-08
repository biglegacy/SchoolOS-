import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { CommunicationLog } from '../../types';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  Send,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { formatDate } from '../../utils/formatting';

interface Props {
  initialStatus?: 'all' | 'submitted' | 'failed';
}

export const SentFailedLogsSection: React.FC<Props> = ({ initialStatus = 'all' }) => {
  const { school, communicationLogs, allCommunicationLogs, sendDirectCommunication } = useSchool();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'failed'>(initialStatus);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const logs = (allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs) || [];

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (school && l.schoolId !== school.id) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesPhone = (l.recipient || '').toLowerCase().includes(q);
        const matchesName = (l.recipientName || '').toLowerCase().includes(q);
        const matchesMsg = (l.message || '').toLowerCase().includes(q);
        if (!matchesPhone && !matchesName && !matchesMsg) return false;
      }
      return true;
    });
  }, [logs, school, statusFilter, categoryFilter, search]);

  const handleRetrySingle = async (log: CommunicationLog) => {
    setRetryingLogId(log.id);
    setActionNotice(null);

    try {
      await sendDirectCommunication({
        type: 'sms',
        recipient: log.recipient,
        recipientName: log.recipientName,
        message: log.message,
        category: log.category,
        relatedRecordId: log.relatedRecordId
      });
      setActionNotice(`Retried transmission for ${log.recipientName} (${log.recipient}) via Arkesel Gateway!`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice(`Retry failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setRetryingLogId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient, phone or text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted / Delivered</option>
            <option value="failed">Failed Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="fee_reminder">Fee Payment Notices</option>
            <option value="attendance_alert">Attendance Absence Alerts</option>
            <option value="exam_results">Exam Terminal Results</option>
            <option value="announcement">Broadcast Announcements</option>
            <option value="emergency">Emergency Alerts</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Showing {filteredLogs.length} Records
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No Communication Records Found</div>
            <p className="text-xs text-slate-400 mt-1">
              Adjust your filters or initiate a broadcast message to see delivery records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto divide-y divide-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Status & Gateway Response</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isSubmitted = log.status === 'submitted' || log.status === 'delivered';
                  const isRetrying = retryingLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{log.recipientName || 'Recipient'}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{log.recipient}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wide">
                          {log.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate text-slate-700 font-sans" title={log.message}>
                          {log.message}
                        </div>
                        {log.senderIdentity && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            From: <span className="font-mono font-bold text-slate-600">{log.senderIdentity}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isSubmitted 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isSubmitted ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                            <span className="uppercase">{log.status}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs" title={log.providerResponse}>
                          {log.providerResponse || 'Arkesel Gateway'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="font-mono text-[11px]">{formatDate(log.timestamp)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isSubmitted ? (
                          <button
                            type="button"
                            disabled={isRetrying}
                            onClick={() => handleRetrySingle(log)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>Retry</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.costGHS ? `GH₵ ${log.costGHS.toFixed(2)}` : 'Logged'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
