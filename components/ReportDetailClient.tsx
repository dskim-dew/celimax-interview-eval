'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, User, Briefcase, Users, Calendar, Hash, PenLine } from 'lucide-react';
import EvaluationReport from '@/components/EvaluationReport';
import QnASection from '@/components/QnASection';
import InterviewerComment from '@/components/InterviewerComment';
import CopyButton from '@/components/CopyButton';
import ReportTOC, { TOCItem } from '@/components/ReportTOC';
import { EvaluationReport as ReportType, InterviewerNotes } from '@/lib/types';

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

  const tocItems: TOCItem[] = useMemo(() => {
    const items: TOCItem[] = [
      { id: 'section-info', label: '기본 정보' },
      { id: 'section-notes', label: '면접관 소견' },
    ];
    if (report.qnaData) {
      items.push({ id: 'section-qna', label: '면접 Q&A' });
    }
    items.push(
      { id: 'section-overall', label: '종합 분석' },
      { id: 'section-competency', label: '직무 역량' },
      { id: 'section-values', label: '핵심 가치' },
    );
    return items;
  }, [report.qnaData]);

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

        {/* 1. 기본 정보 */}
        <div id="section-info" className="glass-card p-6 scroll-mt-8">
          <h1 className="text-2xl font-bold gradient-text mb-4">
            {report.interviewInfo.interviewRound
              ? `[${report.interviewInfo.interviewRound} 인터뷰] ${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`
              : `[인터뷰] ${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-mid" />
              <span className="text-slate-300">지원자:</span>
              <span className="font-medium text-white">{report.interviewInfo.candidateName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-mid" />
              <span className="text-slate-300">포지션:</span>
              <span className="font-medium text-white">{report.interviewInfo.position}</span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-mid" />
              <span className="text-slate-300">면접관:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewerName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-mid" />
              <span className="text-slate-300">면접일:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewDate}</span>
            </p>
            <p className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-mid" />
              <span className="text-slate-300">인터뷰 차수:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewRound ?? '-'}</span>
            </p>
            {report.interviewInfo.reportAuthor && (
              <p className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-brand-mid" />
                <span className="text-slate-300">작성자:</span>
                <span className="font-medium text-white">{report.interviewInfo.reportAuthor}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. 면접관 소견 */}
        <div id="section-notes" className="scroll-mt-8">
          <InterviewerComment
            notes={report.interviewerNotes}
            onChange={handleNotesChange}
            readOnly={true}
          />
        </div>

        {/* 3. Q&A 섹션 */}
        {report.qnaData && (
          <div id="section-qna" className="scroll-mt-8">
            <QnASection
              qnaData={report.qnaData}
              onGenerateEvaluation={() => {}}
              evaluationLoading={false}
              hasReport={true}
            />
          </div>
        )}

        {/* 4. AI 분석 (종합 → 직무 역량 → 핵심 가치) */}
        <EvaluationReport
          report={report}
          readOnly={true}
          hideHeader={true}
          hideNotes={true}
          sectionIds={{
            overall: 'section-overall',
            competency: 'section-competency',
            values: 'section-values',
          }}
        />

        {/* 4. 공유 버튼 */}
        <div className="flex justify-center pt-2 pb-4">
          <CopyButton report={report} />
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
