import { NextRequest, NextResponse } from 'next/server';
import { InterviewInfo, QnAData } from '@/lib/types';
import { buildEvaluationPrompt, buildDemoPrompt, buildEvaluationFromQnAPrompt } from '@/lib/prompt';
import { createSSEStream, estimateTokens } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const interviewInfo: InterviewInfo = body;
    const qnaData: QnAData | undefined = body.qnaData;

    if (!interviewInfo.candidateName || !interviewInfo.position) {
      return NextResponse.json(
        { error: '지원자 이름과 포지션은 필수입니다.' },
        { status: 400 }
      );
    }

    const scriptLength = (interviewInfo.tiroScript || '').trim().length;
    const transcriptLength = (interviewInfo.transcript || '').trim().length;
    const isDemoMode = !qnaData && scriptLength < 100 && transcriptLength < 100;

    let prompt: string;
    if (qnaData) {
      prompt = buildEvaluationFromQnAPrompt(interviewInfo, qnaData);
    } else if (isDemoMode) {
      prompt = buildDemoPrompt(interviewInfo);
    } else {
      prompt = buildEvaluationPrompt(interviewInfo);
    }

    const inputTokens = estimateTokens(prompt);
    console.log(`[Report] 예상 입력 토큰: ~${inputTokens}, 모드: ${isDemoMode ? '데모' : qnaData ? 'Q&A기반' : '직접'}`);

    const stream = createSSEStream(prompt, {
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 8192,
      temperature: 0.3,
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
    console.error('Generate Report API Error:', error);
    return NextResponse.json(
      { error: '보고서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
