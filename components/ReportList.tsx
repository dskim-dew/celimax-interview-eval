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

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/report/${report.id}`}
          className="block glass-card p-4 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            {/* 정보 영역 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white leading-snug truncate mb-1.5">
                <span className="text-slate-200">{report.interviewInfo.position}</span>
                {' '}
                <span className="text-white">{report.interviewInfo.candidateName} 님</span>
                {report.interviewInfo.interviewRound && (
                  <>
                    {' '}
                    <span className="text-brand-light">{report.interviewInfo.interviewRound}</span>
                  </>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-brand-mid" />
                  {report.interviewInfo.interviewerName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-mid" />
                  {report.interviewInfo.interviewDate.replace('T', ' ')}
                </span>
                {/* HM 최종의견 */}
                <span className={`px-2 py-0.5 rounded-full font-bold ${
                  report.interviewerNotes.finalDecision === 'strong-go'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : report.interviewerNotes.finalDecision === 'weak-go'
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                    : report.interviewerNotes.finalDecision === 'drop'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}>
                  {report.interviewerNotes.finalDecision === 'strong-go' ? 'Strong Go'
                    : report.interviewerNotes.finalDecision === 'weak-go' ? 'Weak Go'
                    : report.interviewerNotes.finalDecision === 'drop' ? '드랍'
                    : '미정'}
                </span>
                {/* 민석님 확인 (HM Drop이 아닐 때만) */}
                {report.interviewerNotes.finalDecision !== 'drop' && (
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
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
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="p-2 rounded-lg bg-brand-deep/20 text-brand-mid group-hover:bg-brand-deep/35 transition-colors border border-brand-deep/30"
                title="리포트 보기"
              >
                <ExternalLink className="w-4 h-4" />
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('이 보고서를 삭제하시겠습니까?')) {
                    onDelete(report.id);
                  }
                }}
                className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/35 transition-colors border border-red-500/30"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
