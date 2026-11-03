import React, { useState } from "react";

import { cn } from "@/lib/utils";

type BookCoverProps = {
  /** タイトル（代替表示と alt に使う） */
  title: string;
  /** 書影URL。未保存・読み込み失敗時はタイトル頭文字のプレースホルダを出す */
  coverUrl?: string;
  className?: string;
};

/**
 * タイトルから決まる色相。同じ本は常に同じ色になり、一覧で見分けやすくなる
 */
const hueFromTitle = (title: string): number => {
  let sum = 0;
  for (const ch of title) {
    sum = (sum * 31 + ch.codePointAt(0)!) % 360;
  }
  return sum;
};

/**
 * 書影コンポーネント
 */
const BookCover: React.FC<BookCoverProps> = ({ title, coverUrl, className }) => {
  // 画像URLごとに失敗状態を持つ。URLが変わったら再試行できるようにするため
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!coverUrl && failedUrl !== coverUrl;
  const hue = hueFromTitle(title);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-foreground/10 sm:w-16",
        className
      )}
    >
      {showImage ? (
        <img
          src={coverUrl}
          alt={`${title}の表紙`}
          loading="lazy"
          decoding="async"
          // 外部サイトの画像直リンク制限を避けるためリファラを送らない
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(coverUrl)}
          className="size-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-full items-center justify-center text-xl font-bold text-white/95"
          style={{
            background: `linear-gradient(145deg, oklch(0.7 0.13 ${hue}), oklch(0.5 0.16 ${(hue + 40) % 360}))`,
          }}
        >
          {title.trim().charAt(0) || "本"}
        </div>
      )}
    </div>
  );
};

export default BookCover;
