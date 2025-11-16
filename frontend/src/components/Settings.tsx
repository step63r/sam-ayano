import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";

import {
  Button,
  Divider,
  Stack,
  Typography
} from '@mui/material';

import ResponsiveLayout from './ResponsiveLayout';

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
      <Stack spacing={2} direction="column">
        <Typography variant="subtitle1" component="div" sx={{ textAlign: 'center' }}>
          アカウント設定
        </Typography>
        <Divider />
        <Typography variant="caption" component="div">
          メールアドレス
        </Typography>
        <Typography variant="body1" component="div">
          { user?.signInDetails?.loginId }
        </Typography>
        <Divider />
        <Button fullWidth disabled={disabled} variant="contained" onClick={handleChangePassword}>パスワード変更</Button>
        <Button fullWidth disabled={disabled} variant="outlined" onClick={signOut}>ログアウト</Button>
        <Button fullWidth disabled={disabled} variant="contained" onClick={handleDeleteUser} color="error">アカウント削除</Button>
      </Stack>
    </ResponsiveLayout>
  );
};

export default Settings;
