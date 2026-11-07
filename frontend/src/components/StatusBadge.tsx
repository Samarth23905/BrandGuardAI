import React from 'react';
import { SubmissionStatus, SeverityLevel } from '../types';

export const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const statusStyles: Record<SubmissionStatus, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'bg-slate-100 text-slate-700 border-slate-200' },
    SUBMITTED: { label: 'Submitted', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    ANALYSING: { label: 'Analysing...', class: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' },
    NEEDS_REVISION: { label: 'Needs Revision', class: 'bg-amber-50 text-amber-800 border-amber-200' },
    READY_FOR_REVIEW: { label: 'Ready for Review', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    IN_REVIEW: { label: 'In Review', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    APPROVED: { label: 'Approved', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    REJECTED: { label: 'Rejected', class: 'bg-red-50 text-red-800 border-red-200' },
  };

  const current = statusStyles[status] || { label: status, class: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${current.class}`}>
      {current.label}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel }> = ({ severity }) => {
  const styles: Record<SeverityLevel, { label: string; class: string }> = {
    CRITICAL: { label: 'Critical', class: 'bg-red-100 text-red-800 border-red-300' },
    MAJOR: { label: 'Major', class: 'bg-amber-100 text-amber-800 border-amber-300' },
    MINOR: { label: 'Minor', class: 'bg-blue-100 text-blue-800 border-blue-300' },
  };

  const current = styles[severity] || styles.MINOR;

  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${current.class}`}>
      {current.label}
    </span>
  );
};
