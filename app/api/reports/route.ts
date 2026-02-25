import { NextRequest, NextResponse } from 'next/server'
import { getReports, saveReport } from '@/lib/db-storage'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? undefined
  const position = searchParams.get('position') ?? undefined
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined

  try {
    const reports = await getReports({ q, position, startDate, endDate })
    return NextResponse.json(reports)
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: '보고서 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const saved = await saveReport(body)
    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json({ error: '보고서 저장에 실패했습니다.' }, { status: 500 })
  }
}
