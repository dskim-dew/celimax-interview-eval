'use client';

import { FileText, Briefcase, Users, Calendar, Clock, Trash2, ArrowRight } from 'lucide-react';
import { EvaluationReport, RECOMMENDATION_COLORS } from '@/lib/types';

interface ReportListProps {
  reports: EvaluationReport[];
  onDelete: (id: string) => void;
  onLoad: (report: EvaluationReport) => void;
}

export default function ReportList({ reports, onDelete, onLoad }: ReportListProps) {
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {report.interviewInfo.candidateName}
                  </h3>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${RECOMMENDATION_COLORS[report.overall.recommendation]}`}>
                    {report.overall.recommendation}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{report.interviewInfo.position}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{report.interviewInfo.interviewerName}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>{report.interviewInfo.interviewDate}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>평균 {avgScore}점</span>
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  작성: {createdDate} | 수정: {updatedDate}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onLoad(report)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30"
                >
                  불러오기
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('이 보고서를 삭제하시겠습니까?')) {
                      onDelete(report.id);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30"
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
