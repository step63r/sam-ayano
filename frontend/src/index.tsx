import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import config from './config.json';

import App from './App';

import { Amplify } from 'aws-amplify';

import { LoadingProvider } from './context/LoadingProvider';
import { Authenticator } from '@aws-amplify/ui-react';

import { CssBaseline } from '@mui/material';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.CognitoUserPoolId,
      userPoolClientId: config.CognitoClientId,
      loginWith: {
        email: true
      }
    },
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <>
    <CssBaseline />
    <Authenticator.Provider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </Authenticator.Provider>
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
