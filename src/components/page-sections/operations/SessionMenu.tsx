import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, LogOut, Pause } from 'lucide-react';
import './session-menu.css';

export function SessionMenu({ onResume, onLeave }: { onResume: () => void; onLeave: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const resumeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const node = dialog.current;
        node?.showModal();
        resumeButton.current?.focus({ preventScroll: true });
        return () => node?.close();
    }, []);

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };
    
    return createPortal(
        <dialog 
            ref={dialog} 
            className="session-pause-dialog"
            aria-labelledby="session-pause-title"
            aria-describedby="session-pause-description" 
            onCancel={event => { event.preventDefault(); onResume(); }}
            data-lenis-prevent="true"
        >
            <div className="session-pause-layout">
                <div className="session-pause-content">
                
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-10 max-w-xl">
                        <div className="w-14 h-14 flex items-center justify-center border border-white/20 bg-white/5 mb-4 rounded-full">
                            <Pause size={24} className="text-white" />
                        </div>
                        <h2 id="session-pause-title" className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-sans">
                            PAUSED
                        </h2>
                        <p id="session-pause-description" className="text-white/50 font-medium tracking-wide mt-3 text-xs max-w-md">
                            Match is in progress.
                        </p>
                    </div>
                
                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <button 
                            type="button"
                            ref={resumeButton}
                            autoFocus 
                            onMouseEnter={playHover}
                            onClick={() => {
                                playSelect();
                                onResume();
                            }}
                            className="flex-1 bg-white text-black p-5 transition-all flex items-center justify-center gap-2.5 rounded hover:bg-neutral-200 active:scale-[0.98] cursor-pointer"
                        >
                            <Play size={18} fill="currentColor" />
                            <span className="text-sm font-extrabold tracking-wider uppercase">
                                Resume Game
                            </span>
                        </button>
                    
                        <button 
                            type="button"
                            onMouseEnter={playHover}
                            onClick={() => {
                                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
                                onLeave();
                            }}
                            className="flex-1 bg-[#12141a] border border-white/20 hover:border-white text-white p-5 transition-all flex items-center justify-center gap-2.5 rounded hover:bg-[#1a1d26] active:scale-[0.98] cursor-pointer"
                        >
                            <LogOut size={18} className="text-white/60" />
                            <span className="text-sm font-extrabold tracking-wider uppercase text-white/90">
                                Leave Match
                            </span>
                        </button>
                    </div>

                </div>

                {/* Controls reminder */}
                <div className="session-pause-controls flex flex-wrap justify-center gap-6 text-xs text-white/60 tracking-wider">
                    {[
                        ['W A S D', 'Drive'],
                        ['SPACE', 'Shoot'],
                        ['SHIFT', 'Ability'],
                        ['TAB', 'Scoreboard']
                    ].map(([keys, label]) => (
                        <div key={label} className="flex items-center gap-2">
                            <kbd className="font-mono text-xs font-bold bg-white/10 border border-white/20 px-2 py-0.5 rounded text-white">
                                {keys}
                            </kbd>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </dialog>,
        document.body
    );
}
