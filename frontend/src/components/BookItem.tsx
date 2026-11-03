import React from "react";
import { Building2, Check, User } from "lucide-react";

import { BookSummary } from "../types/book";
import { Badge } from "@/components/ui/badge";
import BookCover from "./BookCover";

/**
 * BookItemコンポーネントのプロパティ
 */
type BookItemProps = {
  /** 書籍サマリ */
  book: BookSummary;
  /** クリックイベント */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * 書籍情報一覧のアイテムコンポーネント
 * @param param0 プロパティ
 * @returns コンポーネント
 */
const BookItem: React.FC<BookItemProps> = ({ book, onClick }) => {
  return (
    // 一覧には大量に並ぶため、ぼかしの弱い glass-soft を使う（描画負荷の抑制）
    <button
      type="button"
      onClick={onClick}
      className="glass-soft flex w-full items-start gap-4 rounded-2xl p-3 text-left transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-0"
    >
      <BookCover title={book.title} coverUrl={book.coverUrl} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-base leading-snug font-semibold">{book.title}</h3>
          {(book.lendFlag || book.readFlag) && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              {book.lendFlag && <Badge variant="destructive">貸出中</Badge>}
              {book.readFlag && (
                <Badge variant="secondary">
                  <Check /> 読了
                </Badge>
              )}
            </div>
          )}
        </div>
        {book.author && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{book.author}</span>
          </p>
        )}
        {book.publisherName && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{book.publisherName}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default BookItem;
