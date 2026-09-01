import React, { useState } from 'react';
import { 
  CreditCard, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Calendar, 
  DollarSign, 
  Download, 
  Search, 
  Filter, 
  Building2, 
  FileText, 
  Layers, 
  Sliders, 
  Lock, 
  Check, 
  ExternalLink,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { SubscriptionTier, SubscriptionTransaction } from '../../types';
import { formatGHS, formatDate } from '../../utils/formatting';
import { Modal } from '../common/Modal';

export const SuperAdminPaystackSettings: React.FC = () => {
  const { 
    platformPaystack, 
    updatePlatformPaystack, 
    testPaystackGateway, 
    plans, 
    updatePlan,
    allSubscriptionTransactions,
    allSchools,
    triggerTermRenewalReminders
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'gateway' | 'tiers' | 'transactions' | 'reminders'>('gateway');
  const [formData, setFormData] = useState({
    publicKey: platformPaystack?.publicKey || '',
    secretKey: platformPaystack?.secretKey || '',
    webhookSecret: platformPaystack?.webhookSecret || '',
    isLive: platformPaystack?.isLive ?? false,
    currency: platformPaystack?.currency || 'GHS',
    merchantName: platformPaystack?.merchantName || 'SchoolOS Online Ghana',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reminder trigger states
  const [isDispatchingReminders, setIsDispatchingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ totalEligible: number; remindersSent: number; failures: number } | null>(null);

  // Tier editing state
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [isSavingTier, setIsSavingTier] = useState(false);

  // Transaction search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [selectedTx, setSelectedTx] = useState<SubscriptionTransaction | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveGatewayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePlatformPaystack({
        publicKey: formData.publicKey.trim(),
        secretKey: formData.secretKey.trim(),
        webhookSecret: formData.webhookSecret.trim(),
        isLive: formData.isLive,
        currency: formData.currency,
        merchantName: formData.merchantName.trim(),
      });
      showToast('Paystack gateway configuration updated successfully!');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update Paystack configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGateway = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testPaystackGateway(formData.secretKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not reach Paystack gateway API'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDispatchReminders = async () => {
    if (!window.confirm('Are you sure you want to dispatch automated renewal reminders to all schools via Arkesel SMS?')) {
      return;
    }
    setIsDispatchingReminders(true);
    setReminderResult(null);
    try {
      const result = await triggerTermRenewalReminders('2025/2026', 'Term 2');
      setReminderResult(result);
      showToast(`Successfully dispatched ${result.remindersSent} SMS renewal alerts!`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to dispatch renewal reminders');
    } finally {
      setIsDispatchingReminders(false);
    }
  };

  const handleSaveTierPricing = async () => {
    if (!editingTier) return;
    setIsSavingTier(true);
    try {
      await updatePlan(editingTier.id, {
        priceGHS: Number(editingTier.priceGHS),
        name: editingTier.name,
        studentLimit: Number(editingTier.studentLimit),
        description: editingTier.description,
        updatedAt: new Date().toISOString()
      });
      showToast(`${editingTier.name} tier pricing updated to GH₵${editingTier.priceGHS}!`);
      setEditingTier(null);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update tier pricing');
    } finally {
      setIsSavingTier(false);
    }
  };

  const filteredTransactions = (allSubscriptionTransactions || []).filter(tx => {
    const matchesSearch = 
      (tx.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollectedGHS = (allSubscriptionTransactions || [])
    .filter(t => t.status === 'success')
    .reduce((acc, curr) => acc + (curr.amountGHS || 0), 0);

  const pendingPaymentsCount = (allSubscriptionTransactions || [])
    .filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold tracking-wide uppercase">
              Financial Infrastructure
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${formData.isLive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
              {formData.isLive ? '● Live Production Mode' : '● Test Mode (Sandbox)'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">Paystack Subscriptions & Automatic Tier Pricing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative platform tier pricing, secure Paystack webhook handling, and term-end automated SMS billing reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Collected Revenue</div>
            <div className="text-sm font-bold text-teal-800 font-mono">{formatGHS(totalCollectedGHS)}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0">
        <button
          onClick={() => setActiveSubTab('gateway')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'gateway'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Paystack Gateway Config</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tiers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'tiers'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Authoritative Tier Pricing ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription Transactions ({(allSubscriptionTransactions || []).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'reminders'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Term-End SMS Reminders</span>
        </button>
      </div>

      {/* TAB 1: PAYSTACK GATEWAY CONFIG */}
      {activeSubTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Paystack Platform API Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Used to process real institutional subscriptions via Ghana Mobile Money (MTN, Telecel, AT) and Cards.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Live Mode:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isLive} 
                      onChange={e => setFormData({ ...formData, isLive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                  </label>
                </div>
              </div>

              <form onSubmit={handleSaveGatewayConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paystack Public Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.publicKey}
                    onChange={e => setFormData({ ...formData, publicKey: e.target.value })}
                    placeholder={formData.isLive ? 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxx' : 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Safe to use for frontend initialization with Paystack Popup.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paystack Secret Key (Server-side Encrypted) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.secretKey}
                    onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                    placeholder={formData.isLive ? 'sk_live_••••••••••••••••••••••••' : 'sk_test_••••••••••••••••••••••••'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used strictly server-side by backend proxy endpoints to verify transaction hashes. Never exposed to browsers.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Webhook Secret / Verification Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.webhookSecret}
                    onChange={e => setFormData({ ...formData, webhookSecret: e.target.value })}
                    placeholder="Enter webhook secret or keep secret key as HMAC signature..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Merchant Display Name</label>
                    <input
                      type="text"
                      value={formData.merchantName}
                      onChange={e => setFormData({ ...formData, merchantName: e.target.value })}
                      placeholder="SchoolOS Online Ghana"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestGateway}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Gateway...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>

              {/* Test Result Banner */}
              {testResult && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${testResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? 'Paystack Connection Verified' : 'Gateway Connection Failed'}</div>
                    <div className="text-[11px] mt-0.5 opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Webhook Info */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Security & Webhook Setup</span>
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Configure this webhook endpoint in your <b>Paystack Dashboard &gt; Settings &gt; API Keys &amp; Webhooks</b>:
              </p>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] break-all select-all">
                {window.location.origin}/api/paystack/webhook
              </div>

              <div className="space-y-2 text-[11px] text-slate-500">
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Idempotent webhook verification using SHA512 HMAC signature.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Automatically updates school subscription expiry to +4 months per term.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Sends instant SMS payment confirmation to School Owner via Arkesel.</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-teal-700" />
                <span>Authoritative Pricing Mandate</span>
              </h4>
              <p className="text-xs text-teal-800 leading-relaxed">
                The school owner cannot manually enter a custom payment amount. The amount charged is strictly determined by the institution's tier (Basic, Standard, Premium) configured on this dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTHORITATIVE TIER PRICING */}
      {activeSubTab === 'tiers' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Platform Subscription Tiers & Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admin controls the exact termly price for Basic, Standard, and Premium packages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((tier) => (
                <div 
                  key={tier.id}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:border-teal-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 font-bold text-[11px] tracking-wide uppercase">
                        {tier.name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Max {tier.studentLimit} Students
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="text-2xl font-extrabold text-slate-900 font-mono">
                        {formatGHS(tier.priceGHS)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Per Academic Term (approx. 4 months)
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tier.description}
                    </p>

                    <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Included Features:</div>
                      <div className="text-xs text-slate-600">
                        {tier.features.length} operational modules enabled
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <button
                      onClick={() => setEditingTier({ ...tier })}
                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sliders className="w-3.5 h-3.5 text-teal-700" />
                      <span>Edit Tier Price</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION TRANSACTIONS LEDGER */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Platform Paystack Subscription Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time audit log of all institutional subscriptions, Paystack references, and renewal receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by school name, Paystack reference, receipt number..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Paid / Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-3.5">School Name</th>
                    <th className="py-3 px-3.5">Tier & Term</th>
                    <th className="py-3 px-3.5">Amount (GHS)</th>
                    <th className="py-3 px-3.5">Paystack Reference</th>
                    <th className="py-3 px-3.5">Payment Method</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No subscription transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {tx.schoolName}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold uppercase text-[10px] mr-1">
                            {tx.tierName}
                          </span>
                          <span className="text-slate-500 text-[11px]">{tx.term}</span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                          {formatGHS(tx.amountGHS)}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                          {tx.reference}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">
                          {tx.paymentChannel ? tx.paymentChannel.replace('_', ' ').toUpperCase() : 'Mobile Money'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            tx.status === 'success' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TERM-END SMS REMINDERS */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automated Term-End Payment Reminders (Arkesel SMS)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends scheduled SMS notifications to Ghanaian school owners prior to or upon term expiration.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
                Arkesel Gateway Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-800">Sample Outgoing SMS Template:</div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono leading-relaxed">
                    "SchoolOS Notice: Subscription for [School Name] ([Tier Name] Tier) is due for [Term]. Please renew your portal at [Payment URL] to prevent service interruption."
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-800">Dispatch Summary:</div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span>Registered Schools:</span>
                    <span className="font-bold font-mono">{allSchools.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span>Target Academic Session:</span>
                    <span className="font-bold">2025/2026 Academic Year • Term 2</span>
                  </div>
                </div>

                <button
                  onClick={handleDispatchReminders}
                  disabled={isDispatchingReminders}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isDispatchingReminders ? 'animate-bounce' : ''}`} />
                  <span>{isDispatchingReminders ? 'Dispatching SMS Reminders...' : 'Dispatch Automated Renewal Reminders Now'}</span>
                </button>
              </div>

              {/* Status / Output Panel */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-800">Automated Dispatch Engine</div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Scheduled backend cron triggers this automated reminder routine 7 days before term completion, ensuring school owners have adequate time to renew via Mobile Money or Card.
                  </p>
                  
                  {reminderResult && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>SMS Reminders Completed</span>
                      </div>
                      <div className="text-[11px] opacity-90">
                        Total Eligible: {reminderResult.totalEligible} | Sent: {reminderResult.remindersSent} | Failures: {reminderResult.failures}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TIER MODAL */}
      {editingTier && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTier(null)}
          title={`Edit ${editingTier.name} Subscription Price`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subscription Price in Ghana Cedis (GH₵) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GH₵</span>
                <input
                  type="number"
                  value={editingTier.priceGHS}
                  onChange={e => setEditingTier({ ...editingTier, priceGHS: Number(e.target.value) })}
                  required
                  min={1}
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This exact amount is automatically loaded during Paystack checkout when any school on this tier renews.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Enrolment Limit
              </label>
              <input
                type="number"
                value={editingTier.studentLimit}
                onChange={e => setEditingTier({ ...editingTier, studentLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tier Description
              </label>
              <textarea
                value={editingTier.description}
                onChange={e => setEditingTier({ ...editingTier, description: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTierPricing}
                disabled={isSavingTier}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingTier ? 'Saving...' : 'Save Price'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RECEIPT MODAL */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title="Official Subscription Payment Receipt"
          size="md"
        >
          <div className="space-y-4 p-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">SchoolOS Online Ghana</div>
                  <div className="text-[11px] text-slate-500">Official SaaS Platform Subscription Receipt</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] uppercase">
                  {selectedTx.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTx.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Paystack Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTx.reference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Institution:</span>
                  <span className="font-bold text-slate-800">{selectedTx.schoolName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Plan & Tier:</span>
                  <span className="font-bold text-slate-800">{selectedTx.tierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Term:</span>
                  <span className="font-bold text-slate-800">{selectedTx.term} ({selectedTx.academicYear})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedTx.paidAt || selectedTx.createdAt)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Total Amount Paid:</span>
                <span className="font-mono font-extrabold text-base text-teal-900">{formatGHS(selectedTx.amountGHS)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
