'use client';

import Link from 'next/link';
import { FileText, Users, Calendar, Clock, Trash2, ExternalLink } from 'lucide-react';
import { EvaluationReport, RECOMMENDATION_COLORS } from '@/lib/types';

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
      {reports.map((report) => {
        const valueScores = Object.values(report.values).map(v => v.score);
        const avgScore = (valueScores.reduce((a, b) => a + b, 0) / valueScores.length).toFixed(1);
        const createdDate = new Date(report.createdAt).toLocaleDateString('ko-KR');
        const updatedDate = new Date(report.updatedAt).toLocaleDateString('ko-KR');

        return (
          <div
            key={report.id}
            className="glass-card p-4 hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              {/* 정보 영역 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-white leading-snug truncate">
                    <span className="text-purple-300">
                      [{report.interviewInfo.interviewRound
                        ? `${report.interviewInfo.interviewRound} 인터뷰`
                        : '인터뷰'}]
                    </span>
                    {' '}
                    <span className="text-slate-200">{report.interviewInfo.position}</span>
                    {' '}
                    <span className="text-white">{report.interviewInfo.candidateName} 님</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${RECOMMENDATION_COLORS[report.overall.recommendation]}`}>
                    {report.overall.recommendation}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    {report.interviewInfo.interviewerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    {report.interviewInfo.interviewDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    평균 {avgScore}점
                  </span>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/report/${report.id}`}
                  className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/35 transition-colors border border-blue-500/30"
                  title="리포트 보기"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
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
          </div>
        );
      })}
    </div>
  );
}
