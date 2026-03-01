"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarInput } from "./practice-venue-star-rating";
import {
  ALL_FACILITIES,
  FACILITY_LABELS,
  STATUS_LABELS,
  VENUE_FORM_INITIAL,
  validateVenueForm,
} from "./practice-venue-types";
import type { PracticeVenueEntry, PracticeVenueFacility, PracticeVenueStatus } from "@/types";

interface AddVenueDialogProps {
  onAdd: (
    input: Omit<PracticeVenueEntry, "id" | "ratingCount" | "isFavorite" | "createdAt">
  ) => Promise<void>;
}

export function AddVenueDialog({ onAdd }: AddVenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(VENUE_FORM_INITIAL);
  const [selectedFacilities, setSelectedFacilities] = useState<PracticeVenueFacility[]>([]);
  const [status, setStatus] = useState<PracticeVenueStatus>("unknown");
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState("");

  const updateField = (field: keyof typeof VENUE_FORM_INITIAL, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(VENUE_FORM_INITIAL);
    setSelectedFacilities([]);
    setStatus("unknown");
    setRating(0);
    setMemo("");
  };

  const toggleFacility = (f: PracticeVenueFacility) => {
    setSelectedFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSubmit = async () => {
    const validation = validateVenueForm(form);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    await onAdd({
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      website: form.website.trim() || undefined,
      costPerHour: form.costPerHour.trim() ? Number(form.costPerHour) : undefined,
      capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
      size: form.size.trim() ? Number(form.size) : undefined,
      facilities: selectedFacilities,
      status,
      rating: rating > 0 ? rating : undefined,
      memo: memo.trim() || undefined,
      lastUsedAt: form.lastUsedAt || undefined,
    });

    toast.success("연습 장소가 등록되었습니다.");
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          장소 추가
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="add-venue-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">연습 장소 추가</DialogTitle>
          <p id="add-venue-desc" className="sr-only">
            그룹에서 사용하는 연습 장소를 새로 등록합니다.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-700">기본 정보</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="venue-name" className="text-[10px] text-gray-500">
                  장소명 *
                </Label>
                <Input
                  id="venue-name"
                  placeholder="예: 홍대 댄스 스튜디오"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                  aria-required="true"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="venue-address" className="text-[10px] text-gray-500">
                  주소
                </Label>
                <Input
                  id="venue-address"
                  placeholder="예: 서울 마포구 홍대로 12"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-phone" className="text-[10px] text-gray-500">
                  전화번호
                </Label>
                <Input
                  id="venue-phone"
                  placeholder="예: 02-1234-5678"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-website" className="text-[10px] text-gray-500">
                  웹사이트
                </Label>
                <Input
                  id="venue-website"
                  placeholder="예: https://studio.com"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-cost" className="text-[10px] text-gray-500">
                  시간당 비용 (원)
                </Label>
                <Input
                  id="venue-cost"
                  type="number"
                  min="0"
                  placeholder="예: 30000"
                  value={form.costPerHour}
                  onChange={(e) => updateField("costPerHour", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-capacity" className="text-[10px] text-gray-500">
                  수용 인원 (명)
                </Label>
                <Input
                  id="venue-capacity"
                  type="number"
                  min="1"
                  placeholder="예: 20"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-size" className="text-[10px] text-gray-500">
                  면적 (m²)
                </Label>
                <Input
                  id="venue-size"
                  type="number"
                  min="1"
                  placeholder="예: 50"
                  value={form.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="venue-last-used" className="text-[10px] text-gray-500">
                  마지막 이용일
                </Label>
                <Input
                  id="venue-last-used"
                  type="date"
                  value={form.lastUsedAt}
                  onChange={(e) => updateField("lastUsedAt", e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
            </div>
          </fieldset>

          <Separator />

          {/* 예약 상태 */}
          <div className="space-y-1.5">
            <Label htmlFor="venue-status" className="text-xs font-medium text-gray-700">
              예약 상태
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as PracticeVenueStatus)}
            >
              <SelectTrigger id="venue-status" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 시설 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-700">시설</legend>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="시설 선택">
              {ALL_FACILITIES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Checkbox
                    id={`add-facility-${f}`}
                    checked={selectedFacilities.includes(f)}
                    onCheckedChange={() => toggleFacility(f)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`add-facility-${f}`}
                    className="text-xs text-gray-700 cursor-pointer"
                  >
                    {FACILITY_LABELS[f]}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <Separator />

          {/* 초기 평점 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">초기 평점 (선택)</Label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <Separator />

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label htmlFor="venue-memo" className="text-xs font-medium text-gray-700">
              메모 (선택)
            </Label>
            <Textarea
              id="venue-memo"
              placeholder="특이사항이나 참고 사항을 자유롭게 입력하세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            장소 등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
