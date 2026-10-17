import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../../game/engine/GameEngine';
import { usePostMatchFlow } from '../../hooks/usePostMatchFlow';
import { HUD } from '../ui/HUD';
import { SessionMenu } from '../page-sections/operations/SessionMenu';
import { arenas } from '../../data/catalog';
import { LogOut } from 'lucide-react';
import type { MatchFoundPayload, MatchResult } from '../../../shared/match';
import type { Socket } from 'socket.io-client';
interface GameCanvasProps { mapId: string; vehicleId: string; weaponId: string; vehicleColor?: string; mode: string; isSpectator?: boolean; roomData?: MatchFoundPayload & { socket?: Socket }; onBack: (seconds?: number, result?: MatchResult) => void }

    export function GameCanvas({ mapId, vehicleId, weaponId, vehicleColor, mode, isSpectator = false, roomData, onBack }: GameCanvasProps) {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const engineRef = useRef<GameEngine | null>(null);
        const started = useRef(0);
        const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
        const [retry, setRetry] = useState(0);
        const [menu, setMenu] = useState(false);

        const { postPhase, matchResult, mvpMember, countdown, returnToLobby, roster } = usePostMatchFlow(engineRef, roomData, started, onBack);

        useEffect(() => {
            if (!canvasRef.current) return;
            let cancelled = false;
            let engine: GameEngine | undefined;
            // oxlint-disable-next-line react-hooks/set-state-in-effect
            setStatus('loading');
            try {
                engine = new GameEngine(canvasRef.current, mapId, vehicleId, weaponId, vehicleColor, isSpectator, roomData); engineRef.current = engine;
                engine.initialize().then(() => { if (!cancelled) { started.current = performance.now(); setStatus('ready'); } }).catch((err) => { console.error(err); if (!cancelled) { engine?.dispose(); engineRef.current = null; setStatus('error'); } });
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
            return () => { cancelled = true; engine?.dispose(); engineRef.current = null; };
        }, [mapId, vehicleId, weaponId, vehicleColor, isSpectator, roomData, retry]);

        useEffect(() => {
            const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && status === 'ready' && !menu && postPhase === 'none') setMenu(true); };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }, [status, menu, postPhase]);
        
        useEffect(() => { engineRef.current?.setMenuOpen(menu); }, [menu]);

        const leave = () => onBack(started.current ? Math.floor((performance.now() - started.current) / 1000) : 0);
        
        return <div className="relative w-full h-full bg-neu-bg"><canvas ref={canvasRef} id="game-canvas" aria-label="Vehicular combat arena" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
            {status === 'ready' && postPhase === 'none' && <><HUD engineRef={engineRef} mode={mode} /><button className="session-menu-button" onClick={() => setMenu(true)} aria-label="Open session menu to end the session"><LogOut size={16} aria-hidden="true" /><span>End session</span><kbd>ESC</kbd></button></>}
            
            {/* POST MATCH SEQUENCE OVERLAYS */}
            {postPhase !== 'none' && matchResult && (
                <div aria-live="polite" className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                    
                    {/* Phase 1: Victory / Defeat Splash */}
                    <div className={`transition-all duration-300 motion-reduce:transition-none ${postPhase === 'outcome' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                        {postPhase === 'outcome' && (
                            <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-6 sm:px-32 py-8 sm:py-16 border-y-4 border-white skew-x-[-15deg] shadow-2xl">
                                <span className={`font-black text-4xl sm:text-8xl tracking-[0.2em] uppercase drop-shadow-[0_0_30px_rgba(255,255,255,1)] skew-x-[15deg] ${matchResult.winner === matchResult.localTeam ? 'text-white' : 'text-white/60'}`}>
                                    {matchResult.winner === 'draw' ? 'DRAW' : matchResult.winner === matchResult.localTeam ? 'VICTORY' : 'DEFEAT'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Phase 2: MVP Showcase Overlay */}
                    {postPhase === 'mvp' && mvpMember && (
                        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-auto bg-black/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl border-l-8 border-amber-400 shadow-2xl skew-x-[-5deg] transform animate-in fade-in slide-in-from-left-8 duration-300 motion-reduce:animate-none">
                            <h3 className="text-amber-400 font-black tracking-[0.3em] uppercase mb-2 text-xl drop-shadow-md">Match MVP</h3>
                            <div className="text-white text-2xl sm:text-5xl font-black uppercase tracking-wider">{mvpMember.displayName}</div>
                            <div className="text-white/70 font-mono text-xs sm:text-lg tracking-wide mt-2 sm:mt-4 uppercase border-t border-white/20 pt-4">
                                Vehicle: <span className="text-white">{mvpMember.vehicleId}</span> &nbsp;|&nbsp; Weapon: <span className="text-white">{mvpMember.weaponId}</span>
                            </div>
                        </div>
                    )}

                    {/* Phase 3: Leaderboard */}
                    <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center transition-all duration-300 ${postPhase === 'leaderboard' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'hidden pointer-events-none'}`}>
                        {postPhase === 'leaderboard' && (
                            <div className="w-full max-w-4xl bg-black/80 border border-white/20 p-4 sm:p-12 my-auto rounded-3xl shadow-2xl flex flex-col items-center">
                                <h2 className="text-2xl sm:text-4xl font-black tracking-widest uppercase mb-6 sm:mb-12 text-white drop-shadow-md">Match Results</h2>
                                
                                <div className="flex w-full justify-between items-center px-2 sm:px-16 mb-8 gap-4 sm:gap-12">
                                    <div className={`flex-1 min-w-0 flex flex-col items-center p-3 sm:p-8 border ${matchResult.winner === 'alpha' ? 'border-white bg-white/10' : 'border-white/10 bg-black/40'} rounded-2xl`}>
                                        <span className="text-white/50 font-mono tracking-widest text-sm mb-2">TEAM ALPHA</span>
                                        <span className={`text-6xl font-black ${matchResult.winner === 'alpha' ? 'text-white' : 'text-white/50'}`}>{matchResult.scores.alpha}</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white/30 tracking-widest">VS</span>
                                    <div className={`flex-1 min-w-0 flex flex-col items-center p-3 sm:p-8 border ${matchResult.winner === 'bravo' ? 'border-white bg-white/10' : 'border-white/10 bg-black/40'} rounded-2xl`}>
                                        <span className="text-white/50 font-mono tracking-widest text-sm mb-2">TEAM BRAVO</span>
                                        <span className={`text-6xl font-black ${matchResult.winner === 'bravo' ? 'text-white' : 'text-white/50'}`}>{matchResult.scores.bravo}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row w-full justify-between items-start px-2 sm:px-16 mb-8 gap-4 sm:gap-12 text-white">
                                    <div className="w-full min-w-0 flex-1 flex flex-col gap-2">
                                        {roster.filter(m => m.teamId === 'alpha').map(m => (
                                            <div key={m.entityId} className="flex flex-wrap gap-2 justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                                                <span className={`font-bold ${m.entityId === roomData?.localMember.entityId ? 'text-amber-400' : ''}`}>{m.displayName} {m.entityId === roomData?.localMember.entityId ? '(You)' : ''}</span>
                                                <span className="text-white/50 text-xs font-mono tracking-widest uppercase">{m.vehicleId} / {m.weaponId}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-full min-w-0 flex-1 flex flex-col gap-2">
                                        {roster.filter(m => m.teamId === 'bravo').map(m => (
                                            <div key={m.entityId} className="flex flex-wrap gap-2 justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                                                <span className={`font-bold ${m.entityId === roomData?.localMember.entityId ? 'text-amber-400' : ''}`}>{m.displayName} {m.entityId === roomData?.localMember.entityId ? '(You)' : ''}</span>
                                                <span className="text-white/50 text-xs font-mono tracking-widest uppercase">{m.vehicleId} / {m.weaponId}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <span className="text-white/60 font-mono tracking-widest uppercase text-sm">Returning to lobby in</span>
                                    <span className="text-5xl font-black text-white">{countdown}</span>
                                </div>
                                <button onClick={returnToLobby} className="mt-12 px-8 py-3 bg-white text-slate-950 font-black tracking-widest uppercase hover:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
                                    Return Now
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {status !== 'ready' && <div className="session-overlay"><div className="session-panel"><p className="eyebrow">{mode === 'deathmatch' ? 'DEATH ARENA' : isSpectator ? 'SPECTATOR' : 'FREE ROAM'}</p><h1>{arenas.find(a => a.id === mapId)?.name ?? mapId}</h1>{status === 'loading' ? <><p role="status">Preparing arena, physics and vehicle systems…</p><progress className="session-progress" aria-label="Preparing arena" /><p>{vehicleId} / {weaponId}</p><p>Keep hostile vehicles in front of you. Your turret aims automatically. Hold Space or the mobile Fire button to shoot; press Shift for your ability.</p></> : <><p role="alert">The arena could not start. Check WebGL support and reload the arena, or return to the menu.</p><button className="od-button primary" onClick={() => setRetry(n => n + 1)}>Retry arena</button></>}<button className="od-button secondary" onClick={() => onBack()}>Return to menu</button></div></div>}
            {menu && postPhase === 'none' && <SessionMenu onResume={() => setMenu(false)} onLeave={leave} />}
        </div>;
    }
