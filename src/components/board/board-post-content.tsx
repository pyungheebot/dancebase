"use client";

import { Fragment } from "react";

interface BoardPostContentProps {
  content: string;
}

// YouTube URL 패턴
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

// 일반 URL 패턴
const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

export function BoardPostContent({ content }: BoardPostContentProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm whitespace-pre-wrap">
      {lines.map((line, lineIdx) => {
        // YouTube 임베드
        const ytMatches = [...line.matchAll(YOUTUBE_REGEX)];
        if (ytMatches.length > 0) {
          return (
            <Fragment key={lineIdx}>
              <p>{renderLineWithLinks(line)}</p>
              {ytMatches.map((match, i) => (
                <div
                  key={`yt-${lineIdx}-${i}`}
                  className="relative w-full aspect-video rounded-lg overflow-hidden border"
                >
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${match[1]}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
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
  const parts = line.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
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
