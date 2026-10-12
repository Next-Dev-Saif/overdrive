import React, { type ReactNode } from 'react';

interface NeuIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const NeuIconButton: React.FC<NeuIconButtonProps> = ({ 
    children, 
    active = false, 
    size = 'md', 
    className = '', 
    onMouseEnter,
    onClick,
    ...props 
}) => {
    const sizeMap = {
        sm: 'w-10 h-10',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };
    
    const baseClasses = "relative flex items-center justify-center rounded-full transition-all duration-300 select-none border";
    const textClasses = active ? "text-white" : "text-neu-text-secondary hover:text-neu-accent";
    const shadowClasses = active 
        ? "bg-neu-accent shadow-inner border-transparent" 
        : "bg-neu-raised shadow-neu-raised border-neu-border-light hover:shadow-neu-hover hover:-translate-y-[1px] hover:bg-white/40";

    return (
        <button 
            className={`${baseClasses} ${sizeMap[size]} ${shadowClasses} ${textClasses} ${className}`}
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
            <span className="relative z-10">{children}</span>
        </button>
    );
};
