"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Zap, AlertTriangle, Check, Send, Users, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useSmartReminder, type MemberRiskAnalysis } from "@/hooks/use-smart-reminder";
import type { Schedule } from "@/types";

type SmartReminderDialogProps = {
  schedule: Schedule;
  groupId: string;
};

// 멤버 행 컴포넌트
function MemberRow({
  member,
  checked,
  onCheckedChange,
  variant,
}: {
  member: MemberRiskAnalysis;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  variant: "high" | "caution";
}) {
  const containerClass =
    variant === "high"
      ? "flex items-center gap-2 rounded p-1.5 bg-red-50 border border-red-200"
      : "flex items-center gap-2 rounded p-1.5 bg-yellow-50 border border-yellow-200";

  return (
    <div className={containerClass}>
      <Checkbox
        id={`member-${member.userId}`}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label
        htmlFor={`member-${member.userId}`}
        className="flex-1 text-xs font-medium cursor-pointer"
      >
        {member.name}
      </label>
      <div className="flex flex-wrap gap-1">
        {member.riskReasons.map((reason, idx) => (
          <Badge
            key={idx}
            className={
              variant === "high"
                ? "text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                : "text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
            }
            variant="outline"
          >
            {reason}
          </Badge>
        ))}
        <Badge className="text-[10px] px-1.5 py-0" variant="secondary">
          {member.riskScore}점
        </Badge>
      </div>
    </div>
  );
}

export function SmartReminderDialog({ schedule, groupId }: SmartReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [showSafe, setShowSafe] = useState(false);

  const { analysis, loading, sending, sendSmartReminder } = useSmartReminder(
    schedule.id,
    groupId
  );

  // Dialog 열릴 때 초기화
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // 기본으로 고위험 + 주의 멤버 선택
      const defaultSelected = new Set<string>([
        ...analysis.atRiskMembers.map((m) => m.userId),
        ...analysis.cautionMembers.map((m) => m.userId),
      ]);
      setSelectedIds(defaultSelected);
      setMessage("OO님, 다가오는 연습에 참여해주세요! 팀원들이 기다리고 있어요 😊");
      setShowSafe(false);
    }
  };

  // open 상태이고 analysis가 로드되면 초기 선택 설정
  const handleAnalysisLoaded = () => {
    if (open && selectedIds.size === 0) {
      const defaultSelected = new Set<string>([
        ...analysis.atRiskMembers.map((m) => m.userId),
        ...analysis.cautionMembers.map((m) => m.userId),
      ]);
      setSelectedIds(defaultSelected);
    }
  };

  // 체크박스 토글
  const toggleMember = (userId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(userId);
    } else {
      next.delete(userId);
    }
    setSelectedIds(next);
  };

  // 전체 선택 토글 (고위험 + 주의)
  const allAtRiskIds = [
    ...analysis.atRiskMembers.map((m) => m.userId),
    ...analysis.cautionMembers.map((m) => m.userId),
  ];
  const allSelected =
    allAtRiskIds.length > 0 && allAtRiskIds.every((id) => selectedIds.has(id));

  const toggleAllAtRisk = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      allAtRiskIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      allAtRiskIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    }
  };

  // 발송 핸들러
  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast.error("발송할 멤버를 선택해주세요");
      return;
    }
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요");
      return;
    }

    const result = await sendSmartReminder([...selectedIds], message.trim());
    if (result.success) {
      toast.success(`${result.count}명에게 스마트 리마인더를 발송했습니다`);
      setOpen(false);
    }
  };

  // 로딩 완료 후 선택 초기화 보장
  if (!loading) {
    handleAnalysisLoaded();
  }

  const totalAtRisk =
    analysis.atRiskMembers.length + analysis.cautionMembers.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Zap className="h-3 w-3 mr-1" />
          스마트 리마인더
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            스마트 리마인더
          </DialogTitle>
        </DialogHeader>

        {/* 일정 정보 */}
        <div className="rounded border px-3 py-2 bg-muted/30">
          <p className="text-xs font-medium">{schedule.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {format(new Date(schedule.starts_at), "M월 d일 (EEE) HH:mm", { locale: ko })}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-6 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 고위험 멤버 */}
            {analysis.atRiskMembers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    고위험 ({analysis.atRiskMembers.length}명)
                  </span>
                </div>
                {analysis.atRiskMembers.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    checked={selectedIds.has(member.userId)}
                    onCheckedChange={(checked) => toggleMember(member.userId, checked)}
                    variant="high"
                  />
                ))}
              </div>
            )}

            {/* 주의 멤버 */}
            {analysis.cautionMembers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    주의 ({analysis.cautionMembers.length}명)
                  </span>
                </div>
                {analysis.cautionMembers.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    checked={selectedIds.has(member.userId)}
                    onCheckedChange={(checked) => toggleMember(member.userId, checked)}
                    variant="caution"
                  />
                ))}
              </div>
            )}

            {/* 고위험/주의가 없는 경우 */}
            {analysis.atRiskMembers.length === 0 &&
              analysis.cautionMembers.length === 0 && (
                <div className="flex items-center gap-2 rounded p-2.5 bg-green-50 border border-green-200">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-700">
                    이탈 위험 멤버가 없습니다. 모든 멤버가 양호한 출석 패턴을 보입니다.
                  </p>
                </div>
              )}

            {/* 안전 멤버 (접기/펼치기) */}
            {analysis.safeMembers.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowSafe((prev) => !prev)}
                >
                  <Users className="h-3 w-3" />
                  <span className="flex items-center gap-1">
                    안전 ({analysis.safeMembers.length}명)
                    {showSafe ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </button>
                {showSafe && (
                  <div className="mt-1.5 space-y-1">
                    {analysis.safeMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2 rounded p-1.5 border text-xs"
                      >
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="text-xs">{member.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 전체 선택 토글 (고위험+주의 멤버가 있을 때) */}
            {totalAtRisk > 0 && (
              <div className="flex items-center justify-between pt-1 border-t">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={toggleAllAtRisk}
                >
                  {allSelected ? "전체 선택 해제" : "고위험+주의 전체 선택"}
                </button>
                <span className="text-[11px] text-muted-foreground">
                  {selectedIds.size}명 선택됨
                </span>
              </div>
            )}

            {/* 메시지 편집 영역 */}
            {totalAtRisk > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">발송 메시지</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="독려 메시지를 입력하세요"
                  className="text-xs min-h-[72px] resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* 발송 버튼 */}
            {totalAtRisk > 0 && (
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                disabled={sending || selectedIds.size === 0}
                onClick={handleSend}
              >
                <Send className="h-3 w-3" />
                {sending
                  ? "발송 중..."
                  : `선택 멤버 ${selectedIds.size}명에게 발송`}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
