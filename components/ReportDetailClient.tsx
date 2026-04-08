'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, User, Briefcase, Users, Calendar, Hash, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import EvaluationReport from '@/components/EvaluationReport';
import CopyButton from '@/components/CopyButton';
import ReportTOC, { TOCItem } from '@/components/ReportTOC';
import { EvaluationReport as ReportType, InterviewerNotes, CeoDecision } from '@/lib/types';

interface ReportDetailClientProps {
  report: ReportType;
}

export default function ReportDetailClient({ report: initialReport }: ReportDetailClientProps) {
  const router = useRouter();
  const [report, setReport] = useState<ReportType>(initialReport);

  const handleNotesChange = async (notes: InterviewerNotes) => {
    const previous = report;
    setReport({ ...report, interviewerNotes: notes });
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerNotes: notes }),
      });
      if (!res.ok) throw new Error('저장 실패');
    } catch {
      setReport(previous);
      alert('소견 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCeoDecision = async (decision: CeoDecision) => {
    const label = decision === 'pass' ? 'Pass' : 'Drop';
    const isDeselect = report.ceoDecision === decision;
    const msg = isDeselect
      ? `민석님 확인을 "${label}"에서 해제하시겠습니까?`
      : `민석님 확인을 "${label}"(으)로 설정하시겠습니까?`;
    if (!confirm(msg)) return;

    const previous = report;
    const newDecision = isDeselect ? null : decision;
    setReport({ ...report, ceoDecision: newDecision });
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ceoDecision: newDecision }),
      });
      if (!res.ok) throw new Error('저장 실패');
    } catch {
      setReport(previous);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const hasAIAnalysis = !!(report.overall || report.competencies || report.values);

  const tocItems: TOCItem[] = useMemo(() => {
    const items: TOCItem[] = [
      { id: 'section-info', label: '기본 정보' },
      { id: 'section-notes', label: 'Hiring M. 소견' },
    ];
    if (report.qnaData) {
      items.push({ id: 'section-qna', label: 'Q&A 스크립트' });
    }
    if (hasAIAnalysis) {
      items.push(
        { id: 'section-overall', label: '종합 분석' },
        { id: 'section-competency', label: '직무 역량' },
        { id: 'section-values', label: '핵심 가치' },
      );
    }
    return items;
  }, [report.qnaData, hasAIAnalysis]);

  return (
    <div className="flex gap-6">
      {/* 좌측 TOC */}
      <ReportTOC items={tocItems} />

      {/* 우측 본문 */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </button>
        </div>

        {/* 1. 기본 정보 — 제목 + 한 줄 메타 */}
        <div id="section-info" className="glass-card p-5 scroll-mt-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <h1 className="text-xl font-bold gradient-text whitespace-nowrap">
              {report.interviewInfo.interviewRound
                ? `${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님 ${report.interviewInfo.interviewRound}`
                : `${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
              <span>Hiring Manager <span className="text-white font-medium">{report.interviewInfo.interviewerName}</span></span>
              {report.interviewInfo.reportAuthor && (
                <span>추가 면접관 <span className="text-white font-medium">{report.interviewInfo.reportAuthor}</span></span>
              )}
              <span>면접일 <span className="text-white font-medium">{report.interviewInfo.interviewDate}</span></span>
            </div>
          </div>
        </div>

        {/* 2. 면접관 소견 → 종합 분석 → 직무역량/핵심가치/Q&A (아코디언) */}
        <EvaluationReport
          report={report}
          onNotesChange={handleNotesChange}
          readOnly={true}
          hideHeader={true}
          qnaData={report.qnaData}
          sectionIds={{
            notes: 'section-notes',
            overall: 'section-overall',
            competency: 'section-competency',
            values: 'section-values',
            qna: 'section-qna',
          }}
        />

        {/* 4. 공유 버튼 + 민석님 확인 */}
        <div className="flex items-center justify-center gap-3 pt-2 pb-4">
          <CopyButton report={report} />
          {report.interviewerNotes.finalDecision !== 'drop' && (
            <div className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl">
              <span className="text-sm font-medium text-slate-400 mr-1">민석님 확인</span>
              <button
                onClick={() => handleCeoDecision('pass')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200 ${
                  report.ceoDecision === 'pass'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                    : 'bg-white/5 text-slate-300 border-white/15 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Pass
              </button>
              <button
                onClick={() => handleCeoDecision('drop')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200 ${
                  report.ceoDecision === 'drop'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-white/5 text-slate-300 border-white/15 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Drop
              </button>
            </div>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            생성: {new Date(report.createdAt).toLocaleString('ko-KR')}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            수정: {new Date(report.updatedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}
