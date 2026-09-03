import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  Zap, 
  Check, 
  FileText,
  Smartphone
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatGHS, formatDate } from '../../utils/formatting';
import { Modal } from '../common/Modal';
import { SubscriptionTransaction } from '../../types';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export const SchoolSubscriptionPaymentView: React.FC = () => {
  const { 
    school, 
    plans, 
    platformPaystack, 
    initializeSchoolSubscription, 
    verifySchoolSubscription, 
    subscriptionTransactions,
    schoolUsers 
  } = useSchool();
  const { currentUser } = useAuth();

  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<SubscriptionTransaction | null>(null);

  // Derive current plan & price
  const currentPlanCode = (school?.subscriptionPlan || 'basic').toLowerCase();
  const currentPlan = plans.find(p => p.id === school?.planId || p.code === currentPlanCode) || plans[0] || {
    id: 'plan_basic',
    name: 'BASIC',
    code: 'basic',
    priceGHS: 350,
    features: [],
    studentLimit: 250,
    description: 'Basic institutional tier'
  };

  const authoritativePriceGHS = currentPlan.priceGHS || 350;
  const currentAcademicYear = school?.currentAcademicYear || '2025/2026';
  const currentTerm = school?.currentTerm || 'Term 2';

  // Subscription active calculation
  const isSubscriptionActive = school?.status === 'active';
  const expiryDateFormatted = school?.subscriptionExpiry ? formatDate(school.subscriptionExpiry) : 'End of Current Term';

  const handlePayNow = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = currentUser?.email || school?.email || '';
    const phone = currentUser?.phone || school?.phone || '';

    try {
      // 1. Authoritative Backend Initialization (Amounts are looked up server-side)
      const initResult = await initializeSchoolSubscription({
        planId: currentPlan.id,
        tierCode: currentPlan.code,
        academicYear: currentAcademicYear,
        term: currentTerm,
        email,
        phone,
        callbackUrl: window.location.href,
      });

      // 2. Open Paystack Inline Modal Popup if loaded
      const publicKey = platformPaystack?.publicKey || (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

      if (window.PaystackPop && window.PaystackPop.setup) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: email,
          amount: initResult.amountPesewas,
          currency: 'GHS',
          ref: initResult.reference,
          metadata: {
            custom_fields: [
              { display_name: 'School Name', variable_name: 'school_name', value: school?.name || '' },
              { display_name: 'Tier', variable_name: 'tier', value: currentPlan.name },
              { display_name: 'Term', variable_name: 'term', value: currentTerm }
            ]
          },
          callback: async (response: any) => {
            setIsVerifying(true);
            try {
              const verifyRes = await verifySchoolSubscription(response.reference);
              if (verifyRes.success) {
                setSuccessMessage(`Subscription successfully renewed for ${currentTerm}! Reference: ${response.reference}`);
              }
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment verification failed. Please contact platform support.');
            } finally {
              setIsVerifying(false);
            }
          },
          onClose: () => {
            setIsInitializing(false);
          }
        });

        handler.openIframe();
      } else if (initResult.authorizationUrl) {
        // Fallback to direct Paystack Checkout window
        window.location.href = initResult.authorizationUrl;
      } else {
        // Direct test verification for development environments without popup
        setIsVerifying(true);
        const verifyRes = await verifySchoolSubscription(initResult.reference);
        if (verifyRes.success) {
          setSuccessMessage(`Subscription successfully activated for ${currentTerm}! Reference: ${initResult.reference}`);
        }
        setIsVerifying(false);
      }
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setErrorMessage(err.message || 'Unable to initiate Paystack payment. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const schoolTxs = (subscriptionTransactions || []).filter(t => t.schoolId === school?.id || !t.schoolId);

  return (
    <div className="space-y-6">
      
      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Payment Verified &amp; Subscription Renewed</div>
            <div className="mt-0.5 opacity-90">{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Transaction Notice</div>
            <div className="mt-0.5 opacity-90">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Main Subscription Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left: Info */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold uppercase tracking-wide">
                {currentPlan.name} TIER
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isSubscriptionActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isSubscriptionActive ? '● Active Subscription' : '● Renewal Due'}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {school?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Academic Session: <b className="text-slate-700">{currentAcademicYear}</b> • Current Term: <b className="text-slate-700">{currentTerm}</b>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Students</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  Up to {currentPlan.studentLimit} Students
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Renewal Expiry</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  {expiryDateFormatted}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Box */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-200/80 rounded-2xl p-6 text-center md:text-right flex flex-col justify-between space-y-4 md:min-w-[280px]">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900">
                Authoritative Termly Fee
              </div>
              <div className="text-3xl font-extrabold text-teal-900 font-mono mt-1">
                {formatGHS(authoritativePriceGHS)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Per Academic Term (approx. 4 months)
              </div>
            </div>

            {/* Authoritative pricing constraint banner */}
            <div className="text-[11px] text-slate-500 bg-white/80 border border-slate-200 rounded-xl p-2.5 text-left flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
              <span>Amount is set automatically by platform tier rules. Manual amount entry is disabled.</span>
            </div>

            <button
              onClick={handlePayNow}
              disabled={isInitializing || isVerifying}
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now with Paystack</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-teal-600" />
                <span>MTN / Telecel MoMo</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                <span>Visa / Mastercard</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subscription Payment History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official institutional payment records and verified Paystack receipts for auditing.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-3.5">Academic Session</th>
                <th className="py-3 px-3.5">Tier Plan</th>
                <th className="py-3 px-3.5">Amount (GHS)</th>
                <th className="py-3 px-3.5">Paystack Reference</th>
                <th className="py-3 px-3.5">Receipt #</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Payment Date</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No payment transactions recorded yet. Click "Pay Now with Paystack" to renew.
                  </td>
                </tr>
              ) : (
                schoolTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {tx.term} ({tx.academicYear})
                    </td>
                    <td className="py-3 px-3.5 uppercase font-bold text-teal-900">
                      {tx.tierName}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                      {formatGHS(tx.amountGHS)}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        tx.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-[11px]">
                      {formatDate(tx.paidAt || tx.createdAt)}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {selectedTxForReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTxForReceipt(null)}
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
                  {selectedTxForReceipt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTxForReceipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Paystack Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTxForReceipt.reference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">School Name:</span>
                  <span className="font-bold text-slate-800">{selectedTxForReceipt.schoolName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Plan & Tier:</span>
                  <span className="font-bold text-slate-800">{selectedTxForReceipt.tierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Term:</span>
                  <span className="font-bold text-slate-800">{selectedTxForReceipt.term} ({selectedTxForReceipt.academicYear})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedTxForReceipt.paidAt || selectedTxForReceipt.createdAt)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Total Amount Paid:</span>
                <span className="font-mono font-extrabold text-base text-teal-900">{formatGHS(selectedTxForReceipt.amountGHS)}</span>
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
