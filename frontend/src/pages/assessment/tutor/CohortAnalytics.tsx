import React, { useState, useEffect } from 'react';
import { TutorCohortItem, DomainDetail, TutorClassOption } from '../../../types/assessment';
import { Student360Modal } from './Student360Modal';
import { Class360Modal } from './Class360Modal';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../api/client';
import { Users, Search, Eye, Sparkles } from 'lucide-react';

export const CohortAnalytics: React.FC = () => {
  const { activeRole } = useAuth();
  const isTutor = activeRole === 'Class Tutor' || activeRole === 'Faculty';
  const isHoD = activeRole === 'HoD';

  const [cohort, setCohort] = useState<TutorCohortItem[]>([]);
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [classes, setClasses] = useState<TutorClassOption[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedClassFor360, setSelectedClassFor360] = useState<number | null>(null);

  useEffect(() => {
    fetchDomains();
    fetchClasses();
  }, [activeRole]);

  useEffect(() => {
    fetchCohort();
  }, [selectedDomain, selectedClassId, activeRole]);

  const fetchDomains = async () => {
    try {
      const res = await apiClient.get('/assessment/domains');
      setDomains(res.data);
    } catch (e) {
      console.error('Failed to load domains', e);
    }
  };

  const fetchClasses = async () => {
    try {
      const url = activeRole
        ? `/assessment/tutor/classes?active_role=${encodeURIComponent(activeRole)}`
        : '/assessment/tutor/classes';
      const res = await apiClient.get(url);
      const classData: TutorClassOption[] = res.data || [];
      setClasses(classData);

      // If user is a tutor or has exactly one assigned class, auto-select it immediately
      if (classData.length > 0 && (isTutor || classData.length === 1)) {
        setSelectedClassId(String(classData[0].id));
      }
    } catch (e) {
      console.error('Failed to load authorized classes', e);
    }
  };

  const fetchCohort = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDomain) params.append('domain_slug', selectedDomain);
      if (selectedClassId) params.append('academic_class_id', selectedClassId);
      if (activeRole) params.append('active_role', activeRole);
      const qs = params.toString();
      const url = qs ? `/assessment/tutor/cohort?${qs}` : '/assessment/tutor/cohort';
      const res = await apiClient.get(url);
      setCohort(res.data);
    } catch (err) {
      console.error('Failed to load cohort analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classes.find((c) => String(c.id) === selectedClassId);

  const filteredCohort = cohort.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.register_number.toLowerCase().includes(term) ||
      s.full_name.toLowerCase().includes(term) ||
      s.programme_name.toLowerCase().includes(term) ||
      (s.class_name && s.class_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
              Tutor Cohort Performance & Analytics
            </h1>
            <span className="text-[10px] font-mono font-bold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded border border-[#C9A227]/20 uppercase">
              {isTutor ? 'Class Tutor View' : isHoD ? 'HoD View' : 'Admin View'}
            </span>
          </div>
          <p className="text-xs text-[#9E988A] mt-1">
            {isTutor
              ? 'Real-time multi-round scorecards, readiness indices, and Class & Student 360° dossiers for your assigned class cohort.'
              : 'Real-time multi-round scorecards, readiness indices, and Class & Student 360° dossiers across department classes.'}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter Dropdown */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isTutor && classes.length === 1}
            className="bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#C9A227] cursor-pointer disabled:opacity-90"
          >
            {isTutor ? (
              classes.length > 1 ? (
                <>
                  <option value="">All My Assigned Classes ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.class_code}) • {c.student_count} Students
                    </option>
                  ))}
                </>
              ) : classes.length === 1 ? (
                <option value={classes[0].id}>
                  My Class: {classes[0].name} ({classes[0].class_code}) • {classes[0].student_count} Students
                </option>
              ) : (
                <option value="">No Assigned Classes</option>
              )
            ) : (
              <>
                <option value="">{isHoD ? 'All Department Classes' : 'All Institution Classes'}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.class_code}) • {c.student_count} Students
                  </option>
                ))}
              </>
            )}
          </select>

          {/* Assessment Domain Dropdown */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#C9A227] cursor-pointer"
          >
            <option value="">All Assessment Domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.slug}>{d.title}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9E988A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search register no, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C9A227] font-mono w-44 sm:w-56"
            />
          </div>

          {/* Open Class 360° Profile Button */}
          <button
            onClick={() => {
              if (selectedClassId) {
                setSelectedClassFor360(Number(selectedClassId));
              } else if (classes.length > 0) {
                setSelectedClassFor360(classes[0].id);
              }
            }}
            disabled={classes.length === 0}
            className={`py-2 px-3.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer ${
              selectedClassId
                ? 'bg-[#C9A227] text-[#141311] hover:bg-[#E3C766] shadow-[0_0_15px_rgba(201,162,39,0.35)]'
                : 'bg-[#C9A227]/10 text-[#E3C766] hover:bg-[#C9A227]/20 border border-[#C9A227]/30'
            }`}
            title={
              selectedClassId
                ? `Open 360° diagnostic dossier for ${selectedClass?.name || 'selected class'}`
                : 'Open Class 360° Profile'
            }
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Class 360° Profile</span>
          </button>
        </div>
      </div>

      {/* Selected Class Quick Info Banner */}
      {selectedClass && (
        <div className="bg-[#1C1B18] border border-[#C9A227]/30 p-3.5 px-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#F8F5ED] flex items-center space-x-2">
                <span>{selectedClass.name}</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-[#141311] border border-[#2A2824] text-[#E3C766]">
                  {selectedClass.class_code}
                </span>
                {isTutor && (
                  <span className="text-[10px] px-2 py-0.2 rounded bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]">
                    Your Assigned Class
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#9E988A] mt-0.5">
                {selectedClass.programme_name} • Batch {selectedClass.batch_name} (Sec {selectedClass.section_name}) • {selectedClass.student_count} Enrolled
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedClassFor360(selectedClass.id)}
            className="py-1.5 px-3 rounded-xl bg-[#C9A227] text-[#141311] font-bold hover:bg-[#E3C766] transition inline-flex items-center space-x-1.5 cursor-pointer shadow-md text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Class 360° Dossier</span>
          </button>
        </div>
      )}

      {/* Cohort Student Table */}
      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#9E988A]">
            Loading cohort student records...
          </div>
        ) : filteredCohort.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#9E988A]">
            No students found matching current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141311] text-[#9E988A] border-b border-[#2A2824]">
                <tr>
                  <th className="p-3.5 font-bold">Register No</th>
                  <th className="p-3.5 font-bold">Candidate Name</th>
                  <th className="p-3.5 font-bold">Class / Sec</th>
                  <th className="p-3.5 font-bold text-center">R1 Cognitive</th>
                  <th className="p-3.5 font-bold text-center">R2 Coding</th>
                  <th className="p-3.5 font-bold text-center">R3 Tech</th>
                  <th className="p-3.5 font-bold text-center">R4 Debug</th>
                  <th className="p-3.5 font-bold text-center">Overall</th>
                  <th className="p-3.5 font-bold text-center">Readiness</th>
                  <th className="p-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2824] text-[#D8D2C5]">
                {filteredCohort.map((s) => (
                  <tr key={s.student_id} className="hover:bg-[#24231F] transition">
                    <td className="p-3.5 text-[#F8F5ED] font-bold">{s.register_number}</td>
                    <td className="p-3.5">{s.full_name}</td>
                    <td className="p-3.5">
                      {s.class_id ? (
                        <button
                          onClick={() => s.class_id && setSelectedClassFor360(s.class_id)}
                          className="text-[#9E988A] hover:text-[#E3C766] transition inline-flex items-center space-x-1 cursor-pointer group"
                          title="Click to view Class 360° Profile"
                        >
                          <span>{s.batch_name} ({s.section_name})</span>
                          <span className="text-[10px] text-[#C9A227] opacity-0 group-hover:opacity-100 transition">
                            • 360°
                          </span>
                        </button>
                      ) : (
                        <span className="text-[#9E988A]">{s.batch_name} ({s.section_name})</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.round1_score !== null && s.round1_score !== undefined ? (
                        <span className="text-[#4ADE80] font-bold">{s.round1_score.toFixed(0)}%</span>
                      ) : (
                        <span className="text-[#6B665E]">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.round2_score !== null && s.round2_score !== undefined ? (
                        <span className="text-[#4ADE80] font-bold">{s.round2_score.toFixed(0)}%</span>
                      ) : (
                        <span className="text-[#6B665E]">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.round3_score !== null && s.round3_score !== undefined ? (
                        <span className="text-[#4ADE80] font-bold">{s.round3_score.toFixed(0)}%</span>
                      ) : (
                        <span className="text-[#6B665E]">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.round4_score !== null && s.round4_score !== undefined ? (
                        <span className="text-[#4ADE80] font-bold">{s.round4_score.toFixed(0)}%</span>
                      ) : (
                        <span className="text-[#6B665E]">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {s.overall_percentage !== null && s.overall_percentage !== undefined ? (
                        <span className="text-[#C9A227] font-bold">{s.overall_percentage.toFixed(0)}%</span>
                      ) : (
                        <span className="text-[#6B665E]">Pending</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#141311] border border-[#2A2824] text-[#E3C766]">
                        {s.readiness_index}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedStudentId(s.student_id)}
                        className="py-1 px-2.5 rounded-lg bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#E3C766] border border-[#C9A227]/30 transition inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>360° Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Student 360 Modal */}
      {selectedStudentId && (
        <Student360Modal
          studentId={selectedStudentId}
          domainSlug={selectedDomain || undefined}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Class 360° Modal */}
      {selectedClassFor360 && (
        <Class360Modal
          classId={selectedClassFor360}
          domainSlug={selectedDomain || undefined}
          onClose={() => setSelectedClassFor360(null)}
        />
      )}
    </div>
  );
};
