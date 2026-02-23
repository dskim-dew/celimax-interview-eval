'use client';

import { Trophy, CheckCircle, AlertTriangle, BookOpen, MessageSquare } from 'lucide-react';
import { OverallEvaluation, RECOMMENDATION_COLORS } from '@/lib/types';
import Linkify from './Linkify';

interface OverallSectionProps {
  evaluation: OverallEvaluation;
}

export default function OverallSection({ evaluation }: OverallSectionProps) {
  const { recommendation, strengths, risks, onboardingGuide, finalComment } = evaluation;

  return (
    <div className="glass-card overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800/80 to-purple-900/30 p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            종합 평가
          </h2>
          <span className={`px-5 py-2 rounded-xl text-lg font-bold ${RECOMMENDATION_COLORS[recommendation]}`}>
            {recommendation}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 최종 의견 */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            최종 의견
          </h3>
          <p className="text-slate-300 leading-relaxed"><Linkify>{finalComment}</Linkify></p>
        </div>

        {/* 3열 그리드: 강점 / 리스크 / 온보딩 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 강점 */}
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              강점
            </h3>
            <ul className="space-y-2">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-sm"><Linkify>{item}</Linkify></span>
                </li>
              ))}
            </ul>
          </div>

          {/* 리스크 */}
          <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              리스크 / 우려사항
            </h3>
            <ul className="space-y-2">
              {risks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-orange-400 mt-1">•</span>
                  <span className="text-sm"><Linkify>{item}</Linkify></span>
                </li>
              ))}
            </ul>
          </div>

          {/* 온보딩 가이드 */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              온보딩 가이드
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed"><Linkify>{onboardingGuide}</Linkify></p>
          </div>
        </div>
      </div>
    </div>
  );
}
