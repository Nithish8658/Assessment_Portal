import React, { useState, useEffect } from 'react';
import { Student360Data } from '../../../types/assessment';
import { CompetencyRadar } from '../../../components/assessment/CompetencyRadar';
import apiClient from '../../../api/client';
import { X, Award, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface Student360ModalProps {
  studentId: number;
  domainSlug?: string;
  onClose: () => void;
}

export const Student360Modal: React.FC<Student360ModalProps> = ({ studentId, domainSlug, onClose }) => {
  const [data, setData] = useState<Student360Data | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudent360();
  }, [studentId, domainSlug]);

  const liveStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'IN_PROGRESS': return 'In progress';
      case 'SUBMITTED':
      case 'EVALUATING': return 'Awaiting grading';
      case 'NOT_STARTED':
      case undefined:
      case null: return 'Not started';
      default: return status.replace(/_/g, ' ').toLowerCase();
    }
  };

  const fetchStudent360 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = domainSlug
        ? `/assessment/tutor/students/${studentId}/360?domain_slug=${domainSlug}`
        : `/assessment/tutor/students/${studentId}/360`;
      const res = await apiClient.get(url);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load Student 360 profile', err);
      setError(err.response?.data?.detail || 'Failed to load Student 360 profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F0F3F6] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#64748B]">
            Generating Student 360° Competency Profile...
          </div>
        ) : error || !data ? (
          <div className="p-6 text-center text-xs font-mono text-red-600 bg-red-50 rounded-2xl border border-red-200">
            {error || 'Profile could not be loaded.'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Student Info */}
            <div className="border-b border-[#E2E8F0] pb-4 pr-10">
              <span className="text-[10px] font-mono text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded border border-[#FF5500]/25 uppercase font-bold">
                Student 360° Diagnostic Dossier
              </span>
              <h2 className="text-lg font-bold text-[#0F172A] mt-1">{data.student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#64748B] mt-1">
                <span>Reg: {data.student.register_number}</span>
                <span>•</span>
                <span>{data.student.programme_name}</span>
                <span>•</span>
                <span>Batch {data.student.batch_name} ({data.student.section_name})</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-[#64748B]">
                {data.overall_percentage != null && (
                  <span className="text-[#0F172A]">
                    Overall <strong>{data.overall_percentage.toFixed(0)}%</strong> · {data.readiness_index}
                  </span>
                )}
                {data.generated_at && <span>Last updated {formatDateTime(data.generated_at)}</span>}
                <button
                  onClick={fetchStudent360}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reload
                </button>
              </div>
              <p className="text-[10px] font-mono text-[#94A3B8] mt-1">
                Prepared automatically each time the student completes a round. Each round shows the latest published result; earlier attempts are replaced, not averaged.
              </p>
            </div>

            {/* Performance Across Rounds */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#0F172A]">Stage-by-Stage Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {data.rounds_performance.length === 0 && (
                  <div className="col-span-full p-3 text-xs font-mono text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    No rounds attempted in this domain yet.
                  </div>
                )}
                {data.rounds_performance.map((rp) => (
                  <div key={rp.round_id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#FF5500]">
                        Round {rp.round_number}
                      </span>
                      {rp.published ? (
                        rp.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-[#22C55E]" aria-label="Passed" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-500" aria-label="Not cleared" />
                        )
                      ) : (
                        <Clock className="w-3 h-3 text-[#64748B]" aria-label={liveStatusLabel(rp.status)} />
                      )}
                    </div>
                    <div className="text-[11px] text-[#475569] leading-snug line-clamp-2" title={rp.round_title}>
                      {rp.round_title}
                    </div>
                    {rp.published ? (
                      <>
                        <div className="text-xs font-bold text-[#0F172A]">
                          {(rp.percentage ?? 0).toFixed(0)}%
                          <span className="font-normal text-[#64748B]">
                            {' '}· {(rp.score ?? 0).toFixed(0)}{rp.max_score != null ? `/${rp.max_score.toFixed(0)}` : ''} marks
                          </span>
                        </div>
                        <div className={`text-[10px] font-mono ${rp.passed ? 'text-[#22C55E]' : 'text-rose-500'}`}>
                          {rp.passed ? 'Passed' : 'Not cleared'}
                          {rp.total_attempts > 1 ? ` · attempt ${rp.attempt_number} (latest of ${rp.total_attempts})` : ''}
                        </div>
                        {rp.newer_attempt_status && (
                          <div className="text-[10px] font-mono text-amber-500">Retake {liveStatusLabel(rp.newer_attempt_status).toLowerCase()}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-[10px] font-mono text-[#64748B]">{liveStatusLabel(rp.status)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Radar & Competencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#0F172A] mb-2 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Competency Radar Analysis</span>
                </h4>
                <CompetencyRadar data={data.competency_scores} accentColor="#FF5500" />
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 flex-1">
                  <span className="text-xs font-bold text-[#22C55E] flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Candidate Verified Strengths</span>
                  </span>
                  <ul className="text-xs text-[#475569] list-disc list-inside space-y-1">
                    {data.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 flex-1">
                  <span className="text-xs font-bold text-amber-500 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Focus Growth Areas</span>
                  </span>
                  <ul className="text-xs text-[#64748B] list-disc list-inside space-y-1">
                    {data.areas_to_improve.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
