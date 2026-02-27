"use client";

import { useState } from "react";
import { useSongParts, PART_TYPE_LABELS, type SongPartWithProfile } from "@/hooks/use-song-parts";
import { createClient } from "@/lib/supabase/client";
import type { SongPartType } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Music,
  Plus,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// ============================================
// 파트 타입별 Badge 색상
// ============================================

const PART_TYPE_COLORS: Record<SongPartType, string> = {
  solo: "bg-yellow-100 text-yellow-700 border-yellow-200",
  point: "bg-purple-100 text-purple-700 border-purple-200",
  backup: "bg-blue-100 text-blue-700 border-blue-200",
  intro: "bg-green-100 text-green-700 border-green-200",
  outro: "bg-red-100 text-red-700 border-red-200",
  bridge: "bg-orange-100 text-orange-700 border-orange-200",
  all: "bg-gray-100 text-gray-700 border-gray-200",
};

const PART_TYPES_ORDERED: SongPartType[] = [
  "all",
  "intro",
  "solo",
  "point",
  "bridge",
  "backup",
  "outro",
];

// ============================================
// 멤버 목록 조회 훅 (그룹 ID 기반)
// ============================================

type MemberOption = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

function useGroupMembers(groupId: string | null) {
  const { data } = useSWR(
    groupId ? `group-members-for-parts-${groupId}` : null,
    async () => {
      if (!groupId) return [];
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return (rows ?? []).map((row: { user_id: string; profiles: { name: string; avatar_url: string | null } | null }) => ({
        userId: row.user_id,
        name: row.profiles?.name ?? "알 수 없음",
        avatarUrl: row.profiles?.avatar_url ?? null,
      })) as MemberOption[];
    }
  );
  return data ?? [];
}

// ============================================
// 파트 배정 추가 Dialog
// ============================================

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  groupId: string;
  onAssign: (
    songId: string,
    userId: string,
    partName: string,
    partType: SongPartType,
    notes?: string
  ) => Promise<boolean>;
}

function AssignDialog({
  open,
  onOpenChange,
  songId,
  groupId,
  onAssign,
}: AssignDialogProps) {
  const members = useGroupMembers(groupId);
  const [userId, setUserId] = useState("");
  const [partType, setPartType] = useState<SongPartType>("all");
  const [partName, setPartName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!userId || !partName.trim()) {
      toast.error("멤버와 파트명을 입력해주세요");
      return;
    }
    setSubmitting(true);
    const ok = await onAssign(songId, userId, partName, partType, notes || undefined);
    if (ok) {
      setUserId("");
      setPartType("all");
      setPartName("");
      setNotes("");
      onOpenChange(false);
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            파트 배정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버 *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId} className="text-xs">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 파트 타입 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">파트 타입 *</Label>
            <Select
              value={partType}
              onValueChange={(v) => setPartType(v as SongPartType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PART_TYPES_ORDERED.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    {PART_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 파트명 입력 */}
          <div className="space-y-1">
            <Label className="text-xs">파트명 *</Label>
            <Input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="예: 1절 솔로, 후렴 포인트"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* 메모 (선택) */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모"
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
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || !userId || !partName.trim()}
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            배정
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 파트 배지 컴포넌트
// ============================================

function PartTypeBadge({ partType }: { partType: SongPartType }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0 rounded border font-medium shrink-0 ${PART_TYPE_COLORS[partType]}`}
    >
      {PART_TYPE_LABELS[partType]}
    </span>
  );
}

// ============================================
// 파트 항목 컴포넌트
// ============================================

interface PartItemProps {
  part: SongPartWithProfile;
  canEdit: boolean;
  onRemove: (partId: string) => void;
}

function PartItem({ part, canEdit, onRemove }: PartItemProps) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await onRemove(part.id);
    setRemoving(false);
  }

  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/30 group">
      <PartTypeBadge partType={part.part_type} />
      <span className="text-xs font-medium truncate shrink-0 max-w-[80px]">
        {part.profiles?.name ?? "알 수 없음"}
      </span>
      <span className="text-xs text-foreground truncate flex-1">
        {part.part_name}
      </span>
      {part.notes && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[60px] shrink-0">
          {part.notes}
        </span>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// 파트 타입별 그룹핑 뷰
// ============================================

interface PartsByTypeViewProps {
  parts: SongPartWithProfile[];
  canEdit: boolean;
  onRemove: (partId: string) => void;
}

function PartsByTypeView({ parts, canEdit, onRemove }: PartsByTypeViewProps) {
  // 파트 타입별 그룹화
  const grouped = PART_TYPES_ORDERED.reduce<
    Record<SongPartType, SongPartWithProfile[]>
  >(
    (acc, type) => {
      acc[type] = parts.filter((p) => p.part_type === type);
      return acc;
    },
    {
      all: [],
      intro: [],
      solo: [],
      point: [],
      bridge: [],
      backup: [],
      outro: [],
    }
  );

  const hasAny = parts.length > 0;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Star className="h-6 w-6 mb-2 opacity-30" />
        <p className="text-xs">배정된 파트가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {PART_TYPES_ORDERED.map((type) => {
        const typeParts = grouped[type];
        if (typeParts.length === 0) return null;
        return (
          <div key={type}>
            <div className="flex items-center gap-1.5 mb-1">
              <PartTypeBadge partType={type} />
              <span className="text-[10px] text-muted-foreground">
                {typeParts.length}명
              </span>
            </div>
            <div className="ml-1">
              {typeParts.map((part) => (
                <PartItem
                  key={part.id}
                  part={part}
                  canEdit={canEdit}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 멤버별 뷰
// ============================================

interface PartsByMemberViewProps {
  parts: SongPartWithProfile[];
  canEdit: boolean;
  onRemove: (partId: string) => void;
}

function PartsByMemberView({ parts, canEdit, onRemove }: PartsByMemberViewProps) {
  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Users className="h-6 w-6 mb-2 opacity-30" />
        <p className="text-xs">배정된 파트가 없습니다</p>
      </div>
    );
  }

  // 멤버별 그룹화
  const memberMap = new Map<
    string,
    { name: string; parts: SongPartWithProfile[] }
  >();
  for (const part of parts) {
    const existing = memberMap.get(part.user_id);
    if (existing) {
      existing.parts.push(part);
    } else {
      memberMap.set(part.user_id, {
        name: part.profiles?.name ?? "알 수 없음",
        parts: [part],
      });
    }
  }

  return (
    <div className="space-y-3">
      {Array.from(memberMap.entries()).map(([userId, { name, parts: memberParts }]) => (
        <div key={userId}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium">{name}</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {memberParts.length}
            </Badge>
          </div>
          <div className="ml-1 space-y-0.5">
            {memberParts.map((part) => (
              <PartItem
                key={part.id}
                part={part}
                canEdit={canEdit}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 Sheet 컴포넌트
// ============================================

export interface SongPartAssignmentProps {
  songId: string;
  songTitle: string;
  songArtist?: string | null;
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}

export function SongPartAssignment({
  songId,
  songTitle,
  songArtist,
  groupId,
  open,
  onOpenChange,
  canEdit,
}: SongPartAssignmentProps) {
  const { parts, loading, assignPart, removePart } = useSongParts(
    open ? songId : null
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"type" | "member">("type");

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[360px] sm:w-[420px] flex flex-col p-0"
        >
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Music className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="truncate leading-tight">{songTitle}</span>
                {songArtist && (
                  <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                    {songArtist}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground font-normal ml-1 shrink-0">
                파트 배정표
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* 툴바: 뷰 전환 + 추가 버튼 */}
          <div className="px-4 py-2 border-b shrink-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "type" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setViewMode("type")}
              >
                <Star className="h-3 w-3 mr-1" />
                파트별
              </Button>
              <Button
                variant={viewMode === "member" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setViewMode("member")}
              >
                <Users className="h-3 w-3 mr-1" />
                멤버별
              </Button>
            </div>

            {canEdit && (
              <Button
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                파트 추가
              </Button>
            )}
          </div>

          {/* 파트 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "type" ? (
              <PartsByTypeView
                parts={parts}
                canEdit={canEdit}
                onRemove={removePart}
              />
            ) : (
              <PartsByMemberView
                parts={parts}
                canEdit={canEdit}
                onRemove={removePart}
              />
            )}
          </div>

          {/* 하단 요약 */}
          {parts.length > 0 && (
            <div className="px-4 py-2 border-t shrink-0">
              <p className="text-[10px] text-muted-foreground">
                총 {parts.length}개 파트 배정
                {" · "}
                {new Set(parts.map((p) => p.user_id)).size}명 참여
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 파트 추가 Dialog */}
      <AssignDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        songId={songId}
        groupId={groupId}
        onAssign={assignPart}
      />
    </>
  );
}
