import { useEffect, useRef, useState } from 'react';
import { arenas, vehicles, weapons } from '../../data/catalog';
import '../page-sections/setup/queue.css';
import { useAuth } from '../../store/AuthContext';
import type { Socket } from 'socket.io-client';
import { startMatchmaking } from '../../services/MatchmakingService';
import type { MatchFoundPayload } from '../../../shared/match';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface MatchmakingOverlayProps {
    mapId: string;
    vehicleId: string;
    weaponId: string;
    vehicleColor: string;
    onMatchFound: (roomData: MatchFoundPayload & { socket: Socket }) => void;
    onCancel: () => void;
}

export function MatchmakingOverlay({ mapId, vehicleId, weaponId, vehicleColor, onMatchFound, onCancel }: MatchmakingOverlayProps) {
    const { token, expireSession } = useAuth();
    const [status, setStatus] = useState('Connecting to match server...');
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const [elapsed, setElapsed] = useState(0);
    const [searching, setSearching] = useState(false);
    const cancelRef = useRef<(() => void) | null>(null);
    const [matchData, setMatchData] = useState<MatchFoundPayload | null>(null);
    const [matchFound, setMatchFound] = useState(false);
    const onMatchFoundRef = useRef(onMatchFound);
    const rejectSessionRef = useRef(() => { expireSession(); onCancel(); });

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

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
            searching: () => {
                setError(false);
                setSearching(true);
                setElapsed(0);
                setMatchData(null);
                setMatchFound(false);
                setStatus('Searching for players. Empty slots fill with bots.');
            },
            found: data => {
                setError(false);
                setSearching(false);
                setMatchData(data);
                setMatchFound(true);
                setStatus('Match found! Loading map...');
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
            },
            ready: data => onMatchFoundRef.current(data),
            error: message => {
                setSearching(false);
                setMatchData(null);
                setMatchFound(false);
                setError(true);
                setStatus(message);
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
            },
        });
        cancelRef.current = cancel;
        return () => {
            cancel();
            if (cancelRef.current === cancel) cancelRef.current = null;
        };
    }, [token, mapId, vehicleId, weaponId, vehicleColor, attempt]);

    const handleCancel = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
        cancelRef.current?.();
        onCancel();
    };

    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);

    const mapName = arenas.find(item => item.id === mapId)?.name ?? mapId;
    const vehicleName = vehicles.find(item => item.id === vehicleId)?.name ?? vehicleId;
    const weaponName = weapons.find(item => item.id === weaponId)?.name ?? weaponId;

    return (
        <dialog
            ref={dialog}
            className="queue-dialog"
            aria-labelledby="queue-title"
            onCancel={event => {
                event.preventDefault();
                handleCancel();
            }}
            data-lenis-prevent="true"
        >
            <div className="flex items-center justify-between mb-2">
                <p className="queue-label">5 vs 5 Matchmaking</p>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                    {matchFound ? (
                        <span className="flex items-center gap-1.5 text-white font-bold">
                            <CheckCircle2 size={14} /> Ready
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-white/70">
                            <Loader2 size={13} className="animate-spin" /> Searching
                        </span>
                    )}
                </div>
            </div>

            <h2 id="queue-title">
                {error ? 'Connection Failed' : matchFound ? 'Match Found' : 'Finding Match'}
            </h2>

            <p role={error ? 'alert' : 'status'}>{status}</p>

            <dl className="queue-summary">
                <div>
                    <dt>Arena</dt>
                    <dd>{mapName}</dd>
                </div>
                <div>
                    <dt>Car</dt>
                    <dd>{vehicleName}</dd>
                </div>
                <div>
                    <dt>Weapon</dt>
                    <dd>{weaponName}</dd>
                </div>
            </dl>

            {searching && (
                <div className="queue-time flex items-center justify-between">
                    <span>Elapsed Time</span>
                    <strong className="text-white font-mono text-sm">
                        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </strong>
                </div>
            )}

            {matchData && (
                <p className="mt-4 text-xs text-white/90 bg-white/5 p-3 border border-white/10 text-center font-semibold">
                    {matchData.snapshot.roster.length} players connected. Loading game...
                </p>
            )}

            <div className="queue-actions">
                {error && (
                    <button
                        type="button"
                        className="queue-retry"
                        onMouseEnter={playHover}
                        onClick={() => {
                            playSelect();
                            setError(false);
                            setStatus('Reconnecting to server...');
                            setAttempt(value => value + 1);
                        }}
                    >
                        Retry
                    </button>
                )}
                <button
                    type="button"
                    autoFocus
                    onMouseEnter={playHover}
                    onClick={handleCancel}
                >
                    {error ? 'Back to Lobby' : 'Cancel'}
                </button>
            </div>
        </dialog>
    );
}
