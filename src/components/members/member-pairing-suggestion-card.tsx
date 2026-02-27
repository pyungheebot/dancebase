"use client";

import { useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemberPairingSuggestion } from "@/hooks/use-member-pairing-suggestion";
import type { MemberPairingSuggestion } from "@/types";

// ============================================
// 호환도 색상 유틸
// ============================================

function getCompatibilityColor(score: number): {
  bar: string;
  badge: string;
  label: string;
} {
  if (score >= 80) {
    return {
      bar: "bg-green-500",
      badge: "bg-green-100 text-green-700 border-green-200",
      label: "매우 높음",
    };
  }
  if (score >= 60) {
    return {
      bar: "bg-blue-500",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      label: "높음",
    };
  }
  return {
    bar: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    label: "보통",
  };
}

// ============================================
// 개별 추천 쌍 행
// ============================================

function PairRow({
  suggestion,
  rank,
}: {
  suggestion: MemberPairingSuggestion;
  rank: number;
}) {
  const { member1, member2, compatibilityScore, reason } = suggestion;
  const color = getCompatibilityColor(compatibilityScore);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
      {/* 랭크 + 멤버 이름 + 호환도 배지 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground w-4 shrink-0">
            #{rank}
          </span>
          <span className="text-xs font-medium truncate">{member1.displayName}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">↔</span>
          <span className="text-xs font-medium truncate">{member2.displayName}</span>
        </div>
        <Badge
          className={`text-[10px] px-1.5 py-0 shrink-0 border ${color.badge}`}
          variant="outline"
        >
          {compatibilityScore}점 · {color.label}
        </Badge>
      </div>

      {/* 호환도 바 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color.bar}`}
            style={{ width: `${compatibilityScore}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
          {compatibilityScore}%
        </span>
      </div>

      {/* 이유 + 출석률 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground truncate">{reason}</span>
        <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
          {member1.attendanceRate}% / {member2.attendanceRate}%
        </span>
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function MemberPairingSuggestionCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { suggestions, loading, generatePairings } = useMemberPairingSuggestion(groupId);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generatePairings();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">멤버 짝 추천</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200" variant="outline">
                데이터 기반
              </Badge>
              {open ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleGenerate}
            disabled={generating || loading}
          >
            <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
            새로 추천
          </Button>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div className="p-4">
            {loading ? (
              // 로딩 스켈레톤
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              // 데이터 없음
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  추천 결과가 없습니다.
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  멤버가 2명 이상이고 출석 데이터가 있어야 추천이 가능합니다.
                </p>
              </div>
            ) : (
              // 추천 목록
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion, index) => (
                  <PairRow
                    key={`${suggestion.member1.userId}-${suggestion.member2.userId}`}
                    suggestion={suggestion}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}

            {/* 하단 안내 */}
            {!loading && suggestions.length > 0 && (
              <p className="mt-3 text-[10px] text-muted-foreground text-center">
                최근 90일 출석 패턴 기반 · 상위 {suggestions.length}쌍
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
