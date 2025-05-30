import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSettings, Divider } from "@aws-amplify/ui-react";
import MessageModal from "./MessageModal";

import {
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material';
import { ChangePasswordComponents } from "@aws-amplify/ui-react/dist/types/components/AccountSettings/ChangePassword/types";

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
    <Grid margin={2} paddingBottom={2}>
      <Stack spacing={2} direction="column">
        <Typography variant="subtitle1" component="div" sx={{ textAlign: 'center' }}>
          パスワード変更
        </Typography>
        <Divider />
        <AccountSettings.ChangePassword
          components={components}
          onSuccess={handleSuccessChangePassword}
          onError={handleErrorChangePassword}
        />
        <MessageModal
          isOpen={modalIsOpen}
          iconType={iconType}
          modalType={modalType}
          message={modalMessage}
          handleClose={handleCloseModal}
        />
      </Stack>
    </Grid>
  );
};

export default ChangePassword;
