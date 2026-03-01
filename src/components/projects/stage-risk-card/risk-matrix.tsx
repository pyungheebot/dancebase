"use client";

import type { StageRiskItem } from "@/types";
import {
  ALL_LEVELS,
  LEVEL_LABELS,
  LEVEL_DOT_COLORS,
  LEVEL_MATRIX_BG,
  calcRiskLevel,
} from "./types";

interface RiskMatrixProps {
  items: StageRiskItem[];
}

export function RiskMatrix({ items }: RiskMatrixProps) {
  function getItemsAt(likelihood: number, impact: number): StageRiskItem[] {
    return items.filter(
      (i) => i.likelihood === likelihood && i.impact === impact
    );
  }

  return (
    <div className="space-y-1.5" role="img" aria-label="리스크 매트릭스 차트">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          리스크 매트릭스
        </span>
        <div
          className="flex items-center gap-2"
          role="list"
          aria-label="리스크 등급 범례"
        >
          {ALL_LEVELS.map((level) => (
            <span
              key={level}
              role="listitem"
              className="flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              <span
                className={`w-2 h-2 rounded-sm ${LEVEL_DOT_COLORS[level]}`}
                aria-hidden="true"
              />
              {LEVEL_LABELS[level]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1">
        {/* Y축 레이블 (영향도) */}
        <div
          className="flex flex-col justify-between py-4 pr-1 w-8"
          aria-label="영향도 (Y축)"
        >
          {[5, 4, 3, 2, 1].map((val) => (
            <span
              key={val}
              className="text-[9px] text-muted-foreground text-right leading-none"
              aria-label={`영향도 ${val}`}
            >
              {val}
            </span>
          ))}
        </div>

        <div className="flex-1 space-y-0.5">
          {/* 그리드 행: 영향도 높을수록 위 */}
          {[5, 4, 3, 2, 1].map((impact) => (
            <div key={impact} className="grid grid-cols-5 gap-0.5" role="row">
              {[1, 2, 3, 4, 5].map((likelihood) => {
                const cellItems = getItemsAt(likelihood, impact);
                const cellLevel = calcRiskLevel(likelihood * impact);
                const score = likelihood * impact;
                const cellLabel =
                  cellItems.length > 0
                    ? `가능성 ${likelihood}, 영향도 ${impact}: ${cellItems.map((i) => i.title).join(", ")}`
                    : `가능성 ${likelihood}, 영향도 ${impact}, 점수 ${score}`;
                return (
                  <div
                    key={likelihood}
                    role="gridcell"
                    aria-label={cellLabel}
                    className={`h-8 rounded-sm flex items-center justify-center text-[10px] font-medium transition-colors ${LEVEL_MATRIX_BG[cellLevel]} ${cellItems.length > 0 ? "ring-1 ring-inset ring-black/20" : "opacity-60"}`}
                    title={
                      cellItems.length > 0
                        ? cellItems.map((i) => i.title).join(", ")
                        : `점수: ${score}`
                    }
                  >
                    {cellItems.length > 0 ? (
                      <span className="font-bold">{cellItems.length}</span>
                    ) : (
                      <span className="opacity-40 text-[9px]">{score}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* X축 레이블 (발생 가능성) */}
          <div
            className="grid grid-cols-5 gap-0.5 pt-0.5"
            aria-label="발생 가능성 (X축)"
          >
            {[1, 2, 3, 4, 5].map((val) => (
              <span
                key={val}
                className="text-[9px] text-muted-foreground text-center"
                aria-label={`가능성 ${val}`}
              >
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-9">
        <span>가능성 낮음</span>
        <span className="font-medium">발생 가능성 (X축)</span>
        <span>가능성 높음</span>
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        영향도 (Y축)
      </div>
    </div>
  );
}
