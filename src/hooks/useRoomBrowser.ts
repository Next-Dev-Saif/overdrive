import { useEffect, useRef, useState } from 'react';
import { browseRooms } from '../services/RoomService';
import type { RoomLoadout, RoomMembership, ServerRoom } from '../../shared/rooms';
import type { MatchFoundPayload } from '../../shared/match';
import type { Socket } from 'socket.io-client';

/** Room-list state stays scoped to the browser; transport lifecycle survives callback identity changes. */
export function useRoomBrowser(token: string | null, loadout: RoomLoadout, ready: (data: MatchFoundPayload & { socket: Socket }) => void, rejected: () => void) {
    const [rooms, setRooms] = useState<ServerRoom[]>([]);
    const [membership, setMembership] = useState<RoomMembership | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const service = useRef<ReturnType<typeof browseRooms> | null>(null);
    const callbacks = useRef({ ready, rejected });
    useEffect(() => { callbacks.current = { ready, rejected }; }, [ready, rejected]);
    const { mapId, vehicleId, weaponId, vehicleColor } = loadout;
    useEffect(() => {
        if (!token) return;
        const connection = browseRooms(token, { mapId, vehicleId, weaponId, vehicleColor }, {
            rooms: setRooms, membership: value => { setMembership(value); setBusy(false); },
            connection: value => { setConnected(value); if (value) setError(''); }, error: setError,
            ready: data => callbacks.current.ready(data), rejected: () => callbacks.current.rejected(), settled: () => setBusy(false),
        });
        service.current = connection;
        return () => { connection.close(); if (service.current === connection) service.current = null; };
    }, [token, mapId, vehicleId, weaponId, vehicleColor, attempt]);
    const action = (operation: 'join' | 'start', id?: string) => {
        if (!connected || busy) return;
        setBusy(true); setError('');
        if (operation === 'join') service.current?.join(id); else service.current?.start();
    };
    return { rooms, membership, connected, error, busy, join: (id?: string) => action('join', id), start: () => action('start'),
        leave: () => { setError(''); service.current?.leave(); }, refresh: () => service.current?.refresh(), retry: () => { setConnected(false); setError(''); setBusy(false); setRooms([]); setMembership(null); setAttempt(value => value + 1); }, close: () => service.current?.close() };
}
