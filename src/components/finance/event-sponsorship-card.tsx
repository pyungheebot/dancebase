"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Trash2,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useEventSponsorship } from "@/hooks/use-event-sponsorship";
import type { SponsorType, SponsorStatus } from "@/types";

// ── 레이블 맵 ────────────────────────────────────────────────

const TYPE_LABELS: Record<SponsorType, string> = {
  financial: "자금",
  venue: "장소",
  equipment: "장비",
  media: "미디어",
  other: "기타",
};

const STATUS_LABELS: Record<SponsorStatus, string> = {
  prospect: "후보",
  negotiating: "협의중",
  confirmed: "확정",
  completed: "완료",
};

// ── 배지 색상 ─────────────────────────────────────────────────

function getTypeBadgeClass(type: SponsorType): string {
  switch (type) {
    case "financial":
      return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/40";
    case "venue":
      return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/40";
    case "equipment":
      return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/40";
    case "media":
      return "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/40";
    case "other":
      return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/40";
  }
}

function getStatusBadgeClass(status: SponsorStatus): string {
  switch (status) {
    case "prospect":
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40";
    case "negotiating":
      return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/40";
    case "confirmed":
      return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40";
    case "completed":
      return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/40";
  }
}

// ── 타입 분포 바 ──────────────────────────────────────────────

const TYPE_BAR_COLORS: Record<SponsorType, string> = {
  financial: "bg-green-500",
  venue: "bg-purple-500",
  equipment: "bg-orange-500",
  media: "bg-pink-500",
  other: "bg-gray-400",
};

// ── 폼 초기값 ─────────────────────────────────────────────────

type FormState = {
  name: string;
  type: SponsorType;
  status: SponsorStatus;
  contactName: string;
  contactInfo: string;
  supportAmount: string;
  supportDescription: string;
  eventName: string;
  note: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "financial",
  status: "prospect",
  contactName: "",
  contactInfo: "",
  supportAmount: "",
  supportDescription: "",
  eventName: "",
  note: "",
};

// ── 상태 필터 탭 ──────────────────────────────────────────────

type FilterTab = "all" | SponsorStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "prospect", label: "후보" },
  { value: "negotiating", label: "협의중" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────

type Props = {
  groupId: string;
};

export function EventSponsorshipCard({ groupId }: Props) {
  const {
    sponsors,
    addSponsor,
    changeStatus,
    deleteSponsor,
    totalCount,
    confirmedAmount,
    typeDistribution,
  } = useEventSponsorship(groupId);

  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // 필터링된 스폰서 목록
  const filteredSponsors =
    activeTab === "all"
      ? sponsors
      : sponsors.filter((s) => s.status === activeTab);

  // 타입 분포 계산
  const totalForDistribution = Object.values(typeDistribution).reduce(
    (a, b) => a + b,
    0
  );
  const typeEntries = (
    Object.entries(typeDistribution) as [SponsorType, number][]
  ).filter(([, count]) => count > 0);

  // 폼 필드 변경
  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // 다이얼로그 닫기 & 폼 초기화
  function handleCloseDialog() {
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  }

  // 스폰서 추가 제출
  function handleAddSponsor() {
    const name = form.name.trim();
    if (!name) {
      toast.error(TOAST.FINANCE.SPONSOR_NAME_REQUIRED);
      return;
    }
    const supportAmount = form.supportAmount
      ? parseInt(form.supportAmount.replace(/,/g, ""), 10)
      : 0;
    if (form.supportAmount && (isNaN(supportAmount) || supportAmount < 0)) {
      toast.error(TOAST.FINANCE.SPONSOR_AMOUNT_REQUIRED);
      return;
    }

    const ok = addSponsor({
      name,
      type: form.type,
      status: form.status,
      contactName: form.contactName.trim(),
      contactInfo: form.contactInfo.trim(),
      supportAmount,
      supportDescription: form.supportDescription.trim(),
      eventName: form.eventName.trim(),
      note: form.note.trim(),
    });

    if (ok) {
      toast.success(TOAST.FINANCE.SPONSOR_ADDED);
      handleCloseDialog();
    } else {
      toast.error(TOAST.FINANCE.SPONSOR_ADD_ERROR);
    }
  }

  // 상태 변경
  function handleChangeStatus(id: string, status: SponsorStatus) {
    const ok = changeStatus(id, status);
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[status]}"(으)로 변경되었습니다`);
    } else {
      toast.error(TOAST.FINANCE.SPONSOR_STATUS_ERROR);
    }
  }

  // 삭제
  function handleDelete(id: string, name: string) {
    const ok = deleteSponsor(id);
    if (ok) {
      toast.success(`"${name}" 스폰서가 삭제되었습니다`);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="overflow-hidden">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors select-none">
              <div className="flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">이벤트 스폰서</span>
                {totalCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/40 border">
                    {totalCount}개
                  </Badge>
                )}
                {confirmedAmount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40 border">
                    {confirmedAmount.toLocaleString()}원 확정
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                  aria-label="스폰서 추가"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 pt-0 space-y-3">
              {/* 타입 분포 바 */}
              {totalForDistribution > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">타입 분포</p>
                  <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    {typeEntries.map(([type, count]) => (
                      <div
                        key={type}
                        className={`${TYPE_BAR_COLORS[type]} transition-all`}
                        style={{
                          width: `${(count / totalForDistribution) * 100}%`,
                        }}
                        title={`${TYPE_LABELS[type]}: ${count}개`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                    {typeEntries.map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground"
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-sm ${TYPE_BAR_COLORS[type]}`}
                        />
                        {TYPE_LABELS[type]} {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 필터 탭 */}
              <div className="flex gap-1 flex-wrap">
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.value === "all"
                      ? totalCount
                      : sponsors.filter((s) => s.status === tab.value).length;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        activeTab === tab.value
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className="ml-1 opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 스폰서 목록 */}
              {filteredSponsors.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-muted-foreground">
                  {activeTab === "all"
                    ? "등록된 스폰서가 없습니다"
                    : `${STATUS_LABELS[activeTab as SponsorStatus]} 상태의 스폰서가 없습니다`}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="rounded-md border bg-card px-2.5 py-2 space-y-1.5"
                    >
                      {/* 상단 행: 이름 + 배지 + 삭제 */}
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-medium truncate">
                              {sponsor.name}
                            </span>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 h-4 border ${getTypeBadgeClass(
                                sponsor.type
                              )}`}
                            >
                              {TYPE_LABELS[sponsor.type]}
                            </Badge>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 h-4 border ${getStatusBadgeClass(
                                sponsor.status
                              )}`}
                            >
                              {STATUS_LABELS[sponsor.status]}
                            </Badge>
                          </div>
                          {/* 이벤트명 */}
                          {sponsor.eventName && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {sponsor.eventName}
                            </p>
                          )}
                          {/* 금액 */}
                          {sponsor.supportAmount > 0 && (
                            <p className="text-[11px] font-semibold tabular-nums text-green-600 dark:text-green-400">
                              {sponsor.supportAmount.toLocaleString()}원
                            </p>
                          )}
                          {/* 지원 내용 */}
                          {sponsor.supportDescription && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {sponsor.supportDescription}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleDelete(sponsor.id, sponsor.name)
                          }
                          aria-label="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 하단 행: 상태 변경 셀렉트 */}
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={sponsor.status}
                          onValueChange={(val) =>
                            handleChangeStatus(
                              sponsor.id,
                              val as SponsorStatus
                            )
                          }
                        >
                          <SelectTrigger className="h-6 text-[10px] flex-1 min-w-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.entries(STATUS_LABELS) as [
                                SponsorStatus,
                                string
                              ][]
                            ).map(([value, label]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className="text-xs"
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {sponsor.contactName && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {sponsor.contactName}
                            {sponsor.contactInfo
                              ? ` · ${sponsor.contactInfo}`
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                스폰서 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 스폰서 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">스폰서 추가</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* 이름 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                스폰서 이름 <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="예: (주)댄스컴퍼니"
                className="h-7 text-xs"
              />
            </div>

            {/* 타입 + 상태 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  타입
                </label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    updateForm("type", val as SponsorType)
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(TYPE_LABELS) as [SponsorType, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  상태
                </label>
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    updateForm("status", val as SponsorStatus)
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(STATUS_LABELS) as [
                        SponsorStatus,
                        string
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 담당자명 + 연락처 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  담당자명
                </label>
                <Input
                  value={form.contactName}
                  onChange={(e) => updateForm("contactName", e.target.value)}
                  placeholder="홍길동"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  연락처
                </label>
                <Input
                  value={form.contactInfo}
                  onChange={(e) => updateForm("contactInfo", e.target.value)}
                  placeholder="010-0000-0000"
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* 지원 금액 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                지원 금액 (원)
              </label>
              <Input
                type="number"
                value={form.supportAmount}
                onChange={(e) => updateForm("supportAmount", e.target.value)}
                placeholder="0"
                className="h-7 text-xs"
                min={0}
              />
            </div>

            {/* 지원 내용 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                지원 내용
              </label>
              <Input
                value={form.supportDescription}
                onChange={(e) =>
                  updateForm("supportDescription", e.target.value)
                }
                placeholder="예: 공연 장비 일체 지원"
                className="h-7 text-xs"
              />
            </div>

            {/* 이벤트명 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                이벤트명
              </label>
              <Input
                value={form.eventName}
                onChange={(e) => updateForm("eventName", e.target.value)}
                placeholder="예: 2026 봄 정기공연"
                className="h-7 text-xs"
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">메모</label>
              <Textarea
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="기타 메모 사항"
                className="text-xs min-h-[60px] resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCloseDialog}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAddSponsor}
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
