"use client";

import {
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Mail,
  FileText,
  Printer,
  Globe,
} from "lucide-react";
import type { MarketingChannel } from "@/types";

type ChannelIconProps = {
  channel: MarketingChannel;
  /** 아이콘 크기 클래스 (기본값: "h-3 w-3") */
  className?: string;
};

export function ChannelIcon({ channel, className = "h-3 w-3" }: ChannelIconProps) {
  switch (channel) {
    case "instagram":
      return <Instagram className={className} aria-hidden="true" />;
    case "youtube":
      return <Youtube className={className} aria-hidden="true" />;
    case "tiktok":
      return <Globe className={className} aria-hidden="true" />;
    case "twitter":
      return <Twitter className={className} aria-hidden="true" />;
    case "facebook":
      return <Facebook className={className} aria-hidden="true" />;
    case "poster":
      return <FileText className={className} aria-hidden="true" />;
    case "flyer":
      return <Printer className={className} aria-hidden="true" />;
    case "email":
      return <Mail className={className} aria-hidden="true" />;
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
}
