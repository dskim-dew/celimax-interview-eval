'use client';

import { useState } from 'react';
import { Copy, ChevronDown, MessageSquare, Link2, Check } from 'lucide-react';
import { EvaluationReport } from '@/lib/types';
import { formatForShareSummary } from '@/lib/formatters';

interface CopyButtonProps {
  report: EvaluationReport;
}

type CopyFormat = 'summary' | 'link';

export default function CopyButton({ report }: CopyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);

  const getReportUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/report/${report.id}`;
    }
    return `/report/${report.id}`;
  };

  const handleCopy = async (format: CopyFormat) => {
    let content = '';

    switch (format) {
      case 'summary':
        content = formatForShareSummary(report, getReportUrl());
        break;
      case 'link':
        content = getReportUrl();
        break;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
      setIsOpen(false);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('복사에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
      >
        <Copy className="w-5 h-5" />
        공유
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute bottom-full mb-2 right-0 w-64 glass-card z-20 overflow-hidden">
            <div className="p-2">
              <button
                onClick={() => handleCopy('summary')}
                className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="font-medium text-white">요약 형식</div>
                    <div className="text-xs text-slate-400">기본정보·평가 요약·링크 포함</div>
                  </div>
                </div>
                {copiedFormat === 'summary' && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </button>

              <button
                onClick={() => handleCopy('link')}
                className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">보고서 링크</div>
                    <div className="text-xs text-slate-400">보고서 URL만 복사</div>
                  </div>
                </div>
                {copiedFormat === 'link' && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
