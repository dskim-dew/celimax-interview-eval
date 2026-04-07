import { NextRequest, NextResponse } from 'next/server'
import { getReportById, updateReport, deleteReport } from '@/lib/db-storage'

const isDev = process.env.NODE_ENV !== 'production'

function errorResponse(message: string, error: unknown, status: number) {
  console.error(`${message}:`, error)
  return NextResponse.json(
    { error: message, ...(isDev && { detail: String(error) }) },
    { status }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await getReportById(params.id)
    if (!report) {
      return NextResponse.json({ error: '보고서를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json(report)
  } catch (error) {
    return errorResponse('보고서 조회에 실패했습니다.', error, 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const updated = await updateReport(params.id, updates)
    if (!updated) {
      return NextResponse.json({ error: '보고서를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    return errorResponse('보고서 수정에 실패했습니다.', error, 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteReport(params.id)
    if (!deleted) {
      return NextResponse.json({ error: '보고서를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('보고서 삭제에 실패했습니다.', error, 500)
  }
}
