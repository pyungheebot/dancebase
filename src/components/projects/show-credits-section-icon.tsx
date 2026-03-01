"use client";

import {
  Users,
  Star,
  Music,
  Lightbulb,
  Shirt,
  Layout,
  Megaphone,
  Heart,
} from "lucide-react";
import type { CreditSectionType } from "@/types";

interface SectionTypeIconProps {
  type: CreditSectionType;
  className?: string;
}

export function SectionTypeIcon({ type, className }: SectionTypeIconProps) {
  const props = { className: className ?? "h-3 w-3" };
  switch (type) {
    case "cast":
      return <Users {...props} aria-hidden="true" />;
    case "choreography":
      return <Star {...props} aria-hidden="true" />;
    case "music":
      return <Music {...props} aria-hidden="true" />;
    case "lighting":
      return <Lightbulb {...props} aria-hidden="true" />;
    case "costume":
      return <Shirt {...props} aria-hidden="true" />;
    case "stage":
      return <Layout {...props} aria-hidden="true" />;
    case "planning":
      return <Megaphone {...props} aria-hidden="true" />;
    case "special_thanks":
      return <Heart {...props} aria-hidden="true" />;
  }
}
