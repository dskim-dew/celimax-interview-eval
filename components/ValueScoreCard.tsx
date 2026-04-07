'use client';

import { AlertTriangle, Quote, CheckCircle } from 'lucide-react';
import { ValueEvaluation } from '@/lib/types';
import Linkify from './Linkify';

interface ValueScoreCardProps {
  name: string;
  evaluation: ValueEvaluation;
}

export default function ValueScoreCard({ name, evaluation }: ValueScoreCardProps) {
  const { evidence, specificCase, concerns, summary } = evaluation;

  return (
    <div className="rounded-xl p-5 bg-brand-deep/10 border border-brand-deep/15">
      {/* 항목명 + 요약 */}
      <h3 className="text-base font-semibold text-brand-light mb-2">{name}</h3>
      <p className="text-slate-300 text-sm mb-4"><Linkify>{summary}</Linkify></p>

      {/* 상세 내용 */}
      <div className="space-y-3 border-t border-brand-deep/10 pt-3">
        {specificCase && (
          <div>
            <h4 className="text-xs font-medium text-brand-mid mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              근거 사례
            </h4>
            <p className="text-sm text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
              <Linkify>{specificCase}</Linkify>
            </p>
          </div>
        )}

        {evidence.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-brand-mid mb-1.5 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5" />
              실제 발언
            </h4>
            <ul className="space-y-1">
              {evidence.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-400 flex items-start gap-1.5">
                  <span className="text-brand-mid mt-0.5">&ldquo;</span>
                  <span className="italic"><Linkify>{item}</Linkify></span>
                  <span className="text-brand-mid mt-0.5">&rdquo;</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {concerns.length > 0 && concerns[0] !== '' && (
          <div>
            <h4 className="text-xs font-medium text-orange-400 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              우려사항
            </h4>
            <ul className="space-y-1">
              {concerns.map((item, idx) => (
                <li key={idx} className="text-sm text-orange-300/80 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
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
