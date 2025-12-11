import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Stack,
  Typography
} from '@mui/material';

import ResponsiveLayout from './ResponsiveLayout';

/**
 * 貸出完了画面
 * @returns コンポーネント
 */
const LendComplete: React.FC = () => {
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);

  /**
   * 「ホームに戻る」ボタン押下イベント
   * @param e イベント引数
   */
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/');
  };

  return (
    <ResponsiveLayout>
      <Stack spacing={2} direction='column'>
        <Typography variant='h2' component='div' gutterBottom>
          貸出完了
        </Typography>
        <Button fullWidth disabled={disabled} variant='contained' onClick={handleOnClick}>ホームに戻る</Button>
      </Stack>
    </ResponsiveLayout>
  )
};

export default LendComplete;
