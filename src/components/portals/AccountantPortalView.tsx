import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { 
  Calculator, 
  CreditCard, 
  ShoppingCart, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Search,
  Receipt
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatGHS, formatDate } from '../../utils/formatting';
import { NavTabId } from '../common/Sidebar';

interface AccountantPortalViewProps {
  onNavigate: (tab: NavTabId) => void;
}

export const AccountantPortalView: React.FC<AccountantPortalViewProps> = ({ onNavigate }) => {
  const { feePayments = [], posSales = [], posTransactions = [], getStudentFeeSummaries } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const salesList = (posSales && posSales.length > 0) ? posSales : posTransactions;
  const totalFeeCollected = (feePayments || []).reduce((a, b) => a + (b?.amount || 0), 0);
  const totalPOSSales = (salesList || []).reduce((a, b) => a + (b?.total || b?.totalAmount || 0), 0);
  const feeSummaries = (getStudentFeeSummaries ? getStudentFeeSummaries() : []) || [];
  const totalToBePaid = feeSummaries.reduce((a, b) => a + (b?.amountToBePaid ?? b?.totalBilled ?? 0), 0);
  const totalOutstanding = feeSummaries.reduce((a, b) => a + (b?.amountOwing ?? b?.balance ?? 0), 0);
  const defaultersCount = feeSummaries.filter(f => (f?.amountOwing ?? f?.balance ?? 0) > 0).length;

  const filteredSummaries = feeSummaries.filter(f => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.classroomName.toLowerCase().includes(searchTerm.toLowerCase());
    const status = (f.paymentStatus || f.status || '').toLowerCase();
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'paid' && status.includes('paid') && !status.includes('part') && !status.includes('un')) ||
      (statusFilter === 'partial' && status.includes('part')) ||
      (statusFilter === 'unpaid' && status.includes('un'));
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string, paymentStatus?: string) => {
    const normalized = (paymentStatus || status || 'unpaid').toLowerCase();
    if (normalized.includes('paid') && !normalized.includes('part') && !normalized.includes('un')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Paid
        </span>
      );
    }
    if (normalized.includes('part')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        Unpaid
      </span>
    );
  };

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
              className="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-xs hover:bg-amber-50 transition-colors cursor-pointer"
            >
              Record Fee Payment
            </button>
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Launch Store POS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Assigned Fees"
          value={formatGHS(totalToBePaid)}
          subtitle="Amount to Be Paid"
          icon={CreditCard}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          onClick={() => onNavigate('fees')}
        />
        <StatCard
          title="Total Fees Collected"
          value={formatGHS(totalFeeCollected)}
          subtitle="Amount Paid"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => onNavigate('fees')}
        />
        <StatCard
          title="Outstanding Arrears"
          value={formatGHS(totalOutstanding)}
          subtitle="Amount Owing"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate('fees')}
        />
        <StatCard
          title="Store POS Sales"
          value={formatGHS(totalPOSSales)}
          subtitle="Uniforms & Books"
          icon={ShoppingCart}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => onNavigate('pos')}
        />
      </div>

      {/* Student Fee Records & Balances Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Student Fee Records & Balance Register</h3>
            <p className="text-xs text-gray-500">
              Assigned fees, recorded payments, and automatically calculated balances owing for all students.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or class..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid (₵0.00)</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name & ID</th>
                <th className="px-4 py-3">Classroom</th>
                <th className="px-4 py-3">Amount to Be Paid</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Amount Owing / Balance</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500">
                    No student fee records found.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map(item => {
                  const toBePaid = item.amountToBePaid ?? item.totalBilled ?? 0;
                  const paid = item.amountPaid ?? item.totalPaid ?? 0;
                  const owing = item.amountOwing ?? item.balance ?? 0;

                  return (
                    <tr key={item.studentId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{item.studentName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{item.admissionNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{item.classroomName}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {formatGHS(toBePaid)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {formatGHS(paid)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-black ${owing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatGHS(owing)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status, item.paymentStatus)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigate('fees')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Manage Fee
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                <div className="text-[11px] text-gray-500 font-mono flex flex-wrap items-center gap-x-2">
                  <span className="font-bold text-gray-700">Receipt: {pay.receiptNumber || pay.id}</span>
                  <span>•</span>
                  <span className="text-teal-700 font-semibold">Ref: {pay.transactionReference || pay.reference || pay.id}</span>
                  <span>•</span>
                  <span>Mode: {(pay.paymentMethod || pay.method || 'MOMO').toUpperCase()}</span>
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
