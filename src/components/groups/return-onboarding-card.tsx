"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Music,
  CalendarDays,
  BookOpen,
  Users,
  Package,
  HelpCircle,
  CheckCircle2,
  Circle,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReturnOnboarding } from "@/hooks/use-return-onboarding";
import type { OnboardingCheckItemCategory } from "@/types";

// ─── 카테고리 메타 ────────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  color: string;
  icon: React.ReactNode;
};

const CATEGORY_META: Record<OnboardingCheckItemCategory, CategoryMeta> = {
  choreography: {
    label: "안무",
    color: "bg-purple-100 text-purple-700",
    icon: <Music className="h-3 w-3" />,
  },
  schedule: {
    label: "일정",
    color: "bg-blue-100 text-blue-700",
    icon: <CalendarDays className="h-3 w-3" />,
  },
  rule_change: {
    label: "규칙 변경",
    color: "bg-orange-100 text-orange-700",
    icon: <BookOpen className="h-3 w-3" />,
  },
  member_change: {
    label: "멤버 변동",
    color: "bg-green-100 text-green-700",
    icon: <Users className="h-3 w-3" />,
  },
  equipment: {
    label: "장비",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Package className="h-3 w-3" />,
  },
  other: {
    label: "기타",
    color: "bg-gray-100 text-gray-700",
    icon: <HelpCircle className="h-3 w-3" />,
  },
};

const CATEGORY_OPTIONS: OnboardingCheckItemCategory[] = [
  "choreography",
  "schedule",
  "rule_change",
  "member_change",
  "equipment",
  "other",
];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Props ────────────────────────────────────────────────────────

type ReturnOnboardingCardProps = {
  groupId: string;
  memberNames: string[];
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────

export function ReturnOnboardingCard({
  groupId,
  memberNames,
}: ReturnOnboardingCardProps) {
  const {
    checkItems,
    sessions,
    loading,
    addCheckItem,
    deleteCheckItem,
    startSession,
    toggleItem,
    completeSession,
    deleteSession,
    totalSessions,
    activeSessions,
    averageCompletionRate,
  } = useReturnOnboarding(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "items">("sessions");

  // 새 세션 시작 다이얼로그
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 항목 추가 다이얼로그
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newCategory, setNewCategory] =
    useState<OnboardingCheckItemCategory>("choreography");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // 활성 세션 (미완료)
  const activeSessions_ = sessions.filter((s) => !s.completedAt);

  // ─── 핸들러 ─────────────────────────────────────────────────────

  function handleStartSession() {
    const ok = startSession(selectedMember);
    if (ok) {
      setSessionDialogOpen(false);
      setSelectedMember("");
    }
  }

  function handleAddItem() {
    const ok = addCheckItem(newCategory, newTitle, newDescription);
    if (ok) {
      setItemDialogOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("choreography");
    }
  }

  // 카테고리별 그룹화
  const itemsByCategory = CATEGORY_OPTIONS.reduce(
    (acc, cat) => {
      acc[cat] = checkItems.filter((item) => item.category === cat);
      return acc;
    },
    {} as Record<OnboardingCheckItemCategory, typeof checkItems>
  );

  // ─── 렌더 ────────────────────────────────────────────────────────

  return (
    <>
      <Card className="w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-teal-500" />
                  <CardTitle className="text-sm font-semibold">
                    복귀 온보딩
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700">
                    진행중 {activeSessions}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {!loading && (
                    <span className="text-[11px] text-muted-foreground">
                      완료율 {averageCompletionRate}%
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 탭 */}
              <div className="flex gap-1 border-b pb-2">
                <button
                  onClick={() => setActiveTab("sessions")}
                  className={`text-xs px-3 py-1 rounded-t font-medium transition-colors ${
                    activeTab === "sessions"
                      ? "bg-teal-50 text-teal-700 border-b-2 border-teal-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  복귀 세션
                </button>
                <button
                  onClick={() => setActiveTab("items")}
                  className={`text-xs px-3 py-1 rounded-t font-medium transition-colors ${
                    activeTab === "items"
                      ? "bg-teal-50 text-teal-700 border-b-2 border-teal-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  체크항목 관리
                </button>
              </div>

              {/* ── 복귀 세션 탭 ── */}
              {activeTab === "sessions" && (
                <div className="space-y-3">
                  {/* 통계 요약 */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/40 rounded-md py-1.5">
                      <p className="text-base font-bold">{totalSessions}</p>
                      <p className="text-[10px] text-muted-foreground">전체</p>
                    </div>
                    <div className="bg-teal-50 rounded-md py-1.5">
                      <p className="text-base font-bold text-teal-600">
                        {activeSessions}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        진행중
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-md py-1.5">
                      <p className="text-base font-bold text-green-600">
                        {averageCompletionRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        평균완료율
                      </p>
                    </div>
                  </div>

                  {/* 세션 목록 */}
                  {loading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      로딩 중...
                    </p>
                  ) : activeSessions_.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">진행중인 복귀 세션이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions_.map((session) => {
                        const checkedCount = session.items.filter(
                          (i) => i.checked
                        ).length;
                        const totalCount = session.items.length;
                        const pct =
                          totalCount > 0
                            ? Math.round((checkedCount / totalCount) * 100)
                            : 0;
                        const allChecked =
                          totalCount > 0 && checkedCount === totalCount;

                        return (
                          <div
                            key={session.id}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            {/* 세션 헤더 */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <UserPlus className="h-3.5 w-3.5 text-teal-500" />
                                <span className="text-sm font-medium">
                                  {session.memberName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(session.startDate)} 복귀
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] px-1.5 text-red-500 hover:text-red-600"
                                  onClick={() => deleteSession(session.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* 진행률 바 */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>
                                  {checkedCount}/{totalCount} 완료
                                </span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {/* 체크리스트 */}
                            {session.items.length > 0 ? (
                              <div className="space-y-1.5 mt-1">
                                {session.items.map((sessionItem) => {
                                  const checkItem = checkItems.find(
                                    (ci) => ci.id === sessionItem.itemId
                                  );
                                  if (!checkItem) return null;
                                  const meta =
                                    CATEGORY_META[checkItem.category];
                                  return (
                                    <div
                                      key={sessionItem.itemId}
                                      className="flex items-start gap-2"
                                    >
                                      <Checkbox
                                        id={`${session.id}-${sessionItem.itemId}`}
                                        checked={sessionItem.checked}
                                        onCheckedChange={() =>
                                          toggleItem(
                                            session.id,
                                            sessionItem.itemId
                                          )
                                        }
                                        className="mt-0.5 h-3.5 w-3.5"
                                      />
                                      <label
                                        htmlFor={`${session.id}-${sessionItem.itemId}`}
                                        className={`flex-1 text-xs cursor-pointer leading-tight ${
                                          sessionItem.checked
                                            ? "line-through text-muted-foreground"
                                            : ""
                                        }`}
                                      >
                                        <span className="font-medium">
                                          {checkItem.title}
                                        </span>
                                        {checkItem.description && (
                                          <span className="text-muted-foreground ml-1">
                                            - {checkItem.description}
                                          </span>
                                        )}
                                      </label>
                                      <Badge
                                        className={`text-[9px] px-1 py-0 flex items-center gap-0.5 shrink-0 ${meta.color}`}
                                      >
                                        {meta.icon}
                                        {meta.label}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                체크 항목이 없습니다.
                              </p>
                            )}

                            {/* 완료 버튼 */}
                            <Button
                              size="sm"
                              className={`h-7 text-xs w-full mt-1 ${
                                allChecked
                                  ? "bg-teal-500 hover:bg-teal-600 text-white"
                                  : ""
                              }`}
                              variant={allChecked ? "default" : "outline"}
                              disabled={!allChecked}
                              onClick={() => completeSession(session.id)}
                            >
                              {allChecked ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  온보딩 완료
                                </>
                              ) : (
                                <>
                                  <Circle className="h-3 w-3 mr-1" />
                                  모든 항목 체크 후 완료 가능
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 새 세션 시작 버튼 */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => setSessionDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    새 복귀 세션 시작
                  </Button>
                </div>
              )}

              {/* ── 체크항목 관리 탭 ── */}
              {activeTab === "items" && (
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      로딩 중...
                    </p>
                  ) : checkItems.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">등록된 체크 항목이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const items = itemsByCategory[cat];
                        if (items.length === 0) return null;
                        const meta = CATEGORY_META[cat];
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${meta.color}`}
                              >
                                {meta.icon}
                                {meta.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {items.length}개
                              </span>
                            </div>
                            <div className="space-y-1">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between gap-2 border rounded-md px-2.5 py-1.5"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium leading-tight">
                                      {item.title}
                                    </p>
                                    {item.description && (
                                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-red-400 hover:text-red-600 shrink-0"
                                    onClick={() => deleteCheckItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => setItemDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    체크 항목 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* ── 새 세션 시작 다이얼로그 ── */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">새 복귀 세션 시작</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">복귀 멤버</Label>
              <Select
                value={selectedMember}
                onValueChange={setSelectedMember}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {checkItems.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                현재 등록된 체크 항목 {checkItems.length}개로 세션이 시작됩니다.
              </p>
            )}
            {checkItems.length === 0 && (
              <p className="text-[11px] text-amber-600">
                체크 항목이 없습니다. 먼저 체크항목 관리 탭에서 항목을
                추가해주세요.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSessionDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleStartSession}
              disabled={!selectedMember}
            >
              세션 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 체크 항목 추가 다이얼로그 ── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">체크 항목 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={newCategory}
                onValueChange={(v) =>
                  setNewCategory(v as OnboardingCheckItemCategory)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        {CATEGORY_META[cat].icon}
                        {CATEGORY_META[cat].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">제목</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 신규 안무 A섹션 확인"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">설명 (선택)</Label>
              <Textarea
                className="text-xs resize-none"
                rows={2}
                placeholder="추가 설명을 입력하세요"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setItemDialogOpen(false);
                setNewTitle("");
                setNewDescription("");
                setNewCategory("choreography");
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleAddItem}
              disabled={!newTitle.trim()}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
