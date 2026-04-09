import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT: 포지션 수정
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { positionName, hiringManager, hrPm, isActive } = body

    if (!positionName?.trim() || !hiringManager?.trim()) {
      return NextResponse.json(
        { error: '포지션명과 Hiring Manager는 필수입니다.' },
        { status: 400 }
      )
    }

    const position = await prisma.recruitmentPosition.update({
      where: { id },
      data: {
        positionName: positionName.trim(),
        hiringManager: hiringManager.trim(),
        hrPm: (hrPm || '').trim(),
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json(position)
  } catch {
    return NextResponse.json({ error: '포지션 수정 실패' }, { status: 500 })
  }
}

// DELETE: 포지션 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    await prisma.recruitmentPosition.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '포지션 삭제 실패' }, { status: 500 })
  }
}
