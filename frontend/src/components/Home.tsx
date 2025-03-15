import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from '@mui/material';
import { Add, Check, LibraryBooks, Settings } from "@mui/icons-material";

/**
 * ホーム画面
 * @returns コンポーネント
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [disabled, setDisabled] = useState(false);

  /**
   * 「書籍を登録する」ボタン押下イベント
   * @param e イベント引数
   */
  const handleReadBarcode = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/readBarcode');
  };

  /**
   * 「所有済みチェック」ボタン押下イベント
   * @param e イベント引数
   */
  const handleCheckExists = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/readBarcode', {
      state: {
        checkExists: true,
      },
    });
  };

  /**
   * 「登録済み書籍を見る」ボタン押下イベント
   * @param e イベント引数
   */
  const handleBooks = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/books');
  };

  /**
   * 「アカウント設定」ボタン押下イベント
   * @param e イベント引数
   */
  const handleSettings = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/settings');
  };

  return (
    <Grid marginX={2}>
      <Stack spacing={2} direction='column'>
        <Typography variant='body1' component='div' sx={{ paddingTop: 2 }}>
          {user?.signInDetails?.loginId} でログイン中です
        </Typography>
        <Divider />
        <Button fullWidth disabled={disabled} size="large" variant="contained" onClick={handleReadBarcode} startIcon={<Add />}>書籍を登録する</Button>
        <Button fullWidth disabled={disabled} size="large" variant="contained" onClick={handleCheckExists} startIcon={<Check />}>所有済みチェック</Button>
        <Button fullWidth disabled={disabled} size="large" variant="contained" onClick={handleBooks} startIcon={<LibraryBooks />}>登録済み書籍を見る</Button>
        <Button fullWidth disabled={true} size="large" variant="contained" onClick={handleSettings} startIcon={<Settings />}>アカウント設定</Button>
        <Button fullWidth disabled={disabled} size="large" variant="outlined" onClick={signOut}>サインアウト</Button>
      </Stack>
    </Grid>
  );
}

export default Home;
