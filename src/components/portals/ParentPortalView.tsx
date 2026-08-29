import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Student } from '../../types';
import { 
  HeartHandshake, 
  User, 
  FileText, 
  CreditCard, 
  CalendarCheck2, 
  Phone, 
  CheckCircle2, 
  Award, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { TerminalReportModal } from '../reports/TerminalReportModal';
import { formatGHS, formatDate, formatGhanaPhone } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

export const ParentPortalView: React.FC = () => {
  const { currentUser } = useAuth();
  const { students, school, classrooms, feeStructures, feePayments } = useSchool();
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);

  // Link to sample children for parent view
  const myChildren = students.slice(0, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Parent Welcome Banner */}
      <div className="bg-gradient-to-r from-pink-900 to-purple-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-800/80 border border-pink-700 text-pink-200 text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Parent / Guardian Portal</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Welcome, {currentUser?.fullName}!
            </h2>
            <p className="text-xs text-pink-100">
              Monitoring academic progress, terminal report cards, and fee status for your children at {school?.name}.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider block">Academic Session</span>
            <span className="text-sm font-bold text-white">{school?.currentAcademicYear} • {school?.currentTerm}</span>
          </div>
        </div>
      </div>

      {/* Children Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-500">My Linked Children ({myChildren.length})</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {myChildren.map((child, idx) => {
            const childClass = (classrooms || []).find(c => c.id === child.currentClassroomId);
            const childPayments = (feePayments || []).filter(f => f.studentId === child.id);
            const totalPaid = (childPayments || []).reduce((a, b) => a + (b?.amount || 0), 0);
            const totalBill = 2950;
            const balance = Math.max(0, totalBill - totalPaid);

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
                {/* Child Head */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {child.photoUrl ? (
                      <img src={child.photoUrl} alt={child.firstName} className="w-14 h-14 rounded-full object-cover border-2 border-teal-500 shadow-2xs shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-800 font-bold text-base flex items-center justify-center shrink-0">
                        {child.firstName[0]}{child.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-bold text-gray-900 leading-tight">
                        {child.firstName} {child.lastName} {child.otherNames || ''}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{child.admissionNumber}</p>
                      <span className="inline-flex items-center text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full mt-1 border border-teal-200">
                        {child.classroomName}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    ENROLLED
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Attendance</span>
                    <span className="text-sm font-bold text-emerald-700">96% Present</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Class Rank</span>
                    <span className="text-sm font-bold text-teal-700">1st Position</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Fee Balance</span>
                    <span className={`text-sm font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {formatGHS(balance)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedReportStudent(child)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Terminal Report Card</span>
                  </button>

                  {balance > 0 && (
                    <button
                      onClick={() => alert(`To pay ${formatGHS(balance)} via MTN MoMo / Telecel Cash, please use MoMo Merchant Pay ID: 109482 or dial *170#.`)}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      <span>Pay Fees</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Report Modal */}
      {selectedReportStudent && (
        <TerminalReportModal
          isOpen={!!selectedReportStudent}
          onClose={() => setSelectedReportStudent(null)}
          student={selectedReportStudent}
        />
      )}
    </div>
  );
};
