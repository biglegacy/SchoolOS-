import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { SMSBroadcastRecipient } from '../../types';
import { 
  MessageSquare, 
  Send, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  History, 
  Smartphone,
  PhoneCall
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatDate } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

export const CommunicationsView: React.FC = () => {
  const { students, teachers, sendSMSBroadcast, auditLogs, school, settings } = useSchool();
  const [recipientGroup, setRecipientGroup] = useState<SMSBroadcastRecipient>('all_parents');
  const [senderId, setSenderId] = useState(school?.approvedSenderId || school?.shortCode || (school?.name ? school.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 11).toUpperCase() : ''));
  const [messageBody, setMessageBody] = useState('');
  const [smsBalance, setSmsBalance] = useState(settings?.smsBalance ?? 0);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const schoolDisplayName = school?.name || 'the school';

  const templates = [
    {
      title: 'Fee Payment Reminder',
      text: `Dear Parent/Guardian, this is a kind reminder from ${schoolDisplayName} to settle outstanding school fees. Kindly make payments at the bursary or via official school payment channels. Thank you.`,
      target: 'fee_defaulters' as SMSBroadcastRecipient,
    },
    {
      title: 'PTA General Meeting',
      text: `Notice: ${schoolDisplayName} PTA General Meeting is scheduled for Saturday 10:00 AM at the School Assembly Hall. All parents/guardians are cordially invited. Punctuality is key.`,
      target: 'all_parents' as SMSBroadcastRecipient,
    },
    {
      title: 'Mid-Term Break & Reopening',
      text: 'Dear Parents, please be informed that Mid-Term break commences this Friday. Classes resume promptly on Tuesday 7:30 AM. Kindly ensure pupils complete their take-home assignments.',
      target: 'all_parents' as SMSBroadcastRecipient,
    },
    {
      title: 'Staff Academic Board Meeting',
      text: 'Reminder to all teaching staff: End-of-Term Continuous Assessment and marks compilation meeting will hold at 3:00 PM in the Staff Common Room.',
      target: 'all_staff' as SMSBroadcastRecipient,
    }
  ];

  const getRecipientCount = (group: SMSBroadcastRecipient) => {
    switch (group) {
      case 'all_parents': return students.length;
      case 'all_staff': return teachers.length;
      case 'fee_defaulters': return Math.ceil(students.length * 0.4);
      default: return 12;
    }
  };

  const recipientCount = getRecipientCount(recipientGroup);

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setIsSending(true);
    await sendSMSBroadcast(recipientGroup, messageBody, recipientCount);
    setSmsBalance(prev => Math.max(0, prev - recipientCount));
    setIsSending(false);
    setSendSuccess(`SMS broadcast dispatched to ${recipientCount} recipients via Ghana SMS Gateway!`);
    setMessageBody('');
    setTimeout(() => setSendSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Parent SMS & WhatsApp Broadcast Center</h2>
          <p className="text-xs text-gray-500">Direct mobile messaging to Ghanaian guardians and staff via central Arkesel SMS gateway</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>SMS Credits: <b>{smsBalance} SMS</b></span>
          </div>
        </div>
      </div>

      {sendSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sendSuccess}</span>
        </div>
      )}

      {/* 2-Column Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Message Composer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>Compose Direct Broadcast</span>
          </h3>

          <form onSubmit={handleSendSMS} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Registered Sender ID (11 Chars Max)</label>
                <input
                  type="text"
                  maxLength={11}
                  required
                  value={senderId}
                  onChange={e => setSenderId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-bold font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience Group *</label>
                <select
                  value={recipientGroup}
                  onChange={e => setRecipientGroup(e.target.value as SMSBroadcastRecipient)}
                  className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="all_parents">All Parents & Guardians ({students.length} Phone #s)</option>
                  <option value="fee_defaulters">Fee Defaulters Only ({Math.ceil(students.length * 0.4)} Guardians)</option>
                  <option value="all_staff">All Teaching Staff & Faculty ({teachers.length} Staff)</option>
                  <option value="class_parents">Basic 4 Gold Parents Only (14 Phone #s)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">SMS Message Content *</label>
                <span className="text-[11px] text-gray-400">
                  {messageBody.length} chars ({Math.ceil(messageBody.length / 160) || 1} SMS unit/recipient)
                </span>
              </div>
              <textarea
                rows={5}
                required
                placeholder="Type your official announcement here..."
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
              />
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GhanaFlagBadge size="sm" />
                <span>Estimated Cost: <b>{recipientCount} SMS Credits</b> for {recipientCount} phone numbers</span>
              </div>
              <span className="font-bold text-teal-950">Ghana Carrier Routed</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSending || !messageBody.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Transmitting via Gateway...' : `Broadcast to ${recipientCount} Parents`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Quick Templates & History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-gray-900">Pre-Configured Message Templates</h3>
            </div>

            <div className="space-y-2">
              {templates.map((tpl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setMessageBody(tpl.text);
                    setRecipientGroup(tpl.target);
                  }}
                  className="p-3 rounded-xl border border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                    <span>{tpl.title}</span>
                    <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded">Use Template</span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{tpl.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
