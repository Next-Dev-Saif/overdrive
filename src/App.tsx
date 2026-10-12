import { DeathRaceScreen } from './components/page-sections/race/DeathRaceScreen';
import { useState, useEffect } from 'react';
import { GameCanvas } from './components/core/GameCanvas';
import { HomeScreen } from './components/ui/HomeScreen';
import { ModeSelectScreen } from './components/ui/ModeSelectScreen';
import { MapSelectScreen } from './components/ui/MapSelectScreen';
import { LobbyScreen } from './components/ui/LobbyScreen';
import { GarageScreen } from './components/ui/GarageScreen';
import { OperationsScreen } from './components/page-sections/operations/OperationsScreen';
import { SettingsScreen } from './components/page-sections/operations/SettingsScreen';
import { SoundManager } from './game/engine/SoundManager';
import './index.css';

type View = 'auth' | 'home' | 'mode_select' | 'map_select' | 'lobby' | 'garage' | 'armory' | 'profile' | 'settings' | 'game' | 'spectate' | 'results' | 'race';
const menuViews: View[] = ['auth', 'home', 'mode_select', 'map_select', 'lobby', 'garage', 'armory', 'profile', 'settings'];
/** Keep menu destinations addressable without allowing a URL to launch a match unexpectedly. */
function readView(): View { const hash = location.hash.slice(1) as View; return menuViews.includes(hash) ? hash : 'home'; }
import { AuthScreen } from './components/ui/AuthScreen';
import { useAuth } from './store/AuthContext';
import { MatchmakingOverlay } from './components/ui/MatchmakingOverlay';
import type { MatchFoundPayload } from '../shared/match';
import type { Socket } from 'socket.io-client';

function App() {
    const { user, updateProgress } = useAuth();
    const [view, setView] = useState<View>(readView);
    const [mode, setMode] = useState('deathmatch');
    const [map, setMap] = useState('wasteland');
    const [vehicle, setVehicle] = useState('interceptor');
    const [weapon, setWeapon] = useState('minigun');
    const [vehicleColor, setVehicleColor] = useState('#2dd4bf');
    const [garageReturn, setGarageReturn] = useState<View>('home');

    const navigate = (next: View) => {
        if (!user && next !== 'auth') {
            setView('auth');
            history.pushState(null, '', `${location.pathname}#auth`);
            return;
        }
        setView(next);
        history.pushState(null, '', `${location.pathname}#${next}`);
    };

    useEffect(() => {
        SoundManager.getInstance();
        const onHash = () => {
            const next = readView();
            if (!user && next !== 'auth') {
                setView('auth');
                history.replaceState(null, '', `${location.pathname}#auth`);
            } else if (user && next === 'auth') {
                setView('home');
                history.replaceState(null, '', `${location.pathname}#home`);
            } else {
                setView(next);
            }
        };

        // Check on mount and user change
        if (!user && view !== 'auth') {
            setView('auth');
            history.replaceState(null, '', `${location.pathname}#auth`);
        } else if (user && view === 'auth') {
            setView('home');
            history.replaceState(null, '', `${location.pathname}#home`);
        }

        window.addEventListener('hashchange', onHash);
        window.addEventListener('popstate', onHash);
        return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('popstate', onHash); };
    }, [user, view]);

    // Listen for progression updates from socket
    useEffect(() => {
        const onProgression = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (updateProgress) {
                updateProgress(detail.stats, detail.wallet);
                // We could add a toast notification here using detail.message later
                console.log("Progression update:", detail.message);
            }
        };
        window.addEventListener('progression-update', onProgression);
        return () => window.removeEventListener('progression-update', onProgression);
    }, [updateProgress]);

    const garage = (returnTo: View = 'home') => { setGarageReturn(returnTo); navigate('garage'); };

    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [roomData, setRoomData] = useState<(MatchFoundPayload & { socket: Socket }) | null>(null);

    const startMatchmaking = () => {
        setIsMatchmaking(true);
    };

    return <>
        <div className="w-screen h-dvh overflow-hidden bg-neu-bg text-neu-text">
            {view === 'auth' && <AuthScreen />}
            {view === 'home' && <HomeScreen equippedVehicle={vehicle} equippedWeapon={weapon} vehicleColor={vehicleColor} onNavigate={next => {
                setGarageReturn('home'); navigate(next as View);
            }} />}
            {(view === 'garage' || view === 'armory') && <GarageScreen key={view} equippedVehicle={vehicle} onEquip={setVehicle} equippedWeapon={weapon} onEquipWeapon={setWeapon} vehicleColor={vehicleColor} onColorChange={setVehicleColor} initialTab={view === 'armory' ? 'weapons' : 'vehicles'} onBack={() => navigate(garageReturn)} />}
            {view === 'mode_select' && <ModeSelectScreen initialMode={mode} onDeploy={(nextMode, nextMap) => { setMode(nextMode); setMap(nextMap); if (nextMode === 'deathrace') navigate('race'); else if (nextMode === 'freeroam') navigate('game'); else startMatchmaking(); }} onBack={() => navigate('home')} />}
            {view === 'race' && <DeathRaceScreen color={vehicleColor} onBack={() => navigate('mode_select')} />}
            {view === 'map_select' && <MapSelectScreen onSelectMap={next => { setMap(next); navigate('lobby'); }} onBack={() => navigate('mode_select')} />}
            {view === 'lobby' && <LobbyScreen mode={mode} mapId={map} equippedVehicle={vehicle} equippedWeapon={weapon} vehicleColor={vehicleColor} onLaunch={() => mode === 'deathrace' ? navigate('race') : mode === 'freeroam' ? navigate('game') : startMatchmaking()} onBack={() => navigate('map_select')} onGarage={() => garage('lobby')} />}
            {view === 'profile' && <OperationsScreen key={view} initialSection="Profile" vehicleId={vehicle} weaponId={weapon} vehicleColor={vehicleColor} onBack={() => navigate('home')} onGarage={() => garage()} onPlay={() => mode === 'deathrace' ? navigate('race') : startMatchmaking()} />}
            {view === 'settings' && <SettingsScreen onBack={() => navigate('home')} />}
            {(view === 'game' || view === 'spectate') && <GameCanvas mapId={map} vehicleId={vehicle} weaponId={weapon} vehicleColor={vehicleColor} mode={view === 'spectate' ? 'spectator' : mode} isSpectator={view === 'spectate'} roomData={roomData ?? undefined} onBack={(_seconds, result) => {
                setRoomData(null);
                navigate(result ? 'lobby' : 'home');
            }} />}
        </div>
        {isMatchmaking && user && <MatchmakingOverlay
            mapId={map} vehicleId={vehicle} weaponId={weapon} vehicleColor={vehicleColor}
            onCancel={() => setIsMatchmaking(false)}
            onMatchFound={(data) => {
                setIsMatchmaking(false);
                setRoomData(data);
                navigate('game');
            }}
        />}
    </>;
}
export default App;
