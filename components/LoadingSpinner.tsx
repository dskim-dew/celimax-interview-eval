'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, PenLine, Save, ArrowRight } from 'lucide-react';

const STEPS = [
  { time: 0, label: '스크립트 분석 중...' },
  { time: 5, label: 'Q&A 추출 중...' },
  { time: 15, label: '토픽 분류 중...' },
];

const FLOW_STEPS = [
  { icon: CheckCircle2, label: 'Q&A 확인', desc: 'AI가 정리한 Q&A 내용을 검토합니다' },
  { icon: PenLine, label: '소견 작성', desc: '최종 의견 + 강점/약점 핵심가치 + 이유 작성' },
  { icon: Save, label: '저장', desc: '리포트를 저장하면 공유 링크가 생성됩니다' },
];

const DECISION_GUIDE = [
  {
    label: 'Strong No',
    color: 'bg-red-500/15 border-red-500/30',
    badgeClass: 'bg-red-600 text-white',
    criteria: '명확한 드랍 사유 존재',
    process: '민석님 확인 없이 HR 바로 불합격 처리',
    processColor: 'text-slate-400',
  },
  {
    label: 'Weak No',
    color: 'bg-orange-500/10 border-orange-500/25',
    badgeClass: 'bg-orange-500 text-white',
    criteria: '강점도 있지만 우려가 더 커서 드랍',
    process: '민석님 확인 없이 HR 바로 불합격 처리',
    processColor: 'text-slate-400',
  },
  {
    label: 'Weak Go',
    color: 'bg-amber-400/10 border-amber-400/25',
    badgeClass: 'bg-amber-400 text-slate-900',
    criteria: '우려의 크리티컬 여부, 강점이 상쇄할 수 있는지 논의 필요',
    process: '민석님 확인 → 불합격 / 추가 챌린지 / 2차 결정',
    processColor: 'text-brand-light',
  },
  {
    label: 'Strong Go',
    color: 'bg-emerald-500/10 border-emerald-500/25',
    badgeClass: 'bg-emerald-500 text-white',
    criteria: '역량과 가치관 모두 Fit',
    process: '민석님 확인 → 불합격 / 추가 챌린지 / 2차 결정',
    processColor: 'text-brand-light',
  },
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

      {/* 플로우 안내 */}
      <div className="mt-8 w-full max-w-4xl">
        <p className="text-sm font-bold text-slate-200 mb-3 text-center border-b border-white/10 pb-2">Q&A 정리 후 진행 순서</p>
        <div className="flex items-stretch gap-2">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center">
                  <Icon className="w-4 h-4 text-brand-mid" />
                  <span className="text-sm font-semibold text-white">{step.label}</span>
                  <span className="text-[11px] text-slate-400 leading-tight">{step.desc}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 최종 의견 판단 기준 */}
      <div className="mt-6 w-full max-w-4xl">
        <p className="text-sm font-bold text-slate-200 mb-3 text-center border-b border-white/10 pb-2">최종 의견 판단 기준</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {DECISION_GUIDE.map((d) => (
            <div key={d.label} className={`rounded-xl border p-3 ${d.color}`}>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${d.badgeClass}`}>
                {d.label}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
                <span className="text-slate-500 font-medium">기준</span>{' '}
                {d.criteria}
              </p>
              <p className={`text-[11px] leading-relaxed ${d.processColor}`}>
                <span className="text-slate-500 font-medium">절차</span>{' '}
                {d.process}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
