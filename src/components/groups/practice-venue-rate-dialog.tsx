"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StarInput } from "./practice-venue-star-rating";
import type { PracticeVenueEntry } from "@/types";

interface RateVenueDialogProps {
  venue: PracticeVenueEntry;
  onRate: (id: string, rating: number) => Promise<void>;
}

export function RateVenueDialog({ venue, onRate }: RateVenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("평점을 선택해주세요.");
      return;
    }
    await onRate(venue.id, rating);
    toast.success("평점이 등록되었습니다.");
    setOpen(false);
    setRating(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2 gap-1"
          aria-label={`${venue.name} 평점 등록`}
        >
          <Star className="h-3 w-3" aria-hidden="true" />
          평점
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-xs"
        aria-describedby="rate-venue-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">{venue.name} 평점</DialogTitle>
          <p id="rate-venue-desc" className="sr-only">
            이 연습 장소에 대한 평점을 등록합니다.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {venue.rating != null && (
            <p className="text-xs text-gray-500" aria-live="polite">
              현재 평균: {venue.rating.toFixed(1)}점 ({venue.ratingCount}명 참여)
            </p>
          )}
          <div>
            <Label className="text-xs text-gray-700">내 평점</Label>
            <div className="mt-1.5">
              <StarInput value={rating} onChange={setRating} />
            </div>
          </div>
          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
