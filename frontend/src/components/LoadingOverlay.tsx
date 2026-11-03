import { FC, memo } from "react";
import { Loader2 } from "lucide-react";

/**
 * プログレスリング表示用のオーバーレイコンポーネント
 */
export const LoadingOverLay: FC<{ isLoadingOverlay: boolean }> = memo(({ isLoadingOverlay }) => {
  // z-index はヘッダー・下部ナビ(z-40)より上、ダイアログ(z-50)より下にする。
  // 読み込み中に出るエラーダイアログがオーバーレイに隠れないようにするため
  return (
    <>
      {isLoadingOverlay && (
        <div
          role="status"
          aria-live="polite"
          aria-label="読み込み中"
          className="fixed inset-0 z-45 flex items-center justify-center bg-background/30 backdrop-blur-sm"
        >
          <div className="glass rounded-3xl p-6">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </div>
      )}
    </>
  );
});
