import React, { type ReactNode } from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    active?: boolean;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export const NeuButton: React.FC<NeuButtonProps> = ({ 
    children, 
    active = false, 
    variant = 'primary', 
    className = '', 
    onMouseEnter,
    onClick,
    ...props 
}) => {
    const baseClasses = `od-button ${variant === 'primary' ? 'primary' : 'secondary'}`;
    const textClasses = '';
    const shadowClasses = active ? 'ring-2 ring-neu-accent' : '';

    return (
        <button 
            className={`${baseClasses} ${shadowClasses} ${textClasses} ${className}`}
            onMouseEnter={(e) => {
                window.dispatchEvent(new CustomEvent('play-ui-hover'));
                if (onMouseEnter) onMouseEnter(e);
            }}
            onClick={(e) => {
                window.dispatchEvent(new CustomEvent('play-ui-select'));
                if (onClick) onClick(e);
            }}
            {...props}
        >
            {active && variant === 'primary' && (
                <div className="absolute inset-0 bg-neu-accent opacity-10 pointer-events-none"></div>
            )}
            <span className="relative z-10 flex items-center justify-center gap-3">{children}</span>
        </button>
    );
};
