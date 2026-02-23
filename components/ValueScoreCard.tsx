'use client';

import { AlertTriangle, Quote, CheckCircle } from 'lucide-react';
import { ValueEvaluation, ValueScore, SCORE_COLORS, SCORE_BG_COLORS } from '@/lib/types';
import Linkify from './Linkify';

interface ValueScoreCardProps {
  name: string;
  evaluation: ValueEvaluation;
}

const SCORE_LABELS: Record<ValueScore, string> = {
  5: '매우 우수',
  4: '우수',
  3: '보통',
  2: '미흡',
  1: '부족',
};

export default function ValueScoreCard({ name, evaluation }: ValueScoreCardProps) {
  const { score, evidence, specificCase, concerns, summary } = evaluation;

  return (
    <div className={`glass-card overflow-hidden bg-gradient-to-br ${SCORE_BG_COLORS[score]}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <span className="text-sm text-slate-400">{SCORE_LABELS[score]}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${SCORE_COLORS[score]}`}>
          {score}점
        </span>
      </div>

      {/* 종합 의견 */}
      <div className="px-4 pb-3">
        <p className="text-slate-300 text-sm"><Linkify>{summary}</Linkify></p>
      </div>

      {/* 상세 내용 - 항상 표시 */}
      <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
        {/* 근거 사례 */}
        {specificCase && (
          <div>
            <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              근거 사례
            </h4>
            <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <Linkify>{specificCase}</Linkify>
            </p>
          </div>
        )}

        {/* 실제 발언 */}
        {evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
              <Quote className="w-4 h-4" />
              실제 발언
            </h4>
            <ul className="space-y-1">
              {evidence.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">&ldquo;</span>
                  <span className="italic"><Linkify>{item}</Linkify></span>
                  <span className="text-blue-400 mt-1">&rdquo;</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 우려사항 */}
        {concerns.length > 0 && concerns[0] !== '' && (
          <div>
            <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              우려사항
            </h4>
            <ul className="space-y-1">
              {concerns.map((item, idx) => (
                <li key={idx} className="text-sm text-orange-300/80 flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><Linkify>{item}</Linkify></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
