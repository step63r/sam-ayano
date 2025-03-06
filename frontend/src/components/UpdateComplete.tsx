import React from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Stack,
  Typography
} from '@mui/material';

const UpdateComplete: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} direction='column' margin={4}>
      <Typography variant='h2' component='div' gutterBottom>
        登録完了
      </Typography>
      <Button fullWidth variant='contained' onClick={() => navigate('/')}>ホームに戻る</Button>
    </Stack>
  )
};

export default UpdateComplete;
