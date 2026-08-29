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
  activeTab?: 'sms' | 'whatsapp';
  onSaveCommunication: (settings: PlatformCommunicationSettings) => Promise<void>;
}

export const SuperAdminCommunication: React.FC<SuperAdminCommunicationProps> = ({
  initialSettings,
  activeTab: defaultTab = 'sms',
  onSaveCommunication
}) => {
  const [tab, setTab] = useState<'sms' | 'whatsapp'>(defaultTab);
  const [settings, setSettings] = useState<PlatformCommunicationSettings>(initialSettings);
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [showWaSecret, setShowWaSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveCommunication(settings);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Communication Infrastructure & Gateway</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure platform-level SMS gateways (Hubtel, Arkesel, mNotify) and Meta WhatsApp Business API.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTab('sms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'sms'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-700" />
            <span>SMS Gateway</span>
          </button>

          <button
            onClick={() => setTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'whatsapp'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
            <span>WhatsApp Business API</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Gateway configuration saved successfully to Firebase backend.</span>
        </div>
      )}

      {/* Tab 1: SMS Gateway Configuration */}
      {tab === 'sms' && (
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
                <option value="hubtel">Hubtel Ghana (Recommended for GH)</option>
                <option value="arkesel">Arkesel SMS</option>
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
      )}

      {/* Tab 2: WhatsApp API Configuration */}
      {tab === 'whatsapp' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Business API Gateway</h3>
              <p className="text-xs text-slate-500">Deliver terminal report PDFs and payment receipts via official WhatsApp Business API.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700">API Status:</span>
              <input
                type="checkbox"
                checked={settings.whatsapp.isActive}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, isActive: e.target.checked }
                })}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600"
              />
              <span className={`text-xs font-bold ${settings.whatsapp.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                {settings.whatsapp.isActive ? 'ENABLED' : 'DISABLED'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">WhatsApp Provider</label>
              <select
                value={settings.whatsapp.provider}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, provider: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="meta">Meta Cloud API (Official WhatsApp)</option>
                <option value="twilio">Twilio WhatsApp Sandbox</option>
                <option value="infobip">Infobip Omnichannel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Phone Number ID</label>
              <input
                type="text"
                value={settings.whatsapp.phoneNumberId}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, phoneNumberId: e.target.value }
                })}
                placeholder="e.g. 10482910482019"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Business Account ID (WABA ID)</label>
              <input
                type="text"
                value={settings.whatsapp.businessAccountId}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, businessAccountId: e.target.value }
                })}
                placeholder="e.g. 29384729103948"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Permanent Access Token</label>
              <div className="relative">
                <input
                  type={showWaSecret ? 'text' : 'password'}
                  value={settings.whatsapp.apiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                  })}
                  placeholder="Bearer EAAG..."
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowWaSecret(!showWaSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showWaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block font-bold text-slate-700">Graph API URL</label>
              <input
                type="url"
                value={settings.whatsapp.apiUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, apiUrl: e.target.value }
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
              <span>{isSaving ? 'Saving...' : 'Save WhatsApp API Settings'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
