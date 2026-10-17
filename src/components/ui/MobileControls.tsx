import { HoldFireButton } from './HoldFireButton';
import React, { useCallback, useRef, useState } from "react";
import { GameEngine } from "../../game/engine/GameEngine";

interface MobileControlsProps {
    engineRef: React.MutableRefObject<GameEngine | null>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ engineRef }) => {
    const setFiring = useCallback((held: boolean) => {
        if (engineRef.current) engineRef.current.inputManager.joystickFiring = held;
    }, [engineRef]);
    const joystickRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);


    // Handle Joystick
    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        updateJoystick(e);
    };

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        updateJoystick(e);
    };

    const handleEnd = () => {
        setIsDragging(false);
        if (knobRef.current) {
            knobRef.current.style.transform = `translate(0px, 0px)`;
        }
        if (engineRef.current) {
            // @ts-ignore
            engineRef.current.inputManager.joystickThrottle = 0;
            // @ts-ignore
            engineRef.current.inputManager.joystickSteer = 0;
        }
    };

    const updateJoystick = (e: React.TouchEvent | React.MouseEvent) => {
        if (!joystickRef.current || !knobRef.current) return;
        
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        let dx = clientX - centerX;
        let dy = clientY - centerY;

        const maxRadius = rect.width / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

        // Normalize to -1 to 1
        const nx = dx / maxRadius;
        const ny = dy / maxRadius;

        if (engineRef.current) {
            // Steering maps naturally to X axis
            // Throttle maps to inverted Y axis (up is negative Y, but should be positive throttle)
            // @ts-ignore
            engineRef.current.inputManager.joystickSteer = nx;
            // @ts-ignore
            engineRef.current.inputManager.joystickThrottle = -ny;
        }
    };

    // Only render on touch devices (simple check via max-width or CSS media queries, here we use tailwind classes)
    return (
        <div className="mobile-driving-controls absolute inset-0 pointer-events-none z-50">
            <div className="arena-fire-control"><HoldFireButton onFiringChange={setFiring} /></div>
            {/* Left Joystick */}
            <div 
                className="absolute bottom-12 left-12 w-32 h-32 bg-black/70 rounded-full border border-white/30 backdrop-blur-md pointer-events-auto touch-none shadow-2xl relative flex items-center justify-center"
                ref={joystickRef}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onTouchCancel={handleEnd}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
            >
                <div className="absolute inset-0 border border-white/10 rounded-full m-4 pointer-events-none" />
                <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
                <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />
                <div 
                    ref={knobRef}
                    className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] -ml-6 -mt-6 border border-black/50"
                />
            </div>

        </div>
    );
};
