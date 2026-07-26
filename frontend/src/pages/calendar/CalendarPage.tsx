import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Calendar as CalendarIcon, Clock, CheckSquare, FileCheck } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/calendar-notifications/calendar').then(res => setEvents(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Academic Assessment Calendar</h2>
        <p className="text-xs text-slate-500">Scheduled Examination Timetables & Assignment Deadlines</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 border-b pb-3">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <span>Upcoming Academic Timeline</span>
        </div>

        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${ev.type === 'Exam' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                  {ev.type === 'Exam' ? <CheckSquare className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                  <p className="text-slate-500 mt-0.5">{ev.course_title}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900">{ev.date}</div>
                <div className="text-slate-500 text-[11px] font-medium">{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
