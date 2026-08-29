import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  borderColor = 'border-indigo-500',
  trend,
  onClick
}) => {
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`p-4 bg-white border-l-4 ${borderColor} border-y border-r border-slate-200 rounded-sm shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">{title}</div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">{value}</div>
          {subtitle && <p className="text-[11px] text-slate-500 font-medium truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-sm ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-slate-100`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className={`font-mono font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend.value}
          </span>
          <span className="text-slate-400 font-medium">vs target/period</span>
        </div>
      )}
    </div>
  );
};
