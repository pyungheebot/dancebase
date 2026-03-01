"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { MemberMatrixProps } from "./types";

export const MemberMatrix = React.memo(function MemberMatrix({
  set,
  memberNames,
  onToggleMember,
}: MemberMatrixProps) {
  if (memberNames.length === 0 || set.guides.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">
        멤버별 준비 현황 매트릭스
      </h4>
      <div className="overflow-x-auto" role="region" aria-label="멤버별 준비 현황 매트릭스">
        <table className="min-w-full text-[10px]" role="table">
          <thead>
            <tr>
              <th
                scope="col"
                className="text-left py-1 pr-2 text-muted-foreground font-medium sticky left-0 bg-background"
              >
                멤버
              </th>
              {set.guides.map((guide) => (
                <th
                  key={guide.id}
                  scope="col"
                  className="text-center py-1 px-1 text-muted-foreground font-medium min-w-[48px]"
                  title={guide.title}
                >
                  <div className="truncate max-w-[48px]">{guide.title}</div>
                </th>
              ))}
              <th
                scope="col"
                className="text-center py-1 px-2 text-muted-foreground font-medium"
              >
                준비율
              </th>
            </tr>
          </thead>
          <tbody>
            {memberNames.map((memberName) => {
              const readyCount = set.guides.filter((guide) =>
                set.memberStatuses.some(
                  (ms) =>
                    ms.memberName === memberName &&
                    ms.itemId === guide.id &&
                    ms.isReady
                )
              ).length;
              const percentage = Math.round(
                (readyCount / set.guides.length) * 100
              );

              return (
                <tr key={memberName} className="border-t border-border/50">
                  <td
                    scope="row"
                    className="py-1.5 pr-2 font-medium sticky left-0 bg-background"
                  >
                    {memberName}
                  </td>
                  {set.guides.map((guide) => {
                    const isReady = set.memberStatuses.some(
                      (ms) =>
                        ms.memberName === memberName &&
                        ms.itemId === guide.id &&
                        ms.isReady
                    );
                    return (
                      <td key={guide.id} className="text-center py-1.5 px-1">
                        <button
                          onClick={() => onToggleMember(memberName, guide.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onToggleMember(memberName, guide.id);
                            }
                          }}
                          aria-pressed={isReady}
                          aria-label={`${memberName} - ${guide.title}: ${isReady ? "준비 완료" : "미준비"}`}
                          className="mx-auto flex items-center justify-center"
                        >
                          {isReady ? (
                            <CheckCircle2
                              className="h-3.5 w-3.5 text-green-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="h-3.5 w-3.5 text-muted-foreground/40"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 px-2">
                    <meter
                      min={0}
                      max={100}
                      value={percentage}
                      aria-label={`${memberName} 준비율`}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`font-medium ${
                        percentage === 100
                          ? "text-green-600"
                          : percentage >= 50
                            ? "text-yellow-600"
                            : "text-red-500"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
