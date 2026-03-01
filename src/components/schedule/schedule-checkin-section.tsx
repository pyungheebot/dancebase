"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Check, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useScheduleCheckin } from "@/hooks/use-schedule-checkin";
import { useAsyncAction } from "@/hooks/use-async-action";

type Props = {
  scheduleId: string;
  /** 리더/서브리더면 true */
  isLeader: boolean;
};

export function ScheduleCheckinSection({ scheduleId, isLeader }: Props) {
  const { activeCode, loading, generateCheckinCode, submitCheckin } =
    useScheduleCheckin(scheduleId);

  // 리더용 상태
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 멤버용 상태
  const [inputCode, setInputCode] = useState("");
  const { pending: submitting, execute } = useAsyncAction();
  const [checkinResult, setCheckinResult] = useState<
    "success" | "already" | null
  >(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 카운트다운 계산
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!activeCode) {
      setCountdown(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(activeCode.expires_at).getTime() - Date.now()) / 1000
        )
      );
      setCountdown(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeCode]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateCheckinCode();
      toast.success(TOAST.SCHEDULE.CHECKIN_CODE_CREATED);
    } catch {
      toast.error(TOAST.SCHEDULE.CHECKIN_CODE_CREATE_ERROR);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (inputCode.trim().length !== 6) {
      toast.error(TOAST.SCHEDULE.CHECKIN_CODE_REQUIRED);
      return;
    }

    await execute(async () => {
      try {
        const result = await submitCheckin(inputCode);

        if (result === "success") {
          setCheckinResult("success");
          toast.success(TOAST.SCHEDULE.CHECKIN_DONE);
          setInputCode("");
        } else if (result === "already") {
          setCheckinResult("already");
          toast.info(TOAST.SCHEDULE.CHECKIN_ALREADY);
        } else if (result === "invalid") {
          toast.error(TOAST.SCHEDULE.CHECKIN_INVALID_CODE);
        } else if (result === "expired") {
          toast.error(TOAST.SCHEDULE.CHECKIN_EXPIRED_CODE);
        }
      } catch {
        toast.error(TOAST.SCHEDULE.CHECKIN_ERROR);
      }
    });
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const isCodeActive = activeCode && countdown !== null && countdown > 0;

  // 리더 뷰
  if (isLeader) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">체크인 코드</span>
          </div>
          {isCodeActive && (
            <Badge
              className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
              variant="outline"
            >
              활성
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : isCodeActive ? (
          <div className="space-y-2">
            {/* 큰 글씨로 코드 표시 */}
            <div className="flex justify-center py-2">
              <span className="font-mono text-4xl font-bold tracking-[0.3em] text-foreground select-all">
                {activeCode.code}
              </span>
            </div>

            {/* 만료 카운트다운 */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>만료까지 {formatCountdown(countdown)}</span>
            </div>

            {/* 시간 경과 경고 */}
            {countdown !== null && countdown <= 60 && (
              <div className="text-center">
                <span className="text-[11px] text-orange-600 font-medium">
                  곧 만료됩니다. 새 코드를 생성하세요.
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full gap-1"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              새 코드 생성
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground text-center py-2">
              코드를 생성하면 멤버가 입력하여 체크인할 수 있습니다
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full gap-1"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <QrCode className="h-3 w-3" />
              )}
              체크인 코드 생성
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 멤버 뷰
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">체크인</span>
      </div>

      {checkinResult === "success" ? (
        // 성공 애니메이션
        <div className="flex flex-col items-center gap-1.5 py-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-600">
            체크인 완료!
          </span>
          <span className="text-[11px] text-muted-foreground">
            출석이 기록되었습니다
          </span>
        </div>
      ) : checkinResult === "already" ? (
        // 이미 체크인됨 안내
        <div className="flex flex-col items-center gap-1.5 py-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-600">
            이미 체크인됨
          </span>
          <span className="text-[11px] text-muted-foreground">
            이미 출석 기록이 있습니다
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setCheckinResult(null)}
          >
            다시 입력
          </Button>
        </div>
      ) : (
        // 코드 입력 폼
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            리더에게 받은 6자리 코드를 입력하세요
          </p>
          <div className="flex gap-1.5">
            <Input
              value={inputCode}
              onChange={(e) =>
                setInputCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="코드 입력"
              className="h-8 text-sm font-mono tracking-widest uppercase text-center"
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              disabled={submitting}
            />
            <Button
              size="sm"
              className="h-8 text-xs shrink-0 gap-1"
              onClick={handleSubmit}
              disabled={submitting || inputCode.trim().length !== 6}
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              체크인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
