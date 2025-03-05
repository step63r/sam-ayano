import React, { useContext } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LoadingContext } from "./context/LoadingProvider";
import { LoadingOverLay } from "./components/LoadingOverlay";

import Home from './components/Home';
import ReadBarcode from './components/ReadBarcode';
import Books from './components/Books';
import BookDetail from './components/BookDetail';
import UpdateComplete from './components/UpdateComplete';

const App: React.FC = () => {
  const { isLoadingOverlay } = useContext(LoadingContext);

  return (
    <Authenticator>
      <LoadingOverLay isLoadingOverlay={isLoadingOverlay} />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/readBarcode' element={<ReadBarcode />} />
          <Route path='/book' element={<BookDetail />} />
          <Route path='/books' element={<Books />} />
          <Route path='/updateComplete' element={<UpdateComplete />} />
        </Routes>
      </BrowserRouter>
    </Authenticator>
  )
}

export default App;
