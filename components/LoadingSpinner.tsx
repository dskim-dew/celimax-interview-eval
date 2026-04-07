'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  streamedChars?: number;
}

export default function LoadingSpinner({ message = 'AI가 면접 내용을 분석하고 있습니다...', streamedChars }: LoadingSpinnerProps) {
  return (
    <div className="glass-card p-12 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-lime-500/20"></div>
        <Loader2 className="absolute top-0 left-0 w-16 h-16 text-purple-500 animate-spin" />
      </div>
      <p className="mt-6 text-lg text-slate-200">{message}</p>
      {streamedChars !== undefined && streamedChars > 0 ? (
        <p className="mt-2 text-sm text-emerald-400">
          AI 응답 수신 중... ({streamedChars.toLocaleString()}자)
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-400">잠시만 기다려주세요...</p>
      )}
      <div className="mt-6 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-lime-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-lime-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-lime-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
