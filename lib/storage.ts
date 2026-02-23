import { EvaluationReport } from './types';

const STORAGE_KEY = 'celimax-interview-reports';

// 모든 보고서 조회
export function getReports(): EvaluationReport[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 개별 보고서 조회
export function getReportById(id: string): EvaluationReport | null {
  const reports = getReports();
  return reports.find(report => report.id === id) || null;
}

// 보고서 저장
export function saveReport(report: EvaluationReport): void {
  const reports = getReports();
  const existingIndex = reports.findIndex(r => r.id === report.id);

  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.unshift(report); // 최신 보고서를 앞에 추가
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// 보고서 수정
export function updateReport(id: string, updates: Partial<EvaluationReport>): EvaluationReport | null {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === id);

  if (index < 0) return null;

  const updatedReport = {
    ...reports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updatedReport;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));

  return updatedReport;
}

// 보고서 삭제
export function deleteReport(id: string): boolean {
  const reports = getReports();
  const filtered = reports.filter(r => r.id !== id);

  if (filtered.length === reports.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 보고서 검색 (지원자명, 포지션, 면접관명으로 검색)
export function searchReports(query: string): EvaluationReport[] {
  const reports = getReports();
  const lowerQuery = query.toLowerCase();

  return reports.filter(report =>
    report.interviewInfo.candidateName.toLowerCase().includes(lowerQuery) ||
    report.interviewInfo.position.toLowerCase().includes(lowerQuery) ||
    report.interviewInfo.interviewerName.toLowerCase().includes(lowerQuery)
  );
}
