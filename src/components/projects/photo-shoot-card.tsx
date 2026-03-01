"use client";

import { useState, useMemo } from "react";
import {
  Camera,
  Users,
  User,
  Zap,
  Theater,
  Aperture,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  Link,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { usePhotoShoot, type PhotoShootPlanInput } from "@/hooks/use-photo-shoot";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PhotoShootPlan, PhotoShootPlanType } from "@/types";

// ============================================
// 상수 & 설정
// ============================================

const TYPE_CONFIG: Record<
  PhotoShootPlanType,
  {
    label: string;
    icon: React.ReactNode;
    badgeColor: string;
    iconColor: string;
  }
> = {
  group: {
    label: "단체",
    icon: <Users className="h-3.5 w-3.5" />,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconColor: "text-blue-500",
  },
  individual: {
    label: "개인",
    icon: <User className="h-3.5 w-3.5" />,
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    iconColor: "text-purple-500",
  },
  action: {
    label: "액션",
    icon: <Zap className="h-3.5 w-3.5" />,
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    iconColor: "text-orange-500",
  },
  backstage: {
    label: "백스테이지",
    icon: <Theater className="h-3.5 w-3.5" />,
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
    iconColor: "text-pink-500",
  },
  detail: {
    label: "디테일",
    icon: <Aperture className="h-3.5 w-3.5" />,
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    iconColor: "text-cyan-500",
  },
};

const TYPE_OPTIONS: PhotoShootPlanType[] = [
  "group",
  "individual",
  "action",
  "backstage",
  "detail",
];

// ============================================
// 계획 추가/수정 다이얼로그
// ============================================

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PhotoShootPlan | null;
  onSubmit: (input: PhotoShootPlanInput) => boolean;
}

function PlanDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: PlanDialogProps) {
  const isEdit = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [type, setType] = useState<PhotoShootPlanType>(
    initialData?.type ?? "group"
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [timing, setTiming] = useState(initialData?.timing ?? "");
  const [participantsRaw, setParticipantsRaw] = useState(
    initialData?.participants.join(", ") ?? ""
  );
  const [poseDescription, setPoseDescription] = useState(
    initialData?.poseDescription ?? ""
  );
  const [referenceUrl, setReferenceUrl] = useState(
    initialData?.referenceUrl ?? ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  function reset() {
    setTitle(initialData?.title ?? "");
    setType(initialData?.type ?? "group");
    setLocation(initialData?.location ?? "");
    setTiming(initialData?.timing ?? "");
    setParticipantsRaw(initialData?.participants.join(", ") ?? "");
    setPoseDescription(initialData?.poseDescription ?? "");
    setReferenceUrl(initialData?.referenceUrl ?? "");
    setNotes(initialData?.notes ?? "");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit() {
    const participants = participantsRaw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const success = onSubmit({
      title,
      type,
      location: location || null,
      timing: timing || null,
      participants,
      poseDescription: poseDescription || null,
      referenceUrl: referenceUrl || null,
      notes,
    });
    if (success) {
      handleClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEdit ? "촬영 계획 수정" : "촬영 계획 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 전체 단체 사진"
              className="h-8 text-xs"
            />
          </div>

          {/* 촬영 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">촬영 유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PhotoShootPlanType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {TYPE_CONFIG[t].icon}
                      {TYPE_CONFIG[t].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 위치 */}
          <div className="space-y-1">
            <Label className="text-xs">촬영 위치</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 무대 중앙, 분장실 앞"
              className="h-8 text-xs"
            />
          </div>

          {/* 타이밍 */}
          <div className="space-y-1">
            <Label className="text-xs">촬영 타이밍</Label>
            <Input
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              placeholder="예: 공연 시작 30분 전, 1부 종료 직후"
              className="h-8 text-xs"
            />
          </div>

          {/* 참여자 */}
          <div className="space-y-1">
            <Label className="text-xs">참여자 (쉼표로 구분)</Label>
            <Input
              value={participantsRaw}
              onChange={(e) => setParticipantsRaw(e.target.value)}
              placeholder="예: 김민지, 박서준, 이지우"
              className="h-8 text-xs"
            />
          </div>

          {/* 포즈/구도 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">포즈 / 구도 설명</Label>
            <Textarea
              value={poseDescription}
              onChange={(e) => setPoseDescription(e.target.value)}
              placeholder="포즈, 구도, 표정 등 촬영 방향을 설명해주세요"
              className="text-xs resize-none"
              rows={2}
            />
          </div>

          {/* 참고 URL */}
          <div className="space-y-1">
            <Label className="text-xs">참고 URL</Label>
            <Input
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 참고 사항을 입력해주세요"
              className="text-xs resize-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 촬영 담당자 편집 다이얼로그
// ============================================

interface PhotographerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string | null;
  onSave: (name: string | null) => void;
}

function PhotographerDialog({
  open,
  onOpenChange,
  currentName,
  onSave,
}: PhotographerDialogProps) {
  const [name, setName] = useState(currentName ?? "");

  function handleClose() {
    setName(currentName ?? "");
    onOpenChange(false);
  }

  function handleSave() {
    onSave(name || null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            촬영 담당자 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label className="text-xs">담당자 이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김사진"
            className="h-8 text-xs"
          />
        </div>
        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 촬영 계획 카드 아이템
// ============================================

interface PlanItemProps {
  plan: PhotoShootPlan;
  onToggle: (id: string) => void;
  onEdit: (plan: PhotoShootPlan) => void;
  onDelete: (id: string) => void;
}

function PlanItem({ plan, onToggle, onEdit, onDelete }: PlanItemProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[plan.type];
  const hasDetails =
    plan.location ||
    plan.timing ||
    plan.participants.length > 0 ||
    plan.poseDescription ||
    plan.referenceUrl ||
    plan.notes;

  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        plan.isCompleted
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200"
      }`}
    >
      {/* 상단 행 */}
      <div className="flex items-start gap-2">
        {/* 완료 체크 버튼 */}
        <button
          onClick={() => onToggle(plan.id)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            plan.isCompleted
              ? "text-green-500 hover:text-green-600"
              : "text-gray-300 hover:text-gray-400"
          }`}
        >
          {plan.isCompleted ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium leading-tight ${
                plan.isCompleted ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {plan.title}
            </span>
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${cfg.badgeColor}`}
            >
              <span className="flex items-center gap-0.5">
                {cfg.icon}
                {cfg.label}
              </span>
            </Badge>
          </div>

          {/* 요약 정보 */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {plan.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <MapPin className="h-2.5 w-2.5" />
                {plan.location}
              </span>
            )}
            {plan.timing && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Clock className="h-2.5 w-2.5" />
                {plan.timing}
              </span>
            )}
            {plan.participants.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Users className="h-2.5 w-2.5" />
                {plan.participants.length}명
              </span>
            )}
          </div>
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {hasDetails && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 p-0.5">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onEdit(plan)}
              >
                <Pencil className="h-3 w-3" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                onClick={() => onDelete(plan.id)}
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 상세 정보 (펼침) */}
      {expanded && hasDetails && (
        <div className="mt-2 ml-6 space-y-1.5 border-t border-gray-100 pt-2">
          {plan.participants.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">참여자</p>
              <div className="flex flex-wrap gap-1">
                {plan.participants.map((p, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {plan.poseDescription && (
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">포즈 / 구도</p>
              <p className="text-xs text-gray-600">{plan.poseDescription}</p>
            </div>
          )}
          {plan.referenceUrl && (
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">참고 URL</p>
              <a
                href={plan.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline break-all"
              >
                <Link className="h-3 w-3 flex-shrink-0" />
                {plan.referenceUrl}
              </a>
            </div>
          )}
          {plan.notes && (
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">메모</p>
              <p className="text-xs text-gray-600">{plan.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface PhotoShootCardProps {
  projectId: string;
}

export function PhotoShootCard({ projectId }: PhotoShootCardProps) {
  const {
    plans,
    photographerName,
    loading,
    totalPlans,
    completedCount,
    typeDistribution,
    addPlan,
    updatePlan,
    deletePlan,
    toggleCompleted,
    setPhotographer,
  } = usePhotoShoot(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PhotoShootPlan | null>(null);
  const [photographerDialogOpen, setPhotographerDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<PhotoShootPlanType | "all">(
    "all"
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 필터링된 계획 목록
  const filteredPlans = useMemo(() => {
    if (filterType === "all") return plans;
    return plans.filter((p) => p.type === filterType);
  }, [plans, filterType]);

  // 완료율
  const completionRate =
    totalPlans > 0 ? Math.round((completedCount / totalPlans) * 100) : 0;

  function handleDelete() {
    if (!deleteConfirmId) return;
    deletePlan(deleteConfirmId);
    setDeleteConfirmId(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-gray-400">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-indigo-500" />
              사진 촬영 계획
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {/* 촬영 담당자 */}
              <button
                onClick={() => setPhotographerDialogOpen(true)}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded px-1.5 py-0.5"
              >
                <User className="h-2.5 w-2.5" />
                {photographerName ? photographerName : "담당자 미설정"}
              </button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {/* 진행률 바 */}
          {totalPlans > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  완료율
                </span>
                <span className="text-[10px] font-medium text-gray-700">
                  {completedCount} / {totalPlans} ({completionRate}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 유형별 통계 요약 */}
          {totalPlans > 0 && (
            <div className="flex flex-wrap gap-1">
              {TYPE_OPTIONS.filter((t) => typeDistribution[t] > 0).map((t) => (
                <Badge
                  key={t}
                  className={`text-[10px] px-1.5 py-0 border cursor-pointer transition-opacity ${
                    TYPE_CONFIG[t].badgeColor
                  } ${filterType === t ? "opacity-100 ring-1 ring-offset-1 ring-current" : "opacity-70 hover:opacity-100"}`}
                  onClick={() =>
                    setFilterType((prev) => (prev === t ? "all" : t))
                  }
                >
                  <span className="flex items-center gap-0.5">
                    {TYPE_CONFIG[t].icon}
                    {TYPE_CONFIG[t].label} {typeDistribution[t]}
                  </span>
                </Badge>
              ))}
              {filterType !== "all" && (
                <button
                  onClick={() => setFilterType("all")}
                  className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                >
                  전체 보기
                </button>
              )}
            </div>
          )}

          {/* 촬영 계획 목록 */}
          {filteredPlans.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-gray-200" />
              <p className="text-xs text-gray-400">
                {filterType === "all"
                  ? "아직 촬영 계획이 없습니다"
                  : `${TYPE_CONFIG[filterType].label} 유형 계획이 없습니다`}
              </p>
              {filterType === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 계획 추가
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlans.map((plan) => (
                <PlanItem
                  key={plan.id}
                  plan={plan}
                  onToggle={toggleCompleted}
                  onEdit={(p) => setEditTarget(p)}
                  onDelete={setDeleteConfirmId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <PlanDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialData={null}
        onSubmit={addPlan}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <PlanDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initialData={editTarget}
          onSubmit={(input) => updatePlan(editTarget.id, input)}
        />
      )}

      {/* 담당자 설정 다이얼로그 */}
      <PhotographerDialog
        open={photographerDialogOpen}
        onOpenChange={setPhotographerDialogOpen}
        currentName={photographerName}
        onSave={setPhotographer}
      />
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
        title="촬영 계획 삭제"
        description="촬영 계획을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
