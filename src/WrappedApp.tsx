
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AppWrapper from './components/AppWrapper';

const WrappedApp = () => {
  return (
    <BrowserRouter>
      <AppWrapper>
        <App />
      </AppWrapper>
    </BrowserRouter>
  );
};

export default WrappedApp;
