import { getReports } from '@/lib/db-storage'
import { EvaluationReport } from '@/lib/types'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  let reports: EvaluationReport[] = []
  try {
    reports = await getReports()
  } catch {
    // DB 연결 오류 시 빈 목록으로 폴백
  }
  return <HistoryClient initialReports={reports} />
}
