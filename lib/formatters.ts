import {
  EvaluationReport,
  VALUE_NAMES,
  COMPETENCY_NAMES,
  ValuesEvaluation,
  CompetenciesEvaluation,
  QnAData,
} from './types';

// Q&A 텍스트 포매팅 (재사용)
function formatQnAText(qnaData: QnAData): string {
  const lines: string[] = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('면접 Q&A 정리');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  qnaData.qna.forEach(item => {
    lines.push(`Q${item.id}. [${item.topic}]`);
    lines.push(`${item.question}`);
    lines.push('');
    lines.push(`A. ${item.answer}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

// 표 형식 복사 (탭으로 구분 - 먼데이 붙여넣기 시 자동 표 변환)
export function formatForMondayTable(report: EvaluationReport): string {
  const lines: string[] = [];

  // 기본 정보
  lines.push('항목\t내용');
  lines.push(`지원자\t${report.interviewInfo.candidateName}`);
  lines.push(`포지션\t${report.interviewInfo.position}`);
  lines.push(`면접관\t${report.interviewInfo.interviewerName}`);
  lines.push(`면접일\t${report.interviewInfo.interviewDate}`);
  lines.push('');

  // 핵심 가치 분석
  lines.push('핵심 가치\t분석 요약');
  for (const [key, name] of Object.entries(VALUE_NAMES)) {
    const value = report.values[key as keyof ValuesEvaluation];
    lines.push(`${name}\t${value.summary}`);
  }
  lines.push('');

  // 직무 역량 분석
  lines.push('직무 역량\t분석 요약');
  for (const [key, name] of Object.entries(COMPETENCY_NAMES)) {
    const comp = report.competencies[key as keyof CompetenciesEvaluation];
    lines.push(`${name}\t${comp.summary}`);
  }
  lines.push('');

  // 종합 분석
  lines.push('종합 분석\t내용');
  lines.push(`강점\t${report.overall.strengths.join(', ')}`);
  lines.push(`리스크\t${report.overall.risks.join(', ')}`);
  lines.push(`종합 의견\t${report.overall.finalComment}`);

  // 면접관 소견
  const notes = report.interviewerNotes;
  if (notes.comment) {
    lines.push('');
    lines.push('면접관 소견\t내용');
    lines.push(`소견\t${notes.comment}`);
  }

  // Q&A 데이터
  if (report.qnaData) {
    lines.push('');
    lines.push(formatQnAText(report.qnaData));
  }

  return lines.join('\n');
}

// 텍스트 형식 복사 (가독성 좋은 형식)
export function formatForText(report: EvaluationReport): string {
  const lines: string[] = [];

  // 헤더
  lines.push('═══════════════════════════════════════');
  lines.push('면접 분석 보고서');
  lines.push('═══════════════════════════════════════');
  lines.push('');

  // 기본 정보
  lines.push('【 기본 정보 】');
  lines.push(`• 지원자: ${report.interviewInfo.candidateName}`);
  lines.push(`• 포지션: ${report.interviewInfo.position}`);
  lines.push(`• 면접관: ${report.interviewInfo.interviewerName}`);
  lines.push(`• 면접일: ${report.interviewInfo.interviewDate}`);
  lines.push('');

  // 핵심 가치 분석
  lines.push('───────────────────────────────────────');
  lines.push('【 핵심 가치 분석 】');
  lines.push('───────────────────────────────────────');

  for (const [key, name] of Object.entries(VALUE_NAMES)) {
    const value = report.values[key as keyof ValuesEvaluation];
    lines.push('');
    lines.push(`▸ ${name}`);
    lines.push(`  ${value.summary}`);
    if (value.specificCase) {
      lines.push(`  근거 사례: ${value.specificCase}`);
    }
    if (value.evidence.length > 0) {
      lines.push(`  실제 발언:`);
      value.evidence.forEach(e => lines.push(`     "${e}"`));
    }
    if (value.concerns.length > 0) {
      lines.push(`  우려사항: ${value.concerns.join(', ')}`);
    }
  }
  lines.push('');

  // 직무 역량 분석
  lines.push('───────────────────────────────────────');
  lines.push('【 직무 역량 분석 】');
  lines.push('───────────────────────────────────────');

  for (const [key, name] of Object.entries(COMPETENCY_NAMES)) {
    const comp = report.competencies[key as keyof CompetenciesEvaluation];
    lines.push('');
    lines.push(`▸ ${name}`);
    lines.push(`  ${comp.summary}`);
    if (comp.specificCase) {
      lines.push(`  근거 사례: ${comp.specificCase}`);
    }
    if (comp.evidence.length > 0) {
      lines.push(`  실제 발언:`);
      comp.evidence.forEach(e => lines.push(`     "${e}"`));
    }
    if (comp.concerns.length > 0) {
      lines.push(`  우려사항: ${comp.concerns.join(', ')}`);
    }
  }
  lines.push('');

  // 종합 분석
  lines.push('═══════════════════════════════════════');
  lines.push('【 종합 분석 】');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push('강점:');
  report.overall.strengths.forEach(s => lines.push(`   • ${s}`));
  lines.push('');
  lines.push('리스크:');
  report.overall.risks.forEach(r => lines.push(`   • ${r}`));
  lines.push('');
  lines.push('종합 의견:');
  lines.push(`   ${report.overall.finalComment}`);

  // 면접관 소견
  const notes = report.interviewerNotes;
  if (notes.comment) {
    lines.push('');
    lines.push('───────────────────────────────────────');
    lines.push('【 면접관 소견 】');
    lines.push('───────────────────────────────────────');
    lines.push('');
    lines.push(`   ${notes.comment}`);
  }

  // Q&A 데이터
  if (report.qnaData) {
    lines.push('');
    lines.push(formatQnAText(report.qnaData));
  }

  lines.push('');
  lines.push('═══════════════════════════════════════');

  return lines.join('\n');
}

// 간단한 요약 형식 (슬랙/메시지용)
export function formatForSummary(report: EvaluationReport): string {
  return `[면접 분석 요약]
지원자: ${report.interviewInfo.candidateName}
포지션: ${report.interviewInfo.position}
강점: ${report.overall.strengths.slice(0, 2).join(', ')}
리스크: ${report.overall.risks.slice(0, 2).join(', ')}`;
}

// 공유용 요약 형식 (기본정보 + 종합분석 + 항목별 요약 + 면접관 소견 + 링크)
export function formatForShareSummary(report: EvaluationReport, reportUrl?: string): string {
  const { position, interviewRound, candidateName, interviewDate } = report.interviewInfo;
  const roundLabel = interviewRound ?? '';
  const formattedDate = interviewDate.replace(/-/g, '.');

  const lines: string[] = [];

  // 제목
  const titlePrefix = roundLabel ? `[${roundLabel} 인터뷰]` : '[인터뷰]';
  const titleSuffix = roundLabel ? `${position} ${roundLabel}` : position;
  lines.push(`${titlePrefix} ${titleSuffix} - ${candidateName} 님 (${formattedDate})`);
  lines.push('');

  // 보고서 링크
  if (reportUrl) {
    lines.push(`보고서 링크: ${reportUrl}`);
    lines.push('');
  }

  // 면접관 소견
  const notes = report.interviewerNotes;
  const decisionLabel: Record<string, string> = { drop: '드랍', 'weak-go': 'Weak Go', 'strong-go': 'Strong Go' };
  if (notes.comment || notes.finalDecision) {
    lines.push('▸ 면접관 소견');
    if (notes.finalDecision) {
      lines.push(`  • 최종 의견: ${decisionLabel[notes.finalDecision]}`);
    }
    if (notes.comment) {
      lines.push(`  • ${notes.comment}`);
    }
    lines.push('');
  }

  // 직무 역량 분석 요약
  lines.push('▸ 직무 역량');
  for (const [key, name] of Object.entries(COMPETENCY_NAMES)) {
    const comp = report.competencies[key as keyof CompetenciesEvaluation];
    lines.push(`  • ${name} — ${comp.summary}`);
  }
  lines.push('');

  // 핵심 가치 분석 요약
  lines.push('▸ 핵심 가치');
  for (const [key, name] of Object.entries(VALUE_NAMES)) {
    const value = report.values[key as keyof ValuesEvaluation];
    lines.push(`  • ${name} — ${value.summary}`);
  }

  return lines.join('\n');
}
