import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <span className="text-xs text-gray-500">Showing {start}–{end} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-gray-600 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
