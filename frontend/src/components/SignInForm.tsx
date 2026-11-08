import React, { useState } from "react";
import {
  confirmSignUp,
  resendSignUpCode,
  signIn,
  type SignInOutput,
} from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 1: メールアドレス入力 → 2: パスキー or パスワード → (未確認のアカウントのみ) 3: 確認コード
 */
type Step = "email" | "passkey" | "password" | "confirmSignUp";

const LOGIN_FAILED_MESSAGE = "ログインできませんでした。時間をおいて、もう一度お試しください。";

const errorName = (error: unknown): string =>
  error && typeof error === "object" && "name" in error ? String(error.name) : "";

/**
 * パスワードでのログイン失敗の文言。アカウントの有無が推測できないよう、
 * 存在しないメールアドレスとパスワード違いは同じ文言にする
 */
const describePasswordError = (error: unknown): string => {
  switch (errorName(error)) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "メールアドレスまたはパスワードが正しくありません";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "試行回数が多すぎます。しばらくしてから、もう一度お試しください。";
    default:
      return LOGIN_FAILED_MESSAGE;
  }
};

const describePasskeyError = (error: unknown): string => {
  switch (errorName(error)) {
    case "PasskeyAuthenticationCanceled":
    case "PasskeyOperationAborted":
      return "パスキーの操作がキャンセルされたか、時間切れになりました。";
    case "RelyingPartyMismatch":
    case "PasskeyNotSupported":
      // RP ID は本番のドメインに固定されるため、localhost などでは使えない
      return "このドメインまたはブラウザでは、パスキーを利用できません。パスワードでログインしてください。";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "試行回数が多すぎます。しばらくしてから、もう一度お試しください。";
    default:
      return "パスキーでログインできませんでした。パスワードでログインしてください。";
  }
};

/**
 * ログインの入口。メールアドレスだけを先に入力させ、パスキーが登録されていればパスキー、
 * 無ければパスワードの入力に進める。
 *
 * ログインに成功すると Amplify が通知を出し、AuthGate が認証済みと判定して本体の画面に切り替わる。
 * 新規登録・パスワード再設定は Authenticator の画面に任せるので、ここでは扱わず遷移だけ呼び出す。
 */
const SignInForm: React.FC = () => {
  const { toSignUp, toForgotPassword } = useAuthenticator((context) => [
    context.toSignUp,
    context.toForgotPassword,
  ]);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const goToEmailStep = () => {
    setStep("email");
    setPassword("");
    setCode("");
    setError("");
  };

  /**
   * ログインの結果を受けて、画面を進める。成功時は何もしない(AuthGate が画面を切り替える)
   */
  const handleSignInResult = async (result: SignInOutput) => {
    if (result.isSignedIn) return;
    if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
      setStep("confirmSignUp");
      setError("");
      // 確認コードの再送は、新しく届くコードで入力できるようにするため。失敗しても入力欄は出す
      try {
        await resendSignUpCode({ username: email });
      } catch (e) {
        console.log("resendSignUpCode ERROR!", e);
      }
      return;
    }
    // 管理者が作成したアカウントの初回パスワード変更など。この画面では扱わない
    setError(LOGIN_FAILED_MESSAGE);
  };

  /**
   * パスキーが登録されているかを調べる。判定に失敗した場合は、必ずパスワードに倒す
   * (存在しないメールアドレスと区別して見せないため、また判定に失敗してもログインできるようにするため)。
   * 認証方法を指定せずに開始するので、ここではパスキーの認証ダイアログは出ない
   */
  const hasPasskey = async (): Promise<boolean> => {
    try {
      const result = await signIn({
        username: email,
        options: { authFlowType: "USER_AUTH" },
      });
      return (
        !result.isSignedIn &&
        result.nextStep.signInStep === "CONTINUE_SIGN_IN_WITH_FIRST_FACTOR_SELECTION" &&
        result.nextStep.availableChallenges?.includes("WEB_AUTHN") === true
      );
    } catch {
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      setStep((await hasPasskey()) ? "passkey" : "password");
    } finally {
      setPending(false);
    }
  };

  /**
   * パスキーでログインする。ブラウザが認証器の呼び出しを、直前の操作の直後にしか許可しないことがあるため、
   * 自動では起動せずボタンを押したときに実行する。判定時のセッションは使わず、改めて開始する
   * (判定から時間が経っていても失敗しないようにするため)
   */
  const handlePasskeySignIn = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await signIn({
        username: email,
        options: { authFlowType: "USER_AUTH", preferredChallenge: "WEB_AUTHN" },
      });
      // 成功時は AuthGate が画面を切り替える。ここに残るのは、パスキーで完了しなかった場合
      if (!result.isSignedIn) setError(describePasskeyError(null));
    } catch (e) {
      console.log("passkey signIn ERROR!", errorName(e));
      setError(describePasskeyError(e));
    } finally {
      setPending(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError("");
    try {
      await handleSignInResult(await signIn({ username: email, password }));
    } catch (e) {
      console.log("password signIn ERROR!", errorName(e));
      setError(describePasswordError(e));
    } finally {
      setPending(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      await confirmSignUp({ username: email, confirmationCode: code.trim() });
      await handleSignInResult(await signIn({ username: email, password }));
    } catch (e) {
      console.log("confirmSignUp ERROR!", errorName(e));
      setError(
        errorName(e) === "CodeMismatchException" || errorName(e) === "ExpiredCodeException"
          ? "確認コードが正しくないか、有効期限が切れています"
          : LOGIN_FAILED_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  };

  const handleResendCode = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await resendSignUpCode({ username: email });
      setError("確認コードを再送しました");
    } catch (e) {
      console.log("resendSignUpCode ERROR!", errorName(e));
      setError("確認コードを再送できませんでした。時間をおいて、もう一度お試しください。");
    } finally {
      setPending(false);
    }
  };

  const errorMessage = error ? (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;

  /** 入力済みのメールアドレスの表示と、入力し直すためのリンク */
  const emailSummary = (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/40 px-4 py-3">
      <span className="min-w-0 truncate text-sm font-medium">{email}</span>
      <Button type="button" variant="link" size="sm" className="shrink-0" disabled={pending} onClick={goToEmailStep}>
        変更
      </Button>
    </div>
  );

  return (
    <div className="px-6 pt-2 pb-4">
      {step === "email" && (
        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-email">メールアドレス</Label>
            <Input
              id="signin-email"
              name="username"
              type="email"
              autoComplete="username"
              autoFocus
              required
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errorMessage}
          <Button type="submit" size="lg" className="w-full" disabled={pending || !email.trim()}>
            {pending ? "確認中..." : "次へ"}
          </Button>
          <Button type="button" variant="link" className="self-center" onClick={toSignUp}>
            アカウントを作成
          </Button>
        </form>
      )}

      {step === "passkey" && (
        <div className="flex flex-col gap-4">
          {emailSummary}
          <p className="text-sm text-muted-foreground">
            このアカウントにはパスキーが登録されています。指紋や顔、端末の画面ロックなどでログインできます。
          </p>
          {errorMessage}
          <Button type="button" size="lg" className="w-full" disabled={pending} onClick={handlePasskeySignIn}>
            <Fingerprint /> {pending ? "確認中..." : "パスキーでログイン"}
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" disabled={pending} onClick={() => setStep("password")}>
            パスワードでログイン
          </Button>
        </div>
      )}

      {step === "password" && (
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          {emailSummary}
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-password">パスワード</Label>
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMessage}
          <Button type="submit" size="lg" className="w-full" disabled={pending || !password}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
          <Button type="button" variant="link" className="self-center" onClick={toForgotPassword}>
            パスワードをお忘れですか？
          </Button>
        </form>
      )}

      {step === "confirmSignUp" && (
        <form className="flex flex-col gap-4" onSubmit={handleConfirmSubmit}>
          {emailSummary}
          <p className="text-sm text-muted-foreground">
            メールアドレスの確認が済んでいません。メールに届いた確認コードを入力してください。
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-code">確認コード</Label>
            <Input
              id="signin-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder="確認コードを入力"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {errorMessage}
          <Button type="submit" size="lg" className="w-full" disabled={pending || !code.trim()}>
            {pending ? "確認中..." : "確認してログイン"}
          </Button>
          <Button type="button" variant="link" className="self-center" disabled={pending} onClick={handleResendCode}>
            確認コードを再送する
          </Button>
        </form>
      )}
    </div>
  );
};

export default SignInForm;
