import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 대략적 토큰 추정 (한국어: ~2-3자/토큰, 영어: ~4자/토큰, 보수적 추정)
export function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\uAC00-\uD7AF\u3130-\u318F]/g) || []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}

// 토큰 한도에 맞게 스크립트 자르기
export function truncateToTokenLimit(text: string, maxTokens: number): { text: string; truncated: boolean } {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) {
    return { text, truncated: false };
  }

  // 비율로 잘라내기 (약간 여유를 둠)
  const ratio = (maxTokens * 0.95) / estimated;
  const charLimit = Math.floor(text.length * ratio);

  // 문장 단위로 자르기 (마지막 완전한 문장까지)
  let truncated = text.substring(0, charLimit);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('\n')
  );

  if (lastSentenceEnd > charLimit * 0.8) {
    truncated = truncated.substring(0, lastSentenceEnd + 1);
  }

  return { text: truncated, truncated: true };
}

// AI 응답 JSON 정제 (잘린 응답 복구 포함)
export function cleanAIResponse(rawText: string): string {
  console.log('[cleanAIResponse] Raw first 300 chars:', rawText.substring(0, 300));

  let cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();

  // 제어 문자 제거
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // JSON 시작점 찾기
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart === -1) throw new Error('JSON 시작점을 찾을 수 없습니다.');
  cleaned = cleaned.substring(jsonStart);
  console.log('[cleanAIResponse] After extract, pos 30-50:', JSON.stringify(cleaned.substring(30, 50)));

  // 누락된 쉼표 복구: 속성 값 뒤에 쉼표 없이 다음 속성 키가 오는 경우
  const beforeCommaFix = cleaned;
  cleaned = cleaned.replace(
    /("(?:[^"\\]|\\.)*"|\d+(?:\.\d+)?|true|false|null|\]|\})\s*\n(\s*"(?:[^"\\]|\\.)*"\s*:)/g,
    '$1,\n$2'
  );
  // 누락된 쉼표 복구: 배열 내 객체 사이 (}\n  {)
  cleaned = cleaned.replace(/\}\s*\n(\s*\{)/g, '},\n$1');
  if (beforeCommaFix !== cleaned) {
    console.log('[cleanAIResponse] Comma fix changed the text!');
    console.log('[cleanAIResponse] After comma fix, pos 30-50:', JSON.stringify(cleaned.substring(30, 50)));
  }

  // 이미 유효한 JSON이면 바로 반환
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    console.log('[cleanAIResponse] First parse failed:', (e as Error).message);
    // 복구 시도
  }

  // JSON 끝점까지 잘라보기
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonEnd !== -1) {
    const candidate = cleaned.substring(0, jsonEnd + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // 더 복구 필요
    }
  }

  // 잘린 JSON 복구: 뒤에서부터 } 위치를 찾아 잘라보며 JSON.parse 시도
  let repaired = cleaned;

  const closeBracePositions: number[] = [];
  for (let i = repaired.length - 1; i >= 0 && closeBracePositions.length < 20; i--) {
    if (repaired[i] === '}') closeBracePositions.push(i);
  }

  for (const pos of closeBracePositions) {
    let candidate = repaired.substring(0, pos + 1);
    // trailing comma 제거 (문자열 맨 끝만, m 플래그 없이)
    candidate = candidate.replace(/,\s*$/, '');
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');

    // 열린 문자열 닫기: 따옴표 수가 홀수면 마지막 따옴표 이전까지 자르고 닫기
    const lastQ = candidate.lastIndexOf('"');
    if (lastQ !== -1) {
      const quoteCount = (candidate.substring(0, lastQ + 1).match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        candidate = candidate.substring(0, lastQ) + '"';
        candidate = candidate.replace(/,\s*([}\]])/g, '$1');
      }
    }

    // 열린 브래킷/브레이스 카운트해서 닫기
    const openBraces = (candidate.match(/{/g) || []).length;
    const closeBraces = (candidate.match(/}/g) || []).length;
    const openBrackets = (candidate.match(/\[/g) || []).length;
    const closeBrackets = (candidate.match(/]/g) || []).length;

    let suffix = '';
    for (let i = 0; i < openBrackets - closeBrackets; i++) suffix += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) suffix += '}';

    const attempt = candidate + suffix;
    try {
      JSON.parse(attempt);
      console.log(`[AI Client] 잘린 JSON 복구 성공 (위치 ${pos}에서 자름)`);
      return attempt;
    } catch {
      continue;
    }
  }

  // 최후의 수단: 원본에서 trailing comma 정리 후 브래킷 닫기
  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');
  // 잘린 문자열 값 닫기: 마지막 열린 따옴표 찾기
  const lastQuote = repaired.lastIndexOf('"');
  const quotesBefore = (repaired.substring(0, lastQuote + 1).match(/"/g) || []).length;
  if (quotesBefore % 2 !== 0) {
    // 홀수 따옴표 = 열린 문자열 → 닫기
    repaired = repaired.substring(0, lastQuote) + '"';
  }

  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

  return repaired;
}

// 마지막 요청 시각 (분당 제한 추적)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1_000; // 최소 1초 간격

interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
  system?: string;
}

// Rate-limit 인식 AI 호출 (재시도 포함)
export async function generateAIResponse<T>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const {
    model = 'claude-haiku-4-5-20251001',
    maxTokens = 4096,
    temperature = 0.2,
    maxRetries = 3,
    system,
  } = options;

  // 요청 간격 쓰로틀링
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitMs = MIN_REQUEST_INTERVAL_MS - elapsed;
    console.log(`[AI Client] 요청 간격 유지: ${Math.ceil(waitMs / 1000)}초 대기...`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      lastRequestTime = Date.now();

      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('AI 응답에서 텍스트를 찾을 수 없습니다.');
      }

      if (response.stop_reason === 'max_tokens') {
        console.warn('[AI Client] 응답이 max_tokens로 잘렸습니다. 정제 시도...');
      }

      const cleaned = cleanAIResponse(textContent.text);
      const parsed: T = JSON.parse(cleaned);
      return parsed;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AI Client] 시도 ${attempt + 1}/${maxRetries} 실패:`, lastError.message);

      // Rate limit 에러: retry-after 값 그대로 사용 (캡 없음)
      if (error instanceof Anthropic.APIError && error.status === 429) {
        if (attempt >= maxRetries - 1) throw error;

        const retryAfter = error.headers?.get?.('retry-after');
        const waitSec = retryAfter ? parseInt(retryAfter, 10) : 60;
        console.log(`[AI Client] Rate limit. ${waitSec}초 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
        continue;
      }

      // 기타 API 에러 (인증 등)는 즉시 throw
      if (error instanceof Anthropic.APIError) {
        throw error;
      }

      // JSON 파싱 에러 등: 짧게 대기 후 재시도
      if (attempt < maxRetries - 1) {
        const backoffSec = 3 * (attempt + 1);
        console.log(`[AI Client] ${backoffSec}초 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, backoffSec * 1000));
      }
    }
  }

  throw lastError || new Error('알 수 없는 오류');
}

// SSE 스트리밍 AI 응답 (재시도 포함)
export function createSSEStream(
  prompt: string,
  options: GenerateOptions = {}
): ReadableStream<Uint8Array> {
  const {
    model = 'claude-haiku-4-5-20251001',
    maxTokens = 4096,
    temperature = 0.2,
    maxRetries = 3,
    system,
  } = options;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // 요청 간격 쓰로틀링
          const now = Date.now();
          const elapsed = now - lastRequestTime;
          if (elapsed < MIN_REQUEST_INTERVAL_MS) {
            await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
          }
          lastRequestTime = Date.now();

          if (attempt > 0) {
            console.log(`[SSE Stream] 재시도 ${attempt + 1}/${maxRetries}...`);
            sendEvent({ type: 'retry', attempt: attempt + 1 });
          }

          const response = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            temperature,
            ...(system ? { system } : {}),
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          });

          let fullText = '';
          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullText += event.delta.text;
              sendEvent({ type: 'chunk', text: event.delta.text });
            }
          }

          console.log(`[SSE Stream] 응답 수신 완료 (${fullText.length}자), 파싱 시도...`);

          // JSON 정제 및 파싱
          const cleaned = cleanAIResponse(fullText);
          console.log('[SSE Stream] Cleaned pos 30-50:', JSON.stringify(cleaned.substring(30, 50)));
          console.log('[SSE Stream] Cleaned chars 35-45:', Array.from(cleaned.substring(35, 45)).map((c, i) => `${35+i}:'${c}'(${c.charCodeAt(0)})`).join(' '));
          const parsed = JSON.parse(cleaned);
          sendEvent({ type: 'result', data: parsed });
          controller.close();
          return; // 성공 시 종료

        } catch (error) {
          // Rate limit → 즉시 에러 (재시도 무의미)
          if (error instanceof Anthropic.APIError && error.status === 429) {
            const retryAfter = error.headers?.get?.('retry-after');
            const waitSec = retryAfter ? parseInt(retryAfter, 10) : 60;
            sendEvent({
              type: 'error',
              message: `API 요청 한도에 도달했습니다. ${Math.ceil(waitSec / 60)}분 후 다시 시도해주세요.`,
              retryAfterSec: waitSec,
            });
            controller.close();
            return;
          }

          // 기타 API 에러 → 즉시 에러
          if (error instanceof Anthropic.APIError) {
            sendEvent({ type: 'error', message: `Claude API 오류: ${error.message}` });
            controller.close();
            return;
          }

          // JSON 파싱 에러 → 재시도 가능
          const errMsg = error instanceof Error ? error.message : '알 수 없는 오류';
          console.error(`[SSE Stream] 시도 ${attempt + 1}/${maxRetries} 실패:`, errMsg);

          if (attempt < maxRetries - 1) {
            const backoffSec = 2 * (attempt + 1);
            console.log(`[SSE Stream] ${backoffSec}초 대기 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, backoffSec * 1000));
            continue;
          }

          // 최종 실패
          sendEvent({ type: 'error', message: 'AI 응답을 파싱하는 데 실패했습니다. 다시 시도해주세요.' });
          controller.close();
          return;
        }
      }

      controller.close();
    },
  });
}
