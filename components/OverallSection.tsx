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
      <div className="bg-gradient-to-r from-slate-800/80 to-purple-900/30 p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          종합 분석
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {/* 종합 의견 */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            종합 의견
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed"><Linkify>{finalComment}</Linkify></p>
        </div>

        {/* 강점 */}
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <h3 className="text-base font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            강점
          </h3>
          <ul className="space-y-2">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span className="text-sm"><Linkify>{item}</Linkify></span>
              </li>
            ))}
          </ul>
        </div>

        {/* 리스크 */}
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
  );
}
