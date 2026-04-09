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
  decisionFirst?: boolean;
}

function restoreCursor(textarea: HTMLTextAreaElement, pos: number) {
  const scrollTop = textarea.scrollTop;
  textarea.selectionStart = textarea.selectionEnd = pos;
  textarea.scrollTop = scrollTop;
}

function handleBulletInput(
  e: React.ChangeEvent<HTMLTextAreaElement>,
  notes: InterviewerNotes,
  onChange: (notes: InterviewerNotes) => void
) {
  const textarea = e.currentTarget;
  let newValue = e.target.value;
  const pos = textarea.selectionStart;
  const scrollTop = textarea.scrollTop;

  // "- " 입력 시 "• "로 자동 변환 (줄 시작에서만)
  const beforeCursor = newValue.substring(0, pos);
  const lineStart = beforeCursor.lastIndexOf('\n') + 1;
  const currentLine = beforeCursor.substring(lineStart);

  if (currentLine === '- ') {
    newValue = newValue.substring(0, lineStart) + '• ' + newValue.substring(pos);
    onChange({ ...notes, comment: newValue });
    setTimeout(() => { restoreCursor(textarea, lineStart + 2); textarea.scrollTop = scrollTop; }, 0);
    return;
  }
  if (currentLine === '  - ') {
    newValue = newValue.substring(0, lineStart) + '  ◦ ' + newValue.substring(pos);
    onChange({ ...notes, comment: newValue });
    setTimeout(() => { restoreCursor(textarea, lineStart + 4); textarea.scrollTop = scrollTop; }, 0);
    return;
  }

  onChange({ ...notes, comment: newValue });
}

function handleBulletKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  notes: InterviewerNotes,
  onChange: (notes: InterviewerNotes) => void
) {
  const textarea = e.currentTarget;
  const { selectionStart, value } = textarea;
  const scrollTop = textarea.scrollTop;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const currentLine = value.substring(lineStart, selectionStart);

  // Tab 처리
  if (e.key === 'Tab') {
    e.preventDefault();

    if (e.shiftKey) {
      if (currentLine.startsWith('  ◦ ')) {
        const content = currentLine.substring(4);
        const newValue = value.substring(0, lineStart) + '• ' + content + value.substring(selectionStart);
        onChange({ ...notes, comment: newValue });
        setTimeout(() => { restoreCursor(textarea, selectionStart - 2); textarea.scrollTop = scrollTop; }, 0);
      }
      return;
    }

    if (currentLine.startsWith('• ')) {
      const content = currentLine.substring(2);
      const newValue = value.substring(0, lineStart) + '  ◦ ' + content + value.substring(selectionStart);
      onChange({ ...notes, comment: newValue });
      setTimeout(() => { restoreCursor(textarea, selectionStart + 2); textarea.scrollTop = scrollTop; }, 0);
      return;
    }

    if (!currentLine.startsWith('• ') && !currentLine.startsWith('  ◦ ')) {
      const newValue = value.substring(0, lineStart) + '• ' + currentLine + value.substring(selectionStart);
      onChange({ ...notes, comment: newValue });
      setTimeout(() => { restoreCursor(textarea, selectionStart + 2); textarea.scrollTop = scrollTop; }, 0);
    }
    return;
  }

  // Enter 처리
  if (e.key !== 'Enter') return;

  const isBullet = currentLine.startsWith('• ') || currentLine.startsWith('  ◦ ');
  if (!isBullet) return;

  e.preventDefault();

  const isSubBullet = currentLine.startsWith('  ◦ ');
  const prefix = isSubBullet ? '  ◦ ' : '• ';
  const content = currentLine.substring(prefix.length);

  if (!content.trim()) {
    if (isSubBullet) {
      const newValue = value.substring(0, lineStart) + '• ' + value.substring(selectionStart);
      onChange({ ...notes, comment: newValue });
      setTimeout(() => { restoreCursor(textarea, lineStart + 2); textarea.scrollTop = scrollTop; }, 0);
    } else {
      const newValue = value.substring(0, lineStart) + value.substring(selectionStart);
      onChange({ ...notes, comment: newValue });
      setTimeout(() => { restoreCursor(textarea, lineStart); textarea.scrollTop = scrollTop; }, 0);
    }
    return;
  }

  const newValue = value.substring(0, selectionStart) + '\n' + prefix + value.substring(selectionStart);
  onChange({ ...notes, comment: newValue });
  setTimeout(() => { restoreCursor(textarea, selectionStart + 1 + prefix.length); textarea.scrollTop = scrollTop; }, 0);
}

/** 마크다운 불렛을 HTML 리스트로 렌더링 */
function RenderedComment({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let topItems: { text: string; subItems: string[] }[] = [];

  const flushBullets = () => {
    if (topItems.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-1.5 my-1">
        {topItems.map((item, i) => (
          <li key={i}>
            <div className="flex items-start gap-2">
              <span className="text-brand-mid mt-0.5 shrink-0">•</span>
              <span><Linkify>{item.text}</Linkify></span>
            </div>
            {item.subItems.length > 0 && (
              <ul className="space-y-1 mt-1 ml-5">
                {item.subItems.map((sub, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-0.5 shrink-0">◦</span>
                    <span><Linkify>{sub}</Linkify></span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
    topItems = [];
  };

  lines.forEach((line, i) => {
    // 하위 불렛: "  ◦ " 또는 레거시 "  - "
    if (line.match(/^\s{2,}[◦\-]\s/)) {
      const content = line.replace(/^\s+[◦\-]\s+/, '');
      if (topItems.length > 0) {
        topItems[topItems.length - 1].subItems.push(content);
      } else {
        topItems.push({ text: '', subItems: [content] });
      }
    // 상위 불렛: "• " 또는 레거시 "- "
    } else if (line.match(/^[•\-]\s/)) {
      const content = line.replace(/^[•\-]\s+/, '');
      topItems.push({ text: content, subItems: [] });
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
    activeClass: 'bg-emerald-500 text-white border-brand-deep shadow-lg shadow-brand-deep/30',
    dimClass: 'bg-brand-deep/15 text-brand-mid/30 border-brand-deep/15',
  },
];

export default function InterviewerComment({ notes, onChange, readOnly = false, finalDecisionReadOnly = false, decisionFirst = false }: InterviewerCommentProps) {
  const selected = notes.finalDecision ?? null;

  const commentBlock = readOnly ? (
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
        면접에서 느낀 점을 간략히 작성해주세요. (3~5줄 권장, <code className="text-slate-300">-</code> 입력 시 불렛, <code className="text-slate-300">Tab</code>으로 하위 불렛)
      </p>
      <textarea
        value={notes.comment}
        onChange={(e) => handleBulletInput(e, notes, onChange)}
        onKeyDown={(e) => handleBulletKeyDown(e, notes, onChange)}
        placeholder={"• 지원자에 대한 전반적인 인상\n• 강점 또는 우려사항\n  ◦ 세부 사항\n• 추가 확인이 필요한 부분"}
        rows={5}
        className="w-full px-4 py-3 bg-white/10 border border-slate-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-mid focus:border-transparent transition resize-none text-sm"
      />
    </div>
  );

  const decisionBlock = (
    <div className={decisionFirst ? '' : 'pt-2'}>
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
  );

  const selectedDecision = DECISIONS.find(d => d.value === selected);

  return (
    <div className="glass-card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-dark/80 to-brand-deep/20 p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-mid" />
          Hiring Manager 소견
          {decisionFirst && selectedDecision && (
            <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-bold ${selectedDecision.activeClass}`}>
              {selectedDecision.label}
            </span>
          )}
          {decisionFirst && !selectedDecision && !readOnly && (
            <span className="ml-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">미선택</span>
          )}
        </h2>
      </div>

      {decisionFirst ? (
        <div className="p-4 space-y-4">
          {commentBlock}
          {!readOnly && decisionBlock}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {commentBlock}
          {decisionBlock}
        </div>
      )}
    </div>
  );
}
