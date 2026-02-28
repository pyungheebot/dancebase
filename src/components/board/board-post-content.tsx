"use client";

import { Fragment } from "react";
import { YouTubeEmbed, extractYouTubeId } from "@/components/shared/youtube-embed";

interface BoardPostContentProps {
  content: string;
}

// 일반 URL 패턴
const URL_PATTERN = /https?:\/\/[^\s<]+/;

/** 줄에서 YouTube URL들을 추출 */
function findYouTubeUrls(line: string): string[] {
  const urlMatches = line.match(new RegExp(URL_PATTERN, "g")) || [];
  return urlMatches.filter((url) => extractYouTubeId(url) !== null);
}

export function BoardPostContent({ content }: BoardPostContentProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm whitespace-pre-wrap">
      {lines.map((line, lineIdx) => {
        const ytUrls = findYouTubeUrls(line);

        if (ytUrls.length > 0) {
          return (
            <Fragment key={lineIdx}>
              <p>{renderLineWithLinks(line)}</p>
              {ytUrls.map((ytUrl, i) => (
                <YouTubeEmbed key={`yt-${lineIdx}-${i}`} url={ytUrl} />
              ))}
            </Fragment>
          );
        }

        return <p key={lineIdx}>{renderLineWithLinks(line)}</p>;
      })}
    </div>
  );
}

function renderLineWithLinks(line: string) {
  const parts = line.split(new RegExp(`(${URL_PATTERN.source})`, "g"));
  return parts.map((part, i) => {
    if (!part) return null;
    if (new RegExp(`^${URL_PATTERN.source}$`).test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
