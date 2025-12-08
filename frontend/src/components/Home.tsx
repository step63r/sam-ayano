import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';
import {
  Button,
  Grid2 as Grid,
} from '@mui/material';
import {
  Add,
  CardMembership,
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
   * 「会員証を提示」ボタン押下イベント
   * @param e イベント引数
   */
  const handleMembership = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisabled(true);
    navigate('/membership');
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
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Button 
            fullWidth 
            disabled={disabled} 
            size="large" 
            variant="contained" 
            onClick={handleReadBarcode} 
            startIcon={<Add />}
            sx={{ 
              height: { xs: '80px', sm: '90px', md: '100px' },
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }
            }}
          >
            書籍を登録する
          </Button>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Button 
            fullWidth 
            disabled={disabled} 
            size="large" 
            variant="contained" 
            onClick={handleBooks} 
            startIcon={<LibraryBooks />}
            sx={{ 
              height: { xs: '80px', sm: '90px', md: '100px' },
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }
            }}
          >
            登録済み書籍を見る
          </Button>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Button
            fullWidth
            disabled={disabled}
            size="large"
            variant="contained"
            onClick={handleMembership}
            startIcon={<CardMembership />}
            sx={{ 
              height: { xs: '80px', sm: '90px', md: '100px' },
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }
            }}
          >
            会員証を提示
          </Button>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button 
            fullWidth 
            disabled={disabled} 
            size="large" 
            variant="outlined" 
            onClick={handleSettings} 
            startIcon={<Settings />}
          >
            アカウント設定
          </Button>
        </Grid>
      </Grid>
    </ResponsiveLayout>
  );
}

export default Home;
