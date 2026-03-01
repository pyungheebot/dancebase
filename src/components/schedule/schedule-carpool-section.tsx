"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Car, Users, MapPin, Clock, Check, X, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useScheduleCarpool, type CarpoolOfferWithDetails } from "@/hooks/use-schedule-carpool";
import { useAsyncAction } from "@/hooks/use-async-action";

type Props = {
  scheduleId: string;
};

function RequestStatusBadge({ status }: { status: string }) {
  if (status === "accepted") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300">
        수락
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-300">
        거절
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
      대기
    </Badge>
  );
}

function CarpoolOfferCard({
  offer,
  currentUserId,
  onRequestRide,
  onRespondToRequest,
  onCancelRequest,
  onDeleteOffer,
}: {
  offer: CarpoolOfferWithDetails;
  currentUserId: string | null;
  onRequestRide: (offerId: string) => Promise<void>;
  onRespondToRequest: (requestId: string, status: "accepted" | "rejected") => Promise<void>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onDeleteOffer: (offerId: string) => Promise<void>;
}) {
  const { pending: loading, execute } = useAsyncAction();

  const isDriver = offer.driver_id === currentUserId;
  const myRequest = offer.requests.find((r) => r.passenger_id === currentUserId);
  const acceptedRequests = offer.requests.filter((r) => r.status === "accepted");
  const pendingRequests = offer.requests.filter((r) => r.status === "pending");
  const rejectedRequests = offer.requests.filter((r) => r.status === "rejected");

  const handleRequestRide = async () => {
    await execute(async () => {
      try {
        await onRequestRide(offer.id);
        toast.success("탑승 요청을 보냈습니다");
      } catch {
        toast.error("탑승 요청에 실패했습니다");
      }
    });
  };

  const handleRespond = async (requestId: string, status: "accepted" | "rejected") => {
    await execute(async () => {
      try {
        await onRespondToRequest(requestId, status);
        toast.success(status === "accepted" ? "탑승 요청을 수락했습니다" : "탑승 요청을 거절했습니다");
      } catch {
        toast.error("응답 처리에 실패했습니다");
      }
    });
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;
    await execute(async () => {
      try {
        await onCancelRequest(myRequest.id);
        toast.success("탑승 요청을 취소했습니다");
      } catch {
        toast.error("요청 취소에 실패했습니다");
      }
    });
  };

  const handleDeleteOffer = async () => {
    await execute(async () => {
      try {
        await onDeleteOffer(offer.id);
        toast.success("카풀 제공을 삭제했습니다");
      } catch {
        toast.error("카풀 제공 삭제에 실패했습니다");
      }
    });
  };

  const seatLabel = `${acceptedRequests.length}/${offer.total_seats}석`;
  const isFull = offer.remaining_seats <= 0;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* 헤더: 드라이버 정보 + 좌석 수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {offer.profiles?.name ?? "알 수 없음"}
          </span>
          {isDriver && (
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-300">
              나
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            className={`text-[10px] px-1.5 py-0 ${
              isFull
                ? "bg-gray-100 text-gray-600 border-gray-300"
                : "bg-green-100 text-green-700 border-green-300"
            }`}
          >
            <Users className="h-2.5 w-2.5 mr-0.5" />
            {seatLabel}
            {isFull ? " (마감)" : ` (잔여 ${offer.remaining_seats})`}
          </Badge>
          {isDriver && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={loading}
              onClick={handleDeleteOffer}
              aria-label="카풀 제공 삭제"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* 출발 정보 */}
      {(offer.departure_location || offer.departure_time) && (
        <div className="space-y-0.5">
          {offer.departure_location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{offer.departure_location}</span>
            </div>
          )}
          {offer.departure_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(offer.departure_time).toLocaleString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 메모 */}
      {offer.notes && (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{offer.notes}</p>
      )}

      {/* 탑승 요청 버튼 (본인 offer 아닌 경우) */}
      {!isDriver && !myRequest && !isFull && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs w-full"
          disabled={loading}
          onClick={handleRequestRide}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          탑승 요청
        </Button>
      )}

      {/* 내 요청 상태 표시 */}
      {!isDriver && myRequest && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">내 요청:</span>
            <RequestStatusBadge status={myRequest.status} />
          </div>
          {myRequest.status === "pending" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-muted-foreground"
              disabled={loading}
              onClick={handleCancelRequest}
            >
              취소
            </Button>
          )}
        </div>
      )}

      {/* 드라이버용: 승객 목록 */}
      {isDriver && offer.requests.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t">
          <p className="text-[10px] font-medium text-muted-foreground">탑승 요청 목록</p>
          {[...acceptedRequests, ...pendingRequests, ...rejectedRequests].map((req) => (
            <div key={req.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{req.profiles?.name ?? "알 수 없음"}</span>
                <RequestStatusBadge status={req.status} />
              </div>
              {req.status === "pending" && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={loading}
                    onClick={() => handleRespond(req.id, "accepted")}
                    aria-label="수락"
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={loading}
                    onClick={() => handleRespond(req.id, "rejected")}
                    aria-label="거절"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ScheduleCarpoolSection({ scheduleId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalSeats, setTotalSeats] = useState("3");
  const [departureLocation, setDepartureLocation] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [notes, setNotes] = useState("");
  const { pending: submitting, execute: executeCreate } = useAsyncAction();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const { offers, loading, createOffer, deleteOffer, requestRide, respondToRequest, cancelRequest } =
    useScheduleCarpool(scheduleId);

  const myOffer = offers.find((o) => o.driver_id === currentUserId);

  const handleCreateOffer = async () => {
    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      toast.error("좌석 수는 1~8 사이로 입력해주세요");
      return;
    }

    await executeCreate(async () => {
      try {
        await createOffer(seats, departureLocation || undefined, departureTime || undefined, notes || undefined);
        toast.success("카풀 제공을 등록했습니다");
        setDialogOpen(false);
        setTotalSeats("3");
        setDepartureLocation("");
        setDepartureTime("");
        setNotes("");
      } catch {
        toast.error("카풀 제공 등록에 실패했습니다");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">카풀</p>
        </div>
        {!myOffer && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
            카풀 제공하기
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : offers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          아직 카풀 제공이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <CarpoolOfferCard
              key={offer.id}
              offer={offer}
              currentUserId={currentUserId}
              onRequestRide={requestRide}
              onRespondToRequest={respondToRequest}
              onCancelRequest={cancelRequest}
              onDeleteOffer={deleteOffer}
            />
          ))}
        </div>
      )}

      {/* 카풀 제공하기 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">카풀 제공하기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">
                좌석 수 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={8}
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                className="h-8 text-xs"
                placeholder="1~8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">출발 장소 (선택)</Label>
              <Input
                value={departureLocation}
                onChange={(e) => setDepartureLocation(e.target.value)}
                className="h-8 text-xs"
                placeholder="예: 강남역 2번 출구"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">출발 시간 (선택)</Label>
              <Input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">메모 (선택)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
                placeholder="탑승자에게 전달할 내용을 입력해주세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreateOffer}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
