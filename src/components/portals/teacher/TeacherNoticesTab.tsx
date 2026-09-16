import React from 'react';
import { MessageSquare, Bell, Calendar, Pin, AlertCircle } from 'lucide-react';

interface TeacherNoticesTabProps {
  currentTerm: string;
  academicYear: string;
}

export const TeacherNoticesTab: React.FC<TeacherNoticesTabProps> = ({
  currentTerm,
  academicYear
}) => {
  const staffNotices = [
    {
      id: 'notice_1',
      title: 'Continuous Assessment & SBA Submission Deadline',
      category: 'Academic Deadline',
      date: 'Friday, 3:00 PM',
      priority: 'high',
      body: 'All subject teachers are required to finalize Class SBA scores (30%) and Terminal Exam marks (70%) on the portal ahead of report compilation.',
      author: 'Academic Directorate'
    },
    {
      id: 'notice_2',
      title: 'Terminal Attendance Entry for Report Cards',
      category: 'Attendance Notice',
      date: 'Wednesday, 9:00 AM',
      priority: 'medium',
      body: 'Form tutors must verify and record the total school days and days present for every pupil using the Term Attendance tab before report printing commences.',
      author: 'Head of Administration'
    },
    {
      id: 'notice_3',
      title: 'Staff Meeting & Terminal Review Session',
      category: 'General Notice',
      date: 'Next Monday, 2:00 PM',
      priority: 'normal',
      body: 'There will be a brief staff meeting in the main auditorium to review term academic outcomes, student conduct evaluations, and reopening schedules.',
      author: 'Principal / Headteacher'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <span>Staff Notices &amp; Administrative Circulars</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal school announcements, deadlines, and staff bulletins.
          </p>
        </div>
        <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          {currentTerm} • {academicYear}
        </div>
      </div>

      <div className="space-y-3">
        {staffNotices.map((notice) => (
          <div 
            key={notice.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                  notice.priority === 'high' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : notice.priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {notice.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">{notice.date}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                {notice.author}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {notice.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {notice.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
