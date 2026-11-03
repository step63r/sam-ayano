import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";

import { KeyRound, LogOut, Mail, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import ResponsiveLayout from './ResponsiveLayout';
import PageTitle from "./PageTitle";

/**
 * 設定画面
 * @returns コンポーネント
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [disabled, setDisabled] = useState(false);

  /**
   * 「パスワード変更」ボタン押下イベント
   * @param e イベント引数
   * @returns レンダリング要素
   */
  const handleChangePassword = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate("/settings/changePassword");
  };

  const handleDeleteUser = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate("/settings/deleteUser");
  };
  
  return (
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="アカウント設定" />
        <div className="flex flex-col gap-4">
          <section aria-label="メールアドレス" className="glass flex items-center gap-4 rounded-3xl p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Mail className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">メールアドレス</p>
              <p className="truncate text-base font-medium">{ user?.signInDetails?.loginId }</p>
            </div>
          </section>
          <div className="glass flex flex-col gap-3 rounded-3xl p-5">
            <Button size="lg" className="w-full" disabled={disabled} onClick={handleChangePassword}>
              <KeyRound /> パスワード変更
            </Button>
            <Button variant="outline" size="lg" className="w-full" disabled={disabled} onClick={signOut}>
              <LogOut /> ログアウト
            </Button>
          </div>
          {/* 取り消せない操作は、他の操作と離して配置する */}
          <div className="glass flex flex-col gap-3 rounded-3xl p-5">
            <Button variant="destructive" size="lg" className="w-full" disabled={disabled} onClick={handleDeleteUser}>
              <Trash2 /> アカウント削除
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Settings;
