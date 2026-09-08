import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { SMSBroadcastRecipient } from '../../types';
import { 
  LayoutDashboard,
  MessageSquare, 
  Send, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  History, 
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertOctagon,
  UserCheck,
  Calendar,
  BookOpen,
  Info,
  DollarSign
} from 'lucide-react';
import { calculateSmsSegments, checkSmsFeatureGating, SmsFeatureType } from '../../lib/smsPolicy';
import { normalizeGhanaPhoneNumber } from '../../lib/phoneNormalizer';

// Modular Sections
import { OverviewSection } from './OverviewSection';
import { DefaultersBroadcastSection } from './DefaultersBroadcastSection';
import { EmergencySection } from './EmergencySection';
import { AttendanceAlertsSection } from './AttendanceAlertsSection';
import { BalanceUsageSection } from './BalanceUsageSection';
import { TemplatesSection } from './TemplatesSection';
import { ScheduledSection } from './ScheduledSection';
import { SentFailedLogsSection } from './SentFailedLogsSection';

export type CommunicationTab = 
  | 'overview'
  | 'composer'
  | 'defaulters'
  | 'emergency'
  | 'attendance'
  | 'fee_reminders'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'balance'
  | 'templates'
  | 'live_test';

export const CommunicationsView: React.FC = () => {
  const { 
    students, 
    teachers, 
    sendSMSBroadcast, 
    sendDirectCommunication,
    communicationLogs, 
    allCommunicationLogs,
    school, 
    settings,
    plans,
    getFeeDefaultersList
  } = useSchool();

  const [activeTab, setActiveTab] = useState<CommunicationTab>('overview');

  // Broadcast Composer State
  const [recipientGroup, setRecipientGroup] = useState<SMSBroadcastRecipient>('all_parents');
  const [senderId, setSenderId] = useState(
    school?.approvedSenderId || 
    school?.shortCode || 
    (school?.name ? school.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 11).toUpperCase() : 'SCHOOLOS')
  );
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Live Gateway Test State
  const [testRecipientPhone, setTestRecipientPhone] = useState(school?.registeredPhone || school?.phone || '');
  const [testMessage, setTestMessage] = useState('Central Arkesel SMS gateway connection test from SchoolOS Online.');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    smsId?: string;
    message: string;
    recipient: string;
    timestamp: string;
  } | null>(null);

  const schoolDisplayName = school?.name || 'the school';
  const smsBalance = settings?.smsBalance ?? 0;

  // Active School Plan
  const activePlan = useMemo(() => {
    return plans.find(p => p.id === school?.planId || p.tierCode === school?.planId) || plans[0];
  }, [plans, school?.planId]);

  // Real Fee Defaulters Count
  const defaultersCount = useMemo(() => {
    return getFeeDefaultersList().length;
  }, [getFeeDefaultersList]);

  // Failed messages count
  const failedCount = useMemo(() => {
    const raw = (allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs) || [];
    return raw.filter(l => (!school || l.schoolId === school.id) && l.status === 'failed').length;
  }, [allCommunicationLogs, communicationLogs, school]);

  // Feature Gating check for current recipient group
  const featureTypeForGroup: SmsFeatureType = useMemo(() => {
    if (recipientGroup === 'fee_defaulters' || recipientGroup === 'defaulters') {
      return 'fee_payment_reminder';
    }
    if (recipientGroup === 'all_parents' || recipientGroup === 'all_guardians') {
      return 'bulk_sms';
    }
    return 'manual_parent_sms';
  }, [recipientGroup]);

  const gatingCheck = useMemo(() => {
    return checkSmsFeatureGating(school?.planId || activePlan?.tierCode || 'basic', featureTypeForGroup);
  }, [school?.planId, activePlan?.tierCode, featureTypeForGroup]);

  // Message segments math
  const segmentStats = useMemo(() => {
    return calculateSmsSegments(messageBody);
  }, [messageBody]);

  const getRecipientCount = (group: SMSBroadcastRecipient) => {
    switch (group) {
      case 'all_parents': return students.length;
      case 'all_staff': return teachers.length;
      case 'fee_defaulters': return defaultersCount;
      default: return 12;
    }
  };

  const recipientCount = getRecipientCount(recipientGroup);
  const totalCreditsNeeded = recipientCount * segmentStats.segments;
  const isBalanceSufficient = smsBalance >= totalCreditsNeeded;

  // Handle Broadcast Submission
  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    if (!messageBody.trim()) {
      setSendError('Please enter message content before dispatching.');
      return;
    }

    if (!gatingCheck.allowed) {
      setSendError(gatingCheck.reason || 'This SMS feature requires a higher subscription tier.');
      return;
    }

    if (!isBalanceSufficient) {
      setSendError(`Insufficient SMS credits. Required: ${totalCreditsNeeded} credits, Available: ${smsBalance} credits.`);
      return;
    }

    setIsSending(true);
    try {
      await sendSMSBroadcast(recipientGroup, messageBody, recipientCount);
      setSendSuccess(`SMS broadcast submitted to Arkesel Gateway for ${recipientCount} recipients (${segmentStats.segments} segment/recipient)! Carrier delivery is in progress.`);
      setMessageBody('');
    } catch (err: any) {
      setSendError(err?.message || 'Failed to dispatch broadcast. Please verify connectivity.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Live Arkesel Test SMS
  const handleLiveTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipientPhone.trim()) {
      alert('Please enter a Ghanaian phone number for live testing.');
      return;
    }

    const norm = normalizeGhanaPhoneNumber(testRecipientPhone);
    if (!norm.isValid) {
      alert(`Invalid Ghanaian phone number: ${testRecipientPhone}. Expected e.g. 0552383515 or +233552383515`);
      return;
    }

    setIsTestingGateway(true);
    setTestResult(null);

    try {
      const resultLog = await sendDirectCommunication({
        type: 'sms',
        recipient: testRecipientPhone,
        recipientName: 'Administrator Live Test',
        message: testMessage,
        category: 'announcement',
        relatedRecordId: `TEST-LIVE-${Date.now()}`
      });

      const isAccepted = resultLog.status === 'submitted' || resultLog.status === 'accepted' || resultLog.status === 'delivered';
      setTestResult({
        success: isAccepted,
        smsId: resultLog.messageId || resultLog.id,
        message: isAccepted 
          ? `HTTP 200 OK: Submitted to Arkesel Gateway in ${resultLog.submissionLatencyMs || '<1000'}ms! Carrier delivery proceeds asynchronously.` 
          : `SMS submission failed: ${resultLog.providerResponse || resultLog.status}`,
        recipient: norm.formatted,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gateway connection failed. Please verify Super Admin Arkesel API key.',
        recipient: norm.formatted,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsTestingGateway(false);
    }
  };

  // Tab definitions matching Notification Centre specification
  const tabs: Array<{ id: CommunicationTab; label: string; icon: any; count?: number; badgeColor?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'composer', label: 'Send Notification', icon: Send },
    { id: 'defaulters', label: 'Defaulters', icon: Users, count: defaultersCount, badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
    { id: 'emergency', label: 'Emergency SMS', icon: AlertOctagon },
    { id: 'attendance', label: 'Attendance Alerts', icon: UserCheck },
    { id: 'fee_reminders', label: 'Fee Reminders', icon: DollarSign },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'sent', label: 'Sent Messages', icon: CheckCircle2 },
    { id: 'failed', label: 'Failed Messages', icon: AlertTriangle, count: failedCount, badgeColor: 'bg-rose-100 text-rose-900 border-rose-200' },
    { id: 'balance', label: 'SMS Balance / Usage', icon: CreditCard },
    { id: 'templates', label: 'Templates', icon: BookOpen },
    { id: 'live_test', label: 'Gateway Test', icon: Radio },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>SchoolOS Notification Centre</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200">
              Arkesel REST v2
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative telecom communication and broadcast dispatches across Ghana's mobile networks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-2 shadow-2xs">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Balance: <b>{smsBalance} SMS Credits</b></span>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Sender ID: <b>{settings.smsSenderId || school?.shortCode || 'SCHOOLOS'}</b></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Horizontal Scrollable Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black border ${
                    isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor || 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="transition-all">
        
        {/* 1. Overview */}
        {activeTab === 'overview' && (
          <OverviewSection onNavigateTab={(tab) => setActiveTab(tab as CommunicationTab)} />
        )}

        {/* 2. Defaulters Dedicated Broadcast Section */}
        {activeTab === 'defaulters' && (
          <DefaultersBroadcastSection onSuccessNavigate={() => setActiveTab('sent')} />
        )}

        {/* 3. Fee Reminders (Manual Dispatch - Defaulters) */}
        {activeTab === 'fee_reminders' && (
          <DefaultersBroadcastSection onSuccessNavigate={() => setActiveTab('sent')} />
        )}

        {/* 4. Emergency SMS Broadcast */}
        {activeTab === 'emergency' && (
          <EmergencySection />
        )}

        {/* 5. Attendance Alerts */}
        {activeTab === 'attendance' && (
          <AttendanceAlertsSection />
        )}

        {/* 6. Scheduled Notifications */}
        {activeTab === 'scheduled' && (
          <ScheduledSection />
        )}

        {/* 7. Sent Messages */}
        {activeTab === 'sent' && (
          <SentFailedLogsSection initialStatus="submitted" />
        )}

        {/* 8. Failed Messages */}
        {activeTab === 'failed' && (
          <SentFailedLogsSection initialStatus="failed" />
        )}

        {/* 9. SMS Balance & Usage Breakdown */}
        {activeTab === 'balance' && (
          <BalanceUsageSection />
        )}

        {/* 10. Notification Templates */}
        {activeTab === 'templates' && (
          <TemplatesSection 
            onUseTemplate={(text) => {
              setMessageBody(text);
              setActiveTab('composer');
            }} 
          />
        )}

        {/* 11. Send Notification (Standard Broadcast Composer) */}
        {activeTab === 'composer' && (
          <div>
            {recipientGroup === 'fee_defaulters' || recipientGroup === 'defaulters' ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-700" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Targeted Defaulters Mode Active</h4>
                      <p className="text-[11px] text-amber-800">
                        Defaulters broadcast uses live fee records and personalized variables ({defaultersCount} students).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecipientGroup('all_parents')}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    Switch to General Broadcast
                  </button>
                </div>
                <DefaultersBroadcastSection onSuccessNavigate={() => setActiveTab('sent')} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Send className="w-4 h-4 text-teal-600" />
                      <span>SMS Broadcast Composer</span>
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Live Arkesel Route
                    </span>
                  </div>

                  {sendSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{sendSuccess}</span>
                    </div>
                  )}

                  {sendError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendSMS} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Audience *</label>
                        <select
                          value={recipientGroup}
                          onChange={e => setRecipientGroup(e.target.value as SMSBroadcastRecipient)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        >
                          <option value="all_parents">All Parents / Guardians ({students.length} students)</option>
                          <option value="fee_defaulters">Fee Defaulters ({defaultersCount} students with arrears)</option>
                          <option value="all_staff">All Teaching & Admin Staff ({teachers.length} staff)</option>
                          <option value="custom">Custom Recipient List</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Approved Sender ID</label>
                        <input
                          type="text"
                          readOnly
                          value={senderId}
                          className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">Message Content *</label>
                        <div className="text-[10px] font-mono text-slate-500">
                          {segmentStats.charCount} chars • {segmentStats.segments} credit/recipient
                        </div>
                      </div>
                      <textarea
                        rows={5}
                        required
                        value={messageBody}
                        onChange={e => setMessageBody(e.target.value)}
                        placeholder="Type notification message to broadcast..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed font-sans"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Recipients Targeted:</span>
                        <b className="text-slate-900">{recipientCount}</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Credits Required:</span>
                        <b className="text-teal-900">{totalCreditsNeeded} Credits</b>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5">
                        <span>Available Credits:</span>
                        <b>{smsBalance} Credits</b>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || !messageBody.trim() || !isBalanceSufficient}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Dispatch Broadcast via Arkesel Gateway</span>
                    </button>
                  </form>
                </div>

                {/* Right Column: Live Mobile Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      <span>Live Handset Display Preview</span>
                    </h4>

                    {/* Phone Frame */}
                    <div className="w-full max-w-xs mx-auto bg-slate-900 rounded-3xl p-3 shadow-xl border-4 border-slate-800">
                      <div className="bg-slate-100 rounded-2xl p-4 min-h-[260px] flex flex-col justify-between">
                        <div>
                          <div className="text-center text-[10px] font-bold text-slate-500 mb-3">
                            SMS • {senderId}
                          </div>
                          <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                            {messageBody || 'Type a message to see handset preview...'}
                          </div>
                        </div>
                        <div className="text-right text-[9px] text-slate-400 font-mono mt-2">
                          Arkesel • Just Now
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 text-center">
                      Messages automatically include the registered school name prefix for NCA compliance.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 12. Live Gateway Test */}
        {activeTab === 'live_test' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600" />
                <span>Arkesel SMS Gateway Integration Test</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch an immediate live single-message probe to any Ghanaian mobile number to verify backend connectivity, API key validity, and telecom delivery latency.
              </p>
            </div>

            <form onSubmit={handleLiveTestSMS} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Phone (Ghana E.164 or Local) *
                </label>
                <input
                  type="text"
                  required
                  value={testRecipientPhone}
                  onChange={e => setTestRecipientPhone(e.target.value)}
                  placeholder="e.g. 0552383515 or +233552383515"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Message Payload *
                </label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isTestingGateway || !testRecipientPhone.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTestingGateway ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Live Test SMS Probe</span>
              </button>
            </form>

            {testResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  <span>{testResult.success ? 'Gateway Probe Succeeded' : 'Gateway Probe Failed'}</span>
                </div>
                <div className="font-mono text-[11px]">{testResult.message}</div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  Target: {testResult.recipient} • Dispatched at {testResult.timestamp}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
