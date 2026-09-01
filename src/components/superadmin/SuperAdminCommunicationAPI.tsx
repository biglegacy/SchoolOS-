import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  MessageSquare, 
  Save, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Send,
  Activity,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  PlatformCommunicationSettings, 
  CommunicationLog 
} from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { testCentralGateway, sanitizeSenderId } from '../../lib/communicationService';

interface SuperAdminCommunicationAPIProps {
  initialSettings: PlatformCommunicationSettings;
  onSaveCommunication: (settings: PlatformCommunicationSettings) => Promise<void>;
}

export const SuperAdminCommunicationAPI: React.FC<SuperAdminCommunicationAPIProps> = ({
  initialSettings,
  onSaveCommunication
}) => {
  const { allSchools, allCommunicationLogs, communicationLogs } = useSchool();

  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp' | 'triggers' | 'logs'>('sms');
  const [settings, setSettings] = useState<PlatformCommunicationSettings>(initialSettings);
  
  // Visibility toggles
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [showWaSecret, setShowWaSecret] = useState(false);

  // Status & notifications
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Test API Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testChannel, setTestChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [testRecipientPhone, setTestRecipientPhone] = useState('0244000000');
  const [testSimulatedSchoolId, setTestSimulatedSchoolId] = useState<string>(allSchools[0]?.id || 'school_demo_01');
  const [testMessage, setTestMessage] = useState('Central Arkesel SMS gateway connection test from SchoolOS Online.');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode: number;
    message: string;
    gatewayResponse?: any;
    testedAt?: string;
  } | null>(null);

  // Selected log for detail view modal
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);

  // Log filters
  const [logSearch, setLogSearch] = useState('');
  const [logSchoolFilter, setLogSchoolFilter] = useState('all');
  const [logChannelFilter, setLogChannelFilter] = useState('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Sync to backend server
      try {
        await fetch('/api/communication/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: settings.sms.provider || 'arkesel',
            apiKey: settings.sms.apiKey,
            apiSecret: settings.sms.apiSecret,
            apiUrl: settings.sms.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send',
            senderId: settings.sms.senderId || 'SCHOOLOS',
            isActive: settings.sms.isActive
          })
        });
      } catch (backendErr) {
        console.warn('Backend sync notice:', backendErr);
      }

      // 2. Persist to Firestore / State
      await onSaveCommunication(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save communication settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const selectedSchool = allSchools.find(s => s.id === testSimulatedSchoolId) || allSchools[0];
    const senderName = sanitizeSenderId(selectedSchool?.name || 'SCHOOLOS', selectedSchool?.shortCode, selectedSchool?.approvedSenderId);
    const gatewayConfig = testChannel === 'sms' ? settings.sms : settings.whatsapp;

    try {
      const response = await testCentralGateway({
        channel: testChannel,
        provider: gatewayConfig.provider || 'arkesel',
        apiKey: gatewayConfig.apiKey,
        apiSecret: gatewayConfig.apiSecret,
        apiUrl: gatewayConfig.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send',
        senderId: senderName,
        phoneNumberId: testChannel === 'whatsapp' ? (gatewayConfig as any).phoneNumberId : undefined,
        businessAccountId: testChannel === 'whatsapp' ? (gatewayConfig as any).businessAccountId : undefined,
        testRecipient: testRecipientPhone,
        testMessage: testMessage,
        simulatedSchoolName: selectedSchool?.name || 'SchoolOS Platform'
      });

      setTestResult({
        success: response.success,
        statusCode: response.statusCode,
        message: response.message,
        gatewayResponse: response.responsePayload,
        testedAt: response.timestamp
      });
      
      // Update the test status in local settings state
      if (testChannel === 'sms') {
        const updatedSms = {
          ...settings.sms,
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: (response.success ? 'success' : 'failed') as 'success' | 'failed',
          lastTestMessage: response.message
        };
        setSettings(prev => ({
          ...prev,
          sms: updatedSms
        }));
      } else {
        const updatedWa = {
          ...settings.whatsapp,
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: (response.success ? 'success' : 'failed') as 'success' | 'failed',
          lastTestMessage: response.message
        };
        setSettings(prev => ({
          ...prev,
          whatsapp: updatedWa
        }));
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        statusCode: 500,
        message: error?.message || 'Gateway connection timeout or network failure.',
        testedAt: new Date().toISOString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered logs
  const logsToDisplay = useMemo(() => {
    const raw = allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs || [];
    return raw.filter(log => {
      if (logSchoolFilter !== 'all' && log.schoolId !== logSchoolFilter) return false;
      const ch = log.type || (log as any).channel;
      if (logChannelFilter !== 'all' && ch !== logChannelFilter) return false;
      if (logCategoryFilter !== 'all' && log.category !== logCategoryFilter) return false;
      if (logStatusFilter !== 'all' && log.status !== logStatusFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        const matchesSchool = (log.schoolName || '').toLowerCase().includes(q);
        const matchesRecipient = (log.recipient || (log as any).recipientPhone || '').toLowerCase().includes(q);
        const matchesName = (log.recipientName || '').toLowerCase().includes(q);
        const matchesContent = (log.message || (log as any).content || '').toLowerCase().includes(q);
        const matchesSender = (log.senderName || log.senderIdentity || (log as any).senderId || '').toLowerCase().includes(q);
        if (!matchesSchool && !matchesRecipient && !matchesName && !matchesContent && !matchesSender) {
          return false;
        }
      }
      return true;
    });
  }, [allCommunicationLogs, communicationLogs, logSchoolFilter, logChannelFilter, logCategoryFilter, logStatusFilter, logSearch]);

  // Statistics
  const totalDispatches = (allCommunicationLogs || []).length;
  const successfulDispatches = (allCommunicationLogs || []).filter(l => l.status === 'delivered' || l.status === 'sent').length;
  const successRate = totalDispatches > 0 ? Math.round((successfulDispatches / totalDispatches) * 100) : 100;

  // Connection status badge calculations
  const smsHasKey = Boolean(settings.sms.apiKey && settings.sms.apiKey.trim());
  const smsTestStatus = settings.sms.lastTestStatus || 'untested';
  const isSmsConnected = smsHasKey && smsTestStatus === 'success';
  const isSmsFailed = smsHasKey && smsTestStatus === 'failed';

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Status Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Central Communications API Settings</h2>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[11px] font-bold">
              Arkesel SMS Gateway Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure platform-wide Arkesel SMS and WhatsApp gateway credentials centrally. All tenant schools inherit these credentials automatically and dispatch SMS using their approved school sender identity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => {
              setTestChannel(activeTab === 'whatsapp' ? 'whatsapp' : 'sms');
              setTestResult(null);
              setIsTestModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Test SMS Gateway</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Gateway Configs'}</span>
          </button>
        </div>
      </div>

      {/* Alert when SMS Gateway is Not Configured */}
      {!smsHasKey && (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-300 rounded-2xl text-xs font-semibold flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950 text-sm">Arkesel SMS Gateway Not Configured</p>
            <p className="text-amber-800">
              The central Arkesel API key has not been entered. Please enter your Arkesel API key below and click <b>Save Gateway Configs</b>. Once saved, all student attendance alerts, fee receipts, terminal exam results, and SMS broadcasts across all schools will route through your central Arkesel account.
            </p>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Central Communication API credentials and automated triggers persisted securely.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">SMS Gateway</span>
            <Radio className="w-4 h-4 text-teal-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900">Arkesel SMS</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isSmsConnected ? 'bg-emerald-100 text-emerald-800' :
              isSmsFailed ? 'bg-rose-100 text-rose-800' :
              smsHasKey ? 'bg-sky-100 text-sky-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {isSmsConnected ? 'CONNECTED' : isSmsFailed ? 'FAILED' : smsHasKey ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {smsHasKey ? `Key: ${settings.sms.apiKey.slice(0, 4)}••••••••` : 'No API key configured'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">WhatsApp Gateway</span>
            <MessageSquare className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 capitalize">{settings.whatsapp.provider}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${settings.whatsapp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
              {settings.whatsapp.isActive ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Phone ID: {settings.whatsapp.phoneNumberId || 'Not Configured'}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Platform SMS Dispatches</span>
            <Activity className="w-4 h-4 text-sky-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{totalDispatches}</span>
            <span className="text-[11px] text-slate-500">messages</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {allSchools.length} tenant schools</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delivery Health</span>
            <ShieldCheck className="w-4 h-4 text-teal-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">{successRate}%</span>
            <span className="text-[11px] font-semibold text-slate-500">Delivery Rate</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Arkesel REST API v2
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sms'
              ? 'bg-teal-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Arkesel SMS Gateway API</span>
          <span className={`w-2 h-2 rounded-full ${settings.sms.isActive && smsHasKey ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-teal-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Business API</span>
          <span className={`w-2 h-2 rounded-full ${settings.whatsapp.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'triggers'
              ? 'bg-teal-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Automated Triggers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-teal-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Central Communication Logs</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px]">
            {logsToDisplay.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Arkesel SMS Gateway API Settings */}
      {activeTab === 'sms' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Arkesel SMS Gateway Configuration</h3>
                <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Arkesel REST API v2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized SMS infrastructure for all schools. API credentials are stored securely and never exposed to client browsers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700">SMS Gateway Status:</span>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">SMS Provider</label>
              <select
                value={settings.sms.provider}
                onChange={(e) => {
                  const p = e.target.value as any;
                  let defaultUrl = 'https://sms.arkesel.com/api/v2/sms/send';
                  if (p === 'mnotify') defaultUrl = 'https://api.mnotify.com/api/sms/quick';
                  if (p === 'twilio') defaultUrl = 'https://api.twilio.com/2010-04-01/Accounts';

                  setSettings({
                    ...settings,
                    sms: { 
                      ...settings.sms, 
                      provider: p,
                      apiUrl: defaultUrl
                    }
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="arkesel">Arkesel SMS Gateway (Ghana & West Africa - Recommended)</option>
                <option value="mnotify">mNotify Communications</option>
                <option value="twilio">Twilio Global SMS Service</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Default Platform Sender ID (Fallback)
              </label>
              <input
                type="text"
                maxLength={11}
                value={settings.sms.senderId}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, senderId: e.target.value.toUpperCase() }
                })}
                placeholder="e.g. SCHOOLOS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="text-[10px] text-slate-400">
                Max 11 alphanumeric characters. Note: Each school automatically uses its own approved Sender ID.
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Arkesel API Key <span className="text-rose-600">* (Required)</span>
                </label>
                <span className="text-[10px] text-teal-700 font-medium">Header: api-key</span>
              </div>
              <div className="relative">
                <input
                  type={showSmsKey ? 'text' : 'password'}
                  value={settings.sms.apiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    sms: { ...settings.sms, apiKey: e.target.value }
                  })}
                  placeholder="Enter Central Arkesel API Key"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSmsKey(!showSmsKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSmsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  API Secret / Secret Key <span className="text-slate-400 font-normal">(Optional for Arkesel)</span>
                </label>
                <span className="text-[10px] text-slate-400">Not required for Arkesel v2</span>
              </div>
              <div className="relative">
                <input
                  type={showSmsSecret ? 'text' : 'password'}
                  value={settings.sms.apiSecret || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    sms: { ...settings.sms, apiSecret: e.target.value }
                  })}
                  placeholder="Optional secret key"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
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

            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-bold text-slate-800">Arkesel SMS Endpoint URL</label>
              <input
                type="url"
                value={settings.sms.apiUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, apiUrl: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="text-[10px] text-slate-400">
                Default: https://sms.arkesel.com/api/v2/sms/send
              </span>
            </div>
          </div>

          {/* Security & Multi-Tenant Info */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950 space-y-1">
              <p className="font-bold">Centralized Multi-Tenant Architecture</p>
              <p className="text-teal-900 leading-relaxed">
                All schools utilize this central Arkesel account. The system dynamically validates the tenant's <code className="font-mono bg-teal-100 px-1 py-0.2 rounded">schoolId</code> and binds the school's approved Sender ID and registered school name to every outbound SMS. School administrators cannot view or alter the platform API key.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {settings.sms.lastTestedAt ? (
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${settings.sms.lastTestStatus === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  Last tested: {new Date(settings.sms.lastTestedAt).toLocaleString()} ({settings.sms.lastTestStatus?.toUpperCase()})
                </span>
              ) : (
                <span>Gateway connection not yet tested</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('sms');
                  setTestResult(null);
                  setIsTestModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Test SMS Gateway</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save SMS Gateway Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WhatsApp Business API Settings */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Business API Gateway</h3>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Cloud API v20.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deliver terminal report cards, exam summaries, and PDF receipts via official WhatsApp Business API.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700">WhatsApp Gateway Status:</span>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">WhatsApp API Provider</label>
              <select
                value={settings.whatsapp.provider}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, provider: e.target.value as any }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="meta">Meta Cloud API (Official WhatsApp On-Premise/Cloud)</option>
                <option value="twilio">Twilio WhatsApp Messaging Service</option>
                <option value="infobip">Infobip WhatsApp Business Platform</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Phone Number ID</label>
              <input
                type="text"
                value={settings.whatsapp.phoneNumberId}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, phoneNumberId: e.target.value }
                })}
                placeholder="e.g. 10482910482019"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">WhatsApp Business Account ID (WABA ID)</label>
              <input
                type="text"
                value={settings.whatsapp.businessAccountId}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, businessAccountId: e.target.value }
                })}
                placeholder="e.g. 29384729103948"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Permanent Access Token</label>
              <div className="relative">
                <input
                  type={showWaSecret ? 'text' : 'password'}
                  value={settings.whatsapp.apiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                  })}
                  placeholder="Bearer EAAG..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
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

            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-bold text-slate-800">Graph API URL</label>
              <input
                type="url"
                value={settings.whatsapp.apiUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, apiUrl: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {settings.whatsapp.lastTestedAt ? (
                <span>Last tested: {new Date(settings.whatsapp.lastTestedAt).toLocaleString()} ({settings.whatsapp.lastTestStatus})</span>
              ) : (
                <span>WhatsApp API not yet tested</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('whatsapp');
                  setTestResult(null);
                  setIsTestModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test WhatsApp API</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save WhatsApp API Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Triggers */}
      {activeTab === 'triggers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Platform-Wide Automated SMS & WhatsApp Triggers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control which system events automatically dispatch communications through the central Arkesel gateway.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Fee Payment SMS Receipts</span>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded-full text-[10px] font-bold">Automatic</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sends instant SMS receipt to the payer/guardian immediately upon recording cash, MoMo, or bank fee payments.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedTriggers?.feePaymentReceipts ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedTriggers: {
                    ...(settings.automatedTriggers || {
                      feePaymentReceipts: true,
                      attendanceAbsenceAlerts: true,
                      examResultsPublication: true,
                      generalAnnouncements: true
                    }),
                    feePaymentReceipts: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 shrink-0 mt-1 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Daily Attendance Absence Alerts</span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-bold">Safety</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Alerts guardian via SMS when student is marked absent during class morning roll call.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedTriggers?.attendanceAbsenceAlerts ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedTriggers: {
                    ...(settings.automatedTriggers || {
                      feePaymentReceipts: true,
                      attendanceAbsenceAlerts: true,
                      examResultsPublication: true,
                      generalAnnouncements: true
                    }),
                    attendanceAbsenceAlerts: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 shrink-0 mt-1 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Terminal Exam Results Publication</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold">Academic</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sends summary grades, overall average score, and portal link to guardians when exams are published.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedTriggers?.examResultsPublication ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedTriggers: {
                    ...(settings.automatedTriggers || {
                      feePaymentReceipts: true,
                      attendanceAbsenceAlerts: true,
                      examResultsPublication: true,
                      generalAnnouncements: true
                    }),
                    examResultsPublication: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 shrink-0 mt-1 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">General Platform Announcements</span>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded-full text-[10px] font-bold">Broadcast</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enables Super Admin broadcast dispatches to reach all registered school proprietors via SMS.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedTriggers?.generalAnnouncements ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedTriggers: {
                    ...(settings.automatedTriggers || {
                      feePaymentReceipts: true,
                      attendanceAbsenceAlerts: true,
                      examResultsPublication: true,
                      generalAnnouncements: true
                    }),
                    generalAnnouncements: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded text-teal-700 focus:ring-teal-600 shrink-0 mt-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Trigger Rules'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Central Communication Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Central Communication Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable ledger of all SMS and WhatsApp transmissions across schools.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700">
                {logsToDisplay.length} Records
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search recipient, message content, sender ID..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <select
              value={logSchoolFilter}
              onChange={(e) => setLogSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Schools</option>
              {allSchools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={logCategoryFilter}
              onChange={(e) => setLogCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 capitalize"
            >
              <option value="all">All Categories</option>
              <option value="fee_receipt">Fee Receipt</option>
              <option value="attendance_alert">Attendance Alert</option>
              <option value="exam_results">Exam Results</option>
              <option value="broadcast">Broadcast</option>
              <option value="test">Test Gateway</option>
            </select>

            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">School & Sender ID</th>
                  <th className="py-3 px-3.5">Recipient</th>
                  <th className="py-3 px-3.5">Channel / Provider</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Message Snippet</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Cost (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No communication logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  logsToDisplay.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900">{log.schoolName || 'Platform Core'}</div>
                        <div className="text-[10px] font-mono text-teal-800 font-semibold">{log.senderIdentity || log.senderName || (log as any).senderId}</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-800">
                        <div>{log.recipient || (log as any).recipientPhone}</div>
                        {log.recipientName && (
                          <div className="text-[10px] text-slate-400 font-sans">{log.recipientName}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          {(log.type || (log as any).channel) === 'sms' ? (
                            <Radio className="w-3 h-3 text-teal-700" />
                          ) : (
                            <MessageSquare className="w-3 h-3 text-emerald-700" />
                          )}
                          <span className="font-bold uppercase text-[11px] text-slate-700">{log.type || (log as any).channel}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">{log.provider}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                          {(log.category || 'general').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 max-w-xs truncate text-slate-600 font-sans">
                        {log.message || (log as any).content}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          log.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'sent' ? 'bg-sky-100 text-sky-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'delivered' ? 'bg-emerald-500' :
                            log.status === 'sent' ? 'bg-sky-500' : 'bg-rose-500'
                          }`} />
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800">
                        ₵{(log.costGHS || 0.04).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEST API MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Test Arkesel SMS Gateway</h3>
                  <p className="text-[11px] text-slate-500">Live API request to https://sms.arkesel.com/api/v2/sms/send</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsTestModalOpen(false);
                  setIsTesting(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                title="Cancel and close test modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Channel</label>
                  <select
                    value={testChannel}
                    onChange={(e) => setTestChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="sms">SMS Gateway (Arkesel REST v2)</option>
                    <option value="whatsapp">WhatsApp API ({settings.whatsapp.provider})</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Simulate School Tenant</label>
                  <select
                    value={testSimulatedSchoolId}
                    onChange={(e) => setTestSimulatedSchoolId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {allSchools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.shortCode || 'No Code'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Test Recipient Phone Number</label>
                <input
                  type="tel"
                  value={testRecipientPhone}
                  onChange={(e) => setTestRecipientPhone(e.target.value)}
                  placeholder="e.g. 0244123456 or 233244123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <span className="text-[10px] text-slate-400">
                  Ghanaian mobile numbers (MTN, Telecel, AT) are automatically converted to international 233 format.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Test Message Payload</label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none font-sans"
                />
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      HTTP {testResult.statusCode} {testResult.success ? 'Arkesel Gateway OK' : 'Arkesel Gateway Response'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {testResult.testedAt ? new Date(testResult.testedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium">{testResult.message}</p>
                  {testResult.gatewayResponse && (
                    <pre className="p-2 bg-white/80 rounded-lg text-[10px] font-mono overflow-x-auto border border-slate-200 max-h-32">
                      {JSON.stringify(testResult.gatewayResponse, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsTestModalOpen(false);
                  setIsTesting(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel / Close
              </button>

              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting || !testRecipientPhone || (!settings.sms.apiKey && testChannel === 'sms')}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Transmitting to Arkesel...' : 'Send Live Test SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Communication Audit Record</h3>
                <p className="text-[11px] font-mono text-slate-400">ID: {selectedLog.id}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">School Tenant</span>
                  <div className="font-bold text-slate-900">{selectedLog.schoolName}</div>
                  <div className="text-[10px] font-mono text-slate-500">{selectedLog.schoolId}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dynamic Sender ID</span>
                  <div className="font-mono font-bold text-teal-800">{selectedLog.senderIdentity || selectedLog.senderName || (selectedLog as any).senderId}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Recipient</span>
                  <div className="font-mono font-bold text-slate-900">{selectedLog.recipient || (selectedLog as any).recipientPhone}</div>
                  {selectedLog.recipientName && <div className="text-[10px] text-slate-500">{selectedLog.recipientName}</div>}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Channel / Provider</span>
                  <div className="font-bold uppercase text-slate-900">{selectedLog.type || (selectedLog as any).channel} via {selectedLog.provider}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Full Content Payload</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800">
                  {selectedLog.message || (selectedLog as any).content}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 border border-slate-200 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-700 uppercase text-[11px]">{selectedLog.status}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Cost</span>
                  <span className="font-bold text-slate-900 text-[11px]">GH₵{(selectedLog.costGHS || 0.04).toFixed(2)}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Category</span>
                  <span className="font-bold text-slate-700 capitalize text-[11px]">{(selectedLog.category || 'broadcast').replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
