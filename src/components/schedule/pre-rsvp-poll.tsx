"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Calendar,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  usePreRsvp,
  type PreRsvpResponse,
} from "@/hooks/use-pre-rsvp";
import { useAuth } from "@/hooks/use-auth";

// ============================================================
// 응답 버튼 설정
// ============================================================

type ResponseOption = {
  value: PreRsvpResponse;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
};

const RESPONSE_OPTIONS: ResponseOption[] = [
  {
    value: "yes",
    label: "참여 가능",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    activeClass: "bg-green-500 text-white border-green-500 hover:bg-green-600",
    inactiveClass:
      "border-gray-200 text-muted-foreground hover:border-green-400 hover:text-green-600",
  },
  {
    value: "no",
    label: "참여 불가",
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    activeClass: "bg-red-500 text-white border-red-500 hover:bg-red-600",
    inactiveClass:
      "border-gray-200 text-muted-foreground hover:border-red-400 hover:text-red-600",
  },
  {
    value: "maybe",
    label: "미정",
    icon: <Minus className="h-3.5 w-3.5" />,
    activeClass:
      "bg-yellow-400 text-yellow-900 border-yellow-400 hover:bg-yellow-500",
    inactiveClass:
      "border-gray-200 text-muted-foreground hover:border-yellow-400 hover:text-yellow-600",
  },
];

// ============================================================
// Props
// ============================================================

type Mode = "create" | "respond" | "result";

type PreRsvpPollProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  /** 리더 여부 (생성/닫기 권한) */
  canEdit: boolean;
};

// ============================================================
// 날짜 포맷 헬퍼
// ============================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dow = days[d.getDay()];
    return `${yyyy}년 ${mm}월 ${dd}일 (${dow})`;
  } catch {
    return dateStr;
  }
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function PreRsvpPoll({
  open,
  onOpenChange,
  groupId,
  canEdit,
}: PreRsvpPollProps) {
  const auth = useAuth();
  const userId = auth.user?.id ?? "anonymous";
  const userName =
    auth.user?.user_metadata?.name ?? auth.user?.email ?? "익명";

  const {
    poll,
    createPoll,
    submitResponse,
    closePoll,
    deletePoll,
    aggregate,
    getMyResponse,
  } = usePreRsvp(groupId);

  // 모드 결정
  const [mode, setMode] = useState<Mode>(() => {
    if (poll) return "respond";
    return canEdit ? "create" : "respond";
  });

  const currentMode: Mode = poll ? mode : canEdit ? "create" : "respond";

  // ---- 생성 폼 상태 ----
  const [title, setTitle] = useState("참여 의향 조사");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [description, setDescription] = useState("");

  // ---- 응답 상태 ----
  const [myResponse, setMyResponse] = useState<PreRsvpResponse | null>(() =>
    getMyResponse(userId)
  );

  // 집계
  const stats = useMemo(() => aggregate(), [aggregate]);

  // ============================================================
  // 생성 핸들러
  // ============================================================

  function handleCreate() {
    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.");
      return;
    }
    if (!proposedDate) {
      toast.error("날짜를 선택해 주세요.");
      return;
    }

    createPoll({
      title: title.trim(),
      proposedDate,
      proposedTime,
      description: description.trim(),
      createdBy: userId,
    });

    setMyResponse(null);
    setMode("respond");
    toast.success("의향 조사가 생성되었습니다.");
  }

  // ============================================================
  // 응답 핸들러
  // ============================================================

  function handleSelectResponse(value: PreRsvpResponse) {
    setMyResponse(value);
  }

  function handleSubmitResponse() {
    if (!poll) return;
    if (!myResponse) {
      toast.error("응답을 선택해 주세요.");
      return;
    }
    submitResponse({ userId, userName, response: myResponse });
    setMode("result");
    toast.success("응답이 저장되었습니다.");
  }

  // ============================================================
  // 닫기/삭제 핸들러
  // ============================================================

  function handleClose() {
    closePoll();
    toast.success("조사가 마감되었습니다.");
  }

  function handleDelete() {
    deletePoll();
    setTitle("참여 의향 조사");
    setProposedDate("");
    setProposedTime("");
    setDescription("");
    setMyResponse(null);
    setMode(canEdit ? "create" : "respond");
    toast.success("의향 조사가 삭제되었습니다.");
  }

  // ============================================================
  // 렌더링 — 생성 모드
  // ============================================================

  function renderCreateMode() {
    return (
      <div className="space-y-3">
        {/* 제목 */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">제목</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 다음 달 정기 공연 참여 의향"
            className="h-8 text-xs"
          />
        </div>

        {/* 날짜 + 시간 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium">예정 날짜</Label>
            <Input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">예정 시간 (선택)</Label>
            <Input
              type="time"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* 설명 */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">설명 (선택)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="일정에 대한 추가 정보를 입력하세요."
            className="text-xs resize-none"
            rows={3}
          />
        </div>
      </div>
    );
  }

  // ============================================================
  // 렌더링 — 응답 모드
  // ============================================================

  function renderRespondMode() {
    if (!poll) return null;

    const isClosed = poll.status === "closed";

    return (
      <div className="space-y-4">
        {/* 일정 정보 */}
        <div className="rounded-md bg-muted/50 border px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDate(poll.proposedDate)}
            {poll.proposedTime && (
              <span className="text-muted-foreground">{poll.proposedTime}</span>
            )}
          </div>
          {poll.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* 마감 배너 */}
        {isClosed && (
          <div className="flex items-center gap-1.5 rounded-md bg-gray-100 border border-gray-200 px-3 py-2">
            <X className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-xs text-gray-600">
              이 조사는 마감되었습니다.
            </span>
          </div>
        )}

        {/* 응답 버튼 */}
        {!isClosed && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">참여 의향을 선택해 주세요.</p>
            <div className="flex gap-2">
              {RESPONSE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelectResponse(opt.value)}
                  className={[
                    "flex-1 flex items-center justify-center gap-1.5",
                    "rounded-md border text-xs py-2 font-medium transition-colors",
                    myResponse === opt.value
                      ? opt.activeClass
                      : opt.inactiveClass,
                  ].join(" ")}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 현재 집계 미리보기 */}
        {poll.responses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">
              현재 {poll.responses.length}명 응답
            </p>
            {renderAggregateBar()}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 렌더링 — 결과 모드
  // ============================================================

  function renderResultMode() {
    if (!poll) return null;

    return (
      <div className="space-y-4">
        {/* 일정 정보 */}
        <div className="rounded-md bg-muted/50 border px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDate(poll.proposedDate)}
            {poll.proposedTime && (
              <span className="text-muted-foreground">{poll.proposedTime}</span>
            )}
          </div>
          {poll.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* 집계 바 */}
        <div className="space-y-2">
          <p className="text-xs font-medium">응답 결과 ({stats.total}명)</p>
          {renderAggregateBar()}
        </div>

        {/* 응답자 목록 */}
        {poll.responses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium">응답자 목록</p>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {poll.responses.map((r) => {
                const opt = RESPONSE_OPTIONS.find((o) => o.value === r.response);
                return (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-foreground truncate max-w-[60%]">
                      {r.userName}
                    </span>
                    <span
                      className={[
                        "flex items-center gap-1 text-[11px] font-medium",
                        r.response === "yes"
                          ? "text-green-600"
                          : r.response === "no"
                          ? "text-red-500"
                          : "text-yellow-600",
                      ].join(" ")}
                    >
                      {opt?.icon}
                      {opt?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {poll.responses.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            아직 응답이 없습니다.
          </p>
        )}
      </div>
    );
  }

  // ============================================================
  // 공통 — 집계 바
  // ============================================================

  function renderAggregateBar() {
    if (stats.total === 0) return null;

    const yesPercent = Math.round((stats.yes / stats.total) * 100);
    const noPercent = Math.round((stats.no / stats.total) * 100);
    const maybePercent = 100 - yesPercent - noPercent;

    return (
      <div className="space-y-1.5">
        {/* 바 */}
        <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
          {yesPercent > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${yesPercent}%` }}
            />
          )}
          {maybePercent > 0 && (
            <div
              className="bg-yellow-400 transition-all"
              style={{ width: `${maybePercent}%` }}
            />
          )}
          {noPercent > 0 && (
            <div
              className="bg-red-400 transition-all"
              style={{ width: `${noPercent}%` }}
            />
          )}
        </div>

        {/* 범례 */}
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-green-500" />
            참여 가능 {stats.yes}명
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" />
            미정 {stats.maybe}명
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-red-400" />
            불가 {stats.no}명
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // 전체 렌더링
  // ============================================================

  const isOpen = poll?.status === "open";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <DialogTitle className="text-sm">
              {poll ? poll.title : "참여 의향 조사"}
            </DialogTitle>
            {poll && (
              <div className="flex items-center gap-1 ml-auto">
                <Badge
                  variant="outline"
                  className={[
                    "text-[10px] px-1.5 py-0",
                    poll.status === "open"
                      ? "border-green-400 text-green-600"
                      : "border-gray-300 text-gray-500",
                  ].join(" ")}
                >
                  {poll.status === "open" ? "진행중" : "마감"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {poll.responses.length}명 응답
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* 탭 (투표가 있을 때만) */}
        {poll && (
          <div className="flex gap-1 border-b pb-2">
            <button
              onClick={() => {
                setMyResponse(getMyResponse(userId));
                setMode("respond");
              }}
              className={[
                "text-xs px-2.5 py-1 rounded-md transition-colors",
                currentMode === "respond"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              내 응답
            </button>
            <button
              onClick={() => setMode("result")}
              className={[
                "text-xs px-2.5 py-1 rounded-md transition-colors",
                currentMode === "result"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              전체 결과
            </button>
            {canEdit && (
              <button
                onClick={() => setMode("create")}
                className={[
                  "text-xs px-2.5 py-1 rounded-md transition-colors",
                  currentMode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                설정
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="py-1">
          {currentMode === "create" && renderCreateMode()}
          {currentMode === "respond" && renderRespondMode()}
          {currentMode === "result" && renderResultMode()}
        </div>

        {/* 푸터 */}
        <DialogFooter className="flex items-center gap-2 pt-2">
          {/* 삭제 (리더만) */}
          {poll && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive mr-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>

          {/* 생성 버튼 */}
          {currentMode === "create" && !poll && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleCreate}
            >
              <ClipboardCheck className="h-3 w-3" />
              조사 생성
            </Button>
          )}

          {/* 재생성 버튼 (설정 탭에서 기존 poll 있을 때) */}
          {currentMode === "create" && poll && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleCreate}
            >
              <ClipboardCheck className="h-3 w-3" />
              새 조사로 교체
            </Button>
          )}

          {/* 응답 저장 버튼 */}
          {currentMode === "respond" && poll && poll.status === "open" && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleSubmitResponse}
              disabled={!myResponse}
            >
              <ThumbsUp className="h-3 w-3" />
              응답 저장
            </Button>
          )}

          {/* 마감 버튼 (리더만, 진행중일 때) */}
          {poll && canEdit && isOpen && currentMode !== "create" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
              마감
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
