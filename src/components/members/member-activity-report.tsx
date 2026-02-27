"use client";

import { useState } from "react";
import {
  useMemberActivityReport,
  type ActivityPeriod,
} from "@/hooks/use-member-activity-report";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportToCsv } from "@/lib/export-csv";
import { toast } from "sonner";
import { Download, BarChart2 } from "lucide-react";
import type { EntityMember } from "@/types/entity-context";

const PERIOD_LABELS: Record<ActivityPeriod, string> = {
  "1m": "1개월",
  "3m": "3개월",
  "6m": "6개월",
  "1y": "1년",
};

type Props = {
  groupId: string;
  groupName: string;
  members: EntityMember[];
};

export function MemberActivityReport({ groupId, groupName, members }: Props) {
  const [period, setPeriod] = useState<ActivityPeriod>("3m");

  const { records, loading } = useMemberActivityReport(groupId, members, {
    period,
  });

  const handleExportCsv = () => {
    if (records.length === 0) {
      toast.error("내보낼 데이터가 없습니다");
      return;
    }
    const headers = ["순위", "이름", "게시글", "댓글", "출석", "회비", "종합점수"];
    const rows = records.map((r) => [
      r.rank,
      r.name,
      r.postCount,
      r.commentCount,
      r.attendanceCount,
      r.financeCount,
      r.score,
    ]);
    exportToCsv(
      `활동리포트_${groupName}_${PERIOD_LABELS[period]}`,
      headers,
      rows
    );
    toast.success("CSV 파일이 다운로드되었습니다");
  };

  /** 순위에 따른 배지 색상 */
  function rankBadge(rank: number) {
    if (rank === 1)
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 border-yellow-200">
          1위
        </Badge>
      );
    if (rank === 2)
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700 border-gray-200">
          2위
        </Badge>
      );
    if (rank === 3)
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
          3위
        </Badge>
      );
    return (
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {rank}위
      </span>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            멤버 활동 리포트
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as ActivityPeriod)}
            >
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PERIOD_LABELS) as [ActivityPeriod, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleExportCsv}
              disabled={loading || records.length === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          점수 기준: 게시글 x3 · 댓글 x1 · 출석 x5 · 회비 x2
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            데이터를 불러오는 중...
          </div>
        ) : records.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            해당 기간에 활동 데이터가 없습니다
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-[11px] h-8 w-12 text-center px-2">
                    순위
                  </TableHead>
                  <TableHead className="text-[11px] h-8 px-2">이름</TableHead>
                  <TableHead className="text-[11px] h-8 text-right px-2">
                    게시글
                  </TableHead>
                  <TableHead className="text-[11px] h-8 text-right px-2">
                    댓글
                  </TableHead>
                  <TableHead className="text-[11px] h-8 text-right px-2">
                    출석
                  </TableHead>
                  <TableHead className="text-[11px] h-8 text-right px-2">
                    회비
                  </TableHead>
                  <TableHead className="text-[11px] h-8 text-right px-2 font-semibold">
                    종합점수
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record.memberId}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="text-center px-2 py-2">
                      {rankBadge(record.rank)}
                    </TableCell>
                    <TableCell className="text-xs font-medium px-2 py-2 max-w-[120px] truncate">
                      {record.name}
                    </TableCell>
                    <TableCell className="text-xs text-right px-2 py-2 tabular-nums">
                      {record.postCount > 0 ? (
                        <span className="text-blue-600 font-medium">
                          {record.postCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right px-2 py-2 tabular-nums">
                      {record.commentCount > 0 ? (
                        <span className="text-indigo-600 font-medium">
                          {record.commentCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right px-2 py-2 tabular-nums">
                      {record.attendanceCount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {record.attendanceCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right px-2 py-2 tabular-nums">
                      {record.financeCount > 0 ? (
                        <span className="text-orange-600 font-medium">
                          {record.financeCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right px-2 py-2 tabular-nums font-semibold">
                      {record.score > 0 ? (
                        <span className="text-foreground">{record.score}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
