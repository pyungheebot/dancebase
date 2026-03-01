"use client";

import { useState, useCallback } from "react";
import {
  usePosterManagement,
} from "@/hooks/use-poster-management";
import type {
  PosterProject,
  PosterVersion,
  PosterVersionStatus,
} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  BarChart3,
  X,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

// ============================================================
// 상수 및 헬퍼
// ============================================================

const STATUS_LABELS: Record<PosterVersionStatus, string> = {
  draft: "초안",
  review: "검토 중",
  approved: "승인됨",
  rejected: "반려됨",
  final: "최종 확정",
};

const STATUS_NEXT: Partial<Record<PosterVersionStatus, PosterVersionStatus[]>> = {
  draft: ["review"],
  review: ["approved", "rejected"],
  approved: ["final"],
  rejected: ["draft"],
};

function statusBadgeClass(status: PosterVersionStatus): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "final":
      return "bg-purple-100 text-purple-700 border-purple-200";
  }
}

function avgRating(votes: PosterVersion["votes"]): number | null {
  if (votes.length === 0) return null;
  return votes.reduce((sum, v) => sum + v.rating, 0) / votes.length;
}

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "xs";
}) {
  const [hover, setHover] = useState(0);
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <Star
            key={n}
            className={`${iconClass} cursor-pointer transition-colors ${
              filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${readonly ? "cursor-default" : ""}`}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange?.(n)}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// 버전 추가 다이얼로그
// ============================================================

interface AddVersionDialogProps {
  posterId: string;
  onAdd: (
    posterId: string,
    partial: {
      title: string;
      designer: string;
      description: string;
      dimensions?: string;
      colorScheme?: string[];
    }
  ) => PosterVersion | null;
}

function AddVersionDialog({ posterId, onAdd }: AddVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [designer, setDesigner] = useState("");
  const [description, setDescription] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  function addColor() {
    const trimmed = colorInput.trim();
    if (!trimmed || colors.includes(trimmed)) return;
    setColors([...colors, trimmed]);
    setColorInput("");
  }

  function removeColor(c: string) {
    setColors(colors.filter((x) => x !== c));
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("버전 제목을 입력해주세요.");
      return;
    }
    if (!designer.trim()) {
      toast.error("디자이너 이름을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("설명을 입력해주세요.");
      return;
    }

    const result = onAdd(posterId, {
      title: title.trim(),
      designer: designer.trim(),
      description: description.trim(),
      dimensions: dimensions.trim() || undefined,
      colorScheme: colors,
    });

    if (result) {
      toast.success("버전이 추가되었습니다.");
      setTitle("");
      setDesigner("");
      setDescription("");
      setDimensions("");
      setColorInput("");
      setColors([]);
      setOpen(false);
    } else {
      toast.error("버전 추가에 실패했습니다.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          버전 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 포스터 버전 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">버전 제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 어두운 배경 버전"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">디자이너 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="디자이너 이름"
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명 *</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="디자인 컨셉, 특징 등"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">사이즈/치수</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: A2 (420×594mm)"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">색상 팔레트</Label>
            <div className="flex gap-1">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="색상 이름 입력 후 추가"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addColor()}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addColor}
              >
                추가
              </Button>
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                  >
                    {c}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer hover:text-red-500"
                      onClick={() => removeColor(c)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 포스터 프로젝트 추가 폼
// ============================================================

interface AddProjectFormProps {
  onAdd: (partial: { posterName: string; deadline?: string }) => PosterProject;
  onClose: () => void;
}

function AddProjectForm({ onAdd, onClose }: AddProjectFormProps) {
  const [posterName, setPosterName] = useState("");
  const [deadline, setDeadline] = useState("");

  function handleSubmit() {
    if (!posterName.trim()) {
      toast.error("포스터 이름을 입력해주세요.");
      return;
    }
    onAdd({
      posterName: posterName.trim(),
      deadline: deadline || undefined,
    });
    toast.success("포스터 프로젝트가 추가되었습니다.");
    onClose();
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
      <p className="text-xs font-medium text-gray-700">새 포스터 프로젝트</p>
      <div className="space-y-1">
        <Label className="text-xs">포스터 이름 *</Label>
        <Input
          className="h-8 text-xs"
          placeholder="예: 2024 공연 메인 포스터"
          value={posterName}
          onChange={(e) => setPosterName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">마감일</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
          추가
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 버전 상세 패널
// ============================================================

interface VersionDetailProps {
  version: PosterVersion;
  posterId: string;
  memberNames: string[];
  onVote: (
    posterId: string,
    versionId: string,
    memberName: string,
    rating: number,
    comment?: string
  ) => boolean;
  onStatusChange: (
    posterId: string,
    versionId: string,
    status: PosterVersionStatus
  ) => boolean;
  onSelectFinal: (posterId: string, versionId: string) => boolean;
  onDelete: (posterId: string, versionId: string) => boolean;
}

function VersionDetail({
  version,
  posterId,
  memberNames,
  onVote,
  onStatusChange,
  onSelectFinal,
  onDelete,
}: VersionDetailProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const avg = avgRating(version.votes);
  const nextStatuses = STATUS_NEXT[version.status] ?? [];

  function handleVote() {
    if (!selectedMember) {
      toast.error("투표할 멤버를 선택해주세요.");
      return;
    }
    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    const ok = onVote(posterId, version.id, selectedMember, rating, comment || undefined);
    if (ok) {
      toast.success("투표가 등록되었습니다.");
      setSelectedMember("");
      setRating(0);
      setComment("");
    } else {
      toast.error("투표 등록에 실패했습니다.");
    }
  }

  function handleStatusChange(status: PosterVersionStatus) {
    const ok = onStatusChange(posterId, version.id, status);
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[status]}"로 변경되었습니다.`);
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  function handleSelectFinal() {
    const ok = onSelectFinal(posterId, version.id);
    if (ok) {
      toast.success("최종 포스터로 선정되었습니다.");
    } else {
      toast.error("최종 선정에 실패했습니다.");
    }
  }

  function handleDelete() {
    const ok = onDelete(posterId, version.id);
    if (ok) {
      toast.success("버전이 삭제되었습니다.");
    } else {
      toast.error("버전 삭제에 실패했습니다.");
    }
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-800">
              v{version.versionNumber}. {version.title}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${statusBadgeClass(version.status)}`}
            >
              {STATUS_LABELS[version.status]}
            </Badge>
            {version.status === "final" && (
              <Award className="h-3.5 w-3.5 text-purple-500" />
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            디자이너: {version.designer}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {avg !== null && (
            <div className="flex items-center gap-0.5">
              <StarRating value={Math.round(avg)} readonly size="xs" />
              <span className="text-[10px] text-gray-500">
                {avg.toFixed(1)}
              </span>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-600">{version.description}</p>

      {/* 치수 */}
      {version.dimensions && (
        <div className="text-[10px] text-gray-500">
          치수: <span className="text-gray-700">{version.dimensions}</span>
        </div>
      )}

      {/* 색상 팔레트 */}
      {version.colorScheme && version.colorScheme.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-medium">색상 팔레트</p>
          <div className="flex flex-wrap gap-1">
            {version.colorScheme.map((c) => (
              <span
                key={c}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 투표 결과 */}
      {version.votes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            투표 결과 ({version.votes.length}명)
          </p>
          <div className="space-y-1">
            {version.votes.map((v) => (
              <div
                key={v.memberName}
                className="flex items-start gap-2 text-[10px]"
              >
                <span className="text-gray-600 w-16 shrink-0 truncate">
                  {v.memberName}
                </span>
                <StarRating value={v.rating} readonly size="xs" />
                <span className="text-gray-400">{v.rating}점</span>
                {v.comment && (
                  <span className="text-gray-500 flex-1 truncate">
                    — {v.comment}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 투표 UI */}
      {version.status !== "final" && (
        <div className="border-t pt-2 space-y-2">
          <p className="text-[10px] text-gray-500 font-medium">투표하기</p>
          <div className="flex items-center gap-2">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="h-7 text-xs flex-1">
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
            <StarRating value={rating} onChange={setRating} size="sm" />
          </div>
          <Input
            className="h-7 text-xs"
            placeholder="코멘트 (선택사항)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleVote}
            disabled={!selectedMember || rating === 0}
          >
            <Star className="h-3 w-3 mr-1" />
            투표 등록
          </Button>
        </div>
      )}

      {/* 상태 워크플로우 */}
      {version.status !== "final" && nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t pt-2">
          {nextStatuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleStatusChange(s)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {STATUS_LABELS[s]}으로 변경
            </Button>
          ))}
          {version.status === "approved" && (
            <Button
              size="sm"
              className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
              onClick={handleSelectFinal}
            >
              <Award className="h-3 w-3 mr-1" />
              최종 선정
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 포스터 프로젝트 행
// ============================================================

interface PosterProjectRowProps {
  poster: PosterProject;
  memberNames: string[];
  onAddVersion: (
    posterId: string,
    partial: {
      title: string;
      designer: string;
      description: string;
      dimensions?: string;
      colorScheme?: string[];
    }
  ) => PosterVersion | null;
  onVote: (
    posterId: string,
    versionId: string,
    memberName: string,
    rating: number,
    comment?: string
  ) => boolean;
  onStatusChange: (
    posterId: string,
    versionId: string,
    status: PosterVersionStatus
  ) => boolean;
  onSelectFinal: (posterId: string, versionId: string) => boolean;
  onDeleteVersion: (posterId: string, versionId: string) => boolean;
  onDeletePoster: (posterId: string) => boolean;
}

function PosterProjectRow({
  poster,
  memberNames,
  onAddVersion,
  onVote,
  onStatusChange,
  onSelectFinal,
  onDeleteVersion,
  onDeletePoster,
}: PosterProjectRowProps) {
  const [open, setOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  const finalVersion = poster.versions.find((v) => v.status === "final");
  const totalVotes = poster.versions.reduce((sum, v) => sum + v.votes.length, 0);

  function handleDeletePoster() {
    const ok = onDeletePoster(poster.id);
    if (ok) {
      toast.success("포스터 프로젝트가 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-gray-800 truncate">
                  {poster.posterName}
                </span>
                {finalVersion && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Award className="h-2.5 w-2.5 mr-0.5" />
                    확정됨
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">
                  버전 {poster.versions.length}개 · 투표 {totalVotes}건
                </span>
                {poster.deadline && (
                  <span className="text-[10px] text-orange-500">
                    마감: {poster.deadline}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePoster();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-2 pb-1">
          {/* 버전 목록 헤더 */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-gray-500 font-medium">
              버전 목록
            </p>
            <AddVersionDialog posterId={poster.id} onAdd={onAddVersion} />
          </div>

          {poster.versions.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center py-3">
              아직 버전이 없습니다. 버전을 추가해보세요.
            </p>
          ) : (
            <div className="space-y-1">
              {/* 버전 요약 목록 */}
              {poster.versions.map((v) => {
                const avg = avgRating(v.votes);
                const isSelected = selectedVersionId === v.id;
                return (
                  <div key={v.id} className="space-y-1">
                    <button
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                        isSelected
                          ? "bg-indigo-50 border border-indigo-200"
                          : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                      }`}
                      onClick={() =>
                        setSelectedVersionId(isSelected ? null : v.id)
                      }
                    >
                      <span className="text-[10px] text-gray-500 w-6 shrink-0">
                        v{v.versionNumber}
                      </span>
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        {v.title}
                      </span>
                      <span className="text-[10px] text-gray-500 shrink-0 hidden sm:inline">
                        {v.designer}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${statusBadgeClass(v.status)}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </Badge>
                      {avg !== null && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] text-gray-500">
                            {avg.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </button>

                    {/* 버전 상세 (선택 시 펼침) */}
                    {isSelected && (
                      <VersionDetail
                        version={v}
                        posterId={poster.id}
                        memberNames={memberNames}
                        onVote={onVote}
                        onStatusChange={onStatusChange}
                        onSelectFinal={onSelectFinal}
                        onDelete={onDeleteVersion}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface PosterManagementCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}

export function PosterManagementCard({
  groupId,
  projectId,
  memberNames = [],
}: PosterManagementCardProps) {
  const {
    projects,
    loading,
    addProject,
    deleteProject,
    addVersion,
    deleteVersion,
    vote,
    updateStatus,
    selectFinal,
    stats,
  } = usePosterManagement(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddVersion = useCallback(
    (
      posterId: string,
      partial: {
        title: string;
        designer: string;
        description: string;
        dimensions?: string;
        colorScheme?: string[];
      }
    ) => addVersion(posterId, partial),
    [addVersion]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* 카드 헤더 */}
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-800">
              공연 포스터 관리
            </span>
            {!loading && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {stats.totalProjects}개 프로젝트
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && stats.totalVersions > 0 && (
              <span className="text-[10px] text-gray-400">
                버전 {stats.totalVersions} · 승인 {stats.approvedVersions}
              </span>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 border rounded-lg bg-gray-50 p-3 space-y-3">
          {/* 통계 요약 */}
          {!loading && stats.totalVersions > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded p-2 text-center border">
                <p className="text-sm font-semibold text-gray-800">
                  {stats.totalProjects}
                </p>
                <p className="text-[10px] text-gray-500">포스터</p>
              </div>
              <div className="bg-card rounded p-2 text-center border">
                <p className="text-sm font-semibold text-gray-800">
                  {stats.totalVersions}
                </p>
                <p className="text-[10px] text-gray-500">총 버전</p>
              </div>
              <div className="bg-card rounded p-2 text-center border">
                <p className="text-sm font-semibold text-green-600">
                  {stats.approvedVersions}
                </p>
                <p className="text-[10px] text-gray-500">승인/확정</p>
              </div>
            </div>
          )}

          {/* 포스터 프로젝트 목록 */}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : projects.length === 0 && !showAddForm ? (
            <div className="text-center py-6">
              <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs text-gray-400">등록된 포스터 프로젝트가 없습니다.</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs mt-2"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 포스터 프로젝트 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {projects.map((poster) => (
                <PosterProjectRow
                  key={poster.id}
                  poster={poster}
                  memberNames={memberNames}
                  onAddVersion={handleAddVersion}
                  onVote={vote}
                  onStatusChange={updateStatus}
                  onSelectFinal={selectFinal}
                  onDeleteVersion={deleteVersion}
                  onDeletePoster={deleteProject}
                />
              ))}
            </div>
          )}

          {/* 추가 폼 */}
          {showAddForm && (
            <AddProjectForm
              onAdd={addProject}
              onClose={() => setShowAddForm(false)}
            />
          )}

          {/* 추가 버튼 */}
          {!showAddForm && projects.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              포스터 프로젝트 추가
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
