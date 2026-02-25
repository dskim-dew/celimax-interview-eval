'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { FileText, FolderOpen, Plus, AlertCircle, RefreshCw, AlertTriangle, Info, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import InterviewForm from '@/components/InterviewForm';
import EvaluationReport from '@/components/EvaluationReport';
import QnASection from '@/components/QnASection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { InterviewInfo, EvaluationReport as ReportType, AIEvaluationResponse, InterviewerNotes, QnAData } from '@/lib/types';
import { saveReport, getReports } from '@/lib/storage';

const EMPTY_NOTES: InterviewerNotes = {
  strengths: '',
  concerns: '',
  validation: '',
};

// SSE 스트림 소비 헬퍼
interface SSEError extends Error {
  retryAfterSec?: number;
}

async function consumeSSEStream<T>(
  response: Response,
  onProgress?: (chars: number) => void
): Promise<T> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalChars = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const newlineIdx = buffer.indexOf('\n');
      if (newlineIdx === -1) break;

      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'chunk') {
            totalChars += event.text.length;
            onProgress?.(totalChars);
          } else if (event.type === 'retry') {
            totalChars = 0;
            onProgress?.(0);
          } else if (event.type === 'result') {
            return event.data as T;
          } else if (event.type === 'error') {
            const err = new Error(event.message) as SSEError;
            if (event.retryAfterSec) err.retryAfterSec = event.retryAfterSec;
            throw err;
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }

  throw new Error('스트림이 결과 없이 종료되었습니다.');
}

export default function Home() {
  const router = useRouter();

  // 기존 상태
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportsCount, setSavedReportsCount] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showStorageWarning, setShowStorageWarning] = useState(true);

  // 2단계 프로세스 상태
  const [qnaData, setQnaData] = useState<QnAData | null>(null);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [currentInterviewInfo, setCurrentInterviewInfo] = useState<InterviewInfo | null>(null);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'qna' | 'evaluation'>('qna');

  // Rate limit 쿨다운 상태
  const [cooldownSec, setCooldownSec] = useState(0);
  const [streamProgress, setStreamProgress] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldownSec(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldownSec(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  useEffect(() => {
    setSavedReportsCount(getReports().length);
    const warningShown = localStorage.getItem('storage-warning-shown');
    if (warningShown) {
      setShowStorageWarning(false);
    }
  }, []);

  const dismissStorageWarning = () => {
    localStorage.setItem('storage-warning-shown', 'true');
    setShowStorageWarning(false);
  };

  // 1단계: Q&A 정리 또는 데모 모드 직행
  const handleSubmit = async (interviewInfo: InterviewInfo) => {
    if (cooldownSec > 0) {
      setError(`API 쿨다운 중입니다. ${cooldownSec}초 후에 다시 시도해주세요.`);
      return;
    }
    setError(null);
    setReport(null);
    setIsDemoMode(false);
    setCurrentInterviewInfo(interviewInfo);

    const submitData = { ...interviewInfo };
    if (interviewInfo.tiroScript && !interviewInfo.transcript) {
      submitData.transcript = interviewInfo.tiroScript;
    }
    setCurrentInterviewInfo(submitData);

    const scriptLength = (submitData.tiroScript || '').trim().length;
    const transcriptLength = (submitData.transcript || '').trim().length;
    const isDemo = scriptLength < 100 && transcriptLength < 100;

    if (isDemo) {
      setIsDemoMode(true);
      setQnaData(null);
      await generateEvaluationDirect(submitData);
      return;
    }

    setQnaLoading(true);
    setQnaData(null);
    setActiveTab('qna');
    setStreamProgress(0);

    try {
      const response = await fetch('/api/generate-qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiroScript: submitData.tiroScript || submitData.transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && errorData.retryAfterSec) {
          startCooldown(errorData.retryAfterSec);
        }
        throw new Error(errorData.error || 'Q&A 정리에 실패했습니다.');
      }

      const data = await consumeSSEStream<QnAData>(response, (chars) => setStreamProgress(chars));
      setQnaData(data);
      setActiveTab('qna');
    } catch (err) {
      const error = err as SSEError;
      if (error.retryAfterSec) startCooldown(error.retryAfterSec);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setQnaLoading(false);
    }
  };

  // 2단계: Q&A 기반 평가표 작성
  const handleGenerateEvaluation = async () => {
    if (!currentInterviewInfo || !qnaData) return;
    if (cooldownSec > 0) {
      setError(`API 쿨다운 중입니다. ${cooldownSec}초 후에 다시 시도해주세요.`);
      return;
    }

    setEvaluationLoading(true);
    setError(null);
    setStreamProgress(0);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentInterviewInfo,
          qnaData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && errorData.retryAfterSec) {
          startCooldown(errorData.retryAfterSec);
        }
        throw new Error(errorData.error || '평가표 작성에 실패했습니다.');
      }

      const evaluation = await consumeSSEStream<AIEvaluationResponse>(response, (chars) => setStreamProgress(chars));

      const now = new Date().toISOString();
      const newReport: ReportType = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        interviewInfo: currentInterviewInfo,
        values: evaluation.values,
        competencies: evaluation.competencies,
        overall: evaluation.overall,
        interviewerNotes: { ...EMPTY_NOTES },
        qnaData,
      };

      setReport(newReport);
      setActiveTab('evaluation');
    } catch (err) {
      const error = err as SSEError;
      if (error.retryAfterSec) startCooldown(error.retryAfterSec);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  // 데모 모드: Q&A 없이 직접 평가 생성
  const generateEvaluationDirect = async (interviewInfo: InterviewInfo) => {
    setEvaluationLoading(true);
    setError(null);
    setStreamProgress(0);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && errorData.retryAfterSec) {
          startCooldown(errorData.retryAfterSec);
        }
        throw new Error(errorData.error || '보고서 생성에 실패했습니다.');
      }

      const evaluation = await consumeSSEStream<AIEvaluationResponse>(response, (chars) => setStreamProgress(chars));

      const now = new Date().toISOString();
      const newReport: ReportType = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        interviewInfo,
        values: evaluation.values,
        competencies: evaluation.competencies,
        overall: evaluation.overall,
        interviewerNotes: { ...EMPTY_NOTES },
      };

      setReport(newReport);
      setActiveTab('evaluation');
    } catch (err) {
      const error = err as SSEError;
      if (error.retryAfterSec) startCooldown(error.retryAfterSec);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleNotesChange = (notes: InterviewerNotes) => {
    if (report) {
      setReport({ ...report, interviewerNotes: notes });
    }
  };

  const handleSave = () => {
    if (!report) return;

    setIsSaving(true);
    try {
      const updatedReport = {
        ...report,
        updatedAt: new Date().toISOString(),
      };
      saveReport(updatedReport);
      router.push(`/report/${updatedReport.id}`);
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };


  // Q&A 없이 바로 평가 (빠른 모드)
  const handleDirectSubmit = async (interviewInfo: InterviewInfo) => {
    setError(null);
    setReport(null);
    setQnaData(null);
    setIsDemoMode(false);
    setCurrentInterviewInfo(interviewInfo);
    await generateEvaluationDirect(interviewInfo);
  };

  const handleNewReport = () => {
    setReport(null);
    setQnaData(null);
    setCurrentInterviewInfo(null);
    setError(null);
    setIsDemoMode(false);
    setActiveTab('qna');
  };

  const isAnyLoading = qnaLoading || evaluationLoading;

  // 탭 컨테이너를 보여줄 조건: Q&A 또는 평가표가 있을 때
  const showTabs = (qnaData || report) && !isAnyLoading;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Celimax 면접 리포트 생성</h1>
            <p className="text-sm text-slate-400">AI 기반 면접 보고서 생성</p>
          </div>
        </div>
        <div className="flex gap-3">
          {(report || qnaData) && (
            <button
              onClick={handleNewReport}
              className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              새 보고서 작성
            </button>
          )}
          <Link
            href="/history"
            className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
          >
            <FolderOpen className="w-4 h-4" />
            저장된 보고서
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
              {savedReportsCount}개
            </span>
          </Link>
        </div>
      </div>

      {/* localStorage 경고 */}
      {showStorageWarning && (
        <div className="glass-card p-4 border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-300 text-sm">
                <strong>데이터 저장 안내:</strong> 보고서는 브라우저의 로컬 스토리지에 저장됩니다.
                브라우저 데이터를 삭제하거나 다른 기기/브라우저에서는 데이터에 접근할 수 없습니다.
              </p>
            </div>
            <button
              onClick={dismissStorageWarning}
              className="text-yellow-400 hover:text-yellow-300 text-sm shrink-0"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠: 입력 폼 */}
      {!report && !qnaData && !isAnyLoading && (
        <InterviewForm onSubmit={handleSubmit} onDirectSubmit={handleDirectSubmit} isLoading={isAnyLoading} />
      )}

      {/* 로딩 */}
      {qnaLoading && <LoadingSpinner message="스크립트를 Q&A 형식으로 정리하고 있습니다..." streamedChars={streamProgress} />}
      {evaluationLoading && !qnaLoading && <LoadingSpinner message="평가표를 작성하고 있습니다..." streamedChars={streamProgress} />}

      {/* 쿨다운 타이머 */}
      {cooldownSec > 0 && !error && (
        <div className="glass-card p-4 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-medium">
              API 요청 한도 초과 - {Math.floor(cooldownSec / 60)}분 {cooldownSec % 60}초 후 재시도 가능
            </span>
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="glass-card p-6 border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-2">오류 발생</h3>
              <p className="text-slate-300 mb-4">{error}</p>
              {cooldownSec > 0 && (
                <div className="flex items-center gap-2 mb-4 text-amber-400 text-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>{Math.floor(cooldownSec / 60)}분 {cooldownSec % 60}초 후 재시도 가능</span>
                </div>
              )}
              <button
                onClick={() => setError(null)}
                disabled={cooldownSec > 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                  cooldownSec > 0
                    ? 'bg-slate-700/30 text-slate-500 border-slate-600/30 cursor-not-allowed'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-500/30'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                {cooldownSec > 0 ? `대기 중 (${cooldownSec}초)` : '다시 시도'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데모 모드 알림 */}
      {report && isDemoMode && (
        <div className="glass-card p-4 border-blue-500/30 bg-blue-500/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">데모 모드</p>
              <p className="text-blue-200/70 text-sm">
                면접 내용(Transcript)이 제공되지 않아 AI가 가상의 현실적인 면접 시나리오를 생성하여 평가했습니다.
                실제 면접 내용을 입력하면 더 정확한 평가를 받을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 탭 컨테이너 */}
      {showTabs && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* 탭 헤더 */}
          <div className="tab-buttons flex flex-col sm:flex-row gap-0 border-b border-white/20">
            {/* Q&A 탭 (Q&A 데이터가 있을 때만 표시) */}
            {qnaData && (
              <button
                onClick={() => setActiveTab('qna')}
                className={`flex-1 sm:flex-none px-6 py-4 font-semibold transition-all duration-200 ${
                  activeTab === 'qna'
                    ? 'text-white border-b-2 border-purple-400 bg-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>면접 Q&A</span>
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-1" />
                </div>
              </button>
            )}

            {/* 평가표 탭 */}
            <button
              onClick={() => setActiveTab('evaluation')}
              disabled={!report}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold transition-all duration-200 ${
                activeTab === 'evaluation'
                  ? 'text-white border-b-2 border-blue-400 bg-blue-500/10'
                  : report
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <FileText className="w-5 h-5" />
                <span>평가표</span>
                {report && <CheckCircle2 className="w-4 h-4 text-green-400 ml-1" />}
                {!report && evaluationLoading && (
                  <span className="text-xs text-slate-500 ml-1">작성 중...</span>
                )}
              </div>
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6 sm:p-8">
            {/* Q&A 탭 */}
            {activeTab === 'qna' && qnaData && (
              <div className="animate-fadeIn">
                <QnASection
                  qnaData={qnaData}
                  onGenerateEvaluation={handleGenerateEvaluation}
                  evaluationLoading={evaluationLoading}
                  hasReport={!!report}
                  onSwitchToEvaluation={() => setActiveTab('evaluation')}
                />
              </div>
            )}

            {/* 평가표 탭 */}
            {activeTab === 'evaluation' && report && (
              <div className="animate-fadeIn">
                <EvaluationReport
                  report={report}
                  onNotesChange={handleNotesChange}
                  onSave={handleSave}
                  isSaving={isSaving}
                />

                {/* Q&A로 돌아가기 버튼 */}
                {qnaData && (
                  <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-400/30">
                    <p className="text-purple-300 mb-3 text-sm">원본 면접 Q&A를 다시 확인하고 싶으신가요?</p>
                    <button
                      onClick={() => setActiveTab('qna')}
                      className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Q&A 보기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 데모 모드: Q&A 없이 평가표만 (탭 없이 바로 표시) */}
            {activeTab === 'evaluation' && report && !qnaData && isDemoMode && null}
          </div>
        </div>
      )}

      {/* 데모 모드에서 Q&A 없이 평가표만 있는 경우 (탭 컨테이너 없이) */}
      {report && !qnaData && !showTabs && !isAnyLoading && (
        <div className="space-y-6">
          <EvaluationReport
            report={report}
            onNotesChange={handleNotesChange}
            onSave={handleSave}
            isSaving={isSaving}
          />

        </div>
      )}
    </div>
  );
}

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

  if (raw.interviewInfo?.tiroLink && !migrated.interviewInfo.tiroScript) {
    migrated = {
      ...migrated,
      interviewInfo: {
        ...migrated.interviewInfo,
        tiroScript: '',
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
