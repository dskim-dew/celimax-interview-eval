'use client';

import { Save, User, Briefcase, Users, Calendar, Star, Target } from 'lucide-react';
import { EvaluationReport as ReportType, InterviewerNotes, VALUE_NAMES, COMPETENCY_NAMES, ValuesEvaluation, CompetenciesEvaluation } from '@/lib/types';
import ValueScoreCard from './ValueScoreCard';
import CompetencyCard from './CompetencyCard';
import OverallSection from './OverallSection';
import InterviewerComment from './InterviewerComment';
import CopyButton from './CopyButton';

interface EvaluationReportProps {
  report: ReportType;
  onNotesChange?: (notes: InterviewerNotes) => void;
  onSave?: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
}

export default function EvaluationReport({
  report,
  onNotesChange,
  onSave,
  isSaving = false,
  readOnly = false,
}: EvaluationReportProps) {
  // 핵심 가치 평균 점수 계산
  const valueScores = Object.values(report.values).map(v => v.score);
  const avgScore = (valueScores.reduce((a, b) => a + b, 0) / valueScores.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-4">
              면접 평가 보고서
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">지원자:</span>
                <span className="font-medium text-white">{report.interviewInfo.candidateName}</span>
              </p>
              <p className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">포지션:</span>
                <span className="font-medium text-white">{report.interviewInfo.position}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">면접관:</span>
                <span className="font-medium text-white">{report.interviewInfo.interviewerName}</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">면접일:</span>
                <span className="font-medium text-white">{report.interviewInfo.interviewDate}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <CopyButton report={report} />
            {!readOnly && onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isSaving
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? '저장 중...' : '보고서 저장'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 핵심 가치 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-400" />
            핵심 가치 평가
          </h2>
          <div className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <span className="text-blue-400 font-semibold">평균 {avgScore}점</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(VALUE_NAMES) as [keyof ValuesEvaluation, string][]).map(([key, name]) => (
            <ValueScoreCard
              key={key}
              name={name}
              evaluation={report.values[key]}
            />
          ))}
        </div>
      </div>

      {/* 직무 역량 섹션 */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          직무 역량 평가
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(COMPETENCY_NAMES) as [keyof CompetenciesEvaluation, string][]).map(([key, name]) => (
            <CompetencyCard
              key={key}
              name={name}
              evaluation={report.competencies[key]}
            />
          ))}
        </div>
      </div>

      {/* 종합 평가 */}
      <OverallSection evaluation={report.overall} />

      {/* 면접관 추가 소견 */}
      <InterviewerComment
        notes={report.interviewerNotes}
        onChange={onNotesChange || (() => {})}
        readOnly={readOnly}
      />
    </div>
  );
}
