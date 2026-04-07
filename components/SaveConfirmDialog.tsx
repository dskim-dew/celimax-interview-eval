'use client';

import { AlertTriangle, CheckCircle2, X, User, Briefcase, Calendar, Hash, MessageCircle, ThumbsUp } from 'lucide-react';
import { EvaluationReport } from '@/lib/types';

interface SaveConfirmDialogProps {
  report: EvaluationReport;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function SaveConfirmDialog({ report, onConfirm, onCancel, isSaving }: SaveConfirmDialogProps) {
  const hasComment = !!report.interviewerNotes.comment?.trim();
  const hasDecision = !!report.interviewerNotes.finalDecision;
  const hasMissing = !hasComment || !hasDecision;

  const decisionLabel: Record<string, string> = {
    drop: '드랍',
    'weak-go': 'Weak Go',
    'strong-go': 'Strong Go',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* 다이얼로그 */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">리포트 저장 확인</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 지원자 정보 요약 */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">지원자 정보</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {report.interviewInfo.candidateName}
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                {report.interviewInfo.position}
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {report.interviewInfo.interviewDate}
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                {report.interviewInfo.interviewRound ?? '-'}
              </span>
            </div>
          </div>

          {/* 작성 상태 체크리스트 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">작성 상태</p>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              hasComment
                ? 'bg-brand-deep/15 border-brand-deep/25'
                : 'bg-red-500/10 border-red-500/25'
            }`}>
              {hasComment
                ? <CheckCircle2 className="w-5 h-5 text-brand-mid shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              }
              <div className="flex items-center gap-2 flex-1">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">면접관 소견</span>
              </div>
              <span className={`text-xs font-medium ${hasComment ? 'text-brand-mid' : 'text-red-400'}`}>
                {hasComment ? '작성 완료' : '미작성'}
              </span>
            </div>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              hasDecision
                ? 'bg-brand-deep/15 border-brand-deep/25'
                : 'bg-red-500/10 border-red-500/25'
            }`}>
              {hasDecision
                ? <CheckCircle2 className="w-5 h-5 text-brand-mid shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              }
              <div className="flex items-center gap-2 flex-1">
                <ThumbsUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">최종 의견</span>
              </div>
              <span className={`text-xs font-medium ${hasDecision ? 'text-brand-mid' : 'text-red-400'}`}>
                {hasDecision ? decisionLabel[report.interviewerNotes.finalDecision!] : '미선택'}
              </span>
            </div>
          </div>

          {/* 경고 메시지 */}
          {hasMissing && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                미작성 항목이 있습니다. 그래도 저장하시겠습니까?
              </p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/5 border border-white/15 hover:bg-white/10 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isSaving
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-brand-deep text-white hover:bg-brand-mid shadow-lg shadow-brand-deep/20'
            }`}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
