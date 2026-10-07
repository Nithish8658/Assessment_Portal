import React, { useState, useEffect } from 'react';
import { Student360Data } from '../../../types/assessment';
import { CompetencyRadar } from '../../../components/assessment/CompetencyRadar';
import apiClient from '../../../api/client';
import { X, Award, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#11110F]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#1C1B18] border border-[#C9A227]/40 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#141311] hover:bg-[#24231F] text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#9E988A]">
            Generating Student 360° Competency Profile...
          </div>
        ) : error || !data ? (
          <div className="p-6 text-center text-xs font-mono text-red-400 bg-red-500/10 rounded-2xl">
            {error || 'Profile could not be loaded.'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Student Info */}
            <div className="border-b border-[#2A2824] pb-4 pr-10">
              <span className="text-[10px] font-mono text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded border border-[#C9A227]/25 uppercase font-bold">
                Student 360° Diagnostic Dossier
              </span>
              <h2 className="text-lg font-bold text-[#F8F5ED] mt-1">{data.student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9E988A] mt-1">
                <span>Reg: {data.student.register_number}</span>
                <span>•</span>
                <span>{data.student.programme_name}</span>
                <span>•</span>
                <span>Batch {data.student.batch_name} ({data.student.section_name})</span>
              </div>
            </div>

            {/* Performance Across Rounds */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#F8F5ED]">Stage-by-Stage Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {data.rounds_performance.map((rp, idx) => (
                  <div key={idx} className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#E3C766]">
                        Round {rp.round_number}
                      </span>
                      {rp.passed ? (
                        <CheckCircle2 className="w-3 h-3 text-[#4ADE80]" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#F8F5ED]">{rp.score.toFixed(0)} Marks</div>
                    <div className="text-[10px] font-mono text-[#9E988A]">{rp.percentage.toFixed(0)}% Score</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar & Competencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="bg-[#141311] p-4 rounded-2xl border border-[#2A2824]">
                <h4 className="text-xs font-bold text-[#F8F5ED] mb-2 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Competency Radar Analysis</span>
                </h4>
                <CompetencyRadar data={data.competency_scores} />
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-2 flex-1">
                  <span className="text-xs font-bold text-[#4ADE80] flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Candidate Verified Strengths</span>
                  </span>
                  <ul className="text-xs text-[#D8D2C5] list-disc list-inside space-y-1">
                    {data.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-2 flex-1">
                  <span className="text-xs font-bold text-[#EAB308] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Focus Growth Areas</span>
                  </span>
                  <ul className="text-xs text-[#9E988A] list-disc list-inside space-y-1">
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
