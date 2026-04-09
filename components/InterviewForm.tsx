'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Users, FileText, Sparkles, Calendar, ClipboardPaste, MessageSquare, Hash, PenLine, UserCheck, X, ExternalLink } from 'lucide-react';
import { InterviewInfo } from '@/lib/types';

interface Position {
  id: string;
  positionName: string;
  hiringManager: string;
  hrPm: string;
  isActive: boolean;
}

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
    interviewDate: (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const minutes = d.getMinutes();
      const rounded = Math.round(minutes / 15) * 15;
      d.setMinutes(rounded >= 60 ? 0 : rounded);
      if (rounded >= 60) d.setHours(d.getHours() + 1);
      return d.toISOString().slice(0, 16).replace('T', ' ');
    })(),
    interviewRound: '1차',
  });

  // 면접관 태그 상태
  const [interviewerTags, setInterviewerTags] = useState<string[]>([]);
  const [interviewerTagInput, setInterviewerTagInput] = useState('');
  const interviewerTagRef = useRef<HTMLInputElement>(null);
  const interviewDateRef = useRef<HTMLInputElement>(null);

  // 면접 일자: date와 time을 분리하여 관리
  const interviewDateValue = formData.interviewDate.slice(0, 10); // YYYY-MM-DD
  const interviewHour = formData.interviewDate.slice(11, 13) || '09';
  const interviewMinute = formData.interviewDate.slice(14, 16) || '00';

  const handleDatePartChange = (date: string, hour: string, minute: string) => {
    const combined = `${date} ${hour}:${minute}`;
    setFormData(prev => ({ ...prev, interviewDate: combined }));
  };

  const addInterviewerTag = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !interviewerTags.includes(trimmed)) {
      setInterviewerTags(prev => [...prev, trimmed]);
    }
    setInterviewerTagInput('');
  };

  const removeInterviewerTag = (index: number) => {
    setInterviewerTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleInterviewerTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterviewerTag(interviewerTagInput);
    } else if (e.key === 'Backspace' && interviewerTagInput === '' && interviewerTags.length > 0) {
      setInterviewerTags(prev => prev.slice(0, -1));
    }
  };

  // 설정 페이지의 포지션 목록
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    fetch('/api/positions')
      .then(res => res.ok ? res.json() : [])
      .then((data) => setPositions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // 포지션 선택 시 Hiring Manager 자동 연결
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPosition = e.target.value;
    const matched = positions.find(p => p.positionName === selectedPosition);
    setFormData(prev => ({
      ...prev,
      position: selectedPosition,
      interviewerName: matched?.hiringManager || prev.interviewerName,
    }));
  };

  const handleHiringManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hm = e.target.value;
    setFormData(prev => ({ ...prev, interviewerName: hm, position: '' }));
  };

  // 선택된 Hiring Manager 기준으로 포지션 필터
  const filteredPositions = formData.interviewerName
    ? positions.filter(p => p.hiringManager === formData.interviewerName)
    : positions;

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
        if (parsed.candidateName && !prev.candidateName) {
          updated.candidateName = parsed.candidateName;
        }
        if (parsed.position && !prev.position) {
          // 파싱된 포지션이 설정에 있으면 매칭
          const matched = positions.find(p => p.positionName === parsed.position);
          if (matched) {
            updated.position = matched.positionName;
            if (!prev.interviewerName) {
              updated.interviewerName = matched.hiringManager;
            }
          }
        }
      }

      return updated;
    });
  };

  const buildSubmitData = (): InterviewInfo | null => {
    if (!formData.interviewerName) {
      return null;
    }

    const finalTags = [...interviewerTags];
    if (interviewerTagInput.trim()) {
      finalTags.push(interviewerTagInput.trim());
    }

    return {
      ...formData,
      reportAuthor: finalTags.length > 0 ? finalTags.join(', ') : '',
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = buildSubmitData();
    if (!submitData) return;
    onSubmit(submitData);
  };

  const handleDirectSubmit = () => {
    const submitData = buildSubmitData();
    if (!submitData) return;
    onDirectSubmit!(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-brand-mid" />
        면접 정보 입력
      </h2>

      {/* 면접 정보 그리드 — 3열 2줄 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Row 1: Hiring Manager - 포지션 - 면접관 */}
        {/* Hiring Manager (드롭다운) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-mid" />
              Hiring Manager *
            </span>
          </label>
          <select
            value={formData.interviewerName}
            onChange={handleHiringManagerChange}
            required
            className="w-full px-4 py-3 glass-input appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-800">선택해주세요</option>
            {Array.from(new Set(positions.map(p => p.hiringManager))).sort((a, b) => a.localeCompare(b, 'ko')).map(hm => (
              <option key={hm} value={hm} className="bg-slate-800">{hm}</option>
            ))}
          </select>
        </div>

        {/* 지원 포지션 (드롭다운) */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-mid" />
              지원 포지션 *
            </span>
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handlePositionChange}
            required
            className="w-full px-4 py-3 glass-input appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-800">선택해주세요</option>
            {[...filteredPositions].sort((a, b) => a.positionName.localeCompare(b.positionName, 'ko')).map(p => (
              <option key={p.id} value={p.positionName} className="bg-slate-800">{p.positionName}</option>
            ))}
          </select>
        </div>

        {/* 추가 면접관 (태그 입력) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-mid" />
              추가 면접관
            </span>
          </label>
          <div
            className="flex flex-wrap items-center gap-2 px-3 py-2 glass-input cursor-text min-h-[48px]"
            onClick={() => interviewerTagRef.current?.focus()}
          >
            {interviewerTags.map((name, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-2.5 py-1 bg-brand-deep/20 border border-brand-deep/40 text-brand-light rounded-full text-sm font-medium whitespace-nowrap"
              >
                {name}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeInterviewerTag(idx); }}
                  className="ml-0.5 text-brand-light hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={interviewerTagRef}
              type="text"
              value={interviewerTagInput}
              onChange={(e) => setInterviewerTagInput(e.target.value)}
              onKeyDown={handleInterviewerTagKeyDown}
              onBlur={() => { if (interviewerTagInput.trim()) addInterviewerTag(interviewerTagInput); }}
              placeholder={interviewerTags.length === 0 ? '이름 입력 후 Enter' : '+ 추가'}
              className="flex-1 min-w-[80px] bg-transparent outline-none text-white placeholder-slate-400 text-sm py-1"
            />
          </div>
        </div>

        {/* Row 2: 지원자 이름 - 인터뷰 차수 - 면접 일자 */}
        {/* 지원자 이름 */}
        <div>
          <label htmlFor="candidateName" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-mid" />
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
              <Hash className="w-4 h-4 text-brand-mid" />
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
            <option value="1+2차" className="bg-slate-800">1+2차</option>
            <option value="커피챗" className="bg-slate-800">커피챗</option>
            <option value="기타" className="bg-slate-800">기타</option>
          </select>
        </div>

        {/* 면접 일자 */}
        <div>
          <label htmlFor="interviewDate" className="block text-sm font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-mid" />
              면접 일자 *
            </span>
          </label>
          <div className="flex gap-2">
            <div
              className="flex-1 relative cursor-pointer"
              onClick={() => interviewDateRef.current?.showPicker()}
            >
              <input
                ref={interviewDateRef}
                type="date"
                id="interviewDate"
                value={interviewDateValue}
                onChange={(e) => handleDatePartChange(e.target.value, interviewHour, interviewMinute)}
                required
                className="w-full px-4 py-3 glass-input cursor-pointer"
              />
            </div>
            <select
              value={interviewHour}
              onChange={(e) => handleDatePartChange(interviewDateValue, e.target.value, interviewMinute)}
              className="w-20 px-2 py-3 glass-input cursor-pointer text-center"
            >
              {Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0')).map(h => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
            <select
              value={interviewMinute}
              onChange={(e) => handleDatePartChange(interviewDateValue, interviewHour, e.target.value)}
              className="w-20 px-2 py-3 glass-input cursor-pointer text-center"
            >
              {['00', '15', '30', '45'].map(m => (
                <option key={m} value={m}>{m}분</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tiro 스크립트 */}
      <div className="mb-6">
        <label htmlFor="tiroScript" className="block text-sm font-medium text-slate-300 mb-2">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-brand-mid" />
              Tiro 면접 스크립트
            </span>
            <a
              href="https://tiro.ooo/n"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-brand-light hover:text-white bg-brand-deep/20 hover:bg-brand-deep/40 border border-brand-deep/30 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Tiro 열기
            </a>
          </span>
        </label>
        <div className="mb-2 p-3 bg-brand-deep/15 border border-brand-deep/30 rounded-lg">
          <p className="text-sm text-brand-light flex items-center gap-2">
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

      <div className="space-y-3">
        {/* 메인 버튼: 항상 Q&A 정리 후 평가 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
            isLoading
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-deep to-brand-dark hover:from-brand-mid hover:to-brand-deep shadow-lg shadow-brand-deep/25 hover:shadow-brand-deep/40'
          }`}
        >
          {isLoading ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              처리 중...
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              스크립트 Q&A 정리 후 평가
            </>
          )}
        </button>

        {/* 보조 버튼: 녹음이 안 된 경우 면접관 소견만 작성 */}
        {onDirectSubmit && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDirectSubmit}
            className={`w-full py-3 px-6 rounded-xl font-medium text-slate-400 transition-all duration-300 flex items-center justify-center gap-3 ${
              isLoading
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PenLine className="w-4 h-4" />
            녹음이 안 된 경우, 면접관 소견만 작성
          </button>
        )}
      </div>
    </form>
  );
}
