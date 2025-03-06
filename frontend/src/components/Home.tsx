import React from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography
} from '@mui/material';
import { Add, LibraryBooks, Settings } from "@mui/icons-material";

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
      {({ signOut, user }) => (
        <Grid marginX={2}>
          <Stack spacing={2} direction='column'>
            <Stack direction='column'>
              <Typography variant='h3' component='div' sx={{ paddingTop: 2 }}>
                SBMS
              </Typography>
              <Typography variant='body1' component='div'>
                Serverless Book Management System
              </Typography>
            </Stack>
            <Divider />
            <Typography variant='body1' component='div'>
              {user?.signInDetails?.loginId} でログイン中です
            </Typography>
            <Divider />
            <Button fullWidth size="large" variant="contained" onClick={handleReadBarcode} startIcon={<Add />}>書籍を登録する</Button>
            <Button fullWidth size="large" variant="contained" onClick={handleBooks} startIcon={<LibraryBooks />}>登録済み書籍を見る</Button>
            <Button fullWidth size="large" variant="contained" onClick={handleSettings} startIcon={<Settings />} disabled={true}>アカウント設定</Button>
            <Button fullWidth size="large" variant="outlined" onClick={signOut}>サインアウト</Button>
          </Stack>
        </Grid>
      )}
    </Authenticator>
  );
}

export default Home;
