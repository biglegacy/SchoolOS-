import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Teacher } from '../../types';
import { 
  GraduationCap, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck,
  Layers,
  Award
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatDate, formatGhanaCard, formatGhanaPhone } from '../../utils/formatting';

export const TeacherManagementView: React.FC = () => {
  const { teachers, classrooms, addTeacher } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    staffId: `STAFF/2026/${Math.floor(10 + Math.random() * 90)}`,
    ghanaCardNumber: '',
    qualification: "Bachelor of Education (B.Ed)",
    specialization: 'Mathematics & Science',
    assignedClassroomId: classrooms[0]?.id || '',
    subjectsTaught: 'Mathematics, Integrated Science, Computing',
  });

  const filteredTeachers = teachers.filter(t => {
    const name = `${t.firstName} ${t.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || 
      t.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialization.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classrooms.find(c => c.id === formData.assignedClassroomId);

    await addTeacher({
      staffId: formData.staffId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      ghanaCardNumber: formData.ghanaCardNumber ? formatGhanaCard(formData.ghanaCardNumber) : undefined,
      qualification: formData.qualification,
      specialization: formData.specialization,
      assignedClassroomId: selectedClass?.id,
      assignedClassroomName: selectedClass?.name,
      subjectsTaught: formData.subjectsTaught.split(',').map(s => s.trim()),
      employmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    setIsAddModalOpen(false);
    setActionSuccess(`Added teacher ${formData.firstName} ${formData.lastName} to faculty!`);
    setTimeout(() => setActionSuccess(null), 3500);

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      staffId: `STAFF/2026/${Math.floor(10 + Math.random() * 90)}`,
      ghanaCardNumber: '',
      qualification: "Bachelor of Education (B.Ed)",
      specialization: 'Mathematics & Science',
      assignedClassroomId: classrooms[0]?.id || '',
      subjectsTaught: 'Mathematics, Integrated Science, Computing',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Faculty & Teaching Staff</h2>
          <p className="text-xs text-gray-500">Manage GES certified instructors, classroom assignments, and subjects</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Teaching Staff</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by teacher name, staff ID, or specialization..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Teachers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {teacher.photoUrl ? (
                    <img src={teacher.photoUrl} alt={teacher.firstName} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center border border-teal-200 shrink-0">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono">{teacher.staffId}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> GES Certified
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {teacher.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatGhanaPhone(teacher.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-medium text-gray-800">{teacher.qualification}</span>
                </div>
                {teacher.assignedClassroomName && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-teal-700">Class Teacher: {teacher.assignedClassroomName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Subject Coverage</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(teacher.subjectsTaught || []).map((subj, idx) => (
                  <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TEACHER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Certified Instructor / Staff"
        subtitle="Record teacher qualification, contact details, and classroom assignments"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name / Surname *</label>
              <input
                type="text"
                required
                placeholder="e.g. Osei-Tutu"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="teacher@school.edu.gh"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (Ghana) *</label>
              <input
                type="tel"
                required
                placeholder="024 111 2233"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Staff ID *</label>
              <input
                type="text"
                required
                value={formData.staffId}
                onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ghana Card (GHA-XXXXXXXXX-X)</label>
              <input
                type="text"
                placeholder="GHA-123456789-0"
                value={formData.ghanaCardNumber}
                onChange={e => setFormData({ ...formData, ghanaCardNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Academic Qualification *</label>
              <input
                type="text"
                required
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Assign Class Teacher Role</label>
              <select
                value={formData.assignedClassroomId}
                onChange={e => setFormData({ ...formData, assignedClassroomId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No Class Assigned (Subject Teacher Only)</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Subjects Taught (comma-separated)</label>
            <input
              type="text"
              value={formData.subjectsTaught}
              onChange={e => setFormData({ ...formData, subjectsTaught: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Mathematics, Science, Ghanaian Language"
            />
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
              Save Faculty Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
