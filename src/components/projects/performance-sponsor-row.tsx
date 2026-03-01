"use client";

// ============================================================
// 공연 후원/스폰서 관리 — 스폰서 행 컴포넌트
// ============================================================

import { memo, useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Package,
  Star,
  Award,
  BadgeCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PerfSponsorEntry } from "@/types";
import {
  TIER_LABELS,
  TIER_BADGE_CLASS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
  formatKRW,
} from "./performance-sponsor-types";

// ── 상태 아이콘 맵 ─────────────────────────────────────────

const STATUS_ICONS = {
  confirmed: <BadgeCheck className="h-3 w-3" aria-hidden="true" />,
  pending: <Clock className="h-3 w-3" aria-hidden="true" />,
  declined: <XCircle className="h-3 w-3" aria-hidden="true" />,
} as const;

// ── 스폰서 행 ──────────────────────────────────────────────

interface SponsorRowProps {
  sponsor: PerfSponsorEntry;
  onEdit: (sponsor: PerfSponsorEntry) => void;
  onDelete: (id: string) => void;
}

export const SponsorRow = memo(function SponsorRow({
  sponsor,
  onEdit,
  onDelete,
}: SponsorRowProps) {
  const [open, setOpen] = useState(false);
  const collapsibleId = `sponsor-detail-${sponsor.id}`;

  return (
    <li>
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
            role="button"
            aria-expanded={open}
            aria-controls={collapsibleId}
            aria-label={`${sponsor.name} 상세 정보 ${open ? "접기" : "펼치기"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {sponsor.name}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${TIER_BADGE_CLASS[sponsor.tier]}`}
                >
                  {TIER_LABELS[sponsor.tier]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${STATUS_BADGE_CLASS[sponsor.status]}`}
                >
                  {STATUS_ICONS[sponsor.status]}
                  <span>{STATUS_LABELS[sponsor.status]}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatKRW(sponsor.amount)}
                {sponsor.inKind && (
                  <span className="ml-1.5 text-[10px] text-cyan-600">
                    + 현물 후원
                  </span>
                )}
              </p>
            </div>
            <div
              className="flex items-center gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label={`${sponsor.name} 수정`}
                onClick={() => onEdit(sponsor)}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                aria-label={`${sponsor.name} 삭제`}
                onClick={() => onDelete(sponsor.id)}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
              {open ? (
                <ChevronUp
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent id={collapsibleId}>
          <div className="px-3 pb-3 pt-1 border-t bg-muted/20 space-y-2 text-xs text-muted-foreground">
            {sponsor.contactPerson && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span>{sponsor.contactPerson}</span>
                {sponsor.contactEmail && (
                  <>
                    <Mail
                      className="h-3 w-3 flex-shrink-0 ml-1"
                      aria-hidden="true"
                    />
                    <a
                      href={`mailto:${sponsor.contactEmail}`}
                      className="truncate hover:underline"
                    >
                      {sponsor.contactEmail}
                    </a>
                  </>
                )}
              </div>
            )}
            {sponsor.inKind && (
              <div className="flex items-start gap-1.5">
                <Package
                  className="h-3 w-3 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>현물: {sponsor.inKind}</span>
              </div>
            )}
            {sponsor.logoPlacement && (
              <div className="flex items-start gap-1.5">
                <Star
                  className="h-3 w-3 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>로고 위치: {sponsor.logoPlacement}</span>
              </div>
            )}
            {sponsor.benefits.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Award
                  className="h-3 w-3 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <ul
                  className="flex flex-wrap gap-1"
                  role="list"
                  aria-label="제공 혜택"
                >
                  {sponsor.benefits.map((b, i) => (
                    <li
                      key={i}
                      role="listitem"
                      className="bg-muted border rounded px-1.5 py-0.5 text-[10px]"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sponsor.notes && (
              <p className="text-[10px] leading-relaxed text-muted-foreground border-t pt-1.5 mt-1.5">
                {sponsor.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
    </li>
  );
});
