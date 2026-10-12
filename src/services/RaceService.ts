import { SERVER_URL } from '../config';
import { io } from 'socket.io-client';
import type { RaceFound, RaceInput, RaceShot, RaceSnapshot } from '../../shared/race/types';

export const RACE_SERVER_URL = SERVER_URL;
/** Authenticated race transport; the UI never emits authoritative gameplay claims. */
export function connectRace(token: string, color: string, callbacks: { found: (data: RaceFound) => void; snapshot: (state: RaceSnapshot) => void; shots: (shots: RaceShot[]) => void; error: (message: string) => void }) {
    const socket = io(RACE_SERVER_URL, { auth: { token }, reconnection: false, timeout: 10000 });
    let closed = false;
    socket.on('connect', () => socket.emit('race:queue', { color }));
    socket.on('race:found', callbacks.found);
    socket.on('race:snapshot', callbacks.snapshot);
    socket.on('race:shots', callbacks.shots);
    socket.on('race:error', callbacks.error);
    socket.on('connect_error', () => callbacks.error('Could not connect to the race server. Check your connection and retry.'));
    socket.on('disconnect', () => { if (!closed) callbacks.error('Connection to the race was lost. Return to setup or join a new race.'); });
    return {
        ready: () => socket.emit('race:ready'),
        input: (input: RaceInput) => { if (socket.connected) socket.emit('race:input', input); },
        recover: () => socket.emit('race:recover'),
        close: () => { closed = true; socket.emit('race:leave'); socket.removeAllListeners(); socket.disconnect(); },
    };
}
export type RaceConnection = ReturnType<typeof connectRace>;
