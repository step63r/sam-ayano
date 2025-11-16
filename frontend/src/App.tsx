import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { translations, withAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';

import { ThemeProvider, createTheme } from '@mui/material';

import { LoadingContext } from "./context/LoadingProvider";
import { LoadingOverLay } from "./components/LoadingOverlay";

import Home from './components/Home';
import ReadBarcode from './components/ReadBarcode';
import InputIsbnJan from './components/InputIsbnJan';
import Books from './components/Books';
import BookDetail from './components/BookDetail';
import UpdateComplete from './components/UpdateComplete';
import UpdateBook from './components/UpdateBook';
import PageHeader from './components/PageHeader';
import Settings from './components/Settings';
import ChangePassword from './components/ChangePassword';
import DeleteUser from './components/DeleteUser';
import Terms from './components/Terms';
import PrivacyPolicy from './components/PrivacyPolicy';

I18n.putVocabularies(translations);
I18n.setLanguage('ja');

/**
 * ルート変更時にスクロール位置をリセットするコンポーネント
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 通常のルート変更時のスクロールリセット
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    // ブラウザバック/フォワード時のスクロールリセット
    const handlePopState = () => {
      // 少し遅延させてからスクロールリセット（ブラウザの標準動作の後に実行）
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
};

/**
 * Appコンポーネント
 * @returns コンポーネント
 */
const App: React.FC = () => {
  const { isLoadingOverlay } = useContext(LoadingContext);

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#0d47a1",
        light: "#2575ed",
        dark: "#051d42",
      },
      secondary: {
        main: "#e65100",
        light: "#ff8a4c",
        dark: "#7f2c00",
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <LoadingOverLay isLoadingOverlay={isLoadingOverlay} />
        <BrowserRouter>
          <ScrollToTop />
          <PageHeader />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/readBarcode' element={<ReadBarcode />} />
            <Route path='/inputIsbnJan' element={<InputIsbnJan />} />
            <Route path='/book' element={<BookDetail />} />
            <Route path='/books' element={<Books />} />
            <Route path='/books/:seqno' element={<UpdateBook />} />
            <Route path='/updateComplete' element={<UpdateComplete />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/settings/changePassword' element={<ChangePassword />} />
            <Route path='/settings/deleteUser' element={<DeleteUser />} />
            <Route path='/terms' element={<Terms />} />
            <Route path='/privacyPolicy' element={<PrivacyPolicy />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}

export default withAuthenticator(App);
