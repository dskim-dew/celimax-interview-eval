'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileQuestion, Clock, User, Briefcase, Users, Calendar, Hash, PenLine } from 'lucide-react';
import EvaluationReport from '@/components/EvaluationReport';
import QnASection from '@/components/QnASection';
import CopyButton from '@/components/CopyButton';
import { EvaluationReport as ReportType, InterviewerNotes } from '@/lib/types';
import { getReportById, updateReport } from '@/lib/storage';

function migrateReport(report: ReportType): ReportType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = report as any;
  let migrated = { ...report };

  if (!report.interviewerNotes || typeof report.interviewerNotes !== 'object') {
    const oldComment: string = raw.interviewerComment || '';
    migrated = {
      ...migrated,
      interviewerNotes: {
        strengths: oldComment,
        concerns: '',
        validation: '',
      },
    };
  }

  if (migrated.interviewInfo.tiroScript === undefined) {
    migrated = {
      ...migrated,
      interviewInfo: {
        ...migrated.interviewInfo,
        tiroScript: '',
      },
    };
  }

  return migrated;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const loadedReport = getReportById(id);
    if (loadedReport) {
      setReport(migrateReport(loadedReport));
    }
    setIsLoading(false);
  }, [params.id]);

  const handleNotesChange = (notes: InterviewerNotes) => {
    if (report) {
      const updated = { ...report, interviewerNotes: notes };
      setReport(updated);
      updateReport(report.id, { interviewerNotes: notes });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-card p-12 text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-slate-500" />
        <h3 className="mt-4 text-xl font-semibold text-white">보고서를 찾을 수 없습니다</h3>
        <p className="mt-2 text-slate-400">요청하신 보고서가 존재하지 않거나 삭제되었습니다.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* 1. 면접 평가 보고서 기본 정보 */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold gradient-text mb-4">
          {report.interviewInfo.interviewRound
            ? `[${report.interviewInfo.interviewRound} 인터뷰] ${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`
            : `[인터뷰] ${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">지원자:</span>
            <span className="font-medium text-white">{report.interviewInfo.candidateName}</span>
          </p>
          <p className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">포지션:</span>
            <span className="font-medium text-white">{report.interviewInfo.position}</span>
          </p>
          <p className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">면접관:</span>
            <span className="font-medium text-white">{report.interviewInfo.interviewerName}</span>
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">면접일:</span>
            <span className="font-medium text-white">{report.interviewInfo.interviewDate}</span>
          </p>
          <p className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">인터뷰 차수:</span>
            <span className="font-medium text-white">{report.interviewInfo.interviewRound ?? '-'}</span>
          </p>
          {report.interviewInfo.reportAuthor && (
            <p className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">작성자:</span>
              <span className="font-medium text-white">{report.interviewInfo.reportAuthor}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Q&A 섹션 */}
      {report.qnaData && (
        <QnASection
          qnaData={report.qnaData}
          onGenerateEvaluation={() => {}}
          evaluationLoading={false}
          hasReport={true}
        />
      )}

      {/* 3. 평가표 (헤더 제외) */}
      <EvaluationReport
        report={report}
        onNotesChange={handleNotesChange}
        readOnly={true}
        hideHeader={true}
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
  );
}
