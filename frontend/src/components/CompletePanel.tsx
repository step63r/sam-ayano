import React from "react";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import ResponsiveLayout from "./ResponsiveLayout";

type CompletePanelProps = {
  /** 完了メッセージ（登録完了、貸出完了など） */
  title: string;
  /** 「ホームに戻る」ボタンの無効フラグ */
  disabled: boolean;
  onBackHome: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * 完了画面の共通パネル
 */
const CompletePanel: React.FC<CompletePanelProps> = ({ title, disabled, onBackHome }) => (
  <ResponsiveLayout>
    <div className="glass mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-3xl p-8 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
        <CircleCheck className="size-12" aria-hidden />
      </span>
      <h2 role="status" className="text-2xl font-bold tracking-tight">{title}</h2>
      <Button size="lg" className="w-full" disabled={disabled} onClick={onBackHome}>
        ホームに戻る
      </Button>
    </div>
  </ResponsiveLayout>
);

export default CompletePanel;
