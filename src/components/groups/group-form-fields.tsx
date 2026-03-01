"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
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
      {/* 기본 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 그룹 이름 */}
          <FormField
            label="그룹 이름"
            htmlFor="group-name"
            required
            error={errors.name}
            description="2~50자 이내로 입력해주세요"
          >
            <Input
              id="group-name"
              placeholder="예: 서울 힙합 크루"
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
              onBlur={() => onBlur?.("name")}
              required
              maxLength={50}
              aria-invalid={!!errors.name}
              aria-required="true"
              aria-describedby={errors.name ? "group-name-help" : "group-name-help"}
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </FormField>

          {/* 설명 */}
          <FormField
            label="설명"
            htmlFor="group-description"
            description="그룹에 대한 설명을 입력해주세요 (선택사항)"
          >
            <Textarea
              id="group-description"
              placeholder="그룹에 대한 설명 (선택사항)"
              value={values.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
              maxLength={500}
              showCharCount
              aria-label="그룹 설명 (선택)"
            />
          </FormField>

          {/* 그룹 유형 */}
          <div className="space-y-1">
            <Label htmlFor="group-type" className="text-xs">그룹 유형</Label>
            <Select
              value={values.groupType}
              onValueChange={(v) => onChange("groupType", v as GroupType)}
            >
              <SelectTrigger id="group-type" aria-label="그룹 유형 선택">
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

      {/* 댄스 장르 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">댄스 장르</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 선택된 장르 목록 */}
          <div className="flex flex-wrap gap-2" role="list" aria-label="선택된 장르 목록">
            {values.danceGenre.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1" role="listitem">
                {genre}
                <button
                  type="button"
                  onClick={() => removeGenre(genre)}
                  aria-label={`${genre} 장르 제거`}
                  className="focus:outline-none focus:ring-1 focus:ring-ring rounded"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>

          {/* 장르 직접 입력 */}
          <div className="flex gap-2">
            <Input
              id="genre-input"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              placeholder="장르를 입력하세요"
              aria-label="댄스 장르 직접 입력"
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
              aria-label="장르 추가"
            >
              추가
            </Button>
          </div>

          {/* 빠른 선택 */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="자주 쓰는 장르 빠른 선택">
            {COMMON_GENRES.filter((g) => !values.danceGenre.includes(g)).map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => addGenre(genre)}
                aria-label={`${genre} 장르 추가`}
                className="text-xs px-2 py-1 rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                + {genre}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 공개 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">공개 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 공개 범위 */}
          <div className="space-y-1">
            <Label htmlFor="group-visibility" className="text-xs">공개 범위</Label>
            <Select
              value={values.visibility}
              onValueChange={(v) => onChange("visibility", v as GroupVisibility)}
            >
              <SelectTrigger id="group-visibility" aria-label="그룹 공개 범위 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">공개 - 탐색 페이지에 노출</SelectItem>
                <SelectItem value="unlisted">일부공개 - 링크가 있는 사용자만 접근</SelectItem>
                <SelectItem value="private">비공개 - 초대를 통해서만 접근</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 가입 정책 */}
          <div className="space-y-1">
            <Label htmlFor="group-join-policy" className="text-xs">가입 정책</Label>
            <Select
              value={values.joinPolicy}
              onValueChange={(v) => onChange("joinPolicy", v as GroupJoinPolicy)}
            >
              <SelectTrigger id="group-join-policy" aria-label="그룹 가입 정책 선택">
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

      {/* 인원 제한 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">인원 제한</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <FormField
            label="최대 인원"
            htmlFor="max-members"
            error={errors.maxMembers}
            description="비워두면 인원 제한 없음"
          >
            <Input
              id="max-members"
              type="number"
              min="1"
              value={values.maxMembers}
              onChange={(e) => onChange("maxMembers", e.target.value)}
              onBlur={() => onBlur?.("maxMembers")}
              placeholder="무제한"
              aria-invalid={!!errors.maxMembers}
              aria-label="최대 인원 수 (선택)"
              className={errors.maxMembers ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </FormField>
        </CardContent>
      </Card>
    </div>
  );
}
