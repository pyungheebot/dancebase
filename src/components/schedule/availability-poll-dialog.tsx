"use client";

import { useState, useMemo } from "react";
import { CalendarSearch, Users, Check, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAvailabilityPoll,
  type AvailabilityResponse,
  type SlotCount,
} from "@/hooks/use-availability-poll";
import { useAuth } from "@/hooks/use-auth";

// ============================================================
// 상수
// ============================================================

const TIME_SLOT_OPTIONS = ["오전 (09-12시)", "오후 (13-17시)", "저녁 (18-21시)"];
const TIME_SLOT_LABELS: Record<string, string> = {
  "오전 (09-12시)": "오전",
  "오후 (13-17시)": "오후",
  "저녁 (18-21시)": "저녁",
};

/** 히트맵 셀 배경색 */
function getHeatmapClass(count: number, max: number): string {
  if (count === 0) return "bg-white border border-gray-200";
  if (max === 0) return "bg-white border border-gray-200";
  const ratio = count / max;
  if (ratio >= 0.8) return "bg-green-600 text-white border border-green-700";
  if (ratio >= 0.5) return "bg-green-400 text-white border border-green-500";
  if (ratio >= 0.2) return "bg-green-200 text-green-800 border border-green-300";
  return "bg-green-50 text-green-700 border border-green-200";
}

// ============================================================
// Props
// ============================================================

type Mode = "create" | "respond" | "result";

type AvailabilityPollDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  /** 리더 여부 (생성/삭제 권한) */
  canEdit: boolean;
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function AvailabilityPollDialog({
  open,
  onOpenChange,
  groupId,
  canEdit,
}: AvailabilityPollDialogProps) {
  const auth = useAuth();
  const userId = auth.user?.id ?? "anonymous";
  const userName = auth.user?.user_metadata?.name ?? auth.user?.email ?? "익명";

  const {
    poll,
    createPoll,
    submitResponse,
    deletePoll,
    aggregateResults,
    getOptimalSlot,
    getMyResponse,
  } = useAvailabilityPoll(groupId);

  // 모드 결정: 투표가 없으면 create, 있으면 respond (결과 탭 토글)
  const [mode, setMode] = useState<Mode>(() => {
    if (poll) return "respond";
    return canEdit ? "create" : "respond";
  });

  // poll이 생길 때 모드 자동 전환
  const currentMode: Mode = poll ? mode : canEdit ? "create" : "respond";

  // ---- 생성 폼 상태 ----
  const [title, setTitle] = useState("가용 시간 조사");
  const [dateInputs, setDateInputs] = useState<string[]>([""]); // YYYY-MM-DD
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(TIME_SLOT_OPTIONS)
  );

  // ---- 응답 폼 상태 ----
  const [myAvailable, setMyAvailable] = useState<AvailabilityResponse>(() => {
    return getMyResponse(userId) ?? {};
  });

  // 집계 결과
  const slotCounts = useMemo(() => aggregateResults(), [aggregateResults]);
  const optimalSlot = useMemo(() => getOptimalSlot(), [getOptimalSlot]);
  const maxCount = useMemo(
    () => Math.max(...slotCounts.map((s) => s.count), 0),
    [slotCounts]
  );

  // ============================================================
  // 생성 핸들러
  // ============================================================

  function handleAddDate() {
    setDateInputs((prev) => [...prev, ""]);
  }

  function handleDateChange(idx: number, value: string) {
    setDateInputs((prev) => prev.map((d, i) => (i === idx ? value : d)));
  }

  function handleRemoveDate(idx: number) {
    setDateInputs((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleToggleSlot(slot: string) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  }

  function handleCreate() {
    const validDates = dateInputs
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.");
      return;
    }
    if (validDates.length === 0) {
      toast.error("날짜를 최소 1개 입력해 주세요. (형식: YYYY-MM-DD)");
      return;
    }
    if (selectedSlots.size === 0) {
      toast.error("시간대를 최소 1개 선택해 주세요.");
      return;
    }

    // 중복 제거 및 정렬
    const uniqueDates = Array.from(new Set(validDates)).sort();

    createPoll({
      title: title.trim(),
      dates: uniqueDates,
      timeSlots: TIME_SLOT_OPTIONS.filter((s) => selectedSlots.has(s)),
      createdBy: userId,
    });

    setMyAvailable({});
    setMode("respond");
    toast.success("투표가 생성되었습니다.");
  }

  // ============================================================
  // 응답 핸들러
  // ============================================================

  function handleToggleCell(key: string) {
    setMyAvailable((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmitResponse() {
    if (!poll) return;
    submitResponse({ userId, userName, available: myAvailable });
    setMode("result");
    toast.success("응답이 저장되었습니다.");
  }

  // ============================================================
  // 삭제 핸들러
  // ============================================================

  function handleDelete() {
    deletePoll();
    setTitle("가용 시간 조사");
    setDateInputs([""]);
    setSelectedSlots(new Set(TIME_SLOT_OPTIONS));
    setMyAvailable({});
    setMode(canEdit ? "create" : "respond");
    toast.success("투표가 삭제되었습니다.");
  }

  // ============================================================
  // 날짜 포맷 헬퍼
  // ============================================================

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dow = days[d.getDay()];
      return `${mm}/${dd}(${dow})`;
    } catch {
      return dateStr;
    }
  }

  // ============================================================
  // 렌더링 — 생성 모드
  // ============================================================

  function renderCreateMode() {
    return (
      <div className="space-y-4">
        {/* 제목 */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">제목</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 정기 연습 가용 시간 조사"
            className="h-8 text-xs"
          />
        </div>

        {/* 날짜 입력 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">후보 날짜</Label>
          <div className="space-y-1.5">
            {dateInputs.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={d}
                  onChange={(e) => handleDateChange(idx, e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                {dateInputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleRemoveDate(idx)}
                    aria-label="날짜 삭제"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 mt-1"
            onClick={handleAddDate}
          >
            <Plus className="h-3 w-3" />
            날짜 추가
          </Button>
        </div>

        {/* 시간대 선택 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">시간대</Label>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOT_OPTIONS.map((slot) => (
              <label
                key={slot}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Checkbox
                  checked={selectedSlots.has(slot)}
                  onCheckedChange={() => handleToggleSlot(slot)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{slot}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 렌더링 — 응답 모드
  // ============================================================

  function renderRespondMode() {
    if (!poll) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          가능한 시간대에 체크해 주세요. 응답 후 저장 버튼을 눌러야 반영됩니다.
        </p>

        {/* 체크박스 그리드 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground w-20 min-w-[80px]">
                  날짜
                </th>
                {poll.timeSlots.map((slot) => (
                  <th
                    key={slot}
                    className="text-center py-1.5 px-1 font-medium text-muted-foreground min-w-[60px]"
                  >
                    {TIME_SLOT_LABELS[slot] ?? slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poll.dates.map((date) => (
                <tr key={date} className="border-t border-gray-100">
                  <td className="py-2 pr-2 font-medium text-[11px]">
                    {formatDate(date)}
                  </td>
                  {poll.timeSlots.map((slot) => {
                    const key = `${date}_${slot}`;
                    return (
                      <td key={key} className="text-center py-2 px-1">
                        <Checkbox
                          checked={!!myAvailable[key]}
                          onCheckedChange={() => handleToggleCell(key)}
                          className="h-4 w-4"
                          aria-label={`${date} ${slot}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 현재 응답 인원 */}
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          현재 {poll.responses.length}명 응답
        </p>
      </div>
    );
  }

  // ============================================================
  // 렌더링 — 결과 모드
  // ============================================================

  function renderResultMode() {
    if (!poll) return null;
    return (
      <div className="space-y-3">
        {/* 최적 시간 배너 */}
        {optimalSlot && optimalSlot.count > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium">
              최적 시간:{" "}
              <span className="font-semibold">
                {formatDate(optimalSlot.date)}{" "}
                {TIME_SLOT_LABELS[optimalSlot.timeSlot] ?? optimalSlot.timeSlot}
              </span>{" "}
              ({optimalSlot.count}명 가능)
            </span>
          </div>
        )}

        {/* 히트맵 그리드 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground w-20 min-w-[80px]">
                  날짜
                </th>
                {poll.timeSlots.map((slot) => (
                  <th
                    key={slot}
                    className="text-center py-1.5 px-1 font-medium text-muted-foreground min-w-[60px]"
                  >
                    {TIME_SLOT_LABELS[slot] ?? slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poll.dates.map((date) => (
                <tr key={date} className="border-t border-gray-100">
                  <td className="py-2 pr-2 font-medium text-[11px]">
                    {formatDate(date)}
                  </td>
                  {poll.timeSlots.map((slot) => {
                    const key = `${date}_${slot}`;
                    const slotData: SlotCount | undefined = slotCounts.find(
                      (s) => s.dateTimeKey === key
                    );
                    const count = slotData?.count ?? 0;
                    const isOptimal =
                      optimalSlot?.dateTimeKey === key && count > 0;

                    return (
                      <td key={key} className="text-center py-2 px-1">
                        <div
                          className={[
                            "rounded-md mx-auto flex items-center justify-center",
                            "w-12 h-8 text-[11px] font-medium transition-colors",
                            getHeatmapClass(count, maxCount),
                            isOptimal ? "ring-2 ring-green-600 ring-offset-1" : "",
                          ].join(" ")}
                          title={`${formatDate(date)} ${slot}: ${count}명`}
                        >
                          {count}명
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">인원:</span>
          {[
            { label: "0명", cls: "bg-white border border-gray-200" },
            { label: "소수", cls: "bg-green-50 border border-green-200" },
            { label: "중간", cls: "bg-green-200 border border-green-300" },
            { label: "다수", cls: "bg-green-400 border border-green-500" },
            { label: "최다", cls: "bg-green-600 border border-green-700" },
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              <span
                className={`inline-block w-3 h-3 rounded-sm ${item.cls}`}
              />
              {item.label}
            </span>
          ))}
        </div>

        {/* 응답자 수 */}
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          총 {poll.responses.length}명 응답
        </p>
      </div>
    );
  }

  // ============================================================
  // 전체 렌더링
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CalendarSearch className="h-4 w-4 text-muted-foreground" />
            <DialogTitle className="text-sm">
              {poll ? poll.title : "가용 시간 수집"}
            </DialogTitle>
            {poll && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 ml-auto"
              >
                {poll.responses.length}명 참여
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* 탭 (투표 있을 때만) */}
        {poll && (
          <div className="flex gap-1 border-b pb-2">
            <button
              onClick={() => {
                setMyAvailable(getMyResponse(userId) ?? {});
                setMode("respond");
              }}
              className={[
                "text-xs px-2.5 py-1 rounded-md transition-colors",
                currentMode === "respond"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              내 응답
            </button>
            <button
              onClick={() => setMode("result")}
              className={[
                "text-xs px-2.5 py-1 rounded-md transition-colors",
                currentMode === "result"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              전체 결과
            </button>
            {canEdit && (
              <button
                onClick={() => setMode("create")}
                className={[
                  "text-xs px-2.5 py-1 rounded-md transition-colors",
                  currentMode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                설정 변경
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="py-1">
          {currentMode === "create" && renderCreateMode()}
          {currentMode === "respond" && renderRespondMode()}
          {currentMode === "result" && renderResultMode()}
        </div>

        {/* 푸터 */}
        <DialogFooter className="flex items-center gap-2 pt-2">
          {/* 삭제 (리더만) */}
          {poll && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive mr-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              투표 삭제
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>

          {currentMode === "create" && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleCreate}
            >
              <CalendarSearch className="h-3 w-3" />
              투표 생성
            </Button>
          )}

          {currentMode === "respond" && poll && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleSubmitResponse}
            >
              <Check className="h-3 w-3" />
              응답 저장
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
