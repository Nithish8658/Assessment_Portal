import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Calendar as CalendarIcon, CheckSquare, FileCheck, Filter, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    apiClient.get('/calendar-notifications/calendar').then(res => setEvents(res.data)).catch(() => {});
  }, []);

  const categories = ['ALL', 'Assessment Window', 'Exam Result', 'Academic Term'];

  const filteredEvents = selectedCategory === 'ALL'
    ? events
    : events.filter(e => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1C1B18] p-6 rounded-2xl border border-[#2A2824] shadow-xl text-[#F8F5ED] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#C9A227] font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>Nehru Arts & Science College (Autonomous)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F8F5ED]">
            Academic & Assessment Calendar
          </h2>
          <p className="text-xs text-[#9E988A] mt-1">
            Automated event stream — Term milestones, corporate assessment windows, approvals, and evaluation releases.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#141311] px-3.5 py-2 rounded-xl border border-[#2A2824] text-xs text-[#E3C766]">
          <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
          <span>Role & Department Scoped View</span>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1C1B18] p-4 rounded-xl border border-[#2A2824]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#9E988A]">
          <Filter className="w-4 h-4 text-[#C9A227]" />
          <span>Filter Events:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#C9A227] text-[#11110F]'
                  : 'bg-[#141311] text-[#9E988A] hover:text-[#F8F5ED] border border-[#2A2824]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Timeline Events List */}
      <div className="bg-[#1C1B18] p-6 rounded-2xl border border-[#2A2824] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-[#F8F5ED]">
            <CalendarIcon className="w-5 h-5 text-[#C9A227]" />
            <span>Scheduled Academic & Assessment Milestones</span>
          </div>
          <span className="text-xs text-[#9E988A]">Showing {filteredEvents.length} events</span>
        </div>

        <div className="space-y-3">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-4 bg-[#141311] hover:bg-[#24231F] transition border border-[#2A2824] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start space-x-3">
                <div
                  className="p-2.5 rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${ev.badge_color || '#C9A227'}15`,
                    borderColor: `${ev.badge_color || '#C9A227'}40`,
                    color: ev.badge_color || '#C9A227'
                  }}
                >
                  {ev.category === 'Exam Result' ? (
                    <Award className="w-5 h-5" />
                  ) : ev.category === 'Assessment Window' ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <FileCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-[#F8F5ED] text-sm">{ev.title}</h4>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
                      style={{
                        backgroundColor: `${ev.badge_color || '#C9A227'}15`,
                        borderColor: `${ev.badge_color || '#C9A227'}40`,
                        color: ev.badge_color || '#C9A227'
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-[#9E988A] mt-1 leading-relaxed">{ev.details}</p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-[#2A2824] pt-2 sm:pt-0">
                <div className="font-bold text-[#F8F5ED] font-mono text-xs">{ev.date}</div>
                {ev.end_date && ev.end_date !== ev.date && (
                  <div className="text-[10px] text-[#9E988A]">to {ev.end_date}</div>
                )}
                <div className="text-[#9E988A] text-[11px] font-medium mt-0.5">{ev.time}</div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-xs text-[#9E988A] bg-[#141311] rounded-xl border border-[#2A2824]">
              No events found for the selected category filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
