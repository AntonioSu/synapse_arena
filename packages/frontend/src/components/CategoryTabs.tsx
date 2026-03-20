'use client';

import { motion } from 'framer-motion';

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '🌐' },
  { key: 'hot', label: '热点', icon: '🔥' },
  { key: 'controversial', label: '争议', icon: '⚡' },
  { key: 'tech', label: '科技', icon: '🤖' },
  { key: 'social', label: '社会', icon: '🏛️' },
  { key: 'life', label: '生活', icon: '☕' },
] as const;

interface Props {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

export default function CategoryTabs({ activeCategory, onCategoryChange, categoryCounts }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.key;
        const count = cat.key === 'all'
          ? Object.values(categoryCounts || {}).reduce((a, b) => a + b, 0)
          : categoryCounts?.[cat.key] || 0;

        if (cat.key !== 'all' && count === 0) return null;

        return (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`
              relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200 shrink-0
              ${isActive
                ? 'text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategoryBg"
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-xs">{cat.icon}</span>
            <span className="relative z-10">{cat.label}</span>
            {count > 0 && (
              <span className={`
                relative z-10 text-[10px] font-mono px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };
