'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, AlertCircle, RefreshCw, CheckCircle2, Clock, MessageSquare, Save, BookOpen, ChevronDown } from 'lucide-react';
import InterviewForm from '@/components/InterviewForm';
import QnASection from '@/components/QnASection';
import LoadingSpinner from '@/components/LoadingSpinner';
import SaveConfirmDialog from '@/components/SaveConfirmDialog';
import InterviewerComment from '@/components/InterviewerComment';
import { InterviewInfo, EvaluationReport as ReportType, InterviewerNotes, QnAData } from '@/lib/types';
import { POSITION_GUIDES } from '@/lib/constants';

const EMPTY_NOTES: InterviewerNotes = {
  comment: '',
  strengths: [],
  weaknesses: [],
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

function PositionGuideAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <BookOpen className="w-4 h-4 text-brand-mid" />
          포지션별 면접 평가 가이드
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 grid gap-3 sm:grid-cols-3">
          {POSITION_GUIDES.map((guide) => (
            <div key={guide.key} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h4 className="text-sm font-bold text-white mb-1">{guide.title}</h4>
              <p className="text-xs text-brand-mid mb-2">{guide.description}</p>
              <ul className="space-y-1">
                {guide.criteria.map((c, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-brand-mid mt-0.5 shrink-0">-</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  // 상태
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Q&A 프로세스 상태
  const [qnaData, setQnaData] = useState<QnAData | null>(null);
  const [qnaLoading, setQnaLoading] = useState(false);

  // beforeunload 경고: 미저장 리포트가 있을 때 이탈 방지
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (report && !isSaved) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [report, isSaved]);

  // localStorage 자동 임시저장 (5초 디바운스)
  useEffect(() => {
    if (!report || isSaved) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('celimax-draft', JSON.stringify({
          report,
          qnaData,
          savedAt: new Date().toISOString(),
        }));
      } catch { /* quota exceeded 등 무시 */ }
    }, 5000);
    return () => clearTimeout(timer);
  }, [report, qnaData, isSaved]);

  // 페이지 로드 시 임시저장 복구 확인
  useEffect(() => {
    try {
      const draft = localStorage.getItem('celimax-draft');
      if (!draft) return;
      const { report: draftReport, qnaData: draftQna, savedAt } = JSON.parse(draft);
      if (!draftReport) return;
      const time = new Date(savedAt).toLocaleString('ko-KR');
      if (confirm(`${time}에 임시 저장된 리포트가 있습니다. 복구하시겠습니까?`)) {
        setReport(draftReport);
        if (draftQna) setQnaData(draftQna);
      }
      localStorage.removeItem('celimax-draft');
    } catch { /* 파싱 실패 시 무시 */ }
  }, []);

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


  // Q&A 정리 후 바로 report 객체 생성
  const createReportFromQnA = (interviewInfo: InterviewInfo, data: QnAData) => {
    const now = new Date().toISOString();
    const newReport: ReportType = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      interviewInfo,
      interviewerNotes: { ...EMPTY_NOTES },
      qnaData: data,
    };
    setReport(newReport);
  };

  // Q&A 정리
  const handleSubmit = async (interviewInfo: InterviewInfo) => {
    if (cooldownSec > 0) {
      setError(`API 쿨다운 중입니다. ${cooldownSec}초 후에 다시 시도해주세요.`);
      return;
    }
    setError(null);
    setReport(null);

    const submitData = { ...interviewInfo };
    if (interviewInfo.tiroScript && !interviewInfo.transcript) {
      submitData.transcript = interviewInfo.tiroScript;
    }


    setQnaLoading(true);
    setQnaData(null);
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
      createReportFromQnA(submitData, data);
    } catch (err) {
      const error = err as SSEError;
      if (error.retryAfterSec) startCooldown(error.retryAfterSec);
      setError(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setQnaLoading(false);
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
      setIsSaved(true);
      setShowSaveDialog(false);
      try { localStorage.removeItem('celimax-draft'); } catch {}
      router.push(`/report/${updatedReport.id}`);
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };

  // 면접관 소견만 작성 (스크립트 없이)
  const handleDirectSubmit = async (interviewInfo: InterviewInfo) => {
    setError(null);
    setReport(null);
    setQnaData(null);


    const now = new Date().toISOString();
    const newReport: ReportType = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      interviewInfo,
      interviewerNotes: { ...EMPTY_NOTES },
    };
    setReport(newReport);
  };

  const handleNewReport = () => {
    setReport(null);
    setQnaData(null);
    setError(null);
    setIsSaved(false);
    try { localStorage.removeItem('celimax-draft'); } catch {}
  };

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
      {!report && !qnaData && !qnaLoading && (
        <InterviewForm onSubmit={handleSubmit} onDirectSubmit={handleDirectSubmit} isLoading={qnaLoading} />
      )}

      {/* 로딩 */}
      {qnaLoading && <LoadingSpinner phase="qna" streamedChars={streamProgress} />}

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

      {/* Q&A 섹션 (탭 없이 직렬 표시) */}
      {qnaData && !qnaLoading && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-mid" />
              <h2 className="text-lg font-bold text-white">Q&A 스크립트</h2>
              <CheckCircle2 className="w-4 h-4 text-green-400 ml-1" />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <QnASection qnaData={qnaData} />
          </div>
        </div>
      )}

      {/* 소견란 + 저장 버튼 */}
      {report && !qnaLoading && (
        <div className="space-y-6">
          {/* 포지션별 면접 가이드 (접이식) */}
          <PositionGuideAccordion />

          <InterviewerComment
            notes={report.interviewerNotes}
            onChange={handleNotesChange}
            decisionFirst
          />
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                isSaving
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-deep to-emerald-600 text-white hover:from-brand-mid hover:to-emerald-500 shadow-xl shadow-brand-deep/30 hover:shadow-2xl hover:scale-[1.02]'
              }`}
            >
              <Save className="w-5 h-5" />
              {isSaving ? '저장 중...' : '최종 리포트 저장'}
            </button>
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
