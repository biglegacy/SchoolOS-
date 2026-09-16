import React from 'react';
import { MessageSquare, Bell, Calendar, Pin, AlertCircle } from 'lucide-react';

interface ParentAnnouncementsTabProps {
  currentTerm: string;
  academicYear: string;
  schoolName: string;
}

export const ParentAnnouncementsTab: React.FC<ParentAnnouncementsTabProps> = ({
  currentTerm,
  academicYear,
  schoolName
}) => {
  const announcements = [
    {
      id: 'ann_1',
      title: 'End of Term Assessment & Vacation Date',
      category: 'Academic Calendar',
      date: 'Thursday, 10:00 AM',
      body: `This term officially concludes with final examinations and terminal report distributions. Pupils vacate on the scheduled date and will resume for the next session on the dates communicated in the official terminal reports.`,
      priority: 'high'
    },
    {
      id: 'ann_2',
      title: 'Parent-Teacher Association (PTA) General Meeting',
      category: 'PTA Bulletin',
      date: 'Monday, 1:00 PM',
      body: `All parents and guardians are cordially invited to our termly PTA general assembly in the school assembly hall. Agenda items include student academic performance, school infrastructure developments, and term dues reviews.`,
      priority: 'normal'
    },
    {
      id: 'ann_3',
      title: 'School Fees Settlement & Receipt Verification',
      category: 'Finance Notice',
      date: 'Last Week',
      body: `Parents are kindly reminded to ensure all outstanding fees are settled before terminal examination reports are generated. Payments can be verified instantly under the School Fees tab.`,
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <span>School Circulars &amp; Announcements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official communications, academic schedules, and term circulars from {schoolName}.
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          {currentTerm} • {academicYear}
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                  item.priority === 'high' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : item.priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {item.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">{item.date}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {item.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
