import { useMenuSection } from '../../../hooks/useMenuSection';
import { useState, useEffect } from 'react';
import { Check, ArrowLeft, Volume2, Monitor, Keyboard, Accessibility } from 'lucide-react';
import { GraphicsSettingsManager, type GraphicsQuality } from '../../../game/settings/GraphicsSettingsManager';
import { SoundManager } from '../../../game/engine/SoundManager';

const TAB_ICONS = {
    'Graphics': Monitor,
    'Audio': Volume2,
    'Controls': Keyboard,
    'Accessibility': Accessibility
};

export function SettingsScreen({ onBack }: { onBack: () => void }) {
    const tabs = ['Graphics', 'Audio', 'Controls', 'Accessibility'] as const;
    const [tab, setTab] = useMenuSection('settings', tabs, 'Graphics');
    const [quality, setQuality] = useState(GraphicsSettingsManager.getInstance().getQuality());
    const [volume, setVolume] = useState(SoundManager.getInstance().getVolume());
    const [message, setMessage] = useState('Changes apply immediately.');
    
    // Animate in
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Helper to flash message
    const flashMessage = (msg: string) => {
        setMessage(msg);
        // We could add a timeout to clear it, but keeping it visible is fine as status
    };

    return (
        <main className="relative w-full h-full bg-slate-950 text-white overflow-hidden flex font-sans selection:bg-white/30">
            {/* Cinematic Noise/Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)' }} />

            {/* Main Content Layout */}
            <div className={`relative z-10 w-full max-w-[1800px] mx-auto h-full flex transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                
                {/* Left Sidebar Navigation */}
                <aside className="w-80 flex flex-col justify-between border-r border-white/10 p-12 bg-black/40 backdrop-blur-md">
                    <div>
                        <span className="text-[10px] text-white/50 font-mono tracking-[0.4em] uppercase mb-2 block">System</span>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-16 drop-shadow-md">Configuration</h1>
                        
                        <nav className="flex flex-col gap-2" aria-label="Settings categories">
                            {tabs.map(t => {
                                const Icon = TAB_ICONS[t];
                                const isActive = tab === t;
                                return (
                                    <button 
                                        key={t} 
                                        aria-current={isActive ? 'page' : undefined} 
                                        onClick={() => setTab(t)}
                                        className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-bold tracking-widest uppercase text-sm">{t}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <button 
                        onClick={onBack}
                        className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-4 transition-all w-max mt-12"
                    >
                        <ArrowLeft size={20} className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        <span className="font-bold tracking-[0.2em] uppercase text-sm">Return</span>
                    </button>
                </aside>

                {/* Right Content Area */}
                <section className="flex-1 p-16 md:p-24 overflow-y-auto custom-scrollbar relative">
                    
                    {/* Status Message Overlay */}
                    <div className="absolute top-12 right-12 z-50 pointer-events-none">
                        <span className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 shadow-xl transition-all">
                            System: {message}
                        </span>
                    </div>

                    <div className="max-w-4xl">
                        <p className="font-mono text-xs tracking-[0.4em] text-white/40 uppercase mb-4">{tab} Settings</p>

                        {tab === 'Graphics' && (
                            <div className="animate-fade-in">
                                <h2 className="text-6xl font-black tracking-tighter uppercase mb-6">Performance<br/>Comes First.</h2>
                                <p className="text-white/60 font-mono text-sm leading-relaxed max-w-2xl mb-16">
                                    Choose the rendering quality for your machine. Resolution scaling and glow apply immediately; some arena effects are configured when you deploy.
                                </p>
                                
                                <div className="flex flex-col gap-4">
                                    {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map(q => {
                                        const isActive = quality === q;
                                        return (
                                            <button 
                                                key={q} 
                                                className={`group flex items-center justify-between p-8 rounded-2xl border transition-all duration-300 text-left ${isActive ? 'bg-white/10 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                                aria-pressed={isActive} 
                                                onClick={() => { 
                                                    GraphicsSettingsManager.getInstance().setQuality(q); 
                                                    setQuality(q); 
                                                    flashMessage(`${q.toLowerCase()} graphics selected.`); 
                                                }}
                                            >
                                                <div>
                                                    <span className={`block text-3xl font-black tracking-widest uppercase mb-2 transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{q}</span>
                                                    <span className="font-mono text-xs text-white/50 tracking-widest uppercase">
                                                        {q === 'LOW' ? 'Reduced effects · half resolution' : q === 'MEDIUM' ? 'Balanced clarity · reduced effects' : 'Full resolution · glow enabled'}
                                                    </span>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'border-white bg-white text-slate-950' : 'border-white/30 text-transparent'}`}>
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {tab === 'Audio' && (
                            <div className="animate-fade-in">
                                <h2 className="text-6xl font-black tracking-tighter uppercase mb-6">Find Your<br/>Balance.</h2>
                                <p className="text-white/60 font-mono text-sm leading-relaxed max-w-2xl mb-16">
                                    Master volume controls interface sounds, vehicle audio, combat effects and music.
                                </p>
                                
                                <div className="bg-black/40 border border-white/10 p-8 rounded-2xl max-w-2xl">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="text-2xl font-black tracking-widest uppercase">Master Volume</span>
                                        <output className="font-mono text-4xl font-bold tracking-tighter">{Math.round(volume * 100)}<span className="text-xl text-white/50">%</span></output>
                                    </div>
                                    
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05" 
                                        value={volume} 
                                        onChange={e => { 
                                            const v = Number(e.target.value); 
                                            setVolume(v); 
                                            SoundManager.getInstance().setVolume(v); 
                                            flashMessage(v === 0 ? 'Audio muted.' : 'Master volume updated.'); 
                                        }} 
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between mt-4 font-mono text-[10px] text-white/40 tracking-widest uppercase">
                                        <span>Muted</span>
                                        <span>Max</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'Controls' && (
                            <div className="animate-fade-in">
                                <h2 className="text-6xl font-black tracking-tighter uppercase mb-6">Know Your<br/>Machine.</h2>
                                <p className="text-white/60 font-mono text-sm leading-relaxed max-w-2xl mb-12">
                                    Current build bindings. Target acquisition and weapons fire automatically when a hostile vehicle is in range.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                                    {[
                                        ['W / ↑', 'Accelerate'], 
                                        ['S / ↓', 'Brake / reverse'], 
                                        ['A D / ← →', 'Steer'], 
                                        ['SPACE', 'Chassis ability'], 
                                        ['ESC', 'Session menu'], 
                                        ['I', 'Self-destruct when flipped'], 
                                        ['← → / SPACE', 'Switch vehicle while spectating']
                                    ].map(([key, label]) => (
                                        <div key={key} className="flex flex-col gap-2 bg-black/40 border border-white/5 p-6 rounded-xl">
                                            <span className="font-mono text-xs text-white/50 tracking-widest uppercase">{label}</span>
                                            <kbd className="font-sans text-xl font-black tracking-widest uppercase text-white bg-white/10 px-4 py-2 rounded-lg w-max border border-white/20">{key}</kbd>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-8 inline-block bg-white/5 border border-white/10 px-6 py-4 rounded-xl">
                                    <p className="font-mono text-xs text-white/50 tracking-widest uppercase">Notice: Custom key bindings are not supported by the current input system.</p>
                                </div>
                            </div>
                        )}

                        {tab === 'Accessibility' && (
                            <div className="animate-fade-in">
                                <h2 className="text-6xl font-black tracking-tighter uppercase mb-6">Clarity Under<br/>Pressure.</h2>
                                <p className="text-white/60 font-mono text-sm leading-relaxed max-w-2xl mb-12">
                                    Menus support keyboard focus, text labels for selected equipment, high-contrast surfaces and system reduced-motion preferences. Browser zoom remains enabled.
                                </p>
                                
                                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-2xl border-l-4 border-l-white">
                                    <p className="font-mono text-xs text-white/80 tracking-wider leading-loose uppercase">
                                        Enable <strong className="text-white bg-white/20 px-2 py-1 rounded">Reduce Motion</strong> in your operating system to stop showroom rotation and menu animations. Camera shake and custom HUD scaling are not configurable in this build.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </section>
            </div>
        </main>
    );
}
