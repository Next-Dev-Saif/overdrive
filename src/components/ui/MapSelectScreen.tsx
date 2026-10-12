import { ArrowLeft, Crosshair } from 'lucide-react';
import { arenas } from '../../data/catalog';
import { useEffect, useState } from 'react';

const MAP_IMAGES: Record<string, string> = {
    'wasteland': '/assets/maps/wasteland.jpg',
    'facility': '/assets/maps/facility.jpg',
    'glacial': '/assets/maps/glacial.jpg',
    'neon': '/assets/maps/neon.jpg'
};

export function MapSelectScreen({ onSelectMap, onBack }: { onSelectMap: (id: string) => void; onBack: () => void }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <main className="relative w-full h-full bg-slate-950 text-white overflow-hidden font-sans selection:bg-white/30">
            
            {/* Massive Diagonal Blade Container */}
            <div className={`absolute inset-0 flex justify-center items-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
                <div className="flex w-[120%] h-[120%] -skew-x-[20deg] -ml-[10%]">
                    {arenas.map((arena, i) => {
                        return (
                            <button 
                                key={arena.id} 
                                onClick={() => onSelectMap(arena.id)}
                                className="relative flex-1 hover:flex-[3] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden group border-r-4 border-slate-950 bg-black hover:z-10 focus:outline-none"
                            >
                                {/* Unskewed background image */}
                                <div className="absolute top-0 bottom-0 -left-1/2 -right-1/2 skew-x-[20deg] scale-125 transition-transform duration-1000 group-hover:scale-105 pointer-events-none">
                                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-colors duration-700 z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                                    <img 
                                        src={MAP_IMAGES[arena.id] || MAP_IMAGES['wasteland']} 
                                        alt={arena.name}
                                        className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                                    />
                                </div>

                                {/* Unskewed content */}
                                <div className="absolute inset-0 skew-x-[20deg] flex flex-col justify-end p-12 md:p-24 transition-opacity duration-300 opacity-60 group-hover:opacity-100 pointer-events-none">
                                    
                                    <div className="flex items-center gap-4 mb-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                                        <span className="px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase rounded border border-white/50 text-white bg-white/10 backdrop-blur-md">
                                            {arena.terrain}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/70 tracking-[0.3em]">
                                            MAP / 0{i + 1}
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] text-white whitespace-nowrap translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                                        {arena.name}
                                    </h2>
                                    
                                    <div className="h-0 group-hover:h-32 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 overflow-hidden mt-6">
                                        <p className="text-white/80 font-mono text-sm leading-relaxed max-w-lg mb-8 drop-shadow-md">
                                            {arena.detail}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-white font-black tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 w-max rounded-xl">
                                            Select Map <Crosshair size={18} />
                                        </div>
                                    </div>

                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Header Overlay */}
            <header className={`absolute top-0 left-0 w-full z-50 flex items-start justify-between p-12 pointer-events-none transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
                <button 
                    onClick={onBack}
                    className="group flex items-center gap-4 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 transition-all pointer-events-auto shadow-2xl"
                >
                    <ArrowLeft size={20} className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    <span className="font-bold tracking-[0.2em] uppercase text-sm text-white/80 group-hover:text-white">Back</span>
                </button>
                <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] text-white/50 font-mono tracking-[0.4em] uppercase mb-1 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Step 02</span>
                    <h1 className="text-4xl font-black tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">Select Map</h1>
                </div>
            </header>

        </main>
    );
}
