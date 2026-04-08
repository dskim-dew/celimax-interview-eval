'use client';

import { Trophy, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { OverallEvaluation } from '@/lib/types';
import Linkify from './Linkify';

interface OverallSectionProps {
  evaluation: OverallEvaluation;
}

export default function OverallSection({ evaluation }: OverallSectionProps) {
  const { strengths, risks, finalComment } = evaluation;

  return (
    <div className="glass-card overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-brand-dark/80 to-brand-deep/20 p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          종합 분석
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {/* 종합 의견 */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-mid" />
            종합 의견
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed"><Linkify>{finalComment}</Linkify></p>
        </div>

        {/* 강점 + 리스크 (가로 배치) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-brand-deep/15 rounded-xl p-4 border border-brand-deep/20">
            <h3 className="text-base font-semibold text-brand-mid mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              강점
            </h3>
            <ul className="space-y-2">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-brand-mid mt-0.5">•</span>
                  <span className="text-sm"><Linkify>{item}</Linkify></span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
            <h3 className="text-base font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              리스크 / 우려사항
            </h3>
            <ul className="space-y-2">
              {risks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span className="text-sm"><Linkify>{item}</Linkify></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
