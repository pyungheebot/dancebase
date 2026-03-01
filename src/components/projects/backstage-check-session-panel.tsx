"use client";

// ============================================================
// 백스테이지 체크 세션 패널 컴포넌트
// - 세션별 헤더(펼침/접힘), 진행률 바, 카테고리별 항목 목록, 완료 버튼
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Trash2,
  Speaker,
  Lightbulb,
  Shirt,
  Package,
  Shield,
  Radio,
  HelpCircle,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { BackstageCategory, BackstageCheckSession } from "@/types";
import { CheckItemRow } from "./backstage-check-item-row";
import {
  ORDERED_CATEGORIES,
  categoryLabel,
  categoryIconColor,
  progressBadgeClass,
} from "./backstage-check-types";

// ── 카테고리 아이콘 컴포넌트 ──
function CategoryIcon({
  category,
  className,
}: {
  category: BackstageCategory;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (category) {
    case "sound":
      return <Speaker className={cls} aria-hidden="true" />;
    case "lighting":
      return <Lightbulb className={cls} aria-hidden="true" />;
    case "costume":
      return <Shirt className={cls} aria-hidden="true" />;
    case "props":
      return <Package className={cls} aria-hidden="true" />;
    case "safety":
      return <Shield className={cls} aria-hidden="true" />;
    case "communication":
      return <Radio className={cls} aria-hidden="true" />;
    case "other":
      return <HelpCircle className={cls} aria-hidden="true" />;
  }
}

// ── 세션 패널 Props ──
interface SessionPanelProps {
  session: BackstageCheckSession;
  memberNames: string[];
  onDeleteSession: (sessionId: string) => void;
  onAddItem: (sessionId: string) => void;
  onToggleCheck: (sessionId: string, itemId: string, checkedBy: string) => void;
  onRemoveItem: (sessionId: string, itemId: string) => void;
  onCompleteSession: (sessionId: string) => boolean;
}

/**
 * 세션 패널
 * - 헤더 클릭으로 펼침/접힘 토글
 * - 카테고리별로 체크 항목 그룹화
 * - 전체 체크 완료 시 세션 완료 처리
 */
export function SessionPanel({
  session,
  memberNames,
  onDeleteSession,
  onAddItem,
  onToggleCheck,
  onRemoveItem,
  onCompleteSession,
}: SessionPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isCompleted = !!session.completedAt;
  const totalItems = session.items.length;
  const checkedItems = session.items.filter((i) => i.checked).length;
  const progressPct =
    totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);
  const allChecked = totalItems > 0 && checkedItems === totalItems;

  // 카테고리별 항목 그룹화
  const grouped: Partial<Record<BackstageCategory, typeof session.items>> = {};
  for (const item of session.items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  }

  const handleDelete = () => {
    onDeleteSession(session.id);
    toast.success(TOAST.SESSION.DELETED);
  };

  const handleComplete = () => {
    const ok = onCompleteSession(session.id);
    if (ok) {
      toast.success(TOAST.BACKSTAGE_CHECK.SESSION_COMPLETED);
    } else {
      toast.error(TOAST.BACKSTAGE_CHECK.ALL_CHECK_REQUIRED);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* ── 세션 헤더 ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/20 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        aria-expanded={expanded}
        aria-label={`${session.eventName} 세션 ${expanded ? "접기" : "펼치기"}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        {/* 펼침/접힘 아이콘 */}
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        )}

        {/* 세션 이름 + 날짜 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">
              {session.eventName}
            </span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {session.eventDate}
            </span>
            {/* 완료 배지 */}
            {isCompleted && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100 flex-shrink-0"
              >
                <CheckCheck className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                완료
              </Badge>
            )}
          </div>
        </div>

        {/* 진행률 배지 + 삭제 버튼 (클릭 전파 차단) */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {totalItems > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${progressBadgeClass(progressPct)}`}
              aria-label={`진행률 ${checkedItems}/${totalItems}`}
            >
              {checkedItems}/{totalItems}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            aria-label={`${session.eventName} 세션 삭제`}
            title="세션 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ── 세션 바디 ── */}
      {expanded && (
        <div className="px-3 py-2.5 space-y-3 bg-card">
          {/* 진행률 바 */}
          {totalItems > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  체크 진행률
                </span>
                <span className="text-[10px] font-medium">{progressPct}%</span>
              </div>
              <div
                className="relative h-2 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="체크 진행률"
              >
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                    progressPct >= 100 ? "bg-green-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 항목 없음 안내 */}
          {totalItems === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <ClipboardList className="h-6 w-6 mx-auto mb-1 opacity-30" aria-hidden="true" />
              <p className="text-[11px]">등록된 체크 항목이 없습니다.</p>
            </div>
          )}

          {/* 카테고리별 항목 목록 */}
          {totalItems > 0 && (
            <div className="space-y-2.5">
              {ORDERED_CATEGORIES.map((cat) => {
                const items = grouped[cat];
                if (!items || items.length === 0) return null;
                const catChecked = items.filter((i) => i.checked).length;

                return (
                  <div key={cat} className="space-y-1">
                    {/* 카테고리 헤더 */}
                    <div className="flex items-center gap-1.5">
                      <span className={categoryIconColor(cat)} aria-hidden="true">
                        <CategoryIcon category={cat} className="h-3 w-3" />
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {categoryLabel(cat)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({catChecked}/{items.length})
                      </span>
                    </div>

                    {/* 항목 목록 */}
                    <div
                      role="list"
                      aria-label={`${categoryLabel(cat)} 체크 목록`}
                      className="space-y-1 pl-4"
                    >
                      {items.map((item) => (
                        <CheckItemRow
                          key={item.id}
                          item={item}
                          memberNames={memberNames}
                          isCompleted={isCompleted}
                          onToggle={(itemId) => {
                            // 멤버 1명이면 자동으로 해당 멤버 이름 사용
                            const checker =
                              memberNames.length === 1
                                ? memberNames[0]
                                : "담당자";
                            onToggleCheck(session.id, itemId, checker);
                          }}
                          onRemove={(itemId) =>
                            onRemoveItem(session.id, itemId)
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 하단 버튼 (완료된 세션에서는 숨김) */}
          {!isCompleted && (
            <div className="flex gap-1.5 pt-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => onAddItem(session.id)}
                aria-label="체크 항목 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                항목 추가
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!allChecked}
                onClick={handleComplete}
                aria-label={
                  allChecked
                    ? "세션 완료 처리"
                    : "모든 항목을 체크해야 완료할 수 있습니다"
                }
                title={
                  allChecked
                    ? "세션 완료"
                    : "모든 항목을 체크해야 완료할 수 있습니다"
                }
              >
                <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                완료
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 세션 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="세션 삭제"
        description={`"${session.eventName}" 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
