/**
 * Universal Date & Time Formatting Utilities for MockRun Assessment Platform
 * Guarantees proper parsing of UTC ISO strings and conversion to browser local time.
 */

export const parseIsoDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  // If string does not have timezone info or 'Z', append 'Z' so it is parsed accurately as UTC
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.includes('-') && dateStr.lastIndexOf('-') > 7)
    ? dateStr
    : `${dateStr}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  const d = parseIsoDate(dateStr);
  if (!d) return '-';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDateOnly = (dateStr: string | null | undefined): string => {
  const d = parseIsoDate(dateStr);
  if (!d) return '-';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTimeOnly = (dateStr: string | null | undefined): string => {
  const d = parseIsoDate(dateStr);
  if (!d) return '-';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatShortDate = (dateStr: string | null | undefined): string => {
  const d = parseIsoDate(dateStr);
  if (!d) return '-';
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};
