'use client';

import { Save, Star, Target, Flame, MessageSquare, Pencil } from 'lucide-react';
import { EvaluationReport as ReportType, InterviewerNotes, VALUE_NAMES, COMPETENCY_NAMES, LEGACY_COMPETENCY_NAMES, IMMERSION_NAME, ValuesEvaluation, QnAData } from '@/lib/types';
import ValueScoreCard from './ValueScoreCard';
import CompetencyCard from './CompetencyCard';
import OverallSection from './OverallSection';
import InterviewerComment from './InterviewerComment';
import AccordionSection from './AccordionSection';
import QnASection from './QnASection';

interface SectionIds {
  overall?: string;
  competency?: string;
  immersion?: string;
  values?: string;
  notes?: string;
  qna?: string;
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
  qnaData?: QnAData;
  onToggleNotesEdit?: () => void;
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
  qnaData,
  onToggleNotesEdit,
}: EvaluationReportProps) {
  return (
    <div className="space-y-6">
      {/* 헤더 (최종 리포트 페이지에서는 숨김) */}
      {!hideHeader && (
        <div className="glass-card p-5">
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
          </div>
        </div>
      )}

      {/* 완성 보고서(sectionIds.notes 있거나 readOnly)일 때: Hiring Manager 소견을 맨 위에 표시 */}
      {(readOnly || sectionIds.notes) && !hideNotes && (
        <div id={sectionIds.notes} className={`${sectionIds.notes ? 'scroll-mt-8' : ''} relative`}>
          {onToggleNotesEdit && (
            <button
              onClick={onToggleNotesEdit}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              title="소견 편집"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <InterviewerComment
            notes={report.interviewerNotes}
            onChange={onNotesChange || (() => {})}
            readOnly={readOnly}
            finalDecisionReadOnly={finalDecisionReadOnly}
            decisionFirst
          />
        </div>
      )}

      {/* 면접 Q&A (고정 높이 스크롤) */}
      {qnaData && (
        <div
          id={sectionIds.qna}
          className={`glass-card overflow-hidden${sectionIds.qna ? ' scroll-mt-8' : ''}`}
        >
          <div className="bg-gradient-to-r from-brand-dark/80 to-brand-deep/20 p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-mid" />
              Q&A 스크립트
            </h2>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <QnASection qnaData={qnaData} />
          </div>
        </div>
      )}

      {/* 종합 분석 */}
      {report.overall && (
        <div id={sectionIds.overall} className={sectionIds.overall ? 'scroll-mt-8' : undefined}>
          <OverallSection evaluation={report.overall} />
        </div>
      )}

      {/* 문제 해결 역량 (아코디언) */}
      {report.competencies && (
        <AccordionSection
          title="문제 해결 역량"
          icon={<Target className="w-5 h-5 text-brand-mid" />}
          badge={String(Object.keys(report.competencies).length)}
          sectionId={sectionIds.competency}
        >
          <div className="space-y-4">
            {Object.entries(report.competencies).map(([key, comp]) => {
              const name = (COMPETENCY_NAMES as Record<string, string>)[key]
                || LEGACY_COMPETENCY_NAMES[key]
                || key;
              return (
                <CompetencyCard
                  key={key}
                  name={name}
                  evaluation={comp}
                />
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* 이타적 가치관 (아코디언) */}
      {report.values && (
        <AccordionSection
          title="이타적 가치관"
          icon={<Star className="w-5 h-5 text-brand-mid" />}
          badge={String(Object.keys(report.values).length)}
          sectionId={sectionIds.values}
        >
          <div className="space-y-4">
            {(Object.entries(VALUE_NAMES) as [keyof ValuesEvaluation, string][]).map(([key, name]) => {
              const value = report.values![key];
              if (!value) return null;
              return (
                <ValueScoreCard
                  key={key}
                  name={name}
                  evaluation={value}
                />
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* 몰입 (아코디언) */}
      {report.immersion && (
        <AccordionSection
          title="몰입"
          icon={<Flame className="w-5 h-5 text-brand-mid" />}
          badge="1"
          sectionId={sectionIds.immersion}

        >
          <div className="space-y-4">
            <ValueScoreCard
              name={IMMERSION_NAME}
              evaluation={report.immersion}
            />
          </div>
        </AccordionSection>
      )}

      {/* 작성 중(비readOnly, sectionIds.notes 없음)일 때: Hiring Manager 소견을 맨 아래에 표시 */}
      {!readOnly && !sectionIds.notes && !hideNotes && (
        <div id={sectionIds.notes} className={sectionIds.notes ? 'scroll-mt-8' : undefined}>
          <InterviewerComment
            notes={report.interviewerNotes}
            onChange={onNotesChange || (() => {})}
            readOnly={readOnly}
            finalDecisionReadOnly={finalDecisionReadOnly}
            decisionFirst
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
                : 'bg-brand-deep text-white hover:bg-brand-mid shadow-lg shadow-brand-deep/20'
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
