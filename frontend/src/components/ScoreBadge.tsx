import React from 'react';

export const ScoreBadge: React.FC<{ score?: number; size?: 'sm' | 'md' | 'lg' }> = ({
  score = 0,
  size = 'md',
}) => {
  let color = 'bg-red-50 text-red-700 border-red-200';
  let dotColor = 'bg-red-500';
  let band = 'High Risk';

  if (score >= 90) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    band = 'Strong';
  } else if (score >= 70) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    band = 'Needs Review';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base font-bold px-4 py-2 gap-2',
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-semibold ${color} ${sizeClasses[size]}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{score}/100</span>
      <span className="opacity-75 font-normal text-xs">({band})</span>
    </div>
  );
};
