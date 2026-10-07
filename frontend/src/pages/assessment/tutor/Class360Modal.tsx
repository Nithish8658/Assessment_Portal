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
  BarChart3
} from 'lucide-react';

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
      <div className="fixed inset-0 z-50 bg-[#11110F]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
        <div className="bg-[#1C1B18] border border-[#C9A227]/40 rounded-3xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-[#141311] hover:bg-[#24231F] text-[#9E988A] hover:text-[#F8F5ED] border border-[#2A2824] transition cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {isLoading ? (
            <div className="py-20 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#E3C766]">Generating Class 360° Cohort Diagnostic Dossier...</p>
              <p className="text-[11px] text-[#6B665E]">Aggregating multi-round attainment, competency vectors, and student roster.</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-xs font-mono text-red-400 bg-red-500/10 rounded-2xl border border-red-500/30">
              {error || 'Class 360 dossier could not be loaded.'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#2A2824] pb-5 pr-10">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-[#C9A227] bg-[#C9A227]/10 px-2.5 py-0.5 rounded-md border border-[#C9A227]/30 uppercase font-bold tracking-wider">
                    Class 360° Cohort Diagnostic Dossier
                  </span>
                  <span className="text-[10px] font-mono text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded-md border border-[#4ADE80]/20">
                    Active Cohort
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#F8F5ED] mt-2">
                  {data.class_info.name}
                </h2>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#9E988A] mt-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#141311] border border-[#2A2824] text-[#E3C766]">
                    Code: {data.class_info.class_code}
                  </span>
                  <span>•</span>
                  <span>{data.class_info.programme_name}</span>
                  <span>•</span>
                  <span>Batch {data.class_info.batch_name} (Sec {data.class_info.section_name})</span>
                  <span>•</span>
                  <span className="text-[#D8D2C5]">Tutor: {data.class_info.tutor_name}</span>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
                  <div className="flex items-center justify-between text-[#9E988A]">
                    <span className="text-[11px] font-mono uppercase">Enrolled</span>
                    <Users className="w-3.5 h-3.5 text-[#C9A227]" />
                  </div>
                  <div className="text-xl font-bold text-[#F8F5ED]">
                    {data.kpis.total_students}
                  </div>
                  <div className="text-[10px] font-mono text-[#6B665E]">Class Strength</div>
                </div>

                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
                  <div className="flex items-center justify-between text-[#9E988A]">
                    <span className="text-[11px] font-mono uppercase">Participation</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  </div>
                  <div className="text-xl font-bold text-[#4ADE80]">
                    {data.kpis.participation_rate}%
                  </div>
                  <div className="text-[10px] font-mono text-[#6B665E]">
                    {data.kpis.participated_count} of {data.kpis.total_students} Attempted
                  </div>
                </div>

                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
                  <div className="flex items-center justify-between text-[#9E988A]">
                    <span className="text-[11px] font-mono uppercase">Class Average</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[#C9A227]" />
                  </div>
                  <div className="text-xl font-bold text-[#C9A227]">
                    {data.kpis.class_average_pct !== null && data.kpis.class_average_pct !== undefined
                      ? `${data.kpis.class_average_pct.toFixed(0)}%`
                      : 'Pending'}
                  </div>
                  <div className="text-[10px] font-mono text-[#6B665E]">Across Completed Rounds</div>
                </div>

                <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
                  <div className="flex items-center justify-between text-[#9E988A]">
                    <span className="text-[11px] font-mono uppercase">Top Score</span>
                    <Award className="w-3.5 h-3.5 text-[#E3C766]" />
                  </div>
                  <div className="text-xl font-bold text-[#F8F5ED]">
                    {data.kpis.highest_score !== null && data.kpis.highest_score !== undefined
                      ? `${data.kpis.highest_score.toFixed(0)}%`
                      : 'Pending'}
                  </div>
                  <div className="text-[10px] font-mono text-[#6B665E]">Highest Cohort Mark</div>
                </div>
              </div>

              {/* Readiness Index Distribution */}
              <div className="bg-[#141311] p-4 sm:p-5 rounded-2xl border border-[#2A2824] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#F8F5ED] flex items-center space-x-2">
                    <Target className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Cohort Industry Readiness Distribution</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#9E988A]">
                    Total Evaluated: {data.kpis.participated_count}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-center">
                    <span className="text-[10px] font-mono text-[#4ADE80] font-bold block">Advanced</span>
                    <span className="text-lg font-bold text-[#F8F5ED]">{data.readiness_distribution.advanced}</span>
                    <span className="text-[9px] text-[#6B665E] block font-mono">≥ 85%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-center">
                    <span className="text-[10px] font-mono text-[#E3C766] font-bold block">Proficient</span>
                    <span className="text-lg font-bold text-[#F8F5ED]">{data.readiness_distribution.proficient}</span>
                    <span className="text-[9px] text-[#6B665E] block font-mono">70% - 84%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-center">
                    <span className="text-[10px] font-mono text-yellow-400 font-bold block">Developing</span>
                    <span className="text-lg font-bold text-[#F8F5ED]">{data.readiness_distribution.developing}</span>
                    <span className="text-[9px] text-[#6B665E] block font-mono">50% - 69%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-center">
                    <span className="text-[10px] font-mono text-orange-400 font-bold block">Beginner</span>
                    <span className="text-lg font-bold text-[#F8F5ED]">{data.readiness_distribution.beginner}</span>
                    <span className="text-[9px] text-[#6B665E] block font-mono">&lt; 50%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-center">
                    <span className="text-[10px] font-mono text-[#9E988A] font-bold block">Pending</span>
                    <span className="text-lg font-bold text-[#F8F5ED]">{data.readiness_distribution.pending}</span>
                    <span className="text-[9px] text-[#6B665E] block font-mono">Unattempted</span>
                  </div>
                </div>
              </div>

              {/* Stage-by-Stage / Round Performance */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#F8F5ED] flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Stage-by-Stage Cohort Attainment</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.rounds_performance.map((rp) => (
                    <div
                      key={rp.round_number}
                      className="p-3.5 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#E3C766]">
                          Round {rp.round_number}
                        </span>
                        <span className="text-[10px] font-mono text-[#9E988A]">
                          {rp.attempted_count} attempted
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#F8F5ED] truncate" title={rp.round_title}>
                        {rp.round_title}
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#9E988A]">Average:</span>
                          <span className="font-bold text-[#4ADE80]">{rp.average_score.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#9E988A]">Pass Rate:</span>
                          <span className="font-bold text-[#C9A227]">{rp.pass_rate.toFixed(0)}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1C1B18] h-1.5 rounded-full overflow-hidden border border-[#2A2824] mt-1">
                          <div
                            className="h-full bg-[#4ADE80] rounded-full transition-all duration-500"
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
                <div className="bg-[#141311] p-4 sm:p-5 rounded-2xl border border-[#2A2824] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#F8F5ED] flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>Class Competency Vector</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#9E988A]">Average Attainment</span>
                  </div>

                  <CompetencyRadar data={data.competency_scores} accentColor="#C9A227" />
                </div>

                <div className="bg-[#141311] p-4 sm:p-5 rounded-2xl border border-[#2A2824] space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-[#F8F5ED] mb-2 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                      <span>Class Strengths</span>
                    </h4>
                    {data.strengths.length === 0 ? (
                      <div className="text-[11px] font-mono text-[#6B665E] italic">
                        No high proficiency competencies registered yet.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.strengths.map((str, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] font-mono text-[#D8D2C5] flex items-start space-x-2 bg-[#1C1B18] p-2 rounded-lg border border-[#2A2824]"
                          >
                            <span className="text-[#4ADE80] font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#F8F5ED] mb-2 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Remedial & Skill Gap Focus</span>
                    </h4>
                    {data.areas_to_improve.length === 0 ? (
                      <div className="text-[11px] font-mono text-[#6B665E] italic">
                        No critical skill gaps identified for this class.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {data.areas_to_improve.map((gap, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] font-mono text-[#D8D2C5] flex items-start space-x-2 bg-[#1C1B18] p-2 rounded-lg border border-[#2A2824]"
                          >
                            <span className="text-yellow-400 font-bold">!</span>
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
                  <h3 className="text-xs font-bold text-[#F8F5ED] flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Class Student Merit Roster ({data.student_rankings.length} Students)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#9E988A]">
                    Click 360° Profile to inspect individual candidate dossier
                  </span>
                </div>

                <div className="bg-[#141311] border border-[#2A2824] rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#100F0E] text-[#9E988A] border-b border-[#2A2824]">
                        <tr>
                          <th className="p-3 font-bold">Rank</th>
                          <th className="p-3 font-bold">Register No</th>
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold text-center">R1 Cognitive</th>
                          <th className="p-3 font-bold text-center">R2 Coding</th>
                          <th className="p-3 font-bold text-center">R3 Tech</th>
                          <th className="p-3 font-bold text-center">R4 Debug</th>
                          <th className="p-3 font-bold text-center">Overall</th>
                          <th className="p-3 font-bold text-center">Readiness</th>
                          <th className="p-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2824] text-[#D8D2C5]">
                        {data.student_rankings.map((st, idx) => (
                          <tr key={st.student_id} className="hover:bg-[#1C1B18] transition">
                            <td className="p-3 text-[#E3C766] font-bold">#{idx + 1}</td>
                            <td className="p-3 text-[#F8F5ED] font-bold">{st.register_number}</td>
                            <td className="p-3">{st.full_name}</td>
                            <td className="p-3 text-center">
                              {st.round1_score !== null && st.round1_score !== undefined ? (
                                <span className="text-[#4ADE80] font-bold">{st.round1_score.toFixed(0)}%</span>
                              ) : (
                                <span className="text-[#6B665E]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {st.round2_score !== null && st.round2_score !== undefined ? (
                                <span className="text-[#4ADE80] font-bold">{st.round2_score.toFixed(0)}%</span>
                              ) : (
                                <span className="text-[#6B665E]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {st.round3_score !== null && st.round3_score !== undefined ? (
                                <span className="text-[#4ADE80] font-bold">{st.round3_score.toFixed(0)}%</span>
                              ) : (
                                <span className="text-[#6B665E]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {st.round4_score !== null && st.round4_score !== undefined ? (
                                <span className="text-[#4ADE80] font-bold">{st.round4_score.toFixed(0)}%</span>
                              ) : (
                                <span className="text-[#6B665E]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {st.overall_percentage !== null && st.overall_percentage !== undefined ? (
                                <span className="text-[#C9A227] font-bold">
                                  {st.overall_percentage.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-[#6B665E]">Pending</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#1C1B18] border border-[#2A2824] text-[#E3C766]">
                                {st.readiness_index}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setDrilldownStudentId(st.student_id)}
                                className="py-1 px-2.5 rounded-lg bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#E3C766] border border-[#C9A227]/30 transition inline-flex items-center space-x-1 cursor-pointer"
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
