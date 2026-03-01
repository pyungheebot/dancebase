"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Wrench,
  Zap,
  Volume2,
  Users,
  HardHat,
  CloudRain,
  MoreHorizontal,
} from "lucide-react";
import type {
  StageRiskItem,
  StageRiskCategory,
  StageRiskResponseStatus,
} from "@/types";
import {
  ALL_RESPONSE_STATUSES,
  CATEGORY_BADGE_COLORS,
  CATEGORY_LABELS,
  LEVEL_COLORS,
  LEVEL_DOT_COLORS,
  LEVEL_LABELS,
  LEVEL_MATRIX_BG,
  RESPONSE_COLORS,
  RESPONSE_LABELS,
} from "./types";

// 카테고리 아이콘 (렌더 시점에 생성)
function CategoryIcon({ category }: { category: StageRiskCategory }) {
  const props = { className: "h-3 w-3", "aria-hidden": true as const };
  switch (category) {
    case "stage_structure":
      return <Wrench {...props} />;
    case "lighting_electric":
      return <Zap {...props} />;
    case "sound":
      return <Volume2 {...props} />;
    case "audience_safety":
      return <Users {...props} />;
    case "performer_safety":
      return <HardHat {...props} />;
    case "weather":
      return <CloudRain {...props} />;
    default:
      return <MoreHorizontal {...props} />;
  }
}

interface RiskItemRowProps {
  item: StageRiskItem;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: StageRiskResponseStatus) => void;
}

export const RiskItemRow = memo(function RiskItemRow({
  item,
  onEdit,
  onDelete,
  onChangeStatus,
}: RiskItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const mitigationRegionId = `risk-mitigation-${item.id}`;

  return (
    <div
      className={`rounded-md border overflow-hidden ${
        item.responseStatus === "done"
          ? "opacity-70 bg-muted/20 border-dashed"
          : "bg-background"
      }`}
      role="listitem"
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* 리스크 점수 뱃지 */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${LEVEL_MATRIX_BG[item.level]}`}
          aria-label={`리스크 점수 ${item.score}`}
          title={`리스크 점수: ${item.score}`}
        >
          {item.score}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* 제목 + 레벨 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium ${
                item.responseStatus === "done"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {item.title}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${LEVEL_COLORS[item.level]}`}
              aria-label={`등급: ${LEVEL_LABELS[item.level]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${LEVEL_DOT_COLORS[item.level]}`}
                aria-hidden="true"
              />
              {LEVEL_LABELS[item.level]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 flex-shrink-0 ${CATEGORY_BADGE_COLORS[item.category]}`}
              aria-label={`카테고리: ${CATEGORY_LABELS[item.category]}`}
            >
              <CategoryIcon category={item.category} />
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </div>

          {/* 점수 세부 + 대응 상태 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              가능성 {item.likelihood} × 영향도 {item.impact}
            </span>
            <Select
              value={item.responseStatus}
              onValueChange={(v) =>
                onChangeStatus(v as StageRiskResponseStatus)
              }
            >
              <SelectTrigger
                className={`h-5 text-[10px] px-1.5 py-0 border rounded-full w-auto gap-1 ${RESPONSE_COLORS[item.responseStatus]}`}
                aria-label="대응 상태 변경"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RESPONSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {RESPONSE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "대응 방안 숨기기" : "대응 방안 보기"}
            aria-expanded={expanded}
            aria-controls={mitigationRegionId}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label={`${item.title} 리스크 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${item.title} 리스크 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 대응 방안 영역 */}
      <div
        id={mitigationRegionId}
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        {expanded && (
          <div className="px-3 pb-2.5 pt-2 border-t bg-muted/10">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">
              대응 방안
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {item.mitigation || (
                <span className="text-muted-foreground italic">
                  대응 방안이 없습니다.
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
