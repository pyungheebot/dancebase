"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import type { DressCodeGuideItem } from "@/types";
import { CATEGORY_LABELS, CATEGORY_COLORS, type GuideSectionProps } from "./types";

// ============================================================
// 가이드 아이템 (React.memo)
// ============================================================

interface GuideItemProps {
  guide: DressCodeGuideItem;
  memberNames: string[];
  memberStatuses: GuideSectionProps["memberStatuses"];
  onToggleMember: (memberName: string, itemId: string) => void;
  onEditGuide: (guide: DressCodeGuideItem) => void;
  onDeleteGuide: (guideId: string) => void;
}

const GuideItem = React.memo(function GuideItem({
  guide,
  memberNames,
  memberStatuses,
  onToggleMember,
  onEditGuide,
  onDeleteGuide,
}: GuideItemProps) {
  const readyCount = memberNames.filter((name) =>
    memberStatuses.some(
      (ms) => ms.memberName === name && ms.itemId === guide.id && ms.isReady
    )
  ).length;

  return (
    <li
      className="border rounded-md p-2.5 bg-muted/20 space-y-2"
      role="listitem"
    >
      {/* 가이드 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium">{guide.title}</span>
            {guide.isRequired && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 border-red-200 text-red-600 bg-red-50"
              >
                필수
              </Badge>
            )}
            {guide.colorCode && (
              <div className="flex items-center gap-1">
                {guide.colorCode.startsWith("#") ? (
                  <div
                    className="h-3 w-3 rounded-sm border border-border"
                    style={{ backgroundColor: guide.colorCode }}
                    role="img"
                    aria-label={`색상: ${guide.colorCode}`}
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {guide.colorCode}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {guide.description}
          </p>
          {guide.imageDescription && (
            <p className="text-[10px] text-blue-500 mt-0.5">
              참고: {guide.imageDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label="가이드 항목 편집/삭제">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEditGuide(guide)}
            aria-label={`${guide.title} 편집`}
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onDeleteGuide(guide.id)}
            aria-label={`${guide.title} 삭제`}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* 멤버 준비 현황 */}
      {memberNames.length > 0 && (
        <div className="border-t pt-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              멤버 준비 현황
            </span>
            <span
              className="text-[10px] text-muted-foreground"
              aria-live="polite"
              aria-label={`${memberNames.length}명 중 ${readyCount}명 준비 완료`}
            >
              {readyCount}/{memberNames.length}
            </span>
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={`${guide.title} 멤버 준비 상태`}
          >
            {memberNames.map((memberName) => {
              const isReady = memberStatuses.some(
                (ms) =>
                  ms.memberName === memberName &&
                  ms.itemId === guide.id &&
                  ms.isReady
              );
              return (
                <button
                  key={memberName}
                  onClick={() => onToggleMember(memberName, guide.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleMember(memberName, guide.id);
                    }
                  }}
                  aria-pressed={isReady}
                  aria-label={`${memberName} ${isReady ? "준비 완료" : "미준비"}`}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                    isReady
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {isReady ? (
                    <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" aria-hidden="true" />
                  )}
                  {memberName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
});

// ============================================================
// 카테고리별 가이드 섹션
// ============================================================

export const GuideSection = React.memo(function GuideSection({
  category,
  guides,
  memberNames,
  memberStatuses,
  onToggleMember,
  onEditGuide,
  onDeleteGuide,
}: GuideSectionProps) {
  if (guides.length === 0) return null;

  return (
    <section aria-label={`${CATEGORY_LABELS[category]} 가이드`} className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[category]}`}
        >
          {CATEGORY_LABELS[category]}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {guides.length}개 항목
        </span>
      </div>

      <ul className="space-y-2" role="list" aria-label={`${CATEGORY_LABELS[category]} 항목 목록`}>
        {guides.map((guide) => (
          <GuideItem
            key={guide.id}
            guide={guide}
            memberNames={memberNames}
            memberStatuses={memberStatuses}
            onToggleMember={onToggleMember}
            onEditGuide={onEditGuide}
            onDeleteGuide={onDeleteGuide}
          />
        ))}
      </ul>
    </section>
  );
});
