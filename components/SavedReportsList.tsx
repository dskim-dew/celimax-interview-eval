'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import ReportList from './ReportList';
import { EvaluationReport } from '@/lib/types';
import { getReports, deleteReport, searchReports } from '@/lib/storage';

interface SavedReportsListProps {
  isOpen: boolean;
  onToggle: () => void;
  onLoad: (report: EvaluationReport) => void;
  refreshTrigger?: number;
}

export default function SavedReportsList({ isOpen, onToggle, onLoad, refreshTrigger }: SavedReportsListProps) {
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const loadReports = useCallback(() => {
    const allReports = getReports();
    setTotalCount(allReports.length);

    if (searchQuery.trim()) {
      setReports(searchReports(searchQuery));
    } else {
      setReports(allReports);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadReports();
  }, [loadReports, refreshTrigger]);

  const handleDelete = (id: string) => {
    deleteReport(id);
    loadReports();
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* 토글 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">저장된 보고서</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {totalCount}개
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* 펼쳐진 내용 */}
      {isOpen && (
        <div className="border-t border-white/10">
          {/* 검색 바 */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="지원자, 포지션, 면접관 검색..."
                className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-slate-400">
                &quot;{searchQuery}&quot; 검색 결과: {reports.length}건
              </p>
            )}
          </div>

          {/* 보고서 목록 */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <ReportList
              reports={reports}
              onDelete={handleDelete}
              onLoad={onLoad}
            />
          </div>
        </div>
      )}
    </div>
  );
}
