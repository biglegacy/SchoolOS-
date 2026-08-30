import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Teacher, TeacherSubjectAssignment } from '../../types';
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
  Award, 
  UserCheck,
  Plus,
  Trash2,
  Settings,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatDate, formatGhanaCard, formatGhanaPhone } from '../../utils/formatting';

export const TeacherManagementView: React.FC = () => {
  const { teachers, classrooms, subjects, addTeacher, updateTeacher } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Assignment temp state in Assign Modal
  const [newSubjName, setNewSubjName] = useState('');
  const [newClassId, setNewClassId] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    staffId: '',
    ghanaCardNumber: '',
    qualification: '',
    specialization: '',
    assignedClassroomId: '',
    subjectsTaught: '',
  });

  const filteredTeachers = teachers.filter(t => {
    const name = `${t.firstName} ${t.lastName}`.toLowerCase();
    const subjs = (t.subjectsTaught || []).join(' ').toLowerCase();
    const assignedSubjs = (t.assignedSubjects || []).map(a => `${a.subjectName} ${a.classroomName}`).join(' ').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || 
      t.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjs.includes(searchTerm.toLowerCase()) ||
      assignedSubjs.includes(searchTerm.toLowerCase());
  });

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classrooms.find(c => c.id === formData.assignedClassroomId);
    const subjs = formData.subjectsTaught ? formData.subjectsTaught.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Construct initial assignments if subject + class provided
    const initialAssignments: TeacherSubjectAssignment[] = [];
    if (selectedClass && subjs.length > 0) {
      subjs.forEach(s => {
        initialAssignments.push({
          id: `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          subjectName: s,
          classroomId: selectedClass.id,
          classroomName: selectedClass.name
        });
      });
    }

    await addTeacher({
      staffId: formData.staffId || `STAFF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      ghanaCardNumber: formData.ghanaCardNumber ? formatGhanaCard(formData.ghanaCardNumber) : undefined,
      qualification: formData.qualification.trim() || 'Teacher Certificate',
      specialization: formData.specialization.trim() || 'General Subject Instructor',
      assignedClassroomId: selectedClass?.id,
      assignedClassroomName: selectedClass?.name,
      assignedClassroomIds: selectedClass ? [selectedClass.id] : [],
      subjectsTaught: subjs,
      assignedSubjects: initialAssignments,
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
      staffId: '',
      ghanaCardNumber: '',
      qualification: '',
      specialization: '',
      assignedClassroomId: '',
      subjectsTaught: '',
    });
  };

  const openAssignModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setNewSubjName(subjects[0]?.name || '');
    setNewClassId(classrooms[0]?.id || '');
    setIsAssignModalOpen(true);
  };

  const handleAddAssignment = async () => {
    if (!editingTeacher || !newSubjName || !newClassId) return;
    const targetClass = classrooms.find(c => c.id === newClassId);
    if (!targetClass) return;

    const currentAssignments = editingTeacher.assignedSubjects || [];
    
    // Check if already assigned
    const exists = currentAssignments.some(
      a => a.subjectName.toLowerCase() === newSubjName.toLowerCase() && a.classroomId === newClassId
    );
    if (exists) return;

    const newAssignment: TeacherSubjectAssignment = {
      id: `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subjectName: newSubjName.trim(),
      classroomId: targetClass.id,
      classroomName: targetClass.name
    };

    const updatedAssignments = [...currentAssignments, newAssignment];
    const uniqueClassIds = Array.from(new Set([
      ...(editingTeacher.assignedClassroomIds || []),
      ...updatedAssignments.map(a => a.classroomId)
    ]));
    const uniqueSubjects = Array.from(new Set([
      ...(editingTeacher.subjectsTaught || []),
      ...updatedAssignments.map(a => a.subjectName)
    ]));

    await updateTeacher(editingTeacher.id, {
      assignedSubjects: updatedAssignments,
      assignedClassroomIds: uniqueClassIds,
      subjectsTaught: uniqueSubjects
    });

    setEditingTeacher({
      ...editingTeacher,
      assignedSubjects: updatedAssignments,
      assignedClassroomIds: uniqueClassIds,
      subjectsTaught: uniqueSubjects
    });

    setActionSuccess(`Assigned ${newSubjName} in ${targetClass.name} to ${editingTeacher.firstName}!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRemoveAssignment = async (assignmentIndex: number) => {
    if (!editingTeacher) return;
    const currentAssignments = [...(editingTeacher.assignedSubjects || [])];
    const removed = currentAssignments.splice(assignmentIndex, 1)[0];

    const uniqueClassIds = Array.from(new Set(currentAssignments.map(a => a.classroomId)));
    if (editingTeacher.assignedClassroomId) {
      uniqueClassIds.push(editingTeacher.assignedClassroomId);
    }
    const uniqueSubjects = Array.from(new Set(currentAssignments.map(a => a.subjectName)));

    await updateTeacher(editingTeacher.id, {
      assignedSubjects: currentAssignments,
      assignedClassroomIds: uniqueClassIds,
      subjectsTaught: uniqueSubjects
    });

    setEditingTeacher({
      ...editingTeacher,
      assignedSubjects: currentAssignments,
      assignedClassroomIds: uniqueClassIds,
      subjectsTaught: uniqueSubjects
    });

    setActionSuccess(`Removed assignment for ${removed?.subjectName || 'subject'}!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleUpdateFormTutor = async (classroomId: string) => {
    if (!editingTeacher) return;
    const selectedClass = classrooms.find(c => c.id === classroomId);
    
    await updateTeacher(editingTeacher.id, {
      assignedClassroomId: selectedClass?.id,
      assignedClassroomName: selectedClass?.name,
    });

    setEditingTeacher({
      ...editingTeacher,
      assignedClassroomId: selectedClass?.id,
      assignedClassroomName: selectedClass?.name,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Faculty & Subject Teachers</h2>
          <p className="text-xs text-gray-500">Configure subject specializations, classroom allocations, and teaching loads</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
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
            placeholder="Search by teacher name, staff ID, subject, or assigned classroom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Teachers Grid Cards */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Teaching Staff Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No instructors match your search criteria. Click &quot;Add Teaching Staff&quot; above to register faculty members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map(teacher => {
            const assignments = teacher.assignedSubjects || [];
            // Group assignments by Subject
            const subjectMap: { [subj: string]: string[] } = {};
            assignments.forEach(a => {
              if (!subjectMap[a.subjectName]) subjectMap[a.subjectName] = [];
              if (!subjectMap[a.subjectName].includes(a.classroomName)) {
                subjectMap[a.subjectName].push(a.classroomName);
              }
            });

            return (
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
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{formatGhanaPhone(teacher.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-medium text-gray-800">{teacher.qualification}</span>
                    </div>
                    {teacher.assignedClassroomName && (
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-semibold text-teal-700">Form Tutor: {teacher.assignedClassroomName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject & Classroom Assignments Section */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Teaching Load ({assignments.length} assignments)</span>
                    </div>
                  </div>

                  {Object.keys(subjectMap).length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {Object.entries(subjectMap).map(([subj, classList]) => (
                        <div key={subj} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-xs">
                          <span className="font-bold text-slate-800 block text-[11px]">{subj}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {classList.map((cName, idx) => (
                              <span key={idx} className="text-[10px] bg-white border border-teal-200 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                                {cName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg p-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>No subject-classroom assignments yet.</span>
                    </div>
                  )}

                  <button
                    onClick={() => openAssignModal(teacher)}
                    className="w-full mt-2 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-700" />
                    <span>Manage Subject & Class Allocations</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MANAGE TEACHING ASSIGNMENTS MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Teaching Allocations: ${editingTeacher?.firstName} ${editingTeacher?.lastName}`}
        subtitle={`Staff ID: ${editingTeacher?.staffId || '—'} • Assign subjects across multiple classrooms`}
        maxWidth="2xl"
      >
        {editingTeacher && (
          <div className="space-y-5">
            {/* Form Master Role Assignment */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-teal-900">
                Form Master / Class Teacher Role (Optional)
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={editingTeacher.assignedClassroomId || ''}
                  onChange={e => handleUpdateFormTutor(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-teal-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">No Class Master Role (Subject Teacher Only)</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-teal-700">
                Class Masters hold administrative oversight for their specific home room stream and terminal reports.
              </p>
            </div>

            {/* Add New Subject Assignment */}
            <div className="border border-gray-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Add Subject & Classroom Allocation</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Subject *</label>
                  {subjects.length > 0 ? (
                    <select
                      value={newSubjName}
                      onChange={e => setNewSubjName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Curriculum Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.code || s.category})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Mathematics, Science"
                      value={newSubjName}
                      onChange={e => setNewSubjName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Classroom *</label>
                  <select
                    value={newClassId}
                    onChange={e => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Classroom</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddAssignment}
                    disabled={!newSubjName || !newClassId}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Allocations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Teaching Load ({(editingTeacher.assignedSubjects || []).length})</span>
                <span className="text-[11px] text-gray-500 normal-case font-normal">Active assignments for this instructor</span>
              </h4>

              {(editingTeacher.assignedSubjects || []).length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-xs text-gray-500">
                  No subjects or classrooms allocated to this teacher yet. Use the form above to assign a subject and class.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {(editingTeacher.assignedSubjects || []).map((asgn, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{asgn.subjectName}</div>
                          <div className="text-[11px] text-teal-700 font-medium">{asgn.classroomName}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD TEACHER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Certified Instructor / Faculty Member"
        subtitle="Record teacher qualification, contact details, and initial classroom assignments"
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
                placeholder="e.g. STAFF/2026/042"
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
                placeholder="e.g. B.Ed Mathematics, Diploma in Basic Education"
                value={formData.qualification}
                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Assign Form Master / Class Teacher Role</label>
              <select
                value={formData.assignedClassroomId}
                onChange={e => setFormData({ ...formData, assignedClassroomId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No Class Master Role (Subject Teacher Only)</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Initial Subjects Taught (comma-separated)</label>
            <input
              type="text"
              value={formData.subjectsTaught}
              onChange={e => setFormData({ ...formData, subjectsTaught: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Mathematics, Integrated Science"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              You can configure specific multi-classroom teaching allocations immediately after creating the teacher profile.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Save Faculty Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

