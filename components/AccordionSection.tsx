'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';


interface AccordionSectionProps {
  title: string;
  icon: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  sectionId?: string;
  children: ReactNode;
}

export default function AccordionSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  sectionId,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      id={sectionId}
      className={`rounded-2xl bg-brand-deep/10 border border-brand-deep/10 overflow-hidden${sectionId ? ' scroll-mt-8' : ''}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  );
}
