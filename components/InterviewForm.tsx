'use client';

import { useState, useRef } from 'react';
import { User, Briefcase, Users, FileText, Sparkles, Calendar, Wand2, ClipboardPaste, MessageSquare, Hash, X } from 'lucide-react';
import { InterviewInfo } from '@/lib/types';

interface InterviewFormProps {
  onSubmit: (data: InterviewInfo) => void;
  onDirectSubmit?: (data: InterviewInfo) => void;
  isLoading: boolean;
}

// Tiro 스크립트에서 메타데이터 자동 파싱
function parseMetadataFromScript(script: string): Partial<InterviewInfo> {
  const result: Partial<InterviewInfo> = {};

  const interviewerMatch = script.match(/면접관\s*[:：]\s*(.+)/);
  if (interviewerMatch) {
    result.interviewerName = interviewerMatch[1].trim();
  }

  const candidateMatch = script.match(/지원자\s*[:：]\s*(.+)/);
  if (candidateMatch) {
    result.candidateName = candidateMatch[1].trim();
  }

  const positionMatch = script.match(/포지션\s*[:：]\s*(.+)/);
  if (positionMatch) {
    result.position = positionMatch[1].trim();
  }

  return result;
}

export default function InterviewForm({ onSubmit, onDirectSubmit, isLoading }: InterviewFormProps) {
  const [formData, setFormData] = useState<InterviewInfo>({
    interviewerName: '',
    reportAuthor: '',
    position: '',
    candidateName: '',
    tiroScript: '',
    interviewDate: new Date().toISOString().split('T')[0],
    interviewRound: '1차',
  });

  // 면접관 태그 상태
  const [interviewers, setInterviewers] = useState<string[]>([]);
  const [interviewerInput, setInterviewerInput] = useState('');
  const [interviewerError, setInterviewerError] = useState(false);
  const interviewerInputRef = useRef<HTMLInputElement>(null);

  const addInterviewer = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !interviewers.includes(trimmed)) {
      setInterviewers(prev => [...prev, trimmed]);
      setInterviewerError(false);
    }
    setInterviewerInput('');
  };

  const removeInterviewer = (index: number) => {
    setInterviewers(prev => prev.filter((_, i) => i !== index));
  };

  const handleInterviewerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterviewer(interviewerInput);
    } else if (e.key === 'Backspace' && interviewerInput === '' && interviewers.length > 0) {
      setInterviewers(prev => prev.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTiroScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, tiroScript: value };

      if (value.length > 50) {
        const parsed = parseMetadataFromScript(value);
        // 면접관 이름 자동 파싱 → 태그로 추가
        if (parsed.interviewerName && interviewers.length === 0) {
          setInterviewers([parsed.interviewerName]);
        }
        if (parsed.candidateName && !prev.candidateName) {
          updated.candidateName = parsed.candidateName;
        }
        if (parsed.position && !prev.position) {
          updated.position = parsed.position;
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 입력 중인 이름이 있으면 마지막으로 추가
    const finalInterviewers = [...interviewers];
    if (interviewerInput.trim()) {
      finalInterviewers.push(interviewerInput.trim());
    }

    if (finalInterviewers.length === 0) {
      setInterviewerError(true);
      interviewerInputRef.current?.focus();
      return;
    }

    const submitData: InterviewInfo = {
      ...formData,
      interviewerName: finalInterviewers.join(', '),
    };
    onSubmit(submitData);
  };

  const handleDirectSubmit = () => {
    const finalInterviewers = [...interviewers];
    if (interviewerInput.trim()) {
      finalInterviewers.push(interviewerInput.trim());
    }

    if (finalInterviewers.length === 0) {
      setInterviewerError(true);
      interviewerInputRef.current?.focus();
      return;
    }

    const submitData: InterviewInfo = {
      ...formData,
      interviewerName: finalInterviewers.join(', '),
    };
    onDirectSubmit!(submitData);
  };

  const hasScript = formData.tiroScript.trim().length > 0;
  const isDemoMode = !hasScript || formData.tiroScript.trim().length < 100;

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" />
        면접 정보 입력
      </h2>

      {/* 면접 정보 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 면접관 이름 (태그 입력) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              면접관 이름 *
            </span>
          </label>
          <div
            className={`flex flex-wrap items-center gap-2 px-3 py-2 glass-input cursor-text min-h-[48px] ${
              interviewerError ? 'ring-2 ring-red-500 border-red-500' : ''
            }`}
            onClick={() => interviewerInputRef.current?.focus()}
          >
            {interviewers.map((name, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-200 rounded-full text-sm font-medium whitespace-nowrap"
              >
                {name}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeInterviewer(idx); }}
                  className="ml-0.5 text-blue-300 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={interviewerInputRef}
              type="text"
              value={interviewerInput}
              onChange={(e) => { setInterviewerInput(e.target.value); setInterviewerError(false); }}
              onKeyDown={handleInterviewerKeyDown}
              onBlur={() => { if (interviewerInput.trim()) addInterviewer(interviewerInput); }}
              placeholder={interviewers.length === 0 ? '이름 입력 후 Enter' : '+ 추가'}
              className="flex-1 min-w-[80px] bg-transparent outline-none text-white placeholder-slate-400 text-sm py-1"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            여러 명일 경우 Enter로 구분해 추가하세요.
          </p>
          {interviewerError && (
            <p className="mt-1 text-xs text-red-400">면접관 이름을 한 명 이상 입력해주세요.</p>
          )}
        </div>

        {/* 리포트 작성자 */}
        <div>
          <label htmlFor="reportAuthor" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              리포트 작성자 *
            </span>
          </label>
          <input
            type="text"
            id="reportAuthor"
            name="reportAuthor"
            value={formData.reportAuthor}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input"
            placeholder="김채용"
          />
        </div>

        {/* 면접 일자 */}
        <div>
          <label htmlFor="interviewDate" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              면접 일자 *
            </span>
          </label>
          <input
            type="date"
            id="interviewDate"
            name="interviewDate"
            value={formData.interviewDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input"
          />
        </div>

        {/* 지원 포지션 */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              지원 포지션 *
            </span>
          </label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input"
            placeholder="프론트엔드 개발자"
          />
        </div>

        {/* 지원자 이름 */}
        <div>
          <label htmlFor="candidateName" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              지원자 이름 *
            </span>
          </label>
          <input
            type="text"
            id="candidateName"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input"
            placeholder="홍길동"
          />
        </div>

        {/* 인터뷰 차수 */}
        <div>
          <label htmlFor="interviewRound" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-400" />
              인터뷰 차수 *
            </span>
          </label>
          <select
            id="interviewRound"
            name="interviewRound"
            value={formData.interviewRound}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input appearance-none cursor-pointer"
          >
            <option value="1차" className="bg-slate-800">1차</option>
            <option value="2차" className="bg-slate-800">2차</option>
            <option value="기타" className="bg-slate-800">기타</option>
          </select>
        </div>
      </div>

      {/* Tiro 스크립트 */}
      <div className="mb-6">
        <label htmlFor="tiroScript" className="block text-sm font-medium text-slate-300 mb-2">
          <span className="flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4 text-purple-400" />
            Tiro 면접 스크립트
          </span>
        </label>
        <div className="mb-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <p className="text-sm text-blue-300 flex items-center gap-2">
            <span>💡</span>
            Tiro에서 <strong>&quot;LLM용으로 복사&quot;</strong>를 선택하여 아래에 붙여넣어주세요
          </p>
        </div>
        <textarea
          id="tiroScript"
          name="tiroScript"
          value={formData.tiroScript}
          onChange={handleTiroScriptChange}
          rows={15}
          className="w-full px-4 py-3 glass-input resize-y font-mono text-sm"
          placeholder={"[면접 스크립트 예시]\n\n면접관: 자기소개 부탁드립니다.\n지원자: 안녕하세요, 저는 3년차 프론트엔드 개발자 홍길동입니다...\n면접관: 이전 회사에서 가장 도전적이었던 프로젝트에 대해 말씀해주세요.\n지원자: 네, 작년에 레거시 시스템을 마이그레이션하는 프로젝트를...\n\n* Tiro에서 \"LLM용으로 복사\"를 선택하면 최적의 형식으로 붙여넣을 수 있습니다."}
        />
        <p className="mt-1 text-xs text-slate-500">
          스크립트에 면접관/지원자/포지션 정보가 포함되어 있으면 위 입력란에 자동으로 채워집니다.
        </p>
      </div>

      {/* 데모 모드 안내 */}
      {isDemoMode && (
        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <Wand2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium">데모 모드로 실행됩니다</p>
              <p className="text-blue-200/70 text-xs mt-1">
                Tiro 스크립트가 입력되지 않아 AI가 가상의 현실적인 면접 시나리오를 생성하여 평가합니다.
                실제 면접 스크립트를 입력하면 더 정확한 평가를 받을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
            isLoading
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
          }`}
        >
          {isLoading ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              처리 중...
            </>
          ) : isDemoMode ? (
            <>
              <Sparkles className="w-5 h-5" />
              데모 보고서 생성
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              1단계: 스크립트 Q&A 정리 후 평가
            </>
          )}
        </button>

        {!isDemoMode && onDirectSubmit && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDirectSubmit}
            className={`w-full py-3 px-6 rounded-xl font-medium text-slate-300 transition-all duration-300 flex items-center justify-center gap-3 ${
              isLoading
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Q&A 정리 없이 바로 평가 (빠름)
          </button>
        )}
      </div>
    </form>
  );
}
