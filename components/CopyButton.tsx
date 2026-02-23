'use client';

import { useState } from 'react';
import { Copy, ChevronDown, Table, FileText, MessageSquare, Check } from 'lucide-react';
import { EvaluationReport } from '@/lib/types';
import { formatForMondayTable, formatForText, formatForSummary } from '@/lib/formatters';

interface CopyButtonProps {
  report: EvaluationReport;
}

type CopyFormat = 'table' | 'text' | 'summary';

export default function CopyButton({ report }: CopyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<CopyFormat | null>(null);

  const handleCopy = async (format: CopyFormat) => {
    let content = '';

    switch (format) {
      case 'table':
        content = formatForMondayTable(report);
        break;
      case 'text':
        content = formatForText(report);
        break;
      case 'summary':
        content = formatForSummary(report);
        break;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
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
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
      >
        <Copy className="w-4 h-4" />
        먼데이용 복사
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full mt-2 right-0 w-72 glass-card z-20 overflow-hidden">
            <div className="p-2">
              <button
                onClick={() => handleCopy('table')}
                className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Table className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">표 형식</div>
                    <div className="text-xs text-slate-400">먼데이 붙여넣기 시 자동 표 변환</div>
                  </div>
                </div>
                {copiedFormat === 'table' && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </button>

              <button
                onClick={() => handleCopy('text')}
                className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-medium text-white">텍스트 형식</div>
                    <div className="text-xs text-slate-400">가독성 좋은 전체 내용</div>
                  </div>
                </div>
                {copiedFormat === 'text' && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </button>

              <button
                onClick={() => handleCopy('summary')}
                className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="font-medium text-white">요약 형식</div>
                    <div className="text-xs text-slate-400">슬랙/메시지 공유용</div>
                  </div>
                </div>
                {copiedFormat === 'summary' && (
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
