import { InterviewInfo, QnAData } from './types';
import { truncateToTokenLimit } from './ai-client';

// 평가 프롬프트용 스크립트 토큰 예산
const MAX_SCRIPT_TOKENS = 3500;
// Q&A 정리용 스크립트 토큰 예산 (전체 질문 보존을 위해 넉넉하게)
const MAX_QNA_SCRIPT_TOKENS = 12000;

const CRITERIA = `**이타적 가치관 분석 (Giver Mindset — 점수/등급 없이, 분석 내용만 정리):**
- honest(솔직): 문제·진행·피드백을 공개적으로 공유하는지, 오픈 커뮤니케이션(DM보다 공개 채널) 실천 여부, 불편한 피드백 전달 태도, 심리적 안전감 조성 노력 분석
- optimistic(낙관): "문제는 해결할 수 있다"는 관점 여부, 어려운 문제를 작게 나눠 우선순위를 세우는지, 동료의 새 시도에 목적 확인 후 건설적 지원("안 됩니다"가 아닌 대안 제시) 여부 분석
- proactive(능동): R&R 안팎에서 자발적으로 필요한 일을 찾아 실행하는지, 모호한 경계의 일에 먼저 나서는지, 리더 시야로 팀 전체 목표·문제를 고민하고 제안하는지 분석
- growth(성장): 명확한 성장 목표 설정·공유 여부, 성공/실패 모두 회고하는 습관, 불편한 피드백을 먼저 요청하고 열린 태도로 수용하는지 분석
- respect(존중): 결정 전 오너십을 갖고 솔직하게 의견을 개진하는지, 결정 후 한 방향으로 최선을 다해 실행하는지, 리더로서 구성원 의견 경청 태도 분석

**문제 해결 역량 분석 (Problem-Solving — 등급/레벨 없이, 분석 내용만 정리):**
- problemDefinition(문제 정의): 일의 목적·목표(수치/기한/담당자)를 명확히 설정하는지, 근본 원인(Root Cause)을 "왜?"로 추적하는지, 선행지표를 정의하는지 분석
- customerFirst(고객 관점): 결과물이 고객 문제를 실질적으로 해결하는지 확인하는 태도, 고객 먼저→회사 순서로 판단하는지, 내부 고객(동료)도 배려하는지 분석
- impact(임팩트): ROI를 확인·극대화하는지, 여러 옵션의 장단점을 균형 있게 판단하는지, 핵심 아이템 1~3개에 집중하는지, 장기 자산(재구매 좋은 제품, 브랜드 이미지 등) 관점 분석
- overCommunication(오버 커뮤니케이션): 목적·상황·문제 맥락을 충분히 공유하는지, 해결책보다 문제를 먼저 공유하는지, 여러 옵션+추천 의견(Share Multiple) 제시 여부, 병목을 만들지 않는지 분석
- expertise(전문성): 내 분야 전문성 깊이, 타 분야 이해도, AI 활용 수준, 문제의 본질에 빠르게 도달하는 능력 분석

**몰입 분석 (Hustle by Heart — 점수/등급 없이, 분석 내용만 정리):**
- immersion(몰입): 내적 동기부여(일을 진심으로 좋아하고 잘하고 싶어하는지), 자발적 시간 투자 경향, 어려운 문제를 쉽게 포기하지 않는 태도, 지속가능한 몰입 가능성 분석

**종합 분석 (추천 여부 판단 없이):** 강점, 리스크/우려사항, 종합 분석 의견을 정리`;

const FIELD_RULES = `**필드 규칙:**
- evidence: 면접자의 1인칭 직접 발언만. 추임새(음,어,네) 제거, 불완전 문장은 재구성. ❌"지원자는 ~했다" ✅"저는 팀장님께 직접 문제를 제기했습니다"
- specificCase: 상황+맥락+결과 포함한 3인칭 사례 설명. 음슴체 또는 명사형으로 마무리. 예) "~한 경험 있음", "~를 주도적으로 해결한 사례", "~로 인해 성과 달성"
- concerns: 우려사항 없으면 빈 배열 []. 있을 경우 음슴체 또는 명사형으로 마무리. 예) "~에 대한 구체성 부족", "~역량 검증 필요"
- summary(values/competencies/immersion): 음슴체 또는 명사형으로 마무리. 예) "~한 태도 보임", "~역량 갖춤", "~에 강점 있음"
- finalComment: 반드시 '-입니다.' 체(존대체)로 작성. 예) "~한 역량을 보여주었습니다. ~점이 인상적이었습니다."`;

const JSON_RULES = `**출력: JSON만, {로 시작 }로 끝, 코드블록/설명문 없이.**`;

const OUTPUT_SCHEMA = `{
  "values": {
    "honest": { "evidence": ["발언1","발언2"], "specificCase": "사례설명", "concerns": [], "summary": "종합분석" },
    "optimistic": { "evidence": [...], "specificCase": "...", "concerns": [...], "summary": "..." },
    "proactive": { ... }, "growth": { ... }, "respect": { ... }
  },
  "competencies": {
    "problemDefinition": { "evidence": ["발언1"], "specificCase": "사례", "concerns": [], "summary": "분석의견" },
    "customerFirst": { ... }, "impact": { ... }, "overCommunication": { ... }, "expertise": { ... }
  },
  "immersion": { "evidence": ["발언1","발언2"], "specificCase": "사례설명", "concerns": [], "summary": "종합분석" },
  "overall": {
    "strengths": ["강점1","강점2","강점3"],
    "risks": ["리스크1","리스크2"],
    "finalComment": "종합 분석 의견 3-4문장"
  }
}`;

// 실제 면접 내용 기반 평가 프롬프트
export function buildEvaluationPrompt(interviewInfo: InterviewInfo): string {
  const hasScript = interviewInfo.tiroScript && interviewInfo.tiroScript.trim().length > 0;
  const hasTranscript = interviewInfo.transcript && interviewInfo.transcript.trim().length > 0;

  let scriptSection = '';
  if (hasScript) {
    const { text: trimmedScript, truncated } = truncateToTokenLimit(interviewInfo.tiroScript!, MAX_SCRIPT_TOKENS);
    scriptSection = `**스크립트:**
━━━━━━━━━━━━━━━━━━━━
${trimmedScript}
━━━━━━━━━━━━━━━━━━━━${truncated ? '\n(스크립트가 길어 일부 생략됨)' : ''}`;
  }
  if (hasTranscript) {
    const { text: trimmedTranscript } = truncateToTokenLimit(interviewInfo.transcript!, 1000);
    scriptSection += `${hasScript ? '\n\n' : ''}**면접관 추가 메모:**
${trimmedTranscript}`;
  }

  return `면접 스크립트를 분석하여 Celi-Hire 평가표 기준으로 JSON 생성.

**면접 정보:**
면접관: ${interviewInfo.interviewerName}
포지션: ${interviewInfo.position}
지원자: ${interviewInfo.candidateName}
면접일: ${interviewInfo.interviewDate}
인터뷰 차수: ${interviewInfo.interviewRound ?? '-'}

${scriptSection}

${CRITERIA}

${FIELD_RULES}

${JSON_RULES}
${OUTPUT_SCHEMA}`;
}

// Q&A 정리 프롬프트
export function buildQnAPrompt(tiroScript: string): string {
  const { text: scriptText, truncated } = truncateToTokenLimit(tiroScript, MAX_QNA_SCRIPT_TOKENS);
  return `다음 면접 스크립트를 Q&A 형식으로 정리해주세요.

**스크립트:**
━━━━━━━━━━━━━━━━━━━━
${scriptText}
━━━━━━━━━━━━━━━━━━━━${truncated ? '\n(스크립트가 길어 일부 생략됨)' : ''}

**정리 규칙:**
- 면접관의 질문과 지원자의 답변을 명확히 구분
- 추임새(음, 어, 네 등)와 불필요한 반복만 제거, 불완전한 문장은 완성
- 스크립트에 등장하는 **모든 질문을 빠짐없이** 포함 (중요도와 무관하게 전부)
- 꼬리질문도 별도 Q&A로 분리
- 질문은 원문 의도를 그대로 유지
- **답변은 말더듬·반복만 제거하고, 핵심 내용·구체적 사례·맥락은 모두 보존. 길이 제한 없음** (면접 진행 방식을 파악할 수 있도록 최대한 원문에 가깝게 유지)
- **모든 질문을 빠짐없이 포함하는 것이 최우선. 질문은 절대 생략하지 말 것**
- **출력이 길어질 경우 미완성 JSON을 출력하지 말고, 현재까지 완성된 Q&A만으로 JSON 배열을 닫고 metadata까지 반드시 출력** (불완전한 JSON 절대 금지)

**토픽 분류 (반드시 아래 4개 중 하나):**
- "가치관": 조직 문화 적합성, 팀워크, 업무 스타일, 갈등 해결, 협업 태도
- "역량": 직무 전문성, 기술 역량, 문제 해결력, 프로젝트 경험, 커뮤니케이션
- "동기/지원배경": 지원 동기, 커리어 목표, 회사 선택 기준, 이직 사유
- "기타": 자기소개, 연봉, 입사 가능 시기, 아이스브레이킹 등 위에 해당하지 않는 질문

**출력: JSON만, {로 시작 }로 끝, 코드블록/설명문 없이.**
{
  "qna": [
    {
      "id": 1,
      "question": "질문 원문 (추임새만 제거)",
      "answer": "답변 원문 정리 (말더듬·반복만 제거, 내용 보존)",
      "topic": "가치관" | "역량" | "동기/지원배경" | "기타"
    }
  ],
  "metadata": {
    "totalQuestions": 10,
    "mainTopics": ["가치관", "역량", "동기/지원배경"]
  }
}`;
}

// Q&A 기반 평가 프롬프트
export function buildEvaluationFromQnAPrompt(interviewInfo: InterviewInfo, qnaData: QnAData): string {
  const qnaText = qnaData.qna.map(item =>
    `Q${item.id}. [${item.topic}] ${item.question}\nA. ${item.answer}`
  ).join('\n\n');

  return `정리된 면접 Q&A를 분석하여 Celi-Hire 평가표 기준으로 JSON 생성.

**면접 정보:**
면접관: ${interviewInfo.interviewerName}
포지션: ${interviewInfo.position}
지원자: ${interviewInfo.candidateName}
면접일: ${interviewInfo.interviewDate}
인터뷰 차수: ${interviewInfo.interviewRound ?? '-'}

**정리된 Q&A:**
━━━━━━━━━━━━━━━━━━━━
${qnaText}
━━━━━━━━━━━━━━━━━━━━
${interviewInfo.transcript ? `\n**면접관 추가 메모:**\n${interviewInfo.transcript}\n` : ''}
${CRITERIA}

${FIELD_RULES}

${JSON_RULES}
${OUTPUT_SCHEMA}`;
}

