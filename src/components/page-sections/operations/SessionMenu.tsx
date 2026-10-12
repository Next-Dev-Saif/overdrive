import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, LogOut, ShieldAlert } from 'lucide-react';

export function SessionMenu({ onResume, onLeave }: { onResume: () => void; onLeave: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
    
    return createPortal(
        <dialog 
            ref={dialog} 
            className="fixed inset-0 m-0 w-full h-full bg-slate-950/80 backdrop-blur-2xl text-white font-sans overflow-hidden p-0" 
            onCancel={event => { event.preventDefault(); onResume(); }}
            data-lenis-prevent="true"
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                
                <div className="flex flex-col items-center text-center mb-12">
                    <ShieldAlert size={48} className="text-white/30 mb-6" />
                    <span className="text-xs font-mono tracking-[0.4em] text-white/50 uppercase mb-4 border border-white/20 px-4 py-1 rounded-full">
                        Game Paused
                    </span>
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase drop-shadow-xl text-white">
                        Take a breath
                    </h2>
                    <p className="font-mono text-white/60 tracking-widest uppercase mt-6 max-w-lg text-sm">
                        The live match continues in the background. Your vehicle remains vulnerable.
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
                    <button 
                        autoFocus 
                        onClick={onResume}
                        className="group flex-1 relative overflow-hidden bg-white hover:bg-slate-200 text-slate-950 px-8 py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-4 hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                    >
                        <Play size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-black tracking-widest uppercase">Resume Game</span>
                    </button>
                    
                    <button 
                        onClick={onLeave}
                        className="group flex-1 relative overflow-hidden bg-black/40 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 text-white px-8 py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-4 hover:scale-[1.02]"
                    >
                        <LogOut size={32} className="text-white/40 group-hover:text-red-400 transition-colors" />
                        <span className="text-2xl font-black tracking-widest uppercase text-white/70 group-hover:text-red-400 transition-colors">Leave Game</span>
                    </button>
                </div>

                <div className="absolute bottom-12 flex gap-8">
                    {[
                        ['W A S D', 'Drive'],
                        ['SPACE', 'Ability'],
                        ['AUTO', 'Targeting']
                    ].map(([keys, label]) => (
                        <div key={label} className="flex items-center gap-3">
                            <kbd className="font-mono text-xs font-black tracking-widest bg-white/10 border border-white/20 rounded px-3 py-1.5 text-white">
                                {keys}
                            </kbd>
                            <span className="text-xs font-bold tracking-widest uppercase text-white/50">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </dialog>,
        document.body
    );
}
