import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { BookOpen, Copy, Check, Sparkles, MessageSquare } from 'lucide-react';

interface TemplateItem {
  id: string;
  category: 'fees' | 'pta' | 'exams' | 'attendance' | 'reopening' | 'holiday' | 'events';
  title: string;
  audience: string;
  message: string;
  variables: string[];
}

export const TemplatesSection: React.FC<{ onUseTemplate?: (text: string, audience: string) => void }> = ({ onUseTemplate }) => {
  const { school } = useSchool();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const schoolName = school?.name || 'the school';

  const templates: TemplateItem[] = [
    {
      id: 'fee-1',
      category: 'fees',
      title: 'Standard Fee Payment Notice',
      audience: 'Defaulters',
      message: `Dear {parentName}, this is a payment notice from ${schoolName}. {studentName} ({classroom}) has an outstanding school fee balance of {amountOwing} for {term}. Kindly make payment at the bursary or via official MoMo channels. Thank you.`,
      variables: ['{parentName}', '{studentName}', '{classroom}', '{amountOwing}', '{term}']
    },
    {
      id: 'fee-2',
      category: 'fees',
      title: 'Urgent Final Demand Notice',
      audience: 'Defaulters',
      message: `FINAL DEMAND NOTICE: Dear {parentName}, school fees for {studentName} ({amountOwing}) remain unpaid. To avoid withholding of terminal examinations and report cards, please settle immediately at ${schoolName}.`,
      variables: ['{parentName}', '{studentName}', '{amountOwing}']
    },
    {
      id: 'pta-1',
      category: 'pta',
      title: 'PTA General Assembly Invitation',
      audience: 'All Parents',
      message: `Notice: ${schoolName} invites all parents and guardians to our Termly PTA General Assembly this Saturday at 9:30 AM in the Assembly Hall. Important developmental agenda will be discussed. Punctuality is requested.`,
      variables: ['{schoolName}']
    },
    {
      id: 'pta-2',
      category: 'pta',
      title: 'PTA Dues Clearance Reminder',
      audience: 'All Parents',
      message: `Dear Parents, kindly remember to pay your GH₵ 50.00 PTA Levy for the ongoing term to support infrastructural maintenance. Payments can be validated at the school finance desk. Thank you. - ${schoolName} PTA`,
      variables: ['{schoolName}']
    },
    {
      id: 'exams-1',
      category: 'exams',
      title: 'Terminal Examination Timetable',
      audience: 'All Parents',
      message: `Dear Parents, End-of-Term examinations for all classes commence on Monday. Pupils are required to arrive by 7:30 AM with complete mathematical sets and writing materials. We wish our learners success! - ${schoolName}`,
      variables: ['{schoolName}']
    },
    {
      id: 'exams-2',
      category: 'exams',
      title: 'Terminal Results Publication',
      audience: 'All Parents',
      message: `Dear {parentName}, terminal academic results for {studentName} have been published on the SchoolOS portal. Please log in with your admission number to review your ward's report card. - ${schoolName}`,
      variables: ['{parentName}', '{studentName}']
    },
    {
      id: 'reopening-1',
      category: 'reopening',
      title: 'New Term Reopening Notice',
      audience: 'All Parents',
      message: `Welcome to Term 1! ${schoolName} reopens for all basic and secondary pupils on Tuesday 8th September at 7:30 AM. Pupils must be in full, neat school uniform with all required textbooks.`,
      variables: ['{schoolName}']
    },
    {
      id: 'holiday-1',
      category: 'holiday',
      title: 'Public Holiday Closure Notice',
      audience: 'All Parents & Staff',
      message: `Dear Parents and Guardians, please be reminded that ${schoolName} will be closed on Friday in observance of the statutory public holiday. Academic work resumes on Monday at 7:30 AM sharp.`,
      variables: ['{schoolName}']
    },
    {
      id: 'events-1',
      category: 'events',
      title: 'Speech & Prize Giving Day',
      audience: 'All Parents',
      message: `You are cordially invited to the 15th Annual Speech & Prize Giving Day of ${schoolName} on Saturday 28th at 10:00 AM. Join us in celebrating our outstanding scholars and staff!`,
      variables: ['{schoolName}']
    }
  ];

  const filtered = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleCopy = (t: TemplateItem) => {
    navigator.clipboard.writeText(t.message);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Ghanaian School SMS Templates Library</h3>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Pre-approved message templates tailored for Ghanaian educational institutions, GES guidelines, PTA communiques, and bursary notices.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'fees', 'pta', 'exams', 'reopening', 'holiday', 'events'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                  {item.category}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Audience: <b className="text-slate-700">{item.audience}</b>
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{item.message}"
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400">
                {item.variables.length} Dynamic Tag{item.variables.length > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                </button>
                {onUseTemplate && (
                  <button
                    type="button"
                    onClick={() => onUseTemplate(item.message, item.audience)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Use Template
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
