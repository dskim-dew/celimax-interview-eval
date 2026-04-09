'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { FileText, Plus, AlertCircle, RefreshCw, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import InterviewForm from '@/components/InterviewForm';
import EvaluationReport from '@/components/EvaluationReport';
import QnASection from '@/components/QnASection';
import LoadingSpinner from '@/components/LoadingSpinner';
import SaveConfirmDialog from '@/components/SaveConfirmDialog';
import { InterviewInfo, EvaluationReport as ReportType, AIEvaluationResponse, InterviewerNotes, QnAData } from '@/lib/types';

const EMPTY_NOTES: InterviewerNotes = {
  comment: '',
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

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


  // 1단계: Q&A 정리
  const handleSubmit = async (interviewInfo: InterviewInfo) => {
    if (cooldownSec > 0) {
      setError(`API 쿨다운 중입니다. ${cooldownSec}초 후에 다시 시도해주세요.`);
      return;
    }
    setError(null);
    setReport(null);
    setCurrentInterviewInfo(interviewInfo);

    const submitData = { ...interviewInfo };
    if (interviewInfo.tiroScript && !interviewInfo.transcript) {
      submitData.transcript = interviewInfo.tiroScript;
    }
    setCurrentInterviewInfo(submitData);

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
        immersion: evaluation.immersion,
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

  // Q&A 없이 직접 평가 생성 (빠른 모드)
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
        immersion: evaluation.immersion,
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
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!report) return;

    setIsSaving(true);
    try {
      const updatedReport = {
        ...report,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReport),
      });
      if (!res.ok) throw new Error('저장 실패');
      setShowSaveDialog(false);
      router.push(`/report/${updatedReport.id}`);
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };


  // Q&A 없이 바로 평가 또는 면접관 소견만 작성
  const handleDirectSubmit = async (interviewInfo: InterviewInfo) => {
    setError(null);
    setReport(null);
    setQnaData(null);
    setCurrentInterviewInfo(interviewInfo);

    const hasScript = (interviewInfo.tiroScript || '').trim().length > 0;

    if (!hasScript) {
      // 스크립트 없음: AI 분석 없이 면접관 소견만 작성
      const now = new Date().toISOString();
      const newReport: ReportType = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        interviewInfo,
        interviewerNotes: { ...EMPTY_NOTES },
      };
      setReport(newReport);
      setActiveTab('evaluation');
    } else {
      // 스크립트 있음: AI 직접 평가
      await generateEvaluationDirect(interviewInfo);
    }
  };

  const handleNewReport = () => {
    setReport(null);
    setQnaData(null);
    setCurrentInterviewInfo(null);
    setError(null);
    setActiveTab('qna');
  };

  const isAnyLoading = qnaLoading || evaluationLoading;

  // 탭 컨테이너를 보여줄 조건: Q&A 또는 평가표가 있을 때
  const showTabs = (qnaData || report) && !isAnyLoading;

  return (
    <div className="space-y-6">
      {/* 새 보고서 작성 버튼 (리포트 진행 중일 때만) */}
      {(report || qnaData) && (
        <div className="flex justify-end">
          <button
            onClick={handleNewReport}
            className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            새 보고서 작성
          </button>
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
                    ? 'text-white border-b-2 border-brand-deep bg-brand-deep/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Q&A 스크립트</span>
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
                  ? 'text-white border-b-2 border-brand-deep bg-brand-deep/15'
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
                  qnaData={qnaData ?? undefined}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* 저장 확인 다이얼로그 */}
      {showSaveDialog && report && (
        <SaveConfirmDialog
          report={report}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveDialog(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

