'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Briefcase,
  UserCheck,
  Users,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Position {
  id: string;
  positionName: string;
  hiringManager: string;
  hrPm: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SettingsClientProps {
  initialPositions: Position[];
}

const EMPTY_FORM = { positionName: '', hiringManager: '', hrPm: '' };

export default function SettingsClient({ initialPositions }: SettingsClientProps) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);

  // 신규 등록 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // 수정 중인 행
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // 삭제 확인
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- 등록 ---
  const handleAdd = async () => {
    if (!newForm.positionName.trim() || !newForm.hiringManager.trim()) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setPositions(prev => [created, ...prev]);
      setNewForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch {
      alert('등록에 실패했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  // --- 수정 ---
  const startEdit = (pos: Position) => {
    setEditingId(pos.id);
    setEditForm({
      positionName: pos.positionName,
      hiringManager: pos.hiringManager,
      hrPm: pos.hrPm,
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.positionName.trim() || !editForm.hiringManager.trim()) return;
    try {
      const res = await fetch(`/api/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPositions(prev => prev.map(p => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch {
      alert('수정에 실패했습니다.');
    }
  };

  // --- 활성/비활성 토글 ---
  const toggleActive = async (pos: Position) => {
    try {
      const res = await fetch(`/api/positions/${pos.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionName: pos.positionName,
          hiringManager: pos.hiringManager,
          hrPm: pos.hrPm,
          isActive: !pos.isActive,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPositions(prev => prev.map(p => (p.id === pos.id ? updated : p)));
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  // --- 삭제 ---
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/positions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPositions(prev => prev.filter(p => p.id !== id));
      setDeletingId(null);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const activeCount = positions.filter(p => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 glass-button rounded-lg text-white hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-deep to-brand-dark">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">채용 포지션 관리</h1>
              <p className="text-sm text-slate-400">
                채용 중인 포지션 {activeCount}개 / 전체 {positions.length}개
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setNewForm(EMPTY_FORM);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-deep hover:bg-brand-deep/80 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          포지션 추가
        </button>
      </div>

      {/* 신규 등록 폼 */}
      {showAddForm && (
        <div className="glass-card p-5 animate-fadeIn border-brand-mid/30">
          <h3 className="text-sm font-semibold text-brand-light mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 포지션 등록
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                포지션명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newForm.positionName}
                onChange={e => setNewForm(f => ({ ...f, positionName: e.target.value }))}
                placeholder="예: 백엔드 개발자"
                className="w-full px-3 py-2 glass-input text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Hiring Manager <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newForm.hiringManager}
                onChange={e => setNewForm(f => ({ ...f, hiringManager: e.target.value }))}
                placeholder="예: 김철수"
                className="w-full px-3 py-2 glass-input text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                HR PM
              </label>
              <input
                type="text"
                value={newForm.hrPm}
                onChange={e => setNewForm(f => ({ ...f, hrPm: e.target.value }))}
                placeholder="예: 이영희"
                className="w-full px-3 py-2 glass-input text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={addLoading || !newForm.positionName.trim() || !newForm.hiringManager.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-deep hover:bg-brand-deep/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              {addLoading ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* 포지션 테이블 */}
      <div className="glass-card overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_80px_100px] gap-4 px-5 py-3 border-b border-white/10 bg-white/5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" /> 포지션명
          </span>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Hiring Manager
          </span>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> HR PM
          </span>
          <span className="text-xs font-semibold text-slate-400 text-center">상태</span>
          <span className="text-xs font-semibold text-slate-400 text-center">관리</span>
        </div>

        {/* 빈 상태 */}
        {positions.length === 0 && (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">등록된 포지션이 없습니다</p>
            <p className="text-slate-500 text-sm">위의 &quot;포지션 추가&quot; 버튼으로 등록해주세요</p>
          </div>
        )}

        {/* 포지션 행 */}
        {positions.map(pos => (
          <div
            key={pos.id}
            className={`border-b border-white/5 last:border-b-0 transition-colors ${
              !pos.isActive ? 'opacity-50' : ''
            } ${deletingId === pos.id ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
          >
            {/* 삭제 확인 */}
            {deletingId === pos.id ? (
              <div className="px-5 py-4 flex items-center justify-between animate-fadeIn">
                <p className="text-sm text-red-400">
                  <strong>&quot;{pos.positionName}&quot;</strong> 포지션을 삭제하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleDelete(pos.id)}
                    className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : editingId === pos.id ? (
              /* 수정 모드 */
              <div className="px-5 py-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_80px_100px] gap-3 items-center">
                  <input
                    type="text"
                    value={editForm.positionName}
                    onChange={e => setEditForm(f => ({ ...f, positionName: e.target.value }))}
                    className="px-3 py-1.5 glass-input text-sm"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editForm.hiringManager}
                    onChange={e => setEditForm(f => ({ ...f, hiringManager: e.target.value }))}
                    className="px-3 py-1.5 glass-input text-sm"
                  />
                  <input
                    type="text"
                    value={editForm.hrPm}
                    onChange={e => setEditForm(f => ({ ...f, hrPm: e.target.value }))}
                    className="px-3 py-1.5 glass-input text-sm"
                  />
                  <div />
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                      title="취소"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdate(pos.id)}
                      disabled={!editForm.positionName.trim() || !editForm.hiringManager.trim()}
                      className="p-1.5 text-brand-light hover:text-white disabled:opacity-40 transition-colors"
                      title="저장"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 읽기 모드 */
              <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_80px_100px] gap-3 items-center">
                <div>
                  <span className="sm:hidden text-xs text-slate-500 mr-1">포지션:</span>
                  <span className="text-sm font-medium text-white">{pos.positionName}</span>
                </div>
                <div>
                  <span className="sm:hidden text-xs text-slate-500 mr-1">HM:</span>
                  <span className="text-sm text-slate-300">{pos.hiringManager}</span>
                </div>
                <div>
                  <span className="sm:hidden text-xs text-slate-500 mr-1">HR:</span>
                  <span className="text-sm text-slate-300">{pos.hrPm || '-'}</span>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleActive(pos)}
                    className="transition-colors"
                    title={pos.isActive ? '활성 (클릭하여 비활성화)' : '비활성 (클릭하여 활성화)'}
                  >
                    {pos.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                </div>
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => startEdit(pos)}
                    className="p-1.5 text-slate-400 hover:text-brand-light transition-colors rounded-lg hover:bg-white/10"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(pos.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
