import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSettings, Divider } from "@aws-amplify/ui-react";
import MessageModal from "./MessageModal";

import {
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material';

import { DeleteUserComponents } from "@aws-amplify/ui-react/dist/types/components/AccountSettings/DeleteUser/types";

const DeleteUser: React.FC = () => {
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
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
    setIconType("info");
    setModalMessage("アカウントを削除しました");
    setModalIsOpen(true);
  };

  /**
   * アカウント削除が失敗したときのイベントハンドラ
   * @param error エラー内容
   */
  const handleErrorDeleteUser = (error: Error) => {
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
    setIconType("none");
    setModalMessage("");
    navigate("/");
  };
  
  return (
    <Grid marginX={2}>
      <Stack spacing={2} direction="column">
        <Typography variant="subtitle1" component="div" sx={{ textAlign: 'center', paddingTop: 2 }}>
          アカウント削除
        </Typography>
        <Divider />
        <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }} >
          本当に削除しますか？
        </Typography>
        <Typography variant="caption" component="div" color="error" sx={{ fontWeight: 'bold' }}>
          ※この削除は取り消しできません
        </Typography>
        <AccountSettings.DeleteUser
          components={components}
          onSuccess={handleSuccessDeleteUser}
          onError={handleErrorDeleteUser}
        />
        <MessageModal
          iconType={iconType}
          isOpen={modalIsOpen}
          message={modalMessage}
          handleClose={handleCloseModal}
        />
      </Stack>
    </Grid>
  );
};

export default DeleteUser;
