import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  Sparkles, 
  Calendar,
  Building2,
  Users,
  Check,
  Megaphone
} from 'lucide-react';
import { School } from '../../types';
import { formatDate } from '../../utils/formatting';

interface SuperAdminNotificationsProps {
  schools: School[];
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all_schools' | 'school_owners' | 'teachers' | 'parents' | 'students';
  priority: 'low' | 'normal' | 'urgent';
  createdAt: string;
  author: string;
  status: 'sent' | 'scheduled';
}

export const SuperAdminNotifications: React.FC<SuperAdminNotificationsProps> = ({
  schools
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_1',
      title: 'GES 2025/2026 Term 2 Academic Calendar Synchronization',
      message: 'All registered institutions are reminded to finalize SBA continuous assessment marks before the mid-term terminal break.',
      targetAudience: 'all_schools',
      priority: 'normal',
      createdAt: '2026-02-10T10:00:00Z',
      author: 'Super Admin (System)',
      status: 'sent'
    },
    {
      id: 'notif_2',
      title: 'Scheduled Platform Core Security Maintenance',
      message: 'SchoolOS infrastructure upgrade scheduled for Saturday 11:00 PM GMT. Estimated downtime 15 minutes.',
      targetAudience: 'school_owners',
      priority: 'urgent',
      createdAt: '2026-02-01T14:30:00Z',
      author: 'Platform Operations',
      status: 'sent'
    },
    {
      id: 'notif_3',
      title: 'New Student & Parent Mobile Portal Access Guide Available',
      message: 'Updated guide on generating student PINs and parent access credentials for seamless terminal report delivery.',
      targetAudience: 'all_schools',
      priority: 'low',
      createdAt: '2026-01-20T09:15:00Z',
      author: 'Support Team',
      status: 'sent'
    }
  ]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<SystemNotification['targetAudience']>('all_schools');
  const [priority, setPriority] = useState<SystemNotification['priority']>('normal');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      const newNotif: SystemNotification = {
        id: `notif_${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        targetAudience,
        priority,
        createdAt: new Date().toISOString(),
        author: 'Super Admin',
        status: 'sent'
      };

      setNotifications([newNotif, ...notifications]);
      setTitle('');
      setMessage('');
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">System & Platform Notifications</h2>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch broadcast announcements, maintenance alerts, and official circulars across all educational portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
            Active Notice Recipients: <b className="text-teal-800 font-mono">{schools.length} Schools</b>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Broadcast Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Megaphone className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Broadcast Notice</h3>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-teal-600"
              >
                <option value="all_schools">All Registered Schools (Universal)</option>
                <option value="school_owners">School Proprietors & Admins Only</option>
                <option value="teachers">Teacher Portal Users</option>
                <option value="parents">Parent Portal Users</option>
                <option value="students">Student Portal Users</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Urgency / Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 rounded-lg font-bold uppercase text-[10px] border transition-all cursor-pointer ${
                      priority === p 
                        ? p === 'urgent' 
                          ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs' 
                          : p === 'normal'
                          ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                          : 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notification Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., Terminal Examination Schedule"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notice Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Type the message to be displayed on target user dashboards..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {sendSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Notice broadcast dispatched successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Dispatch Notification'}</span>
            </button>
          </form>
        </div>

        {/* Sent Notifications Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Broadcast History ({notifications.length})</h3>
            <span className="text-[11px] text-slate-400">Real-time Platform Feed</span>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 hover:border-teal-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        n.priority === 'urgent'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : n.priority === 'normal'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {n.priority}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                        Audience: {n.targetAudience.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  </div>

                  <span className="text-[10.5px] font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {n.message}
                </p>

                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1">
                  <span>Author: <b>{n.author}</b></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Delivered</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
