import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSettings } from "@aws-amplify/ui-react";
import MessageModal from "./MessageModal";

import ResponsiveLayout from './ResponsiveLayout';
import PageTitle from "./PageTitle";
import AmplifyThemeScope from "./AmplifyThemeScope";

// パッケージの exports に無い dist/types/... への深い import は moduleResolution: "bundler" で解決できないため、公開コンポーネントの props から導出する
type ChangePasswordComponents = NonNullable<
  React.ComponentProps<typeof AccountSettings.ChangePassword>["components"]
>;

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");

  const components: ChangePasswordComponents = {
    CurrentPasswordField: (props) => (
      <AccountSettings.ChangePassword.CurrentPasswordField
        {...props}
        label="現在のパスワード"
      />
    ),
    NewPasswordField: (props) => (
      <AccountSettings.ChangePassword.NewPasswordField
        {...props}
        label="新しいパスワード"
      />
    ),
    ConfirmPasswordField: (props) => (
      <AccountSettings.ChangePassword.ConfirmPasswordField
        {...props}
        label="パスワードを再入力"
      />
    )
  };

  /**
   * パスワード変更が成功したときのイベントハンドラ
   */
  const handleSuccessChangePassword = () => {
    setModalType("none");
    setIconType("info");
    setModalMessage("パスワードを変更しました");
    setModalIsOpen(true);
  };

  /**
   * パスワード変更が失敗したときのイベントハンドラ
   * @param error エラー内容
   */
  const handleErrorChangePassword = (error: Error) => {
    setModalType("none");
    setIconType("error");
    setModalMessage(error.message);
    setModalIsOpen(true);
  };

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModalIsOpen(false);
    setModalType("none");
    setIconType("none");
    setModalMessage("");
    navigate("/");
  };

  return (
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="パスワード変更" />
        <div className="glass rounded-3xl p-5 md:p-8">
          <AmplifyThemeScope>
            <AccountSettings.ChangePassword
              components={components}
              onSuccess={handleSuccessChangePassword}
              onError={handleErrorChangePassword}
            />
          </AmplifyThemeScope>
        </div>
        <MessageModal
          isOpen={modalIsOpen}
          iconType={iconType}
          modalType={modalType}
          message={modalMessage}
          handleClose={handleCloseModal}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default ChangePassword;
