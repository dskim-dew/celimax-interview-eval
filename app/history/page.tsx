'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderOpen, Loader2, ArrowLeft } from 'lucide-react';
import ReportList from '@/components/ReportList';
import { EvaluationReport } from '@/lib/types';
import { getReports, deleteReport, searchReports } from '@/lib/storage';

export default function HistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setReports(getReports());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (searchQuery.trim()) {
      setReports(searchReports(searchQuery));
    } else {
      setReports(getReports());
    }
  }, [searchQuery, isLoaded]);

  const handleDelete = (id: string) => {
    deleteReport(id);
    if (searchQuery.trim()) {
      setReports(searchReports(searchQuery));
    } else {
      setReports(getReports());
    }
  };

  const handleLoad = (report: EvaluationReport) => {
    // 메인 페이지로 이동하여 보고서 표시
    router.push(`/report/${report.id}`);
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">저장된 보고서</h1>
              <p className="text-sm text-slate-400">총 {getReports().length}개의 보고서</p>
            </div>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="지원자, 포지션, 면접관 검색..."
            className="w-full sm:w-72 pl-10 pr-4 py-2.5 glass-input text-sm"
          />
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-slate-400">
          &quot;{searchQuery}&quot; 검색 결과: {reports.length}건
        </p>
      )}

      {/* 보고서 목록 */}
      <div className="glass-card p-4">
        <ReportList reports={reports} onDelete={handleDelete} onLoad={handleLoad} />
      </div>
    </div>
  );
}
