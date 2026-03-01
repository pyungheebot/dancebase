"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { FinancePrintView } from "./finance-print-view";
import type { FinanceTransactionWithDetails } from "@/types";

type Props = {
  transactions: FinanceTransactionWithDetails[];
  groupName: string;
  periodLabel: string;
  nicknameMap: Record<string, string>;
};

export function FinanceExportButton({
  transactions,
  groupName,
  periodLabel,
  nicknameMap,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] px-2 gap-1"
          disabled={transactions.length === 0}
        >
          <Printer className="h-3 w-3" />
          인쇄 / PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">정산 인쇄 미리보기</DialogTitle>
        </DialogHeader>
        <FinancePrintView
          transactions={transactions}
          groupName={groupName}
          periodLabel={periodLabel}
          nicknameMap={nicknameMap}
        />
      </DialogContent>
    </Dialog>
  );
}
