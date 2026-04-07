import { NextRequest, NextResponse } from 'next/server'
import { getReports, saveReport } from '@/lib/db-storage'

const isDev = process.env.NODE_ENV !== 'production'

function errorResponse(message: string, error: unknown, status: number) {
  console.error(`${message}:`, error)
  return NextResponse.json(
    { error: message, ...(isDev && { detail: String(error) }) },
    { status }
  )
}

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
    return errorResponse('보고서 목록 조회에 실패했습니다.', error, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const saved = await saveReport(body)
    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    return errorResponse('보고서 저장에 실패했습니다.', error, 500)
  }
}
