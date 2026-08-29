import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Calculator, 
  CreditCard, 
  ShoppingCart, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  DollarSign 
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatGHS, formatDate } from '../../utils/formatting';
import { NavTabId } from '../common/Sidebar';

interface AccountantPortalViewProps {
  onNavigate: (tab: NavTabId) => void;
}

export const AccountantPortalView: React.FC<AccountantPortalViewProps> = ({ onNavigate }) => {
  const { feePayments = [], posSales = [], posTransactions = [], getStudentFeeSummaries } = useSchool();

  const salesList = (posSales && posSales.length > 0) ? posSales : posTransactions;
  const totalFeeCollected = (feePayments || []).reduce((a, b) => a + (b?.amount || 0), 0);
  const totalPOSSales = (salesList || []).reduce((a, b) => a + (b?.total || b?.totalAmount || 0), 0);
  const feeSummaries = (getStudentFeeSummaries ? getStudentFeeSummaries() : []) || [];
  const totalOutstanding = feeSummaries.reduce((a, b) => a + (b?.balance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-amber-900 to-teal-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-800/80 border border-amber-700 text-amber-200 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Accounts & Bursary Console</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              School Bursary & Financial Ledger
            </h2>
            <p className="text-xs text-amber-100">
              Real-time fee receipts, Mobile Money merchant settlements, and School Store POS cash reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('fees')}
              className="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-xs hover:bg-amber-50 transition-colors"
            >
              Record Fee Payment
            </button>
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Launch Store POS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Term Fees Collected"
          value={formatGHS(totalFeeCollected)}
          subtitle="Direct Bank & MoMo"
          icon={CreditCard}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          onClick={() => onNavigate('fees')}
        />
        <StatCard
          title="Store POS Cash & MoMo"
          value={formatGHS(totalPOSSales)}
          subtitle="Uniforms & Books Sold"
          icon={ShoppingCart}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => onNavigate('pos')}
        />
        <StatCard
          title="Outstanding Student Arrears"
          value={formatGHS(totalOutstanding)}
          subtitle="To be collected"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate('fees')}
        />
      </div>

      {/* Recent Ledger Entries */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Bursary Payment Receipts</h3>
          <span className="text-xs text-teal-600 font-bold">Live Audited Ledger</span>
        </div>

        <div className="divide-y divide-gray-100">
          {feePayments.map(pay => (
            <div key={pay.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-bold text-gray-900">
                  {pay.studentName} ({pay.classroomName})
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Receipt: {pay.receiptNumber} • Txn: {pay.transactionReference} • Mode: {pay.paymentMethod.toUpperCase()}
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-sm text-emerald-700">+{formatGHS(pay.amount)}</div>
                <div className="text-[10px] text-gray-400">{formatDate(pay.paymentDate)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
