import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { Classroom } from '../../types';
import { 
  Layers, 
  Plus, 
  Users, 
  UserCheck, 
  BookOpen, 
  CheckCircle2, 
  Building,
  GraduationCap
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const ClassroomManagementView: React.FC = () => {
  const { classrooms, teachers, students, addClassroom } = useSchool();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    level: 'Primary 5',
    stream: 'Gold',
    capacity: 40,
    roomNumber: 'Block C - Room 104',
    classTeacherId: teachers[0]?.id || '',
    subjects: 'English Language, Mathematics, Integrated Science, Ghanaian Language (Twi), Our World Our People (OWOP), Religious and Moral Education (RME), Creative Arts and Design, Computing',
  });

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTeacher = teachers.find(t => t.id === formData.classTeacherId);

    await addClassroom({
      name: formData.name || `${formData.level} ${formData.stream}`,
      level: formData.level,
      stream: formData.stream,
      academicYear: '2026/2027',
      capacity: Number(formData.capacity) || 35,
      roomNumber: formData.roomNumber,
      classTeacherId: assignedTeacher?.id,
      classTeacherName: assignedTeacher ? `${assignedTeacher.firstName} ${assignedTeacher.lastName}` : undefined,
      subjects: formData.subjects.split(',').map(s => s.trim()),
    });

    setIsAddModalOpen(false);
    setActionSuccess(`Classroom ${formData.name || `${formData.level} ${formData.stream}`} created successfully!`);
    setTimeout(() => setActionSuccess(null), 3500);

    setFormData({
      name: '',
      level: 'Primary 5',
      stream: 'Gold',
      capacity: 40,
      roomNumber: 'Block C - Room 104',
      classTeacherId: teachers[0]?.id || '',
      subjects: 'English Language, Mathematics, Integrated Science, Ghanaian Language (Twi), Our World Our People (OWOP), Religious and Moral Education (RME), Creative Arts and Design, Computing',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Classrooms & Academic Streams</h2>
          <p className="text-xs text-gray-500">Class capacity, assigned class tutors, and GES subject curriculum</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Class</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Classroom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classrooms.map(c => {
          const enrolledStudents = students.filter(s => s.currentClassroomId === c.id);
          const fillPercentage = Math.round((enrolledStudents.length / c.capacity) * 100);

          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                      <p className="text-[11px] text-gray-500">{c.level} • Stream {c.stream}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {c.academicYear}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Class Teacher:</span>
                    <span className="font-bold text-gray-900">{c.classTeacherName || 'Unassigned'}</span>
                  </div>
                  {c.roomNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-800">{c.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Active Students:</span>
                    <span className="font-bold text-teal-700">{enrolledStudents.length} of {c.capacity}</span>
                  </div>

                  <div className="pt-1">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          fillPercentage > 90 ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, fillPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Curriculum Subjects ({c.subjects?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(c.subjects || []).slice(0, 4).map((subj, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                      {subj}
                    </span>
                  ))}
                  {c.subjects && c.subjects.length > 4 && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-bold">
                      +{c.subjects.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE CLASSROOM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Classroom Stream"
        subtitle="Define class stream, capacity, GES subjects, and assign tutor"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateClassroom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Level / Grade *</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Creche">Creche / Daycare</option>
                <option value="Nursery 1">Nursery 1</option>
                <option value="Nursery 2">Nursery 2</option>
                <option value="Kindergarten 1">Kindergarten 1 (KG1)</option>
                <option value="Kindergarten 2">Kindergarten 2 (KG2)</option>
                <option value="Primary 1">Primary 1 (Basic 1)</option>
                <option value="Primary 2">Primary 2 (Basic 2)</option>
                <option value="Primary 3">Primary 3 (Basic 3)</option>
                <option value="Primary 4">Primary 4 (Basic 4)</option>
                <option value="Primary 5">Primary 5 (Basic 5)</option>
                <option value="Primary 6">Primary 6 (Basic 6)</option>
                <option value="JHS 1">JHS 1 (Basic 7)</option>
                <option value="JHS 2">JHS 2 (Basic 8)</option>
                <option value="JHS 3">JHS 3 (Basic 9 - BECE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stream / Section *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gold, Blue, A, Emerald"
                value={formData.stream}
                onChange={e => setFormData({ ...formData, stream: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Max Capacity (Students) *</label>
              <input
                type="number"
                required
                min="5"
                max="80"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Classroom Label (Optional Override)</label>
              <input
                type="text"
                placeholder="e.g. Basic 5 Gold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Class Teacher</label>
              <select
                value={formData.classTeacherId}
                onChange={e => setFormData({ ...formData, classTeacherId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.staffId})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Curriculum Subjects (comma-separated)</label>
            <textarea
              rows={3}
              value={formData.subjects}
              onChange={e => setFormData({ ...formData, subjects: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              Create Classroom
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
