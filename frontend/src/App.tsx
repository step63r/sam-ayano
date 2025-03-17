import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { translations, withAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';

import { ThemeProvider, createTheme } from '@mui/material';

import { LoadingContext } from "./context/LoadingProvider";
import { LoadingOverLay } from "./components/LoadingOverlay";

import Home from './components/Home';
import ReadBarcode from './components/ReadBarcode';
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
          <PageHeader />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/readBarcode' element={<ReadBarcode />} />
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
