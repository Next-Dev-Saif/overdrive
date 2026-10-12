import { Play, Wrench, Settings, Eye, LogOut, User as UserIcon } from 'lucide-react';
import { GarageRenderer } from './GarageRenderer';
import { vehicles, weapons } from '../../data/catalog';
import { useAuth } from '../../store/AuthContext';

interface HomeScreenProps { equippedVehicle: string; equippedWeapon: string; vehicleColor: string; onNavigate: (view: string) => void }

/** Premium Game Menu */
export function HomeScreen({ equippedVehicle, equippedWeapon, vehicleColor, onNavigate }: HomeScreenProps) {
    const { user, logout } = useAuth();
    
    return <main className="relative w-full h-full overflow-hidden bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
        <GarageRenderer vehicleId={equippedVehicle} weaponId={equippedWeapon} vehicleColor={vehicleColor} />
        
        {/* Massive Background Title */}
        <div className="absolute top-12 left-12 pointer-events-none select-none z-10 opacity-30 flex flex-col leading-none">
            <span className="text-[200px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
                OVER
            </span>
            <span className="text-[200px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-transparent -mt-24">
                DRIVE
            </span>
        </div>

        {/* Dynamic User Profile Bento Card (Top Right) */}
        {user && (
            <aside className="absolute top-12 right-12 z-50 pointer-events-auto flex flex-col items-end gap-4">
                <div className="relative overflow-hidden bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex items-center gap-6 group transition-all hover:border-cyan-500/30 hover:bg-black/60 cursor-pointer">
                    <div className="absolute -inset-10 bg-cyan-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    
                    <div className="relative text-right z-10">
                        <div className="text-[9px] font-bold text-white/50 tracking-[0.3em] uppercase mb-1">PLAYER</div>
                        <div className="text-3xl font-black tracking-wider text-white leading-none drop-shadow-md">{user.username}</div>
                        <div className="text-sm font-mono text-white mt-2 flex justify-end items-center gap-3">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/20 font-bold tracking-widest">LVL {user.stats?.level || 1}</span>
                            <span className="text-white/60 tracking-widest">{user.wallet?.scrap || 0} SCRAP</span>
                        </div>
                    </div>
                    
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-white/10 transition-colors">
                        <UserIcon size={28} className="text-white drop-shadow-[0_0_8px_currentColor]" />
                    </div>
                </div>
                
                <button onClick={logout} className="group relative overflow-hidden bg-black/40 backdrop-blur-md border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded-full px-6 py-2 flex items-center gap-3 transition-all shadow-lg">
                    <LogOut size={14} className="text-red-400 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-red-400/80 group-hover:text-red-400 uppercase">Disconnect</span>
                </button>
            </aside>
        )}

        {/* Loadout HUD (Bottom Right) */}
        <aside className="absolute bottom-12 right-12 z-40 flex flex-col items-end pointer-events-none">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] text-white/80 tracking-[0.4em] font-mono uppercase bg-white/10 px-3 py-1 rounded-full border border-white/20">Selected Loadout</span>
            </div>
            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-end">
                <strong className="text-4xl font-black tracking-tighter uppercase text-white drop-shadow-md">{vehicles.find(v => v.id === equippedVehicle)?.name}</strong>
                <span className="text-lg font-mono text-white/50 tracking-widest uppercase mt-1">{weapons.find(w => w.id === equippedWeapon)?.name}</span>
            </div>
        </aside>

        {/* Cinematic Main Navigation (Bottom Left) */}
        <section className="absolute bottom-12 left-12 z-50 flex flex-col items-start gap-4 pointer-events-auto">
            <nav aria-label="Main menu" className="flex flex-col gap-2">
                {[
                    { id: 'mode_select', label: 'PLAY GAME', icon: Play, color: 'primary' }, 
                    { id: 'garage', label: 'GARAGE', icon: Wrench, color: 'white' }, 
                    { id: 'settings', label: 'SETTINGS', icon: Settings, color: 'white' }
                ].map(({ id, label, icon: Icon, color }) => (
                    <button key={id} onClick={() => onNavigate(id)} className={`group relative flex items-center gap-6 py-4 px-8 overflow-hidden rounded-2xl transition-all duration-300 ${color === 'primary' ? 'bg-white text-slate-950 border border-white hover:bg-slate-200' : 'bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${color === 'primary' ? 'bg-slate-950/10 text-slate-950' : 'bg-white/5 text-white'}`}>
                            <Icon size={24} />
                        </div>
                        <span className={`text-4xl font-black tracking-widest uppercase italic transition-all duration-300 group-hover:tracking-[0.15em] ${color === 'primary' ? 'text-slate-950' : 'text-white/80 group-hover:text-white drop-shadow-md'}`}>
                            {label}
                        </span>
                    </button>
                ))}
            </nav>
            
            <button className="flex items-center gap-3 px-6 py-3 mt-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 hover:border-white/30 transition-all text-white/60 hover:text-white" onClick={() => onNavigate('spectate')}>
                <Eye size={16} /> 
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Watch Game</span>
            </button>
        </section>
    </main>;
}
