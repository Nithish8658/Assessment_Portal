import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Calendar as CalendarIcon, CheckSquare, FileCheck, Filter, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/calendar-notifications/calendar')
      .then(res => setEvents(res.data))
      .catch((err) => setLoadError(err.response?.data?.detail || 'The calendar could not be loaded. Refresh the page to try again.'));
  }, []);

  const categories = ['ALL', 'Assessment Window', 'Exam Result', 'Academic Term'];

  const filteredEvents = selectedCategory === 'ALL'
    ? events
    : events.filter(e => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm text-[#0F172A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#FF5500] font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-[#FF5500]" />
            <span>Nehru Arts & Science College (Autonomous)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Academic & Assessment Calendar
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Automated event stream — Term milestones, corporate assessment windows, approvals, and evaluation releases.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#475569]">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Role & Department Scoped View</span>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B]">
          <Filter className="w-4 h-4 text-[#FF5500]" />
          <span>Filter Events:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#FF5500] text-white shadow-sm'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Timeline Events List */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-[#0F172A]">
            <CalendarIcon className="w-5 h-5 text-[#FF5500]" />
            <span>Scheduled Academic & Assessment Milestones</span>
          </div>
          <span className="text-xs text-[#64748B]">Showing {filteredEvents.length} events</span>
        </div>

        <div className="space-y-3">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start space-x-3">
                <div
                  className="p-2.5 rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${ev.badge_color || '#FF5500'}15`,
                    borderColor: `${ev.badge_color || '#FF5500'}40`,
                    color: ev.badge_color || '#FF5500'
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
                    <h4 className="font-bold text-[#0F172A] text-sm">{ev.title}</h4>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
                      style={{
                        backgroundColor: `${ev.badge_color || '#FF5500'}15`,
                        borderColor: `${ev.badge_color || '#FF5500'}40`,
                        color: ev.badge_color || '#FF5500'
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>
                  <p className="text-[#64748B] mt-1 leading-relaxed">{ev.details}</p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-[#E2E8F0] pt-2 sm:pt-0">
                <div className="font-bold text-[#0F172A] font-mono text-xs">{ev.date}</div>
                {ev.end_date && ev.end_date !== ev.date && (
                  <div className="text-[10px] text-[#64748B]">to {ev.end_date}</div>
                )}
                <div className="text-[#64748B] text-[11px] font-medium mt-0.5">{ev.time}</div>
              </div>
            </div>
          ))}

          {loadError ? (
            <div className="p-8 text-center text-xs text-[#EF4444] bg-[#FEF2F2] rounded-xl border border-[#EF4444]/30">
              {loadError}
            </div>
          ) : filteredEvents.length === 0 && (
            <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              No events found for the selected category filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
