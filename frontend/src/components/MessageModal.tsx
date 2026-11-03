import React from "react";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * MessageModalコンポーネントのプロパティ
 */
type MessageModalProps = {
  /** 表示フラグ */
  isOpen: boolean;
  /** モーダル種別 */
  modalType: "none" | "yesNo";
  /** アイコン種別 */
  iconType: "none" | "info" | "warn" | "error";
  /** メッセージ */
  message: string;
  /** 閉じるイベント */
  handleClose?: React.MouseEventHandler<HTMLButtonElement>;
  /** Yesイベント */
  handleYes?: React.MouseEventHandler<HTMLButtonElement>;
  /** Noイベント */
  handleNo?: React.MouseEventHandler<HTMLButtonElement>;
};

/** スクリーンリーダー向けのタイトル（見た目には出さない） */
const titles: Record<MessageModalProps["iconType"], string> = {
  none: "メッセージ",
  info: "お知らせ",
  warn: "確認",
  error: "エラー",
};

/**
 * メッセージ用モーダル
 * @param param0 プロパティ
 * @returns コンポーネント
 */
const MessageModal: React.FC<MessageModalProps> = (
  {
    isOpen,
    modalType,
    iconType,
    message,
    handleClose,
    handleYes,
    handleNo
  }) => {
  return (
    // 開閉は呼び出し側の状態だけで決める（open のみ渡し onOpenChange は渡さない）。
    // Radix 標準の自動クローズを使うと、Yes/No ボタン押下時に handleClose まで走ってしまうため
    <AlertDialog open={isOpen}>
      <AlertDialogContent
        // 呼び出し側のハンドラは e.preventDefault() を呼ぶため、Esc 時にもイベントを渡す
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        }}
      >
        <AlertDialogTitle className="sr-only">{titles[iconType]}</AlertDialogTitle>
        {iconType !== "none" && (
          <div className="mx-auto">
            {iconType === "info" && <Info className="size-12 text-primary" aria-hidden />}
            {iconType === "warn" && <TriangleAlert className="size-12 text-amber-500" aria-hidden />}
            {iconType === "error" && <CircleAlert className="size-12 text-destructive" aria-hidden />}
          </div>
        )}
        <AlertDialogDescription className="text-base whitespace-pre-line text-foreground">
          {message}
        </AlertDialogDescription>
        <AlertDialogFooter>
          {modalType === "none" && (
            <Button size="lg" className="w-full" onClick={handleClose}>閉じる</Button>
          )}
          {modalType === "yesNo" && (
            <div className="flex w-full gap-3">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleNo}>いいえ</Button>
              <Button size="lg" className="flex-1" onClick={handleYes}>はい</Button>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
};

export default MessageModal;
