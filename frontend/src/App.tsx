import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';

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
import ChangeEmail from './components/ChangeEmail';
import Passkeys from './components/Passkeys';
import DeleteUser from './components/DeleteUser';
import Terms from './components/Terms';
import PrivacyPolicy from './components/PrivacyPolicy';
import Membership from './components/Membership';
import ReadMembershipQR from './components/ReadMembershipQR';
import ReadLendBarcode from './components/ReadLendBarcode';
import LendComplete from './components/LendComplete';

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

  return (
    <>
      <LoadingOverLay isLoadingOverlay={isLoadingOverlay} />
      <BrowserRouter>
        <ScrollToTop />
        <div className="glass-backdrop min-h-svh text-foreground">
          <PageHeader />
          {/* 下部タブバー(狭い画面のみ)に内容が隠れないよう余白を確保する */}
          <main className="pb-28 md:pb-8">
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
              <Route path='/settings/changeEmail' element={<ChangeEmail />} />
              <Route path='/settings/passkeys' element={<Passkeys />} />
              <Route path='/settings/deleteUser' element={<DeleteUser />} />
              <Route path='/terms' element={<Terms />} />
              <Route path='/privacyPolicy' element={<PrivacyPolicy />} />
              <Route path='/membership' element={<Membership />} />
              <Route path='/lend/readQR' element={<ReadMembershipQR />} />
              <Route path='/lend/readBarcode' element={<ReadLendBarcode />} />
              <Route path='/lend/complete' element={<LendComplete />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
