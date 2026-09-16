import React, { useState } from 'react';
import { TimetableSlot, Classroom } from '../../../types';
import { Clock, Calendar, MapPin, BookOpen } from 'lucide-react';

interface TeacherTimetableTabProps {
  timetable?: TimetableSlot[];
  classrooms: Classroom[];
}

export const TeacherTimetableTab: React.FC<TeacherTimetableTabProps> = ({
  timetable = [],
  classrooms
}) => {
  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');

  const daySlots = timetable.filter(s => s.day === selectedDay);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <span>Weekly Teaching Timetable</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized master lesson schedule for academic terms.
          </p>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {days.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Periods View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          {selectedDay} Schedule ({daySlots.length} lessons)
        </h3>

        {daySlots.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No scheduled teaching lessons for {selectedDay}.
          </div>
        ) : (
          <div className="space-y-3">
            {daySlots.map((slot, idx) => (
              <div 
                key={slot.id || idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-700 shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{slot.subjectName}</h4>
                    <div className="text-slate-500 flex items-center gap-3 mt-1">
                      <span>Class: <strong className="text-slate-700">{slot.classroomName}</strong></span>
                      {slot.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{slot.room}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold text-slate-700 px-3 py-1.5 bg-white rounded-lg border border-slate-200 self-start sm:self-center">
                  {slot.startTime} - {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
