import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';

import config from './config.json';

import App from './App';
import AuthGate from './components/AuthGate';
import ConsentGate from './components/ConsentGate';

import { Amplify } from 'aws-amplify';

import { LoadingProvider } from './context/LoadingProvider';
import { Authenticator } from '@aws-amplify/ui-react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

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
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <Authenticator.Provider>
      <LoadingProvider>
        <AuthGate>
          <ConsentGate>
            <App />
          </ConsentGate>
        </AuthGate>
      </LoadingProvider>
    </Authenticator.Provider>
  </NextThemesProvider>
);
