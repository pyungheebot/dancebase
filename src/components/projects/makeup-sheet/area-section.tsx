"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AREA_LABELS, AREA_COLORS, AREA_BADGE_COLORS } from "./types";
import type { AreaSectionProps } from "./types";

export const AreaSection = React.memo(function AreaSection({
  area,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: AreaSectionProps) {
  const sorted = [...products].sort((a, b) => a.order - b.order);

  return (
    <div
      className={`rounded-md border p-2.5 ${AREA_COLORS[area]}`}
      role="region"
      aria-label={`${AREA_LABELS[area]} 부위 제품`}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${AREA_BADGE_COLORS[area]}`}
        >
          {AREA_LABELS[area]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
          onClick={onAddProduct}
          aria-label={`${AREA_LABELS[area]} 제품 추가`}
        >
          <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
          제품 추가
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[10px] text-muted-foreground py-1" role="status">
          등록된 제품이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1.5" role="list">
          {sorted.map((product) => (
            <li
              key={product.id}
              className="flex items-start gap-2 bg-card/70 rounded px-2 py-1.5 group"
              role="listitem"
            >
              {/* 색상 칩 */}
              <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                {product.colorCode &&
                /^#[0-9A-Fa-f]{3,6}$/.test(product.colorCode) ? (
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-border"
                    style={{ backgroundColor: product.colorCode }}
                    role="img"
                    aria-label={`색상: ${product.colorCode}`}
                  />
                ) : (
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-muted border border-border" />
                )}
              </div>

              {/* 제품 정보 */}
              <dl className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <dt className="sr-only">제품명</dt>
                  <dd className="text-xs font-medium truncate">
                    {product.productName}
                  </dd>
                  {product.brand && (
                    <>
                      <dt className="sr-only">브랜드</dt>
                      <dd className="text-[10px] text-muted-foreground flex-shrink-0">
                        {product.brand}
                      </dd>
                    </>
                  )}
                </div>
                {product.technique && (
                  <div>
                    <dt className="sr-only">기법</dt>
                    <dd className="text-[10px] text-muted-foreground truncate">
                      기법: {product.technique}
                    </dd>
                  </div>
                )}
              </dl>

              {/* 순서 표시 */}
              <span
                className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5"
                aria-label={`순서 ${product.order + 1}`}
              >
                #{product.order + 1}
              </span>

              {/* 액션 버튼 */}
              <div
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                role="group"
                aria-label={`${product.productName} 관리`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => onEditProduct(product)}
                  aria-label={`${product.productName} 편집`}
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteProduct(product.id)}
                  aria-label={`${product.productName} 삭제`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
