import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export interface CalendarBatchInfo {
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  current_semester: number | null;
  current_semester_label: string | null;
}

/**
 * Batches and their current semester from the Academic Calendar settings (the single source
 * every panel uses instead of hard-coded batch years or semester numbers).
 */
export const useAcademicCalendar = () => {
  const [batches, setBatches] = useState<CalendarBatchInfo[]>([]);
  const [academicYear, setAcademicYear] = useState<string>('');

  useEffect(() => {
    apiClient.get('/academic-calendar')
      .then((res) => {
        setBatches(res.data?.batches || []);
        setAcademicYear(res.data?.context?.academic_year || '');
      })
      .catch(() => {});
  }, []);

  const selectable = batches.filter((b) => b.status !== 'completed');
  const semesterFor = (name: string) => batches.find((b) => b.name === name)?.current_semester ?? null;
  const labelFor = (b: CalendarBatchInfo) => `${b.name}${b.current_semester_label ? ` (${b.current_semester_label})` : ` (${b.status})`}`;

  return { batches, selectable, semesterFor, labelFor, academicYear };
};
