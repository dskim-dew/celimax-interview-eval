// 면접 기본 정보
export interface InterviewInfo {
  interviewerName: string;
  position: string;
  candidateName: string;
  tiroScript: string;
  transcript: string;
  interviewDate: string;
}

// 핵심 가치 평가 점수
export type ValueScore = 1 | 2 | 3 | 4 | 5;

// 개별 핵심 가치 평가
export interface ValueEvaluation {
  score: ValueScore;
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

// 직무 역량 레벨
export type CompetencyLevel =
  | "즉시 투입 가능"
  | "온보딩 후 가능"
  | "지원 필요, 리스크 있음"
  | "단기 투입 어려움";

// 개별 직무 역량 평가
export interface CompetencyEvaluation {
  level: CompetencyLevel;
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

// 종합 평가 추천 분류
export type RecommendationType = "적극 추천" | "추천" | "조건부 추천" | "비추천";

// 종합 평가
export interface OverallEvaluation {
  recommendation: RecommendationType;
  strengths: string[];
  risks: string[];
  onboardingGuide: string;
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

// 면접관 추가 소견 (구조화)
export interface InterviewerNotes {
  strengths: string;      // 강점, 함께하고 싶은 이유
  concerns: string;       // 우려되는 부분
  validation: string;     // 추가 검증 필요
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

// 점수별 색상 클래스 (다크모드)
export const SCORE_COLORS: Record<ValueScore, string> = {
  5: 'bg-emerald-500 text-white',
  4: 'bg-lime-500 text-slate-900',
  3: 'bg-yellow-500 text-slate-900',
  2: 'bg-orange-500 text-white',
  1: 'bg-red-500 text-white',
};

// 점수별 배경 그라데이션 (카드용)
export const SCORE_BG_COLORS: Record<ValueScore, string> = {
  5: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  4: 'from-lime-500/20 to-lime-600/10 border-lime-500/30',
  3: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  2: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  1: 'from-red-500/20 to-red-600/10 border-red-500/30',
};

// 역량 레벨별 색상 클래스 (다크모드 배지 스타일)
export const LEVEL_COLORS: Record<CompetencyLevel, string> = {
  '즉시 투입 가능': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  '온보딩 후 가능': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  '지원 필요, 리스크 있음': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  '단기 투입 어려움': 'bg-red-500/20 text-red-400 border border-red-500/30',
};

// 추천 분류별 색상 클래스 (다크모드)
export const RECOMMENDATION_COLORS: Record<RecommendationType, string> = {
  '적극 추천': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  '추천': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  '조건부 추천': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  '비추천': 'bg-red-500/20 text-red-400 border border-red-500/30',
};
