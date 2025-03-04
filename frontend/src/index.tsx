import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './components/App';
import Home from './components/Home';
import ReadBarcode from './components/ReadBarcode';
import Book from './components/Book';
import Books from './components/Books';

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-northeast-1_CouspoB7q",
      userPoolClientId: "29fe4mn9q40qe3f4amv0r1srab",
      loginWith: {
        email: true
      }
    },
  }
});

// const cognitoAuthConfig = {
//   authority: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_CouspoB7q",
//   client_id: "29fe4mn9q40qe3f4amv0r1srab",
//   redirect_uri: "http://localhost:3000/home",
//   response_type: "code",
//   scope: "phone openid email",
// };

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/home' element={<Home />} />
          <Route path='/readBarcode' element={<ReadBarcode />} />
          <Route path='/book' element={<Book />} />
          <Route path='/books' element={<Books />} />
        </Routes>
      </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
