'use client';

import { MessageCircle } from 'lucide-react';
import { InterviewerNotes } from '@/lib/types';
import Linkify from './Linkify';

interface InterviewerCommentProps {
  notes: InterviewerNotes;
  onChange: (notes: InterviewerNotes) => void;
  readOnly?: boolean;
}

function handleMarkdownKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  field: keyof InterviewerNotes,
  notes: InterviewerNotes,
  onChange: (notes: InterviewerNotes) => void
) {
  if (e.key !== 'Enter') return;

  const textarea = e.currentTarget;
  const { selectionStart, value } = textarea;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const currentLine = value.substring(lineStart, selectionStart);
  const bulletMatch = currentLine.match(/^(\s*- )/);

  if (!bulletMatch) return;

  e.preventDefault();
  const prefix = bulletMatch[1];

  // 불렛만 있고 내용이 없으면 불렛 제거
  if (currentLine.trimEnd() === '-' || currentLine === prefix) {
    const newValue = value.substring(0, lineStart) + '\n' + value.substring(selectionStart);
    onChange({ ...notes, [field]: newValue });
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
    }, 0);
    return;
  }

  // 새 줄에 불렛 자동 추가
  const newValue = value.substring(0, selectionStart) + '\n' + prefix + value.substring(selectionStart);
  onChange({ ...notes, [field]: newValue });
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + prefix.length;
  }, 0);
}

export default function InterviewerComment({ notes, onChange, readOnly = false }: InterviewerCommentProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800/80 to-blue-900/30 p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          면접관 추가 소견
        </h2>
      </div>
      <div className="p-4">
        {readOnly ? (
          <div className="space-y-6">
            {/* 강점 */}
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                <span className="text-xl">💪</span>
                지원자의 강점, 함께하고 싶은 이유
              </h3>
              <div className="text-slate-300 whitespace-pre-wrap min-h-[60px] bg-white/5 p-4 rounded-lg border border-emerald-400/20">
                <Linkify>{notes.strengths || '작성된 내용이 없습니다.'}</Linkify>
              </div>
            </div>

            {/* 우려사항 */}
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                우려되는 부분
              </h3>
              <div className="text-slate-300 whitespace-pre-wrap min-h-[60px] bg-white/5 p-4 rounded-lg border border-amber-400/20">
                <Linkify>{notes.concerns || '작성된 내용이 없습니다.'}</Linkify>
              </div>
            </div>

            {/* 추가 검증 */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-xl">🔍</span>
                추가 검증이 필요한 부분
              </h3>
              <div className="text-slate-300 whitespace-pre-wrap min-h-[60px] bg-white/5 p-4 rounded-lg border border-blue-400/20">
                <Linkify>{notes.validation || '작성된 내용이 없습니다.'}</Linkify>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. 지원자의 강점 */}
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                <span className="text-xl">💪</span>
                지원자의 강점, 함께하고 싶은 이유
              </h3>
              <textarea
                value={notes.strengths}
                onChange={(e) => onChange({ ...notes, strengths: e.target.value })}
                onKeyDown={(e) => handleMarkdownKeyDown(e, 'strengths', notes, onChange)}
                placeholder="이 지원자와 함께 일하고 싶은 이유, 기대되는 점을 작성해주세요... (- 입력 시 불렛 목록)"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-emerald-400/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
              />
            </div>

            {/* 2. 우려되는 부분 */}
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                우려되는 부분
              </h3>
              <textarea
                value={notes.concerns}
                onChange={(e) => onChange({ ...notes, concerns: e.target.value })}
                onKeyDown={(e) => handleMarkdownKeyDown(e, 'concerns', notes, onChange)}
                placeholder="채용 시 우려되는 점, 리스크 요인을 작성해주세요... (- 입력 시 불렛 목록)"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-amber-400/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
              />
            </div>

            {/* 3. 추가 검증 필요 */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-xl">🔍</span>
                추가 검증이 필요한 부분
              </h3>
              <textarea
                value={notes.validation}
                onChange={(e) => onChange({ ...notes, validation: e.target.value })}
                onKeyDown={(e) => handleMarkdownKeyDown(e, 'validation', notes, onChange)}
                placeholder="2차 면접이나 레퍼런스 체크에서 확인이 필요한 부분을 작성해주세요... (- 입력 시 불렛 목록)"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
