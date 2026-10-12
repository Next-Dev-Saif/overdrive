import { useEffect, useRef, useState } from 'react';
import { Search, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import type { Socket } from 'socket.io-client';
import { startMatchmaking } from '../../services/MatchmakingService';
import type { MatchFoundPayload, MatchMember, TeamId } from '../../../shared/match';

interface MatchmakingOverlayProps {
    mapId: string;
    vehicleId: string;
    weaponId: string;
    vehicleColor: string;
    onMatchFound: (roomData: MatchFoundPayload & { socket: Socket }) => void;
    onCancel: () => void;
}

export function MatchmakingOverlay({ mapId, vehicleId, weaponId, vehicleColor, onMatchFound, onCancel }: MatchmakingOverlayProps) {
    const { token, user, expireSession } = useAuth();
    const [status, setStatus] = useState('> CONNECTING TO SERVER...');
    const [elapsed, setElapsed] = useState(0);
    const [searching, setSearching] = useState(false);
    const cancelRef = useRef<(() => void) | null>(null);
    const [matchData, setMatchData] = useState<MatchFoundPayload | null>(null);
    const [matchFound, setMatchFound] = useState(false);
    const onMatchFoundRef = useRef(onMatchFound);
    const rejectSessionRef = useRef(() => { expireSession(); onCancel(); });

    useEffect(() => {
        onMatchFoundRef.current = onMatchFound;
        rejectSessionRef.current = () => { expireSession(); onCancel(); };
    }, [onMatchFound, expireSession, onCancel]);

    useEffect(() => {
        if (!searching) return;
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [searching]);

    useEffect(() => {
        if (!token) return;

        const cancel = startMatchmaking(token, { mapId, vehicleId, weaponId, vehicleColor }, {
            authenticationRejected: () => rejectSessionRef.current(),
            searching: () => { setSearching(true); setElapsed(0); setMatchData(null); setMatchFound(false); setStatus('> SEARCHING FOR PLAYERS...'); },
            found: data => { setSearching(false); setMatchData(data); setMatchFound(true); setStatus('> MATCH FOUND. PREPARING GAME...'); },
            ready: data => onMatchFoundRef.current(data),
            error: message => { setSearching(false); setMatchData(null); setMatchFound(false); setStatus(message); },
        });
        cancelRef.current = cancel;
        return () => {
            cancel();
            if (cancelRef.current === cancel) cancelRef.current = null;
        };
    }, [token, mapId, vehicleId, weaponId, vehicleColor]);

    const handleCancel = () => {
        cancelRef.current?.();
        onCancel();
    };

    const membersFor = (teamId: TeamId): Array<MatchMember | null> => Array.from({ length: 5 }, (_, slot) =>
        matchData?.snapshot.roster.find(member => member.teamId === teamId && member.slot === slot) ?? null,
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-white font-sans overflow-hidden" data-lenis-prevent="true">
            {/* Ambient Background Scans */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50" />
            
            <div className="relative w-full h-full max-w-[1800px] flex flex-col p-8 md:p-12 mx-auto justify-between">
                
                {/* Header */}
                <header className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <h2 className={`text-4xl md:text-5xl font-black tracking-tighter uppercase transition-colors duration-500 ${matchFound ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'text-white/80'}`}>
                            {matchFound ? 'Match Found' : 'Searching for Match'}
                        </h2>
                        <div className="flex items-center gap-4 mt-4">
                            <span role="status" aria-live="polite" className="text-white/60 font-mono text-sm tracking-[0.3em] uppercase">{token ? status : '> SIGN IN TO FIND A MATCH.'}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <span className="text-3xl md:text-4xl font-light tabular-nums font-mono">
                            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-white/40 mt-2">Time Elapsed</span>
                    </div>
                </header>

                {/* Massive Split Roster */}
                <div className="flex-1 flex items-center justify-center w-full my-8 relative">
                    <div className="grid grid-cols-2 gap-12 md:gap-24 w-full max-h-full items-center relative">
                        {/* Alpha Team */}
                        <div className="flex flex-col border-t-2 border-white/50 pt-4 md:pt-6">
                            <div className="flex items-center gap-4 mb-4 md:mb-8">
                                <ShieldAlert size={24} className="text-white" />
                                <h3 className="text-3xl md:text-5xl font-black tracking-widest text-white">TEAM 1</h3>
                                {matchData?.team === 'alpha' && <span className="bg-white/20 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 rounded font-mono tracking-widest border border-white/30">YOUR TEAM</span>}
                            </div>
                            <div className="space-y-2 md:space-y-4">
                                {membersFor('alpha').map((member, slot) => (
                                    <div key={slot} className="flex items-center gap-4 md:gap-6 bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl">
                                        <span className="text-white/30 font-black text-xl md:text-2xl w-6 md:w-8">0{slot + 1}</span>
                                        {member ? (
                                            <div className="flex-1 flex justify-between items-center">
                                                <span className="text-lg md:text-xl font-bold tracking-wider">{member.entityId === matchData?.localMember.entityId ? user?.username : member.displayName}</span>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex justify-between items-center opacity-30">
                                                <span className="text-sm md:text-lg font-mono tracking-widest">SEARCHING...</span>
                                                <Search size={18} className="animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center Divider / Graphic */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 md:gap-8 pointer-events-none opacity-20 mix-blend-screen">
                            <div className="w-[1px] h-24 md:h-32 bg-gradient-to-b from-transparent to-white" />
                            <div className="text-3xl md:text-4xl font-black tracking-[0.5em] rotate-90 my-8 md:my-12">VS</div>
                            <div className="w-[1px] h-24 md:h-32 bg-gradient-to-t from-transparent to-white" />
                        </div>

                        {/* Bravo Team */}
                        <div className="flex flex-col border-t-2 border-slate-500/50 pt-4 md:pt-6 text-right">
                            <div className="flex items-center justify-end gap-4 mb-4 md:mb-8">
                                {matchData?.team === 'bravo' && <span className="bg-white/20 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 rounded font-mono tracking-widest border border-white/30">YOUR TEAM</span>}
                                <h3 className="text-3xl md:text-5xl font-black tracking-widest text-slate-300">TEAM 2</h3>
                                <ShieldAlert size={24} className="text-slate-300" />
                            </div>
                            <div className="space-y-2 md:space-y-4">
                                {membersFor('bravo').map((member, slot) => (
                                    <div key={slot} className="flex items-center flex-row-reverse gap-4 md:gap-6 bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl">
                                        <span className="text-white/30 font-black text-xl md:text-2xl w-6 md:w-8 text-left">0{slot + 1}</span>
                                        {member ? (
                                            <div className="flex-1 flex flex-row-reverse justify-between items-center">
                                                <span className="text-lg md:text-xl font-bold tracking-wider">{member.entityId === matchData?.localMember.entityId ? user?.username : member.displayName}</span>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-row-reverse justify-between items-center opacity-30">
                                                <span className="text-sm md:text-lg font-mono tracking-widest">SEARCHING...</span>
                                                <Search size={18} className="animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <footer className="flex justify-between items-end border-t border-white/10 pt-4 md:pt-8 mt-auto shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono tracking-[0.4em] text-white/40 uppercase mb-2">MAP</span>
                        <span className="text-xl md:text-2xl font-black tracking-widest uppercase">{mapId}</span>
                    </div>
                    
                    {!matchFound && (
                        <button onClick={handleCancel} className="group flex items-center gap-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/30 hover:border-red-500 px-6 md:px-8 py-3 md:py-4 rounded-full transition-all">
                            <X size={20} className="text-red-400 group-hover:text-white" />
                            <span className="font-bold tracking-[0.2em] text-red-400 group-hover:text-white uppercase text-xs md:text-sm">Cancel Search</span>
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
