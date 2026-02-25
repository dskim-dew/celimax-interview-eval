import { Prisma } from '@prisma/client'
import { prisma } from './db'
import type { InterviewReport } from '@prisma/client'
import type {
  EvaluationReport,
  InterviewRound,
  ValuesEvaluation,
  CompetenciesEvaluation,
  OverallEvaluation,
  InterviewerNotes,
  QnAData,
} from './types'

function fromDbRecord(record: InterviewReport): EvaluationReport {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    interviewInfo: {
      candidateName: record.candidateName,
      position: record.position,
      interviewDate: record.interviewDate,
      interviewRound: (record.interviewRound as InterviewRound) || '기타',
      interviewerName: record.interviewerName,
      reportAuthor: record.reportAuthor,
      tiroScript: record.tiroScript,
      transcript: record.transcript ?? undefined,
    },
    values: record.values as unknown as ValuesEvaluation,
    competencies: record.competencies as unknown as CompetenciesEvaluation,
    overall: record.overall as unknown as OverallEvaluation,
    interviewerNotes: (record.interviewerNotes as unknown as InterviewerNotes) ?? {
      strengths: '',
      concerns: '',
      validation: '',
    },
    qnaData: record.qnaData ? (record.qnaData as unknown as QnAData) : undefined,
  }
}

function toDbInput(report: EvaluationReport) {
  return {
    id: report.id,
    candidateName: report.interviewInfo.candidateName,
    position: report.interviewInfo.position,
    interviewDate: report.interviewInfo.interviewDate,
    interviewRound: report.interviewInfo.interviewRound ?? null,
    interviewerName: report.interviewInfo.interviewerName,
    reportAuthor: report.interviewInfo.reportAuthor ?? '',
    tiroScript: report.interviewInfo.tiroScript,
    transcript: report.interviewInfo.transcript ?? null,
    qnaData: report.qnaData ? (report.qnaData as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    values: report.values as unknown as Prisma.InputJsonValue,
    competencies: report.competencies as unknown as Prisma.InputJsonValue,
    overall: report.overall as unknown as Prisma.InputJsonValue,
    interviewerNotes: report.interviewerNotes as unknown as Prisma.InputJsonValue,
  }
}

export interface SearchOptions {
  q?: string
  position?: string
  startDate?: string
  endDate?: string
}

export async function getReports(options: SearchOptions = {}): Promise<EvaluationReport[]> {
  const where: Prisma.InterviewReportWhereInput = {}

  if (options.q) {
    where.OR = [
      { candidateName: { contains: options.q } },
      { position: { contains: options.q } },
      { interviewerName: { contains: options.q } },
    ]
  }
  if (options.position) {
    where.position = options.position
  }
  if (options.startDate || options.endDate) {
    where.interviewDate = {}
    if (options.startDate) where.interviewDate.gte = options.startDate
    if (options.endDate) where.interviewDate.lte = options.endDate
  }

  const records = await prisma.interviewReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return records.map(fromDbRecord)
}

export async function getReportById(id: string): Promise<EvaluationReport | null> {
  const record = await prisma.interviewReport.findUnique({ where: { id } })
  return record ? fromDbRecord(record) : null
}

export async function saveReport(report: EvaluationReport): Promise<EvaluationReport> {
  const data = toDbInput(report)
  const record = await prisma.interviewReport.upsert({
    where: { id: report.id },
    create: data,
    update: data,
  })
  return fromDbRecord(record)
}

export async function updateReport(
  id: string,
  updates: Partial<EvaluationReport>
): Promise<EvaluationReport | null> {
  const existing = await prisma.interviewReport.findUnique({ where: { id } })
  if (!existing) return null

  const current = fromDbRecord(existing)
  const merged: EvaluationReport = { ...current, ...updates }
  const data = toDbInput(merged)

  const record = await prisma.interviewReport.update({
    where: { id },
    data,
  })
  return fromDbRecord(record)
}

export async function deleteReport(id: string): Promise<boolean> {
  try {
    await prisma.interviewReport.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}
