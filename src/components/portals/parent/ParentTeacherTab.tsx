import React from 'react';
import { Teacher, Classroom } from '../../../types';
import { User, Phone, Mail, Clock, MapPin, Award, CheckCircle2 } from 'lucide-react';
import { formatGhanaPhone } from '../../../utils/formatting';

interface ParentTeacherTabProps {
  teacher?: Teacher;
  childClass?: Classroom;
}

export const ParentTeacherTab: React.FC<ParentTeacherTabProps> = ({
  teacher,
  childClass
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-700" />
            <span>Class Teacher &amp; Form Master Profile</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contact information and consultation hours for {childClass?.name || 'Classroom'}.
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          Form Tutor
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-18 h-18 rounded-2xl bg-slate-900 text-white text-xl font-bold flex items-center justify-center shrink-0 border border-slate-800">
            {teacher?.photoUrl ? (
              <img src={teacher.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              `${teacher?.firstName?.[0] || 'T'}${teacher?.lastName?.[0] || ''}`
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {teacher ? `${teacher.firstName} ${teacher.lastName}` : (childClass?.classTeacherName || 'Form Master')}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {teacher?.staffId || 'Educator'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Form Tutor for {childClass?.name} ({childClass?.level}) • {teacher?.qualification || 'Certified Teacher'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Telephone / SMS Contact</span>
            <div className="font-mono font-bold text-slate-900 text-sm">
              {teacher?.phone ? formatGhanaPhone(teacher.phone) : 'Contact via Administration'}
            </div>
            {teacher?.phone && (
              <a
                href={`sms:${teacher.phone}`}
                className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Send SMS
              </a>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Email Address</span>
            <div className="font-mono font-bold text-slate-900 text-sm truncate">
              {teacher?.email || 'admin@school.edu.gh'}
            </div>
            {teacher?.email && (
              <a
                href={`mailto:${teacher.email}`}
                className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Send Email
              </a>
            )}
          </div>
        </div>

        {/* Office Hours */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Parent Consultation &amp; Office Hours</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Parents and guardians are welcome to consult regarding pupil academic progress, character conduct, and homework support between <strong>2:30 PM and 4:00 PM on school days</strong> or by booking an appointment through the main office.
          </p>
        </div>
      </div>
    </div>
  );
};
