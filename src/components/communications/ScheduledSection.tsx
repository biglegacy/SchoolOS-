import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Calendar, Clock, Plus, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatting';

interface ScheduledItem {
  id: string;
  title: string;
  recipientGroup: string;
  recipientCount: number;
  scheduledDate: string;
  scheduledTime: string;
  message: string;
  status: 'pending' | 'dispatched' | 'cancelled';
}

export const ScheduledSection: React.FC = () => {
  const { school, students, teachers, sendSMSBroadcast } = useSchool();

  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([
    {
      id: 'sch-1',
      title: 'End of Term Excursion Reminder',
      recipientGroup: 'all_parents',
      recipientCount: students.length,
      scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      scheduledTime: '08:00',
      message: `Dear Parents, reminder that the school educational excursion to Kakum National Park takes place on Friday. Pupils should arrive by 6:30 AM in sports wear. - ${school?.name || 'SchoolOS'}`,
      status: 'pending'
    },
    {
      id: 'sch-2',
      title: 'Mid-Term Break Reopening Call',
      recipientGroup: 'all_parents',
      recipientCount: students.length,
      scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      scheduledTime: '07:00',
      message: `Dear Parents, classes resume tomorrow after the mid-term break. Please ensure pupils are in full uniform with completed assignments. - ${school?.name || 'SchoolOS'}`,
      status: 'pending'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGroup, setNewGroup] = useState<'all_parents' | 'all_staff'>('all_parents');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newMessage, setNewMessage] = useState('');
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newMessage) return;

    const count = newGroup === 'all_parents' ? students.length : teachers.length;
    const item: ScheduledItem = {
      id: `sch-${Date.now()}`,
      title: newTitle,
      recipientGroup: newGroup,
      recipientCount: count,
      scheduledDate: newDate,
      scheduledTime: newTime,
      message: newMessage,
      status: 'pending'
    };

    setScheduledItems(prev => [item, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewMessage('');
  };

  const handleTriggerNow = async (item: ScheduledItem) => {
    try {
      await sendSMSBroadcast(item.recipientGroup as any, item.message, item.recipientCount);
      setScheduledItems(prev => prev.map(s => s.id === item.id ? { ...s, status: 'dispatched' } : s));
      setDispatchNotice(`Dispatched scheduled message "${item.title}" to ${item.recipientCount} recipients!`);
      setTimeout(() => setDispatchNotice(null), 4000);
    } catch (err: any) {
      setDispatchNotice(`Failed to dispatch: ${err?.message}`);
    }
  };

  const handleDelete = (id: string) => {
    setScheduledItems(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Scheduled Notifications Queue</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Schedule future SMS reminders for PTA meetings, sports days, reopening dates, or examination schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Scheduled Notification</span>
        </button>
      </div>

      {dispatchNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{dispatchNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduledItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.status}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(item.scheduledDate)} at {item.scheduledTime}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans">
                "{item.message}"
              </p>
              <div className="text-[11px] text-slate-500">
                Audience: <b className="text-slate-700">{item.recipientGroup.replace('_', ' ')}</b> ({item.recipientCount} recipients)
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {item.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleTriggerNow(item)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Now</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSchedule} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Schedule New SMS Notification</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title / Internal Reference *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Speech & Prize Giving Day Reminder"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={newGroup}
                  onChange={e => setNewGroup(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all_parents">All Parents</option>
                  <option value="all_staff">All Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Body *</label>
              <textarea
                rows={4}
                required
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type SMS message..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
