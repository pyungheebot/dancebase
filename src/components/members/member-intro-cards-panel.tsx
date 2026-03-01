"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Music,
  MessageSquareQuote,
  Heart,
  User,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMemberIntroCard, validateIntroCard } from "@/hooks/use-member-intro-card";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { MemberIntroCardV2 } from "@/types";

// ============================================
// 장르 배지 색상 팔레트
// ============================================

const GENRE_COLORS = [
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

function genreColor(index: number): string {
  return GENRE_COLORS[index % GENRE_COLORS.length];
}

// ============================================
// Props
// ============================================

type Props = {
  groupId: string;
  userId: string;
  nickname: string;
  /** 내 카드인지 여부 (편집 허용) */
  isOwner?: boolean;
  /** 기본 펼침 여부 */
  defaultOpen?: boolean;
};

// ============================================
// 편집 폼 상태
// ============================================

type EditState = {
  nickname: string;
  danceExperience: string;
  favoriteGenres: string[];
  motto: string;
  joinReason: string;
};

function defaultEditState(
  card: MemberIntroCardV2 | null,
  nickname: string
): EditState {
  return {
    nickname: card?.nickname ?? nickname,
    danceExperience: card?.danceExperience ?? "",
    favoriteGenres: card?.favoriteGenres ?? [],
    motto: card?.motto ?? "",
    joinReason: card?.joinReason ?? "",
  };
}

// ============================================
// 메인 컴포넌트
// ============================================

export function MemberIntroCardsPanel({
  groupId,
  userId,
  nickname,
  isOwner = false,
  defaultOpen = false,
}: Props) {
  const { intro, loaded, saveIntro, clearIntro } = useMemberIntroCard(
    groupId,
    userId
  );

  const [open, setOpen] = useState(defaultOpen);
  const [editMode, setEditMode] = useState(false);
  const [editState, setEditState] = useState<EditState>(() =>
    defaultEditState(null, nickname)
  );
  const [genreInput, setGenreInput] = useState("");
  const genreInputRef = useRef<HTMLInputElement>(null);

  // 편집 시작
  const handleStartEdit = () => {
    setEditState(defaultEditState(intro, nickname));
    setGenreInput("");
    setEditMode(true);
    setOpen(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditMode(false);
    setGenreInput("");
  };

  // 저장
  const handleSave = () => {
    const card: MemberIntroCardV2 = {
      userId,
      nickname: editState.nickname.trim() || nickname,
      danceExperience: editState.danceExperience.trim(),
      favoriteGenres: editState.favoriteGenres,
      motto: editState.motto.trim(),
      joinReason: editState.joinReason.trim(),
      updatedAt: new Date().toISOString(),
    };

    const validationError = validateIntroCard(card);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (
      !card.danceExperience &&
      card.favoriteGenres.length === 0 &&
      !card.motto &&
      !card.joinReason
    ) {
      toast.error("최소 한 가지 항목을 입력해주세요");
      return;
    }

    const error = saveIntro(card);
    if (error) {
      toast.error(error);
      return;
    }

    toast.success("자기소개 카드가 저장되었습니다");
    setEditMode(false);
    setGenreInput("");
  };

  // 장르 추가 (Enter)
  const handleGenreKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addGenre();
    }
  };

  const addGenre = () => {
    const value = genreInput.trim();
    if (!value) return;
    if (editState.favoriteGenres.length >= 3) {
      toast.error("장르는 최대 3개까지 입력할 수 있습니다");
      return;
    }
    if (editState.favoriteGenres.includes(value)) {
      toast.error("이미 추가된 장르입니다");
      setGenreInput("");
      return;
    }
    setEditState((prev) => ({
      ...prev,
      favoriteGenres: [...prev.favoriteGenres, value],
    }));
    setGenreInput("");
    genreInputRef.current?.focus();
  };

  const removeGenre = (genre: string) => {
    setEditState((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.filter((g) => g !== genre),
    }));
  };

  // 카드 삭제
  const handleClear = () => {
    clearIntro();
    toast.success("자기소개 카드가 삭제되었습니다");
    setEditMode(false);
  };

  const hasCard = !!intro;
  const displayNickname = intro?.nickname ?? nickname;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 트리거 */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 flex-1 text-left">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{displayNickname}</span>
            {hasCard && !editMode && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border border-green-200">
                작성완료
              </Badge>
            )}
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            )}
          </button>
        </CollapsibleTrigger>

        {isOwner && !editMode && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2 ml-2"
            onClick={handleStartEdit}
          >
            <Pencil className="h-3 w-3 mr-1" />
            {hasCard ? "수정" : "작성"}
          </Button>
        )}
      </div>

      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-card px-4 py-3">
          {!loaded ? (
            /* 로딩 상태 */
            <p className="text-xs text-muted-foreground py-2">불러오는 중...</p>
          ) : editMode ? (
            /* ===== 편집 모드 ===== */
            <div className="space-y-4">
              {/* 닉네임 */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  닉네임
                </Label>
                <Input
                  value={editState.nickname}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  placeholder={nickname}
                  className="h-7 text-xs"
                  maxLength={30}
                />
              </div>

              {/* 댄스 경력 */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-rose-500" />
                  댄스 경력
                </Label>
                <Input
                  value={editState.danceExperience}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      danceExperience: e.target.value,
                    }))
                  }
                  placeholder="예: 3년, 초보, 6개월..."
                  className="h-7 text-xs"
                  maxLength={20}
                />
              </div>

              {/* 좋아하는 장르 */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Music className="h-3 w-3 text-purple-500" />
                  좋아하는 장르
                  <span className="text-muted-foreground font-normal">
                    ({editState.favoriteGenres.length}/3)
                  </span>
                </Label>

                {/* 추가된 장르 태그 */}
                {editState.favoriteGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {editState.favoriteGenres.map((genre, i) => (
                      <span
                        key={genre}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${genreColor(i)}`}
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="hover:opacity-70"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 장르 입력 */}
                {editState.favoriteGenres.length < 3 && (
                  <div className="flex gap-1">
                    <Input
                      ref={genreInputRef}
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={handleGenreKeyDown}
                      placeholder="장르 입력 후 Enter"
                      className="h-7 text-xs"
                      maxLength={15}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={addGenre}
                    >
                      추가
                    </Button>
                  </div>
                )}
              </div>

              {/* 한마디 */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <MessageSquareQuote className="h-3 w-3 text-sky-500" />
                  한마디
                </Label>
                <Input
                  value={editState.motto}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      motto: e.target.value,
                    }))
                  }
                  placeholder="팀원들에게 한마디! (최대 50자)"
                  className="h-7 text-xs"
                  maxLength={50}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {editState.motto.length}/50
                </p>
              </div>

              {/* 가입 이유 */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-orange-500" />
                  가입 이유
                </Label>
                <Textarea
                  value={editState.joinReason}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      joinReason: e.target.value,
                    }))
                  }
                  placeholder="이 그룹에 합류하게 된 이유를 알려주세요 (최대 100자)"
                  className="text-xs resize-none min-h-[64px]"
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {editState.joinReason.length}/100
                </p>
              </div>

              {/* 편집 액션 버튼 */}
              <div className="flex items-center justify-between pt-1">
                {hasCard && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleClear}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    삭제
                  </Button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleCancelEdit}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSave}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : !hasCard ? (
            /* ===== 카드 없음 ===== */
            <div className="flex flex-col items-center gap-3 py-5">
              <User className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center">
                아직 자기소개를 작성하지 않았습니다
              </p>
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  작성하기
                </Button>
              )}
            </div>
          ) : (
            /* ===== 보기 모드 ===== */
            <ViewCard card={intro} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// 보기 모드 카드
// ============================================

function ViewCard({ card }: { card: MemberIntroCardV2 }) {
  return (
    <div className="space-y-3">
      {/* 상단: 닉네임 + 경력 배지 */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{card.nickname}</span>
        {card.danceExperience && (
          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border border-blue-200">
            {card.danceExperience}
          </Badge>
        )}
      </div>

      {/* 중단: 장르 태그들 */}
      {card.favoriteGenres.length > 0 && (
        <>
          <Separator className="my-1" />
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Music className="h-3 w-3 text-purple-500" />
              좋아하는 장르
            </p>
            <div className="flex flex-wrap gap-1.5 pl-4">
              {card.favoriteGenres.map((genre, i) => (
                <span
                  key={genre}
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${genreColor(i)}`}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 하단: 한마디 + 가입 이유 */}
      {(card.motto || card.joinReason) && (
        <>
          <Separator className="my-1" />
          <div className="space-y-2.5">
            {card.motto && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MessageSquareQuote className="h-3 w-3 text-sky-500" />
                  한마디
                </p>
                <blockquote className="pl-3 border-l-2 border-sky-300 text-xs text-sky-800 italic leading-relaxed">
                  {card.motto}
                </blockquote>
              </div>
            )}

            {card.joinReason && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3 text-orange-500" />
                  가입 이유
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground pl-4">
                  {card.joinReason}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* 마지막 수정일 */}
      <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
        {formatYearMonthDay(card.updatedAt)} 업데이트
      </p>
    </div>
  );
}
