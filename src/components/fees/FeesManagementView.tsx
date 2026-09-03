import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Student, PaymentMethod } from '../../types';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Phone, 
  MessageSquare, 
  FileText, 
  Receipt,
  Clock,
  Send
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { formatGHS, formatDate, formatGhanaPhone } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

export const FeesManagementView: React.FC = () => {
  const { 
    school,
    students, 
    classrooms, 
    feeStructures, 
    feePayments, 
    recordFeePayment, 
    getStudentFeeSummaries,
    sendSMSBroadcast,
    generateTransactionReference 
  } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(1500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isGeneratingRef, setIsGeneratingRef] = useState(false);
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [remarks, setRemarks] = useState('Term 3 Fees Part Payment');

  const rawSummaries = getStudentFeeSummaries ? getStudentFeeSummaries() : [];
  const feeSummaries = Array.isArray(rawSummaries) ? rawSummaries : [];

  // Metrics
  const totalBilled = feeSummaries.reduce((acc, f) => acc + (f?.amountToBePaid ?? f?.totalBilled ?? 0), 0);
  const totalCollected = feeSummaries.reduce((acc, f) => acc + (f?.amountPaid ?? f?.totalPaid ?? 0), 0);
  const totalOutstanding = feeSummaries.reduce((acc, f) => acc + (f?.amountOwing ?? f?.balance ?? 0), 0);
  const defaultersCount = feeSummaries.filter(f => (f?.amountOwing ?? f?.balance ?? 0) > 0).length;

  const filteredSummaries = feeSummaries.filter(f => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || f.classroomId === classFilter;
    const matchesStatus = statusFilter === 'all' || 
      f.status === statusFilter || 
      (f.paymentStatus && f.paymentStatus.toLowerCase().replace(' ', '_') === statusFilter.toLowerCase().replace(' ', '_'));
    return matchesSearch && matchesClass && matchesStatus;
  });

  const selectedSummary = selectedStudentForPay 
    ? feeSummaries.find(f => f.studentId === selectedStudentForPay.id) 
    : null;
  const currentToBePaid = selectedSummary?.amountToBePaid ?? selectedSummary?.totalBilled ?? 0;
  const currentPaid = selectedSummary?.amountPaid ?? selectedSummary?.totalPaid ?? 0;
  const currentOwing = selectedSummary?.amountOwing ?? selectedSummary?.balance ?? 0;
  const projectedOwing = Math.max(0, currentOwing - Number(paymentAmount || 0));

  const handleOpenPayment = async (student: Student) => {
    setSelectedStudentForPay(student);
    const summary = feeSummaries.find(f => f.studentId === student.id);
    const remainingToPay = summary ? (summary.amountOwing ?? summary.balance ?? 0) : 0;
    setPaymentAmount(remainingToPay > 0 ? remainingToPay : 0);

    const primaryGuardian = student.guardians[0];
    setPayerName(primaryGuardian?.name || `${student.firstName} ${student.lastName} (Guardian)`);
    setPayerPhone(primaryGuardian?.phone || '');
    
    setIsGeneratingRef(true);
    setIsPaymentModalOpen(true);
    try {
      if (generateTransactionReference) {
        const gen = await generateTransactionReference('fee_payment');
        setTransactionRef(gen.reference);
        setReceiptNumber(gen.receiptNumber);
      }
    } catch (err) {
      console.warn('Error fetching dynamic reference:', err);
    } finally {
      setIsGeneratingRef(false);
    }
  };

  const handleRegenerateRef = async () => {
    setIsGeneratingRef(true);
    try {
      if (generateTransactionReference) {
        const gen = await generateTransactionReference('fee_payment');
        setTransactionRef(gen.reference);
        setReceiptNumber(gen.receiptNumber);
      }
    } finally {
      setIsGeneratingRef(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;

    const receipt = await recordFeePayment({
      studentId: selectedStudentForPay.id,
      studentName: `${selectedStudentForPay.firstName} ${selectedStudentForPay.lastName}`,
      classroomId: selectedStudentForPay.currentClassroomId,
      classroomName: selectedStudentForPay.classroomName,
      academicYear: '2026/2027',
      term: 'Term 3',
      amount: Number(paymentAmount),
      paymentMethod,
      reference: transactionRef || undefined,
      transactionReference: transactionRef || undefined,
      receiptNumber: receiptNumber || undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      recordedBy: 'School Bursar / Accountant',
      payerName,
      payerPhone,
      remarks,
    });

    setIsPaymentModalOpen(false);
    setActiveReceipt({
      ...receipt,
      amountToBePaid: currentToBePaid,
      previousPaid: currentPaid,
      totalPaidToDate: currentPaid + Number(paymentAmount),
      remainingOwing: projectedOwing,
      paymentStatus: projectedOwing === 0 ? 'Paid' : 'Partially Paid'
    });
    setActionSuccess(`Payment of ${formatGHS(paymentAmount)} recorded for ${selectedStudentForPay.firstName}!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSendDefaultersSMS = async () => {
    const defaulters = feeSummaries.filter(f => (f.amountOwing ?? f.balance ?? 0) > 0);
    if (defaulters.length === 0) {
      alert('No fee defaulters found.');
      return;
    }

    if (window.confirm(`Send urgent SMS payment reminder to all ${defaulters.length} guardians with outstanding fee balances?`)) {
      await sendSMSBroadcast(
        'fee_defaulters',
        `Dear Parent, this is a kind reminder that your ward has an outstanding school fee balance for Term 3. Please settle via MTN MoMo / Telecel Cash or at the school accounts office. Thank you.`,
        defaulters.length
      );
      setActionSuccess(`Broadcast SMS sent to ${defaulters.length} guardian phone numbers!`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const getStatusBadge = (status?: string, paymentStatus?: string) => {
    const normalized = (paymentStatus || status || 'unpaid').toLowerCase();
    if (normalized.includes('paid') && !normalized.includes('part') && !normalized.includes('un')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Paid
        </span>
      );
    }
    if (normalized.includes('part')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        Unpaid
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">School Fees & Revenue Collection</h2>
          <p className="text-xs text-gray-500">Multi-channel fee payments (MTN MoMo, Telecel, Bank, Cash) and arrears tracking</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendDefaultersSMS}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS All Fee Defaulters ({defaultersCount})</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expected Fees"
          value={formatGHS(totalBilled)}
          subtitle="Term 3 Total Bill"
          icon={CreditCard}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Total Collected"
          value={formatGHS(totalCollected)}
          subtitle={`${Math.round((totalCollected / (totalBilled || 1)) * 100)}% Collection Rate`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Outstanding Arrears"
          value={formatGHS(totalOutstanding)}
          subtitle="Pending Collection"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Fee Defaulters"
          value={defaultersCount}
          subtitle="Pupils with active balance"
          icon={Clock}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Balance</option>
            <option value="unpaid">Unpaid Only</option>
          </select>
        </div>
      </div>

      {/* Student Fee Balances View (Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Mobile Card View (Hidden on tablet/desktop) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredSummaries.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 font-medium">
              No fee records found for current filter.
            </div>
          ) : (
            filteredSummaries.map((item) => {
              const studentObj = students.find(s => s.id === item.studentId);
              const toBePaid = item.amountToBePaid ?? item.totalBilled ?? 0;
              const paid = item.amountPaid ?? item.totalPaid ?? 0;
              const owing = item.amountOwing ?? item.balance ?? 0;

              return (
                <div key={item.studentId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{item.studentName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{item.admissionNumber}</div>
                    </div>
                    {getStatusBadge(item.status, item.paymentStatus)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Amount to Be Paid</span>
                      <div className="font-bold text-gray-800 text-xs">{formatGHS(toBePaid)}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Amount Paid</span>
                      <div className="font-bold text-emerald-700 text-xs">{formatGHS(paid)}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase block">Amount Owing</span>
                      <div className={`font-black text-xs ${owing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatGHS(owing)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {item.classroomName}
                    </span>

                    <button
                      onClick={() => studentObj && handleOpenPayment(studentObj)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs min-h-[40px] cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Student Name & ID</th>
                <th className="px-4 py-3">Classroom</th>
                <th className="px-4 py-3">Amount to Be Paid</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Amount Owing / Balance</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-gray-500 font-medium bg-gray-50/50">
                    No fee records found for current filter.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item) => {
                  const studentObj = students.find(s => s.id === item.studentId);
                  const toBePaid = item.amountToBePaid ?? item.totalBilled ?? 0;
                  const paid = item.amountPaid ?? item.totalPaid ?? 0;
                  const owing = item.amountOwing ?? item.balance ?? 0;

                  return (
                    <tr key={item.studentId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900 text-sm">{item.studentName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{item.admissionNumber}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-gray-800">{item.classroomName}</span>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-gray-900">
                        {formatGHS(toBePaid)}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-700">
                        {formatGHS(paid)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`font-black ${owing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatGHS(owing)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(item.status, item.paymentStatus)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => studentObj && handleOpenPayment(studentObj)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
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

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Fee Payment"
        subtitle={`Student: ${selectedStudentForPay?.firstName} ${selectedStudentForPay?.lastName} (${selectedStudentForPay?.classroomName})`}
        maxWidth="2xl"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {/* Real-time Fee Summary Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Amount to Be Paid</span>
              <span className="text-sm font-bold text-gray-900">{formatGHS(currentToBePaid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Amount Paid So Far</span>
              <span className="text-sm font-bold text-emerald-700">{formatGHS(currentPaid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Current Amount Owing</span>
              <span className={`text-sm font-black ${currentOwing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatGHS(currentOwing)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Amount (GH₵) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Projected Remaining Balance: <span className="font-bold text-amber-600">{formatGHS(projectedOwing)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method / Channel *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="telecel_cash">Telecel Cash</option>
                <option value="bank_deposit">Bank Deposit / Transfer</option>
                <option value="cash">Cash in Person</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payer Full Name *</label>
              <input
                type="text"
                required
                value={payerName}
                onChange={e => setPayerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payer Phone Number (Ghana) *</label>
              <input
                type="tel"
                required
                value={payerPhone}
                onChange={e => setPayerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Dynamic Transaction Reference *</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Dynamic Authoritative ID
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateRef}
                  disabled={isGeneratingRef}
                  className="text-[10px] text-teal-600 hover:text-teal-700 font-bold underline disabled:opacity-50"
                >
                  {isGeneratingRef ? 'Generating...' : 'Regenerate ID'}
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={transactionRef}
              onChange={e => setTransactionRef(e.target.value)}
              placeholder={isGeneratingRef ? "Generating dynamic reference..." : "e.g. SCH-FEE-20260901-..."}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50 text-gray-800"
            />
            {receiptNumber && (
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-mono">
                <span>Receipt Number:</span>
                <span className="font-bold text-gray-700">{receiptNumber}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Confirm & Issue Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE RECEIPT MODAL */}
      {activeReceipt && (
        <Modal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title="Official School Fee Payment Receipt"
          subtitle={`Receipt #: ${activeReceipt.receiptNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-300 space-y-4 font-mono text-xs">
              <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-1">
                {school?.logo && (
                  <img src={school.logo} alt={school?.name || 'School Crest'} className="w-12 h-12 mx-auto object-contain mb-1" />
                )}
                {school?.name && (
                  <div className="font-bold text-sm text-gray-900 uppercase tracking-tight">{school.name}</div>
                )}
                {school?.address && (
                  <div className="text-[11px] text-gray-600">{school.address}</div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] text-gray-500">
                  {school?.phone && <span>Tel: {school.phone}</span>}
                  {school?.email && <span>Email: {school.email}</span>}
                </div>
                <div className="font-bold text-xs text-gray-800 uppercase pt-1">Official School Fee Payment Receipt</div>
                <div className="font-mono font-bold text-teal-800">{activeReceipt.receiptNumber}</div>
              </div>

              <div className="space-y-1 text-gray-700">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-bold">{formatDate(activeReceipt.paymentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Student Name:</span>
                  <span className="font-bold">{activeReceipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="font-bold">{activeReceipt.classroomName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid By:</span>
                  <span className="font-bold">{activeReceipt.payerName} ({activeReceipt.payerPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase">{activeReceipt.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ref / Txn ID:</span>
                  <span className="font-bold">{activeReceipt.transactionReference}</span>
                </div>
              </div>

              {/* Comprehensive Breakdown */}
              <div className="border-t border-b border-dashed border-gray-400 py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Amount to Be Paid:</span>
                  <span className="font-bold text-gray-900">{formatGHS(activeReceipt.amountToBePaid || 0)}</span>
                </div>
                <div className="flex justify-between text-teal-700 font-bold text-sm">
                  <span>AMOUNT PAID NOW:</span>
                  <span>{formatGHS(activeReceipt.amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Amount Paid to Date:</span>
                  <span className="font-bold text-emerald-700">{formatGHS(activeReceipt.totalPaidToDate || activeReceipt.amount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                  <span>Amount Owing / Balance:</span>
                  <span className={(activeReceipt.remainingOwing || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {formatGHS(activeReceipt.remainingOwing || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Payment Status:</span>
                  <span className="font-bold uppercase text-teal-800">
                    {activeReceipt.paymentStatus || ((activeReceipt.remainingOwing || 0) === 0 ? 'PAID' : 'PARTIALLY PAID')}
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 pt-2">
                Thank you for your prompt payment! Keep this receipt for verification.
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>

              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
