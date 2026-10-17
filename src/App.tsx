import { useEffect, useState } from 'react';
import { GameCanvas } from './components/core/GameCanvas';
import { AuthScreen } from './components/ui/AuthScreen';
import { MatchmakingOverlay } from './components/ui/MatchmakingOverlay';
import { DeathRaceScreen } from './components/page-sections/race/DeathRaceScreen';
import { SettingsScreen } from './components/page-sections/operations/SettingsScreen';
import { MatchSetupScreen } from './components/page-sections/setup/MatchSetupScreen';
import { DEFAULT_SETUP, setupDestination, validateSetup } from './components/page-sections/setup/setupState';
import { SoundManager } from './game/engine/SoundManager';
import { useAuth } from './store/AuthContext';
import type { MatchFoundPayload } from '../shared/match';
import type { Socket } from 'socket.io-client';
import './index.css';

type View = 'setup' | 'settings' | 'game' | 'race';
/** Retired menu URLs land on setup; refreshing never launches a live match. */
function readView(): View { return location.hash === '#settings' ? 'settings' : 'setup'; }
function readSetup() {
    try { return validateSetup(JSON.parse(localStorage.getItem('overdrive_setup') ?? 'null')); }
    catch { return { ...DEFAULT_SETUP }; }
}

function App() {
    const { user, updateProgress, logout } = useAuth();
    const [view, setView] = useState<View>(readView);
    const [setup, setSetup] = useState(readSetup);
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [roomData, setRoomData] = useState<(MatchFoundPayload & { socket: Socket }) | null>(null);
    const navigate = (next: View) => {
        setView(next);
        history.pushState(null, '', `${location.pathname}${location.search}#${next}`);
    };
    useEffect(() => {
        // Storage may be unavailable in private/restricted browser sessions; choices still work in memory.
        try { localStorage.setItem('overdrive_setup', JSON.stringify(setup)); } catch { /* Session-only preferences. */ }
    }, [setup]);
    useEffect(() => {
        SoundManager.getInstance();
        const onHistory = () => { setIsMatchmaking(false); setRoomData(null); setView(readView()); };
        window.addEventListener('hashchange', onHistory);
        window.addEventListener('popstate', onHistory);
        return () => { window.removeEventListener('hashchange', onHistory); window.removeEventListener('popstate', onHistory); };
    }, []);
    useEffect(() => {
        const onProgression = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            updateProgress(detail.stats, detail.wallet);
        };
        window.addEventListener('progression-update', onProgression);
        return () => window.removeEventListener('progression-update', onProgression);
    }, [updateProgress]);
    const start = () => {
        if (!user || isMatchmaking) return;
        setRoomData(null);
        const destination = setupDestination(setup.mode);
        if (destination === 'queue') setIsMatchmaking(true);
        else navigate(destination);
    };
    const backToSetup = () => { setRoomData(null); navigate('setup'); };
    return <div className="w-screen h-dvh overflow-hidden bg-[#08090b] text-[#f5f6f8] selection:bg-white selection:text-black">
        {!user ? <AuthScreen /> : <>
            {view === 'setup' && <MatchSetupScreen setup={setup} onChange={setSetup} username={user.username} onStart={start} onSettings={() => navigate('settings')} onLogout={() => { setIsMatchmaking(false); setView('setup'); logout(); }} />}
            {view === 'settings' && <SettingsScreen onBack={backToSetup} />}
            {view === 'race' && <DeathRaceScreen color={setup.color} onBack={backToSetup} />}
            {view === 'game' && <GameCanvas mapId={setup.map} vehicleId={setup.vehicle} weaponId={setup.weapon} vehicleColor={setup.color} mode={setup.mode} roomData={roomData ?? undefined} onBack={backToSetup} />}
            {isMatchmaking && <MatchmakingOverlay mapId={setup.map} vehicleId={setup.vehicle} weaponId={setup.weapon} vehicleColor={setup.color} onCancel={() => setIsMatchmaking(false)} onMatchFound={data => { setIsMatchmaking(false); setRoomData(data); navigate('game'); }} />}
        </>}
    </div>;
}
export default App;
