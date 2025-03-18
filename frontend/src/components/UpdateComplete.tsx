import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Grid2 as Grid,
  Stack,
  Typography
} from '@mui/material';

/**
 * 登録完了画面
 * @returns コンポーネント
 */
const UpdateComplete: React.FC = () => {
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
    <Grid margin={2} paddingBottom={2}>
      <Stack spacing={2} direction='column'>
        <Typography variant='h2' component='div' gutterBottom>
          登録完了
        </Typography>
        <Button fullWidth disabled={disabled} variant='contained' onClick={handleOnClick}>ホームに戻る</Button>
      </Stack>
    </Grid>
  )
};

export default UpdateComplete;
