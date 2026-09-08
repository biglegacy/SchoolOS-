import React, { useState, useMemo } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { DefaulterStudentView, DEFAULT_DEFAULTER_SMS_TEMPLATE, resolvePersonalizedMessage } from '../../lib/defaulterSmsService';
import { calculateSmsSegments } from '../../lib/smsPolicy';
import { SMSDispatchRecord, DefaultersBroadcastResult } from '../../types';
import { 
  Users, 
  Search, 
  Filter, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Sparkles, 
  Eye, 
  X, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';

interface Props {
  onSuccessNavigate?: (tab: string) => void;
}

export const DefaultersBroadcastSection: React.FC<Props> = ({ onSuccessNavigate }) => {
  const { 
    school, 
    classrooms, 
    settings, 
    getFeeDefaultersList, 
    sendDefaultersBroadcast,
    currentUser
  } = useSchool();

  // Filters
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Message Composer
  const [messageTemplate, setMessageTemplate] = useState<string>(DEFAULT_DEFAULTER_SMS_TEMPLATE);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

  // Dispatch Execution State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<{
    total: number;
    current: number;
    submitted: number;
    failed: number;
    currentStudentName: string;
  } | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<DefaultersBroadcastResult | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Load real defaulters
  const defaulters = useMemo(() => {
    return getFeeDefaultersList({
      classroomId: selectedClassroom,
      searchQuery: searchQuery
    });
  }, [getFeeDefaultersList, selectedClassroom, searchQuery]);

  // Sync selection when defaulters change if empty
  const allIds = useMemo(() => defaulters.map(d => d.studentId), [defaulters]);
  const isAllSelected = defaulters.length > 0 && defaulters.every(d => selectedStudentIds.has(d.studentId));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(allIds));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const selectedDefaulters = useMemo(() => {
    return defaulters.filter(d => selectedStudentIds.has(d.studentId));
  }, [defaulters, selectedStudentIds]);

  // Statistics
  const totalOutstanding = useMemo(() => {
    return defaulters.reduce((acc, d) => acc + d.amountOwing, 0);
  }, [defaulters]);

  const selectedOutstanding = useMemo(() => {
    return selectedDefaulters.reduce((acc, d) => acc + d.amountOwing, 0);
  }, [selectedDefaulters]);

  // Sample student for preview
  const sampleStudent = useMemo(() => {
    if (previewStudentId) {
      const found = defaulters.find(d => d.studentId === previewStudentId);
      if (found) return found;
    }
    if (selectedDefaulters.length > 0) return selectedDefaulters[0];
    return defaulters[0] || null;
  }, [previewStudentId, selectedDefaulters, defaulters]);

  // Preview Message
  const livePreviewText = useMemo(() => {
    if (!sampleStudent || !school) return '';
    return resolvePersonalizedMessage(messageTemplate, sampleStudent, school.name);
  }, [messageTemplate, sampleStudent, school]);

  // GSM-7 Segment Stats
  const segmentStats = useMemo(() => {
    return calculateSmsSegments(livePreviewText || messageTemplate);
  }, [livePreviewText, messageTemplate]);

  // Estimated credits
  const estimatedCredits = useMemo(() => {
    return selectedDefaulters.length * segmentStats.segments;
  }, [selectedDefaulters.length, segmentStats.segments]);

  const currentSmsBalance = settings.smsBalance || 0;
  const isBalanceSufficient = currentSmsBalance >= estimatedCredits;

  // Insert template variable helper
  const handleInsertVariable = (variable: string) => {
    setMessageTemplate(prev => `${prev} {${variable}}`);
  };

  // Pre-configured Defaulter SMS Templates
  const prebuiltTemplates = [
    {
      title: 'Standard Payment Notice',
      text: 'Dear {parentName}, this is a payment notice from {schoolName}. {studentName} ({classroom}) has an outstanding school fee balance of {amountOwing} for {term}. Please settle at the bursary or via official MoMo channels. Thank you.'
    },
    {
      title: 'Urgent Final Demand',
      text: 'FINAL NOTICE: Dear {parentName}, school fees for {studentName} ({amountOwing}) remain unsettled. To ensure uninterrupted academic access and examinations, kindly make payment immediately. - {schoolName}'
    },
    {
      title: 'Mid-Term Clearance Notice',
      text: 'Dear {parentName}, kindly be reminded that {studentName} has a school fee balance of {amountOwing}. Fee clearance is required before mid-term assessments. Thank you for your cooperation. - {schoolName}'
    },
    {
      title: 'MoMo Payment Instructions',
      text: 'Dear {parentName}, outstanding fees for {studentName} ({classroom}) is {amountOwing}. You may pay securely via MTN MoMo / Telecel Cash to school merchant or accounts office. - {schoolName}'
    }
  ];

  // Initiate Broadcast
  const handleStartBroadcast = async () => {
    if (selectedDefaulters.length === 0) return;
    setIsConfirmModalOpen(false);
    setIsDispatching(true);
    setDispatchError(null);
    setBroadcastResult(null);

    setDispatchProgress({
      total: selectedDefaulters.length,
      current: 0,
      submitted: 0,
      failed: 0,
      currentStudentName: selectedDefaulters[0]?.studentName || ''
    });

    try {
      const res = await sendDefaultersBroadcast({
        selectedDefaulters,
        templateMessage: messageTemplate,
        senderId: settings.smsSenderId || school?.shortCode,
        onProgress: (prog) => {
          setDispatchProgress({
            total: prog.total,
            current: prog.current,
            submitted: prog.submitted,
            failed: prog.failed,
            currentStudentName: prog.currentStudentName
          });
        }
      });

      setBroadcastResult(res);
    } catch (err: any) {
      setDispatchError(err?.message || 'An error occurred during dispatch.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Safe retry for failed dispatches only
  const handleRetryFailed = async () => {
    if (!broadcastResult) return;
    const failedRecords = broadcastResult.records.filter(r => r.status === 'FAILED');
    if (failedRecords.length === 0) return;

    // Map failed records back to DefaulterStudentView
    const failedStudents = defaulters.filter(d => failedRecords.some(fr => fr.studentId === d.studentId));
    if (failedStudents.length === 0) return;

    setIsDispatching(true);
    setDispatchError(null);

    setDispatchProgress({
      total: failedStudents.length,
      current: 0,
      submitted: 0,
      failed: 0,
      currentStudentName: failedStudents[0]?.studentName || ''
    });

    try {
      const res = await sendDefaultersBroadcast({
        selectedDefaulters: failedStudents,
        templateMessage: messageTemplate,
        senderId: settings.smsSenderId || school?.shortCode,
        onProgress: (prog) => {
          setDispatchProgress({
            total: prog.total,
            current: prog.current,
            submitted: prog.submitted,
            failed: prog.failed,
            currentStudentName: prog.currentStudentName
          });
        }
      });

      // Merge results
      setBroadcastResult(prev => {
        if (!prev) return res;
        const remainingSuccess = prev.records.filter(r => r.status === 'SUBMITTED');
        return {
          ...res,
          totalRecipients: remainingSuccess.length + res.totalRecipients,
          submittedCount: remainingSuccess.length + res.submittedCount,
          records: [...remainingSuccess, ...res.records]
        };
      });
    } catch (err: any) {
      setDispatchError(err?.message || 'Retry dispatch failed.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                <Users className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Defaulters SMS Broadcast Manager
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Live Fee Data
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Audit real fee records, select verified defaulters with Ghanaian phone numbers, and broadcast personalized SMS alerts via Arkesel SMS Gateway.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Outstanding Debt</div>
              <div className="text-sm font-black text-rose-600">
                GH₵ {totalOutstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-right">
              <div className="text-[10px] font-bold uppercase text-teal-700">SMS Balance</div>
              <div className="text-sm font-black text-teal-900">
                {currentSmsBalance} Credits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, ID, parent, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer transition-colors"
          >
            {isAllSelected ? 'Deselect All' : `Select All (${defaulters.length})`}
          </button>
          <span className="text-slate-500">
            Selected: <b className="text-slate-900">{selectedDefaulters.length}</b> / {defaulters.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Defaulters List Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Verified Defaulters List</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {defaulters.length} Students
              </span>
            </h4>
            {selectedDefaulters.length > 0 && (
              <span className="text-xs font-bold text-amber-700">
                GH₵ {selectedOutstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })} Selected
              </span>
            )}
          </div>

          {defaulters.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800">No Fee Defaulters Found</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All enrolled students in the selected classroom have settled their fees or no fee structure is billed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto divide-y divide-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr className="text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Guardian Contact</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.map(student => {
                    const isSelected = selectedStudentIds.has(student.studentId);
                    const isPreviewed = sampleStudent?.studentId === student.studentId;

                    return (
                      <tr 
                        key={student.studentId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-amber-50/30' : ''
                        } ${isPreviewed ? 'ring-1 ring-inset ring-teal-500' : ''}`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(student.studentId)}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{student.studentName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-mono">{student.admissionNumber}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                              {student.classroomName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{student.parentName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {student.isPhoneValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <Smartphone className="w-3 h-3 text-emerald-600" />
                                {student.normalizedPhone}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                {student.phoneError || 'Missing Phone'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-black text-rose-600 font-mono">
                            GH₵ {student.amountOwing.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            of GH₵ {student.amountToBePaid.toLocaleString('en-GH')}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setPreviewStudentId(student.studentId)}
                            title="Preview personalized SMS for this guardian"
                            className="p-1.5 hover:bg-teal-50 text-slate-500 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Message Composer & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Defaulter Broadcast Composer</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Sender: {settings.smsSenderId || school?.shortCode || 'SCHOOLOS'}
              </span>
            </div>

            {/* Quick Template Picker */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Pre-Configured Ghana Templates</label>
              <select
                onChange={e => {
                  const t = prebuiltTemplates.find(tpl => tpl.title === e.target.value);
                  if (t) setMessageTemplate(t.text);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Choose a Template...</option>
                {prebuiltTemplates.map(t => (
                  <option key={t.title} value={t.title}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Personalized Variable Insert Chips */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Dynamic Personalization Tags (Click to Insert)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['studentName', 'parentName', 'amountOwing', 'classroom', 'term', 'schoolName'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertVariable(tag)}
                    className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    +{`{${tag}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">Message Body Template *</label>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span>{segmentStats.charCount} chars</span>
                  <span>•</span>
                  <span className="font-bold text-teal-800">
                    {segmentStats.segments} {segmentStats.segments === 1 ? 'credit' : 'credits'}/recipient
                  </span>
                </div>
              </div>
              <textarea
                rows={5}
                required
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50 focus:bg-white leading-relaxed font-sans"
                placeholder="Compose defaulters reminder..."
              />
            </div>

            {/* Real-Time Live Message Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-teal-800">
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview: {sampleStudent?.studentName || 'Sample Student'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Arkesel Handset Preview</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed shadow-xs">
                {livePreviewText || 'Enter a message template to preview...'}
              </div>
            </div>

            {/* Summary & Cost Box */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-950 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Selected Defaulters:</span>
                <span className="text-teal-900">{selectedDefaulters.length} Guardians</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Estimated Credits Needed:</span>
                <span className="text-teal-900">{estimatedCredits} SMS Credits</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-teal-200/60">
                <span>Available School Balance:</span>
                <b>{currentSmsBalance} Credits</b>
              </div>
              {!isBalanceSufficient && (
                <div className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  Insufficient SMS balance! You need {estimatedCredits - currentSmsBalance} more credits.
                </div>
              )}
            </div>

            {/* Broadcast Action Button */}
            <button
              type="button"
              disabled={
                selectedDefaulters.length === 0 || 
                !messageTemplate.trim() || 
                !isBalanceSufficient ||
                isDispatching
              }
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast SMS to {selectedDefaulters.length} Defaulters</span>
            </button>
          </div>

          {/* Compliance Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Strict Multi-Tenant & NCA Compliance</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every SMS is processed with an authoritative idempotency key to prevent accidental duplicate dispatches. Phone numbers are automatically verified and converted to Ghanaian E.164 (+233) format.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL                                                        */}
      {/* ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Defaulters Broadcast</h3>
                <p className="text-xs text-slate-500">Institution: {school?.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Selected Guardians:</span>
                <b className="text-slate-900">{selectedDefaulters.length}</b>
              </div>
              <div className="flex justify-between">
                <span>Total Debt Targeted:</span>
                <b className="text-rose-600">GH₵ {selectedOutstanding.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</b>
              </div>
              <div className="flex justify-between">
                <span>Total SMS Credits to Consume:</span>
                <b className="text-teal-900">{estimatedCredits} Credits</b>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span>Remaining Balance After:</span>
                <b className="text-slate-900">{Math.max(0, currentSmsBalance - estimatedCredits)} Credits</b>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              This action will dispatch live SMS notifications to Ghanaian telecom networks via Arkesel. Transmissions cannot be cancelled once initiated.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBroadcast}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Authorize & Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE DISPATCH PROGRESS & RESULTS MODAL                                    */}
      {/* ========================================================================= */}
      {(isDispatching || broadcastResult) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                {isDispatching ? (
                  <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
                ) : broadcastResult?.failedCount === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isDispatching ? 'Transmitting Broadcast via Arkesel Gateway...' : 'Broadcast Dispatch Completed'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Broadcast ID: {broadcastResult?.broadcastId || 'Processing...'}
                  </p>
                </div>
              </div>

              {!isDispatching && (
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastResult(null);
                    setDispatchProgress(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {dispatchProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Progress: {dispatchProgress.current} of {dispatchProgress.total}</span>
                  <span>{Math.round((dispatchProgress.current / Math.max(1, dispatchProgress.total)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(dispatchProgress.current / Math.max(1, dispatchProgress.total)) * 100}%` }}
                  />
                </div>
                {isDispatching && (
                  <div className="text-[11px] text-slate-500 truncate">
                    Currently dispatching: <b className="text-slate-800">{dispatchProgress.currentStudentName}</b>
                  </div>
                )}
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Targeted</div>
                <div className="text-lg font-black text-slate-800">
                  {dispatchProgress?.total || broadcastResult?.totalRecipients || 0}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Gateway Submitted</div>
                <div className="text-lg font-black text-emerald-700">
                  {dispatchProgress?.submitted || broadcastResult?.submittedCount || 0}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase">Failed</div>
                <div className="text-lg font-black text-rose-700">
                  {dispatchProgress?.failed || broadcastResult?.failedCount || 0}
                </div>
              </div>
            </div>

            {/* Records List */}
            {broadcastResult && (
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-64">
                <div className="text-xs font-bold text-slate-700 mb-1">Dispatch Records ({broadcastResult.records.length})</div>
                {broadcastResult.records.map((rec, idx) => (
                  <div 
                    key={rec.dispatchId || idx}
                    className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{rec.studentName}</span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">({rec.phoneNumber})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Guardian: {rec.recipientName} • Due: GH₵ {rec.amountOwing}
                      </div>
                      {rec.errorMessage && (
                        <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                          Reason: {rec.errorMessage}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'SUBMITTED' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            {!isDispatching && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {broadcastResult && broadcastResult.failedCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleRetryFailed}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry {broadcastResult.failedCount} Failed Message{broadcastResult.failedCount > 1 ? 's' : ''}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBroadcastResult(null);
                    setDispatchProgress(null);
                    if (onSuccessNavigate) {
                      onSuccessNavigate('logs');
                    }
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
