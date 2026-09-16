import React, { useState } from 'react';
import { Student, Classroom } from '../../../types';
import { 
  Users, 
  Search, 
  Phone, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { formatGhanaPhone, formatDate } from '../../../utils/formatting';

interface TeacherStudentsTabProps {
  students: Student[];
  classrooms: Classroom[];
  selectedClassroomId: string;
  onSelectClassroomId: (id: string) => void;
  onViewReport: (student: Student) => void;
}

export const TeacherStudentsTab: React.FC<TeacherStudentsTabProps> = ({
  students,
  classrooms,
  selectedClassroomId,
  onSelectClassroomId,
  onViewReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const classStudents = students.filter(s => s.currentClassroomId === selectedClassroomId);

  const filteredStudents = classStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.otherNames || ''}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    const guardian = (s.guardianName || '').toLowerCase();
    return fullName.includes(q) || adm.includes(q) || guardian.includes(q);
  });

  const selectedClass = classrooms.find(c => c.id === selectedClassroomId);

  const copyNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <span>Class Pupils &amp; Guardians Roster</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified pupil directory with guardian contacts and medical notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Class:</label>
          <select
            value={selectedClassroomId}
            onChange={(e) => onSelectClassroomId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
          >
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by pupil name, admission #, or guardian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-800 focus:bg-white"
          />
        </div>
        <span className="text-slate-500 text-xs">
          {filteredStudents.length} pupils enrolled
        </span>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No pupils found for this class.
          </div>
        ) : (
          filteredStudents.map(st => {
            const guardianPhone = st.guardianPhone || st.guardians?.[0]?.phone || '';
            const guardianName = st.guardianName || st.guardians?.[0]?.name || 'Guardian';

            return (
              <div 
                key={st.id} 
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {st.photoUrl ? (
                        <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        `${st.firstName?.[0] || ''}${st.lastName?.[0] || ''}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {st.firstName} {st.lastName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {st.admissionNumber || st.id}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Gender: <span className="capitalize text-slate-700 font-semibold">{st.gender || '—'}</span> • Level: <span className="text-slate-700 font-semibold">{st.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    <div className="text-[11px] text-slate-500">
                      Guardian: <span className="font-semibold text-slate-800">{guardianName}</span>
                    </div>
                    {guardianPhone ? (
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span className="font-mono text-[11px] text-slate-700">
                          {formatGhanaPhone(guardianPhone)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyNumber(guardianPhone, st.id)}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                            title="Copy Phone"
                          >
                            {copiedId === st.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`sms:${guardianPhone}`}
                            className="text-[10px] font-bold text-slate-900 hover:underline px-1.5 py-0.5 bg-white border border-slate-200 rounded"
                          >
                            SMS
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">No contact registered</div>
                    )}
                  </div>

                  {st.medicalConditions && (
                    <div className="mt-2 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 p-2 rounded-lg">
                      <span className="font-bold">Medical:</span> {st.medicalConditions}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onViewReport(st)}
                    className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Terminal Report</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
