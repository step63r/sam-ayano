import React from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  Button,
  Stack
} from '@mui/material';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleReadBarcode = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigate('/readBarcode');
  };

  const handleBooks = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigate('/books');
  };

  const handleSettings = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigate('/settings');
  };

  return (
    <Authenticator>
      {({ signOut }) => (
        <Stack spacing={2} direction='column' margin={4}>
          <Button fullWidth variant="contained" onClick={handleReadBarcode}>書籍を登録する</Button>
          <Button fullWidth variant="contained" onClick={handleBooks}>登録済み書籍を見る</Button>
          <Button fullWidth variant="contained" onClick={handleSettings}>アカウント設定</Button>
          <Button fullWidth variant="outlined" onClick={signOut}>ログアウト</Button>
      </Stack>
      )}
    </Authenticator>
  );
}

export default Home;
