"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ChevronDown, ChevronUp, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMoodCheckin } from "@/hooks/use-mood-checkin";
import { MoodType, MoodEntry } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── 이모지 매핑 ──────────────────────────────
const MOOD_EMOJI: Record<MoodType, string> = {
  great: "😁",
  good: "😊",
  okay: "😐",
  bad: "😟",
  terrible: "😢",
};

const MOOD_LABEL: Record<MoodType, string> = {
  great: "최고",
  good: "좋음",
  okay: "보통",
  bad: "별로",
  terrible: "최악",
};

const MOOD_COLOR: Record<MoodType, string> = {
  great: "bg-green-500",
  good: "bg-emerald-400",
  okay: "bg-yellow-400",
  bad: "bg-orange-400",
  terrible: "bg-red-500",
};

const MOOD_ORDER: MoodType[] = ["great", "good", "okay", "bad", "terrible"];

// ── 날짜 포맷 ──────────────────────────────
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

function getWeekdayShort(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

// ── 서브 컴포넌트: 기분 이모지 버튼 ──────────────────
function MoodButton({
  mood,
  selected,
  onClick,
}: {
  mood: MoodType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all",
        selected
          ? "bg-primary/10 ring-2 ring-primary scale-110"
          : "hover:bg-muted"
      )}
      aria-label={MOOD_LABEL[mood]}
    >
      <span className="text-2xl leading-none">{MOOD_EMOJI[mood]}</span>
      <span className={cn("text-[10px]", selected ? "text-primary font-semibold" : "text-muted-foreground")}>
        {MOOD_LABEL[mood]}
      </span>
    </button>
  );
}

// ── 서브 컴포넌트: 7일 기분 이력 ─────────────────────
function RecentMoodList({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        최근 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {entries.map((entry) => (
        <div
          key={entry.date}
          className="flex flex-col items-center gap-0.5 min-w-[36px]"
          title={entry.note || MOOD_LABEL[entry.mood]}
        >
          <span className="text-lg leading-none">{MOOD_EMOJI[entry.mood]}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDate(entry.date)}
          </span>
          <span className="text-[9px] text-muted-foreground/70">
            ({getWeekdayShort(entry.date)})
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 서브 컴포넌트: 30일 통계 바 ──────────────────────
function MoodStatsBar({
  stats,
  totalCount,
}: {
  stats: ReturnType<ReturnType<typeof useMoodCheckin>["getStats"]>;
  totalCount: number;
}) {
  if (totalCount === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-1">
        데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {stats.map(({ mood, count, ratio }) => (
        <div key={mood} className="flex items-center gap-2">
          <span className="text-sm w-5 text-center">{MOOD_EMOJI[mood]}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", MOOD_COLOR[mood])}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8 text-right">
            {count}일
          </span>
          <span className="text-[10px] text-muted-foreground w-7 text-right">
            {Math.round(ratio * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────
interface MoodCheckinCardProps {
  groupId: string;
  userId: string;
}

export function MoodCheckinCard({ groupId, userId }: MoodCheckinCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState("");
  const { pending: saving, execute: executeSave } = useAsyncAction();

  const { checkIn, getTodayMood, getRecentEntries, getStats } = useMoodCheckin(
    groupId,
    userId
  );

  const todayMood = getTodayMood();
  const recent7 = getRecentEntries(7);
  const stats = getStats();
  const totalCount30 = stats.reduce((sum, s) => sum + s.count, 0);

  // 카드 열릴 때 오늘 기분 초기값 설정
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && todayMood) {
      setSelectedMood(todayMood.mood);
      setNote(todayMood.note ?? "");
    }
    if (!next) {
      setSelectedMood(null);
      setNote("");
    }
  }

  async function handleSave() {
    if (!selectedMood) {
      toast.error("기분을 선택해주세요.");
      return;
    }
    await executeSave(async () => {
      checkIn(selectedMood, note);
      toast.success("기분이 저장되었습니다.");
      setOpen(false);
      setSelectedMood(null);
      setNote("");
    });
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">오늘의 기분</span>
              {todayMood && (
                <span className="text-base leading-none">
                  {MOOD_EMOJI[todayMood.mood]}
                </span>
              )}
              {!todayMood && (
                <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full">
                  미기록
                </span>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-3">
            {/* 오늘 체크인 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                지금 기분은 어때요?
              </p>
              <div className="flex justify-between">
                {MOOD_ORDER.map((mood) => (
                  <MoodButton
                    key={mood}
                    mood={mood}
                    selected={selectedMood === mood}
                    onClick={() => setSelectedMood(mood)}
                  />
                ))}
              </div>
            </div>

            {/* 한줄 메모 */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                한줄 메모 (선택)
              </p>
              <Input
                placeholder="오늘 하루 어땠나요?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                className="h-8 text-xs"
              />
            </div>

            {/* 저장 버튼 */}
            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleSave}
              disabled={saving || !selectedMood}
            >
              {saving ? "저장 중..." : "체크인 저장"}
            </Button>

            {/* 구분선 */}
            <div className="border-t pt-3 space-y-4">
              {/* 지난 7일 이력 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  지난 7일 기분
                </p>
                <RecentMoodList entries={recent7} />
              </div>

              {/* 30일 통계 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  최근 30일 통계
                </p>
                <MoodStatsBar stats={stats} totalCount={totalCount30} />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
