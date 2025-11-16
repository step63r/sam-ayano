import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';
import {
  Button,
  Stack,
} from '@mui/material';
import {
  Add,
  LibraryBooks,
  Settings
} from "@mui/icons-material";
import ResponsiveLayout from './ResponsiveLayout';

/**
 * ホーム画面
 * @returns コンポーネント
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
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
    <ResponsiveLayout>
      <Stack spacing={2} direction='column'>
        <Button fullWidth disabled={disabled} size="large" variant="contained" onClick={handleReadBarcode} startIcon={<Add />}>書籍を登録する</Button>
        <Button fullWidth disabled={disabled} size="large" variant="contained" onClick={handleBooks} startIcon={<LibraryBooks />}>登録済み書籍を見る</Button>
        <Button fullWidth disabled={disabled} size="large" variant="outlined" onClick={handleSettings} startIcon={<Settings />}>アカウント設定</Button>
      </Stack>
    </ResponsiveLayout>
  );
}

export default Home;
