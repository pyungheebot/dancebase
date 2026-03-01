"use client";

import { useState, useEffect, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, ArrowUp, ArrowDown } from "lucide-react";
type CardWithDisabled = {
  id: string;
  visible: boolean;
  label: string;
  disabled: boolean;
  disabledReason?: string;
};

type Props = {
  allCards: CardWithDisabled[];
  saving: boolean;
  onSave: (settings: { id: string; visible: boolean }[]) => Promise<void>;
};

export function DashboardSettingsDialog({ allCards, saving, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<CardWithDisabled[]>(allCards);

  useEffect(() => {
    if (open) {
      startTransition(() => { setCards(allCards); });
    }
  }, [open, allCards]);

  const moveCard = (index: number, direction: "up" | "down") => {
    const newCards = [...cards];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCards.length) return;
    [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
    setCards(newCards);
  };

  const toggleVisible = (index: number) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], visible: !newCards[index].visible };
    setCards(newCards);
  };

  const handleSave = async () => {
    const settings = cards.map(({ id, visible }) => ({
      id,
      visible,
    }));
    await onSave(settings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="대시보드 설정">
          <Settings2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-xs">대시보드 카드 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-0.5 mt-1">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center gap-1.5 rounded border px-2 py-1.5"
            >
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  disabled={index === 0}
                  onClick={() => moveCard(index, "up")}
                  aria-label="위로"
                >
                  <ArrowUp className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  disabled={index === cards.length - 1}
                  onClick={() => moveCard(index, "down")}
                  aria-label="아래로"
                >
                  <ArrowDown className="h-2.5 w-2.5" />
                </Button>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[11px]">{card.label}</span>
                {card.disabled && card.disabledReason && (
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    ({card.disabledReason})
                  </span>
                )}
              </div>

              <Switch
                checked={card.disabled ? false : card.visible}
                disabled={card.disabled}
                onCheckedChange={() => toggleVisible(index)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-2">
          <Button size="sm" className="h-6 text-xs px-2" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
