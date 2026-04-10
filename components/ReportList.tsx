'use client';

import Link from 'next/link';
import { FileText, Users, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { EvaluationReport } from '@/lib/types';

interface ReportListProps {
  reports: EvaluationReport[];
  onDelete: (id: string) => void;
}

export default function ReportList({ reports, onDelete }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-slate-500" />
        <h3 className="mt-4 text-lg font-medium text-white">저장된 보고서가 없습니다</h3>
        <p className="mt-2 text-sm text-slate-400">새로운 면접 평가를 생성해보세요.</p>
      </div>
    );
  }

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  function formatDateWithDay(dateStr: string) {
    // "2026-03-27 17:00" → "2026-03-27 (금) 17:00"
    const datePart = dateStr.slice(0, 10);
    const timePart = dateStr.slice(10).replace('T', ' ').trim();
    try {
      const d = new Date(datePart);
      const day = DAY_NAMES[d.getDay()];
      return `${datePart} (${day})${timePart ? ' ' + timePart : ''}`;
    } catch {
      return dateStr.replace('T', ' ');
    }
  }

  // 면접일 기준 최신순 정렬
  const sorted = [...reports].sort((a, b) =>
    b.interviewInfo.interviewDate.localeCompare(a.interviewInfo.interviewDate)
  );

  return (
    <div className="space-y-2">
      {sorted.map((report) => (
        <Link
          key={report.id}
          href={`/report/${report.id}`}
          className="flex items-center gap-3 glass-card px-4 py-3 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
        >
          {/* 한 줄 정보 */}
          <div className="flex items-center gap-3 flex-1 min-w-0 text-sm">
            <span className="font-bold text-white truncate w-[140px] shrink-0">{report.interviewInfo.position}</span>
            <span className="font-bold text-white truncate w-[72px] shrink-0">
              {report.interviewInfo.candidateName}
            </span>
            {report.interviewInfo.interviewRound && (
              <span className="text-brand-light text-xs w-[36px] shrink-0 text-center">{report.interviewInfo.interviewRound}</span>
            )}
            <span className="text-slate-300 text-xs shrink-0 flex items-center gap-1 w-[64px]">
              <Users className="w-3 h-3 text-brand-mid" />
              {report.interviewInfo.interviewerName}
            </span>
            <span className="text-slate-300 text-xs shrink-0 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-mid" />
              {formatDateWithDay(report.interviewInfo.interviewDate)}
            </span>
            {/* 구분선 */}
            <span className="w-px h-4 bg-white/15 shrink-0" />
            {/* HM 최종의견 */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              report.interviewerNotes.finalDecision === 'strong-go'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : report.interviewerNotes.finalDecision === 'weak-go'
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                : report.interviewerNotes.finalDecision === 'weak-no'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : report.interviewerNotes.finalDecision === 'strong-no'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              {report.interviewerNotes.finalDecision === 'strong-go' ? 'Strong Go'
                : report.interviewerNotes.finalDecision === 'weak-go' ? 'Weak Go'
                : report.interviewerNotes.finalDecision === 'weak-no' ? 'Weak No'
                : report.interviewerNotes.finalDecision === 'strong-no' ? 'Strong No'
                : '미정'}
            </span>
            {/* 민석님 확인 */}
            {report.interviewerNotes.finalDecision !== 'strong-no' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                report.ceoDecision === 'pass'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : report.ceoDecision === 'drop'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}>
                {report.ceoDecision === 'pass' ? 'Pass'
                  : report.ceoDecision === 'drop' ? 'Drop'
                  : '대기'}
              </span>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="p-1.5 rounded-lg bg-brand-deep/20 text-brand-mid group-hover:bg-brand-deep/35 transition-colors border border-brand-deep/30"
              title="리포트 보기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('이 보고서를 삭제하시겠습니까?')) {
                  onDelete(report.id);
                }
              }}
              className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/35 transition-colors border border-red-500/30"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
