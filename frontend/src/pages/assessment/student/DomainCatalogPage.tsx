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
      <div className="bg-gradient-to-r from-[#1C1B18] via-[#24231F] to-[#1C1B18] border border-[#C9A227]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
            Corporate Career Tracks & Domain Assessments
          </h1>
          <p className="text-xs text-[#9E988A] leading-relaxed">
            Multi-round industry benchmarks measuring quantitative problem solving, technical coding, software debugging, and operational competencies.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#9E988A] bg-[#1C1B18] rounded-2xl border border-[#2A2824]">
          Loading authorized assessment domains...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs font-mono text-red-400 bg-red-500/10 rounded-2xl border border-red-500/30">
          {error}
        </div>
      ) : domains.length === 0 ? (
        <div className="p-12 text-center bg-[#1C1B18] rounded-2xl border border-[#2A2824] space-y-3">
          <Briefcase className="w-10 h-10 text-[#6B665E] mx-auto" />
          <h3 className="text-sm font-bold text-[#F8F5ED]">No Active Assessment Tracks Allocated</h3>
          <p className="text-xs text-[#9E988A] max-w-md mx-auto">
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
                className={`bg-[#1C1B18] border rounded-2xl p-5 shadow-xl transition hover:-translate-y-1 cursor-pointer flex flex-col justify-between space-y-4 group ${isUpcoming
                    ? 'border-[#F59E0B]/40 hover:border-[#F59E0B]'
                    : isExpired
                      ? 'border-red-500/30 opacity-75 hover:opacity-100'
                      : 'border-[#2A2824] hover:border-[#C9A227]/60'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    {isCompleted ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center space-x-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Starts in {d.starts_in_minutes}m</span>
                      </span>
                    ) : isExpired ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                        Expired
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#9E988A] bg-[#141311] px-2 py-0.5 rounded border border-[#2A2824]">
                        {completedRounds}/{totalRounds} Rounds Cleared
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#F8F5ED] group-hover:text-[#C9A227] transition">
                      {d.title}
                    </h3>
                    <p className="text-xs text-[#9E988A] line-clamp-2 mt-1 leading-relaxed">
                      {d.description || 'Industry verified recruitment and competency benchmarks.'}
                    </p>
                  </div>

                  {/* Assigned Timestamp & Window */}
                  {d.allocated_at && (
                    <div className="pt-2 flex items-center space-x-1.5 text-[11px] font-mono text-[#E3C766] bg-[#141311] px-2.5 py-1.5 rounded-xl border border-[#2A2824]">
                      <Clock className="w-3 h-3 text-[#C9A227] shrink-0" />
                      <span className="truncate">Assigned: {formatDateTime(d.allocated_at)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2A2824] flex items-center justify-between text-xs font-bold text-[#C9A227]">
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
