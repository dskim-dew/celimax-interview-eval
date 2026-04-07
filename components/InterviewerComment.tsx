'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { InterviewerNotes, FinalDecision } from '@/lib/types';
import Linkify from './Linkify';

interface InterviewerCommentProps {
  notes: InterviewerNotes;
  onChange: (notes: InterviewerNotes) => void;
  readOnly?: boolean;
  finalDecisionReadOnly?: boolean;
}

function handleBulletKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  notes: InterviewerNotes,
  onChange: (notes: InterviewerNotes) => void
) {
  const textarea = e.currentTarget;
  const { selectionStart, value } = textarea;

  // Tab → 불렛 삽입
  if (e.key === 'Tab') {
    e.preventDefault();
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionStart);
    const lineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.substring(lineStart);

    // 현재 줄이 비어있거나 불렛이 아닌 경우 불렛 추가
    if (!currentLine.startsWith('- ')) {
      const newValue = value.substring(0, lineStart) + '- ' + currentLine + after;
      onChange({ ...notes, comment: newValue });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
    }
    return;
  }

  if (e.key !== 'Enter') return;

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const currentLine = value.substring(lineStart, selectionStart);
  const bulletMatch = currentLine.match(/^(\s*- )/);

  if (!bulletMatch) return;

  e.preventDefault();
  const prefix = bulletMatch[1];

  // 빈 불렛이면 해제
  if (currentLine.trimEnd() === '-' || currentLine === prefix) {
    const newValue = value.substring(0, lineStart) + '\n' + value.substring(selectionStart);
    onChange({ ...notes, comment: newValue });
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
    }, 0);
    return;
  }

  // 새 불렛 줄 추가
  const newValue = value.substring(0, selectionStart) + '\n' + prefix + value.substring(selectionStart);
  onChange({ ...notes, comment: newValue });
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + prefix.length;
  }, 0);
}

/** 마크다운 불렛을 HTML 리스트로 렌더링 */
function RenderedComment({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-1.5 my-1">
        {bulletItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 shrink-0">•</span>
            <span><Linkify>{item}</Linkify></span>
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.replace(/^\s*-\s+/, '');
    if (line.match(/^\s*- /)) {
      bulletItems.push(trimmed);
    } else {
      flushBullets();
      if (line.trim()) {
        elements.push(<p key={`p-${i}`}><Linkify>{line}</Linkify></p>);
      } else if (elements.length > 0) {
        elements.push(<br key={`br-${i}`} />);
      }
    }
  });
  flushBullets();

  return <>{elements}</>;
}

const DECISIONS: { value: FinalDecision; label: string; activeClass: string; dimClass: string }[] = [
  {
    value: 'drop',
    label: '드랍',
    activeClass: 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30',
    dimClass: 'bg-red-500/10 text-red-400/30 border-red-500/15',
  },
  {
    value: 'weak-go',
    label: 'Weak Go',
    activeClass: 'bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/30',
    dimClass: 'bg-amber-400/10 text-amber-400/30 border-amber-400/15',
  },
  {
    value: 'strong-go',
    label: 'Strong Go',
    activeClass: 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30',
    dimClass: 'bg-emerald-500/10 text-emerald-400/30 border-emerald-500/15',
  },
];

export default function InterviewerComment({ notes, onChange, readOnly = false, finalDecisionReadOnly = false }: InterviewerCommentProps) {
  const selected = notes.finalDecision ?? null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800/80 to-blue-900/30 p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          면접관 소견
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {readOnly ? (
          <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-5">
            <div className="text-slate-300 min-h-[48px] text-sm leading-relaxed">
              {notes.comment
                ? <RenderedComment text={notes.comment} />
                : <span className="text-slate-500">작성된 내용이 없습니다.</span>
              }
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-2">
              면접에서 느낀 점을 간략히 작성해주세요. (3~5줄 권장, <code className="text-slate-300">- </code> 입력 시 불렛 목록)
            </p>
            <textarea
              value={notes.comment}
              onChange={(e) => onChange({ ...notes, comment: e.target.value })}
              onKeyDown={(e) => handleBulletKeyDown(e, notes, onChange)}
              placeholder={"- 지원자에 대한 전반적인 인상\n- 강점 또는 우려사항\n- 추가 확인이 필요한 부분"}
              rows={5}
              className="w-full px-4 py-3 bg-white/10 border border-slate-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none text-sm font-mono"
            />
          </div>
        )}

        {/* 최종 의견 선택 */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-white">최종 의견</h3>
            {!selected && !readOnly && (
              <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">필수</span>
            )}
            {selected && (
              <span className="text-xs text-slate-400">선택됨</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {DECISIONS.map(({ value, label, activeClass, dimClass }) => {
              const isSelected = selected === value;
              const isDimmed = selected !== null && !isSelected;

              return (
                <button
                  key={value}
                  onClick={() => !readOnly && !finalDecisionReadOnly && onChange({ ...notes, finalDecision: isSelected ? null : value })}
                  disabled={readOnly || finalDecisionReadOnly}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200 ${
                    isSelected
                      ? activeClass
                      : isDimmed
                        ? dimClass
                        : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10 hover:border-white/25'
                  } ${readOnly || finalDecisionReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
