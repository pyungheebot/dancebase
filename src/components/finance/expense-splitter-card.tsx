"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Calculator,
  ArrowRight,
  Receipt,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useExpenseSplitter,
  calculateSettlements,
} from "@/hooks/use-expense-splitter";
import type { ExpenseSplitSession } from "@/types";

// ---- 유틸 ----

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ---- 경비 항목 추가 Dialog ----

function AddItemDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onAdd: (item: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
  }) => void;
}) {
  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [paidBy, setPaidBy] = useState(memberNames[0] ?? "");
  const [splitAmong, setSplitAmong] = useState<string[]>([...memberNames]);

  const parsedAmount = parseInt(amountRaw.replace(/,/g, ""), 10) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setAmountRaw(raw ? parseInt(raw, 10).toLocaleString("ko-KR") : "");
  };

  const handleToggleMember = (name: string) => {
    setSplitAmong((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("항목 설명을 입력해주세요");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("금액을 입력해주세요");
      return;
    }
    if (!paidBy) {
      toast.error("지불자를 선택해주세요");
      return;
    }
    if (splitAmong.length === 0) {
      toast.error("분할 대상을 한 명 이상 선택해주세요");
      return;
    }

    onAdd({ description: description.trim(), amount: parsedAmount, paidBy, splitAmong });
    // 초기화
    setDescription("");
    setAmountRaw("");
    setPaidBy(memberNames[0] ?? "");
    setSplitAmong([...memberNames]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">경비 항목 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">항목 설명</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 연습실 대여비"
              className="h-8 text-xs"
            />
          </div>

          {/* 금액 */}
          <div className="space-y-1.5">
            <Label className="text-xs">금액</Label>
            <div className="relative">
              <Input
                value={amountRaw}
                onChange={handleAmountChange}
                placeholder="0"
                className="h-8 text-xs pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                원
              </span>
            </div>
          </div>

          {/* 지불자 */}
          <div className="space-y-1.5">
            <Label className="text-xs">지불자</Label>
            {memberNames.length > 0 ? (
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="지불자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="지불자 이름 입력"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 분할 대상 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">분할 대상</Label>
              {memberNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (splitAmong.length === memberNames.length) {
                      setSplitAmong([]);
                    } else {
                      setSplitAmong([...memberNames]);
                    }
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700"
                >
                  {splitAmong.length === memberNames.length ? "전체 해제" : "전체 선택"}
                </button>
              )}
            </div>
            {memberNames.length > 0 ? (
              <div className="rounded-md border divide-y max-h-36 overflow-y-auto">
                {memberNames.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={splitAmong.includes(name)}
                      onCheckedChange={() => handleToggleMember(name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                멤버 이름을 쉼표로 구분하여 입력하세요 (지불자 포함)
              </p>
            )}
          </div>

          {/* 1인당 금액 미리보기 */}
          {parsedAmount > 0 && splitAmong.length > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 px-3 py-2">
              <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                1인당 부담액 (균등)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                {splitAmong.length}명 기준{" "}
                <span className="font-semibold">
                  {formatAmount(Math.round(parsedAmount / splitAmong.length))}
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 세션 생성 Dialog ----

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("세션 이름을 입력해주세요");
      return;
    }
    onCreate(title.trim());
    setTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">새 경비 세션</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">세션 이름</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2월 공연 경비"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 세션 상세 패널 ----

function SessionPanel({
  session,
  memberNames,
  onAddItem,
  onRemoveItem,
  onDeleteSession,
}: {
  session: ExpenseSplitSession;
  memberNames: string[];
  onAddItem: (item: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
  }) => void;
  onRemoveItem: (itemId: string) => void;
  onDeleteSession: () => void;
}) {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [showSettlements, setShowSettlements] = useState(false);

  const settlements = calculateSettlements(session.items);
  const totalAmount = session.items.reduce((sum, it) => sum + it.amount, 0);

  return (
    <div className="space-y-3">
      {/* 세션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{session.title}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 font-normal"
          >
            {session.items.length}개 항목
          </Badge>
          {totalAmount > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              합계 {formatAmount(totalAmount)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-destructive"
            onClick={onDeleteSession}
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddItemOpen(true)}
            disabled={session.items.length >= 20}
          >
            <Plus className="h-3 w-3" />
            항목 추가
          </Button>
        </div>
      </div>

      {/* 경비 항목 목록 */}
      {session.items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
          경비 항목을 추가해주세요
        </div>
      ) : (
        <div className="rounded-lg border divide-y overflow-hidden">
          {session.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">
                    {item.description}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                  <span>{item.paidBy} 지불</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{item.splitAmong.length}명 분할</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    1인 {formatAmount(Math.round(item.amount / item.splitAmong.length))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs font-semibold tabular-nums">
                  {formatAmount(item.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 정산 결과 토글 */}
      {session.items.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => setShowSettlements((v) => !v)}
          >
            <Calculator className="h-3.5 w-3.5" />
            정산 결과 {showSettlements ? "닫기" : "보기"}
          </button>

          {showSettlements && (
            <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 overflow-hidden">
              {settlements.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-green-700 dark:text-green-400 font-medium">
                  모두 공평하게 분담했습니다!
                </div>
              ) : (
                <div className="divide-y divide-blue-100 dark:divide-blue-900/30">
                  <div className="px-3 py-2 bg-blue-100/50 dark:bg-blue-900/20">
                    <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      정산 목록 ({settlements.length}건)
                    </span>
                  </div>
                  {settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span className="text-xs font-medium text-foreground">
                        {s.from}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground">
                        {s.to}
                      </span>
                      <span className="ml-auto text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                        {formatAmount(s.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        memberNames={memberNames}
        onAdd={onAddItem}
      />
    </div>
  );
}

// ---- 메인 컴포넌트 ----

type Props = {
  groupId: string;
  memberNames?: string[]; // 그룹 멤버 이름 목록 (없으면 직접 입력)
};

export function ExpenseSplitterCard({ groupId, memberNames = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  const {
    sessions,
    loading,
    canCreateSession,
    createSession,
    addItem,
    removeItem,
    deleteSession,
  } = useExpenseSplitter(groupId);

  // 세션 목록이 바뀌면 선택된 세션 유효성 확인
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  const handleCreateSession = (title: string) => {
    const newSession = createSession(title);
    if (!newSession) {
      toast.error(`세션은 최대 10개까지 만들 수 있습니다`);
      return;
    }
    setSelectedSessionId(newSession.id);
    toast.success(`"${title}" 세션이 생성되었습니다`);
  };

  const handleAddItem = (item: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
  }) => {
    if (!selectedSessionId) return;
    const ok = addItem(selectedSessionId, item);
    if (!ok) {
      toast.error("항목은 세션당 최대 20개까지 추가할 수 있습니다");
      return;
    }
    toast.success(`"${item.description}" 항목이 추가되었습니다`);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedSessionId) return;
    removeItem(selectedSessionId, itemId);
    toast.success("항목이 삭제되었습니다");
  };

  const handleDeleteSession = (sessionId: string, title: string) => {
    deleteSession(sessionId);
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
    toast.success(`"${title}" 세션이 삭제되었습니다`);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        {/* 카드 헤더 (접기/펼치기 트리거) */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">경비 분할 계산기</span>
              {sessions.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 font-normal"
                >
                  {sessions.length}개 세션
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 border-t">
            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                불러오는 중...
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {/* 세션 선택 + 생성 */}
                <div className="flex items-center gap-2">
                  {sessions.length > 0 ? (
                    <Select
                      value={selectedSessionId ?? ""}
                      onValueChange={(val) => setSelectedSessionId(val || null)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="세션 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.title}
                            <span className="ml-1 text-muted-foreground">
                              ({s.items.length}건)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground flex-1">
                      새 세션을 만들어 경비를 기록해보세요
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 shrink-0"
                    onClick={() => setCreateSessionOpen(true)}
                    disabled={!canCreateSession}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    새 세션
                  </Button>
                </div>

                {/* 선택된 세션 패널 */}
                {selectedSession ? (
                  <SessionPanel
                    session={selectedSession}
                    memberNames={memberNames}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onDeleteSession={() =>
                      handleDeleteSession(selectedSession.id, selectedSession.title)
                    }
                  />
                ) : sessions.length > 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    세션을 선택하면 경비 내역을 확인할 수 있습니다
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      <CreateSessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onCreate={handleCreateSession}
      />
    </Collapsible>
  );
}
