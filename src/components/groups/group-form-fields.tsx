"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { GroupType, GroupVisibility, GroupJoinPolicy } from "@/types";
import { GROUP_TYPES } from "@/types";
import {




} from "@/lib/validation";

const COMMON_GENRES = [
  "힙합", "팝핑", "락킹", "왁킹", "하우스", "크럼프",
  "브레이킹", "코레오", "K-POP", "재즈", "컨템포러리", "스트릿",
];

export type GroupFormValues = {
  name: string;
  description: string;
  groupType: GroupType;
  visibility: GroupVisibility;
  joinPolicy: GroupJoinPolicy;
  danceGenre: string[];
  maxMembers: string;
};

export const DEFAULT_GROUP_FORM_VALUES: GroupFormValues = {
  name: "",
  description: "",
  groupType: "기타",
  visibility: "private",
  joinPolicy: "invite_only",
  danceGenre: [],
  maxMembers: "",
};

export type GroupFormFieldErrors = {
  name?: string;
  maxMembers?: string;
};

type GroupFormFieldsProps = {
  values: GroupFormValues;
  onChange: <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => void;
  errors?: GroupFormFieldErrors;
  onBlur?: (field: keyof GroupFormFieldErrors) => void;
};

export function GroupFormFields({ values, onChange, errors = {}, onBlur }: GroupFormFieldsProps) {
  const [genreInput, setGenreInput] = useState("");

  const addGenre = (genre: string) => {
    const trimmed = genre.trim();
    if (trimmed && !values.danceGenre.includes(trimmed)) {
      onChange("danceGenre", [...values.danceGenre, trimmed]);
    }
    setGenreInput("");
  };

  const removeGenre = (genre: string) => {
    onChange("danceGenre", values.danceGenre.filter((g) => g !== genre));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="group-name" className="text-xs">
              그룹 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="예: 서울 힙합 크루"
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
              onBlur={() => onBlur?.("name")}
              required
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
            <p className="text-[10px] text-muted-foreground">2~50자 이내로 입력해주세요</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-description" className="text-xs">설명</Label>
            <Textarea
              id="group-description"
              placeholder="그룹에 대한 설명 (선택사항)"
              value={values.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">그룹 유형</Label>
            <Select
              value={values.groupType}
              onValueChange={(v) => onChange("groupType", v as GroupType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">댄스 장르</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {values.danceGenre.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1">
                {genre}
                <button type="button" onClick={() => removeGenre(genre)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              placeholder="장르를 입력하세요"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGenre(genreInput);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addGenre(genreInput)}
              disabled={!genreInput.trim()}
            >
              추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_GENRES.filter((g) => !values.danceGenre.includes(g)).map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => addGenre(genre)}
                className="text-xs px-2 py-1 rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                + {genre}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">공개 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">공개 범위</Label>
            <Select
              value={values.visibility}
              onValueChange={(v) => onChange("visibility", v as GroupVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">공개 - 탐색 페이지에 노출</SelectItem>
                <SelectItem value="unlisted">일부공개 - 링크가 있는 사용자만 접근</SelectItem>
                <SelectItem value="private">비공개 - 초대를 통해서만 접근</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">가입 정책</Label>
            <Select
              value={values.joinPolicy}
              onValueChange={(v) => onChange("joinPolicy", v as GroupJoinPolicy)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invite_only">초대만 - 초대 코드로만 가입</SelectItem>
                <SelectItem value="approval">승인제 - 가입 신청 후 그룹장 승인</SelectItem>
                <SelectItem value="open">자유 가입 - 누구나 바로 가입</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">인원 제한</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="max-members" className="text-xs">최대 인원</Label>
          <Input
            id="max-members"
            type="number"
            min="1"
            value={values.maxMembers}
            onChange={(e) => onChange("maxMembers", e.target.value)}
            onBlur={() => onBlur?.("maxMembers")}
            placeholder="무제한"
            className={errors.maxMembers ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.maxMembers && (
            <p className="text-xs text-destructive">{errors.maxMembers}</p>
          )}
          <p className="text-xs text-muted-foreground">비워두면 인원 제한 없음</p>
        </CardContent>
      </Card>
    </div>
  );
}
