"use client";

import { useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Share2,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Hash,
  User,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { useSocialPostPlanner } from "@/hooks/use-social-post-planner";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  SocialPostEntry,
  SocialPlatform,
  SocialPostType,
  SocialPostStatus,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  twitter: "Twitter",
  facebook: "Facebook",
};

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  youtube: "bg-red-50 text-red-700 border-red-200",
  tiktok: "bg-gray-900 text-white border-gray-700",
  twitter: "bg-sky-50 text-sky-700 border-sky-200",
  facebook: "bg-blue-50 text-blue-700 border-blue-200",
};

const PLATFORM_ICON_COLOR: Record<SocialPlatform, string> = {
  instagram: "text-pink-500",
  youtube: "text-red-500",
  tiktok: "text-gray-900",
  twitter: "text-sky-500",
  facebook: "text-blue-600",
};

const POST_TYPE_LABELS: Record<SocialPostType, string> = {
  performance_promo: "공연 홍보",
  practice_behind: "연습 비하인드",
  member_intro: "멤버 소개",
  review: "리뷰/후기",
  etc: "기타",
};

const POST_TYPE_COLORS: Record<SocialPostType, string> = {
  performance_promo: "bg-purple-50 text-purple-700 border-purple-200",
  practice_behind: "bg-orange-50 text-orange-700 border-orange-200",
  member_intro: "bg-cyan-50 text-cyan-700 border-cyan-200",
  review: "bg-green-50 text-green-700 border-green-200",
  etc: "bg-gray-50 text-gray-700 border-gray-200",
};

const STATUS_LABELS: Record<SocialPostStatus, string> = {
  draft: "초안",
  scheduled: "예정",
  published: "게시완료",
  cancelled: "취소",
};

const STATUS_COLORS: Record<SocialPostStatus, string> = {
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  published: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

// ============================================================
// 플랫폼 아이콘 컴포넌트
// ============================================================

function PlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const base = className ?? "h-3.5 w-3.5";
  const colorClass = PLATFORM_ICON_COLOR[platform];
  switch (platform) {
    case "instagram":
      return <Instagram className={`${base} ${colorClass}`} />;
    case "youtube":
      return <Youtube className={`${base} ${colorClass}`} />;
    case "tiktok":
      // lucide에 TikTok 아이콘이 없으므로 Share2로 대체
      return <Share2 className={`${base} ${colorClass}`} />;
    case "twitter":
      return <Twitter className={`${base} ${colorClass}`} />;
    case "facebook":
      return <Facebook className={`${base} ${colorClass}`} />;
  }
}

// ============================================================
// 폼 데이터 타입
// ============================================================

type PostFormData = {
  title: string;
  content: string;
  hashtagsRaw: string;
  platform: SocialPlatform;
  postType: SocialPostType;
  status: SocialPostStatus;
  scheduledDate: string;
  scheduledTime: string;
  assignee: string;
  notes: string;
};

function makeInitialForm(initial?: SocialPostEntry): PostFormData {
  return {
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    hashtagsRaw: initial?.hashtags.join(" ") ?? "",
    platform: initial?.platform ?? "instagram",
    postType: initial?.postType ?? "performance_promo",
    status: initial?.status ?? "draft",
    scheduledDate:
      initial?.scheduledDate ?? new Date().toISOString().slice(0, 10),
    scheduledTime: initial?.scheduledTime ?? "12:00",
    assignee: initial?.assignee ?? "",
    notes: initial?.notes ?? "",
  };
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => {
      const cleaned = t.replace(/^#+/, "").trim();
      return cleaned ? `#${cleaned}` : "";
    })
    .filter(Boolean);
}

// ============================================================
// 추가/수정 다이얼로그
// ============================================================

function PostFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SocialPostEntry;
  onSubmit: (data: PostFormData) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<PostFormData>(() => makeInitialForm(initial));

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("포스트 제목을 입력해주세요.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("본문 내용을 입력해주세요.");
      return;
    }
    if (!form.assignee.trim()) {
      toast.error("담당자를 입력해주세요.");
      return;
    }
    if (!form.scheduledDate) {
      toast.error("예정 날짜를 선택해주세요.");
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "소셜 포스트 계획 추가" : "소셜 포스트 계획 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">포스트 제목</Label>
            <Input
              placeholder="예: 2024 봄 정기공연 홍보 포스트"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          {/* 플랫폼 & 유형 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">플랫폼</Label>
              <Select
                value={form.platform}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, platform: v as SocialPlatform }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "instagram",
                      "youtube",
                      "tiktok",
                      "twitter",
                      "facebook",
                    ] as SocialPlatform[]
                  ).map((pl) => (
                    <SelectItem key={pl} value={pl} className="text-xs">
                      {PLATFORM_LABELS[pl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">포스트 유형</Label>
              <Select
                value={form.postType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, postType: v as SocialPostType }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "performance_promo",
                      "practice_behind",
                      "member_intro",
                      "review",
                      "etc",
                    ] as SocialPostType[]
                  ).map((pt) => (
                    <SelectItem key={pt} value={pt} className="text-xs">
                      {POST_TYPE_LABELS[pt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">게시 상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, status: v as SocialPostStatus }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["draft", "scheduled", "published", "cancelled"] as SocialPostStatus[]).map(
                  (st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {STATUS_LABELS[st]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 본문 */}
          <div className="space-y-1">
            <Label className="text-xs">본문 내용</Label>
            <Textarea
              placeholder="포스트 본문을 입력해주세요."
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className="text-xs resize-none"
              rows={4}
            />
          </div>

          {/* 해시태그 */}
          <div className="space-y-1">
            <Label className="text-xs">해시태그 (공백 또는 쉼표로 구분)</Label>
            <Input
              placeholder="예: #댄스 #공연 #DanceBase"
              value={form.hashtagsRaw}
              onChange={(e) =>
                setForm((p) => ({ ...p, hashtagsRaw: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 예정 날짜 & 시각 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">예정 날짜</Label>
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scheduledDate: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">예정 시각</Label>
              <Input
                type="time"
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scheduledTime: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당자</Label>
            <Input
              placeholder="담당자 이름"
              value={form.assignee}
              onChange={(e) =>
                setForm((p) => ({ ...p, assignee: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고 (선택)</Label>
            <Input
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 포스트 항목 행
// ============================================================

function PostEntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: SocialPostEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border bg-card hover:bg-accent/30 transition-colors">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
            <PlatformIcon platform={entry.platform} className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium truncate">{entry.title}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${PLATFORM_COLORS[entry.platform]}`}
                >
                  {PLATFORM_LABELS[entry.platform]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${POST_TYPE_COLORS[entry.postType]}`}
                >
                  {POST_TYPE_LABELS[entry.postType]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[entry.status]}`}
                >
                  {STATUS_LABELS[entry.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <CalendarClock className="h-2.5 w-2.5" />
                  {entry.scheduledDate} {entry.scheduledTime}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <User className="h-2.5 w-2.5" />
                  {entry.assignee}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
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
          <div className="px-3 pb-3 space-y-2.5 border-t pt-2">
            {/* 본문 */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">
                본문
              </p>
              <p className="text-xs leading-relaxed bg-muted/30 rounded px-2 py-1.5 whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>

            {/* 해시태그 */}
            {entry.hashtags.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  해시태그
                </p>
                <div className="flex flex-wrap gap-1">
                  {entry.hashtags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 비고 */}
            {entry.notes && (
              <p className="text-[11px] text-muted-foreground italic">
                비고: {entry.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function SocialPostPlannerCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useSocialPostPlanner(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SocialPostEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [isOpen, setIsOpen] = useState(true);

  function handleAdd(data: PostFormData) {
    addEntry({
      title: data.title,
      content: data.content,
      hashtags: parseHashtags(data.hashtagsRaw),
      platform: data.platform,
      postType: data.postType,
      status: data.status,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      assignee: data.assignee,
      notes: data.notes || undefined,
    });
    toast.success("소셜 포스트 계획이 추가되었습니다.");
    setAddOpen(false);
  }

  function handleEdit(data: PostFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      title: data.title,
      content: data.content,
      hashtags: parseHashtags(data.hashtagsRaw),
      platform: data.platform,
      postType: data.postType,
      status: data.status,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      assignee: data.assignee,
      notes: data.notes || undefined,
    });
    if (ok) {
      toast.success("포스트 계획이 수정되었습니다.");
    } else {
      toast.error("수정에 실패했습니다.");
    }
    setEditTarget(null);
  }

  function handleDelete() {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteEntry(id);
    if (ok) {
      toast.success("포스트 계획이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  const platforms: SocialPlatform[] = [
    "instagram",
    "youtube",
    "tiktok",
    "twitter",
    "facebook",
  ];

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer select-none">
                  <Share2 className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    소셜 미디어 포스트 플래너
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-pink-50 text-pink-700 border-pink-200"
                    >
                      {entries.length}건
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                포스트 추가
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <div className="space-y-2">
                  {/* 상태별 분포 */}
                  <div className="grid grid-cols-4 gap-2 rounded-md bg-muted/30 p-3">
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">초안</p>
                      <p className="text-sm font-bold text-gray-600">
                        {stats.statusCountMap.draft}건
                      </p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">예정</p>
                      <p className="text-sm font-bold text-blue-600">
                        {stats.statusCountMap.scheduled}건
                      </p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">게시완료</p>
                      <p className="text-sm font-bold text-green-600">
                        {stats.statusCountMap.published}건
                      </p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">취소</p>
                      <p className="text-sm font-bold text-red-600">
                        {stats.statusCountMap.cancelled}건
                      </p>
                    </div>
                  </div>

                  {/* 플랫폼별 분포 */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      플랫폼별 포스트 수
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {platforms.map((pl) => {
                        const count = stats.platformCountMap[pl];
                        if (!count) return null;
                        return (
                          <div
                            key={pl}
                            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${PLATFORM_COLORS[pl]}`}
                          >
                            <PlatformIcon platform={pl} className="h-3 w-3" />
                            <span>{PLATFORM_LABELS[pl]}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 포스트 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  등록된 소셜 포스트 계획이 없습니다.
                  <br />
                  상단 &quot;포스트 추가&quot; 버튼으로 추가해보세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <PostEntryRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => setEditTarget(entry)}
                      onDelete={() => deleteConfirm.request(entry.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가 다이얼로그 */}
      <PostFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <PostFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          mode="edit"
          initial={editTarget}
          onSubmit={handleEdit}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="포스트 계획 삭제"
        description="이 소셜 포스트 계획을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
