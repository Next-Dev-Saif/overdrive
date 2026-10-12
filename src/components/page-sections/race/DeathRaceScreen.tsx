import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { connectRace, type RaceConnection } from '../../../services/RaceService';
import { RaceEngine } from '../../../game/race/RaceEngine';
import type { RaceSnapshot } from '../../../../shared/race/types';
import { RaceHud } from './RaceHud';
import './race.css';

/** One isolated session owns queue transport, rendering and all cleanup, including failed loading. */
export function DeathRaceScreen({ color, onBack }: { color: string; onBack: () => void }) {
    const { token } = useAuth();
    const leaveDialog = useRef<HTMLDialogElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<RaceEngine | null>(null), connection = useRef<RaceConnection | null>(null);
    const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null), [localId, setLocalId] = useState('');
    const [status, setStatus] = useState('Finding drivers · empty grid slots fill with bots');
    const [error, setError] = useState(''), [ready, setReady] = useState(false), [confirmLeave, setConfirmLeave] = useState(false);
    useEffect(() => {
        let cancelled = false, lastHud = 0;
        if (!token) return;
        const fail = (message: string) => { if (cancelled) return; setError(message); if (engine.current) engine.current.paused = true; };
        const session = connectRace(token, color, {
            found: async data => {
                if (cancelled || !canvas.current) return;
                setLocalId(data.localId); setSnapshot(data.snapshot); setStatus('Loading Blacktop Circuit');
                try {
                    const renderer = new RaceEngine(canvas.current, data.snapshot, data.localId, input => session.input(input));
                    engine.current = renderer;
                    await renderer.initialize();
                    if (cancelled) return;
                    setReady(true); session.ready();
                } catch (cause) { console.error('Death Race initialization failed', cause); fail('The race could not load. Return to setup and try again.'); engine.current?.dispose(); }
            },
            snapshot: state => { if (cancelled) return; engine.current?.setSnapshot(state); if (performance.now() - lastHud > 90 || state.phase === 'finished') { setSnapshot(state); lastHud = performance.now(); } },
            shots: shots => engine.current?.playShots(shots), error: fail,
        });
        connection.current = session;
        const keys = (event: KeyboardEvent) => {
            if (leaveDialog.current?.open) return;
            if (event.key === 'Escape') setConfirmLeave(true);
            if ((event.target === canvas.current || event.target === document.body) && [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
        };
        window.addEventListener('keydown', keys);
        return () => { cancelled = true; window.removeEventListener('keydown', keys); session.close(); connection.current = null; engine.current?.dispose(); engine.current = null; };
    }, [token, color]);
    useEffect(() => {
        if (engine.current) engine.current.paused = confirmLeave || Boolean(error);
        if (confirmLeave && !error) leaveDialog.current?.showModal(); else leaveDialog.current?.close();
    }, [confirmLeave, error]);
    return <main className="death-race"><canvas ref={canvas} aria-label="Death Race driving view" />
        {ready && snapshot && localId && !error && <RaceHud state={snapshot} localId={localId} engine={engine} recover={() => connection.current?.recover()} leave={() => snapshot.phase === 'finished' ? onBack() : setConfirmLeave(true)} />}
        {(!ready || error) && <div className="race-loading" role="status"><small>DEATH RACE</small><h1>{error ? 'Race unavailable' : 'Assembling the grid'}</h1><p>{error || status}</p><p>Interceptor only · Three laps · Trackside weapon pickups</p><button onClick={onBack}>{error ? 'Return to setup' : 'Cancel'}</button></div>}
        <dialog ref={leaveDialog} className="race-leave-dialog" aria-labelledby="race-leave-title" onCancel={() => setConfirmLeave(false)}><h2 id="race-leave-title">Leave this race?</h2><p>The online race continues. Leaving records a DNF.</p><button autoFocus onClick={() => setConfirmLeave(false)}>Keep racing</button><button onClick={onBack}>Leave race</button></dialog>
    </main>;
}
