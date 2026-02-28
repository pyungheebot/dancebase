"use client";

import { useState } from "react";
import {
  User,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Target,
  Sparkles,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemberDanceStyleProfile } from "@/hooks/use-dance-style-profile";
import type { DanceStyleEntry, DanceStyleLevel, MemberDanceStyleProfile } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 상수 정의
// ============================================================

const LEVEL_META: Record<
  DanceStyleLevel,
  { label: string; color: string }
> = {
  beginner: {
    label: "입문",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  intermediate: {
    label: "중급",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  advanced: {
    label: "고급",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  expert: {
    label: "전문가",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const LEVEL_ORDER: DanceStyleLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

// ============================================================
// 스타일 추가/편집 다이얼로그
// ============================================================

interface StyleDialogProps {
  initial?: DanceStyleEntry;
  existingStyles: string[];
  onSave: (entry: DanceStyleEntry) => Promise<void>;
  trigger: React.ReactNode;
}

function StyleDialog({ initial, existingStyles, onSave, trigger }: StyleDialogProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(initial?.style ?? "");
  const [level, setLevel] = useState<DanceStyleLevel>(initial?.level ?? "beginner");
  const [years, setYears] = useState(initial?.yearsOfExperience ?? 0);
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = style.trim();
    if (!trimmed) {
      toast.error("댄스 스타일 이름을 입력해주세요.");
      return;
    }
    if (!initial && existingStyles.includes(trimmed)) {
      toast.error("이미 추가된 스타일입니다.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ style: trimmed, level, yearsOfExperience: years, isFavorite });
      toast.success(initial ? "스타일이 수정되었습니다." : "스타일이 추가되었습니다.");
      setOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpen(value: boolean) {
    if (value) {
      setStyle(initial?.style ?? "");
      setLevel(initial?.level ?? "beginner");
      setYears(initial?.yearsOfExperience ?? 0);
      setIsFavorite(initial?.isFavorite ?? false);
    }
    setOpen(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "스타일 수정" : "댄스 스타일 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">스타일 이름</Label>
            <Input
              placeholder="예: 힙합, 재즈, 팝핀..."
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={!!initial}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수준</Label>
            <Select
              value={level}
              onValueChange={(v) => setLevel(v as DanceStyleLevel)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_ORDER.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {LEVEL_META[l].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">경력 (년)</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFavorite((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-500 transition-colors"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite ? "fill-amber-400 text-amber-400" : ""
                )}
              />
              {isFavorite ? "즐겨찾기 해제" : "즐겨찾기 설정"}
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로필 편집 다이얼로그
// ============================================================

interface ProfileEditDialogProps {
  memberId: string;
  trigger: React.ReactNode;
}

function ProfileEditDialog({ memberId, trigger }: ProfileEditDialogProps) {
  const {
    profile,
    saveProfile,
    addStrength,
    removeStrength,
    addWeakness,
    removeWeakness,
    addGoal,
    removeGoal,
    addInfluence,
    removeInfluence,
  } = useMemberDanceStyleProfile(memberId);

  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [strengthInput, setStrengthInput] = useState("");
  const [weaknessInput, setWeaknessInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [influenceInput, setInfluenceInput] = useState("");
  const [saving, setSaving] = useState(false);

  function handleOpen(value: boolean) {
    if (value) {
      setBio(profile.bio ?? "");
    }
    setOpen(value);
  }

  async function handleSaveBio() {
    setSaving(true);
    try {
      await saveProfile({ bio });
      toast.success("자기소개가 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTag(
    value: string,
    adder: (v: string) => Promise<void>,
    setter: (v: string) => void
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await adder(trimmed);
      setter("");
    } catch {
      toast.error("추가에 실패했습니다.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">프로필 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 자기소개 */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">자기소개</Label>
            <Textarea
              placeholder="댄스 스타일과 철학을 소개해주세요..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="text-xs min-h-[72px] resize-none"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleSaveBio}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>

          {/* 강점 */}
          <TagEditor
            label="강점"
            tags={profile.strengths}
            input={strengthInput}
            onInputChange={setStrengthInput}
            onAdd={() => handleAddTag(strengthInput, addStrength, setStrengthInput)}
            onRemove={removeStrength}
            tagColor="bg-green-100 text-green-700 border-green-200"
            placeholder="예: 음악 감각, 리듬감..."
          />

          {/* 약점 */}
          <TagEditor
            label="약점 / 개선 포인트"
            tags={profile.weaknesses}
            input={weaknessInput}
            onInputChange={setWeaknessInput}
            onAdd={() => handleAddTag(weaknessInput, addWeakness, setWeaknessInput)}
            onRemove={removeWeakness}
            tagColor="bg-red-100 text-red-700 border-red-200"
            placeholder="예: 유연성, 표현력..."
          />

          {/* 목표 */}
          <TagEditor
            label="목표"
            tags={profile.goals}
            input={goalInput}
            onInputChange={setGoalInput}
            onAdd={() => handleAddTag(goalInput, addGoal, setGoalInput)}
            onRemove={removeGoal}
            tagColor="bg-blue-100 text-blue-700 border-blue-200"
            placeholder="예: 전국 대회 입상..."
          />

          {/* 영향 받은 댄서 */}
          <TagEditor
            label="영향 받은 댄서"
            tags={profile.influences}
            input={influenceInput}
            onInputChange={setInfluenceInput}
            onAdd={() => handleAddTag(influenceInput, addInfluence, setInfluenceInput)}
            onRemove={removeInfluence}
            tagColor="bg-purple-100 text-purple-700 border-purple-200"
            placeholder="예: Michael Jackson..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 태그 편집기 (재사용 내부 컴포넌트)
// ============================================================

interface TagEditorProps {
  label: string;
  tags: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => Promise<void>;
  tagColor: string;
  placeholder?: string;
}

function TagEditor({
  label,
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  tagColor,
  placeholder,
}: TagEditorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-1.5">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          className="h-7 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 pr-0.5 flex items-center gap-0.5", tagColor)}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceStyleProfileCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(true);
  const {
    profile,
    addStyle,
    removeStyle,
    updateStyle,
    toggleStyleFavorite,
    stats,
  } = useMemberDanceStyleProfile(memberId);

  async function handleRemoveStyle(styleName: string) {
    try {
      await removeStyle(styleName);
      toast.success(`"${styleName}" 스타일을 삭제했습니다.`);
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleToggleFavorite(styleName: string) {
    try {
      await toggleStyleFavorite(styleName);
    } catch {
      toast.error("즐겨찾기 변경에 실패했습니다.");
    }
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  댄스 스타일 프로필
                </CardTitle>
                {stats.totalStyles > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
                  >
                    {stats.totalStyles}개 스타일
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            {stats.totalStyles > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatChip
                  label="전체 스타일"
                  value={`${stats.totalStyles}개`}
                  color="text-indigo-600"
                />
                <StatChip
                  label="전문가 레벨"
                  value={`${stats.expertStyles}개`}
                  color="text-amber-600"
                />
                <StatChip
                  label="평균 경력"
                  value={`${stats.averageExperience}년`}
                  color="text-green-600"
                />
              </div>
            )}

            {/* 댄스 스타일 목록 */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  댄스 스타일
                </span>
                <StyleDialog
                  existingStyles={profile.styles.map((s) => s.style)}
                  onSave={addStyle}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      추가
                    </Button>
                  }
                />
              </div>

              {profile.styles.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  아직 등록된 댄스 스타일이 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {profile.styles.map((entry) => (
                    <StyleRow
                      key={entry.style}
                      entry={entry}
                      onToggleFavorite={() => handleToggleFavorite(entry.style)}
                      onEdit={(updated) =>
                        updateStyle(entry.style, updated).then(() =>
                          toast.success("스타일이 수정되었습니다.")
                        )
                      }
                      onRemove={() => handleRemoveStyle(entry.style)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 강점 / 약점 */}
            {(profile.strengths.length > 0 || profile.weaknesses.length > 0) && (
              <section className="grid grid-cols-2 gap-3">
                {profile.strengths.length > 0 && (
                  <TagSection
                    label="강점"
                    tags={profile.strengths}
                    tagColor="bg-green-100 text-green-700 border-green-200"
                  />
                )}
                {profile.weaknesses.length > 0 && (
                  <TagSection
                    label="개선 포인트"
                    tags={profile.weaknesses}
                    tagColor="bg-red-100 text-red-700 border-red-200"
                  />
                )}
              </section>
            )}

            {/* 목표 */}
            {profile.goals.length > 0 && (
              <section className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  목표
                </span>
                <ul className="space-y-1">
                  {profile.goals.map((goal) => (
                    <li key={goal} className="flex items-start gap-1.5 text-xs">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 영향 받은 댄서 */}
            {profile.influences.length > 0 && (
              <section className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  영향 받은 댄서
                </span>
                <div className="flex flex-wrap gap-1">
                  {profile.influences.map((influence) => (
                    <Badge
                      key={influence}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {influence}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* 자기소개 */}
            {profile.bio && (
              <section className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  자기소개
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-md px-3 py-2">
                  {profile.bio}
                </p>
              </section>
            )}

            {/* 프로필 편집 버튼 */}
            <div className="flex justify-end pt-1 border-t">
              <ProfileEditDialog
                memberId={memberId}
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    프로필 편집
                  </Button>
                }
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================
// 하위 컴포넌트: 스타일 행
// ============================================================

interface StyleRowProps {
  entry: DanceStyleEntry;
  onToggleFavorite: () => void;
  onEdit: (patch: Partial<DanceStyleEntry>) => void;
  onRemove: () => void;
}

function StyleRow({ entry, onToggleFavorite, onEdit, onRemove }: StyleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleFavorite}
          className="shrink-0 hover:scale-110 transition-transform"
          aria-label="즐겨찾기 토글"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              entry.isFavorite
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
        <span className="text-xs font-medium truncate">{entry.style}</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 shrink-0",
            LEVEL_META[entry.level].color
          )}
        >
          {LEVEL_META[entry.level].label}
        </Badge>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {entry.yearsOfExperience}년
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <StyleDialog
          initial={entry}
          existingStyles={[]}
          onSave={async (updated) => onEdit(updated)}
          trigger={
            <button
              type="button"
              className="p-1 hover:text-blue-600 transition-colors"
              aria-label="스타일 편집"
            >
              <Pencil className="h-3 w-3" />
            </button>
          }
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 hover:text-red-600 transition-colors"
          aria-label="스타일 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 태그 섹션
// ============================================================

function TagSection({
  label,
  tags,
  tagColor,
}: {
  label: string;
  tags: string[];
  tagColor: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0", tagColor)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 통계 칩
// ============================================================

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center rounded-md border bg-muted/20 py-1.5 px-1">
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
