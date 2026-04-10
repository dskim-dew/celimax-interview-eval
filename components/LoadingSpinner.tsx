'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const STEPS = [
  { time: 0, label: '스크립트 분석 중...' },
  { time: 5, label: 'Q&A 추출 중...' },
  { time: 15, label: '토픽 분류 중...' },
];

const TIPS = [
  'Q&A 정리 후 내용을 확인하고 하이어링 매니저 소견을 작성합니다',
  '최종 의견은 Strong No / Weak No / Weak Go / Strong Go 중 선택합니다',
  '평가 기준은 헤더의 "인터뷰 가이드"를 참고하세요',
];

interface LoadingSpinnerProps {
  message?: string;
  streamedChars?: number;
}

export default function LoadingSpinner({
  message,
  streamedChars,
}: LoadingSpinnerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 현재 단계 결정
  const steps = STEPS;
  let currentStepIdx = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (elapsed >= steps[i].time) {
      currentStepIdx = i;
      break;
    }
  }

  const displayMessage = message || steps[currentStepIdx].label;

  return (
    <div className="glass-card p-10 flex flex-col items-center justify-center">
      {/* 스피너 */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-brand-deep/20" />
        <Loader2 className="absolute top-0 left-0 w-16 h-16 text-purple-500 animate-spin" />
      </div>

      {/* 메시지 */}
      <p className="mt-6 text-lg text-slate-200 font-medium">{displayMessage}</p>

      {/* 진행 단계 표시 */}
      <div className="mt-4 flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < currentStepIdx
                ? 'bg-brand-mid'
                : i === currentStepIdx
                ? 'bg-purple-400 animate-pulse'
                : 'bg-slate-600'
            }`} />
            <span className={`text-xs transition-colors duration-300 ${
              i <= currentStepIdx ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {step.label.replace('...', '')}
            </span>
            {i < steps.length - 1 && (
              <span className={`text-xs ${i < currentStepIdx ? 'text-brand-mid' : 'text-slate-700'}`}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* 수신 상태 */}
      <div className="mt-4">
        {streamedChars !== undefined && streamedChars > 0 ? (
          <p className="text-sm text-brand-mid">
            AI 응답 수신 중... ({streamedChars.toLocaleString()}자)
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            {elapsed > 0 ? `${elapsed}초 경과` : '잠시만 기다려주세요...'}
          </p>
        )}
      </div>

      {/* 팁 — 3열 그리드 */}
      <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-2xl">
        {TIPS.map((tip, i) => (
          <div key={i} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-xs text-slate-400">
              <span className="text-brand-light font-medium block mb-1">Tip {i + 1}</span>
              {tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
