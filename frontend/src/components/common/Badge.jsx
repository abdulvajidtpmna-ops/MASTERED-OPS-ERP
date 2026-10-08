import React from 'react';

export function GradeBadge({ grade }) {
  const g = String(grade || '').toUpperCase();
  const config = {
    A: { bg: 'bg-gold-500 text-brand-900 border-gold-400 font-bold shadow-sm', label: 'Grade A (Distinction)' },
    B: { bg: 'bg-brand-500 text-white border-brand-300 font-bold shadow-sm', label: 'Grade B (Excellent)' },
    C: { bg: 'bg-teal-600 text-white border-teal-500 font-medium', label: 'Grade C (Good)' },
    D: { bg: 'bg-amber-500 text-white border-amber-400 font-medium', label: 'Grade D (Pass)' },
    F: { bg: 'bg-rose-600 text-white border-rose-500 font-medium', label: 'Grade F (Fail)' },
    E: { bg: 'bg-gray-400 text-white border-gray-300 font-medium', label: 'Grade E (Absent)' },
  };

  const style = config[g] || { bg: 'bg-gray-100 text-gray-700 border-gray-200', label: grade || 'N/A' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${style.bg}`} title={style.label}>
      {g || 'N/A'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || '').toUpperCase();
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PLACED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',

    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    UNPAID: 'bg-amber-50 text-amber-700 border-amber-200',
    PLANNED: 'bg-sky-50 text-sky-700 border-sky-200',
    ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
    READY: 'bg-purple-50 text-purple-700 border-purple-200',
    SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    INTERVIEW_SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    AGREEMENT_SENT: 'bg-cyan-50 text-cyan-700 border-cyan-200',

    MISSED: 'bg-rose-50 text-rose-700 border-rose-200',
    DROPPED: 'bg-rose-50 text-rose-700 border-rose-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    NEEDS_IMPROVEMENT: 'bg-rose-50 text-rose-700 border-rose-200',
    OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',

    NO_NEED_JOB: 'bg-gray-100 text-gray-700 border-gray-200',
    NOT_NOW: 'bg-gray-100 text-gray-700 border-gray-200',
    PREF_PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const currentStyle = styles[s] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {status ? status.replace(/_/g, ' ') : 'N/A'}
    </span>
  );
}
