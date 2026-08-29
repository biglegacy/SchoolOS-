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
  HeartHandshake
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatGHS, formatDate, formatGhanaCard, formatGhanaPhone } from '../../utils/formatting';
import { GhanaFlagBadge } from '../common/EmptyState';

interface StudentManagementViewProps {
  onOpenReportModal?: (student: Student) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({ onOpenReportModal }) => {
  const { students, classrooms, addStudent, updateStudent, deleteStudent, getStudentFeeSummaries } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const feeSummaries = getStudentFeeSummaries();

  // New student form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '2015-05-10',
    gender: 'male' as 'male' | 'female',
    ghanaCardNumber: '',
    admissionNumber: `AMIA/2026/${Math.floor(100 + Math.random() * 900)}`,
    classroomId: classrooms[0]?.id || '',
    guardianName: '',
    guardianRelationship: 'Mother' as const,
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    medicalConditions: '',
    allergies: '',
    houseOrTeam: 'Aggrey House (Yellow)',
  });

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName} ${s.otherNames || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ghanaCardNumber && s.ghanaCardNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = classFilter === 'all' || s.currentClassroomId === classFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classrooms.find(c => c.id === formData.classroomId) || classrooms[0];

    await addStudent({
      admissionNumber: formData.admissionNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      otherNames: formData.otherNames || undefined,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      ghanaCardNumber: formData.ghanaCardNumber ? formatGhanaCard(formData.ghanaCardNumber) : undefined,
      currentClassroomId: selectedClass?.id || 'class_b4_gold',
      classroomName: selectedClass?.name || 'Basic 4 Gold',
      level: selectedClass?.level || 'Primary 4',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'active',
      guardians: [
        {
          name: formData.guardianName,
          relationship: formData.guardianRelationship,
          phone: formData.guardianPhone,
          email: formData.guardianEmail || undefined,
          occupation: formData.guardianOccupation || undefined,
          isPrimary: true,
        }
      ],
      medicalConditions: formData.medicalConditions || undefined,
      allergies: formData.allergies || undefined,
      emergencyContact: {
        name: formData.guardianName,
        phone: formData.guardianPhone,
      },
      houseOrTeam: formData.houseOrTeam,
    });

    setIsAddModalOpen(false);
    setActionSuccess(`Enrolled student ${formData.firstName} ${formData.lastName} successfully!`);
    setTimeout(() => setActionSuccess(null), 3500);

    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      otherNames: '',
      dateOfBirth: '2015-05-10',
      gender: 'male',
      ghanaCardNumber: '',
      admissionNumber: `AMIA/2026/${Math.floor(100 + Math.random() * 900)}`,
      classroomId: classrooms[0]?.id || '',
      guardianName: '',
      guardianRelationship: 'Mother',
      guardianPhone: '',
      guardianEmail: '',
      guardianOccupation: '',
      medicalConditions: '',
      allergies: '',
      houseOrTeam: 'Aggrey House (Yellow)',
    });
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
          <p className="text-xs text-gray-500">Official student records, Ghana Cards, guardians, and enrollments</p>
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
            placeholder="Search by student name, admission # or Ghana Card..."
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

                  {/* Middle row: Guardian, Phone, Fee Status */}
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
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Fee Balance</span>
                      {feeInfo ? (
                        <div>
                          <div className={`font-bold ${feeInfo.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatGHS(feeInfo.balance)}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                            feeInfo.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            feeInfo.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {feeInfo.status.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Ghana card and Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] font-mono text-gray-500">
                      {student.ghanaCardNumber ? (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-700">
                          {student.ghanaCardNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">Card unlinked</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedStudent(student)}
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
                <th className="px-4 py-3">Gender / DOB</th>
                <th className="px-4 py-3">Primary Guardian</th>
                <th className="px-4 py-3">Fee Balance</th>
                <th className="px-4 py-3">Ghana Card</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredStudents.map(student => {
                const feeInfo = feeSummaries.find(f => f.studentId === student.id);
                const primaryGuardian = student.guardians[0];

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
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="capitalize text-gray-800">{student.gender}</div>
                      <div className="text-[11px] text-gray-400">{formatDate(student.dateOfBirth)}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-800">{primaryGuardian?.name || '—'}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-600" />
                        <span>{primaryGuardian?.phone ? formatGhanaPhone(primaryGuardian.phone) : '—'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {feeInfo ? (
                        <div>
                          <div className={`font-bold ${feeInfo.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatGHS(feeInfo.balance)}
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            feeInfo.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            feeInfo.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {feeInfo.status.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {student.ghanaCardNumber ? (
                        <span className="font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {student.ghanaCardNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.firstName} ${selectedStudent.lastName}`}
          subtitle={`Admission ID: ${selectedStudent.admissionNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
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

            {/* Ghana Card & Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 uppercase font-bold text-[10px]">National ID (Ghana Card)</span>
                <div className="font-mono font-bold text-gray-900">
                  {selectedStudent.ghanaCardNumber || 'Not Registered'}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
                <span className="text-gray-500 uppercase font-bold text-[10px]">Admission Date</span>
                <div className="font-bold text-gray-900">{formatDate(selectedStudent.admissionDate)}</div>
              </div>
            </div>

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
        </Modal>
      )}

      {/* ADMIT STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Admit New Student to School"
        subtitle="Complete student biodata, Ghana Card, and Guardian Information"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateStudent} className="space-y-5">
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
                onChange={e => setFormData({ ...formData, classroomId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ghana Card (GHA-XXXXXXXXX-X)</label>
              <input
                type="text"
                placeholder="GHA-712894102-4"
                value={formData.ghanaCardNumber}
                onChange={e => setFormData({ ...formData, ghanaCardNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
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
