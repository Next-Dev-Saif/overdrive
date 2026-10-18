import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from '../config';
import type { MatchFoundPayload } from '../../shared/match';
import type { RoomLoadout, RoomMembership, RoomReply, ServerRoom } from '../../shared/rooms';

interface RoomCallbacks {
    rooms: (rooms: ServerRoom[]) => void;
    membership: (membership: RoomMembership | null) => void;
    connection: (connected: boolean) => void;
    error: (message: string) => void;
    rejected: () => void;
    ready: (data: MatchFoundPayload & { socket: Socket }) => void;
    settled: () => void;
}

/** Own one authenticated browsing socket, transferring it intact to gameplay only after matchFound. */
export function browseRooms(token: string, loadout: RoomLoadout, callbacks: RoomCallbacks) {
    const socket = io(SERVER_URL, { auth: { token }, autoConnect: false, timeout: 10000, reconnectionAttempts: 5 });
    let closed = false, transferred = false;
    const refresh = () => { if (!closed && socket.connected) socket.emit('browseRooms', loadout.mapId); };
    const connect = () => { callbacks.connection(true); callbacks.membership(null); callbacks.settled(); refresh(); };
    const disconnected = () => { callbacks.connection(false); callbacks.membership(null); callbacks.settled(); callbacks.error('Connection lost. Reconnecting; rejoin your room when connected.'); };
    const failed = (error: Error) => {
        callbacks.connection(false); callbacks.settled();
        if (error.message === 'Authentication error') callbacks.rejected();
        else callbacks.error('Cannot reach the server. Retry or return to setup.');
    };
    const found = (data: MatchFoundPayload) => {
        if (closed || transferred) return;
        transferred = true; detach(); callbacks.ready({ ...data, socket });
    };
    const detach = () => {
        clearInterval(poll); clearTimeout(start);
        socket.off('connect', connect); socket.off('disconnect', disconnected); socket.off('connect_error', failed);
        socket.off('roomList', callbacks.rooms); socket.off('roomState', callbacks.membership); socket.off('matchFound', found);
    };
    socket.on('connect', connect); socket.on('disconnect', disconnected); socket.on('connect_error', failed);
    socket.on('roomList', callbacks.rooms); socket.on('roomState', callbacks.membership); socket.on('matchFound', found);
    const start = setTimeout(() => { if (!closed) socket.connect(); }, 0);
    const poll = setInterval(refresh, 5000);
    const acknowledge = (error: Error | null, result?: RoomReply) => {
        if (closed || transferred) return;
        callbacks.settled();
        if (error || result?.error) callbacks.error(result?.error ?? 'The server did not respond. Refresh the room list and try again.');
    };
    return {
        refresh,
        join: (roomId?: string) => socket.timeout(6000).emit('enterRoom', { roomId, loadout }, acknowledge),
        start: () => socket.timeout(6000).emit('startRoom', acknowledge),
        leave: () => socket.emit('leaveRoom'),
        close: () => { if (closed) return; closed = true; detach(); if (!transferred) socket.disconnect(); },
    };
}
