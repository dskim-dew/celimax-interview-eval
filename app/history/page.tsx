import { getReports } from '@/lib/db-storage'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  const reports = await getReports()
  return <HistoryClient initialReports={reports} />
}
