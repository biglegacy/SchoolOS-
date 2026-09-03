import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Student, Classroom } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  GraduationCap, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  HeartHandshake,
  Edit2,
  Save,
  X,
  UserCheck
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatGHS, formatDate, formatGhanaPhone } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

interface StudentManagementViewProps {
  onOpenReportModal?: (student: Student) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({ onOpenReportModal }) => {
  const { school, students, classrooms, feeStructures = [], schoolUsers = [], addStudent, updateStudent, deleteStudent, getStudentFeeSummaries } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Student> & { parentIds?: string[] }>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const registeredParents = schoolUsers.filter(u => u.role === 'parent');

  const feeSummaries = getStudentFeeSummaries();

  const generateStudentId = () => {
    const prefix = school?.shortCode || 'SCH';
    const year = new Date().getFullYear();
    const count = students.length + 1;
    return `${prefix}/${year}/${String(count).padStart(3, '0')}`;
  };

  // Default fee for initial classroom
  const getInitialClassFee = (classId?: string) => {
    const cid = classId || classrooms[0]?.id;
    if (!cid) return '';
    const matched = feeStructures.find(f => f.classroomId === cid) || feeStructures.find(f => !f.classroomId);
    return matched ? String(matched.totalAmount) : '';
  };

  // New student form state - only ID generated, no hardcoded sample values
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    feesAmount: getInitialClassFee(),
    admissionNumber: generateStudentId(),
    classroomId: classrooms[0]?.id || '',
    guardianName: '',
    guardianRelationship: 'Mother' as const,
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    medicalConditions: '',
    allergies: '',
    houseOrTeam: '',
    parentIds: [] as string[],
  });

  const handleClassChange = (newClassId: string) => {
    const matchedFee = feeStructures.find(f => f.classroomId === newClassId) || feeStructures.find(f => !f.classroomId);
    setFormData(prev => ({
      ...prev,
      classroomId: newClassId,
      feesAmount: prev.feesAmount !== '' && prev.feesAmount !== undefined ? prev.feesAmount : (matchedFee ? String(matchedFee.totalAmount) : '0.00')
    }));
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName} ${s.otherNames || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = classFilter === 'all' || s.currentClassroomId === classFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate Fees Amount
    const parsedFee = parseFloat(formData.feesAmount);
    if (isNaN(parsedFee) || parsedFee < 0) {
      setFormError('Please enter a valid non-negative fees amount (e.g. 1500.00).');
      return;
    }

    const selectedClass = classrooms.find(c => c.id === formData.classroomId) || classrooms[0];

    await addStudent({
      admissionNumber: formData.admissionNumber || generateStudentId(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      otherNames: formData.otherNames.trim() || undefined,
      dateOfBirth: formData.dateOfBirth || '',
      gender: formData.gender,
      feesAmount: Number(parsedFee.toFixed(2)),
      academicYear: selectedClass?.academicYear || school?.currentAcademicYear || '2026/2027',
      term: selectedClass?.term || school?.currentTerm || 'Term 3',
      currentClassroomId: selectedClass?.id || '',
      classroomName: selectedClass?.name || 'Unassigned',
      level: selectedClass?.level || '',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'active',
      parentId: formData.parentIds.length > 0 ? formData.parentIds[0] : undefined,
      parentIds: formData.parentIds,
      guardians: formData.guardianName ? [
        {
          name: formData.guardianName.trim(),
          relationship: formData.guardianRelationship,
          phone: formData.guardianPhone.trim(),
          email: formData.guardianEmail.trim() || undefined,
          occupation: formData.guardianOccupation.trim() || undefined,
          isPrimary: true,
        }
      ] : [],
      medicalConditions: formData.medicalConditions.trim() || undefined,
      allergies: formData.allergies.trim() || undefined,
      emergencyContact: formData.guardianName ? {
        name: formData.guardianName.trim(),
        phone: formData.guardianPhone.trim(),
      } : undefined,
      houseOrTeam: formData.houseOrTeam.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setActionSuccess(`Enrolled student ${formData.firstName} ${formData.lastName} successfully with assigned fee of ${formatGHS(parsedFee)}!`);
    setTimeout(() => setActionSuccess(null), 3500);

    // Reset form cleanly
    setFormData({
      firstName: '',
      lastName: '',
      otherNames: '',
      dateOfBirth: '',
      gender: 'male',
      feesAmount: getInitialClassFee(classrooms[0]?.id),
      admissionNumber: generateStudentId(),
      classroomId: classrooms[0]?.id || '',
      guardianName: '',
      guardianRelationship: 'Mother',
      guardianPhone: '',
      guardianEmail: '',
      guardianOccupation: '',
      medicalConditions: '',
      allergies: '',
      houseOrTeam: '',
      parentIds: [],
    });
  };

  const startEditStudent = (student: Student) => {
    setSelectedStudent(student);
    const existingParents = student.parentIds || (student.parentId ? [student.parentId] : []);
    setEditFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      otherNames: student.otherNames || '',
      currentClassroomId: student.currentClassroomId,
      feesAmount: student.feesAmount ?? feeStructures.find(f => f.classroomId === student.currentClassroomId)?.totalAmount ?? 0,
      houseOrTeam: student.houseOrTeam || '',
      medicalConditions: student.medicalConditions || '',
      allergies: student.allergies || '',
      parentIds: existingParents,
    });
    setIsEditingInModal(true);
  };

  const handleSaveStudentEdit = async () => {
    if (!selectedStudent) return;
    const selectedClass = classrooms.find(c => c.id === editFormData.currentClassroomId);
    
    const updatedFeeAmount = editFormData.feesAmount !== undefined ? Number(editFormData.feesAmount) : selectedStudent.feesAmount;
    if (updatedFeeAmount !== undefined && (isNaN(updatedFeeAmount) || updatedFeeAmount < 0)) {
      alert('Please enter a valid non-negative fees amount.');
      return;
    }

    const currentParents = editFormData.parentIds !== undefined 
      ? editFormData.parentIds 
      : (selectedStudent.parentIds || (selectedStudent.parentId ? [selectedStudent.parentId] : []));

    const payload: Partial<Student> = {
      firstName: editFormData.firstName?.trim() || selectedStudent.firstName,
      lastName: editFormData.lastName?.trim() || selectedStudent.lastName,
      otherNames: editFormData.otherNames?.trim() || undefined,
      currentClassroomId: selectedClass?.id || selectedStudent.currentClassroomId,
      classroomName: selectedClass?.name || selectedStudent.classroomName,
      level: selectedClass?.level || selectedStudent.level,
      feesAmount: updatedFeeAmount !== undefined ? Number(updatedFeeAmount.toFixed(2)) : undefined,
      houseOrTeam: editFormData.houseOrTeam?.trim() || undefined,
      medicalConditions: editFormData.medicalConditions?.trim() || undefined,
      allergies: editFormData.allergies?.trim() || undefined,
      parentId: currentParents[0] || undefined,
      parentIds: currentParents,
    };

    await updateStudent(selectedStudent.id, payload);
    setSelectedStudent({ ...selectedStudent, ...payload });
    setIsEditingInModal(false);
    setActionSuccess(`Updated student profile for ${payload.firstName} ${payload.lastName}.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to withdraw/delete student ${name}?`)) {
      await deleteStudent(id);
      setSelectedStudent(null);
      setActionSuccess(`Student record for ${name} removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Student Directory & Admissions</h2>
          <p className="text-xs text-gray-500">Official student records, fee billing, guardians, and enrollments</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Admit New Student</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or admission #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Class:</span>
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Classes ({students.length})</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Student List View (Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Mobile Card List (Hidden on tablet/desktop) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 font-medium">
              No students found matching your search or filter.
            </div>
          ) : (
            filteredStudents.map(student => {
              const feeInfo = feeSummaries.find(f => f.studentId === student.id);
              const primaryGuardian = student.guardians[0];
              const amountToBePaid = feeInfo?.amountToBePaid ?? feeInfo?.totalBilled ?? student.feesAmount ?? 0;
              const amountPaid = feeInfo?.amountPaid ?? feeInfo?.totalPaid ?? 0;
              const amountOwing = feeInfo?.amountOwing ?? feeInfo?.balance ?? Math.max(0, amountToBePaid - amountPaid);
              const paymentStatus = feeInfo?.paymentStatus || (amountOwing <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid');

              return (
                <div key={student.id} className="p-4 space-y-3">
                  {/* Top row: Avatar, Name, Admission #, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.firstName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          {student.firstName} {student.lastName} {student.otherNames || ''}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {student.admissionNumber}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      {student.classroomName}
                    </span>
                  </div>

                  {/* Middle row: Guardian & Fee Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Guardian</span>
                      <div className="font-semibold text-gray-800 truncate">{primaryGuardian?.name || '—'}</div>
                      {primaryGuardian?.phone && (
                        <a 
                          href={`tel:${primaryGuardian.phone}`}
                          className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-teal-600" />
                          <span>{formatGhanaPhone(primaryGuardian.phone)}</span>
                        </a>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Amount Owing</span>
                      <div>
                        <div className={`font-black ${amountOwing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatGHS(amountOwing)}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                          paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: Assigned Fee Breakdown & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    <div className="text-[11px] text-gray-500">
                      <span className="text-gray-400">Fee:</span> <span className="font-bold text-gray-800">{formatGHS(amountToBePaid)}</span>
                      <span className="mx-1 text-gray-300">•</span>
                      <span className="text-gray-400">Paid:</span> <span className="font-bold text-emerald-600">{formatGHS(amountPaid)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelectedStudent(student); setIsEditingInModal(false); }}
                        className="px-2.5 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                      {onOpenReportModal && (
                        <button
                          onClick={() => onOpenReportModal(student)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors min-h-[36px]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Withdraw Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                <th className="px-4 py-3">Primary Guardian</th>
                <th className="px-4 py-3">Amount to Be Paid</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Amount Owing / Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-gray-500 font-medium bg-gray-50/50">
                    No students found matching your search or filter. Click &quot;Admit New Student&quot; to enroll pupils.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const feeInfo = feeSummaries.find(f => f.studentId === student.id);
                  const primaryGuardian = student.guardians[0];
                  const amountToBePaid = feeInfo?.amountToBePaid ?? feeInfo?.totalBilled ?? student.feesAmount ?? 0;
                  const amountPaid = feeInfo?.amountPaid ?? feeInfo?.totalPaid ?? 0;
                  const amountOwing = feeInfo?.amountOwing ?? feeInfo?.balance ?? Math.max(0, amountToBePaid - amountPaid);
                  const pStatus = feeInfo?.paymentStatus || (amountOwing <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid');

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.firstName} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {student.firstName} {student.lastName} {student.otherNames || ''}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              {student.admissionNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {student.classroomName}
                        </span>
                        <div className="text-[11px] text-gray-400 capitalize mt-0.5">{student.gender} • {formatDate(student.dateOfBirth)}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-800">{primaryGuardian?.name || '—'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-600" />
                          <span>{primaryGuardian?.phone ? formatGhanaPhone(primaryGuardian.phone) : '—'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-gray-900 font-mono">
                        {formatGHS(amountToBePaid)}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-700 font-mono">
                        {formatGHS(amountPaid)}
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <div className={`font-black ${amountOwing > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatGHS(amountOwing)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          pStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          pStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {pStatus}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedStudent(student); setIsEditingInModal(false); }}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditStudent(student)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Student Info & Fees"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onOpenReportModal && (
                            <button
                              onClick={() => onOpenReportModal(student)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Generate Terminal Report"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Withdraw Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT DETAIL & EDIT MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => { setSelectedStudent(null); setIsEditingInModal(false); }}
          title={isEditingInModal ? `Edit Student: ${selectedStudent.firstName} ${selectedStudent.lastName}` : `Student Profile: ${selectedStudent.firstName} ${selectedStudent.lastName}`}
          subtitle={`Admission ID: ${selectedStudent.admissionNumber}`}
          maxWidth="2xl"
        >
          {isEditingInModal ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editFormData.firstName || ''}
                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name / Surname *</label>
                  <input
                    type="text"
                    value={editFormData.lastName || ''}
                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Other Names</label>
                  <input
                    type="text"
                    value={editFormData.otherNames || ''}
                    onChange={e => setEditFormData({ ...editFormData, otherNames: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Classroom Stream</label>
                  <select
                    value={editFormData.currentClassroomId || selectedStudent.currentClassroomId}
                    onChange={e => setEditFormData({ ...editFormData, currentClassroomId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-xs font-medium"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fees Amount Edit Field */}
              <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200 space-y-1">
                <label className="block text-xs font-bold text-teal-900">
                  Applicable Fees Amount (GHS ₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 font-bold text-xs">
                    GH₵
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFormData.feesAmount !== undefined ? editFormData.feesAmount : ''}
                    onChange={e => setEditFormData({ ...editFormData, feesAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-3 py-2 text-xs border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-gray-900 bg-white"
                  />
                </div>
                <p className="text-[10px] text-teal-700">
                  Modifying this automatically updates the student&apos;s Amount to Be Paid and recomputes balance owing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">House / Sports Team</label>
                  <input
                    type="text"
                    value={editFormData.houseOrTeam || ''}
                    onChange={e => setEditFormData({ ...editFormData, houseOrTeam: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={editFormData.medicalConditions || ''}
                    onChange={e => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>

              {/* Linked Parent Portal Accounts */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Linked Parent Portal Accounts</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {editFormData.parentIds?.length || 0} Account(s) Linked
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Explicitly select which registered parent portal accounts can view and manage this student.
                </p>
                {registeredParents.length === 0 ? (
                  <p className="text-xs text-amber-700 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No registered parent accounts found in this school yet. Create parent accounts in the Portals tab.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {registeredParents.map(parent => {
                      const isLinked = editFormData.parentIds?.includes(parent.id);
                      return (
                        <label
                          key={parent.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isLinked
                              ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isLinked}
                              onChange={(e) => {
                                const current = editFormData.parentIds || [];
                                const updated = e.target.checked
                                  ? [...current, parent.id]
                                  : current.filter(id => id !== parent.id);
                                setEditFormData({ ...editFormData, parentIds: updated });
                              }}
                              className="w-3.5 h-3.5 text-teal-600 rounded"
                            />
                            <div>
                              <span className="font-bold">{parent.fullName}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({parent.email})</span>
                            </div>
                          </div>
                          {parent.phone && (
                            <span className="text-[10px] text-slate-500">{parent.phone}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditingInModal(false)}
                  className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentEdit}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-4">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt={selectedStudent.firstName} className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-xs shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                      {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.otherNames || ''}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                      <span className="font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                        {selectedStudent.classroomName}
                      </span>
                      <span>•</span>
                      <span>{selectedStudent.gender.toUpperCase()}</span>
                      <span>•</span>
                      <span>DOB: {formatDate(selectedStudent.dateOfBirth)}</span>
                    </div>
                    {selectedStudent.houseOrTeam && (
                      <p className="text-xs text-gray-500 font-medium">House: {selectedStudent.houseOrTeam}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => startEditStudent(selectedStudent)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:border-teal-500 hover:text-teal-700 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Enrollment & Assigned Fees Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
                  <span className="text-gray-500 uppercase font-bold text-[10px]">Assigned Term Fee</span>
                  <div className="font-mono font-bold text-teal-700 text-sm">
                    {formatGHS(selectedStudent.feesAmount ?? feeSummaries.find(f => f.studentId === selectedStudent.id)?.amountToBePaid ?? 0)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
                  <span className="text-gray-500 uppercase font-bold text-[10px]">Admission Date</span>
                  <div className="font-bold text-gray-900">{formatDate(selectedStudent.admissionDate)}</div>
                </div>
              </div>

              {/* Financial Status Summary */}
              {(() => {
                const fSummary = feeSummaries.find(f => f.studentId === selectedStudent.id);
                const toPay = fSummary?.amountToBePaid ?? fSummary?.totalBilled ?? selectedStudent.feesAmount ?? 0;
                const paid = fSummary?.amountPaid ?? fSummary?.totalPaid ?? 0;
                const owing = fSummary?.amountOwing ?? fSummary?.balance ?? Math.max(0, toPay - paid);
                const pStatus = fSummary?.paymentStatus || (owing <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid');

                return (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Financial / Fee Statement</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        pStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        pStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {pStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Amount to Be Paid</span>
                        <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{formatGHS(toPay)}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase">Amount Paid</span>
                        <span className="text-xs font-black text-emerald-700 font-mono mt-0.5 block">{formatGHS(paid)}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${owing > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <span className={`text-[10px] font-bold block uppercase ${owing > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>Amount Owing</span>
                        <span className={`text-xs font-black font-mono mt-0.5 block ${owing > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{formatGHS(owing)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Guardian Contacts */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-teal-600" />
                  <span>Parent / Guardian Contacts</span>
                </h5>
                <div className="space-y-2">
                  {selectedStudent.guardians.map((g, idx) => (
                    <div key={idx} className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{g.name} ({g.relationship})</span>
                        {g.isPrimary && <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">PRIMARY</span>}
                      </div>
                      <div className="text-gray-600">Phone: {formatGhanaPhone(g.phone)}</div>
                      {g.email && <div className="text-gray-600">Email: {g.email}</div>}
                      {g.occupation && <div className="text-gray-500">Occupation: {g.occupation}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Parent Portal Accounts */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Linked Parent Portal Accounts</span>
                </h5>
                {(() => {
                  const studentParentIds = selectedStudent.parentIds || (selectedStudent.parentId ? [selectedStudent.parentId] : []);
                  const linkedParents = registeredParents.filter(p => studentParentIds.includes(p.id));

                  if (linkedParents.length === 0) {
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center justify-between">
                        <span>No registered Parent Portal accounts linked yet.</span>
                        <button
                          onClick={() => startEditStudent(selectedStudent)}
                          className="text-teal-700 font-bold hover:underline"
                        >
                          Link Parent
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {linkedParents.map(p => (
                        <div key={p.id} className="p-3 bg-teal-50/70 rounded-lg border border-teal-200 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-teal-950 flex items-center gap-1.5">
                              <span>{p.fullName}</span>
                              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">PORTAL ACCESS ENABLED</span>
                            </div>
                            <div className="text-[11px] text-teal-700 font-mono mt-0.5">{p.email}</div>
                          </div>
                          {p.phone && <div className="text-xs text-teal-800 font-medium">{p.phone}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Medical Info */}
              {(selectedStudent.medicalConditions || selectedStudent.allergies) && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1 text-red-900">
                  <div className="font-bold flex items-center gap-1 text-red-950">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Medical Alert & Allergies</span>
                  </div>
                  {selectedStudent.medicalConditions && <p><b>Conditions:</b> {selectedStudent.medicalConditions}</p>}
                  {selectedStudent.allergies && <p><b>Allergies:</b> {selectedStudent.allergies}</p>}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ADMIT STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Admit New Student to School"
        subtitle="Complete student biodata, fee billing structure, and guardian information"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-5">
          {formError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kwame"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name / Surname *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mensah"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Other Names (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Kofi Annan"
                value={formData.otherNames}
                onChange={e => setFormData({ ...formData, otherNames: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Gender *</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Admission Number *</label>
              <input
                type="text"
                required
                value={formData.admissionNumber}
                onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Classroom Stream *</label>
              <select
                value={formData.classroomId}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>

            {/* FEES AMOUNT INPUT (Ghanaian Cedi) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Fees Amount (GHS ₵) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                  GH₵
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.feesAmount}
                  onChange={e => setFormData({ ...formData, feesAmount: e.target.value })}
                  className="w-full pl-12 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-gray-900"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Total fee assigned for current term billing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">House / Sports Team</label>
              <input
                type="text"
                placeholder="e.g. Aggrey House (Yellow)"
                value={formData.houseOrTeam}
                onChange={e => setFormData({ ...formData, houseOrTeam: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Registered Parent Linking Section */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Link Registered Parent Account (Optional)</span>
              </h4>
              {formData.parentIds.length > 0 && (
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                  {formData.parentIds.length} Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Select existing registered parent portal accounts. Selecting will also auto-fill guardian contact fields below.
            </p>
            {registeredParents.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {registeredParents.map(parent => {
                  const isChecked = formData.parentIds.includes(parent.id);
                  return (
                    <label
                      key={parent.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-teal-50 border-teal-300 text-teal-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...formData.parentIds, parent.id]
                              : formData.parentIds.filter(id => id !== parent.id);

                            // Auto-populate guardian details if currently empty
                            const newGuardianName = !formData.guardianName && e.target.checked ? parent.fullName : formData.guardianName;
                            const newGuardianPhone = !formData.guardianPhone && e.target.checked && parent.phone ? parent.phone : formData.guardianPhone;
                            const newGuardianEmail = !formData.guardianEmail && e.target.checked && parent.email ? parent.email : formData.guardianEmail;

                            setFormData({
                              ...formData,
                              parentIds: updated,
                              guardianName: newGuardianName,
                              guardianPhone: newGuardianPhone,
                              guardianEmail: newGuardianEmail,
                            });
                          }}
                          className="w-3.5 h-3.5 text-teal-600 rounded"
                        />
                        <div>
                          <span>{parent.fullName}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({parent.email})</span>
                        </div>
                      </div>
                      {parent.phone && (
                        <span className="text-[10px] text-slate-500">{parent.phone}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No parent portal accounts registered in this school yet.</p>
            )}
          </div>

          {/* Primary Guardian Section */}
          <div className="pt-3 border-t border-gray-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-teal-600" />
              <span>Primary Parent / Guardian Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Guardian Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nana Aba Boateng"
                  value={formData.guardianName}
                  onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Relationship to Student *</label>
                <select
                  value={formData.guardianRelationship}
                  onChange={e => setFormData({ ...formData, guardianRelationship: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Legal Guardian</option>
                  <option value="Sibling">Elder Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Guardian Phone (SMS Alerts) *</label>
                <input
                  type="tel"
                  required
                  placeholder="024 555 9876"
                  value={formData.guardianPhone}
                  onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Guardian Email (Optional)</label>
                <input
                  type="email"
                  placeholder="guardian@example.com"
                  value={formData.guardianEmail}
                  onChange={e => setFormData({ ...formData, guardianEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
            >
              Admit & Save Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
