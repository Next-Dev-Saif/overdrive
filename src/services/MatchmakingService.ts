import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from '../config';
import type { MatchFoundPayload } from '../../shared/match';

interface MatchmakingLoadout { mapId: string; vehicleId: string; weaponId: string; vehicleColor: string }
interface MatchmakingCallbacks {
    searching: () => void;
    authenticationRejected: () => void;
    found: (data: MatchFoundPayload) => void;
    ready: (data: MatchFoundPayload & { socket: Socket }) => void;
    error: (message: string) => void;
}

/** Own a queue connection until cancellation or explicit transfer to gameplay. */
export function startMatchmaking(token: string, loadout: MatchmakingLoadout, callbacks: MatchmakingCallbacks): () => void {
    const socket = io(SERVER_URL, { auth: { token }, autoConnect: false, timeout: 10000, reconnectionAttempts: 5 });
    let closed = false, transferred = false, matched = false;
    let handoff: ReturnType<typeof setTimeout> | undefined;
    const clearHandoff = () => { clearTimeout(handoff); handoff = undefined; };
    const onConnect = () => {
        if (closed || transferred) return;
        matched = false;
        callbacks.searching();
        socket.emit('joinMatchmaking', loadout);
    };
    const onError = (error: Error) => {
        if (closed || transferred) return;
        clearHandoff(); matched = false;
        if (error.message === 'Authentication error') {
            closed = true;
            detach();
            socket.disconnect();
            callbacks.authenticationRejected();
            return;
        }
        callbacks.error('> CANNOT REACH SERVER. CHECK THE SERVER AND CONNECTION.');
    };
    const onDisconnect = () => {
        if (closed || transferred) return;
        clearHandoff(); matched = false;
        callbacks.error('> CONNECTION LOST. RECONNECTING...');
    };
    const onRetryFailed = () => {
        if (!closed && !transferred) callbacks.error('> CONNECTION FAILED. CANCEL AND TRY AGAIN.');
    };
    const detach = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        socket.off('disconnect', onDisconnect);
        socket.off('matchFound', onFound);
        socket.io.off('reconnect_failed', onRetryFailed);
    };
    const onFound = (data: MatchFoundPayload) => {
        if (closed || transferred || matched) return;
        matched = true;
        callbacks.found(data);
        handoff = setTimeout(() => {
            if (closed || !socket.connected) return;
            // Detach queue listeners before the game takes ownership: reconnects must not queue twice.
            transferred = true;
            detach();
            callbacks.ready({ ...data, socket });
        }, 1000);
    };
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.on('disconnect', onDisconnect);
    socket.on('matchFound', onFound);
    socket.io.on('reconnect_failed', onRetryFailed);
    // React development effect replay cancels this before any network handshake begins.
    const start = setTimeout(() => { if (!closed) socket.connect(); }, 0);
    return () => {
        if (closed) return;
        closed = true;
        clearTimeout(start); clearHandoff(); detach();
        if (!transferred) {
            if (socket.connected && !matched) socket.emit('cancelMatchmaking');
            // Disconnect connecting/reconnecting sockets too, not just established ones.
            socket.disconnect();
        }
    };
}
