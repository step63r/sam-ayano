import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Navigate } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Authenticator>
      <Navigate replace to="/home" />
    </Authenticator>
  )
}

export default App;
