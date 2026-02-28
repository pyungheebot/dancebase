"use client";

import { Fragment } from "react";
import { YouTubeEmbed, extractYouTubeId } from "@/components/shared/youtube-embed";
import { SpotifyEmbed, extractSpotifyInfo } from "@/components/shared/spotify-embed";

interface BoardPostContentProps {
  content: string;
}

// 일반 URL 패턴
const URL_PATTERN = /https?:\/\/[^\s<]+/;

/** 줄에서 URL을 추출하고 타입별로 분류 */
function findEmbedUrls(line: string): { youtube: string[]; spotify: string[] } {
  const urlMatches = line.match(new RegExp(URL_PATTERN, "g")) || [];
  return {
    youtube: urlMatches.filter((url) => extractYouTubeId(url) !== null),
    spotify: urlMatches.filter((url) => extractSpotifyInfo(url) !== null),
  };
}

export function BoardPostContent({ content }: BoardPostContentProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm whitespace-pre-wrap">
      {lines.map((line, lineIdx) => {
        const embeds = findEmbedUrls(line);
        const hasEmbeds = embeds.youtube.length > 0 || embeds.spotify.length > 0;

        if (hasEmbeds) {
          return (
            <Fragment key={lineIdx}>
              <p>{renderLineWithLinks(line)}</p>
              {embeds.youtube.map((ytUrl, i) => (
                <YouTubeEmbed key={`yt-${lineIdx}-${i}`} url={ytUrl} />
              ))}
              {embeds.spotify.map((spUrl, i) => (
                <SpotifyEmbed key={`sp-${lineIdx}-${i}`} url={spUrl} />
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
