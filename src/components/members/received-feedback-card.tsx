"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Star,
  Heart,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import {
  useAnonymousFeedback,
  CATEGORY_LABELS,
} from "@/hooks/use-anonymous-feedback";
import type { FeedbackCategory } from "@/types";

// ============================================
// 카테고리 스타일/아이콘 매핑
// ============================================

const CATEGORY_CONFIG: Record<
  FeedbackCategory,
  {
    badge: string;
    icon: React.ReactNode;
    dot: string;
  }
> = {
  praise: {
    badge: "bg-green-100 text-green-700 hover:bg-green-100 border-0",
    icon: <Star className="h-2.5 w-2.5" />,
    dot: "bg-green-400",
  },
  encouragement: {
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-0",
    icon: <Heart className="h-2.5 w-2.5" />,
    dot: "bg-blue-400",
  },
  improvement: {
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-0",
    icon: <TrendingUp className="h-2.5 w-2.5" />,
    dot: "bg-orange-400",
  },
  other: {
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100 border-0",
    icon: <MoreHorizontal className="h-2.5 w-2.5" />,
    dot: "bg-gray-400",
  },
};

const CATEGORY_ORDER: FeedbackCategory[] = [
  "praise",
  "encouragement",
  "improvement",
  "other",
];

// ============================================
// Props
// ============================================

type ReceivedFeedbackCardProps = {
  groupId: string;
  userId: string;
  defaultOpen?: boolean;
};

// ============================================
// 컴포넌트
// ============================================

export function ReceivedFeedbackCard({
  groupId,
  userId,
  defaultOpen = false,
}: ReceivedFeedbackCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const { getReceivedFeedbacks, getCategoryDistribution, loading } =
    useAnonymousFeedback(groupId);

  const feedbacks = getReceivedFeedbacks(userId);
  const distribution = getCategoryDistribution(userId);
  const total = feedbacks.length;

  if (loading) {
    return (
      <Card className="border shadow-none">
        <CardHeader className="px-4 py-3">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border shadow-none">
        {/* 헤더 (항상 표시) */}
        <CollapsibleTrigger asChild>
          <CardHeader className="px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">받은 피드백</span>
                {total > 0 && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] px-1.5 py-0">
                    {total}
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>

            {/* 카테고리별 분포 요약 (헤더에서도 보임) */}
            {total > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORY_ORDER.map((cat) => {
                  const count = distribution[cat];
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={cat}
                      className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${CATEGORY_CONFIG[cat].badge}`}
                    >
                      {CATEGORY_CONFIG[cat].icon}
                      <span className="ml-0.5">
                        {CATEGORY_LABELS[cat]} {count}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        {/* 펼쳐지는 피드백 목록 */}
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            {total === 0 ? (
              <div className="py-8 text-center">
                <MessageCircle className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  아직 받은 피드백이 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-1">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg border px-3 py-2.5 space-y-1.5"
                  >
                    {/* 카테고리 + 날짜 */}
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${CATEGORY_CONFIG[fb.category].badge}`}
                      >
                        {CATEGORY_CONFIG[fb.category].icon}
                        <span className="ml-0.5">
                          {CATEGORY_LABELS[fb.category]}
                        </span>
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* 피드백 내용 */}
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {fb.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
