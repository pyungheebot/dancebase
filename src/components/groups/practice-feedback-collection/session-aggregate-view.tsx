"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StarRating } from "./star-rating";
import { CategoryBar } from "./category-bar";
import { CATEGORY_KEYS } from "./types";
import type { PracticeFeedbackAggregate } from "@/types";

type SessionAggregateViewProps = {
  aggregate: PracticeFeedbackAggregate;
};

export function SessionAggregateView({ aggregate }: SessionAggregateViewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const toggleId = `aggregate-details-${aggregate.sessionId}`;

  return (
    <div className="bg-muted/20 rounded-md px-2.5 py-2 space-y-2.5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(aggregate.averageOverall)} size="xs" />
            <span className="text-[10px] font-semibold text-yellow-600">
              {aggregate.averageOverall > 0
                ? aggregate.averageOverall.toFixed(1)
                : "-"}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">
            <span aria-label={`${aggregate.totalResponses}명 참여`}>
              {aggregate.totalResponses}명 참여
            </span>
          </p>
        </div>
      </div>

      {/* 카테고리별 평균 */}
      <dl className="space-y-1">
        {CATEGORY_KEYS.map((key) => (
          <div key={key} className="contents">
            <CategoryBar
              categoryKey={key}
              value={aggregate.averageCategories[key]}
            />
          </div>
        ))}
      </dl>

      {/* 좋았던 점 / 개선할 점 토글 */}
      {(aggregate.goodPointsList.length > 0 ||
        aggregate.improvementsList.length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
            aria-expanded={showDetails}
            aria-controls={toggleId}
          >
            {showDetails ? "의견 접기" : "의견 보기"}
            {showDetails ? (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            )}
          </button>

          {showDetails && (
            <div id={toggleId} className="mt-1.5 space-y-2" aria-live="polite">
              {aggregate.goodPointsList.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-green-700 mb-0.5">
                    좋았던 점
                  </p>
                  <ul className="space-y-0.5" role="list">
                    {aggregate.goodPointsList.map((text, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground leading-relaxed pl-2 border-l-2 border-green-200"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aggregate.improvementsList.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-orange-700 mb-0.5">
                    개선할 점
                  </p>
                  <ul className="space-y-0.5" role="list">
                    {aggregate.improvementsList.map((text, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground leading-relaxed pl-2 border-l-2 border-orange-200"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
