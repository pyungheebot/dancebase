"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Mic,
  User,
  Users,
  Star,
} from "lucide-react";
import type {
  ShowProgramPiece,
  ShowProgramCredit,
  ShowProgramCreditRole,
  ShowProgramSponsor,
} from "@/types";

// ============================================================
// 상수 (Row 컴포넌트에서 사용)
// ============================================================

export const CREDIT_ROLE_LABELS: Record<ShowProgramCreditRole, string> = {
  director: "연출",
  choreographer: "안무",
  music: "음악/음향",
  lighting: "조명",
  costume: "의상",
  makeup: "메이크업",
  stage: "무대 감독",
  photography: "사진/영상",
  design: "디자인",
  sponsor: "후원",
  other: "기타",
};

export const CREDIT_ROLE_OPTIONS: ShowProgramCreditRole[] = [
  "director",
  "choreographer",
  "music",
  "lighting",
  "costume",
  "makeup",
  "stage",
  "photography",
  "design",
  "sponsor",
  "other",
];

export const CREDIT_ROLE_COLORS: Record<ShowProgramCreditRole, string> = {
  director: "bg-purple-100 text-purple-700 border-purple-300",
  choreographer: "bg-pink-100 text-pink-700 border-pink-300",
  music: "bg-blue-100 text-blue-700 border-blue-300",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-300",
  costume: "bg-orange-100 text-orange-700 border-orange-300",
  makeup: "bg-rose-100 text-rose-700 border-rose-300",
  stage: "bg-gray-100 text-gray-700 border-gray-300",
  photography: "bg-cyan-100 text-cyan-700 border-cyan-300",
  design: "bg-indigo-100 text-indigo-700 border-indigo-300",
  sponsor: "bg-green-100 text-green-700 border-green-300",
  other: "bg-muted text-muted-foreground border-border",
};

// ============================================================
// 프로그램 순서 행 컴포넌트
// ============================================================

export function PieceRow({
  piece,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  piece: ShowProgramPiece;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      {/* 순서 번호 */}
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 border-2 border-violet-400 text-[9px] font-bold text-violet-700 flex-shrink-0 mt-0.5">
        {piece.order}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-medium">
          {piece.title}
          {piece.subtitle && (
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              — {piece.subtitle}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {piece.choreographer && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Mic className="h-2.5 w-2.5" />
              {piece.choreographer}
            </span>
          )}
          {piece.performers.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {piece.performers.length === 1 ? (
                <User className="h-2.5 w-2.5" />
              ) : (
                <Users className="h-2.5 w-2.5" />
              )}
              {piece.performers.join(", ")}
            </span>
          )}
          {piece.duration && (
            <span className="text-[10px] text-muted-foreground">
              {piece.duration}
            </span>
          )}
        </div>

        {piece.notes && (
          <p className="text-[10px] text-muted-foreground">{piece.notes}</p>
        )}
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 크레딧 행 컴포넌트
// ============================================================

export function CreditRow({
  credit,
  onEdit,
  onDelete,
}: {
  credit: ShowProgramCredit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const label =
    credit.role === "other"
      ? (credit.roleLabel ?? "기타")
      : CREDIT_ROLE_LABELS[credit.role];
  const colorClass = CREDIT_ROLE_COLORS[credit.role];

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      <Badge className={`text-[9px] px-1.5 py-0 border flex-shrink-0 ${colorClass}`}>
        {label}
      </Badge>
      <p className="flex-1 text-xs min-w-0 truncate">
        {credit.names.join(", ")}
      </p>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 스폰서 행 컴포넌트
// ============================================================

export function SponsorRow({
  sponsor,
  onEdit,
  onDelete,
}: {
  sponsor: ShowProgramSponsor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      <Star className="h-3 w-3 text-green-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {sponsor.name}
          {sponsor.tier && (
            <Badge className="ml-1 text-[9px] px-1.5 py-0 bg-green-100 text-green-700 border border-green-300">
              {sponsor.tier}
            </Badge>
          )}
        </p>
        {sponsor.description && (
          <p className="text-[10px] text-muted-foreground truncate">
            {sponsor.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}
