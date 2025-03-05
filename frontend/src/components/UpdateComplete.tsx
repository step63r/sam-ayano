import React from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';

import {
  Button,
  Stack,
  Typography
} from '@mui/material';

const UpdateComplete: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Authenticator>
      <Stack spacing={2} direction='column' margin={4}>
        <Typography variant='h2' component='div' gutterBottom>
          登録完了
        </Typography>
        <Button fullWidth variant='contained' onClick={() => navigate('/')}>ホームに戻る</Button>
      </Stack>
    </Authenticator>
  )
};

export default UpdateComplete;
