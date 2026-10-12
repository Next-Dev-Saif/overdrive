import { useState, useEffect } from 'react';
import { Play, ArrowLeft, Shield, Globe, Flag } from 'lucide-react';
import { TRACK, TRACK_LENGTH } from '../../../shared/race/track';
import { arenas, raceArena } from '../../data/catalog';

const MAP_GRADIENTS: Record<string, string> = {
    'desert': 'from-orange-900/80 via-amber-900/40 to-black',
    'factory': 'from-slate-700/80 via-zinc-800/40 to-black',
    'ice': 'from-cyan-900/80 via-blue-900/40 to-black',
    'city': 'from-fuchsia-900/80 via-purple-900/40 to-black'
};

const MAP_IMAGES: Record<string, string> = {
    'wasteland': '/assets/maps/wasteland.jpg',
    'facility': '/assets/maps/facility.jpg',
    'glacial': '/assets/maps/glacial.jpg',
    'neon': '/assets/maps/neon.jpg',
    'blacktop': '/assets/maps/blacktop.jpg'
};

export function ModeSelectScreen({ onDeploy, onBack, initialMode = 'deathmatch' }: { initialMode?: string; onDeploy: (mode: string, arena: string) => void; onBack: () => void }) {
    const [mode, setMode] = useState(initialMode);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);

    return (
        <main className="relative w-full h-full bg-slate-950 text-white overflow-hidden font-sans selection:bg-white/30">
            
            {/* Massive Diagonal Blade Container for Maps */}
            {mode !== 'deathrace' && <div className={`absolute inset-0 flex justify-center items-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                {/* 
                  Using group/container so we can optionally style siblings, 
                  though standard flex-1 hover:flex-[4] handles shrink/grow automatically.
                */}
                <div className="group/container flex w-[120%] h-[120%] -skew-x-[20deg] -ml-[10%]">
                    {arenas.map((arena, i) => {
                        return (
                            <button 
                                key={arena.id} 
                                onClick={() => onDeploy(mode, arena.id)}
                                className="relative flex-1 hover:flex-[4] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden group border-r border-white/50 last:border-r-0 bg-black hover:z-10 focus:outline-none"
                            >
                                {/* Unskewed background layer */}
                                <div className="absolute top-0 bottom-0 -left-1/2 -right-1/2 skew-x-[20deg] scale-125 transition-transform duration-1000 group-hover:scale-105 pointer-events-none overflow-hidden">
                                    {/* High-res arena environment artwork */}
                                    <img 
                                        src={MAP_IMAGES[arena.id] || MAP_IMAGES['wasteland']}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-75 contrast-110 opacity-55 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
                                        loading="eager"
                                    />
                                    {/* Thematic motif gradient blend */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${MAP_GRADIENTS[arena.motif] || MAP_GRADIENTS['city']} opacity-35 group-hover:opacity-15 mix-blend-color-dodge transition-opacity duration-700`} />
                                    {/* Vignette gradients for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30 z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30 z-10" />
                                    {/* Tech pattern overlay */}
                                    <div className="absolute inset-0 opacity-15 mix-blend-overlay z-10" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%), repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px)' }} />
                                </div>

                                {/* Unskewed content */}
                                <div className={`absolute inset-0 skew-x-[20deg] flex flex-col justify-center items-start p-12 md:p-24 transition-opacity duration-300 opacity-60 group-hover:opacity-100 pointer-events-none ${i === 0 ? 'pl-24 md:pl-32 lg:pl-48' : ''}`}>
                                    
                                    <div className="flex items-center gap-4 mb-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                                        <span className="px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase rounded border border-white/50 text-white bg-white/10 backdrop-blur-md">
                                            {arena.terrain}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/70 tracking-[0.3em]">
                                            MAP / 0{i + 1}
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] text-white whitespace-normal max-w-sm translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-100 leading-none">
                                        {arena.name}
                                    </h2>
                                    
                                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 delay-150 mt-6">
                                        <div className="overflow-hidden">
                                            <p className="text-white/80 font-mono text-xs md:text-sm leading-relaxed max-w-sm mb-8 drop-shadow-md">
                                                {arena.detail}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 text-slate-950 font-black tracking-[0.2em] uppercase bg-white border border-white px-8 py-4 w-max rounded-xl">
                                                Start Match <Play size={18} className="text-slate-950" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>}

            {mode === 'deathrace' && <section className="absolute inset-x-0 top-40 bottom-16 md:top-36 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 px-6 overflow-y-auto bg-zinc-950/90 backdrop-blur-sm" aria-label="Blacktop Circuit race setup">
                {/* Background circuit backdrop */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    <img 
                        src={MAP_IMAGES['blacktop']} 
                        alt="" 
                        aria-hidden="true" 
                        className="w-full h-full object-cover opacity-20 filter blur-[2px] scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/90" />
                </div>
                <svg className="w-36 h-36 md:w-80 md:h-80 shrink-0" viewBox="0 0 440 440" role="img" aria-label="Blacktop Circuit layout">
                    <path d={TRACK.map((p, i) => `${i ? 'L' : 'M'}${p.x + 220} ${p.z + 220}`).join(' ') + ' Z'} fill="none" stroke="#777" strokeWidth="18" />
                    <path d={TRACK.map((p, i) => `${i ? 'L' : 'M'}${p.x + 220} ${p.z + 220}`).join(' ') + ' Z'} fill="none" stroke="#202020" strokeWidth="12" />
                    <path d="M220 28v24" stroke="white" strokeWidth="4" /><text x="220" y="220" fill="white" textAnchor="middle" fontSize="16" fontFamily="monospace">{(TRACK_LENGTH / 1000).toFixed(2)} KM</text>
                </svg>
                <div className="max-w-md pb-4"><p className="text-xs font-mono tracking-widest text-zinc-400">DEATH RACE / 01</p><h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight my-3">{raceArena.name}</h2><p className="text-sm text-zinc-300 leading-relaxed">A six-car fight to the finish. Race three laps, collect trackside weapons, and keep your Interceptor in one piece.</p><p className="text-xs font-mono text-zinc-400 my-4">ONLINE PLAYERS + BOT FILL · INTERCEPTOR ONLY</p><button onClick={() => onDeploy('deathrace', raceArena.id)} className="min-h-12 px-8 py-3 bg-white text-black font-bold rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Join race <Flag size={16} className="inline ml-3" /></button></div>
            </section>}

            {/* Header & Mode Select Overlay */}
            <header className={`absolute top-0 left-0 w-full z-50 flex flex-wrap gap-4 items-start justify-between p-4 md:p-12 pointer-events-none transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
                <div className="flex flex-wrap items-start gap-4">
                    <button 
                        onClick={onBack}
                        className="group flex items-center gap-4 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 transition-all pointer-events-auto shadow-2xl"
                    >
                        <ArrowLeft size={20} className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        <span className="font-bold tracking-[0.2em] uppercase text-sm text-white/80 group-hover:text-white">Back</span>
                    </button>

                    {/* Mode Selector */}
                    <div className="pointer-events-auto flex flex-wrap items-center max-w-full bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
                        <button 
                            onClick={() => setMode('deathmatch')}
                            className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full transition-all duration-300 ${mode === 'deathmatch' ? 'bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            <Shield size={16} />
                            <span className="text-xs font-bold tracking-widest uppercase mt-0.5">Deathmatch</span>
                        </button>
                        <button onClick={() => setMode('deathrace')} aria-pressed={mode === 'deathrace'} className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors ${mode === 'deathrace' ? 'bg-white text-slate-950' : 'text-white/60 hover:text-white'}`}>
                            <Flag size={16} /><span className="text-xs font-bold tracking-widest uppercase">Death Race</span>
                        </button>
                        <button 
                            onClick={() => setMode('freeroam')}
                            className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full transition-all duration-300 ${mode === 'freeroam' ? 'bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            <Globe size={16} />
                            <span className="text-xs font-bold tracking-widest uppercase mt-0.5">Free Roam</span>
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end text-right">
                    <span className="text-[10px] text-white/50 font-mono tracking-[0.4em] uppercase mb-1 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Step 01</span>
                    <h1 className="text-4xl font-black tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">Game Setup</h1>
                </div>
            </header>

            {/* Bottom instruction hint */}
            <div className={`absolute bottom-4 w-full text-center px-4 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <span className="font-mono text-[10px] tracking-widest text-white/60 uppercase bg-black/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/5 shadow-xl">
                    {mode === 'deathrace' ? 'Interceptor only · 6 racers · 3 laps · Pickup weapons' : 'Select a map to deploy'}
                </span>
            </div>

        </main>
    );
}
