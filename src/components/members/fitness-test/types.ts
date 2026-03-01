import type { FitnessTestCategory, FitnessTestItem, FitnessTestResult } from "@/types";

// ============================================================
// Props 타입
// ============================================================

export interface FitnessTestCardProps {
  groupId: string;
  memberNames: string[];
}

export interface ResultCardProps {
  result: FitnessTestResult;
  testItems: FitnessTestItem[];
  onDelete: () => void;
}

export interface TestItemRowProps {
  item: FitnessTestItem;
  onDelete: () => void;
}

export interface AddItemFormProps {
  onAdd: (
    name: string,
    category: FitnessTestCategory,
    unit: string,
    higherIsBetter: boolean
  ) => void;
}

export interface RecordResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testItems: FitnessTestItem[];
  memberNames: string[];
  onSubmit: (
    memberName: string,
    date: string,
    items: { itemName: string; value: number; category: FitnessTestCategory }[],
    notes?: string
  ) => void;
}

// re-export for convenience
export type { FitnessTestCategory, FitnessTestItem, FitnessTestResult };
