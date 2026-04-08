import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: 모든 포지션 조회 (활성만 or 전체)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const positions = await prisma.recruitmentPosition.findMany({
      where: all ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(positions)
  } catch {
    return NextResponse.json({ error: '포지션 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 새 포지션 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { positionName, hiringManager, hrPm } = body

    if (!positionName?.trim() || !hiringManager?.trim()) {
      return NextResponse.json(
        { error: '포지션명과 Hiring Manager는 필수입니다.' },
        { status: 400 }
      )
    }

    const position = await prisma.recruitmentPosition.create({
      data: {
        positionName: positionName.trim(),
        hiringManager: hiringManager.trim(),
        hrPm: (hrPm || '').trim(),
      },
    })
    return NextResponse.json(position, { status: 201 })
  } catch {
    return NextResponse.json({ error: '포지션 등록 실패' }, { status: 500 })
  }
}
