"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ExternalLink, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGroupLinks } from "@/hooks/use-group-links";
import { GROUP_LINK_ICONS, type GroupLink } from "@/types";

interface GroupLinksSectionProps {
  groupId: string;
  canEdit: boolean;
}

function getDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type AddLinkForm = {
  url: string;
  title: string;
  icon: string;
};

const DEFAULT_FORM: AddLinkForm = {
  url: "",
  title: "",
  icon: "🔗",
};

export function GroupLinksSection({ groupId, canEdit }: GroupLinksSectionProps) {
  const { links, loading, addLink, deleteLink, moveLink } = useGroupLinks(groupId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddLinkForm>(DEFAULT_FORM);
  const { pending: submitting, execute } = useAsyncAction();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleFormChange = (field: keyof AddLinkForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async () => {
    if (!form.url.trim() || !form.title.trim()) return;

    await execute(async () => {
      const ok = await addLink({
        url: form.url.trim(),
        title: form.title.trim(),
        icon: form.icon,
      });
      if (ok) {
        setForm(DEFAULT_FORM);
        setShowForm(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteLink(id);
    setDeletingId(null);
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    setMovingId(id);
    await moveLink(id, direction);
    setMovingId(null);
  };

  const handleCancel = () => {
    setForm(DEFAULT_FORM);
    setShowForm(false);
  };

  return (
    <div className="rounded border bg-card px-3 py-2.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground font-medium">링크 모음</span>
        {canEdit && !showForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5 py-0 gap-0.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3" />
            링크 추가
          </Button>
        )}
      </div>

      {/* 링크 추가 폼 */}
      {showForm && canEdit && (
        <div className="mb-3 rounded border bg-muted/30 p-2.5 space-y-2">
          {/* 이모지 선택 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">아이콘</Label>
            <div className="flex flex-wrap gap-1">
              {GROUP_LINK_ICONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  title={label}
                  onClick={() => handleFormChange("icon", emoji)}
                  className={`text-base px-1.5 py-0.5 rounded transition-colors ${
                    form.icon === emoji
                      ? "bg-primary/20 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 입력 */}
          <div>
            <Label htmlFor="link-title" className="text-[10px] text-muted-foreground mb-1 block">
              제목
            </Label>
            <Input
              id="link-title"
              value={form.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              placeholder="링크 이름을 입력하세요"
              className="h-7 text-xs"
            />
          </div>

          {/* URL 입력 */}
          <div>
            <Label htmlFor="link-url" className="text-[10px] text-muted-foreground mb-1 block">
              URL
            </Label>
            <Input
              id="link-url"
              value={form.url}
              onChange={(e) => handleFormChange("url", e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs"
            />
          </div>

          {/* 폼 버튼 */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddSubmit}
              disabled={submitting || !form.url.trim() || !form.title.trim()}
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 링크 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          등록된 링크가 없습니다
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {links.map((link: GroupLink, index: number) => (
            <LinkCard
              key={link.id}
              link={link}
              isFirst={index === 0}
              isLast={index === links.length - 1}
              canEdit={canEdit}
              isDeleting={deletingId === link.id}
              isMoving={movingId === link.id}
              onDelete={() => handleDelete(link.id)}
              onMoveUp={() => handleMove(link.id, "up")}
              onMoveDown={() => handleMove(link.id, "down")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LinkCardProps {
  link: GroupLink;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  isDeleting: boolean;
  isMoving: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function LinkCard({
  link,
  isFirst,
  isLast,
  canEdit,
  isDeleting,
  isMoving,
  onDelete,
  onMoveUp,
  onMoveDown,
}: LinkCardProps) {
  const domain = getDomain(link.url);
  const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;

  return (
    <div className="relative group rounded border bg-background hover:bg-muted/30 transition-colors">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 px-2.5 py-2 min-h-[52px]"
      >
        <span className="text-lg leading-none mt-0.5 shrink-0">{link.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight truncate">{link.title}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-0.5">
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            {domain}
          </p>
        </div>
      </a>

      {/* 편집 버튼 (리더/매니저만) */}
      {canEdit && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst || isMoving || isDeleting}
            title="위로"
          >
            {isMoving ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <ArrowUp className="h-2.5 w-2.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast || isMoving || isDeleting}
            title="아래로"
          >
            <ArrowDown className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting || isMoving}
            title="삭제"
          >
            {isDeleting ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Trash2 className="h-2.5 w-2.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
