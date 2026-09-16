import React from 'react';
import { Student, FeePayment, FeeStructure } from '../../../types';
import { CreditCard, CheckCircle2, AlertCircle, Receipt, ArrowDownRight, Printer } from 'lucide-react';
import { formatGHS, formatDate } from '../../../utils/formatting';

interface ParentFeesTabProps {
  child: Student;
  applicableFeeStructure?: FeeStructure;
  payments: FeePayment[];
  amountToBePaid: number;
  amountPaid: number;
  amountOwing: number;
  paymentStatus: string;
}

export const ParentFeesTab: React.FC<ParentFeesTabProps> = ({
  child,
  applicableFeeStructure,
  payments,
  amountToBePaid,
  amountPaid,
  amountOwing,
  paymentStatus
}) => {
  const isFullyPaid = paymentStatus === 'Paid' || amountOwing <= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-700" />
            <span>School Fees Statement &amp; Payments</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Billing statement and official payment receipts for {child.firstName} {child.lastName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFullyPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fees Fully Settled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Balance Owing: {formatGHS(amountOwing)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Balance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Total Billed Fees</span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatGHS(amountToBePaid)}
          </div>
          <p className="text-xs text-slate-500">Official term tuition &amp; dues</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Total Amount Paid</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatGHS(amountPaid)}
          </div>
          <p className="text-xs text-slate-500">{payments.length} verified payment(s)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <span className="text-[11px] uppercase font-bold text-slate-500">Outstanding Balance</span>
          <div className={`text-2xl font-black font-mono ${isFullyPaid ? 'text-slate-900' : 'text-rose-700'}`}>
            {isFullyPaid ? 'GHS 0.00' : formatGHS(amountOwing)}
          </div>
          <p className="text-xs text-slate-500">{isFullyPaid ? 'Zero balance' : 'Payable to school accounts'}</p>
        </div>
      </div>

      {/* Fee Items Breakdown */}
      {applicableFeeStructure?.components && applicableFeeStructure.components.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Itemized Fee Structure
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {applicableFeeStructure.components.map((comp, idx) => (
              <div key={comp.id || idx} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700 font-medium">{comp.name}</span>
                <span className="font-mono font-bold text-slate-900">{formatGHS(comp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Receipts History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-700" />
          <span>Payment Transactions &amp; Receipts ({payments.length})</span>
        </h3>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
            No payments recorded yet for this academic session.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map(p => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">
                    Receipt #{p.receiptNumber || p.id}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: {formatDate(p.paymentDate)} • Method: <span className="capitalize font-semibold text-slate-700">{p.paymentMethod || 'Cash'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    +{formatGHS(p.amount)}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
