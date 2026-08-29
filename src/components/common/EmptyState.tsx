import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
      <div className="p-3 bg-teal-50 text-teal-600 rounded-full mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const GhanaFlagBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const height = size === 'sm' ? 'h-3.5 w-5' : 'h-4 w-6';
  return (
    <span className={`inline-flex items-center rounded overflow-hidden shadow-2xs border border-gray-300 ${height}`} title="Republic of Ghana">
      <span className="h-full w-1/3 bg-[#ce1126]" />
      <span className="h-full w-1/3 bg-[#fcd116] flex items-center justify-center text-[7px] text-black">★</span>
      <span className="h-full w-1/3 bg-[#006b3f]" />
    </span>
  );
};
