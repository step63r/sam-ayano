import React from "react";
import { Authenticator, CheckboxField, useAuthenticator } from "@aws-amplify/ui-react";
import { signUp, type SignUpInput } from "aws-amplify/auth";
import { BookOpen } from "lucide-react";

import { rememberSignupConsent } from "../lib/consent";
import AmplifyThemeScope from "./AmplifyThemeScope";
import LegalDocuments from "./LegalDocuments";
import ThemeToggle from "./ThemeToggle";

/**
 * ログイン・新規登録画面の見出し
 */
// Amplify の components は `() => Element | null` 型を要求し、React.FC では型が合わないため、関数宣言にしている
function AuthHeader() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-2 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <BookOpen className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">ツンドク.com</h1>
      <p className="text-sm text-muted-foreground">持っている書籍をシンプルに管理</p>
    </div>
  );
}

/**
 * 新規登録フォームの項目。標準の項目(メールアドレス・パスワード)の後ろに、
 * 規約の本文と、同意のチェックボックスを足す
 */
function SignUpFormFields() {
  return (
    <>
      <Authenticator.SignUp.FormFields />
      <div
        tabIndex={0}
        role="region"
        aria-label="利用規約・プライバシーポリシーの本文"
        className="max-h-60 overflow-y-auto rounded-2xl border bg-background/40 p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <LegalDocuments />
      </div>
      {/*
        name="acknowledgement" は Amplify が Cognito の属性として送らない（標準属性と custom:* だけに絞る）ため、
        Cognito に余計な属性が渡ることはない。同意の有無は validateCustomSignUp で検証する。
        同意が無い間は Amplify が登録ボタンを無効にする。ただし、画面を開いた直後から検証エラーが出るため、
        エラー表示(赤字・赤枠)にはせず、通常の注意書きで理由を伝える
      */}
      <CheckboxField
        name="acknowledgement"
        value="yes"
        label="上記の利用規約およびプライバシーポリシーの内容に同意します"
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        同意いただけない場合は、アカウントを作成できません。
      </p>
    </>
  );
}

const components = {
  Header: AuthHeader,
  SignUp: {
    FormFields: SignUpFormFields,
  },
};

/**
 * 項目の表示名。Amplify の日本語訳に無い項目（パスワード再設定のメールアドレス欄）は、英語のままになるため指定する
 */
const formFields: React.ComponentProps<typeof Authenticator>["formFields"] = {
  forgotPassword: {
    username: {
      label: "メールアドレス",
      placeholder: "メールアドレスを入力",
    },
  },
};

const services: React.ComponentProps<typeof Authenticator>["services"] = {
  /**
   * 新規登録の入力内容を検証する。規約に同意していなければ登録させない
   */
  async validateCustomSignUp(formData) {
    if (!formData.acknowledgement) {
      return {
        acknowledgement: "登録するには、利用規約およびプライバシーポリシーへの同意が必要です",
      };
    }
  },

  /**
   * 新規登録を行う。登録に成功したら、規約に同意したことを控える。
   * 登録直後は未認証のため同意を記録できず、初回ログイン時に ConsentGate が控えを見て記録する
   * （控えが無いと、登録したばかりのユーザーにも同意画面がもう一度出てしまう）
   */
  handleSignUp: (async (input: SignUpInput) => {
    const output = await signUp(input);
    rememberSignupConsent(input.username);
    return output;
    // aws-amplify 6.22 以降、signUp の型に (ctx, input) のオーバーロードが増え、services の型もそれに追従する。
    // ただし Authenticator は実行時に input だけを渡して呼ぶため、キャストで型を合わせている
  }) as typeof signUp,
};

/**
 * 認証の入口。未ログインの間はログイン・新規登録画面を出し、ログインしたら子要素を表示する。
 * ログイン・新規登録・確認コード・パスワード再設定の処理自体は Amplify の Authenticator に任せ、
 * 見た目と、新規登録時の規約同意だけをここで差し替えている
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  if (authStatus === "authenticated") {
    return <>{children}</>;
  }

  return (
    // 上部に余白を取り、テーマ切替のボタンが、背の高い新規登録のカードと重ならないようにする
    <div className="glass-backdrop relative flex min-h-svh flex-col items-center justify-center px-4 pt-20 pb-8 text-foreground">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="glass w-full max-w-md rounded-3xl pb-4 sm:max-w-lg">
        <AmplifyThemeScope>
          {/*
            パスワード欄を出す従来の画面を既定にし、パスキーは「ほかのサインイン方法」から選ばせる。
            既定をパスキーにすると、パスキー未登録の既存ユーザーのログイン画面からパスワード欄が消える
          */}
          <Authenticator
            components={components}
            services={services}
            formFields={formFields}
            passwordless={{ preferredAuthMethod: "PASSWORD" }}
          />
        </AmplifyThemeScope>
      </div>
    </div>
  );
};

export default AuthGate;
