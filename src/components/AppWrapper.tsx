
import React from 'react';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-wrapper">
      <div>
        {children}
      </div>
    </div>
  );
};

export default AppWrapper;
