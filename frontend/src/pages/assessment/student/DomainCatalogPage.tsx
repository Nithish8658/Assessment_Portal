import React, { useState, useEffect } from 'react';
import { DomainDetail } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { Briefcase, ArrowRight, ShieldCheck, CheckCircle2, Lock, Sparkles, Clock } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface DomainCatalogProps {
  onSelectDomain: (slug: string, allocationId?: number) => void;
}

export const DomainCatalogPage: React.FC<DomainCatalogProps> = ({ onSelectDomain }) => {
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/assessment/domains');
      setDomains(res.data);
    } catch (err: any) {
      console.error('Failed to load assessment domains', err);
      setError(err.response?.data?.detail || 'Failed to fetch assessment domains.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-white via-[#FFF8F5] to-white border border-[#FF5500]/25 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF5500] bg-[#FF5500]/10 px-2.5 py-1 rounded-full border border-[#FF5500]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Cohort Tracks</span>
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            Corporate Career Tracks & Domain Assessments
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Multi-round industry benchmarks measuring quantitative problem solving, technical coding, software debugging, and operational competencies.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          Loading authorized assessment domains...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs font-mono text-red-600 bg-red-50 rounded-2xl border border-red-200">
          {error}
        </div>
      ) : domains.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
          <Briefcase className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Active Assessment Tracks Allocated</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Your Class Tutor has not activated an assessment track for your cohort yet. Once approved by your HoD, allocated domains will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((d, index) => {
            const completedRounds = d.rounds.filter((r) => r.status === 'EVALUATED' && r.passed).length;
            const totalRounds = d.rounds.length;
            const isCompleted = totalRounds > 0 && completedRounds === totalRounds;
            const isUpcoming = d.schedule_status === 'UPCOMING';
            const isExpired = d.schedule_status === 'EXPIRED';

            return (
              <div
                key={d.allocation_id ? `alloc-${d.allocation_id}` : `domain-${d.id}-${index}`}
                onClick={() => onSelectDomain(d.slug, d.allocation_id)}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group ${isUpcoming
                    ? 'border-[#F59E0B]/40 hover:border-[#F59E0B]'
                    : isExpired
                      ? 'border-red-200 opacity-75 hover:opacity-100'
                      : 'border-[#E2E8F0] hover:border-[#FF5500]/60 hover:ring-1 hover:ring-[#FF5500]/20'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 flex items-center justify-center text-[#FF5500]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    {isCompleted ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#D97706] border border-[#F59E0B]/30 flex items-center space-x-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Starts in {d.starts_in_minutes}m</span>
                      </span>
                    ) : isExpired ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                        Expired
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#475569] bg-[#F0F3F6] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {completedRounds}/{totalRounds} Rounds Cleared
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#FF5500] transition">
                      {d.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                      {d.description || 'Industry verified recruitment and competency benchmarks.'}
                    </p>
                  </div>

                  {/* Assigned Timestamp & Window */}
                  {d.allocated_at && (
                    <div className="pt-2 flex items-center space-x-1.5 text-[11px] font-mono text-[#FF5500] bg-[#FFF8F5] px-2.5 py-1.5 rounded-xl border border-[#FF5500]/20">
                      <Clock className="w-3 h-3 text-[#FF5500] shrink-0" />
                      <span className="truncate">Assigned: {formatDateTime(d.allocated_at)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#FF5500] group-hover:text-[#E64D00]">
                  <span>{isUpcoming ? 'View Schedule & Guidelines' : 'Enter Track'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
