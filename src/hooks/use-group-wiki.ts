"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { WikiDocument, WikiCategory } from "@/types";

const STORAGE_PREFIX = "dancebase:group-wiki:";
const MAX_DOCUMENTS = 50;

function getStorageKey(groupId: string) {
  return `${STORAGE_PREFIX}${groupId}`;
}

function saveDocuments(groupId: string, docs: WikiDocument[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(docs));
  } catch {
    // localStorage 용량 초과 등의 경우 무시
  }
}

export type WikiDocumentInput = {
  title: string;
  content: string;
  category: WikiCategory;
};

export function useGroupWiki(groupId: string) {
  const [documents, setDocuments] = useState<WikiDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<WikiCategory | "all">("all");

  // 필터링된 문서 목록
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  // 고정 문서와 일반 문서 분리
  const pinnedDocuments = filteredDocuments.filter((d) => d.pinned);
  const unpinnedDocuments = filteredDocuments.filter((d) => !d.pinned);

  const persistAndUpdate = useCallback(
    (newDocs: WikiDocument[]) => {
      const sorted = [...newDocs].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      saveDocuments(groupId, sorted);
      setDocuments(sorted);
    },
    [groupId]
  );

  const addDocument = useCallback(
    (input: WikiDocumentInput, createdBy: string): boolean => {
      if (documents.length >= MAX_DOCUMENTS) {
        toast.error(`위키 문서는 최대 ${MAX_DOCUMENTS}개까지 작성할 수 있습니다.`);
        return false;
      }
      if (!input.title.trim()) {
        toast.error("제목을 입력해주세요.");
        return false;
      }
      if (!input.content.trim()) {
        toast.error("내용을 입력해주세요.");
        return false;
      }

      const now = new Date().toISOString();
      const newDoc: WikiDocument = {
        id: crypto.randomUUID(),
        groupId,
        title: input.title.trim(),
        content: input.content.trim(),
        category: input.category,
        pinned: false,
        createdBy,
        createdAt: now,
        updatedAt: now,
      };

      persistAndUpdate([...documents, newDoc]);
      toast.success("위키 문서가 작성되었습니다.");
      return true;
    },
    [documents, groupId, persistAndUpdate]
  );

  const updateDocument = useCallback(
    (id: string, input: WikiDocumentInput): boolean => {
      if (!input.title.trim()) {
        toast.error("제목을 입력해주세요.");
        return false;
      }
      if (!input.content.trim()) {
        toast.error("내용을 입력해주세요.");
        return false;
      }

      const updated = documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              title: input.title.trim(),
              content: input.content.trim(),
              category: input.category,
              updatedAt: new Date().toISOString(),
            }
          : doc
      );

      persistAndUpdate(updated);
      toast.success("위키 문서가 수정되었습니다.");
      return true;
    },
    [documents, persistAndUpdate]
  );

  const deleteDocument = useCallback(
    (id: string): void => {
      const updated = documents.filter((doc) => doc.id !== id);
      persistAndUpdate(updated);
      toast.success("위키 문서가 삭제되었습니다.");
    },
    [documents, persistAndUpdate]
  );

  const togglePin = useCallback(
    (id: string): void => {
      const updated = documents.map((doc) =>
        doc.id === id ? { ...doc, pinned: !doc.pinned } : doc
      );
      persistAndUpdate(updated);
    },
    [documents, persistAndUpdate]
  );

  return {
    documents,
    filteredDocuments,
    pinnedDocuments,
    unpinnedDocuments,
    loading: false,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addDocument,
    updateDocument,
    deleteDocument,
    togglePin,
    totalCount: documents.length,
    maxReached: documents.length >= MAX_DOCUMENTS,
  };
}
