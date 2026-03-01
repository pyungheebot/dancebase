"use client";

// ============================================
// dance-networking-card.tsx
// 댄스 네트워킹 연락처 메인 컨테이너
// ============================================

import { useState, useCallback } from "react";
import {
  Users,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  BookUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDanceNetworking } from "@/hooks/use-dance-networking";
import type { DanceNetworkingEntry, DanceNetworkingRole } from "@/types";

// 분리된 서브 컴포넌트
import { ContactForm } from "./dance-networking/contact-form";
import { NetworkingEntryCard } from "./dance-networking/networking-entry-card";
import { NetworkingStatsBar } from "./dance-networking/networking-stats-bar";
import { NetworkingFilterBar } from "./dance-networking/networking-filter-bar";
import {
  makeEmptyForm,
  entryToForm,
  type NetworkingFormState,
} from "./dance-networking/types";

// ============================================
// 메인 컴포넌트
// ============================================

export function DanceNetworkingCard({ memberId }: { memberId: string }) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    toggleFavorite,
    deleteEntry,
    stats,
  } = useDanceNetworking(memberId);

  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceNetworkingEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<DanceNetworkingRole | "all">("all");
  const [filterFavorite, setFilterFavorite] = useState(false);

  // ---- 필터링 ----
  const filtered = entries.filter((e) => {
    if (filterFavorite && !e.isFavorite) return false;
    if (filterRole !== "all" && e.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hit =
        e.name.toLowerCase().includes(q) ||
        (e.affiliation?.toLowerCase().includes(q) ?? false) ||
        e.genres.some((g) => g.toLowerCase().includes(q)) ||
        (e.notes?.toLowerCase().includes(q) ?? false);
      if (!hit) return false;
    }
    return true;
  });

  // ---- 핸들러 ----
  const handleAdd = useCallback(
    (form: NetworkingFormState) => {
      addEntry({
        name: form.name,
        affiliation: form.affiliation || undefined,
        genres: form.genres,
        phone: form.phone || undefined,
        email: form.email || undefined,
        snsAccounts: form.snsAccounts,
        metAt: form.metAt || undefined,
        metDate: form.metDate || undefined,
        role: form.role,
        notes: form.notes || undefined,
      });
      toast.success(`${form.name}님의 연락처를 추가했습니다.`);
      setShowForm(false);
    },
    [addEntry]
  );

  const handleEdit = useCallback(
    (form: NetworkingFormState) => {
      if (!editTarget) return;
      updateEntry(editTarget.id, {
        name: form.name,
        affiliation: form.affiliation || undefined,
        genres: form.genres,
        phone: form.phone || undefined,
        email: form.email || undefined,
        snsAccounts: form.snsAccounts,
        metAt: form.metAt || undefined,
        metDate: form.metDate || undefined,
        role: form.role,
        notes: form.notes || undefined,
      });
      toast.success(TOAST.MEMBERS.NETWORKING_CONTACT_UPDATED);
      setEditTarget(null);
    },
    [editTarget, updateEntry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      deleteEntry(id);
      toast.success(`${entry.name}님의 연락처를 삭제했습니다.`);
    },
    [entries, deleteEntry]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      toggleFavorite(id);
      toast.success(
        entry.isFavorite ? "즐겨찾기를 해제했습니다." : "즐겨찾기에 추가했습니다."
      );
    },
    [entries, toggleFavorite]
  );

  const handleRoleFilterClick = useCallback(
    (role: DanceNetworkingRole) => {
      setFilterRole((prev) => (prev === role ? "all" : role));
    },
    []
  );

  // ============================================
  // 렌더
  // ============================================

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <BookUser className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-800" id="networking-card-title">
              댄스 네트워킹 연락처
            </span>
            <Badge
              className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0"
              aria-label={`총 ${stats.total}명`}
            >
              {stats.total}명
            </Badge>
            {stats.favorites > 0 && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-0"
                aria-label={`즐겨찾기 ${stats.favorites}명`}
              >
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" aria-hidden="true" />
                {stats.favorites}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showForm && !editTarget && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setShowForm(true)}
                aria-label="새 연락처 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                추가
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label={isOpen ? "섹션 접기" : "섹션 펼치기"}
                aria-expanded={isOpen}
                aria-controls="networking-card-content"
              >
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent id="networking-card-content">
          <div className="p-4 space-y-3">
            {/* 추가 폼 */}
            {showForm && (
              <div
                className="border rounded-lg p-3 bg-blue-50/40 space-y-1"
                role="region"
                aria-label="새 연락처 추가 폼"
              >
                <p className="text-xs font-semibold text-blue-700">새 연락처 추가</p>
                <ContactForm
                  formId="add-form"
                  initial={makeEmptyForm()}
                  onSubmit={handleAdd}
                  onCancel={() => setShowForm(false)}
                  submitLabel="추가"
                />
              </div>
            )}

            {/* 수정 폼 */}
            {editTarget && (
              <div
                className="border rounded-lg p-3 bg-orange-50/40 space-y-1"
                role="region"
                aria-label={`${editTarget.name} 연락처 수정 폼`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-orange-700">
                    연락처 수정: {editTarget.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400"
                    onClick={() => setEditTarget(null)}
                    aria-label="수정 취소"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
                <ContactForm
                  formId={`edit-form-${editTarget.id}`}
                  initial={entryToForm(editTarget)}
                  onSubmit={handleEdit}
                  onCancel={() => setEditTarget(null)}
                  submitLabel="저장"
                />
              </div>
            )}

            {/* 검색 + 필터 */}
            {entries.length > 0 && (
              <NetworkingFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterRole={filterRole}
                onFilterRoleChange={setFilterRole}
                filterFavorite={filterFavorite}
                onFilterFavoriteToggle={() => setFilterFavorite((prev) => !prev)}
              />
            )}

            {/* 통계 배지 바 */}
            {entries.length > 0 && (
              <NetworkingStatsBar
                roleCount={stats.roleCount}
                activeRole={filterRole}
                onRoleClick={handleRoleFilterClick}
              />
            )}

            {/* 목록 */}
            {loading ? (
              <div
                className="flex justify-center py-6"
                role="status"
                aria-live="polite"
                aria-label="연락처 불러오는 중"
              >
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2"
                role="status"
                aria-live="polite"
              >
                <Users className="h-8 w-8 opacity-30" aria-hidden="true" />
                {entries.length === 0 ? (
                  <>
                    <p className="text-xs">아직 등록된 연락처가 없습니다.</p>
                    <p className="text-[10px] text-gray-300">
                      댄스 씬에서 만난 사람들을 추가해보세요!
                    </p>
                  </>
                ) : (
                  <p className="text-xs">검색 결과가 없습니다.</p>
                )}
              </div>
            ) : (
              <div
                className="space-y-2"
                role="list"
                aria-label={`연락처 목록 (${filtered.length}명)`}
                aria-live="polite"
              >
                {filtered.map((entry) => (
                  <div role="listitem" key={entry.id}>
                    <NetworkingEntryCard
                      entry={entry}
                      onEdit={(e) => {
                        setShowForm(false);
                        setEditTarget(e);
                      }}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 결과 카운트 */}
            {filtered.length > 0 && entries.length !== filtered.length && (
              <p
                className="text-[10px] text-gray-400 text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                전체 {entries.length}명 중 {filtered.length}명 표시
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
