// 인터뷰 차수
export type InterviewRound = '1차' | '2차' | '1+2차' | '커피챗' | '기타';

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

// 5개 이타적 가치관 전체 평가
export interface ValuesEvaluation {
  honest: ValueEvaluation;      // 솔직 (Humbly Aggressive)
  optimistic: ValueEvaluation;  // 낙관 (Can-Do Spirit)
  proactive: ValueEvaluation;   // 능동 (Take the Lead)
  growth: ValueEvaluation;      // 성장 (Hungry for Excellence)
  respect: ValueEvaluation;     // 존중 (Debate and Commit)
}

// 개별 직무 역량 평가 (분석 내용만, AI 판단/레벨 제외)
export interface CompetencyEvaluation {
  evidence: string[];
  specificCase: string;
  concerns: string[];
  summary: string;
}

// 5개 문제 해결 역량 전체 평가
export interface CompetenciesEvaluation {
  problemDefinition: CompetencyEvaluation;   // 문제 정의 (Start with Why)
  customerFirst: CompetencyEvaluation;       // 고객 관점 (Customer First)
  impact: CompetencyEvaluation;              // 임팩트 (Focus on Impact)
  overCommunication: CompetencyEvaluation;   // 오버 커뮤니케이션 (No Surprises)
  expertise: CompetencyEvaluation;           // 전문성 (Straight to the Core)
}

// 종합 평가 (분석 내용만, AI 추천 판단 제외)
export interface OverallEvaluation {
  strengths: string[];
  risks: string[];
  finalComment: string;
}

// Q&A 카테고리
export type QnATopicCategory = '가치관' | '역량' | '동기/지원배경' | '기타';

export const QNA_TOPIC_ORDER: QnATopicCategory[] = ['가치관', '역량', '동기/지원배경', '기타'];

// Q&A 화자 역할
export type SpeakerRole = 'interviewer' | 'candidate';

// Q&A 아이템
export interface QnAItem {
  id: number;
  question: string;
  answer: string;
  topic: QnATopicCategory;
  questionSpeaker?: SpeakerRole;  // 기본 'interviewer' (하위 호환)
  answerSpeaker?: SpeakerRole;    // 기본 'candidate' (하위 호환)
}

// Q&A 메타데이터
export interface QnAMetadata {
  totalQuestions: number;
  mainTopics: QnATopicCategory[];
}

// Q&A 전체 데이터
export interface QnAData {
  qna: QnAItem[];
  metadata: QnAMetadata;
}

// 최종 의견 선택값 (4단계: Strong No ~ Strong Go)
export type FinalDecision = 'strong-no' | 'weak-no' | 'weak-go' | 'strong-go' | null;

// 대표 확인 결과
export type CeoDecision = 'pass' | 'drop' | null;

// 핵심가치 키 (가치관 5 + 역량 5 + 몰입 = 11개)
export type CoreValueKey = keyof ValuesEvaluation | keyof CompetenciesEvaluation | 'immersion';

// 면접관 소견 (구조화 포맷)
export interface InterviewerNotes {
  finalDecision?: FinalDecision;   // 최종 의견 (Strong No ~ Strong Go)
  strengths?: CoreValueKey[];      // 강점 핵심가치 (최대 2개)
  weaknesses?: CoreValueKey[];     // 약점 핵심가치 (최대 2개)
  comment: string;                 // 이유 (3~4줄)
}

// 전체 평가 보고서
export interface EvaluationReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  interviewInfo: InterviewInfo;
  values?: ValuesEvaluation;
  competencies?: CompetenciesEvaluation;
  immersion?: ValueEvaluation;
  overall?: OverallEvaluation;
  interviewerNotes: InterviewerNotes;
  qnaData?: QnAData;
  ceoDecision?: CeoDecision;
}

// AI 응답 타입 (interviewInfo, id, dates, interviewerNotes 제외)
export interface AIEvaluationResponse {
  values: ValuesEvaluation;
  competencies: CompetenciesEvaluation;
  immersion: ValueEvaluation;
  overall: OverallEvaluation;
}

// 이타적 가치관 한글명 매핑
export const VALUE_NAMES: Record<keyof ValuesEvaluation, string> = {
  honest: '솔직 Humbly Aggressive',
  optimistic: '낙관 Can-Do Spirit',
  proactive: '능동 Take the Lead',
  growth: '성장 Hungry for Excellence',
  respect: '존중 Debate and Commit',
};

// 문제 해결 역량 한글명 매핑
export const COMPETENCY_NAMES: Record<keyof CompetenciesEvaluation, string> = {
  problemDefinition: '문제 정의 Start with Why',
  customerFirst: '고객 관점 Customer First',
  impact: '임팩트 Focus on Impact',
  overCommunication: '오버 커뮤니케이션 No Surprises',
  expertise: '전문성 Straight to the Core',
};

// 기존 보고서 역량 한글명 (레거시 호환)
export const LEGACY_COMPETENCY_NAMES: Record<string, string> = {
  problemSolving: '문제 해결력',
  communication: '커뮤니케이션',
};

// 몰입 한글명
export const IMMERSION_NAME = '몰입 Hustle by Heart';

