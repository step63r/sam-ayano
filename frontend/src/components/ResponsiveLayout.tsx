import React from 'react';
import { Container } from '@mui/material';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

/**
 * レスポンシブレイアウトコンポーネント
 * 一定以上の画面幅でマージンを設ける共通レイアウト
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  maxWidth = 'lg' 
}) => {
  return (
    <Container 
      maxWidth={maxWidth}
      sx={{
        // レスポンシブな左右マージン
        paddingX: { 
          xs: 2,    // 576px未満: 16px
          sm: 3,    // 576px以上: 24px
          md: 4,    // 768px以上: 32px
          lg: 8,    // 992px以上: 64px
          xl: 12    // 1200px以上: 96px
        },
        paddingTop: 2,
        paddingBottom: 2,
        // 最大幅の調整（必要に応じて）
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '100%',
          lg: '1200px',
          xl: '1400px'
        }
      }}
    >
      {children}
    </Container>
  );
};

export default ResponsiveLayout;