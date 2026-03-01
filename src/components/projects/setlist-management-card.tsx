"use client";

import { useState } from "react";
import {
  useSetlistManagement,
  formatDuration,
  parseDuration,
} from "@/hooks/use-setlist-management";
import type { SetlistItemType, PerformanceSetlistItem } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListMusic,
  Plus,
  Trash2,
  Clock,
  Shirt,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

// ============================================
// 타입 아이콘 및 레이블
// ============================================

const ITEM_TYPE_META: Record<
  SetlistItemType,
  { label: string; icon: string; badgeClass: string }
> = {
  performance: {
    label: "공연",
    icon: "🎵",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  mc: {
    label: "MC",
    icon: "🎤",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  break: {
    label: "휴식",
    icon: "☕",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  costume_change: {
    label: "의상변경",
    icon: "👗",
    badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
  },
};

// ============================================
// 항목 추가 폼 기본값
// ============================================

const DEFAULT_FORM = {
  type: "performance" as SetlistItemType,
  title: "",
  durationMinutes: "5",
  durationSeconds: "00",
  performers: "",
  costumeChange: false,
  note: "",
};

// ============================================
// 단일 세트리스트 항목 행
// ============================================

function SetlistItemRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  item: PerformanceSetlistItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const meta = ITEM_TYPE_META[item.type];

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-gray-100 bg-card hover:bg-muted/30 transition-colors">
      {/* 순서 번호 */}
      <span className="w-5 text-center text-xs font-medium text-gray-400 shrink-0">
        {item.order}
      </span>

      {/* 타입 아이콘 */}
      <span className="text-base shrink-0">{meta.icon}</span>

      {/* 타입 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 shrink-0 ${meta.badgeClass}`}
      >
        {meta.label}
      </Badge>

      {/* 제목 */}
      <span className="flex-1 text-xs font-medium text-gray-800 truncate">
        {item.title || "(제목 없음)"}
      </span>

      {/* 의상 변경 아이콘 */}
      {item.costumeChange && (
        <span title="의상 변경" className="shrink-0">
          <Shirt className="h-3 w-3 text-pink-500" />
        </span>
      )}

      {/* 참여자 */}
      {item.performers.length > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
          <Users className="h-2.5 w-2.5" />
          {item.performers.length}
        </span>
      )}

      {/* 시간 */}
      <span className="flex items-center gap-0.5 text-[10px] text-gray-500 shrink-0">
        <Clock className="h-2.5 w-2.5" />
        {formatDuration(item.durationSeconds)}
      </span>

      {/* 순서 변경 버튼 */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0"
          disabled={isFirst}
          onClick={() => onMoveUp(item.id)}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0"
          disabled={isLast}
          onClick={() => onMoveDown(item.id)}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function SetlistManagementCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const {
    data,
    items,
    totalDurationFormatted,
    totalSeconds,
    costumeChangeCount,
    updateEventInfo,
    addItem,
    removeItem,
    moveUp,
    moveDown,
  } = useSetlistManagement(groupId, projectId);

  // 이벤트 정보 편집 시 기본값 세팅
  const handleEditEventOpen = () => {
    setEventName(data.eventName);
    setEventDate(data.eventDate);
    setEditingEvent(true);
  };

  const handleEventSave = () => {
    if (!eventName.trim()) {
      toast.error(TOAST.SETLIST_MGMT.SHOW_NAME_REQUIRED);
      return;
    }
    updateEventInfo(eventName.trim(), eventDate);
    setEditingEvent(false);
    toast.success(TOAST.SETLIST_MGMT.SHOW_INFO_SAVED);
  };

  // 항목 추가
  const handleAddItem = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.SETLIST_MGMT.ITEM_TITLE_REQUIRED);
      return;
    }

    const durationSeconds =
      parseDuration(`${form.durationMinutes}:${form.durationSeconds}`);

    const performers = form.performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    addItem({
      type: form.type,
      title: form.title.trim(),
      durationSeconds,
      costumeChange: form.costumeChange,
      performers,
      note: form.note.trim(),
    });

    toast.success(TOAST.SETLIST_MGMT.ITEM_ADDED);
    setForm(DEFAULT_FORM);
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    toast.success(TOAST.SETLIST_MGMT.ITEM_DELETED);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none">
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-800">
                공연 세트리스트
              </span>
              {items.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {items.length}곡
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalSeconds > 0 && (
                <span className="text-xs text-gray-500">
                  {totalDurationFormatted}
                </span>
              )}
              {open ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* 공연 정보 */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {editingEvent ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">공연 이름</Label>
                    <Input
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="공연 이름 입력"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">공연 날짜</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleEventSave}
                    >
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setEditingEvent(false)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {data.eventName || "(공연 이름 미설정)"}
                    </p>
                    {data.eventDate && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {data.eventDate}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-gray-400"
                    onClick={handleEditEventOpen}
                  >
                    수정
                  </Button>
                </div>
              )}
            </div>

            {/* 항목 목록 */}
            {items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <SetlistItemRow
                    key={item.id}
                    item={item}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400">
                세트리스트 항목이 없습니다.
                <br />
                아래 버튼으로 항목을 추가하세요.
              </div>
            )}

            {/* 항목 추가 폼 */}
            {showForm && (
              <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                <p className="text-xs font-medium text-gray-700">항목 추가</p>

                {/* 타입 선택 */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">타입</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, type: val as SetlistItemType }))
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(ITEM_TYPE_META) as [
                          SetlistItemType,
                          { label: string; icon: string; badgeClass: string },
                        ][]
                      ).map(([type, meta]) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {meta.icon} {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 제목 */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">제목 *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="곡명 또는 항목명"
                    className="h-7 text-xs"
                  />
                </div>

                {/* 예상 시간 */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">예상 시간</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={form.durationMinutes}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          durationMinutes: e.target.value,
                        }))
                      }
                      className="h-7 text-xs w-16 text-center"
                      placeholder="분"
                    />
                    <span className="text-xs text-gray-500">분</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={form.durationSeconds}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          durationSeconds: e.target.value.padStart(2, "0"),
                        }))
                      }
                      className="h-7 text-xs w-16 text-center"
                      placeholder="초"
                    />
                    <span className="text-xs text-gray-500">초</span>
                  </div>
                </div>

                {/* 참여자 */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    참여 멤버 (쉼표로 구분)
                  </Label>
                  <Input
                    value={form.performers}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, performers: e.target.value }))
                    }
                    placeholder="홍길동, 김철수, ..."
                    className="h-7 text-xs"
                  />
                </div>

                {/* 의상 변경 */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="costumeChange"
                    checked={form.costumeChange}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        costumeChange: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="costumeChange" className="text-xs text-gray-600 cursor-pointer">
                    의상 변경 있음
                  </Label>
                </div>

                {/* 메모 */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">메모</Label>
                  <Input
                    value={form.note}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, note: e.target.value }))
                    }
                    placeholder="특이사항 메모"
                    className="h-7 text-xs"
                  />
                </div>

                {/* 폼 버튼 */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={handleAddItem}
                  >
                    추가
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setForm(DEFAULT_FORM);
                      setShowForm(false);
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}

            {/* 항목 추가 버튼 */}
            {!showForm && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full border-dashed"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                항목 추가
              </Button>
            )}

            {/* 통계 */}
            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400">총 항목</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {items.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400">총 시간</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {totalDurationFormatted}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400">의상 변경</p>
                  <p className="text-sm font-semibold text-pink-600">
                    {costumeChangeCount}회
                  </p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
