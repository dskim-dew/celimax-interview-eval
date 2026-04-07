'use client';

import { useState, useEffect } from 'react';
import { List } from 'lucide-react';

export interface TOCItem {
  id: string;
  label: string;
}

interface ReportTOCProps {
  items: TOCItem[];
}

export default function ReportTOC({ items }: ReportTOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSet = new Set<string>();

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            visibleSet.add(id);
          } else {
            visibleSet.delete(id);
          }
          // 현재 보이는 섹션 중 목차 순서상 가장 위에 있는 것을 active로
          for (const item of items) {
            if (visibleSet.has(item.id)) {
              setActiveId(item.id);
              break;
            }
          }
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="hidden xl:block w-48 shrink-0">
      <div className="sticky top-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <List className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">목차</span>
        </div>
        <ul className="space-y-0.5">
          {items.map(({ id, label }) => {
            const isActive = activeId === id;
            return (
              <li key={id}>
                <button
                  onClick={() => handleClick(id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10 border-l-2 border-emerald-500 font-medium'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
