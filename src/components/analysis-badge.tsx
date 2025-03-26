'use client';

import { cn } from '@/lib/utils';

interface AnalysisBadgeProps {
  quality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  confidence?: number;
  className?: string;
}

export function AnalysisBadge({ quality, confidence, className }: AnalysisBadgeProps) {
  if (!quality) return null;

  const colors = {
    poor: 'bg-red-100 text-red-800 border-red-200',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    good: 'bg-green-100 text-green-800 border-green-200',
    excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium',
        colors[quality],
        className
      )}
    >
      {quality}
      {confidence !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </span>
  );
} 