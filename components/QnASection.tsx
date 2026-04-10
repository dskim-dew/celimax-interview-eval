'use client';

import { useState } from 'react';
import { QnAData, QNA_TOPIC_ORDER } from '@/lib/types';
import Linkify from './Linkify';


interface QnASectionProps {
  qnaData: QnAData;
}

export default function QnASection({ qnaData }: QnASectionProps) {
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const filteredQna = topicFilter
    ? qnaData.qna.filter(item => item.topic === topicFilter)
    : qnaData.qna;

  return (
    <div className="space-y-4">
      {/* 토픽 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTopicFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !topicFilter
              ? 'bg-brand-deep/30 text-brand-light border border-brand-deep/40'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          전체 ({qnaData.metadata?.totalQuestions ?? qnaData.qna.length})
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

            {(() => {
              const qSpeaker = item.questionSpeaker ?? 'interviewer';
              const aSpeaker = item.answerSpeaker ?? 'candidate';
              const qLabel = qSpeaker === 'candidate' ? '지원자' : '면접관';
              const aLabel = aSpeaker === 'interviewer' ? '면접관' : '지원자';
              const qColor = qSpeaker === 'candidate' ? 'text-green-300' : 'text-brand-light';
              const aColor = aSpeaker === 'interviewer' ? 'text-brand-light' : 'text-green-300';
              const qBorder = qSpeaker === 'candidate' ? 'border-green-400' : 'border-brand-deep';
              const aBorder = aSpeaker === 'interviewer' ? 'border-brand-deep' : 'border-green-400';

              return (
                <>
                  <div className="mb-3">
                    <p className={`text-sm ${qColor} mb-1 font-medium`}>
                      Q{item.id}. {qLabel}
                    </p>
                    <p className={`text-white pl-4 border-l-2 ${qBorder}`}>
                      <Linkify>{item.question}</Linkify>
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${aColor} mb-1 font-medium`}>
                      A. {aLabel}
                    </p>
                    <p className={`text-slate-200 pl-4 border-l-2 ${aBorder} leading-relaxed`}>
                      <Linkify>{item.answer}</Linkify>
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
