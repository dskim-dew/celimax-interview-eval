import { InterviewInfo, QnAData } from './types';
import { truncateToTokenLimit } from './ai-client';

// 평가 프롬프트용 스크립트 토큰 예산
const MAX_SCRIPT_TOKENS = 3500;
// Q&A 정리용 스크립트 토큰 예산 (전체 질문 보존을 위해 평가 프롬프트보다 넉넉하게)
const MAX_QNA_SCRIPT_TOKENS = 5000;

const CRITERIA = `**가치관 분석 (점수/등급 없이, 분석 내용만 정리):**
- honest(솔직): 실패/약점 인정 여부, 사실 기반 답변인지, 과장·미화 경향 분석
- proactive(능동): 자발적 문제 발견/해결 경험, 업무 범위 밖 기여 여부, 수동적/능동적 태도 분석
- optimistic(낙관): 어려운 상황 대처 방식, 실패를 학습 기회로 전환하는지, 긍정/부정적 관점 분석
- growth(성장): 자기개발 계획·실행 경험, 피드백 수용 태도, 학습 의지와 구체성 분석
- respect(존중): 다양한 의견 경청 여부, 갈등 시 상대 입장 고려, 협업 태도 분석
- altruistic(이타): 팀 기여/개인 이익 양보 경험, 동료 지원·지식 공유 태도 분석
- immersed(몰입): 업무 열정/완성도 추구 정도, 디테일 집착, 자발적 노력 수준 분석

**역량 분석 (등급/레벨 없이, 분석 내용만 정리):**
- expertise(직무 전문성): 보유 기술과 경험의 깊이, 도메인 이해도, 실무 적용 가능성 분석
- problemSolving(문제 해결력): 문제 접근 방식, 구조적 사고, 실행력 수준 분석
- communication(커뮤니케이션): 논리적 전달력, 이해관계자 소통 경험, 경청/질문 능력 분석

**종합 분석 (추천 여부 판단 없이):** 강점, 리스크/우려사항, 종합 분석 의견을 정리`;

const FIELD_RULES = `**필드 규칙:**
- evidence: 면접자의 1인칭 직접 발언만. 추임새(음,어,네) 제거, 불완전 문장은 재구성. ❌"지원자는 ~했다" ✅"저는 팀장님께 직접 문제를 제기했습니다"
- specificCase: 상황+맥락+결과 포함한 3인칭 사례 설명. 음슴체 또는 명사형으로 마무리. 예) "~한 경험 있음", "~를 주도적으로 해결한 사례", "~로 인해 성과 달성"
- concerns: 우려사항 없으면 빈 배열 []. 있을 경우 음슴체 또는 명사형으로 마무리. 예) "~에 대한 구체성 부족", "~역량 검증 필요"
- summary(values/competencies): 음슴체 또는 명사형으로 마무리. 예) "~한 태도 보임", "~역량 갖춤", "~에 강점 있음"
- finalComment: 반드시 '-입니다.' 체(존대체)로 작성. 예) "~한 역량을 보여주었습니다. ~점이 인상적이었습니다."`;

const JSON_RULES = `**출력: JSON만, {로 시작 }로 끝, 코드블록/설명문 없이.**`;

const OUTPUT_SCHEMA = `{
  "values": {
    "honest": { "evidence": ["발언1","발언2"], "specificCase": "사례설명", "concerns": [], "summary": "종합분석" },
    "proactive": { "evidence": [...], "specificCase": "...", "concerns": [...], "summary": "..." },
    "optimistic": { ... }, "growth": { ... }, "respect": { ... }, "altruistic": { ... }, "immersed": { ... }
  },
  "competencies": {
    "expertise": { "evidence": ["발언1"], "specificCase": "사례", "concerns": [], "summary": "분석의견" },
    "problemSolving": { ... }, "communication": { ... }
  },
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

  return `면접 스크립트를 분석하여 Celi Hire 평가표 기준으로 JSON 생성.

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
- 추임새(음, 어, 네 등) 제거, 불완전한 문장은 완성
- 스크립트에 등장하는 **모든 질문을 빠짐없이** 포함 (중요도와 무관하게 전부)
- 꼬리질문도 별도 Q&A로 분리
- 질문은 원문 의도를 그대로 유지
- **답변은 핵심 내용 + 주요 사례 포함하여 2-4문장으로 요약** (과도한 축약 지양)
- **출력이 길어질 경우 미완성 JSON을 출력하지 말고, 현재까지 완성된 Q&A만으로 JSON 배열을 닫고 metadata까지 반드시 출력** (불완전한 JSON 절대 금지)

**출력: JSON만, {로 시작 }로 끝, 코드블록/설명문 없이.**
{
  "qna": [
    {
      "id": 1,
      "question": "질문 원문 (추임새만 제거)",
      "answer": "답변 요약 2-4문장",
      "topic": "주제"
    }
  ],
  "metadata": {
    "totalQuestions": 10,
    "mainTopics": ["경력", "프로젝트", "가치관"]
  }
}`;
}

// Q&A 기반 평가 프롬프트
export function buildEvaluationFromQnAPrompt(interviewInfo: InterviewInfo, qnaData: QnAData): string {
  const qnaText = qnaData.qna.map(item =>
    `Q${item.id}. [${item.topic}] ${item.question}\nA. ${item.answer}`
  ).join('\n\n');

  return `정리된 면접 Q&A를 분석하여 Celi Hire 평가표 기준으로 JSON 생성.

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

// 데모 모드 프롬프트
export function buildDemoPrompt(interviewInfo: InterviewInfo): string {
  return `데모 모드: 가상의 현실적 면접 시나리오를 상상하여 Celi Hire 평가표 JSON 생성.

**면접 정보:**
면접관: ${interviewInfo.interviewerName}
포지션: ${interviewInfo.position}
지원자: ${interviewInfo.candidateName}
면접일: ${interviewInfo.interviewDate}
인터뷰 차수: ${interviewInfo.interviewRound ?? '-'}
${interviewInfo.tiroScript ? `\n**참조 스크립트:**\n${interviewInfo.tiroScript}` : ''}
${interviewInfo.transcript ? `\n**참조 메모:**\n${interviewInfo.transcript}` : ''}

**시나리오 규칙:** ${interviewInfo.position} 포지션 경력 2-5년차 현실적 지원자 상상. 최소 1-2개 우려사항 포함. 강점과 리스크 모두 균형있게 포함.

${CRITERIA}

${FIELD_RULES}

${JSON_RULES}
${OUTPUT_SCHEMA}`;
}
