"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,

  User,

} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAttendanceExcuse,
  EXCUSE_TYPE_LABELS,
  EXCUSE_TYPE_COLORS,
  EXCUSE_REASON_LABELS,
  EXCUSE_STATUS_LABELS,
  EXCUSE_STATUS_COLORS,
  ALL_EXCUSE_TYPES,
  ALL_EXCUSE_REASONS,
  ALL_EXCUSE_STATUSES,
} from "@/hooks/use-attendance-excuse";
import type {
  AttendanceExcuseType,
  AttendanceExcuseReason,
  AttendanceExcuseStatus,
  AttendanceExcuseItem,
} from "@/types";
import { formatShortDateTime } from "@/lib/date-utils";

// ─── 헬퍼 ───────────────────────────────────────────────────

// ─── 사유서 단건 카드 ─────────────────────────────────────────

interface ExcuseItemRowProps {
  item: AttendanceExcuseItem;
  approverName: string;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
}

function ExcuseItemRow({
  item,

  onApprove,
  onReject,
  onRemove,
}: ExcuseItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* 멤버명 */}
        <User className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">
          {item.memberName}
        </span>

        {/* 날짜 */}
        <span className="text-[10px] text-muted-foreground mr-1">
          {item.date}
        </span>

        {/* 출결 유형 배지 */}
        <span
          className={`text-[10px] px-1.5 py-0 rounded border font-medium ${EXCUSE_TYPE_COLORS[item.type]}`}
        >
          {EXCUSE_TYPE_LABELS[item.type]}
        </span>

        {/* 승인 상태 배지 */}
        <span
          className={`text-[10px] px-1.5 py-0 rounded border font-medium ${EXCUSE_STATUS_COLORS[item.status]}`}
        >
          {EXCUSE_STATUS_LABELS[item.status]}
        </span>

        {expanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/20 border-t space-y-2">
          {/* 상세 정보 */}
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
            <span>
              사유 카테고리:{" "}
              <span className="text-foreground font-medium">
                {EXCUSE_REASON_LABELS[item.reason]}
              </span>
            </span>
            <span>
              제출일:{" "}
              <span className="text-foreground">
                {formatShortDateTime(item.submittedAt)}
              </span>
            </span>
            {item.approverName && (
              <span>
                처리자:{" "}
                <span className="text-foreground font-medium">
                  {item.approverName}
                </span>
              </span>
            )}
            {item.approvedAt && (
              <span>
                처리일:{" "}
                <span className="text-foreground">
                  {formatShortDateTime(item.approvedAt)}
                </span>
              </span>
            )}
          </div>

          {/* 상세 사유 */}
          <p className="text-xs bg-background rounded p-2 border leading-relaxed">
            {item.detail}
          </p>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {item.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                  }}
                >
                  <XCircle className="h-3 w-3" />
                  반려
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface AttendanceExcuseCardProps {
  groupId: string;
}

export function AttendanceExcuseCard({ groupId }: AttendanceExcuseCardProps) {
  const {
    items,
    pendingItems,
    submitExcuse,
    removeExcuse,
    approveExcuse,
    rejectExcuse,
    getByStatus,
  } = useAttendanceExcuse(groupId);

  // ─ 폼 상태 ─
  const [formOpen, setFormOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [type, setType] = useState<AttendanceExcuseType>("absent");
  const [reason, setReason] = useState<AttendanceExcuseReason>("health");
  const [detail, setDetail] = useState("");

  // ─ 필터 상태 ─
  const [statusFilter, setStatusFilter] = useState<AttendanceExcuseStatus | "all">("all");

  // ─ 승인자 이름 (공통) ─
  const [approverName, setApproverName] = useState("");

  // ─ 패널 열림 ─
  const [open, setOpen] = useState(true);

  // ─────────────────────────────────────────────────────────────

  const filteredItems =
    statusFilter === "all" ? items : getByStatus(statusFilter);

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력하세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택하세요.");
      return;
    }
    if (!detail.trim()) {
      toast.error("상세 사유를 입력하세요.");
      return;
    }
    submitExcuse(memberName, date, type, reason, detail);
    toast.success("사유서가 제출되었습니다.");
    setMemberName("");
    setDate(new Date().toISOString().slice(0, 10));
    setType("absent");
    setReason("health");
    setDetail("");
    setFormOpen(false);
  };

  const handleApprove = (itemId: string) => {
    approveExcuse(itemId, approverName);
    toast.success("사유서를 승인했습니다.");
  };

  const handleReject = (itemId: string) => {
    rejectExcuse(itemId, approverName);
    toast.success("사유서를 반려했습니다.");
  };

  const handleRemove = (itemId: string) => {
    removeExcuse(itemId);
    toast.success("사유서가 삭제되었습니다.");
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold">출결 사유서</span>
                {pendingItems.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border border-blue-200">
                    검토중 {pendingItems.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormOpen((v) => !v);
                    if (!open) setOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  사유서 제출
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* ─ 제출 폼 ─ */}
            {formOpen && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground">
                  새 사유서 작성
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* 멤버 이름 */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">
                      멤버 이름 *
                    </label>
                    <Input
                      placeholder="홍길동"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 날짜 */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">
                      날짜 *
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* 출결 유형 */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">
                      유형 *
                    </label>
                    <Select
                      value={type}
                      onValueChange={(v) => setType(v as AttendanceExcuseType)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_EXCUSE_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {EXCUSE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 사유 카테고리 */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">
                      사유 카테고리 *
                    </label>
                    <Select
                      value={reason}
                      onValueChange={(v) =>
                        setReason(v as AttendanceExcuseReason)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_EXCUSE_REASONS.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {EXCUSE_REASON_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 상세 사유 */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">
                    상세 사유 *
                  </label>
                  <Textarea
                    placeholder="상세 사유를 입력하세요."
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="text-xs resize-none min-h-[64px]"
                  />
                </div>

                <div className="flex gap-1.5 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setFormOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSubmit}
                  >
                    제출
                  </Button>
                </div>
              </div>
            )}

            {/* ─ 승인자 이름 입력 ─ */}
            {items.some((i) => i.status === "pending") && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <Input
                  placeholder="승인자 이름 (승인/반려 시 사용)"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="h-7 text-xs flex-1"
                />
              </div>
            )}

            {/* ─ 상태 필터 ─ */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  statusFilter === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                전체 {items.length}
              </button>
              {ALL_EXCUSE_STATUSES.map((s) => {
                const count = getByStatus(s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      statusFilter === s
                        ? "bg-foreground text-background border-foreground"
                        : `${EXCUSE_STATUS_COLORS[s]} hover:opacity-80`
                    }`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {EXCUSE_STATUS_LABELS[s]} {count}
                  </button>
                );
              })}
            </div>

            {/* ─ 사유서 목록 ─ */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-1">
                <FileText className="h-6 w-6 opacity-30" />
                <p className="text-xs">
                  {statusFilter === "all"
                    ? "제출된 사유서가 없습니다."
                    : `${EXCUSE_STATUS_LABELS[statusFilter]} 상태의 사유서가 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredItems.map((item) => (
                  <ExcuseItemRow
                    key={item.id}
                    item={item}
                    approverName={approverName}
                    onApprove={() => handleApprove(item.id)}
                    onReject={() => handleReject(item.id)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            )}

            {/* ─ 요약 통계 ─ */}
            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                {ALL_EXCUSE_STATUSES.map((s) => {
                  const count = getByStatus(s).length;
                  return (
                    <div
                      key={s}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <span className="text-base font-bold">{count}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0 rounded border ${EXCUSE_STATUS_COLORS[s]}`}
                      >
                        {EXCUSE_STATUS_LABELS[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
