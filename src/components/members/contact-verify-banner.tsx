"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useContactVerification } from "@/hooks/use-contact-verification";
import { invalidateContactVerification } from "@/lib/swr/invalidate";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { CheckCircle2, PhoneCall, X } from "lucide-react";

type ContactVerifyBannerProps = {
  groupId: string;
  currentUserId: string;
};

/**
 * 연락처 미확인 멤버에게 표시되는 배너.
 *
 * - 현재 사용자가 미확인 상태인 경우에만 렌더링
 * - "연락처 확인하기" 클릭 시 verified_at = now() 업데이트
 * - 확인 완료 시 배너 사라짐 + toast 표시
 */
export function ContactVerifyBanner({ groupId, currentUserId }: ContactVerifyBannerProps) {
  const [confirming, setConfirming] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { myPendingVerification, loading, refetch } = useContactVerification(
    groupId,
    currentUserId
  );

  // 로딩 중, 확인 완료, 또는 사용자가 닫은 경우 렌더링 안 함
  if (loading || !myPendingVerification || dismissed) return null;

  const handleVerify = async () => {
    setConfirming(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("contact_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", myPendingVerification.id)
      .eq("user_id", currentUserId);

    setConfirming(false);

    if (error) {
      toast.error(TOAST.MEMBERS.CONTACT_VERIFY_ERROR);
      return;
    }

    toast.success(TOAST.MEMBERS.CONTACT_VERIFY_SUCCESS);
    invalidateContactVerification(groupId);
    refetch();
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <PhoneCall className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-800 truncate">
            연락처 재확인 요청
          </p>
          <p className="text-xs text-blue-600">
            리더가 연락처 정보를 최신으로 유지해달라고 요청했습니다.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleVerify}
          disabled={confirming}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {confirming ? "확인 중..." : "연락처 확인하기"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
          onClick={() => setDismissed(true)}
          aria-label="배너 닫기"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
