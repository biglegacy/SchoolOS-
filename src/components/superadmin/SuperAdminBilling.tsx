import React, { useState } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Search, 
  Download, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Layers,
  ArrowUpRight,
  Receipt,
  FileText
} from 'lucide-react';
import { School, SubscriptionTier } from '../../types';
import { formatDate, formatGHS } from '../../utils/formatting';

interface SuperAdminBillingProps {
  schools: School[];
  plans: SubscriptionTier[];
}

export const SuperAdminBilling: React.FC<SuperAdminBillingProps> = ({
  schools,
  plans
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const getPlanPrice = (school: School) => {
    const pCode = (school.subscriptionPlan || 'basic').toLowerCase();
    const plan = plans.find(p => p.id === school.planId || p.code === pCode);
    return plan?.priceGHS || 350;
  };

  // Mocked authoritative invoices mapped from registered schools for termly billing
  const invoices = schools.map((school, index) => {
    const amount = getPlanPrice(school);
    const isPaid = school.status === 'active';
    return {
      id: `INV-2026-${(1001 + index).toString()}`,
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.shortCode,
      district: school.district,
      plan: school.subscriptionPlan || 'basic',
      term: '2025/2026 Academic Year • Term 2',
      amount,
      status: isPaid ? 'paid' : 'pending',
      issueDate: '2026-01-10',
      dueDate: '2026-02-15',
      paidDate: isPaid ? '2026-01-12' : null,
      paymentMethod: isPaid ? (index % 2 === 0 ? 'MTN Mobile Money' : 'Bank Transfer (GCB)') : 'Pending Collection'
    };
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.schoolCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTermRevenue = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const collectedRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Billing & Revenue Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track termly institutional subscriptions, mobile money collections, and billing invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Invoices</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Expected Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatGHS(totalTermRevenue)}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {schools.length} subscribed institutions
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Settled / Paid Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {formatGHS(collectedRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {invoices.filter(i => i.status === 'paid').length} Invoices Settled
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {formatGHS(pendingRevenue)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {invoices.filter(i => i.status === 'pending').length} Invoices Pending
          </div>
        </div>

      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice ID or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid & Settled</option>
              <option value="pending">Pending Invoices</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing <b>{filteredInvoices.length}</b> institutional invoices
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400 space-y-1">
            <Receipt className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method / Channel</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-900">
                      {inv.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.schoolName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.schoolCode} • {inv.district}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-slate-800 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {inv.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.term}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatGHS(inv.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.paymentMethod}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
