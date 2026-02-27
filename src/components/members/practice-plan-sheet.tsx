"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendMessageDialog } from "@/components/messages/send-message-dialog";
import {
  ClipboardList,
  Target,
  TrendingUp,
  Send,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { usePracticePlan } from "@/hooks/use-practice-plan";

// ============================================
// Props
// ============================================

type PracticePlanSheetProps = {
  groupId: string;
  userId: string;
  memberName: string;
  memberAvatarUrl?: string | null;
  currentUserId: string;
  isLeader: boolean;
  trigger?: React.ReactNode;
};

// ============================================
// 출석률 배지 색상
// ============================================

function attendanceBadgeClass(rate: number): string {
  if (rate >= 90) return "bg-green-100 text-green-700 border-green-200";
  if (rate >= 70) return "bg-blue-100 text-blue-700 border-blue-200";
  if (rate >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-700 border-red-200";
}

// ============================================
// 컴포넌트
// ============================================

export function PracticePlanSheet({
  groupId,
  userId,
  memberName,
  memberAvatarUrl,
  currentUserId,
  isLeader,
  trigger,
}: PracticePlanSheetProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [sendDmOpen, setSendDmOpen] = useState(false);

  const {
    plan,
    analysis,
    loading,
    analyzing,
    analyze,
    savePlanData,
    deletePlan,
  } = usePracticePlan(groupId, userId, memberName);

  // Sheet 열릴 때 자동 분석 실행
  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value && !analysis) {
      analyze().catch(() => {
        toast.error("분석 중 오류가 발생했습니다");
      });
    }
  };

  // 편집 시작
  const handleStartEdit = () => {
    const base = plan?.content ?? analysis?.suggestedContent ?? "";
    setEditContent(base);
    setEditing(true);
  };

  // 저장
  const handleSave = () => {
    if (!editContent.trim()) {
      toast.error("플랜 내용을 입력해주세요");
      return;
    }
    const focusAreas = analysis?.suggestedFocusAreas ?? plan?.focusAreas ?? [];
    savePlanData(editContent.trim(), focusAreas, currentUserId);
    setEditing(false);
    toast.success("연습 플랜이 저장되었습니다");
  };

  // 취소
  const handleCancelEdit = () => {
    setEditing(false);
    setEditContent("");
  };

  // 삭제
  const handleDelete = () => {
    deletePlan();
    setEditing(false);
    toast.success("연습 플랜이 삭제되었습니다");
  };

  // 재분석
  const handleReanalyze = async () => {
    try {
      await analyze();
      toast.success("분석을 완료했습니다");
    } catch {
      toast.error("분석 중 오류가 발생했습니다");
    }
  };

  // DM으로 플랜 발송
  const handleSendDm = () => {
    if (!plan?.content && !analysis?.suggestedContent) {
      toast.error("먼저 플랜을 저장해주세요");
      return;
    }
    setSendDmOpen(true);
  };

  const displayContent = plan?.content ?? analysis?.suggestedContent ?? "";

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <ClipboardList className="h-3 w-3 mr-1" />
              연습 플랜
            </Button>
          )}
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-2">
            {/* 멤버 정보 헤더 */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={memberAvatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {memberName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-sm leading-tight">
                  {memberName} 맞춤 연습 플랜
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  출석, 스킬, 목표 데이터 기반 자동 분석
                </p>
              </div>
            </div>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-muted-foreground">불러오는 중...</p>
            </div>
          ) : (
            <div className="px-4 pb-6 space-y-4">

              {/* 분석 결과 섹션 */}
              {analyzing ? (
                <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">데이터 분석 중...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-3">

                  {/* 출석률 */}
                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-medium">출석 현황 (최근 3개월)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${attendanceBadgeClass(analysis.attendanceRate)}`}
                      >
                        {analysis.attendanceRate}%
                      </Badge>
                      {analysis.totalSchedules > 0 ? (
                        <span className="text-[11px] text-muted-foreground">
                          {analysis.totalSchedules}회 일정 중 {analysis.attendedCount}회 참석
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">출석 기록 없음</span>
                      )}
                    </div>
                    {analysis.attendanceRate < 70 && analysis.totalSchedules > 0 && (
                      <div className="flex items-start gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-yellow-700">
                          출석률이 70% 미만입니다. 정기 연습 참여를 권장합니다.
                        </p>
                      </div>
                    )}
                    {analysis.attendanceRate >= 90 && analysis.totalSchedules > 0 && (
                      <div className="flex items-start gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-green-700">
                          우수한 출석률을 유지하고 있습니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 약점 스킬 */}
                  {analysis.weakSkills.length > 0 && (
                    <div className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-medium">보완 필요 스킬</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.weakSkills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {skill.skill_name}
                            <span className="ml-1 text-orange-400">
                              Lv.{skill.skill_level}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 집중 과제 */}
                  {analysis.suggestedFocusAreas.length > 0 && (
                    <div className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs font-medium">자동 추천 집중 과제</span>
                      </div>
                      <div className="space-y-1">
                        {analysis.suggestedFocusAreas.map((area, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-purple-500 mt-0.5 shrink-0">
                              {i + 1}.
                            </span>
                            <span className="text-xs">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 재분석 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground w-full"
                    onClick={handleReanalyze}
                    disabled={analyzing}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${analyzing ? "animate-spin" : ""}`} />
                    다시 분석
                  </Button>
                </div>
              ) : null}

              {/* 구분선 */}
              <div className="border-t" />

              {/* 플랜 내용 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">연습 플랜 내용</span>
                  {plan && (
                    <span className="text-[10px] text-muted-foreground">
                      저장됨 {new Date(plan.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={10}
                      className="text-xs resize-none"
                      placeholder="연습 플랜 내용을 입력하세요..."
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={handleSave}
                      >
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayContent ? (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground">
                          {displayContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <ClipboardList className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          아직 저장된 플랜이 없습니다
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          위 분석 결과를 바탕으로 플랜을 작성해보세요
                        </p>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    {isLeader && (
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={handleStartEdit}
                          disabled={analyzing}
                        >
                          {plan ? "수정" : "작성"}
                        </Button>

                        {(plan || analysis?.suggestedContent) && (
                          <Button
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={handleSendDm}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            DM 발송
                          </Button>
                        )}

                        {plan && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={handleDelete}
                            title="플랜 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* DM 발송 Dialog */}
      <SendMessageDialog
        receiverId={userId}
        receiverName={memberName}
        open={sendDmOpen}
        onOpenChange={setSendDmOpen}
        defaultContent={plan?.content ?? analysis?.suggestedContent ?? ""}
      />
    </>
  );
}
