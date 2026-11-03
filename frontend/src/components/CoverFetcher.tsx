import React, { useState } from "react";
import { ImageDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { findCoverUrl, saveCoverUrl } from "../lib/bookCover";

type CoverFetcherProps = {
  /** 書籍のシーケンス番号 */
  seqno: number;
  /** 書影を探すための ISBN/JANコード */
  isbn: string;
  /** 書影を取得して保存できたときのイベント */
  onFetched: (coverUrl: string) => void;
};

type Status = "idle" | "loading" | "notFound" | "saveFailed";

/**
 * 登録済みの本の書影を、ISBN から探して保存するボタン。
 * 書影を保存する前に登録した本には書影が無いため、1 冊ずつ補うために使う。
 * 楽天の API は、リクエスト間隔の制限が厳しいと報告されているため、まとめて処理せず、押された本の分だけ取得する
 */
const CoverFetcher: React.FC<CoverFetcherProps> = ({ seqno, isbn, onFetched }) => {
  const [status, setStatus] = useState<Status>("idle");

  /**
   * 「表紙を取得」ボタン押下イベント
   */
  const handleClick = async () => {
    setStatus("loading");

    const coverUrl = await findCoverUrl(isbn);
    if (!coverUrl) {
      setStatus("notFound");
      return;
    }

    if (!(await saveCoverUrl(seqno, coverUrl))) {
      setStatus("saveFailed");
      return;
    }

    // 保存できてから画面に反映する（表示されたのに保存されていない、を避けるため）
    onFetched(coverUrl);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={status === "loading"} onClick={handleClick}>
        {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : <ImageDown aria-hidden />}
        表紙を取得
      </Button>
      {status === "notFound" && (
        <p role="status" className="text-xs text-muted-foreground">この本の表紙は見つかりませんでした。</p>
      )}
      {status === "saveFailed" && (
        <p role="alert" className="text-xs font-medium text-destructive">
          表紙の保存に失敗しました。時間をおいて、もう一度お試しください。
        </p>
      )}
    </div>
  );
};

export default CoverFetcher;
