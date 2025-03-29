
import React from 'react';
import PageNavigator from './ui/PageNavigator';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-wrapper">
      <PageNavigator />
      <div className="pt-10">
        {children}
      </div>
    </div>
  );
};

export default AppWrapper;
