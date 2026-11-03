import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSettings } from "@aws-amplify/ui-react";
import { TriangleAlert } from "lucide-react";
import MessageModal from "./MessageModal";

import ResponsiveLayout from './ResponsiveLayout';
import PageTitle from "./PageTitle";
import AmplifyThemeScope from "./AmplifyThemeScope";

// パッケージの exports に無い dist/types/... への深い import は moduleResolution: "bundler" で解決できないため、公開コンポーネントの props から導出する
type DeleteUserComponents = NonNullable<
  React.ComponentProps<typeof AccountSettings.DeleteUser>["components"]
>;

const DeleteUser: React.FC = () => {
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"none" | "yesNo">("none");
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");

  const components: DeleteUserComponents = {
    DeleteButton: (props) => (
      <AccountSettings.DeleteUser.DeleteButton
        {...props}
      >
        アカウントを削除する
      </AccountSettings.DeleteUser.DeleteButton>
    )
  };

  /**
   * アカウント削除が成功したときのイベントハンドラ
   */
  const handleSuccessDeleteUser = () => {
    setModalType("none");
    setIconType("info");
    setModalMessage("アカウントを削除しました");
    setModalIsOpen(true);
  };

  /**
   * アカウント削除が失敗したときのイベントハンドラ
   * @param error エラー内容
   */
  const handleErrorDeleteUser = (error: Error) => {
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
        <PageTitle title="アカウント削除" />
        <div className="glass flex flex-col gap-4 rounded-3xl p-5 md:p-8">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-bold">本当に削除しますか？</p>
              <p className="mt-1 text-sm font-bold text-destructive">※この削除は取り消しできません</p>
            </div>
          </div>
          <AmplifyThemeScope>
            <AccountSettings.DeleteUser
              components={components}
              onSuccess={handleSuccessDeleteUser}
              onError={handleErrorDeleteUser}
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

export default DeleteUser;
