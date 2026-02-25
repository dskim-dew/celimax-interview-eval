'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FolderOpen, ArrowLeft, SlidersHorizontal, X, Briefcase, CalendarRange } from 'lucide-react';
import ReportList from '@/components/ReportList';
import { EvaluationReport } from '@/lib/types';

interface HistoryClientProps {
  initialReports: EvaluationReport[];
}

export default function HistoryClient({ initialReports }: HistoryClientProps) {
  const [allReports, setAllReports] = useState<EvaluationReport[]>(initialReports);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 포지션 목록 (중복 제거)
  const positionOptions = useMemo(() => {
    const positions = allReports.map(r => r.interviewInfo.position).filter(Boolean);
    return Array.from(new Set(positions)).sort();
  }, [allReports]);

  // 필터 적용
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const { candidateName, position, interviewerName, interviewDate } = report.interviewInfo;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          candidateName.toLowerCase().includes(q) ||
          position.toLowerCase().includes(q) ||
          interviewerName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (positionFilter && position !== positionFilter) return false;

      if (startDate && interviewDate < startDate) return false;
      if (endDate && interviewDate > endDate) return false;

      return true;
    });
  }, [allReports, searchQuery, positionFilter, startDate, endDate]);

  const isFiltered = searchQuery || positionFilter || startDate || endDate;

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setAllReports(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setPositionFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">저장된 보고서</h1>
            <p className="text-sm text-slate-400">
              {isFiltered
                ? `검색 결과 ${filteredReports.length}건 / 전체 ${allReports.length}건`
                : `전체 ${allReports.length}건`}
            </p>
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="glass-card overflow-hidden">
        {/* 필터 헤더 */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-white/5">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-slate-200">검색 및 필터</span>
          {isFiltered && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-xs text-purple-300">필터 적용 중</span>
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* 입력 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 텍스트 검색 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                지원자 · 면접관
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색"
                  className="w-full px-3 py-2 glass-input text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 포지션 필터 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                포지션
              </label>
              <div className="relative">
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 glass-input text-sm bg-slate-800/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">전체 포지션</option>
                  {positionOptions.map(pos => (
                    <option key={pos} value={pos} className="bg-slate-800">{pos}</option>
                  ))}
                </select>
                {positionFilter && (
                  <button
                    onClick={() => setPositionFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 날짜 범위 */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                면접일 범위
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 glass-input text-sm"
                />
                <span className="text-slate-500 text-sm shrink-0">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 glass-input text-sm"
                />
              </div>
            </div>
          </div>

          {/* 활성 필터 칩 */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
              <span className="text-xs text-slate-500 mr-1">적용됨:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-full border border-purple-500/25">
                  &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {positionFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-full border border-blue-500/25">
                  <Briefcase className="w-3 h-3" />
                  {positionFilter}
                  <button onClick={() => setPositionFilter('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-600/30 text-slate-300 text-xs rounded-full border border-slate-500/25">
                  <CalendarRange className="w-3 h-3" />
                  {startDate || '시작'} — {endDate || '종료'}
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={handleReset}
                className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                전체 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 보고서 목록 */}
      <div className="glass-card p-4">
        <ReportList reports={filteredReports} onDelete={handleDelete} />
      </div>
    </div>
  );
}
