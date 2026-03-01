"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleCarpool } from "@/lib/swr/invalidate";
import type {CarpoolOffer, CarpoolRequest, Profile} from "@/types";

export type CarpoolRequestWithProfile = CarpoolRequest & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type CarpoolOfferWithDetails = CarpoolOffer & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
  requests: CarpoolRequestWithProfile[];
  remaining_seats: number;
};

export function useScheduleCarpool(scheduleId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.scheduleCarpool(scheduleId),
    async () => {
      const supabase = createClient();

      // offers 조회 (드라이버 프로필 조인)
      const { data: offers, error: offersError } = await supabase
        .from("schedule_carpool_offers")
        .select("*, profiles(id, name, avatar_url)")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: true });

      if (offersError) throw offersError;

      if (!offers || offers.length === 0) return [];

      const offerIds = offers.map((o: { id: string }) => o.id);

      // requests 조회 (승객 프로필 조인)
      const { data: requests, error: requestsError } = await supabase
        .from("schedule_carpool_requests")
        .select("*, profiles(id, name, avatar_url)")
        .in("offer_id", offerIds)
        .order("created_at", { ascending: true });

      if (requestsError) throw requestsError;

      type OfferRow = CarpoolOffer & { profiles: Pick<Profile, "id" | "name" | "avatar_url"> };
      type RequestRow = CarpoolRequest & { profiles: Pick<Profile, "id" | "name" | "avatar_url"> };

      // offer별 requests 그룹화 및 남은 좌석 계산
      const offerWithDetails: CarpoolOfferWithDetails[] = (offers as OfferRow[]).map((offer) => {
        const offerRequests = ((requests ?? []) as RequestRow[]).filter((r) => r.offer_id === offer.id);
        const acceptedCount = offerRequests.filter((r) => r.status === "accepted").length;
        const remaining = offer.total_seats - acceptedCount;

        return {
          ...offer,
          requests: offerRequests as CarpoolRequestWithProfile[],
          remaining_seats: remaining,
        };
      });

      return offerWithDetails;
    }
  );

  const createOffer = async (
    totalSeats: number,
    departureLocation?: string,
    departureTime?: string,
    notes?: string
  ) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase.from("schedule_carpool_offers").insert({
      schedule_id: scheduleId,
      driver_id: user.id,
      total_seats: totalSeats,
      departure_location: departureLocation || null,
      departure_time: departureTime || null,
      notes: notes || null,
    });

    if (error) throw error;
    invalidateScheduleCarpool(scheduleId);
    await mutate();
  };

  const deleteOffer = async (offerId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedule_carpool_offers")
      .delete()
      .eq("id", offerId);

    if (error) throw error;
    invalidateScheduleCarpool(scheduleId);
    await mutate();
  };

  const requestRide = async (offerId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase.from("schedule_carpool_requests").insert({
      offer_id: offerId,
      passenger_id: user.id,
      status: "pending",
    });

    if (error) throw error;
    invalidateScheduleCarpool(scheduleId);
    await mutate();
  };

  const respondToRequest = async (requestId: string, status: "accepted" | "rejected") => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedule_carpool_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) throw error;
    invalidateScheduleCarpool(scheduleId);
    await mutate();
  };

  const cancelRequest = async (requestId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedule_carpool_requests")
      .delete()
      .eq("id", requestId);

    if (error) throw error;
    invalidateScheduleCarpool(scheduleId);
    await mutate();
  };

  return {
    offers: (data ?? []) as CarpoolOfferWithDetails[],
    loading: isLoading,
    refetch: () => mutate(),
    createOffer,
    deleteOffer,
    requestRide,
    respondToRequest,
    cancelRequest,
  };
}
