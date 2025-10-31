import React from 'react';

export const DodoWheelsLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg" {...props}>
        <text 
            x="50%" 
            y="50%" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            fontFamily="system-ui, sans-serif"
            fontSize="30" 
            fontWeight="900"
            fill="currentColor"
        >
            DodoWheels
        </text>
    </svg>
);