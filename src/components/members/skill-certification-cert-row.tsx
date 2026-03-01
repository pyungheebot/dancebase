"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  CheckSquare,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SKILL_CERT_LEVEL_LABELS,
  SKILL_CERT_LEVEL_COLORS,
} from "@/hooks/use-skill-certification";
import type { CertDefinitionRowProps } from "./skill-certification-types";

// ============================================================
// 인증 정의 행 (React.memo 적용)
// ============================================================

export const CertDefinitionRow = memo(function CertDefinitionRow({
  cert,
  holders,
  onDelete,
  onRevoke,
}: CertDefinitionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const expandId = `cert-detail-${cert.id}`;

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      {/* 헤더 행 */}
      <div
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={expandId}
        aria-label={`${cert.skillName} 인증 상세 ${expanded ? "접기" : "펼치기"}`}
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((p) => !p);
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold">{cert.skillName}</p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {cert.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground" aria-label={`${holders.length}명 보유`}>
              <Users className="inline h-3 w-3 mr-0.5" aria-hidden="true" />
              {holders.length}명 보유
            </span>
          </div>
          {cert.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {cert.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`"${cert.skillName}" 인증 삭제`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* 확장 패널 */}
      {expanded && (
        <div id={expandId} className="border-t px-3 py-2 space-y-3 bg-muted/20">
          {/* 요구사항 체크리스트 */}
          {cert.requirements.length > 0 && (
            <section aria-label="요구사항">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                요구사항
              </p>
              <ul role="list" className="space-y-1">
                {cert.requirements.map((req, i) => (
                  <li key={i} role="listitem" className="flex items-start gap-1.5">
                    <CheckSquare
                      className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-[11px]">{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 보유자 목록 */}
          {holders.length > 0 && (
            <section aria-label={`인증 보유자 ${holders.length}명`}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                인증 보유자 ({holders.length}명)
              </p>
              <ul
                role="list"
                className="flex flex-wrap gap-1.5"
                aria-live="polite"
                aria-atomic="false"
              >
                {holders.map((holder) => (
                  <li
                    key={holder.id}
                    role="listitem"
                    className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5"
                  >
                    <span className="text-[11px]">{holder.memberName}</span>
                    <button
                      type="button"
                      aria-label={`${holder.memberName}님의 인증 취소`}
                      onClick={() => onRevoke(holder.id, holder.memberName)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-2.5 w-2.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================
// 멤버별 보유 인증 아이템
// ============================================================

interface MemberCertItemProps {
  awardId: string;
  memberName: string;
  skillName: string;
  category: string;
  level: import("@/types").SkillCertLevel;
  certifiedBy: string;
  certifiedAt: string;
  notes?: string;
  onRevoke: (awardId: string, memberName: string, skillName: string) => void;
}

export const MemberCertItem = memo(function MemberCertItem({
  awardId,
  memberName,
  skillName,
  category,
  level,
  certifiedBy,
  certifiedAt,
  notes,
  onRevoke,
}: MemberCertItemProps) {
  const colors = SKILL_CERT_LEVEL_COLORS[level];

  return (
    <div
      role="listitem"
      className="flex items-start justify-between rounded-md border bg-background px-3 py-2 gap-2"
    >
      <div className="flex items-start gap-2 min-w-0">
        <Badge
          className={`text-[10px] px-1.5 py-0 border shrink-0 mt-0.5 ${colors.badge}`}
          aria-label={`레벨: ${SKILL_CERT_LEVEL_LABELS[level]}`}
        >
          {SKILL_CERT_LEVEL_LABELS[level]}
        </Badge>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{skillName}</p>
          <p className="text-[10px] text-muted-foreground">
            {category} · 인증자: {certifiedBy} · {certifiedAt.slice(0, 10)}
          </p>
          {notes && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{notes}</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`${memberName}님의 "${skillName}" 인증 취소`}
        onClick={() => onRevoke(awardId, memberName, skillName)}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
});
