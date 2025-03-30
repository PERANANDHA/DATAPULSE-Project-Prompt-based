
import React from 'react';
import PageBackground from './ui/PageBackground';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PageBackground variant="subtle">
      <div className="app-wrapper">
        <div className="pt-10">
          {children}
        </div>
      </div>
    </PageBackground>
  );
};

export default AppWrapper;
