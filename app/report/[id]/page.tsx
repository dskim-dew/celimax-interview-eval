'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, X, Loader2, FileQuestion, Clock } from 'lucide-react';
import EvaluationReport from '@/components/EvaluationReport';
import QnASection from '@/components/QnASection';
import { EvaluationReport as ReportType, InterviewerNotes } from '@/lib/types';
import { getReportById, updateReport } from '@/lib/storage';

// 기존 형식 마이그레이션 (interviewerComment -> interviewerNotes, tiroLink -> tiroScript)
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
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      setReport({ ...report, interviewerNotes: notes });
    }
  };

  const handleSave = () => {
    if (!report) return;

    setIsSaving(true);
    try {
      const updatedReport = updateReport(report.id, {
        interviewerNotes: report.interviewerNotes,
      });
      if (updatedReport) {
        setReport(migrateReport(updatedReport));
        setIsEditing(false);
      }
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로 가기
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isEditing
              ? 'bg-slate-600/50 text-slate-300 hover:bg-slate-600/70 border border-slate-500/30'
              : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              편집 취소
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              편집 모드
            </>
          )}
        </button>
      </div>

      {/* Q&A 섹션 */}
      {report.qnaData && (
        <QnASection
          qnaData={report.qnaData}
          onGenerateEvaluation={() => {}}
          evaluationLoading={false}
          hasReport={true}
        />
      )}

      {/* 보고서 내용 */}
      <EvaluationReport
        report={report}
        onNotesChange={handleNotesChange}
        onSave={handleSave}
        isSaving={isSaving}
        readOnly={!isEditing}
      />

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
