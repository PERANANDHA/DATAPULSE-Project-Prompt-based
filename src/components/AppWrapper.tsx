
import React from 'react';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-wrapper">
      {children}
    </div>
  );
};

export default AppWrapper;
