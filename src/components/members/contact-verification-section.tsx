"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useContactVerification } from "@/hooks/use-contact-verification";
import { invalidateContactVerification } from "@/lib/swr/invalidate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Clock, PhoneCall, RefreshCw, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { EntityContext } from "@/types/entity-context";

type ContactVerificationSectionProps = {
  ctx: EntityContext;
};

/**
 * 연락처 재확인 관리 섹션 (리더/서브리더 전용)
 *
 * - "연락처 재확인 요청" 버튼으로 전체 멤버에게 확인 레코드 생성
 * - 확인 완료/미확인 멤버 현황 및 진행률 표시
 * - 미확인 멤버 목록 표시
 */
export function ContactVerificationSection({ ctx }: ContactVerificationSectionProps) {
  const [requesting, setRequesting] = useState(false);

  const { verifications, verifiedCount, totalCount, lastRequestedAt, loading, refetch } =
    useContactVerification(ctx.groupId);

  // 리더 권한 확인
  if (!ctx.permissions.canEdit) return null;

  const handleRequest = async () => {
    setRequesting(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    // 그룹 전체 멤버 user_id 목록
    const memberUserIds = ctx.members.map((m) => m.userId);

    if (memberUserIds.length === 0) {
      toast.error("그룹에 멤버가 없습니다");
      setRequesting(false);
      return;
    }

    const rows = memberUserIds.map((userId) => ({
      group_id: ctx.groupId,
      user_id: userId,
      requested_at: now,
      verified_at: null,
    }));

    const { error } = await supabase.from("contact_verifications").insert(rows);

    setRequesting(false);

    if (error) {
      toast.error("연락처 재확인 요청에 실패했습니다");
      return;
    }

    toast.success(`${memberUserIds.length}명에게 연락처 재확인 요청을 보냈습니다`);
    invalidateContactVerification(ctx.groupId);
    refetch();
  };

  const pendingVerifications = verifications.filter((v) => v.verified_at === null);
  const verifiedVerifications = verifications.filter((v) => v.verified_at !== null);
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="mt-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              연락처 재확인
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleRequest}
              disabled={requesting || loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${requesting ? "animate-spin" : ""}`} />
              {requesting ? "요청 중..." : "재확인 요청"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-xs text-muted-foreground py-1">불러오는 중...</p>
          ) : totalCount === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              아직 재확인 요청이 없습니다. 버튼을 눌러 멤버들에게 연락처 확인을 요청하세요.
            </p>
          ) : (
            <>
              {/* 마지막 요청일 */}
              {lastRequestedAt && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  마지막 요청:{" "}
                  {format(new Date(lastRequestedAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                </p>
              )}

              {/* 진행률 바 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {verifiedCount}/{totalCount}명 확인 완료
                  </span>
                  <span className="text-xs font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 확인 완료 멤버 */}
              {verifiedVerifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">확인 완료</span>
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                      {verifiedVerifications.length}명
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {verifiedVerifications.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px]">
                            {v.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-green-700">{v.profiles?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 미확인 멤버 */}
              {pendingVerifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs font-medium text-red-600">미확인</span>
                    <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                      {pendingVerifications.length}명
                    </Badge>
                  </div>
                  <div className="rounded-lg border divide-y">
                    {pendingVerifications.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 px-3 py-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="text-xs">
                            {v.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{v.profiles?.name}</span>
                        <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 ml-auto">
                          미확인
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
