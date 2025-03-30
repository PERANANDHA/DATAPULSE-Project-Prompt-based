
import React from 'react';

interface PageBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'subtle';
  className?: string;
}

const PageBackground: React.FC<PageBackgroundProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const getBackgroundClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'min-h-screen relative bg-gradient-to-br from-[#F97316] to-[#0EA5E9]';
      case 'subtle':
        return 'min-h-screen relative bg-gradient-to-br from-blue-50 to-white';
      default:
        return 'min-h-screen relative bg-white';
    }
  };

  return (
    <div className={`${getBackgroundClasses()} ${className}`}>
      {/* Decorative Elements for more realistic background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main backdrop blur for realistic glass effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/5 backdrop-blur-sm"></div>
        
        {/* Realistic light sources with deeper colors */}
        <div className="absolute top-10 left-10 w-60 md:w-80 h-60 md:h-80 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-60 md:w-80 h-60 md:h-80 rounded-full bg-orange-400 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 sm:w-60 h-40 sm:h-60 rounded-full bg-white opacity-30 blur-2xl"></div>
        
        {/* Realistic dust/atmospheric particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 left-1/5 w-24 h-24 bg-blue-300/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        {/* Subtle texture overlay for realism */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
        
        {/* Light overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        {/* Paper-like grain texture for realism */}
        <div className="absolute inset-0 mix-blend-overlay opacity-[0.03]" 
          style={{ 
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%221.5%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
          }}
        ></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default PageBackground;
