import React, { useState, useEffect } from 'react';
import { Class360Data } from '../../../types/assessment';
import { CompetencyRadar } from '../../../components/assessment/CompetencyRadar';
import { Student360Modal } from './Student360Modal';
import apiClient from '../../../api/client';
import {
  X,
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Eye,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface Class360ModalProps {
  classId: number;
  domainSlug?: string;
  onClose: () => void;
}

export const Class360Modal: React.FC<Class360ModalProps> = ({ classId, domainSlug, onClose }) => {
  const [data, setData] = useState<Class360Data | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [drilldownStudentId, setDrilldownStudentId] = useState<number | null>(null);

  useEffect(() => {
    fetchClass360();
  }, [classId, domainSlug]);

  const fetchClass360 = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = domainSlug
        ? `/assessment/tutor/classes/${classId}/360?domain_slug=${domainSlug}`
        : `/assessment/tutor/classes/${classId}/360`;
      const res = await apiClient.get(url);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load Class 360 profile', err);
      setError(err.response?.data?.detail || 'Failed to load Class 360 profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F0F3F6] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {isLoading ? (
            <div className="py-20 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#FF5500] font-semibold">Generating Class 360° Cohort Diagnostic Dossier...</p>
              <p className="text-[11px] text-[#94A3B8]">Aggregating multi-round attainment, competency vectors, and student roster.</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-xs font-mono text-red-600 bg-red-50 rounded-2xl border border-red-200">
              {error || 'Class 360 dossier could not be loaded.'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#E2E8F0] pb-5 pr-10">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-[#FF5500] bg-[#FF5500]/10 px-2.5 py-0.5 rounded-md border border-[#FF5500]/30 uppercase font-bold tracking-wider">
                    Class 360° Cohort Diagnostic Dossier
                  </span>
                  <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-md border border-[#22C55E]/20">
                    Active Cohort
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-2">
                  {data.class_info.name}
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-[#64748B]">
                  {data.generated_at && <span>Last updated {formatDateTime(data.generated_at)}</span>}
                  <button
                    onClick={fetchClass360}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reload
                  </button>
                  <span className="text-[#94A3B8]">Prepared automatically as students complete rounds, using each student's latest published result per round.</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#64748B] mt-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#FF5500] font-semibold">
                    Code: {data.class_info.class_code}
                  </span>
                  <span>•</span>
                  <span>{data.class_info.programme_name}</span>
                  <span>•</span>
                  <span>Batch {data.class_info.batch_name} (Sec {data.class_info.section_name})</span>
                  {data.domain_title && (<><span>•</span><span className="text-[#FF5500] font-semibold">{data.domain_title}</span></>)}
                  <span>•</span>
                  <span className="text-[#475569]">Tutor: {data.class_info.tutor_name}</span>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-mono uppercase">Enrolled</span>
                    <Users className="w-3.5 h-3.5 text-[#FF5500]" />
                  </div>
                  <div className="text-xl font-bold text-[#0F172A]">
                    {data.kpis.total_students}
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">Class Strength</div>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-mono uppercase">Participation</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  </div>
                  <div className="text-xl font-bold text-[#22C55E]">
                    {data.kpis.participation_rate}%
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">
                    {data.kpis.participated_count} of {data.kpis.total_students} Attempted
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-mono uppercase">Class Average</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
                  </div>
                  <div className="text-xl font-bold text-[#FF5500]">
                    {data.kpis.class_average_pct !== null && data.kpis.class_average_pct !== undefined
                      ? `${data.kpis.class_average_pct.toFixed(0)}%`
                      : 'Pending'}
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">Across Completed Rounds</div>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-mono uppercase">Top Score</span>
                    <Award className="w-3.5 h-3.5 text-[#FF5500]" />
                  </div>
                  <div className="text-xl font-bold text-[#0F172A]">
                    {data.kpis.highest_score !== null && data.kpis.highest_score !== undefined
                      ? `${data.kpis.highest_score.toFixed(0)}%`
                      : 'Pending'}
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">Highest Cohort Mark</div>
                </div>
              </div>

              {/* Readiness Index Distribution */}
              <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center space-x-2">
                    <Target className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Cohort Industry Readiness Distribution</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    Total Evaluated: {data.kpis.participated_count}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-center shadow-xs">
                    <span className="text-[10px] font-mono text-[#22C55E] font-bold block">Advanced</span>
                    <span className="text-lg font-bold text-[#0F172A]">{data.readiness_distribution.advanced}</span>
                    <span className="text-[9px] text-[#94A3B8] block font-mono">≥ 85%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-center shadow-xs">
                    <span className="text-[10px] font-mono text-[#FF5500] font-bold block">Proficient</span>
                    <span className="text-lg font-bold text-[#0F172A]">{data.readiness_distribution.proficient}</span>
                    <span className="text-[9px] text-[#94A3B8] block font-mono">70% - 84%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-center shadow-xs">
                    <span className="text-[10px] font-mono text-amber-500 font-bold block">Developing</span>
                    <span className="text-lg font-bold text-[#0F172A]">{data.readiness_distribution.developing}</span>
                    <span className="text-[9px] text-[#94A3B8] block font-mono">50% - 69%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-center shadow-xs">
                    <span className="text-[10px] font-mono text-rose-500 font-bold block">Needs Improvement</span>
                    <span className="text-lg font-bold text-[#0F172A]">{data.readiness_distribution.beginner}</span>
                    <span className="text-[9px] text-[#94A3B8] block font-mono">&lt; 50%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-center shadow-xs">
                    <span className="text-[10px] font-mono text-[#64748B] font-bold block">Pending</span>
                    <span className="text-lg font-bold text-[#0F172A]">{data.readiness_distribution.pending}</span>
                    <span className="text-[9px] text-[#94A3B8] block font-mono">Unattempted</span>
                  </div>
                </div>
              </div>

              {/* Stage-by-Stage / Round Performance */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Stage-by-Stage Cohort Attainment</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.rounds_performance.map((rp) => (
                    <div
                      key={rp.round_number}
                      className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#FF5500]">
                          Round {rp.round_number}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {rp.attempted_count} attempted
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#0F172A] truncate" title={rp.round_title}>
                        {rp.round_title}
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#64748B]">Average:</span>
                          <span className="font-bold text-[#22C55E]">{rp.average_score.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#64748B]">Pass Rate:</span>
                          <span className="font-bold text-[#FF5500]">{rp.pass_rate.toFixed(0)}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-[#22C55E] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(rp.pass_rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competency Radar & Attainment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>Class Competency Vector</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#64748B]">Average Attainment</span>
                  </div>

                  <CompetencyRadar data={data.competency_scores} accentColor="#FF5500" />
                </div>

                <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] mb-2 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span>Class Strengths</span>
                    </h4>
                    {data.strengths.length === 0 ? (
                      <div className="text-[11px] font-mono text-[#94A3B8] italic">
                        No high proficiency competencies registered yet.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.strengths.map((str, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] font-mono text-[#475569] flex items-start space-x-2 bg-[#FFFFFF] p-2 rounded-lg border border-[#E2E8F0]"
                          >
                            <span className="text-[#22C55E] font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A] mb-2 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Remedial & Skill Gap Focus</span>
                    </h4>
                    {data.areas_to_improve.length === 0 ? (
                      <div className="text-[11px] font-mono text-[#94A3B8] italic">
                        No critical skill gaps identified for this class.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.areas_to_improve.map((gap, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] font-mono text-[#475569] flex items-start space-x-2 bg-[#FFFFFF] p-2 rounded-lg border border-[#E2E8F0]"
                          >
                            <span className="text-amber-500 font-bold">!</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Class Student Merit Roster Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Class Student Merit Roster ({data.student_rankings.length} Students)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    Click 360° Profile to inspect individual candidate dossier
                  </span>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3 font-bold">Rank</th>
                          <th className="p-3 font-bold">Register No</th>
                          <th className="p-3 font-bold">Student Name</th>
                          {data.rounds_performance.map((rp) => (
                            <th key={rp.round_id ?? rp.round_number} className="p-3 font-bold text-center" title={rp.round_title}>
                              R{rp.round_number}
                            </th>
                          ))}
                          <th className="p-3 font-bold text-center">Overall</th>
                          <th className="p-3 font-bold text-center">Readiness</th>
                          <th className="p-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
                        {data.student_rankings.map((st, idx) => (
                          <tr key={st.student_id} className="hover:bg-[#F8FAFC] transition">
                            <td className="p-3 text-[#FF5500] font-bold">#{idx + 1}</td>
                            <td className="p-3 text-[#0F172A] font-bold">{st.register_number}</td>
                            <td className="p-3">{st.full_name}</td>
                            {data.rounds_performance.map((rp) => {
                              const v = st.round_scores?.[String(rp.round_number)];
                              return (
                                <td key={rp.round_id ?? rp.round_number} className="p-3 text-center">
                                  {v !== null && v !== undefined ? (
                                    <span className="text-[#0F172A] font-bold">{v.toFixed(0)}%</span>
                                  ) : (
                                    <span className="text-[#94A3B8]">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center">
                              {st.overall_percentage !== null && st.overall_percentage !== undefined ? (
                                <span className="text-[#FF5500] font-bold">
                                  {st.overall_percentage.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">Pending</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#FF5500] font-semibold">
                                {st.readiness_index}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setDrilldownStudentId(st.student_id)}
                                className="py-1 px-2.5 rounded-lg bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 transition inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Student 360°</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drilldown Student 360 Modal */}
      {drilldownStudentId && (
        <Student360Modal
          studentId={drilldownStudentId}
          domainSlug={domainSlug}
          onClose={() => setDrilldownStudentId(null)}
        />
      )}
    </>
  );
};
