"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useInjuryTracker } from "@/hooks/use-injury-tracker";
import type { InjuryBodyPart, InjuryTrackerSeverity } from "@/types";

// ============================================================
// 레이블 상수
// ============================================================

const BODY_PART_LABELS: Record<InjuryBodyPart, string> = {
  ankle: "발목",
  knee: "무릎",
  hip: "엉덩이",
  back: "허리/등",
  shoulder: "어깨",
  wrist: "손목",
  neck: "목",
  foot: "발",
  other: "기타",
};

const SEVERITY_LABELS: Record<InjuryTrackerSeverity, string> = {
  minor: "경미",
  moderate: "중간",
  severe: "심각",
};

const SEVERITY_COLORS: Record<InjuryTrackerSeverity, string> = {
  minor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-100 text-orange-700 border-orange-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  active: "부상중",
  recovering: "회복중",
  recovered: "완치",
};

const STATUS_COLORS = {
  active: "bg-red-100 text-red-700 border-red-200",
  recovering: "bg-blue-100 text-blue-700 border-blue-200",
  recovered: "bg-green-100 text-green-700 border-green-200",
};

// ============================================================
// 빈 폼 초기값
// ============================================================

const EMPTY_FORM = {
  memberName: "",
  bodyPart: "" as InjuryBodyPart | "",
  description: "",
  severity: "" as InjuryTrackerSeverity | "",
  injuryDate: "",
  expectedRecoveryDate: "",
  restrictions: "",
  notes: "",
};

// ============================================================
// Props
// ============================================================

interface InjuryTrackerCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================================
// 컴포넌트
// ============================================================

export function InjuryTrackerCard({
  groupId,
  memberNames,
}: InjuryTrackerCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { pending: submitting, execute } = useAsyncAction();

  const {
    entries,
    loading,
    addInjury,
    deleteInjury,
    markRecovering,
    markRecovered,
    stats,
  } = useInjuryTracker(groupId);

  // 현재 부상·회복중 멤버 목록 (중복 제거)
  const activeInjuryMembers = [
    ...new Set(
      entries
        .filter((e) => e.status === "active" || e.status === "recovering")
        .map((e) => e.memberName)
    ),
  ];

  // 부위별 분포 바 계산
  const bodyPartEntries = Object.entries(stats.bodyPartDistribution).sort(
    (a, b) => b[1] - a[1]
  );
  const maxBodyPartCount =
    bodyPartEntries.length > 0 ? bodyPartEntries[0][1] : 1;

  // 폼 핸들러
  function handleFormChange(
    field: keyof typeof EMPTY_FORM,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (
      !form.memberName ||
      !form.bodyPart ||
      !form.description ||
      !form.severity ||
      !form.injuryDate
    ) {
      toast.error("멤버, 부위, 설명, 심각도, 부상일은 필수입니다.");
      return;
    }
    await execute(async () => {
      const restrictions = form.restrictions
        ? form.restrictions
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
        : [];

      addInjury(
        form.memberName,
        form.bodyPart as InjuryBodyPart,
        form.description,
        form.severity as InjuryTrackerSeverity,
        form.injuryDate,
        form.expectedRecoveryDate || undefined,
        restrictions,
        form.notes || undefined
      );
      toast.success("부상이 등록되었습니다.");
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    });
  }

  function handleDelete(id: string) {
    const ok = deleteInjury(id);
    if (ok) {
      toast.success("부상 기록이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  function handleMarkRecovering(id: string) {
    const ok = markRecovering(id);
    if (ok) {
      toast.success("회복중으로 변경되었습니다.");
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  function handleMarkRecovered(id: string) {
    const ok = markRecovered(id);
    if (ok) {
      toast.success("완치 처리되었습니다.");
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer select-none">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-red-500" />
                  멤버 부상 추적
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* 상단 통계 배지 */}
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200">
                    전체 {stats.totalInjuries}
                  </Badge>
                  {stats.activeCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                      부상중 {stats.activeCount}
                    </Badge>
                  )}
                  {stats.recoveringCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                      회복중 {stats.recoveringCount}
                    </Badge>
                  )}
                  {stats.recoveredCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                      완치 {stats.recoveredCount}
                    </Badge>
                  )}
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 현재 부상 멤버 경고 배너 */}
              {activeInjuryMembers.length > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700">
                    <span className="font-semibold">부상/회복중 멤버: </span>
                    {activeInjuryMembers.join(", ")}
                  </div>
                </div>
              )}

              {/* 부위별 분포 */}
              {bodyPartEntries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    부위별 분포
                  </p>
                  {bodyPartEntries.map(([part, count]) => (
                    <div key={part} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                        {BODY_PART_LABELS[part as InjuryBodyPart] ?? part}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / maxBodyPartCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-4 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 부상 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 부상 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border bg-card p-2.5 space-y-1.5"
                    >
                      {/* 상단 행: 멤버명 + 배지들 + 삭제 버튼 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold">
                          {entry.memberName}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {BODY_PART_LABELS[entry.bodyPart] ?? entry.bodyPart}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[entry.severity]}`}
                        >
                          {SEVERITY_LABELS[entry.severity]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[entry.status]}`}
                        >
                          {STATUS_LABELS[entry.status]}
                        </Badge>
                        <div className="ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-xs text-muted-foreground">
                        {entry.description}
                      </p>

                      {/* 제한사항 칩 */}
                      {entry.restrictions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.restrictions.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded px-1.5 py-0.5"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 날짜 정보 */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>부상일: {entry.injuryDate}</span>
                        {entry.expectedRecoveryDate && (
                          <span>
                            예상 회복일: {entry.expectedRecoveryDate}
                          </span>
                        )}
                        {entry.recoveredDate && (
                          <span>
                            완치일:{" "}
                            {entry.recoveredDate.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      {/* 메모 */}
                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground italic">
                          메모: {entry.notes}
                        </p>
                      )}

                      {/* 상태 변경 버튼 */}
                      {entry.status !== "recovered" && (
                        <div className="flex gap-1.5 pt-0.5">
                          {entry.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleMarkRecovering(entry.id)}
                            >
                              <Activity className="h-3 w-3" />
                              회복중으로
                            </Button>
                          )}
                          {(entry.status === "active" ||
                            entry.status === "recovering") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleMarkRecovered(entry.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              완치
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 부상 등록 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                부상 등록
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 부상 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <HeartPulse className="h-4 w-4 text-red-500" />
              부상 등록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* 멤버 선택 */}
            <div className="space-y-1">
              <Label className="text-xs">멤버 *</Label>
              {memberNames.length > 0 ? (
                <Select
                  value={form.memberName}
                  onValueChange={(v) => handleFormChange("memberName", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="멤버 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="멤버 이름 입력"
                  className="h-8 text-xs"
                  value={form.memberName}
                  onChange={(e) =>
                    handleFormChange("memberName", e.target.value)
                  }
                />
              )}
            </div>

            {/* 부위 선택 */}
            <div className="space-y-1">
              <Label className="text-xs">부상 부위 *</Label>
              <Select
                value={form.bodyPart}
                onValueChange={(v) => handleFormChange("bodyPart", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="부위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(BODY_PART_LABELS) as [
                      InjuryBodyPart,
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

            {/* 설명 */}
            <div className="space-y-1">
              <Label className="text-xs">부상 설명 *</Label>
              <Textarea
                placeholder="부상 상황을 설명하세요"
                className="text-xs min-h-[60px] resize-none"
                value={form.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
              />
            </div>

            {/* 심각도 */}
            <div className="space-y-1">
              <Label className="text-xs">심각도 *</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => handleFormChange("severity", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="심각도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor" className="text-xs">
                    경미 (Minor)
                  </SelectItem>
                  <SelectItem value="moderate" className="text-xs">
                    중간 (Moderate)
                  </SelectItem>
                  <SelectItem value="severe" className="text-xs">
                    심각 (Severe)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 부상일 */}
            <div className="space-y-1">
              <Label className="text-xs">부상일 *</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.injuryDate}
                onChange={(e) =>
                  handleFormChange("injuryDate", e.target.value)
                }
              />
            </div>

            {/* 예상 회복일 */}
            <div className="space-y-1">
              <Label className="text-xs">예상 회복일</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.expectedRecoveryDate}
                onChange={(e) =>
                  handleFormChange("expectedRecoveryDate", e.target.value)
                }
              />
            </div>

            {/* 제한사항 */}
            <div className="space-y-1">
              <Label className="text-xs">
                제한사항{" "}
                <span className="text-muted-foreground">(쉼표로 구분)</span>
              </Label>
              <Input
                placeholder="예: 점프 금지, 고강도 훈련 제한"
                className="h-8 text-xs"
                value={form.restrictions}
                onChange={(e) =>
                  handleFormChange("restrictions", e.target.value)
                }
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모</Label>
              <Textarea
                placeholder="추가 메모"
                className="text-xs min-h-[50px] resize-none"
                value={form.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setDialogOpen(false);
                }}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "등록 중..." : "등록"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
