"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X, Loader2 } from "lucide-react";

type AddressSearchProps = {
  value?: string;
  onSelect: (address: string, lat: number, lng: number) => void;
  onClear: () => void;
};

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      countrycodes: "kr",
    })}`,
    { headers: { "Accept-Language": "ko" } }
  );
  const data = await res.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

export function AddressSearch({ value, onSelect, onClear }: AddressSearchProps) {
  const [ready, setReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => typeof daum !== "undefined" && !!daum.Postcode;
    if (check()) {
      setReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (check()) {
        setReady(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback(() => {
    if (!ready) return;
    setError(null);

    new daum.Postcode({
      oncomplete: async (data) => {
        const address = data.roadAddress || data.address;
        setGeocoding(true);
        const coords = await geocodeAddress(address);
        setGeocoding(false);

        if (coords) {
          onSelect(address, coords.lat, coords.lng);
        } else {
          // 좌표를 못 찾으면 주소만이라도 설정 (위치기반 출석은 불가)
          setError("좌표를 찾을 수 없습니다. 주소만 저장됩니다.");
          onSelect(address, 0, 0);
        }
      },
    }).open();
  }, [ready, onSelect]);

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={geocoding ? "좌표 변환 중..." : value || ""}
          placeholder={ready ? "주소 검색을 눌러주세요" : "로딩 중..."}
          readOnly
          className="cursor-pointer"
          onClick={handleSearch}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setError(null);
              onClear();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSearch}
            disabled={!ready || geocoding}
          >
            {geocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
