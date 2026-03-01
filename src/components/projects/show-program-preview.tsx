"use client";

import type { ShowProgramPiece } from "@/types";
import { useShowProgram } from "@/hooks/use-show-program";
import { CREDIT_ROLE_LABELS } from "./show-program-rows";

// ============================================================
// 미리보기 컴포넌트
// ============================================================

export function ProgramPreview({
  entry,
  sortedPieces,
}: {
  entry: ReturnType<typeof useShowProgram>["entry"];
  sortedPieces: ShowProgramPiece[];
}) {
  return (
    <div className="space-y-4 py-2">
      {/* 공연 제목 */}
      <div className="text-center space-y-0.5 border-b pb-3">
        {entry.showTitle ? (
          <>
            <h2 className="text-base font-bold">{entry.showTitle}</h2>
            {entry.showSubtitle && (
              <p className="text-xs text-muted-foreground">
                {entry.showSubtitle}
              </p>
            )}
            <div className="flex justify-center gap-3 mt-1">
              {entry.showDate && (
                <span className="text-[10px] text-muted-foreground">
                  {entry.showDate}
                </span>
              )}
              {entry.venue && (
                <span className="text-[10px] text-muted-foreground">
                  {entry.venue}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            공연 정보가 없습니다. 편집 버튼을 눌러 입력해보세요.
          </p>
        )}
      </div>

      {/* 인사말 */}
      {entry.greeting && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            인사말
          </p>
          <p className="text-xs whitespace-pre-wrap leading-relaxed">
            {entry.greeting}
          </p>
        </div>
      )}

      {/* 프로그램 순서 */}
      {sortedPieces.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Program
          </p>
          <div className="space-y-2">
            {sortedPieces.map((piece) => (
              <div
                key={piece.id}
                className="flex gap-3 py-1.5 border-b border-dashed last:border-0"
              >
                <span className="text-[10px] font-bold text-violet-600 w-5 flex-shrink-0 pt-0.5">
                  {piece.order}.
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold">
                    {piece.title}
                    {piece.subtitle && (
                      <span className="font-normal text-muted-foreground ml-1">
                        — {piece.subtitle}
                      </span>
                    )}
                  </p>
                  {piece.choreographer && (
                    <p className="text-[10px] text-muted-foreground">
                      안무: {piece.choreographer}
                    </p>
                  )}
                  {piece.performers.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      출연: {piece.performers.join(", ")}
                    </p>
                  )}
                  {piece.duration && (
                    <p className="text-[10px] text-muted-foreground">
                      {piece.duration}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 크레딧 */}
      {entry.credits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Credits
          </p>
          <div className="space-y-1">
            {entry.credits.map((credit) => {
              const label =
                credit.role === "other"
                  ? (credit.roleLabel ?? "기타")
                  : CREDIT_ROLE_LABELS[credit.role];
              return (
                <div key={credit.id} className="flex gap-2 text-[10px]">
                  <span className="text-muted-foreground w-20 flex-shrink-0 text-right">
                    {label}
                  </span>
                  <span>{credit.names.join(", ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 스폰서 */}
      {entry.sponsors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Sponsors
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="text-[10px] px-2 py-0.5 rounded-full border bg-green-50 border-green-200 text-green-800"
              >
                {sponsor.name}
                {sponsor.tier && (
                  <span className="text-green-600 ml-1">({sponsor.tier})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 특별 감사 */}
      {entry.specialThanks && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Special Thanks
          </p>
          <p className="text-xs whitespace-pre-wrap text-muted-foreground">
            {entry.specialThanks}
          </p>
        </div>
      )}

      {/* 마무리 인사 */}
      {entry.closingMessage && (
        <div className="border-t pt-3 text-center">
          <p className="text-xs italic text-muted-foreground">
            {entry.closingMessage}
          </p>
        </div>
      )}
    </div>
  );
}
