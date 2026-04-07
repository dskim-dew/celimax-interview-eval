'use client';

import { Save, User, Briefcase, Users, Calendar, Star, Target, Hash, PenLine } from 'lucide-react';
import { EvaluationReport as ReportType, InterviewerNotes, VALUE_NAMES, COMPETENCY_NAMES, ValuesEvaluation, CompetenciesEvaluation } from '@/lib/types';
import ValueScoreCard from './ValueScoreCard';
import CompetencyCard from './CompetencyCard';
import OverallSection from './OverallSection';
import InterviewerComment from './InterviewerComment';

interface SectionIds {
  overall?: string;
  competency?: string;
  values?: string;
  notes?: string;
}

interface EvaluationReportProps {
  report: ReportType;
  onNotesChange?: (notes: InterviewerNotes) => void;
  onSave?: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
  hideHeader?: boolean;
  hideNotes?: boolean;
  finalDecisionReadOnly?: boolean;
  sectionIds?: SectionIds;
}

export default function EvaluationReport({
  report,
  onNotesChange,
  onSave,
  isSaving = false,
  readOnly = false,
  hideHeader = false,
  hideNotes = false,
  finalDecisionReadOnly = false,
  sectionIds = {},
}: EvaluationReportProps) {
  return (
    <div className="space-y-6">
      {/* 헤더 (최종 리포트 페이지에서는 숨김) */}
      {!hideHeader && (
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold gradient-text mb-4">
            면접 분석 리포트
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">지원자:</span>
              <span className="font-medium text-white">{report.interviewInfo.candidateName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">포지션:</span>
              <span className="font-medium text-white">{report.interviewInfo.position}</span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">면접관:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewerName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">면접일:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewDate}</span>
            </p>
            <p className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">인터뷰 차수:</span>
              <span className="font-medium text-white">{report.interviewInfo.interviewRound ?? '-'}</span>
            </p>
            {report.interviewInfo.reportAuthor && (
              <p className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-lime-400" />
                <span className="text-slate-300">작성자:</span>
                <span className="font-medium text-white">{report.interviewInfo.reportAuthor}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 종합 분석 */}
      <div id={sectionIds.overall} className={sectionIds.overall ? 'scroll-mt-8' : undefined}>
        <OverallSection evaluation={report.overall} />
      </div>

      {/* 직무 역량 섹션 */}
      <div
        id={sectionIds.competency}
        className={`rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6${sectionIds.competency ? ' scroll-mt-8' : ''}`}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-lime-400" />
          직무 역량 분석
        </h2>
        <div className="space-y-4">
          {(Object.entries(COMPETENCY_NAMES) as [keyof CompetenciesEvaluation, string][]).map(([key, name]) => (
            <CompetencyCard
              key={key}
              name={name}
              evaluation={report.competencies[key]}
            />
          ))}
        </div>
      </div>

      {/* 핵심 가치 섹션 */}
      <div
        id={sectionIds.values}
        className={`rounded-2xl bg-lime-500/5 border border-lime-500/10 p-6${sectionIds.values ? ' scroll-mt-8' : ''}`}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
          <Star className="w-5 h-5 text-emerald-400" />
          핵심 가치 분석
        </h2>
        <div className="space-y-4">
          {(Object.entries(VALUE_NAMES) as [keyof ValuesEvaluation, string][]).map(([key, name]) => (
            <ValueScoreCard
              key={key}
              name={name}
              evaluation={report.values[key]}
            />
          ))}
        </div>
      </div>

      {/* 면접관 소견 */}
      {!hideNotes && (
        <div id={sectionIds.notes} className={sectionIds.notes ? 'scroll-mt-8' : undefined}>
          <InterviewerComment
            notes={report.interviewerNotes}
            onChange={onNotesChange || (() => {})}
            readOnly={readOnly}
            finalDecisionReadOnly={finalDecisionReadOnly}
          />
        </div>
      )}

      {/* 최종 리포트 저장 버튼 (메인 페이지 평가표에서만 표시) */}
      {!readOnly && onSave && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
              isSaving
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
            }`}
          >
            <Save className="w-5 h-5" />
            {isSaving ? '저장 중...' : '최종 리포트 저장'}
          </button>
        </div>
      )}
    </div>
  );
}
