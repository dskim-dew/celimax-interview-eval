'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { QnAData, QNA_TOPIC_ORDER, QnATopicCategory } from '@/lib/types';
import Linkify from './Linkify';

interface QnASectionProps {
  qnaData: QnAData;
  onGenerateEvaluation: () => void;
  evaluationLoading: boolean;
  hasReport: boolean;
  onSwitchToEvaluation?: () => void;
}

export default function QnASection({
  qnaData,
  onGenerateEvaluation,
  evaluationLoading,
  hasReport,
  onSwitchToEvaluation,
}: QnASectionProps) {
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const filteredQna = topicFilter
    ? qnaData.qna.filter(item => item.topic === topicFilter)
    : qnaData.qna;

  return (
    <div className="space-y-4">
      {/* 토픽 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTopicFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !topicFilter
              ? 'bg-brand-deep/30 text-brand-light border border-brand-deep/40'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          전체 ({qnaData.metadata.totalQuestions})
        </button>
        {(() => {
          const allTopics = Array.from(new Set(qnaData.qna.map(q => q.topic)));
          const ordered = QNA_TOPIC_ORDER.filter(t => allTopics.includes(t));
          const extra = allTopics.filter(t => !(QNA_TOPIC_ORDER as string[]).includes(t));
          return [...ordered, ...extra].map(topic => {
            const count = qnaData.qna.filter(q => q.topic === topic).length;
            return (
              <button
                key={topic}
                onClick={() => setTopicFilter(topicFilter === topic ? null : topic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  topicFilter === topic
                    ? 'bg-brand-deep/30 text-brand-light border border-brand-deep/40'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {topic} ({count})
              </button>
            );
          });
        })()}
      </div>

      {/* Q&A 목록 */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredQna.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 rounded-lg p-5 border border-white/10"
          >
            <span className="inline-block px-3 py-1 bg-brand-deep/20 text-brand-light text-xs rounded-full mb-3">
              {item.topic}
            </span>

            <div className="mb-3">
              <p className="text-sm text-brand-light mb-1 font-medium">
                Q{item.id}. 면접관
              </p>
              <p className="text-white pl-4 border-l-2 border-brand-deep">
                <Linkify>{item.question}</Linkify>
              </p>
            </div>

            <div>
              <p className="text-sm text-green-300 mb-1 font-medium">
                A. 지원자
              </p>
              <p className="text-slate-200 pl-4 border-l-2 border-green-400 leading-relaxed">
                <Linkify>{item.answer}</Linkify>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2단계 버튼 (평가표 미완료 시) */}
      {!hasReport && (
        <button
          onClick={onGenerateEvaluation}
          disabled={evaluationLoading}
          className={`w-full mt-4 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
            evaluationLoading
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-brand-deep/25 hover:shadow-brand-deep/40'
          }`}
        >
          {evaluationLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              평가표 작성 중...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              2단계: 평가표 작성
            </>
          )}
        </button>
      )}

      {/* 평가표로 이동 버튼 (완료 시) */}
      {hasReport && onSwitchToEvaluation && (
        <div className="mt-6 p-4 bg-brand-deep/15 rounded-lg border border-brand-deep/30">
          <p className="text-brand-light mb-3 text-sm font-medium">평가표 작성이 완료되었습니다</p>
          <button
            onClick={onSwitchToEvaluation}
            className="px-6 py-3 bg-emerald-500 hover:bg-brand-deep text-white rounded-lg transition flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            평가표 보기
          </button>
        </div>
      )}
    </div>
  );
}
