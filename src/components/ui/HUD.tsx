import { VehicleStatusEffect, VehicleRelationship } from '../page-sections/match/VehicleStatusEffect';
import React, { useEffect, useState } from "react";
import { GameEngine } from "../../game/engine/GameEngine";
import { MobileControls } from "./MobileControls";
import type { MatchMember, TeamId } from "../../../shared/match";
import { Skull, Crosshair, Trophy } from 'lucide-react';


import { VehicleSystems } from '../page-sections/match/VehicleSystems';
import { MatchStrip } from '../page-sections/match/MatchStrip';
import { TargetTracking } from '../page-sections/match/TargetTracking';
import { CombatAccolades, type CombatMedal } from '../page-sections/match/CombatAccolades';

interface HUDProps {
    engineRef: React.MutableRefObject<GameEngine | null>;
    mode: string;
}

export const HUD: React.FC<HUDProps> = ({ engineRef, mode }) => {
    const [frameTime, setFrameTime] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [health, setHealth] = useState(100);
    const [matchState, setMatchState] = useState<'intro' | 'countdown' | 'playing' | 'ended' | 'mvp'>('playing');
    const [matchTimer, setMatchTimer] = useState(300);
    const [scores, setScores] = useState<Record<TeamId, number>>({ alpha: 0, bravo: 0 });
    const [scoreLimit, setScoreLimit] = useState(25);
    const [localTeam, setLocalTeam] = useState<TeamId | null>(null);
    const [winner, setWinner] = useState<TeamId | 'draw' | null>(null);
    const [roster, setRoster] = useState<MatchMember[]>([]);
    const [showRoster, setShowRoster] = useState(false);
    const [introTimer, setIntroTimer] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [abilityCooldownPct, setAbilityCooldownPct] = useState(100);
    const [vehicleId, setVehicleId] = useState("interceptor");
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEmped, setIsEmped] = useState(false);
    const [isStunned, setIsStunned] = useState(false);
    const [isBlasted, setIsBlasted] = useState(false);
    const [ammoData, setAmmoData] = useState({ ammo: 4, maxAmmo: 4, isReloading: false, reloadPct: 100 });

    const [damageNumbers, setDamageNumbers] = useState<Array<{
        id: string;
        worldX: number; worldY: number; worldZ: number;
        screenX: number; screenY: number;
        damage: number;
        isCrit: boolean;
        createdAt: number;
    }>>([]);
    const damageNumbersRef = React.useRef(damageNumbers);

    // Radar State
    const [radarData, setRadarData] = useState<{ px: number, pz: number, yaw: number, contacts: {x: number, z: number, id: string, name: string, teamId?: TeamId, isAlly: boolean}[] }>({ px: 0, pz: 0, yaw: 0, contacts: [] });

    // Nameplates State
    const [nameplates, setNameplates] = useState<Array<{id: string, screenX: number, screenY: number, name: string, healthPct: number, teamId?: TeamId, isAlly: boolean}>>([]);

    // Floating Status Text State
    const [statusTexts, setStatusTexts] = useState<Array<{
        id: string;
        worldX: number; worldY: number; worldZ: number;
        screenX: number; screenY: number;
        text: string;
        color: string;
        createdAt: number;
    }>>([]);
    const statusTextsRef = React.useRef(statusTexts);

    const [hitMarker, setHitMarker] = useState<{ active: boolean; isKill: boolean; timestamp: number }>({ active: false, isKill: false, timestamp: 0 });
    const [killConfirm, setKillConfirm] = useState<{ active: boolean; timestamp: number }>({ active: false, timestamp: 0 });

    const [killFeed, setKillFeed] = useState<Array<{id: string, killer: string, victim: string, weapon: string, killerTeam?: TeamId, victimTeam?: TeamId, time: number}>>([]);
    const killStreakRef = React.useRef(0);
    const [medals, setMedals] = useState<CombatMedal[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrameTime(performance.now());
            if (engineRef.current) {
                setSpeed(Math.round(engineRef.current.getSpeed()));
                setMatchState(engineRef.current.matchState);
                setMatchTimer(engineRef.current.matchTimer);
                setIntroTimer(engineRef.current.introTimer);
                setLocalTeam(engineRef.current.localTeam);
                if (engineRef.current.matchSnapshot) {
                    setScores({ ...engineRef.current.matchSnapshot.scores });
                    setScoreLimit(engineRef.current.matchSnapshot.scoreLimit);
                    setWinner(engineRef.current.matchSnapshot.winner);
                    setRoster(engineRef.current.matchSnapshot.roster);
                }
                
                
                const weapon = (engineRef.current as any).playerWeapon;
                if (weapon) {
                    setIsLocked(weapon.isLocked);

                    const ammo = weapon.currentAmmo;
                    const maxAmmo = weapon.maxAmmo;
                    const isReloading = weapon.isReloading;
                    let reloadPct = 100;
                    if (isReloading) {
                        const elapsed = performance.now() - weapon.lastReloadStartTime;
                        reloadPct = Math.min(100, (elapsed / weapon.reloadTimeMs) * 100);
                    } else if (ammo === 0) {
                        reloadPct = 0;
                    }
                    setAmmoData({ ammo, maxAmmo, isReloading, reloadPct });
                }

                const vehicle = engineRef.current.playerVehicle as any;
                if (vehicle) {
                    setHealth(Math.max(0, vehicle.health / vehicle.maxHealth * 100));
                    const cooldown = vehicle.getAbilityCooldown();
                    const lastTime = vehicle.lastAbilityTime;
                    const elapsed = performance.now() - lastTime;
                    const pct = Math.min(100, Math.max(0, (elapsed / cooldown) * 100));
                    setAbilityCooldownPct(pct);
                    
                    setVehicleId(vehicle.vehicleId);
                    setCooldownSeconds(Math.max(0, (cooldown - elapsed) / 1000));

                    setIsFlipped(vehicle.isFlipped && !vehicle.isDead);
                    setIsEmped(vehicle.isEmped);
                    setIsStunned(vehicle.isStunned);
                    setIsBlasted(vehicle.isBlasted);

                    // Update Radar Data
                    const playerMesh = vehicle.mesh;
                    if (playerMesh && engineRef.current.scene) {
                        const px = playerMesh.position.x;
                        const pz = playerMesh.position.z;
                        const yaw = Math.atan2(playerMesh.forward.x, playerMesh.forward.z);

                        const contacts: {x: number, z: number, id: string, name: string, teamId?: TeamId, isAlly: boolean}[] = [];
                        const nameplatesData: Array<{id: string, screenX: number, screenY: number, name: string, healthPct: number, teamId?: TeamId, isAlly: boolean}> = [];
                        const myId = engineRef.current.networkManager?.id || "";
                        const currentTeam = engineRef.current.localTeam;
                        
                        engineRef.current.scene.meshes.forEach(m => {
                            if (m.metadata?.aiId || (m.metadata?.playerId && m.metadata.playerId !== myId)) {
                                if (m.metadata.vehicle && !m.metadata.vehicle.isDead) {
                                    const enemyId = m.metadata.aiId || m.metadata.playerId;
                                    const teamId = m.metadata.teamId as TeamId | undefined;
                                    const isAlly = Boolean(currentTeam && teamId === currentTeam);
                                    const enemyName = m.metadata.displayName ?? (m.metadata.aiId ? 'BOT' : enemyId.substring(0,6));
                                    
                                    // Don't show cloaked enemies on radar!
                                    if (isAlly || !m.metadata.vehicle.isCloaked) {
                                        contacts.push({ x: m.position.x, z: m.position.z, id: enemyId, name: enemyName, teamId, isAlly });
                                    }
                                    
                                    // Project nameplate to screen
                                    const hp = (m.metadata.vehicle.health / m.metadata.vehicle.maxHealth) * 100;
                                    const vehiclePosition = m.getAbsolutePosition();
                                    const labelHeight = typeof m.metadata.labelHeight === 'number' ? m.metadata.labelHeight : 5.8;
                                    const screenPos = engineRef.current!.projectToScreen(vehiclePosition.x, vehiclePosition.y + labelHeight, vehiclePosition.z);
                                    if (screenPos && screenPos.z < 1 && screenPos.z > 0) { // in front of camera
                                        nameplatesData.push({
                                            id: enemyId,
                                            screenX: screenPos.x,
                                            screenY: screenPos.y,
                                            name: enemyName,
                                            healthPct: hp,
                                            teamId,
                                            isAlly,
                                        });
                                    }
                                }
                            }
                        });
                        setRadarData({ px, pz, yaw, contacts });
                        setNameplates(nameplatesData);
                    }
                }

                // Update Damage Numbers projection
                const now = performance.now();
                const activeNumbers = damageNumbersRef.current.filter(dn => now - dn.createdAt < 1500); // 1.5s lifetime
                
                let updatedNumbers = activeNumbers.map(dn => {
                    // Drift upwards in 3D space
                    const age = (now - dn.createdAt) / 1000; // seconds
                    const currentY = dn.worldY + (age * 3); // Rise 3 units per second
                    
                    const screenPos = engineRef.current!.projectToScreen(dn.worldX, currentY, dn.worldZ);
                    return {
                        ...dn,
                        screenX: screenPos ? screenPos.x : dn.screenX,
                        screenY: screenPos ? screenPos.y : dn.screenY
                    };
                });
                
                if (activeNumbers.length !== damageNumbersRef.current.length || updatedNumbers.some((n, i) => n.screenX !== activeNumbers[i].screenX)) {
                    damageNumbersRef.current = updatedNumbers;
                    setDamageNumbers(updatedNumbers);
                }

                // Update Status Texts projection
                const activeStatus = statusTextsRef.current.filter(st => now - st.createdAt < 2000);
                const updatedStatus = activeStatus.map(st => {
                    const age = (now - st.createdAt) / 1000;
                    const currentY = st.worldY + (age * 1.5);
                    const screenPos = engineRef.current!.projectToScreen(st.worldX, currentY, st.worldZ);
                    return {
                        ...st,
                        screenX: screenPos ? screenPos.x : st.screenX,
                        screenY: screenPos ? screenPos.y : st.screenY
                    };
                });
                
                if (activeStatus.length !== statusTextsRef.current.length || updatedStatus.some((n, i) => n.screenX !== activeStatus[i].screenX)) {
                    statusTextsRef.current = updatedStatus;
                    setStatusTexts(updatedStatus);
                }

                // Clear hit markers
                if (hitMarker.active && now - hitMarker.timestamp > 150) {
                    setHitMarker({ ...hitMarker, active: false });
                }
                if (killConfirm.active && now - killConfirm.timestamp > 2000) {
                    setKillConfirm({ ...killConfirm, active: false });
                }
            }
        }, 30);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setShowRoster(true);
            }
            if (e.key.toLowerCase() === 'i') {
                const vehicle = engineRef.current?.playerVehicle as any;
                if (vehicle && vehicle.isFlipped && !vehicle.isDead) {
                    vehicle.applyDamage(9999);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Tab') setShowRoster(false); };

        const handleSpawnDamage = (e: any) => {
            const dn = {
                id: Math.random().toString(36).substr(2, 9),
                worldX: e.detail.x,
                worldY: e.detail.y,
                worldZ: e.detail.z,
                screenX: -100, // offscreen initially
                screenY: -100,
                damage: e.detail.damage,
                isCrit: e.detail.isCrit,
                createdAt: performance.now()
            };
            damageNumbersRef.current = [...damageNumbersRef.current, dn];
        };

        const handleSpawnStatus = (e: any) => {
            const st = {
                id: Math.random().toString(36).substr(2, 9),
                worldX: e.detail.x,
                worldY: e.detail.y,
                worldZ: e.detail.z,
                screenX: -100, // offscreen initially
                screenY: -100,
                text: e.detail.text,
                color: e.detail.color,
                createdAt: performance.now()
            };
            statusTextsRef.current = [...statusTextsRef.current, st];
        };

        const handleHitMarker = (e: any) => {
            const now = performance.now();
            setHitMarker({ active: true, isKill: e.detail.isKill, timestamp: now });
            if (e.detail.isKill) {
                setKillConfirm({ active: true, timestamp: now });
            }
        };

        let lastKillEvent = { victim: "", time: 0 };
        const handleKillFeed = (e: any) => {
            const killer = e.detail.killer;
            const victim = e.detail.victim;
            
            // Deduplicate: If same victim killed within 200ms, ignore it
            const now = performance.now();
            if (lastKillEvent.victim === victim && now - lastKillEvent.time < 200) return;
            lastKillEvent = { victim, time: now };
            
            setKillFeed(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                killer: killer,
                victim: victim,
                weapon: e.detail.weapon,
                killerTeam: e.detail.killerTeam,
                victimTeam: e.detail.victimTeam,
                time: performance.now()
            }]);

            if (killer === "YOU") {
                killStreakRef.current += 1;
                const newStreak = killStreakRef.current;
                
                let medalText = "";
                
                if (newStreak === 1) { medalText = "FIRST BLOOD"; }
                else if (newStreak === 3) { medalText = "KILLING SPREE"; }
                else if (newStreak === 5) { medalText = "DOMINATING"; }
                else if (newStreak === 10) { medalText = "UNSTOPPABLE"; }
                else if (newStreak > 1) { medalText = "DOUBLE KILL"; }

                if (medalText) {
                    setMedals(m => [...m.filter(item => now - item.time < 3000), { id: Math.random().toString(36).substring(2), text: medalText, time: performance.now() }]);
                }
            } else if (victim === "YOU") {
                killStreakRef.current = 0;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('spawn-damage', handleSpawnDamage);
        window.addEventListener('spawn-status-text', handleSpawnStatus);
        window.addEventListener('hit-marker', handleHitMarker);
        window.addEventListener('kill-feed', handleKillFeed);

        return () => {
            clearInterval(interval);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('spawn-damage', handleSpawnDamage);
            window.removeEventListener('spawn-status-text', handleSpawnStatus);
            window.removeEventListener('hit-marker', handleHitMarker);
            window.removeEventListener('kill-feed', handleKillFeed);
        };
    }, [engineRef, hitMarker, killConfirm]);



    const handleSelfDestruct = () => {
        const vehicle = engineRef.current?.playerVehicle as any;
        if (vehicle && vehicle.isFlipped && !vehicle.isDead) {
            vehicle.applyDamage(9999);
        }
    };

    return (
        <div className={`combat-hud absolute inset-0 pointer-events-none z-50 font-sans ${isEmped ? 'hud-glitch' : ''}`}>
            
            <style>{`
                .hud-glitch {
                    animation: glitch-anim 0.2s linear infinite;
                    filter: url(#glitch-filter) contrast(150%) hue-rotate(90deg);
                }
                @keyframes glitch-anim {
                    0% { transform: translate(0) skew(0deg); opacity: 1; }
                    20% { transform: translate(-5px, 5px) skew(5deg); opacity: 0.8; }
                    40% { transform: translate(5px, -5px) skew(-5deg); opacity: 1; }
                    60% { transform: translate(-2px, 2px) skew(2deg); opacity: 0.7; }
                    80% { transform: translate(2px, -2px) skew(-2deg); opacity: 1; }
                    100% { transform: translate(0) skew(0deg); opacity: 1; }
                }
                @keyframes hit-marker-pop {
                    0% { transform: scale(1.5); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
                @keyframes kill-feed-slide {
                    from { transform: translateX(30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pop-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
            
            <svg style={{ display: 'none' }}>
                <defs>
                    <filter id="glitch-filter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.5" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            {mode === 'deathmatch' && (matchState === 'playing' || matchState === 'ended') && (
                <MatchStrip scores={scores} seconds={matchTimer} limit={scoreLimit} team={localTeam} ended={matchState === 'ended'} />
            )}

            {mode === 'deathmatch' && matchState === 'ended' && winner && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md" role="status" aria-live="assertive">
                    <div className="relative flex flex-col items-center px-14 py-10 bg-[#0a0b0f] border border-white/25 shadow-[0_32px_100px_rgba(0,0,0,0.9)] max-w-lg w-full mx-4">
                        {/* Tactical Corner Brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

                        <Trophy size={40} className="mb-4 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                        <p className="text-[10px] tracking-[0.3em] text-white/50 mb-2 font-mono uppercase">
                            MATCH RESULTS
                        </p>
                        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase font-sans">
                            {winner === 'draw' ? 'DRAW' : winner === localTeam ? 'VICTORY' : 'DEFEAT'}
                        </h1>
                        <p className="text-xs font-mono tracking-widest text-white/60 uppercase mt-2">
                            {winner === 'draw' ? 'DRAW' : winner === localTeam ? 'MATCH WON' : 'MATCH LOST'}
                        </p>
                        
                        <div className="flex items-center justify-center gap-6 mt-8 w-full bg-white/5 py-3.5 px-6 border border-white/10 font-mono text-sm">
                            <span className="text-white font-bold tracking-wider">TEAM 1: {String(scores.alpha).padStart(2, '0')}</span>
                            <span className="text-white/25">|</span>
                            <span className="text-white font-bold tracking-wider">{String(scores.bravo).padStart(2, '0')} :TEAM 2</span>
                        </div>
                    </div>
                </div>
            )}

            {showRoster && roster.length > 0 && matchState !== 'ended' && (
                <div className="absolute inset-0 z-[105] flex items-center justify-center bg-black/75 backdrop-blur-sm" role="dialog" aria-label="Team roster">
                    <div className="w-[min(760px,calc(100%-32px))] grid grid-cols-2 gap-6 bg-[#0a0b0f] p-6 border border-white/20 shadow-2xl relative font-mono">
                        {(['alpha', 'bravo'] as const).map(teamId => (
                            <section key={teamId} aria-labelledby={`roster-${teamId}`}>
                                <h2 id={`roster-${teamId}`} className="text-white text-xs font-black tracking-[0.2em] mb-3 pb-2 border-b border-white/10 uppercase">
                                    {teamId === 'alpha' ? 'TEAM 1' : 'TEAM 2'}
                                </h2>
                                <div className="space-y-1.5">
                                    {roster.filter(member => member.teamId === teamId).sort((a, b) => a.slot - b.slot).map(member => (
                                        <div key={member.entityId} className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/5 text-xs">
                                            <span className="text-white font-bold truncate">{member.displayName}</span>
                                            <span className="ml-auto text-white/40 font-mono text-[10px] tracking-wider">
                                                {member.kind === 'human' ? 'PLAYER' : 'BOT'} · {member.connected ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                        <p className="col-span-2 text-center text-[10px] text-white/40 tracking-wider pt-2 border-t border-white/5 uppercase">
                            HOLD [TAB] SCOREBOARD
                        </p>
                    </div>
                </div>
            )}

            {/* ── Cinematic Intro Overlay ── */}
            {(matchState === 'intro' || matchState === 'countdown') && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/20">
                    {matchState === 'intro' && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-mono tracking-[0.3em] text-white/60 uppercase">GET READY</span>
                            <h1 className="text-white font-black text-5xl sm:text-7xl tracking-[0.2em] uppercase font-sans drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                                PREPARE FOR BATTLE
                            </h1>
                        </div>
                    )}
                    {matchState === 'countdown' && (
                        <h1 className="text-white font-black text-9xl tracking-widest drop-shadow-[0_0_60px_rgba(255,255,255,0.9)] font-mono animate-pulse">
                            {Math.ceil(3 - (introTimer / 1000))}
                        </h1>
                    )}
                </div>
            )}

            {mode !== 'spectator' && <VehicleSystems vehicleId={vehicleId} health={health} charge={abilityCooldownPct} cooldownSeconds={cooldownSeconds}
                unavailable={health <= 0 || isEmped || isStunned || matchState !== 'playing'} ammo={ammoData}
                onActivate={() => { if (engineRef.current) engineRef.current.inputManager.joystickAbility = true; }} />}

            {/* ── Immersive Tactical Radar & Speed (Bottom-Right) ── */}
            <div className="combat-radar absolute bottom-6 right-6 pointer-events-none flex items-end gap-5">
                {/* Minimalist Tactical Speedometer */}
                <div className="flex flex-col items-end pb-2 font-mono">
                    <span className="text-white/40 text-[9px] tracking-[0.25em] uppercase mb-1">SPEED</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-white text-5xl font-black tracking-tighter tabular-nums leading-none">
                            {speed}
                        </span>
                        <span className="text-white/50 text-[10px] tracking-widest font-bold">KM/H</span>
                    </div>
                </div>

                {/* Precision Tactical Radar */}
                <div className="w-32 h-32 border border-white/25 bg-[#08090d]/90 backdrop-blur-md relative overflow-hidden flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
                    {/* Cardinal ticks */}
                    <span className="absolute top-1 text-[8px] font-mono text-white/40">N</span>
                    <span className="absolute bottom-1 text-[8px] font-mono text-white/40">S</span>
                    <span className="absolute left-1 text-[8px] font-mono text-white/40">W</span>
                    <span className="absolute right-1 text-[8px] font-mono text-white/40">E</span>

                    {/* Concentric rings */}
                    <div className="absolute inset-0 border border-white/10 rounded-full m-5 pointer-events-none" />
                    <div className="absolute inset-0 border border-white/10 rounded-full m-10 pointer-events-none" />
                    <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
                    <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />
                    
                    {/* Sweep radar beam */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_75%,rgba(255,255,255,0.25)_100%)] rounded-full animate-[spin_3s_linear_infinite] pointer-events-none" />
                    
                    {/* Player Center Pin */}
                    <div className="absolute w-2 h-2 bg-white shadow-[0_0_8px_#ffffff] z-10 pointer-events-none" />
                    
                    {radarData.contacts.map(contact => {
                        const dx = contact.x - radarData.px, dz = contact.z - radarData.pz;
                        const rotX = dx * Math.cos(-radarData.yaw) - dz * Math.sin(-radarData.yaw);
                        const rotZ = dx * Math.sin(-radarData.yaw) + dz * Math.cos(-radarData.yaw);
                        const scale = 64 / 80;
                        let screenX = rotX * scale, screenY = -rotZ * scale;
                        const distFromCenter = Math.sqrt(screenX * screenX + screenY * screenY);
                        if (distFromCenter > 56) {
                            screenX = (screenX / distFromCenter) * 56;
                            screenY = (screenY / distFromCenter) * 56;
                        }
                        return (
                            <div key={contact.id} className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${64 + screenX}px`, top: `${64 + screenY}px` }}>
                                <div className={`w-2 h-2 ${contact.isAlly ? 'bg-white rounded-none border border-black shadow-[0_0_6px_#fff]' : 'bg-white rotate-45 border border-black shadow-[0_0_6px_#fff]'}`} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <TargetTracking engineRef={engineRef} />
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <svg width="40" height="40" viewBox="-20 -20 40 40" className="text-white drop-shadow-md">
                    <circle r={isLocked ? 2 : 1.5} fill="currentColor" opacity="0.8" />
                    {hitMarker.active && <path d="M-10 -10 -5 -5 M10 -10 5 -5 M-10 10 -5 5 M10 10 5 5" stroke="currentColor" strokeWidth={hitMarker.isKill ? 3 : 2} />}
                </svg>
            </div>
            <CombatAccolades medals={medals} now={frameTime} confirmed={killConfirm.active} confirmationId={killConfirm.timestamp} />

            {/* ── Kill Feed (Top-Right) ── */}
            <div className="combat-kill-feed pointer-events-none z-50">
                {killFeed.map((kf) => {
                    const age = frameTime - kf.time;
                    if (age > 4000) return null;
                    const opacity = 1 - Math.max(0, (age - 3500) / 500);
                    return (
                        <div 
                            key={kf.id} 
                            className="flex items-center bg-[#090a0e]/95 border border-white/15 px-3 py-1.5 shadow-lg font-mono text-[10px]" 
                            style={{ opacity, animation: `kill-feed-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
                        >
                            <span className="font-bold text-white uppercase mr-2 tracking-wider">
                                {kf.killer}
                            </span>
                            
                            <div className="flex items-center justify-center px-1 text-white/50">
                                <Crosshair size={11} />
                            </div>
                            
                            <span className="font-bold text-white/60 uppercase ml-2 mr-3 tracking-wider">
                                {kf.victim}
                            </span>
                            
                            <div className="border-l border-white/15 pl-2 flex items-center">
                                <Skull size={11} className="text-white" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Flipped Warning ── */}
            {isFlipped && (
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 pointer-events-auto z-[70] font-sans">
                    <div className="relative flex flex-col items-center justify-center p-8 bg-[#090a0e]/95 border border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.2)] rounded-lg">
                        <span className="font-black text-3xl sm:text-4xl tracking-wider uppercase text-white">
                            CAR FLIPPED
                        </span>
                        <span className="text-white/60 text-xs tracking-wider uppercase font-medium mt-2">
                            Press [I] to Reset Car
                        </span>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={handleSelfDestruct} 
                        className="group relative px-8 py-3.5 bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all active:scale-[0.98] rounded cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <kbd className="font-mono bg-black text-white px-2 py-0.5 text-xs font-bold rounded">I</kbd>
                            <span>RESET CAR</span>
                        </div>
                    </button>
                </div>
            )}

            {/* ── Status Effects (EMP / STUN / BLASTED) ── */}
            {(isEmped || isStunned || isBlasted) && !isFlipped && (
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 pointer-events-none z-[60] font-sans">
                    <div className="relative flex flex-col items-center justify-center px-8 py-4 bg-[#090a0e]/95 border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)] rounded">
                        <span className="font-black text-xl sm:text-2xl tracking-wider uppercase text-white">
                            {isStunned ? "STUNNED" : isBlasted ? "BLASTED" : "EMP DISABLED"}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Floating Status Effects ── */}
            {statusTexts.map((st) => {
                if (st.screenX === -100) return null;
                const age = frameTime - st.createdAt;
                const opacity = 1 - Math.max(0, (age - 1500) / 500);

                return (
                    <div
                        key={st.id}
                        className="absolute pointer-events-none transition-all duration-75 z-50"
                        style={{
                            left: `${st.screenX}px`,
                            top: `${st.screenY}px`,
                            transform: `translate(-50%, calc(-50% - ${(1 - opacity) * 30}px))`,
                            opacity: opacity,
                        }}
                    >
                        <VehicleStatusEffect status={st.text} />
                    </div>
                );
            })}

            {/* ── Relationship markers ── */}
            {nameplates.map((np) => (
                <div
                    key={np.id}
                    className="absolute flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${np.screenX}px`, top: `${np.screenY}px` }}
                >
                    <VehicleRelationship ally={np.isAlly} name={np.name} />
                    <div className="w-10 h-1 bg-black/60 rounded-sm border border-white/10 overflow-hidden relative">
                        <div 
                            className={`absolute top-0 left-0 h-full ${np.isAlly ? 'bg-cyan-400' : 'bg-orange-400'} rounded-sm transition-all duration-200`}
                            style={{ width: `${Math.max(0, np.healthPct)}%` }}
                        />
                    </div>
                </div>
            ))}

            {/* ── Floating Damage Numbers ── */}
            {damageNumbers.map((dn) => {
                if (dn.screenX === -100) return null;
                const age = frameTime - dn.createdAt;
                const opacity = 1 - Math.max(0, (age - 800) / 700);

                return (
                    <div
                        key={dn.id}
                        className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 select-none"
                        style={{ left: dn.screenX, top: dn.screenY, opacity: opacity, transition: 'opacity 0.05s' }}
                    >
                        <span className={`font-black tracking-widest italic drop-shadow-lg ${dn.isCrit ? 'text-yellow-400 text-3xl' : 'text-white text-xl'}`}>
                            {Math.round(dn.damage)}
                        </span>
                    </div>
                );
            })}

            {/* ── Minimal Vignette ── */}
            <div
                className="absolute inset-0 pointer-events-none z-[-1]"
                style={{ background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%)' }}
            />

            {/* Mobile Controls (Visible only on small screens) */}
            <MobileControls engineRef={engineRef} />
        </div>
    );
};
