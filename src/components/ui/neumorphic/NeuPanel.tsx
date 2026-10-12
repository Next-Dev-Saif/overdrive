import React, { type ReactNode } from 'react';

interface NeuPanelProps {
    children: ReactNode;
    className?: string;
    padding?: string;
    borderRadius?: string;
}

export const NeuPanel: React.FC<NeuPanelProps> = ({ 
    children, 
    className = '', 
    padding = 'p-6',
    borderRadius = 'rounded' 
}) => {
    return (
        <div className={`bg-neu-surface shadow-neu-raised border border-neu-border-light ${borderRadius} ${padding} ${className}`}>
            {children}
        </div>
    );
};
