'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Pencil, Save, X } from 'lucide-react';

import EvaluationReport from '@/components/EvaluationReport';
import CopyButton from '@/components/CopyButton';
import ReportTOC, { TOCItem } from '@/components/ReportTOC';
import { EvaluationReport as ReportType, InterviewerNotes, InterviewInfo, InterviewRound, CeoDecision } from '@/lib/types';

interface ReportDetailClientProps {
  report: ReportType;
}

export default function ReportDetailClient({ report: initialReport }: ReportDetailClientProps) {
  const router = useRouter();
  const [report, setReport] = useState<ReportType>(initialReport);

  // 편집 모드
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editInfo, setEditInfo] = useState<InterviewInfo>(report.interviewInfo);
  const [savingInfo, setSavingInfo] = useState(false);

  const startEditInfo = () => {
    setEditInfo({ ...report.interviewInfo });
    setEditingInfo(true);
  };

  const cancelEditInfo = () => {
    setEditingInfo(false);
  };

  const saveEditInfo = async () => {
    setSavingInfo(true);
    const previous = report;
    setReport({ ...report, interviewInfo: editInfo });
    setEditingInfo(false);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewInfo: editInfo }),
      });
      if (!res.ok) throw new Error('저장 실패');
      router.refresh();
    } catch {
      setReport(previous);
      setEditingInfo(true);
      alert('기본 정보 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleNotesChange = async (notes: InterviewerNotes) => {
    const previous = report;
    setReport({ ...report, interviewerNotes: notes });
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewerNotes: notes }),
      });
      if (!res.ok) throw new Error('저장 실패');
      router.refresh();
    } catch {
      setReport(previous);
      alert('소견 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCeoDecision = async (decision: CeoDecision) => {
    const label = decision === 'pass' ? 'Pass' : 'Drop';
    const isDeselect = report.ceoDecision === decision;
    const msg = isDeselect
      ? `민석님 확인을 "${label}"에서 해제하시겠습니까?`
      : `민석님 확인을 "${label}"(으)로 설정하시겠습니까?`;
    if (!confirm(msg)) return;

    const previous = report;
    const newDecision = isDeselect ? null : decision;
    setReport({ ...report, ceoDecision: newDecision });
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ceoDecision: newDecision }),
      });
      if (!res.ok) throw new Error('저장 실패');
      router.refresh();
    } catch {
      setReport(previous);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const hasAIAnalysis = !!(report.overall || report.competencies || report.values);

  const tocItems: TOCItem[] = useMemo(() => {
    const items: TOCItem[] = [
      { id: 'section-info', label: '기본 정보' },
      { id: 'section-notes', label: 'Hiring M. 소견' },
    ];
    if (report.qnaData) {
      items.push({ id: 'section-qna', label: 'Q&A 스크립트' });
    }
    if (hasAIAnalysis) {
      items.push(
        { id: 'section-overall', label: '종합 분석' },
        { id: 'section-competency', label: '문제 해결 역량' },
        { id: 'section-values', label: '이타적 가치관' },
        { id: 'section-immersion', label: '몰입' },
      );
    }
    return items;
  }, [report.qnaData, hasAIAnalysis]);

  const inputClass = 'px-3 py-1.5 bg-white/10 border border-slate-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-mid focus:border-transparent transition';

  return (
    <div className="flex gap-6">
      {/* 좌측 TOC */}
      <ReportTOC items={tocItems} />

      {/* 우측 본문 */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </button>
        </div>

        {/* 1. 기본 정보 */}
        <div id="section-info" className="glass-card p-5 scroll-mt-8">
          {editingInfo ? (
            /* 편집 모드 */
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">지원자</label>
                  <input
                    type="text"
                    value={editInfo.candidateName}
                    onChange={e => setEditInfo({ ...editInfo, candidateName: e.target.value })}
                    className={inputClass + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">포지션</label>
                  <input
                    type="text"
                    value={editInfo.position}
                    onChange={e => setEditInfo({ ...editInfo, position: e.target.value })}
                    className={inputClass + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">인터뷰 차수</label>
                  <select
                    value={editInfo.interviewRound}
                    onChange={e => setEditInfo({ ...editInfo, interviewRound: e.target.value as InterviewRound })}
                    className={inputClass + ' w-full bg-slate-800/50 appearance-none cursor-pointer'}
                  >
                    <option value="1차">1차</option>
                    <option value="2차">2차</option>
                    <option value="1+2차">1+2차</option>
                    <option value="커피챗">커피챗</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hiring Manager</label>
                  <input
                    type="text"
                    value={editInfo.interviewerName}
                    onChange={e => setEditInfo({ ...editInfo, interviewerName: e.target.value })}
                    className={inputClass + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">추가 면접관</label>
                  <input
                    type="text"
                    value={editInfo.reportAuthor}
                    onChange={e => setEditInfo({ ...editInfo, reportAuthor: e.target.value })}
                    className={inputClass + ' w-full'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">면접일시</label>
                  <input
                    type="text"
                    value={editInfo.interviewDate}
                    onChange={e => setEditInfo({ ...editInfo, interviewDate: e.target.value })}
                    className={inputClass + ' w-full'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={saveEditInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-deep text-white text-sm font-medium rounded-lg hover:bg-brand-mid transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingInfo ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={cancelEditInfo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  취소
                </button>
              </div>
            </div>
          ) : (
            /* 읽기 모드 */
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <h1 className="text-xl font-bold gradient-text whitespace-nowrap">
                {report.interviewInfo.interviewRound
                  ? `${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님 ${report.interviewInfo.interviewRound}`
                  : `${report.interviewInfo.position} ${report.interviewInfo.candidateName} 님`}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span>Hiring Manager <span className="text-white font-medium">{report.interviewInfo.interviewerName}</span></span>
                {report.interviewInfo.reportAuthor && (
                  <span>추가 면접관 <span className="text-white font-medium">{report.interviewInfo.reportAuthor}</span></span>
                )}
                <span>면접일 <span className="text-white font-medium">{report.interviewInfo.interviewDate.replace('T', ' ')}</span></span>
              </div>
              <button
                onClick={startEditInfo}
                className="ml-auto shrink-0 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                title="기본 정보 편집"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 2. 소견 → 종합 분석 → 직무역량/핵심가치/Q&A */}
        <EvaluationReport
          report={report}
          onNotesChange={handleNotesChange}
          readOnly={!editingNotes}
          hideHeader={true}
          qnaData={report.qnaData}
          onToggleNotesEdit={() => setEditingNotes(v => !v)}
          sectionIds={{
            notes: 'section-notes',
            overall: 'section-overall',
            competency: 'section-competency',
            immersion: 'section-immersion',
            values: 'section-values',
            qna: 'section-qna',
          }}
        />

        {/* 4. 공유 버튼 + 민석님 확인 */}
        <div className="flex items-center justify-center gap-3 pt-2 pb-4">
          <CopyButton report={report} />
          {report.interviewerNotes.finalDecision !== 'drop' && (
            <div className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl">
              <span className="text-sm font-medium text-slate-400 mr-1">민석님 확인</span>
              <button
                onClick={() => handleCeoDecision('pass')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200 ${
                  report.ceoDecision === 'pass'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                    : 'bg-white/5 text-slate-300 border-white/15 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Pass
              </button>
              <button
                onClick={() => handleCeoDecision('drop')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all duration-200 ${
                  report.ceoDecision === 'drop'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-white/5 text-slate-300 border-white/15 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Drop
              </button>
            </div>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            생성: {new Date(report.createdAt).toLocaleString('ko-KR')}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            수정: {new Date(report.updatedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
}
