import React, { useState } from 'react';
import { 
  Radio, 
  MessageSquare, 
  Key, 
  Save, 
  Check, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Send,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { PlatformCommunicationSettings } from '../../types';

interface SuperAdminCommunicationProps {
  initialSettings: PlatformCommunicationSettings;
  activeTab?: 'sms';
  onSaveCommunication: (settings: PlatformCommunicationSettings) => Promise<void>;
}

export const SuperAdminCommunication: React.FC<SuperAdminCommunicationProps> = ({
  initialSettings,
  onSaveCommunication
}) => {
  const [settings, setSettings] = useState<PlatformCommunicationSettings>(() => {
    const s = { ...initialSettings };
    if (!s.sms?.apiUrl || s.sms.apiUrl.includes('hubtel')) {
      s.sms = {
        ...s.sms,
        apiUrl: 'https://sms.arkesel.com/api/v2/sms/send'
      };
    }
    return s;
  });
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const cleanSettings = {
      ...settings,
      sms: {
        ...settings.sms,
        apiUrl: (!settings.sms.apiUrl || settings.sms.apiUrl.includes('hubtel'))
          ? 'https://sms.arkesel.com/api/v2/sms/send'
          : settings.sms.apiUrl.trim()
      }
    };
    try {
      await fetch('/api/communication/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cleanSettings.sms.apiKey,
          apiSecret: cleanSettings.sms.apiSecret,
          apiUrl: cleanSettings.sms.apiUrl,
          senderId: cleanSettings.sms.senderId,
          isActive: cleanSettings.sms.isActive,
          provider: cleanSettings.sms.provider
        })
      });
    } catch (e) {
      console.warn('Could not sync to backend proxy:', e);
    }
    await onSaveCommunication(cleanSettings);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">SMS Communication Gateway</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure platform-level Arkesel SMS gateway for parent alerts, terminal notifications, and attendance notices.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Radio className="w-3.5 h-3.5 text-teal-700" />
          <span>Arkesel SMS Gateway Active</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Gateway configuration saved successfully to Firebase backend.</span>
        </div>
      )}

      {/* SMS Gateway Configuration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">SMS Gateway Configuration</h3>
              <p className="text-xs text-slate-500">Enable automated SMS alerts for terminal fees, report cards, and announcements.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700">Gateway Status:</span>
              <input
                type="checkbox"
                checked={settings.sms.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, isActive: e.target.checked }
                })}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600"
              />
              <span className={`text-xs font-bold ${settings.sms.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                {settings.sms.isActive ? 'ENABLED' : 'DISABLED'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">SMS Provider</label>
              <select
                value={settings.sms.provider}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, provider: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="arkesel">Arkesel SMS Gateway (Ghana & West Africa)</option>
                <option value="mnotify">mNotify Communications</option>
                <option value="twilio">Twilio Global</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Default Sender ID</label>
              <input
                type="text"
                maxLength={11}
                value={settings.sms.senderId}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, senderId: e.target.value.toUpperCase() }
                })}
                placeholder="e.g. SCHOOLOS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="text-[10px] text-slate-400">Max 11 alphanumeric characters</span>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">API Key / Client ID</label>
              <div className="relative">
                <input
                  type={showSmsSecret ? 'text' : 'password'}
                  value={settings.sms.apiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    sms: { ...settings.sms, apiKey: e.target.value }
                  })}
                  placeholder="Enter API Key"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSmsSecret(!showSmsSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSmsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">API Secret / Auth Token</label>
              <input
                type="password"
                value={settings.sms.apiSecret}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, apiSecret: e.target.value }
                })}
                placeholder="Enter API Secret"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block font-bold text-slate-700">API Endpoint URL</label>
              <input
                type="url"
                value={settings.sms.apiUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, apiUrl: e.target.value }
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save SMS Gateway Settings'}</span>
            </button>
          </div>
        </div>
    </div>
  );
};
