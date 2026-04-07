// 인터뷰 차수
export type InterviewRound = '1차' | '2차' | '기타';

// 면접 기본 정보
export interface InterviewInfo {
  interviewerName: string;
  reportAuthor: string;
  position: string;
  candidateName: string;
  tiroScript: string;
  transcript?: string;
  interviewDate: string;
  interviewRound: InterviewRound;
}

// 개별 핵심 가치 평가 (분석 내용만, AI 판단/점수 제외)
export interface ValueEvaluation {
  evidence: string[];
  specificCase: string;
  concerns: string[];
  summary: string;
}

// 7개 핵심 가치 전체 평가
export interface ValuesEvaluation {
  honest: ValueEvaluation;      // 솔직
  proactive: ValueEvaluation;   // 능동
  optimistic: ValueEvaluation;  // 낙관
  growth: ValueEvaluation;      // 성장
  respect: ValueEvaluation;     // 존중
  altruistic: ValueEvaluation;  // 이타
  immersed: ValueEvaluation;    // 몰입
}

// 개별 직무 역량 평가 (분석 내용만, AI 판단/레벨 제외)
export interface CompetencyEvaluation {
  evidence: string[];
  specificCase: string;
  concerns: string[];
  summary: string;
}

// 3개 직무 역량 전체 평가
export interface CompetenciesEvaluation {
  expertise: CompetencyEvaluation;       // 직무 전문성
  problemSolving: CompetencyEvaluation;  // 문제 해결력
  communication: CompetencyEvaluation;   // 커뮤니케이션
}

// 종합 평가 (분석 내용만, AI 추천 판단 제외)
export interface OverallEvaluation {
  strengths: string[];
  risks: string[];
  finalComment: string;
}

// Q&A 아이템
export interface QnAItem {
  id: number;
  question: string;
  answer: string;
  topic: string;
}

// Q&A 메타데이터
export interface QnAMetadata {
  totalQuestions: number;
  mainTopics: string[];
}

// Q&A 전체 데이터
export interface QnAData {
  qna: QnAItem[];
  metadata: QnAMetadata;
}

// 최종 의견 선택값
export type FinalDecision = 'drop' | 'weak-go' | 'strong-go' | null;

// 면접관 추가 소견 (간소화)
export interface InterviewerNotes {
  comment: string;               // 면접관 소견 (3~5줄)
  finalDecision?: FinalDecision; // 최종 의견
}

// 전체 평가 보고서
export interface EvaluationReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  interviewInfo: InterviewInfo;
  values: ValuesEvaluation;
  competencies: CompetenciesEvaluation;
  overall: OverallEvaluation;
  interviewerNotes: InterviewerNotes;
  qnaData?: QnAData;
}

// AI 응답 타입 (interviewInfo, id, dates, interviewerNotes 제외)
export interface AIEvaluationResponse {
  values: ValuesEvaluation;
  competencies: CompetenciesEvaluation;
  overall: OverallEvaluation;
}

// 핵심 가치 한글명 매핑
export const VALUE_NAMES: Record<keyof ValuesEvaluation, string> = {
  honest: '솔직',
  proactive: '능동',
  optimistic: '낙관',
  growth: '성장',
  respect: '존중',
  altruistic: '이타',
  immersed: '몰입',
};

// 직무 역량 한글명 매핑
export const COMPETENCY_NAMES: Record<keyof CompetenciesEvaluation, string> = {
  expertise: '직무 전문성',
  problemSolving: '문제 해결력',
  communication: '커뮤니케이션',
};

