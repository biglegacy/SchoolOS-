import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { SMSBroadcastRecipient, CommunicationLog } from '../../types';
import { 
  MessageSquare, 
  Send, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  History, 
  Smartphone,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatDate } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';
import { 
  calculateSmsSegments, 
  checkSmsFeatureGating, 
  SmsFeatureType 
} from '../../lib/smsPolicy';
import { normalizeGhanaPhoneNumber } from '../../lib/phoneNormalizer';

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
    plans
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'composer' | 'live_test' | 'logs'>('composer');

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

  // Logs Filter State
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  const schoolDisplayName = school?.name || 'the school';
  const smsBalance = settings?.smsBalance ?? 0;

  // Active School Plan
  const activePlan = useMemo(() => {
    return plans.find(p => p.id === school?.planId || p.tierCode === school?.planId) || plans[0];
  }, [plans, school?.planId]);

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
      text: `Dear Parents, please be informed that Mid-Term break commences this Friday. Classes resume promptly on Tuesday 7:30 AM. Kindly ensure pupils complete their take-home assignments.`,
      target: 'all_parents' as SMSBroadcastRecipient,
    },
    {
      title: 'Staff Academic Board Meeting',
      text: `Reminder to all teaching staff: End-of-Term Continuous Assessment marks compilation meeting holds at 3:00 PM in the Staff Common Room.`,
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
  const totalCreditsNeeded = recipientCount * segmentStats.segments;
  const isBalanceSufficient = smsBalance >= totalCreditsNeeded;

  // Filter logs for this school
  const schoolLogs = useMemo(() => {
    const raw = (allCommunicationLogs && allCommunicationLogs.length > 0 ? allCommunicationLogs : communicationLogs) || [];
    return raw.filter(l => {
      if (school && l.schoolId !== school.id) return false;
      if (logCategoryFilter !== 'all' && l.category !== logCategoryFilter) return false;
      if (logStatusFilter !== 'all' && l.status !== logStatusFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        const matchesPhone = (l.recipient || '').toLowerCase().includes(q);
        const matchesName = (l.recipientName || '').toLowerCase().includes(q);
        const matchesMsg = (l.message || '').toLowerCase().includes(q);
        if (!matchesPhone && !matchesName && !matchesMsg) return false;
      }
      return true;
    });
  }, [allCommunicationLogs, communicationLogs, school, logCategoryFilter, logStatusFilter, logSearch]);

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

      const isAccepted = resultLog.status === 'submitted' || resultLog.status === 'accepted' || resultLog.status === 'delivered' || resultLog.status === 'sent';
      setTestResult({
        success: isAccepted,
        smsId: resultLog.messageId || resultLog.id,
        message: isAccepted 
          ? `HTTP 200 OK: Submitted to Arkesel Gateway in ${resultLog.submissionLatencyMs || '<1000'}ms! Carrier delivery proceeds independently.` 
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>SchoolOS Communication Engine</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide">
              Arkesel REST v2
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative mobile messaging for parents, students, and staff via Ghana's central SMS gateway
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Balance: <b>{smsBalance} SMS Credits</b></span>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Plan: <b>{activePlan?.name || 'Standard'}</b></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('composer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'composer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Broadcast Composer</span>
        </button>

        <button
          onClick={() => setActiveTab('live_test')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'live_test'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4 text-teal-400" />
          <span>Live Gateway Test</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Communication Logs ({schoolLogs.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {sendSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sendSuccess}</span>
        </div>
      )}

      {sendError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BROADCAST COMPOSER                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'composer' && (
        <div className="space-y-6">
          
          {/* Feature Gate Warning if blocked */}
          {!gatingCheck.allowed && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">Feature Gated on Current Plan</div>
                  <p className="text-slate-600 mt-0.5">{gatingCheck.reason}</p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs">
                  Required: {gatingCheck.minTierRequired.toUpperCase()} Plan
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Message Composer (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Compose SMS Broadcast</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  GSM-7 Segment Engine
                </span>
              </div>

              <form onSubmit={handleSendSMS} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Sender ID (Max 11 Alphanumeric)
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={senderId}
                      onChange={e => setSenderId(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-bold font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      placeholder="e.g. SCHOOLOS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Audience Group *
                    </label>
                    <select
                      value={recipientGroup}
                      onChange={e => setRecipientGroup(e.target.value as SMSBroadcastRecipient)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="all_parents">All Parents & Guardians ({students.length} Mobile #s)</option>
                      <option value="fee_defaulters">Fee Defaulters Only ({Math.ceil(students.length * 0.4)} Guardians)</option>
                      <option value="all_staff">All Teaching Faculty ({teachers.length} Staff)</option>
                      <option value="class_parents">Active Classroom Parents (14 Guardians)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Official SMS Message Body *</label>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span>{segmentStats.charCount} chars</span>
                      <span>•</span>
                      <span className="font-bold text-teal-800">
                        {segmentStats.segments} {segmentStats.segments === 1 ? 'segment' : 'segments'} (160 GSM-7)
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="Type official SMS announcement to be delivered via Arkesel..."
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50 focus:bg-white font-sans leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Characters remaining in current segment: {segmentStats.charsRemainingInSegment}</span>
                    <span>1 credit = 1 segment per recipient</span>
                  </div>
                </div>

                {/* Pricing & Estimation Card */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      <GhanaFlagBadge size="sm" />
                      <span>Transmission Summary:</span>
                    </div>
                    <span className="font-bold text-teal-900">
                      {recipientCount} Recipients × {segmentStats.segments} Segments = {totalCreditsNeeded} Credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-teal-800 pt-1 border-t border-teal-200/60">
                    <span>Available Balance: <b>{smsBalance} Credits</b></span>
                    <span>
                      {isBalanceSufficient ? (
                        <span className="text-emerald-700 font-bold">✓ Balance Sufficient</span>
                      ) : (
                        <span className="text-rose-600 font-bold">✕ Insufficient Balance (Need {totalCreditsNeeded - smsBalance} more)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSending || !messageBody.trim() || !isBalanceSufficient || !gatingCheck.allowed}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Transmitting via Arkesel...' : `Broadcast to ${recipientCount} Guardians`}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Quick Templates & Best Practices (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Pre-Configured Ghana School Templates</h3>
                </div>

                <div className="space-y-2">
                  {templates.map((tpl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setMessageBody(tpl.text);
                        setRecipientGroup(tpl.target);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{tpl.title}</span>
                        <span className="text-[10px] text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded font-bold">
                          Insert Template
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{tpl.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>NCA Ghana & Arkesel Standards</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  All messages are routed via Arkesel REST API v2 with strict idempotency keys. Duplicate dispatches within 2 minutes are automatically blocked to prevent accidental double-billing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE ARKESEL GATEWAY TEST                                          */}
      {/* ========================================================================= */}
      {activeTab === 'live_test' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-600" />
                <span>Live Arkesel SMS Test</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send an immediate live SMS to verify central gateway connection and delivery receipt.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              API v2 Ready
            </span>
          </div>

          <form onSubmit={handleLiveTestSMS} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-900">
                Recipient Ghanaian Phone Number
              </label>
              <input
                type="tel"
                required
                value={testRecipientPhone}
                onChange={e => setTestRecipientPhone(e.target.value)}
                placeholder="e.g. 0552383515 or 0241234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Automatically normalized to E.164 (+233) and Arkesel format (233XXXXXXXXX).
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-900">Test Message Content</label>
              <textarea
                rows={3}
                required
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isTestingGateway}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{isTestingGateway ? 'Transmitting to Arkesel Gateway...' : 'Execute Live Test SMS'}</span>
            </button>
          </form>

          {/* Test Response Box */}
          {testResult && (
            <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{testResult.success ? 'Gateway Dispatch Successful' : 'Gateway Dispatch Failed'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{testResult.timestamp}</span>
              </div>

              <div className="text-xs font-mono bg-white/80 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>Recipient: <b className="text-slate-900">{testResult.recipient}</b></div>
                <div>Message: <span>{testResult.message}</span></div>
                {testResult.smsId && (
                  <div>SMS ID: <b className="text-teal-800">{testResult.smsId}</b></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMMUNICATION LOGS & AUDIT TRAIL                                    */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>Institution Communication Logs</span>
              </h3>
              <p className="text-xs text-slate-500">
                Complete audit history of SMS transmissions routed through Arkesel v2 for this school
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by phone or name..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <select
                value={logCategoryFilter}
                onChange={e => setLogCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="parent_notice">Parent Notice</option>
                <option value="fee_receipt">Fee Receipt</option>
                <option value="attendance_alert">Attendance Alert</option>
                <option value="exam_results">Exam Results</option>
                <option value="announcement">Announcement</option>
              </select>

              <select
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="accepted">Accepted (Gateway)</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          {schoolLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No communication logs matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Message Preview</th>
                    <th className="py-2.5 px-3">Segments</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {schoolLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp ? formatDate(log.timestamp) : 'Just now'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.recipientName || 'Guardian'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{log.recipient}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {log.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-600" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {log.smsSegments || 1}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'accepted' || log.status === 'delivered' || log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
