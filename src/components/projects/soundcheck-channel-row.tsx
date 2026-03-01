"use client";

/**
 * 사운드체크 채널 행 컴포넌트
 * 채널 하나를 카드 형태로 표시하며 체크/편집/삭제/순서 이동 기능을 제공합니다.
 * React.memo로 감싸 불필요한 리렌더링을 방지합니다.
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from "lucide-react";
import type { SoundcheckChannel } from "@/types";
import { CHANNEL_TYPE_LABELS, CHANNEL_TYPE_COLORS, formatPan } from "./soundcheck-sheet-types";

// ============================================================
// Props 타입
// ============================================================

type ChannelRowProps = {
  channel: SoundcheckChannel;
  /** 목록의 첫 번째 아이템 여부 (위로 이동 버튼 비활성화) */
  isFirst: boolean;
  /** 목록의 마지막 아이템 여부 (아래로 이동 버튼 비활성화) */
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export const ChannelRow = memo(function ChannelRow({
  channel,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ChannelRowProps) {
  return (
    <div
      role="listitem"
      className={`rounded-md border transition-colors p-2 ${
        channel.isChecked
          ? "bg-green-50 border-green-200"
          : "bg-card hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* 체크 버튼 */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
          aria-label={channel.isChecked ? "체크 해제" : "체크 완료"}
        >
          {channel.isChecked ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        {/* 채널 번호 뱃지 */}
        <div
          className="flex items-center justify-center w-5 h-5 rounded bg-cyan-100 text-[9px] font-bold text-cyan-700 flex-shrink-0 mt-0.5"
          aria-label={`채널 ${channel.channelNumber}번`}
        >
          {channel.channelNumber}
        </div>

        {/* 내용 영역 */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* 소스명 + 유형 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium ${
                channel.isChecked ? "line-through text-muted-foreground" : ""
              }`}
            >
              {channel.source}
            </span>
            <Badge
              className={`text-[9px] px-1 py-0 border ${CHANNEL_TYPE_COLORS[channel.type]}`}
            >
              {CHANNEL_TYPE_LABELS[channel.type]}
            </Badge>
          </div>

          {/* 볼륨 바 + 팬 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-1 min-w-[100px]">
              <span className="text-[9px] text-muted-foreground w-8 flex-shrink-0">
                VOL
              </span>
              {/* 볼륨 시각화 바 */}
              <div
                className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={channel.volume}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`볼륨 ${channel.volume}`}
              >
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all"
                  style={{ width: `${channel.volume}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground w-7 text-right flex-shrink-0">
                {channel.volume}
              </span>
            </div>
            {channel.pan !== undefined && (
              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                PAN: {formatPan(channel.pan)}
              </span>
            )}
          </div>

          {/* EQ 설정 + 채널 메모 */}
          {(channel.eq || channel.notes) && (
            <div className="flex flex-col gap-0.5">
              {channel.eq && (
                <span className="text-[9px] text-muted-foreground">
                  EQ: {channel.eq}
                </span>
              )}
              {channel.notes && (
                <span className="text-[9px] text-muted-foreground italic">
                  {channel.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="위로 이동"
          >
            <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="아래로 이동"
          >
            <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={onEdit}
            aria-label="채널 편집"
          >
            <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="채널 삭제"
          >
            <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
});
