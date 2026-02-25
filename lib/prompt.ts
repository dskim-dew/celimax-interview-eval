import { InterviewInfo, QnAData } from './types';
import { truncateToTokenLimit } from './ai-client';

// 평가 프롬프트용 스크립트 토큰 예산
const MAX_SCRIPT_TOKENS = 3500;
// Q&A 정리용 스크립트 토큰 예산 (전체 질문 보존을 위해 평가 프롬프트보다 넉넉하게)
const MAX_QNA_SCRIPT_TOKENS = 5000;

const CRITERIA = `**가치관 평가 (1-5점):**
- honest(솔직): 5=실패/약점 구체적 인정+학습 설명 4=실패 공유하나 학습 일반적 3=어려운 부분 회피/모호 2=긍정면만 강조 1=과장/사실과 다름
- proactive(능동): 5=업무 범위 넘어 자발적 문제발견/해결 4=업무 내 개선 실행 3=지시받은 일만 수행 2=수동적/지시 의존 1=개선 의지 없음
- optimistic(낙관): 5=어려움에서 해결책 찾음/실패를 성장 기회로 4=긍정적 도전 경험 3=보통 긍정성 2=부정적/불만 위주 1=비관적/상황 탓
- growth(성장): 5=구체적 자기개발 계획+실행+피드백 수용 4=학습 의지+노력 경험 3=관심 있으나 구체성 부족 2=현 역량 안주 1=발전 의지 없음/방어적
- respect(존중): 5=다양한 의견 경청+갈등 시 상대 입장 고려 4=원만한 관계/건설적 대화 3=기본 예의 있으나 깊은 배려 부족 2=자기 주장 강함/수용성 낮음 1=비하/무시/공감 부족
- altruistic(이타): 5=팀 위해 개인 이익 양보 경험 4=동료 지원/지식 공유 적극적 3=요청 시만 도움 2=개인 성과 중심/협업 소극적 1=이기적/팀워크 저해
- immersed(몰입): 5=깊은 열정/자발적 시간 투자/디테일 집착 4=책임감 있게 완성도 추구 3=기본 업무 완수만 2=단순 처리 태도 1=열정 부족/최소 노력

**역량 평가 (4단계: 즉시 투입 가능/온보딩 후 가능/지원 필요, 리스크 있음/단기 투입 어려움):**
- expertise(직무 전문성): 즉시=기술 완벽 보유 온보딩=기본기 있으나 도메인 학습 필요 지원=상당한 교육 필요 단기=기본 역량 부족
- problemSolving(문제 해결력): 즉시=구조화된 접근/실행력 우수 온보딩=분석력 있으나 회사 맥락 필요 지원=단순 문제만 해결 단기=접근법 미흡
- communication(커뮤니케이션): 즉시=논리적/명확/다양한 이해관계자 소통 온보딩=기본 양호/문화 적응 필요 지원=전달 어려움 보완 필요 단기=소통 어려움/협업 우려

**종합 추천:** 적극 추천(평균4.5↑+모두 즉시투입) / 추천(평균4↑+대부분 온보딩↑) / 조건부 추천(평균3↑+일부 우려) / 비추천(평균3↓ or 심각한 우려)`;

const FIELD_RULES = `**필드 규칙:**
- evidence: 면접자의 1인칭 직접 발언만. 추임새(음,어,네) 제거, 불완전 문장은 재구성. ❌"지원자는 ~했다" ✅"저는 팀장님께 직접 문제를 제기했습니다"
- specificCase: 상황+맥락+결과 포함한 3인칭 사례 설명. 음슴체 또는 명사형으로 마무리. 예) "~한 경험 있음", "~를 주도적으로 해결한 사례", "~로 인해 성과 달성"
- concerns: 우려사항 없으면 빈 배열 []. 있을 경우 음슴체 또는 명사형으로 마무리. 예) "~에 대한 구체성 부족", "~역량 검증 필요"
- summary(values/competencies): 음슴체 또는 명사형으로 마무리. 예) "~한 태도 보임", "~역량 갖춤", "~에 강점 있음"
- finalComment: 반드시 '-입니다.' 체(존대체)로 작성. 예) "~한 역량을 보여주었습니다. ~점이 인상적이었습니다."`;

const JSON_RULES = `**출력: JSON만, {로 시작 }로 끝, 코드블록/설명문 없이.**`;

const OUTPUT_SCHEMA = `{
  "values": {
    "honest": { "score": 4, "evidence": ["발언1","발언2"], "specificCase": "사례설명", "concerns": [], "summary": "종합의견" },
    "proactive": { "score": 3, "evidence": [...], "specificCase": "...", "concerns": [...], "summary": "..." },
    "optimistic": { ... }, "growth": { ... }, "respect": { ... }, "altruistic": { ... }, "immersed": { ... }
  },
  "competencies": {
    "expertise": { "level": "온보딩 후 가능", "evidence": ["발언1"], "specificCase": "사례", "concerns": [], "summary": "의견" },
    "problemSolving": { ... }, "communication": { ... }
  },
  "overall": {
    "recommendation": "추천",
    "strengths": ["강점1","강점2","강점3"],
    "risks": ["리스크1","리스크2"],
    "onboardingGuide": "온보딩 가이드",
    "finalComment": "최종 종합 의견 3-4문장"
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

  return `면접 스크립트를 분석하여 셀리맥스 평가표 기준으로 JSON 생성.

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

  return `정리된 면접 Q&A를 분석하여 셀리맥스 평가표 기준으로 JSON 생성.

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
  return `데모 모드: 가상의 현실적 면접 시나리오를 상상하여 셀리맥스 평가표 JSON 생성.

**면접 정보:**
면접관: ${interviewInfo.interviewerName}
포지션: ${interviewInfo.position}
지원자: ${interviewInfo.candidateName}
면접일: ${interviewInfo.interviewDate}
인터뷰 차수: ${interviewInfo.interviewRound ?? '-'}
${interviewInfo.tiroScript ? `\n**참조 스크립트:**\n${interviewInfo.tiroScript}` : ''}
${interviewInfo.transcript ? `\n**참조 메모:**\n${interviewInfo.transcript}` : ''}

**시나리오 규칙:** ${interviewInfo.position} 포지션 경력 2-5년차 현실적 지원자 상상. 가치관 점수 2-5점 분포(평균 3.5-4.0), 최소 1-2개 우려사항 포함, 역량도 다양한 레벨. 강점과 리스크 모두 포함.

${CRITERIA}

${FIELD_RULES}

${JSON_RULES}
${OUTPUT_SCHEMA}`;
}
