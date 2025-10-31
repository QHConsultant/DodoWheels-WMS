import React from 'react';

export const DodoWheelsLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 350 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="350" height="100" rx="20" ry="20" fill="#0ea5e9" />
    <path 
      d="M 65 15 A 42 42 0 1 1 65 85 A 32 32 0 1 0 65 15 Z" 
      fill="white" 
    />
    <text 
      x="98" 
      y="68" 
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      fontSize="50" 
      fontWeight="800"
      fill="white"
    >
      odoWheel
    </text>
  </svg>
);