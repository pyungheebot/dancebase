"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectNotices } from "@/hooks/use-project-notices";
import type { EntityContext } from "@/types/entity-context";
import type { ProjectNoticeImportance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Megaphone, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectNoticeFeedProps {
  ctx: EntityContext;
}

// 작성일 포맷
function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

// ============================================
// 공지 항목 컴포넌트
// ============================================

interface NoticeItemProps {
  id: string;
  title: string;
  content: string;
  importance: ProjectNoticeImportance;
  createdBy: string;
  createdAt: string;
  ctx: EntityContext;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

function NoticeItem({
  id,
  title,
  content,
  importance,
  createdBy,
  createdAt,
  ctx,
  canDelete,
  onDelete,
}: NoticeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isUrgent = importance === "urgent";

  // 작성자 이름
  const member = ctx.members.find((m) => m.userId === createdBy);
  const creatorName = member
    ? ctx.nicknameMap[createdBy] || member.profile.name || "알 수 없음"
    : "알 수 없음";

  // 내용이 길면 접이식 처리 (2줄 이상)
  const needsExpand = content.length > 80 || content.includes("\n");

  return (
    <div
      className={`rounded-md border px-3 py-2.5 transition-colors ${
        isUrgent
          ? "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30"
          : "border-border bg-card"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2">
        {/* 중요도 아이콘 */}
        <div className="mt-0.5 shrink-0">
          {isUrgent ? (
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {/* 제목 + 배지 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUrgent && (
              <Badge className="text-[10px] px-1.5 py-0 bg-red-500 hover:bg-red-500 text-white shrink-0">
                긴급
              </Badge>
            )}
            <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          </div>

          {/* 내용 */}
          <div className="mt-1">
            {needsExpand ? (
              <>
                <p
                  className={`text-xs text-muted-foreground whitespace-pre-wrap break-words ${
                    expanded ? "" : "line-clamp-2"
                  }`}
                >
                  {content}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      더 보기
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>

          {/* 메타 정보 */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{creatorName}</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* 삭제 버튼 */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
            onClick={() => onDelete(id)}
            title="공지 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 공지 작성 인라인 폼
// ============================================

interface WriteFormProps {
  onSubmit: (title: string, content: string, importance: ProjectNoticeImportance) => void;
}

function WriteForm({ onSubmit }: WriteFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!trimmedContent) {
      toast.error("내용을 입력해주세요");
      return;
    }

    setSubmitting(true);
    onSubmit(trimmedTitle, trimmedContent, isUrgent ? "urgent" : "normal");
    setTitle("");
    setContent("");
    setIsUrgent(false);
    setOpen(false);
    setSubmitting(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3 mr-1" />
        공지 작성
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
      {/* 제목 */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="공지 제목"
        className="h-7 text-xs"
        maxLength={100}
        autoFocus
      />

      {/* 내용 */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="공지 내용을 입력하세요"
        className="text-xs min-h-[72px] resize-none"
        maxLength={1000}
      />

      {/* 긴급 토글 + 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id="urgent-toggle"
            checked={isUrgent}
            onCheckedChange={setIsUrgent}
            className="scale-75 origin-left"
          />
          <Label
            htmlFor="urgent-toggle"
            className={`text-xs cursor-pointer ${isUrgent ? "text-red-500 font-semibold" : "text-muted-foreground"}`}
          >
            긴급 공지
          </Label>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setOpen(false);
              setTitle("");
              setContent("");
              setIsUrgent(false);
            }}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 공지 피드 컴포넌트
// ============================================

export function ProjectNoticeFeed({ ctx }: ProjectNoticeFeedProps) {
  const { notices, loading, createNotice, deleteNotice } = useProjectNotices(
    ctx.projectId ?? ""
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 현재 로그인 유저 ID 가져오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // 작성/삭제 권한: leader 또는 canEdit 권한 보유자
  const myMember = ctx.members.find((m) => m.userId === currentUserId);
  const myRole = myMember?.role;
  const canWrite =
    ctx.permissions.canEdit || myRole === "leader" || myRole === "sub_leader";

  // projectId가 없으면 렌더 안 함
  if (!ctx.projectId) return null;

  function handleCreate(
    title: string,
    content: string,
    importance: ProjectNoticeImportance
  ) {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다");
      return;
    }
    createNotice({ title, content, importance, createdBy: currentUserId });
    toast.success("공지가 등록되었습니다");
  }

  function handleDelete(id: string) {
    deleteNotice(id);
    toast.success("공지가 삭제되었습니다");
  }

  return (
    <Card className="mt-4">
      <CardHeader className="px-3 py-2.5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
          공지 채널
          {notices.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {notices.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 py-3 space-y-2">
        {/* 작성 폼 (리더/매니저만) */}
        {canWrite && <WriteForm onSubmit={handleCreate} />}

        {/* 공지 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Megaphone className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">등록된 공지가 없습니다</p>
            {canWrite && (
              <p className="text-[10px] mt-0.5">위에서 첫 공지를 작성해보세요</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((notice) => (
              <NoticeItem
                key={notice.id}
                id={notice.id}
                title={notice.title}
                content={notice.content}
                importance={notice.importance}
                createdBy={notice.createdBy}
                createdAt={notice.createdAt}
                ctx={ctx}
                canDelete={canWrite}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
