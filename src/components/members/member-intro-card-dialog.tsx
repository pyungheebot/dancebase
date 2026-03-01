"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {User, Pencil, Music, Star, MessageCircle} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMemberIntroCards } from "@/hooks/use-member-intro-cards";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { MemberIntroCard } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: "leader" | "sub_leader" | "member";
  currentUserId: string;
};

const ROLE_LABELS: Record<string, string> = {
  leader: "그룹장",
  sub_leader: "부그룹장",
  member: "멤버",
};

export function MemberIntroCardDialog({
  open,
  onOpenChange,
  groupId,
  targetUserId,
  targetUserName,
  targetUserRole,
  currentUserId,
}: Props) {
  const { getCard, saveCard } = useMemberIntroCards(groupId);
  const card = getCard(targetUserId);
  const isMe = targetUserId === currentUserId;

  const [editMode, setEditMode] = useState(false);
  const [joinReason, setJoinReason] = useState(card?.joinReason ?? "");
  const [mainPart, setMainPart] = useState(card?.mainPart ?? "");
  const [favoriteGenre, setFavoriteGenre] = useState(card?.favoriteGenre ?? "");
  const [oneWord, setOneWord] = useState(card?.oneWord ?? "");

  const handleOpenEditMode = () => {
    setJoinReason(card?.joinReason ?? "");
    setMainPart(card?.mainPart ?? "");
    setFavoriteGenre(card?.favoriteGenre ?? "");
    setOneWord(card?.oneWord ?? "");
    setEditMode(true);
  };

  const handleSave = () => {
    if (!joinReason.trim() && !mainPart.trim() && !favoriteGenre.trim() && !oneWord.trim()) {
      toast.error(TOAST.MEMBERS.INTRO_CARD_DIALOG_MIN_REQUIRED);
      return;
    }
    const newCard: MemberIntroCard = {
      userId: targetUserId,
      userName: targetUserName,
      joinReason: joinReason.trim(),
      mainPart: mainPart.trim(),
      favoriteGenre: favoriteGenre.trim(),
      oneWord: oneWord.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveCard(newCard);
    toast.success(TOAST.MEMBERS.INTRO_CARD_DIALOG_SAVED);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEditMode(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-sm">
        {/* 헤더 */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{targetUserName}</span>
            <Badge
              variant={
                targetUserRole === "leader"
                  ? "default"
                  : targetUserRole === "sub_leader"
                  ? "outline"
                  : "secondary"
              }
              className={
                targetUserRole === "sub_leader"
                  ? "text-[10px] px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50"
                  : "text-[10px] px-1.5 py-0"
              }
            >
              {ROLE_LABELS[targetUserRole] ?? "멤버"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {editMode ? (
          /* 편집 모드 */
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Star className="h-3 w-3 text-yellow-500" />
                입단 계기
              </Label>
              <Textarea
                value={joinReason}
                onChange={(e) => setJoinReason(e.target.value)}
                placeholder="이 그룹에 들어오게 된 계기를 알려주세요"
                maxLength={200}
                className="text-xs resize-none min-h-[72px]"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {joinReason.length}/200
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Pencil className="h-3 w-3 text-blue-500" />
                담당 파트
              </Label>
              <Input
                value={mainPart}
                onChange={(e) => setMainPart(e.target.value)}
                placeholder="포인트, 백댄서 등"
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Music className="h-3 w-3 text-purple-500" />
                좋아하는 장르
              </Label>
              <Input
                value={favoriteGenre}
                onChange={(e) => setFavoriteGenre(e.target.value)}
                placeholder="힙합, K-pop 등"
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <MessageCircle className="h-3 w-3 text-green-500" />
                한마디
              </Label>
              <Input
                value={oneWord}
                onChange={(e) => setOneWord(e.target.value)}
                placeholder="팀원들에게 한마디!"
                maxLength={100}
                className="h-7 text-xs"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {oneWord.length}/100
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          </div>
        ) : (
          /* 보기 모드 */
          <div className="mt-2">
            {!card ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <User className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground text-center">
                  아직 자기소개를 작성하지 않았습니다
                </p>
                {isMe && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleOpenEditMode}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    작성하기
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <IntroItem
                  icon={<Star className="h-3 w-3 text-yellow-500" />}
                  label="입단 계기"
                  value={card.joinReason}
                />
                <IntroItem
                  icon={<Pencil className="h-3 w-3 text-blue-500" />}
                  label="담당 파트"
                  value={card.mainPart}
                />
                <IntroItem
                  icon={<Music className="h-3 w-3 text-purple-500" />}
                  label="좋아하는 장르"
                  value={card.favoriteGenre}
                />
                <IntroItem
                  icon={<MessageCircle className="h-3 w-3 text-green-500" />}
                  label="한마디"
                  value={card.oneWord}
                />

                {isMe && (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleOpenEditMode}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      수정
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground text-right">
                  마지막 수정:{" "}
                  {formatYearMonthDay(card.updatedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 보기 모드 항목 컴포넌트
// ============================================

function IntroItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      {value ? (
        <p className="text-xs leading-relaxed pl-4">{value}</p>
      ) : (
        <p className="text-xs text-muted-foreground/60 pl-4 italic">미작성</p>
      )}
    </div>
  );
}
