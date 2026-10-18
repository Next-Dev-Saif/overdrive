import { useEffect, useRef } from 'react';
import { arenas } from '../../data/catalog';
import '../page-sections/setup/queue.css';
import { useAuth } from '../../store/AuthContext';
import type { Socket } from 'socket.io-client';
import type { MatchFoundPayload } from '../../../shared/match';
import { useRoomBrowser } from '../../hooks/useRoomBrowser';

interface MatchmakingOverlayProps {
    mapId: string;
    vehicleId: string;
    weaponId: string;
    vehicleColor: string;
    onMatchFound: (roomData: MatchFoundPayload & { socket: Socket }) => void;
    onCancel: () => void;
}

/** Native dialog provides focus containment and keyboard dismissal for the server room directory. */
export function MatchmakingOverlay({ mapId, vehicleId, weaponId, vehicleColor, onMatchFound, onCancel }: MatchmakingOverlayProps) {
    const { token, expireSession } = useAuth();
    const browser = useRoomBrowser(token, { mapId, vehicleId, weaponId, vehicleColor }, onMatchFound, () => { expireSession(); onCancel(); });
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
    const cancel = () => { browser.close(); onCancel(); };
    const mapName = arenas.find(item => item.id === mapId)?.name ?? mapId;
    return <dialog ref={dialog} className="queue-dialog room-browser" aria-labelledby="queue-title" onCancel={event => { event.preventDefault(); cancel(); }}>
        <p className="queue-label">TEAM BATTLE · {mapName}</p>
        <h2 id="queue-title">{browser.membership ? 'Room ready' : 'Choose a room'}</h2>
        <p role="status">{!browser.connected ? 'Connecting to server…' : browser.membership ? 'Invite friends to select this room. Empty slots fill with bots when the host starts.' : 'Join friends in a waiting room, or create your own.'}</p>
        {browser.error && <p role="alert" className="room-error">{browser.error}</p>}
        {browser.membership ? <section className="room-members" aria-label="Current room">
            <h3>{browser.membership.room.name}</h3>
            <code>{browser.membership.room.id}</code>
            <p>{browser.membership.room.humans} / {browser.membership.room.capacity} players · {browser.membership.room.capacity - browser.membership.room.humans} bots on start</p>
            <ul>{browser.membership.players.map((name, index) => <li key={index}>{name}{index === 0 ? ' · Host' : ''}</li>)}</ul>
            <div className="queue-actions">
                {browser.membership.isHost ? <button type="button" disabled={browser.busy || !browser.connected} onClick={browser.start}>{browser.busy ? 'Starting…' : 'Start battle'}</button> : <p role="status">Waiting for the host to start.</p>}
                <button type="button" disabled={browser.busy} onClick={browser.leave}>Leave room</button>
            </div>
        </section> : <>
            <ul className="room-list" aria-label="Available server rooms" aria-busy={!browser.connected || browser.busy}>
                {browser.rooms.map(room => <li key={room.id}>
                    <div><strong>{room.name}</strong><code>{room.id}</code><span>{room.humans} / {room.capacity} players · {room.status === 'playing' ? 'In battle' : room.humans >= room.capacity ? 'Full' : 'Waiting'}</span></div>
                    <button type="button" disabled={!browser.connected || browser.busy || room.status !== 'waiting' || room.humans >= room.capacity} onClick={() => browser.join(room.id)} aria-label={`Join ${room.name}`}>Join</button>
                </li>)}
            </ul>
            {browser.connected && !browser.rooms.length && <p>No rooms on this map yet. Create one and invite your friends.</p>}
            <div className="queue-actions"><button type="button" disabled={!browser.connected || browser.busy} onClick={() => browser.join()}>{browser.busy ? 'Joining…' : 'Create room'}</button><button type="button" disabled={!browser.connected || browser.busy} onClick={browser.refresh}>Refresh</button></div>
        </>}
        <div className="queue-actions">{browser.error && !browser.connected && <button type="button" onClick={browser.retry}>Retry connection</button>}<button type="button" autoFocus onClick={cancel}>Back to setup</button></div>
    </dialog>;
}
