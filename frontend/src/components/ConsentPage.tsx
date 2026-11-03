import React, { useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConsentStatus, recordConsent } from "../lib/consent";
import LegalDocuments from "./LegalDocuments";

type ConsentPageProps = {
  /** 現在の同意状況 */
  status: ConsentStatus;
  /** 同意の記録に成功したときのイベント */
  onAgreed: (status: ConsentStatus) => void;
};

/**
 * 利用規約・プライバシーポリシーへの同意画面。
 * 規約が改定されたとき、また未同意のユーザーがログインしたときに、同意するまで本体の画面の代わりに表示する。
 * ダイアログではなく独立した画面にしているのは、Esc キーや背景のクリックで閉じられてしまうと、
 * 同意しないまま使えてしまうため。選べるのは「同意して続ける」か「ログアウト」だけ。
 */
const ConsentPage: React.FC<ConsentPageProps> = ({ status, onAgreed }) => {
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * 「同意して続ける」ボタン押下イベント
   */
  const handleAgree = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      onAgreed(await recordConsent());
    } catch (error) {
      console.log("recordConsent ERROR!", error);
      setErrorMessage("同意の記録に失敗しました。時間をおいて、もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-backdrop flex min-h-svh items-center justify-center px-4 py-8 text-foreground">
      <main className="glass flex w-full max-w-3xl flex-col gap-5 rounded-3xl p-5 md:p-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck className="size-8" aria-hidden />
          </span>
          <h1 className="text-xl font-bold tracking-tight">利用規約・プライバシーポリシーへの同意</h1>
          <p className="text-sm text-muted-foreground">
            ご利用を続けるには、最新の利用規約およびプライバシーポリシーへの同意が必要です。
            内容をご確認ください。
          </p>
          <p className="text-xs text-muted-foreground">規約のバージョン: {status.currentVersion}</p>
        </header>

        {/* 長い本文は枠の中でスクロールさせ、同意の操作は常に見える位置に置く */}
        <div
          tabIndex={0}
          role="region"
          aria-label="利用規約・プライバシーポリシーの本文"
          className="max-h-[45svh] overflow-y-auto rounded-2xl border bg-background/40 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <LegalDocuments />
        </div>

        <Label className="cursor-pointer items-start gap-3 text-base leading-snug">
          <Checkbox
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          上記の利用規約およびプライバシーポリシーの内容に同意します
        </Label>

        {errorMessage && (
          <p role="alert" className="text-sm font-medium text-destructive">{errorMessage}</p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" disabled={isSubmitting} onClick={signOut}>
            ログアウト
          </Button>
          <Button type="button" size="lg" disabled={!agreed || isSubmitting} onClick={handleAgree}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            同意して続ける
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ConsentPage;
