import { notFound } from 'next/navigation'
import { getReportById } from '@/lib/db-storage'
import ReportDetailClient from '@/components/ReportDetailClient'

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const report = await getReportById(params.id)
  if (!report) notFound()
  return <ReportDetailClient report={report} />
}
