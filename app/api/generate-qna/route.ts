import { NextRequest, NextResponse } from 'next/server';
import { buildQnAPrompt } from '@/lib/prompt';
import { createSSEStream, estimateTokens } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { tiroScript } = await request.json();

    if (!tiroScript || tiroScript.trim().length < 100) {
      return NextResponse.json(
        { error: '스크립트가 너무 짧습니다. 충분한 면접 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const prompt = buildQnAPrompt(tiroScript);
    const inputTokens = estimateTokens(prompt);
    console.log(`[Q&A] 예상 입력 토큰: ~${inputTokens}`);

    const stream = createSSEStream(prompt, {
      model: 'claude-sonnet-4-5-20250514',
      maxTokens: 16384,
      temperature: 0.2,
      maxRetries: 3,
      system: '반드시 유효한 JSON만 출력하세요. 코드블록(```), 설명문, 마크다운 없이 {로 시작하고 }로 끝나는 순수 JSON만 응답합니다. 모든 속성 사이에 쉼표를 정확히 포함하세요.',
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Generate Q&A API Error:', error);
    return NextResponse.json(
      { error: 'Q&A 정리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
