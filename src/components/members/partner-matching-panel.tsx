"use client";

import { useState } from "react";
import { usePartnerMatching } from "@/hooks/use-partner-matching";
import type { PartnerMatchingRecord } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftRight,
  ChevronRight,
  Heart,
  Loader2,
  RefreshCw,
  Shuffle,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================
// 날짜 포맷 유틸
// ============================================

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// 단일 쌍 카드
// ============================================

function PairCard({
  names,
  index,
}: {
  names: string[];
  index: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
      <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">
        {index + 1}
      </span>
      <div className="flex flex-1 items-center gap-1.5 flex-wrap">
        {names.map((name, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <Heart className="h-3 w-3 text-pink-400 shrink-0" />
            )}
            <span className="text-xs font-medium">{name}</span>
          </span>
        ))}
      </div>
      {names.length === 3 && (
        <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
          3인
        </Badge>
      )}
    </div>
  );
}

// ============================================
// 매칭 결과 탭 내용
// ============================================

function MatchingResultTab({

  members,
  membersLoading,
  currentPairs,
  runMatching,
}: {
  groupId: string;
  members: { userId: string; name: string }[];
  membersLoading: boolean;
  currentPairs: ReturnType<typeof usePartnerMatching>["currentPairs"];
  runMatching: ReturnType<typeof usePartnerMatching>["runMatching"];
}) {
  const [label, setLabel] = useState("");
  const [avoidDuplicate, setAvoidDuplicate] = useState(false);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (members.length < 2) {
      toast.error("매칭하려면 멤버가 2명 이상 필요합니다");
      return;
    }
    setRunning(true);
    // 약간의 딜레이로 UX 개선
    await new Promise((r) => setTimeout(r, 200));
    runMatching(label, avoidDuplicate);
    setRunning(false);
    toast.success("짝꿍 매칭이 완료되었습니다");
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* 설정 영역 */}
      <div className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">매칭 라벨</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 3월 4주차 연습"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="avoid-dup" className="text-xs font-medium">
              이전 짝과 중복 방지
            </Label>
            <span className="text-[10px] text-muted-foreground">
              직전 매칭과 동일한 쌍 제외 (최대 10회 재시도)
            </span>
          </div>
          <Switch
            id="avoid-dup"
            checked={avoidDuplicate}
            onCheckedChange={setAvoidDuplicate}
          />
        </div>
        <Button
          size="sm"
          className="w-full h-8 text-xs gap-1.5"
          onClick={handleRun}
          disabled={membersLoading || running || members.length < 2}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Shuffle className="h-3.5 w-3.5" />
          )}
          {running ? "매칭 중..." : "랜덤 매칭"}
        </Button>
      </div>

      {/* 멤버 수 표시 */}
      {membersLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          멤버 목록 불러오는 중...
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>전체 멤버 {members.length}명</span>
          {members.length >= 2 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{Math.floor(members.length / 2)}쌍{members.length % 2 === 1 ? " + 1명 추가" : ""}</span>
            </>
          )}
        </div>
      )}

      {/* 결과 */}
      {currentPairs !== null && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">매칭 결과</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
              {currentPairs.length}쌍
            </Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-480px)] min-h-[120px]">
            <div className="flex flex-col gap-2 pr-1">
              {currentPairs.map((pair, i) => (
                <PairCard key={i} names={pair.memberNames} index={i} />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {currentPairs === null && !membersLoading && members.length >= 2 && (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <ArrowLeftRight className="h-8 w-8 opacity-20" />
          <p className="text-xs">위에서 &quot;랜덤 매칭&quot; 버튼을 눌러 짝꿍을 생성하세요</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 이력 탭 내용
// ============================================

function HistoryTab({
  history,
  selectedRecord,
  setSelectedRecord,
  deleteRecord,
}: {
  history: PartnerMatchingRecord[];
  selectedRecord: PartnerMatchingRecord | null;
  setSelectedRecord: (r: PartnerMatchingRecord | null) => void;
  deleteRecord: (id: string) => void;
}) {
  if (selectedRecord) {
    return (
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setSelectedRecord(null)}
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            이력 목록
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold">{selectedRecord.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatDateTime(selectedRecord.matchedAt)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">매칭 결과</span>
          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
            {selectedRecord.pairs.length}쌍
          </Badge>
        </div>
        <ScrollArea className="h-[calc(100vh-420px)] min-h-[120px]">
          <div className="flex flex-col gap-2 pr-1">
            {selectedRecord.pairs.map((pair, i) => (
              <PairCard key={i} names={pair.memberNames} index={i} />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <RefreshCw className="h-8 w-8 opacity-20" />
        <p className="text-xs">아직 매칭 이력이 없습니다</p>
        <p className="text-[10px]">첫 번째 매칭을 실행해보세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-[10px] text-muted-foreground">
        최근 {history.length}회 이력 (최대 5회 보관)
      </p>
      <div className="flex flex-col gap-2">
        {history.map((record) => (
          <div
            key={record.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
            )}
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{record.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDateTime(record.matchedAt)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border">
                {record.pairs.length}쌍
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRecord(record.id);
                  toast.success("이력이 삭제되었습니다");
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type PartnerMatchingPanelProps = {
  groupId: string;
};

export function PartnerMatchingPanel({ groupId }: PartnerMatchingPanelProps) {
  const {
    members,
    membersLoading,
    currentPairs,
    history,
    selectedRecord,
    setSelectedRecord,
    runMatching,
    deleteRecord,
  } = usePartnerMatching(groupId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] px-2 gap-1"
        >
          <Heart className="h-3 w-3" />
          짝꿍 매칭
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[380px] flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            랜덤 짝꿍 매칭
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
          <Tabs defaultValue="match" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 h-8 mb-3">
              <TabsTrigger value="match" className="text-xs h-7">
                매칭 실행
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7">
                이력
                {history.length > 0 && (
                  <Badge className="ml-1 text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-200">
                    {history.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="match" className="flex-1 overflow-hidden mt-0">
              <MatchingResultTab
                groupId={groupId}
                members={members}
                membersLoading={membersLoading}
                currentPairs={currentPairs}
                runMatching={runMatching}
              />
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
              <HistoryTab
                history={history}
                selectedRecord={selectedRecord}
                setSelectedRecord={setSelectedRecord}
                deleteRecord={deleteRecord}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
