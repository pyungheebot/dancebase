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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Link, Clock, Trash2, Loader2 } from "lucide-react";
import { useReceiptShare } from "@/hooks/use-receipt-share";
import type { FinanceTransactionWithDetails } from "@/types";

type Props = {
  transaction: FinanceTransactionWithDetails;
};

export function ReceiptShareDialog({ transaction }: Props) {
  const [open, setOpen] = useState(false);
  const { token, loading, createToken, deleteToken, copyLink, isExpired } =
    useReceiptShare(transaction.id);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/receipt/${token.token}`
      : token
      ? `/receipt/${token.token}`
      : "";

  const handleCreate = async () => {
    setCreating(true);
    await createToken();
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    await deleteToken(token.id);
    setDeleting(false);
  };

  const handleCopy = async () => {
    if (!token) return;
    await copyLink(token.token);
  };

  const expired = token ? isExpired(token) : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label="영수증 공유"
        >
          <Share2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Link className="h-4 w-4 text-muted-foreground" />
            영수증 공유 링크
          </DialogTitle>
        </DialogHeader>

        {/* 거래 정보 요약 */}
        <div className="rounded-lg border bg-muted/40 px-3 py-2 mb-1">
          <p className="text-xs font-medium truncate">{transaction.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-xs font-semibold tabular-nums ${
                transaction.type === "income"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {transaction.amount.toLocaleString("ko-KR")}원
            </span>
            <span className="text-[11px] text-muted-foreground">
              {transaction.transaction_date}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : token && !expired ? (
          /* 기존 토큰 표시 */
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40 gap-1 shrink-0"
              >
                활성
              </Badge>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {format(new Date(token.expires_at), "M월 d일(EEE) HH:mm 만료", {
                    locale: ko,
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Input
                value={shareUrl}
                readOnly
                className="h-7 text-[11px] font-mono bg-muted/40 flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 gap-1 shrink-0"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
                복사
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-destructive hover:text-destructive w-full gap-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              링크 삭제
            </Button>
          </div>
        ) : (
          /* 토큰 없음 또는 만료됨 */
          <div className="space-y-2">
            {expired && token && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700 gap-1"
              >
                만료된 링크
              </Badge>
            )}
            <p className="text-[11px] text-muted-foreground">
              {expired
                ? "기존 링크가 만료되었습니다. 새 링크를 생성하세요."
                : "공유 링크를 생성하면 7일간 유효한 링크가 만들어집니다."}
            </p>
            <Button
              size="sm"
              className="w-full h-7 text-xs gap-1.5"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Share2 className="h-3 w-3" />
              )}
              공유 링크 생성
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
