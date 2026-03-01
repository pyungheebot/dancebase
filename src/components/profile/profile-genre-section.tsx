"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { FieldLabel } from "@/components/profile/profile-basic-info-section";
import type { PrivacySettings, PrivacyField, PrivacyLevel } from "@/types";

interface ProfileGenreSectionProps {
  genres: string[];
  onGenresChange: (genres: string[]) => void;
  genreInput: string;
  onGenreInputChange: (v: string) => void;
  genreStartDates: Record<string, string>;
  onGenreStartDatesChange: (dates: Record<string, string>) => void;
  privacySettings: PrivacySettings;
  onPrivacyChange: (field: PrivacyField, value: PrivacyLevel) => void;
}

export function ProfileGenreSection({
  genres,
  onGenresChange,
  genreInput,
  onGenreInputChange,
  genreStartDates,
  onGenreStartDatesChange,
  privacySettings,
  onPrivacyChange,
}: ProfileGenreSectionProps) {
  const handleAddGenre = () => {
    const trimmed = genreInput.trim();
    if (trimmed && !genres.includes(trimmed)) {
      onGenresChange([...genres, trimmed]);
      if (!genreStartDates[trimmed]) {
        onGenreStartDatesChange({ ...genreStartDates, [trimmed]: "" });
      }
      onGenreInputChange("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    onGenresChange(genres.filter((g) => g !== genre));
    const next = { ...genreStartDates };
    delete next[genre];
    onGenreStartDatesChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddGenre();
    }
  };

  return (
    <>
      <div className="space-y-2">
        <FieldLabel
          label="댄스 장르"
          privacyField="dance_genre"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <div className="flex gap-2">
          <Input
            placeholder="장르 입력 후 Enter"
            value={genreInput}
            onChange={(e) => onGenreInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddGenre}
            aria-label="장르 추가"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {genres.length > 0 && (
          <div className="space-y-2 mt-2">
            {genres.map((genre) => (
              <div key={genre} className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 shrink-0">
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleRemoveGenre(genre)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
                <Input
                  type="month"
                  placeholder="시작일"
                  value={genreStartDates[genre] || ""}
                  onChange={(e) =>
                    onGenreStartDatesChange({
                      ...genreStartDates,
                      [genre]: e.target.value,
                    })
                  }
                  className="w-40"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <FieldLabel
          label="장르별 시작일"
          privacyField="dance_genre_start_dates"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <p className="text-xs text-muted-foreground">위 장르 옆에서 시작일을 설정하세요</p>
      </div>
    </>
  );
}
