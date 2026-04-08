import { prisma } from './db'
import { Prisma } from '@prisma/client'
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

// SQLite(String) / PostgreSQL(Json) 모두 호환
function parseJson<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'object') return value as T        // native Json column
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T } catch { return undefined }
  }
  return undefined
}

// 이전 형식 → 새 형식 마이그레이션
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateOverall(raw: any): OverallEvaluation {
  return {
    strengths: raw.strengths ?? [],
    risks: raw.risks ?? [],
    finalComment: raw.finalComment ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateNotes(raw: any): InterviewerNotes {
  if (!raw) return { comment: '' }
  // 이전 형식: {strengths, concerns, validation, finalDecision}
  // 새 형식: {comment, finalDecision}
  if (raw.comment !== undefined) return raw as InterviewerNotes
  const parts = [raw.strengths, raw.concerns, raw.validation].filter(Boolean)
  return {
    comment: parts.join('\n'),
    finalDecision: raw.finalDecision ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateValues(raw: any): ValuesEvaluation {
  if (!raw) return {} as ValuesEvaluation
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = val as any
    result[key] = {
      evidence: v.evidence ?? [],
      specificCase: v.specificCase ?? '',
      concerns: v.concerns ?? [],
      summary: v.summary ?? '',
    }
  }
  return result as unknown as ValuesEvaluation
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCompetencies(raw: any): CompetenciesEvaluation {
  if (!raw) return {} as CompetenciesEvaluation
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = val as any
    result[key] = {
      evidence: v.evidence ?? [],
      specificCase: v.specificCase ?? '',
      concerns: v.concerns ?? [],
      summary: v.summary ?? '',
    }
  }
  return result as unknown as CompetenciesEvaluation
}

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
    values: record.values ? migrateValues(parseJson(record.values)) : undefined,
    competencies: record.competencies ? migrateCompetencies(parseJson(record.competencies)) : undefined,
    overall: record.overall ? migrateOverall(parseJson(record.overall)) : undefined,
    interviewerNotes: migrateNotes(parseJson(record.interviewerNotes)),
    qnaData: parseJson<QnAData>(record.qnaData),
    ceoDecision: (record.ceoDecision as EvaluationReport['ceoDecision']) ?? null,
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
    qnaData: report.qnaData ? JSON.stringify(report.qnaData) : null,
    values: report.values ? JSON.stringify(report.values) : null,
    competencies: report.competencies ? JSON.stringify(report.competencies) : null,
    overall: report.overall ? JSON.stringify(report.overall) : null,
    interviewerNotes: JSON.stringify(report.interviewerNotes),
    ceoDecision: report.ceoDecision ?? null,
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
