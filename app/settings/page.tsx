import { prisma } from '@/lib/db'
import SettingsClient from '@/components/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let positions: Array<{
    id: string
    positionName: string
    hiringManager: string
    hrPm: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }> = []

  try {
    positions = await prisma.recruitmentPosition.findMany({
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // DB 연결 오류 시 빈 목록
  }

  return (
    <SettingsClient
      initialPositions={positions.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  )
}
