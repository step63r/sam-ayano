import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  confirmUserAttribute,
  fetchUserAttributes,
  sendUserAttributeVerificationCode,
  updateUserAttributes,
} from "aws-amplify/auth";

import { Button } from "@/components/ui/button";

import MessageModal from "./MessageModal";
import ResponsiveLayout from "./ResponsiveLayout";
import PageTitle from "./PageTitle";
import FormField from "./FormField";

/**
 * メールアドレス変更画面
 * @returns コンポーネント
 */
const ChangeEmail: React.FC = () => {
  const navigate = useNavigate();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  // "input": 新しいメールアドレスの入力 / "confirm": 届いた確認コードの入力
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [disabled, setDisabled] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [iconType, setIconType] = useState<"none" | "info" | "warn" | "error">("none");
  const [modalMessage, setModalMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const attributes = await fetchUserAttributes();
        setCurrentEmail(attributes.email ?? "");
      } catch (error) {
        console.log("fetchUserAttributes ERROR!", error);
      }
    })();
  }, []);

  const showMessage = (type: "info" | "error", message: string) => {
    setIconType(type);
    setModalMessage(message);
    setModalIsOpen(true);
  };

  /**
   * 「確認コードを送信」ボタン押下イベント
   */
  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabled(true);

    try {
      const output = await updateUserAttributes({ userAttributes: { email: newEmail.trim() } });
      if (output.email?.nextStep.updateAttributeStep === "CONFIRM_ATTRIBUTE_WITH_CODE") {
        setStep("confirm");
        showMessage("info", `${newEmail.trim()} に確認コードを送信しました`);
      } else {
        setCompleted(true);
        showMessage("info", "メールアドレスを変更しました");
      }
    } catch (error) {
      console.log("updateUserAttributes ERROR!", error);
      showMessage("error", error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setDisabled(false);
    }
  };

  /**
   * 「変更を確定」ボタン押下イベント
   */
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabled(true);

    try {
      await confirmUserAttribute({ userAttributeKey: "email", confirmationCode: code.trim() });
      setCompleted(true);
      showMessage("info", "メールアドレスを変更しました。次回のログインから、新しいメールアドレスを使ってください");
    } catch (error) {
      console.log("confirmUserAttribute ERROR!", error);
      showMessage("error", error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setDisabled(false);
    }
  };

  /**
   * 「確認コードを再送」ボタン押下イベント
   */
  const handleResend = async () => {
    setDisabled(true);

    try {
      await sendUserAttributeVerificationCode({ userAttributeKey: "email" });
      showMessage("info", "確認コードを再送しました");
    } catch (error) {
      console.log("sendUserAttributeVerificationCode ERROR!", error);
      showMessage("error", error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setDisabled(false);
    }
  };

  /**
   * モーダルを閉じるイベント
   * @param e イベント引数
   */
  const handleCloseModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModalIsOpen(false);
    setIconType("none");
    setModalMessage("");
    if (completed) {
      navigate("/settings");
    }
  };

  return (
    <ResponsiveLayout>
      <div className="mx-auto w-full max-w-2xl">
        <PageTitle title="メールアドレス変更" />
        <div className="glass rounded-3xl p-5 md:p-8">
          {step === "input" ? (
            <form className="flex flex-col gap-5" onSubmit={handleRequestChange}>
              <FormField id="formCurrentEmail" label="現在のメールアドレス" value={currentEmail} disabled readOnly />
              <FormField
                id="formNewEmail"
                label="新しいメールアドレス"
                type="email"
                autoComplete="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button type="submit" size="lg" className="w-full" disabled={disabled || newEmail.trim() === ""}>
                確認コードを送信
              </Button>
            </form>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleConfirm}>
              <p className="text-sm text-muted-foreground">
                {newEmail.trim()} に届いた確認コードを入力してください
              </p>
              <FormField
                id="formCode"
                label="確認コード"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button type="submit" size="lg" className="w-full" disabled={disabled || code.trim() === ""}>
                変更を確定
              </Button>
              <Button type="button" variant="outline" size="lg" className="w-full" disabled={disabled} onClick={handleResend}>
                確認コードを再送
              </Button>
            </form>
          )}
        </div>
        <MessageModal
          isOpen={modalIsOpen}
          iconType={iconType}
          modalType="none"
          message={modalMessage}
          handleClose={handleCloseModal}
        />
      </div>
    </ResponsiveLayout>
  );
};

export default ChangeEmail;
