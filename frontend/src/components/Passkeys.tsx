import React, { useCallback, useEffect, useState } from "react";
import {
  associateWebAuthnCredential,
  deleteWebAuthnCredential,
  listWebAuthnCredentials,
  type AuthWebAuthnCredential,
} from "aws-amplify/auth";
import { Fingerprint, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import MessageModal from "./MessageModal";
import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";

type ModalState = {
  type: "none" | "yesNo";
  icon: "none" | "info" | "warn" | "error";
  message: string;
};

const MODAL_CLOSED: ModalState = { type: "none", icon: "none", message: "" };

/**
 * ブラウザがパスキー(WebAuthn)を扱えるか。非対応の環境では登録ボタンを無効にする
 */
const isPasskeySupported = (): boolean =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";

/**
 * 操作の失敗を、利用者に見せてよい日本語の文言にする。
 * Amplify のエラーは英語で、利用者が取るべき行動が分かりにくいため、原因別に置き換える
 */
const describeError = (error: unknown, fallback: string): string => {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "PasskeyAlreadyExists":
      return "この端末のパスキーは、すでに登録されています";
    case "RelyingPartyMismatch":
    case "PasskeyNotSupported":
      // RP ID は本番のドメインに固定されるため、localhost などでは登録できない
      return "このドメインまたはブラウザでは、パスキーを利用できません";
    default:
      return fallback;
  }
};

/**
 * パスキーの管理画面(登録・一覧・削除)
 */
const Passkeys: React.FC = () => {
  const [credentials, setCredentials] = useState<AuthWebAuthnCredential[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const supported = isPasskeySupported();

  const load = useCallback(async () => {
    try {
      // 1 ページに収まらない場合に備え、最後まで取得する
      const all: AuthWebAuthnCredential[] = [];
      let nextToken: string | undefined;
      do {
        const page = await listWebAuthnCredentials(nextToken ? { nextToken } : undefined);
        all.push(...page.credentials);
        nextToken = page.nextToken;
      } while (nextToken);
      all.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      setCredentials(all);
    } catch (error) {
      console.log("listWebAuthnCredentials ERROR!", error);
      setModal({ type: "none", icon: "error", message: "パスキーの一覧を取得できませんでした" });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * 「パスキーを追加」ボタン押下イベント
   */
  const handleAdd = async () => {
    setBusy(true);
    try {
      await associateWebAuthnCredential();
      await load();
      setModal({ type: "none", icon: "info", message: "パスキーを登録しました" });
    } catch (error) {
      // 端末側のダイアログを閉じただけの場合は、エラーとして扱わない
      if (error instanceof Error && error.name === "PasskeyRegistrationCanceled") return;
      console.log("associateWebAuthnCredential ERROR!", error);
      setModal({
        type: "none",
        icon: "error",
        message: describeError(error, "パスキーを登録できませんでした"),
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * 一覧の「削除」ボタン押下イベント。確認モーダルを出す
   * @param credentialId 削除対象のパスキーの ID
   */
  const handleAskDelete = (credentialId: string) => {
    setDeleteTarget(credentialId);
    setModal({
      type: "yesNo",
      icon: "warn",
      message:
        "このパスキーを削除しますか？ 削除すると、このパスキーではログインできなくなります。端末に残っているパスキーは、端末の設定から別途削除してください。",
    });
  };

  const handleCancelDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDeleteTarget(null);
    setModal(MODAL_CLOSED);
  };

  const handleConfirmDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const credentialId = deleteTarget;
    setDeleteTarget(null);
    setModal(MODAL_CLOSED);
    if (!credentialId) return;

    setBusy(true);
    try {
      await deleteWebAuthnCredential({ credentialId });
      await load();
      setModal({ type: "none", icon: "info", message: "パスキーを削除しました" });
    } catch (error) {
      console.log("deleteWebAuthnCredential ERROR!", error);
      setModal({ type: "none", icon: "error", message: "パスキーを削除できませんでした" });
    } finally {
      setBusy(false);
    }
  };

  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModal(MODAL_CLOSED);
  };

  return (
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="パスキー" />
        <div className="flex flex-col gap-4">
          <div className="glass flex flex-col gap-3 rounded-3xl p-5">
            <p className="text-sm text-muted-foreground">
              パスキーを登録すると、指紋や顔、端末の画面ロックなどでログインできます。
              ログイン画面でメールアドレスを入力して「次へ」を押すと、パスキーでのログインに進みます。パスワードでのログインも引き続き使えます。
            </p>
            {!supported && (
              <p className="text-sm font-bold text-destructive">
                お使いのブラウザは、パスキーに対応していません
              </p>
            )}
            <Button size="lg" className="w-full" disabled={!supported || busy} onClick={handleAdd}>
              <Plus /> パスキーを追加
            </Button>
          </div>

          <section aria-label="登録済みのパスキー" className="glass flex flex-col gap-3 rounded-3xl p-5">
            <h2 className="font-bold">登録済みのパスキー</h2>
            {loaded && credentials.length === 0 && (
              <p className="text-sm text-muted-foreground">登録されているパスキーはありません</p>
            )}
            <ul className="flex flex-col gap-3">
              {credentials.map((credential) => (
                <li
                  key={credential.credentialId}
                  className="flex items-center gap-4 rounded-2xl border bg-background/40 p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Fingerprint className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{credential.friendlyCredentialName || "パスキー"}</p>
                    <p className="text-xs text-muted-foreground">
                      {credential.createdAt ? `${credential.createdAt.toLocaleDateString("ja-JP")} に登録` : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || !credential.credentialId}
                    onClick={() => credential.credentialId && handleAskDelete(credential.credentialId)}
                  >
                    <Trash2 /> 削除
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <MessageModal
          isOpen={modal.message !== ""}
          iconType={modal.icon}
          modalType={modal.type}
          message={modal.message}
          handleClose={handleCloseModal}
          handleYes={handleConfirmDelete}
          handleNo={handleCancelDelete}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default Passkeys;
