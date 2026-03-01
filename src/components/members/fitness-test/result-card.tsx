"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestCategory, ResultCardProps } from "./types";

/**
 * 결과 탭 - 개별 측정 결과 카드
 * React.memo로 감싸 불필요한 리렌더링을 방지합니다.
 */
export const ResultCard = React.memo(function ResultCard({
  result,
  testItems,
  onDelete,
}: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const resultId = `result-${result.id}`;
  const detailsId = `result-details-${result.id}`;

  // 카테고리별 그룹화
  const byCategory = FITNESS_CATEGORY_ORDER.reduce<
    Record<FitnessTestCategory, typeof result.testItems>
  >(
    (acc, cat) => {
      acc[cat] = result.testItems.filter((ti) => ti.category === cat);
      return acc;
    },
    {
      flexibility: [],
      endurance: [],
      strength: [],
      balance: [],
      agility: [],
      rhythm: [],
    }
  );

  function getMax(cat: FitnessTestCategory): number {
    const vals = result.testItems
      .filter((ti) => ti.category === cat)
      .map((ti) => ti.value);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }

  function handleToggle() {
    setExpanded((prev) => !prev);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  function handleDeleteKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDelete();
    }
  }

  return (
    <div
      role="listitem"
      className="rounded-md border bg-background overflow-hidden"
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={detailsId}
        id={resultId}
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold">{result.memberName}</p>
            <time
              dateTime={result.date}
              className="text-[10px] text-muted-foreground"
            >
              {result.date}
            </time>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {result.testItems.length}개 항목
            </Badge>
            {result.overallScore !== undefined && (
              <Badge className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 border-rose-300">
                총점 {result.overallScore}
              </Badge>
            )}
          </div>
          {/* 카테고리 미니 바 */}
          <div
            className="flex gap-1 mt-1.5 flex-wrap"
            aria-hidden="true"
          >
            {FITNESS_CATEGORY_ORDER.map((cat) => {
              const catItems = byCategory[cat];
              if (catItems.length === 0) return null;
              const colors = FITNESS_CATEGORY_COLORS[cat];
              const avg =
                catItems.reduce((sum, ti) => sum + ti.value, 0) / catItems.length;
              const barPct = Math.min(100, Math.max(4, (avg / Math.max(getMax(cat), 1)) * 100));
              return (
                <div key={cat} className="flex items-center gap-1">
                  <span className={`text-[9px] ${colors.text}`}>
                    {FITNESS_CATEGORY_LABELS[cat].slice(0, 2)}
                  </span>
                  <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`${result.memberName}님 ${result.date} 결과 삭제`}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              handleDeleteKeyDown(e);
            }}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </div>

      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-labelledby={resultId}
          aria-live="polite"
          className="border-t px-3 py-2 space-y-3 bg-muted/20"
        >
          {/* 카테고리별 항목 상세 */}
          {FITNESS_CATEGORY_ORDER.map((cat) => {
            const catItems = byCategory[cat];
            if (catItems.length === 0) return null;
            const colors = FITNESS_CATEGORY_COLORS[cat];
            const maxVal = getMax(cat);
            return (
              <div key={cat} className="space-y-1.5">
                <Badge className={`text-[10px] px-1.5 py-0 border ${colors.badge}`}>
                  {FITNESS_CATEGORY_LABELS[cat]}
                </Badge>
                <dl className="space-y-1.5 ml-1">
                  {catItems.map((ti) => {
                    const itemDef = testItems.find((it) => it.name === ti.itemName);
                    const unit = itemDef?.unit ?? "";
                    const barPct = Math.min(
                      100,
                      Math.max(4, (ti.value / Math.max(maxVal, 1)) * 100)
                    );
                    return (
                      <div key={ti.itemName} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <dt className="text-[11px] text-muted-foreground">
                            {ti.itemName}
                          </dt>
                          <dd className="text-[11px] font-semibold">
                            {ti.value}
                            {unit && (
                              <span className="font-normal text-muted-foreground ml-0.5">
                                {unit}
                              </span>
                            )}
                          </dd>
                        </div>
                        <div
                          className="w-full h-1.5 rounded-full bg-muted overflow-hidden"
                          role="meter"
                          aria-valuenow={barPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${ti.itemName} 상대값`}
                        >
                          <div
                            className={`h-full rounded-full ${colors.bar} transition-all`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          })}

          {result.notes && (
            <div className="rounded-md bg-background border px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                메모
              </p>
              <p className="text-xs text-muted-foreground">{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
