import { prisma } from './db'
import { Prisma } from '@prisma/client'
import type { InterviewReport } from '@prisma/client'
import type {
  EvaluationReport,
  InterviewRound,
  ValuesEvaluation,
  CompetenciesEvaluation,
  ValueEvaluation,
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

// 레거시 'drop' → 'strong-no' 변환
function migrateFinalDecision(decision: string | undefined | null): InterviewerNotes['finalDecision'] {
  if (!decision) return undefined
  if (decision === 'drop') return 'strong-no'
  return decision as InterviewerNotes['finalDecision']
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateNotes(raw: any): InterviewerNotes {
  if (!raw) return { comment: '' }
  // 이전 형식: {strengths, concerns, validation, finalDecision}
  if (raw.comment === undefined && (raw.strengths !== undefined || raw.concerns !== undefined || raw.validation !== undefined)) {
    const parts = [raw.strengths, raw.concerns, raw.validation].filter(Boolean)
    return {
      comment: parts.join('\n'),
      finalDecision: migrateFinalDecision(raw.finalDecision),
    }
  }
  // 현재 형식: drop → strong-no 마이그레이션
  return {
    ...raw,
    finalDecision: migrateFinalDecision(raw.finalDecision),
  } as InterviewerNotes
}

// 새 가치관 5개 키 (altruistic, immersed 제외)
const VALID_VALUE_KEYS = ['honest', 'optimistic', 'proactive', 'growth', 'respect']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateEvalItem(v: any) {
  return {
    evidence: v.evidence ?? [],
    specificCase: v.specificCase ?? '',
    concerns: v.concerns ?? [],
    summary: v.summary ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateValues(raw: any): ValuesEvaluation {
  if (!raw) return {} as ValuesEvaluation
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (VALID_VALUE_KEYS.includes(key)) {
      result[key] = migrateEvalItem(val)
    }
  }
  return result as unknown as ValuesEvaluation
}

// 기존 values JSON에서 immersed 데이터를 immersion으로 추출
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImmersionFromValues(raw: any): ValueEvaluation | undefined {
  if (!raw?.immersed) return undefined
  return migrateEvalItem(raw.immersed) as ValueEvaluation
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCompetencies(raw: any): CompetenciesEvaluation {
  if (!raw) return {} as CompetenciesEvaluation
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    result[key] = migrateEvalItem(val)
  }
  return result as unknown as CompetenciesEvaluation
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateImmersion(raw: any): ValueEvaluation | undefined {
  if (!raw) return undefined
  return migrateEvalItem(raw) as ValueEvaluation
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
    immersion: record.immersion
      ? migrateImmersion(parseJson(record.immersion))
      : record.values
        ? extractImmersionFromValues(parseJson(record.values))
        : undefined,
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
    qnaData: report.qnaData ? (report.qnaData as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    values: report.values ? (report.values as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    competencies: report.competencies ? (report.competencies as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    immersion: report.immersion ? (report.immersion as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    overall: report.overall ? (report.overall as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    interviewerNotes: report.interviewerNotes as unknown as Prisma.InputJsonValue,
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
