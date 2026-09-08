import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { AlertOctagon, Send, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { calculateSmsSegments } from '../../lib/smsPolicy';

export const EmergencySection: React.FC = () => {
  const { school, students, teachers, sendSMSBroadcast, settings } = useSchool();

  const [targetAudience, setTargetAudience] = useState<'all_parents' | 'all_staff' | 'all'>('all_parents');
  const [emergencyType, setEmergencyType] = useState('weather');
  const [message, setMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const emergencyTemplates: Record<string, string> = {
    weather: `URGENT NOTICE: Due to severe weather conditions and torrential rains, ${school?.name || 'the school'} will close early today. Kindly arrange for the safe pickup of your ward by 1:00 PM. Stay safe.`,
    health: `HEALTH ALERT: Dear Parents/Staff, please be informed of a temporary health advisory at ${school?.name || 'the school'}. Classes are suspended until further notice as precautionary sanitation is underway.`,
    security: `SECURITY NOTICE: Dear Parents, normal campus entry is temporarily restricted for precautionary measures. School management and security are in full control. Please await further updates from the administration.`,
    closure: `EMERGENCY SCHOOL CLOSURE: Please be advised that ${school?.name || 'the school'} will be closed tomorrow due to an emergency municipal directive. Remote learning tasks will be provided on SchoolOS.`
  };

  const handleSelectType = (type: string) => {
    setEmergencyType(type);
    setMessage(emergencyTemplates[type] || '');
  };

  const recipientCount = targetAudience === 'all_parents' ? students.length : (targetAudience === 'all_staff' ? teachers.length : students.length + teachers.length);
  const segments = calculateSmsSegments(message).segments;
  const creditsNeeded = recipientCount * segments;

  const handleDispatch = async () => {
    setIsConfirming(false);
    setIsDispatching(true);
    setStatusMessage(null);

    try {
      await sendSMSBroadcast(
        targetAudience,
        `EMERGENCY: ${message.trim()}`,
        recipientCount
      );
      setStatusMessage({
        type: 'success',
        text: `Emergency alert successfully submitted to Arkesel SMS Gateway for ${recipientCount} recipients!`
      });
      setMessage('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch emergency broadcast.'
      });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-rose-950">Emergency SMS Broadcast Protocol</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                High Priority
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
              Use this facility strictly for urgent alerts such as severe weather, safety emergencies, or abrupt school closures. Messages sent through this channel carry highest routing priority across Ghanaian telecom networks.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertOctagon className="w-4 h-4 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Audience</label>
            <select
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
            >
              <option value="all_parents">All Guardians / Parents ({students.length} recipients)</option>
              <option value="all_staff">All Teachers & Staff ({teachers.length} recipients)</option>
              <option value="all">Entire School Community ({students.length + teachers.length} recipients)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quick Emergency Scenario</label>
            <select
              value={emergencyType}
              onChange={e => handleSelectType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
            >
              <option value="weather">Torrential Rain / Severe Weather Closure</option>
              <option value="health">Health / Sanitation Advisory</option>
              <option value="security">Campus Access Restriction / Security</option>
              <option value="closure">Emergency School Closure</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">Emergency Message Body *</label>
            <span className="text-[10px] font-mono text-slate-400">
              {message.length} chars • {segments} credit(s)/recipient
            </span>
          </div>
          <textarea
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type emergency alert message..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed font-sans"
          />
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Estimated Cost: <b className="text-slate-900">{creditsNeeded} Credits</b> (Available Balance: <b>{settings.smsBalance || 0} Credits</b>)
          </div>
          <button
            type="button"
            disabled={!message.trim() || isDispatching}
            onClick={() => setIsConfirming(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isDispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Dispatch Emergency SMS Now</span>
          </button>
        </div>
      </div>

      {isConfirming && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-900">Authorize Emergency Broadcast</h4>
                <p className="text-xs text-slate-500">Immediate transmission to {recipientCount} phones</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-mono leading-relaxed">
              {message}
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to broadcast this emergency alert? This cannot be undone once sent.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Send Emergency Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
