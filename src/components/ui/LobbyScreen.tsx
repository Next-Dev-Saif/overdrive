import { ArrowUpRight, ArrowLeft, Check, Wrench, ShieldAlert } from 'lucide-react';
import { GarageRenderer } from './GarageRenderer';
import { arenas, vehicles, weapons } from '../../data/catalog';
import { useState, useEffect } from 'react';

interface LobbyScreenProps { mode: string; mapId: string; equippedVehicle: string; equippedWeapon: string; vehicleColor?: string; onLaunch: () => void; onBack: () => void; onGarage?: () => void }

export function LobbyScreen({ mode, mapId, equippedVehicle, equippedWeapon, vehicleColor, onLaunch, onBack, onGarage }: LobbyScreenProps) {
    const tdm = mode === 'deathmatch';
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);

    return (
        <main className="relative w-full h-full bg-slate-950 text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30">
            
            {/* Visual Stage (Background) */}
            <div className="absolute inset-0 z-0">
                <GarageRenderer vehicleId={equippedVehicle} weaponId={equippedWeapon} vehicleColor={vehicleColor} />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/20 to-slate-950 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)] pointer-events-none" />
            </div>

            {/* Header */}
            <header className={`relative z-50 flex items-center justify-between p-12 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
                <button 
                    onClick={onBack}
                    className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 transition-all"
                >
                    <ArrowLeft size={20} className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    <span className="font-bold tracking-[0.2em] uppercase text-sm">Cancel Setup</span>
                </button>
                <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] text-white/50 font-mono tracking-[0.4em] uppercase mb-1">Step 03</span>
                    <h1 className="text-4xl font-black tracking-tighter uppercase drop-shadow-md">Review Match</h1>
                </div>
            </header>

            {/* Main Content Area */}
            <div className={`relative z-50 flex-1 flex items-center justify-between px-12 pb-12 w-full max-w-[1800px] mx-auto pointer-events-none transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Left Side: Empty to show the 3D model */}
                <div className="flex-1" />

                {/* Right Side: Briefing Panel */}
                <div className="w-[500px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 pointer-events-auto shadow-2xl flex flex-col justify-between" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}>
                    
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert size={20} className="text-white" />
                            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white border border-white/30 bg-white/10 px-3 py-1 rounded">
                                Game Rules
                            </span>
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase text-white drop-shadow-lg leading-none mb-4">
                            {tdm ? 'Team Deathmatch' : 'Free Roam'}
                        </h2>
                        <p className="text-white/60 font-mono text-sm leading-relaxed pr-4">
                            {tdm ? 'Fight with four allies, protect your formation, and destroy only Bravo combatants. Team markers and lock-on identify valid targets.' : 'Explore and test your setup. AI and weapons remain active throughout the session.'}
                        </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 mb-8">
                        {[
                            ['Arena', arenas.find(a => a.id === mapId)?.name ?? mapId], 
                            ['Chassis', vehicles.find(v => v.id === equippedVehicle)?.name ?? equippedVehicle], 
                            ['Weapon', weapons.find(w => w.id === equippedWeapon)?.name ?? equippedWeapon], 
                            ['Formation', tdm ? 'Alpha 5 vs Bravo 5' : 'Solo Drop']
                        ].map(([key, value]) => (
                            <div key={key} className="border-b border-white/10 pb-3">
                                <dt className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase mb-1">{key}</dt>
                                <dd className="text-white text-sm font-bold tracking-wide uppercase">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="flex flex-col gap-4">
                        <button onClick={onGarage} className="group flex items-center justify-between w-full p-4 border border-white/20 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">Modify Loadout</span>
                            <Wrench size={16} className="text-white/60 group-hover:text-white" />
                        </button>
                        
                        <button onClick={onLaunch} className="group relative overflow-hidden bg-white hover:bg-slate-200 text-slate-950 p-5 flex items-center justify-between transition-all" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                            <span className="text-2xl font-black tracking-widest uppercase">Find Match</span>
                            <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                        
                        <div className="flex items-center gap-2 mt-2 justify-center opacity-50">
                            <Check size={12} className="text-white" />
                            <span className="text-[9px] font-mono tracking-widest uppercase">Loadout Ready</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Control Strip */}
            <footer className="relative z-50 bg-black/80 backdrop-blur-md border-t border-white/10 py-3 px-12 flex items-center gap-12 pointer-events-none mt-auto">
                {[
                    ['W A S D', 'Drive'],
                    ['SPACE', 'Ability'],
                    ['AUTO', 'Target Lock'],
                    ['ESC', 'Menu']
                ].map(([keys, label]) => (
                    <div key={label} className="flex items-center gap-3">
                        <kbd className="font-mono text-[9px] font-black tracking-widest bg-white/10 border border-white/20 rounded px-2 py-1 text-white">
                            {keys}
                        </kbd>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">{label}</span>
                    </div>
                ))}
            </footer>
        </main>
    );
}
