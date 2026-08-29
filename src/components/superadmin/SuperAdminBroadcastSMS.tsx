import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { School, PlatformCommunicationSettings } from '../../types';

interface SuperAdminBroadcastSMSProps {
  schools: School[];
  communicationSettings: PlatformCommunicationSettings;
  onSendBroadcast?: (data: { recipientGroup: string; message: string; senderId: string }) => Promise<void>;
}

export const SuperAdminBroadcastSMS: React.FC<SuperAdminBroadcastSMSProps> = ({
  schools,
  communicationSettings,
  onSendBroadcast
}) => {
  const [targetGroup, setTargetGroup] = useState<'all_schools' | 'active_schools' | 'pending_schools' | 'suspended_schools'>('active_schools');
  const [senderId, setSenderId] = useState(communicationSettings?.sms?.senderId || 'SCHOOLOS');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeSchoolsCount = (schools || []).filter(s => s.status === 'active').length;
  const pendingSchoolsCount = (schools || []).filter(s => s.status === 'pending').length;
  const suspendedSchoolsCount = (schools || []).filter(s => s.status === 'suspended').length;

  const targetCount = 
    targetGroup === 'all_schools' ? schools.length :
    targetGroup === 'active_schools' ? activeSchoolsCount :
    targetGroup === 'pending_schools' ? pendingSchoolsCount : suspendedSchoolsCount;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      if (onSendBroadcast) {
        await onSendBroadcast({
          recipientGroup: targetGroup,
          message: message.trim(),
          senderId: senderId.trim() || 'SCHOOLOS'
        });
      }
      setStatusMessage({
        type: 'success',
        text: `SMS broadcast successfully queued for ${targetCount} institution administrators.`
      });
      setMessage('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch broadcast. Check SMS gateway API configuration.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Super Admin SMS Broadcast Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatch urgent SMS notifications and regulatory bulletins to school proprietors across Ghana.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs font-semibold">
          <Radio className="w-4 h-4 text-teal-700 shrink-0" />
          <span>Gateway: <b>{communicationSettings?.sms?.provider?.toUpperCase() || 'HUBTEL'}</b></span>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Broadcast Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSend} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">Target Recipient Audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'active_schools'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="target_group"
                  className="sr-only"
                  checked={targetGroup === 'active_schools'}
                  onChange={() => setTargetGroup('active_schools')}
                />
                <div className="text-xs font-bold">Active Institutions</div>
                <div className="text-[11px] text-slate-500">{activeSchoolsCount} verified proprietors</div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'all_schools'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="target_group"
                  className="sr-only"
                  checked={targetGroup === 'all_schools'}
                  onChange={() => setTargetGroup('all_schools')}
                />
                <div className="text-xs font-bold">All Registered Schools</div>
                <div className="text-[11px] text-slate-500">{schools.length} total registered accounts</div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'pending_schools'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="target_group"
                  className="sr-only"
                  checked={targetGroup === 'pending_schools'}
                  onChange={() => setTargetGroup('pending_schools')}
                />
                <div className="text-xs font-bold">Pending Approvals</div>
                <div className="text-[11px] text-slate-500">{pendingSchoolsCount} schools awaiting review</div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'suspended_schools'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="target_group"
                  className="sr-only"
                  checked={targetGroup === 'suspended_schools'}
                  onChange={() => setTargetGroup('suspended_schools')}
                />
                <div className="text-xs font-bold">Suspended Accounts</div>
                <div className="text-[11px] text-slate-500">{suspendedSchoolsCount} accounts</div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">Registered SMS Sender ID</label>
            <input
              type="text"
              value={senderId || ''}
              maxLength={11}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              placeholder="e.g. SCHOOLOS"
            />
            <p className="text-[10px] text-slate-400">Must be registered with NCA / Hubtel Ghana (Max 11 Alphanumeric characters).</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">Broadcast SMS Message Body</label>
              <span className="text-[11px] font-mono text-slate-400">
                {(message || '').length} chars ({~~(((message || '').length / 160) + 1)} SMS Page)
              </span>
            </div>
            <textarea
              rows={4}
              required
              value={message || ''}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dear School Administrator, please be informed that scheduled term maintenance..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Transmitting SMS...' : `Dispatch SMS to ${targetCount} Schools`}</span>
            </button>
          </div>
        </form>

        {/* Right 1 Col: Preview & Guidelines */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Live Phone Preview
            </h3>
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                <span>Sender: {senderId || 'SCHOOLOS'}</span>
                <span>Just Now</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-sans min-h-[60px]">
                {message || <span className="italic text-slate-400">Message preview will appear here...</span>}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900">Broadcast Compliance</h3>
            <p className="text-[11px] leading-relaxed">
              SMS broadcasts sent through the Super Admin panel are delivered directly via the platform's Hubtel/NCA gateway connection. All transmissions are recorded in the system audit logs.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
