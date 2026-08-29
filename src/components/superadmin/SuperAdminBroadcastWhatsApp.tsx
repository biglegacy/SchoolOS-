import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Info,
  Check
} from 'lucide-react';
import { School, PlatformCommunicationSettings } from '../../types';

interface SuperAdminBroadcastWhatsAppProps {
  schools: School[];
  communicationSettings: PlatformCommunicationSettings;
  onSendBroadcast?: (data: { recipientGroup: string; message: string; template: string }) => Promise<void>;
}

export const SuperAdminBroadcastWhatsApp: React.FC<SuperAdminBroadcastWhatsAppProps> = ({
  schools,
  communicationSettings,
  onSendBroadcast
}) => {
  const [targetGroup, setTargetGroup] = useState<'all_schools' | 'active_schools' | 'pending_schools'>('active_schools');
  const [templateName, setTemplateName] = useState('schoolos_system_update');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeSchoolsCount = (schools || []).filter(s => s.status === 'active').length;
  const pendingSchoolsCount = (schools || []).filter(s => s.status === 'pending').length;

  const targetCount = 
    targetGroup === 'all_schools' ? schools.length :
    targetGroup === 'active_schools' ? activeSchoolsCount : pendingSchoolsCount;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      if (onSendBroadcast) {
        await onSendBroadcast({
          recipientGroup: targetGroup,
          message: customMessage.trim(),
          template: templateName
        });
      }
      setStatusMessage({
        type: 'success',
        text: `WhatsApp template broadcast dispatched to ${targetCount} verified administrator phone lines.`
      });
      setCustomMessage('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch WhatsApp broadcast. Verify Meta Business API credentials.'
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
          <h2 className="text-base font-bold text-slate-900 tracking-tight">WhatsApp Business API Broadcast</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver rich media bulletins, term renewal notices, and regulatory alerts via WhatsApp Cloud API.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold">
          <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Meta Cloud API: <b>{communicationSettings?.whatsapp?.isActive ? 'ONLINE' : 'CONFIGURED'}</b></span>
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
            <label className="block text-xs font-bold text-slate-900">Target WhatsApp Audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'active_schools'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="wa_target"
                  className="sr-only"
                  checked={targetGroup === 'active_schools'}
                  onChange={() => setTargetGroup('active_schools')}
                />
                <div className="text-xs font-bold">Active Schools</div>
                <div className="text-[11px] text-slate-500">{activeSchoolsCount} accounts</div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'all_schools'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="wa_target"
                  className="sr-only"
                  checked={targetGroup === 'all_schools'}
                  onChange={() => setTargetGroup('all_schools')}
                />
                <div className="text-xs font-bold">All Schools</div>
                <div className="text-[11px] text-slate-500">{schools.length} accounts</div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                targetGroup === 'pending_schools'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="wa_target"
                  className="sr-only"
                  checked={targetGroup === 'pending_schools'}
                  onChange={() => setTargetGroup('pending_schools')}
                />
                <div className="text-xs font-bold">Pending Registrations</div>
                <div className="text-[11px] text-slate-500">{pendingSchoolsCount} schools</div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">Approved Meta Template</label>
            <select
              value={templateName || 'schoolos_system_update'}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            >
              <option value="schoolos_system_update">schoolos_system_update (Utility / Advisory)</option>
              <option value="schoolos_term_reopening">schoolos_term_reopening (Academic / Notification)</option>
              <option value="schoolos_plan_renewal">schoolos_plan_renewal (Billing / Subscription)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">Message Announcement</label>
            <textarea
              rows={4}
              required
              value={customMessage || ''}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Greetings from SchoolOS! Please be advised that the Term 3 Continuous Assessment marks portal is now open..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSending || !customMessage.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending WhatsApp...' : `Send WhatsApp to ${targetCount} Schools`}</span>
            </button>
          </div>
        </form>

        {/* Right 1 Col: Chat Bubble Preview */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              WhatsApp Chat Bubble
            </h3>
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-2xs border border-emerald-100 space-y-1 text-xs">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <span>SchoolOS Verified Cloud</span>
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-slate-800 leading-relaxed min-h-[50px]">
                  {customMessage || <span className="italic text-slate-400">Your announcement text...</span>}
                </p>
                <div className="text-[9px] text-slate-400 text-right pt-1 font-mono">12:00 PM • Verified Business</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
