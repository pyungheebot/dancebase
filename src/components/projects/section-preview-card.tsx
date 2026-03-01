/**
 * 섹션 미리보기 카드 컴포넌트
 *
 * 관객에게 실제로 보여질 형태로 섹션을 렌더링한다.
 * FAQ는 접기/펼치기 아코디언으로 표시된다.
 */

"use client";

import React, { useState, memo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionTypeBadge } from "./audience-guide-types";
import { FAQPreviewItem } from "./faq-edit-item";
import type { AudienceGuideSection } from "@/types";

// ============================================================
// 컴포넌트
// ============================================================

/** 관객 안내 섹션 미리보기 카드 (기본 펼쳐진 상태) */
export const SectionPreviewCard = memo(function SectionPreviewCard({
  section,
}: {
  section: AudienceGuideSection;
}) {
  // 기본값: 펼쳐진 상태로 표시
  const [open, setOpen] = useState(true);

  // order 기준 정렬된 FAQ 목록
  const sortedFaqs = [...section.faqs].sort((a, b) => a.order - b.order);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors rounded-lg"
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <SectionTypeBadge type={section.type} />
            <span className="text-sm font-medium flex-1 text-left">
              {section.title}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3 border-t pt-2 space-y-2">
            {/* 섹션 본문 텍스트 */}
            {section.content && (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            )}

            {/* FAQ 아코디언 목록 */}
            {sortedFaqs.length > 0 && (
              <div className="space-y-0.5 mt-1">
                {sortedFaqs.map((faq) => (
                  <FAQPreviewItem key={faq.id} faq={faq} />
                ))}
              </div>
            )}

            {/* 내용 없음 안내 */}
            {!section.content && sortedFaqs.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                내용이 없습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
