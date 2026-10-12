import { SERVER_URL } from '../config';
import { io, Socket } from "socket.io-client";
import type { MatchSnapshot, SpawnTransform, TeamId } from "../../shared/match";

export interface RemotePlayerState {
    id: string;
    displayName: string;
    teamId?: TeamId;
    vehicleId: string;
    weaponId: string;
    vehicleColor?: string;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number, w: number };
    health?: number;
    maxHealth?: number;
}

export class NetworkManager {
    private socket: Socket;
    private hitSequence = 0;
    public onPlayerJoined: (player: RemotePlayerState) => void = () => {};
    public onPlayerMoved: (player: RemotePlayerState) => void = () => {};
    public onPlayerDisconnected: (playerId: string) => void = () => {};
    public onPlayerShoot: (playerId: string, origin: { x: number, y: number, z: number }, hitPoint: { x: number, y: number, z: number }, targetId?: string) => void = () => {};
    public onHealthUpdated: (playerId: string, health: number) => void = () => {};
    public onPlayerDestroyed: (playerId: string) => void = () => {};
    public onAbilityUsed: (playerId: string, abilityName: string) => void = () => {};
    public onProgressionUpdate: (data: { stats: any, wallet: any, message: string }) => void = () => {};
    public onBotState: (botId: string, vehicleId: string, weaponId: string, position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number, w: number }, health?: number) => void = () => {};
    public onBotShoot: (botId: string, origin: { x: number, y: number, z: number }, hitPoint: { x: number, y: number, z: number }, targetId?: string) => void = () => {};
    public onMatchSnapshot: (snapshot: MatchSnapshot) => void = () => {};
    public onCombatantDestroyed: (data: { attackerId: string, targetId: string, weaponId: string, scores: Record<TeamId, number> }) => void = () => {};
    public onCombatantRespawned: (data: { entityId: string, health: number, spawn: SpawnTransform, invulnerableUntil: number }) => void = () => {};
    public onMatchEnded: (snapshot: MatchSnapshot) => void = () => {};

    public get id(): string {
        return this.socket.id || "player";
    }

    constructor(mapId: string, vehicleId: string, weaponId: string, vehicleColor?: string, existingSocket?: Socket, roomId?: string, matchId?: string) {
        if (existingSocket) {
            this.socket = existingSocket;
            if (this.socket.connected) {
                this.socket.emit("join", { mapId, vehicleId, weaponId, vehicleColor, roomId, matchId });
            } else {
                this.socket.on("connect", () => {
                    this.socket.emit("join", { mapId, vehicleId, weaponId, vehicleColor, roomId, matchId });
                });
            }
        } else {
            const token = localStorage.getItem('overdrive_token');
            this.socket = io(SERVER_URL, {
                auth: { token }
            });
            this.socket.on("connect", () => {
                console.log("Connected to MMO Server:", this.socket.id);
                this.socket.emit("join", { mapId, vehicleId, weaponId, vehicleColor });
            });
        }

        this.socket.on("currentPlayers", (players: Record<string, RemotePlayerState>) => {
            for (const id in players) {
                if (id !== this.socket.id) {
                    this.onPlayerJoined(players[id]);
                }
            }
        });

        this.socket.on("playerJoined", (player: RemotePlayerState) => {
            this.onPlayerJoined(player);
        });

        this.socket.on("playerMoved", (player: RemotePlayerState) => {
            this.onPlayerMoved(player);
        });

        this.socket.on("playerDisconnected", (playerId: string) => {
            this.onPlayerDisconnected(playerId);
        });

        this.socket.on("playerShoot", (data: { playerId: string, origin: any, hitPoint: any, targetId?: string }) => {
            if (data.playerId !== this.socket.id) {
                this.onPlayerShoot(data.playerId, data.origin, data.hitPoint, data.targetId);
            }
        });

        this.socket.on("healthUpdate", (data: { playerId: string, health: number }) => {
            this.onHealthUpdated(data.playerId, data.health);
        });

        this.socket.on("playerDestroyed", (playerId: string) => {
            this.onPlayerDestroyed(playerId);
        });

        this.socket.on("abilityUsed", (data: { playerId: string, abilityName: string }) => {
            if (data.playerId !== this.socket.id) {
                this.onAbilityUsed(data.playerId, data.abilityName);
            }
        });

        this.socket.on("progressionUpdate", (data: { stats: any, wallet: any, message: string }) => {
            this.onProgressionUpdate(data);
            window.dispatchEvent(new CustomEvent('progression-update', { detail: data }));
        });

        this.socket.on("botState", (data: any) => {
            this.onBotState(data.botId, data.vehicleId, data.weaponId, data.position, data.rotation, data.health);
        });

        this.socket.on("botShoot", (data: any) => {
            this.onBotShoot(data.botId, data.origin, data.hitPoint, data.targetId);
        });

        this.socket.on("matchSnapshot", (snapshot: MatchSnapshot) => this.onMatchSnapshot(snapshot));
        this.socket.on("combatantDestroyed", (data) => this.onCombatantDestroyed(data));
        this.socket.on("combatantRespawned", (data) => this.onCombatantRespawned(data));
        this.socket.on("matchEnded", (snapshot: MatchSnapshot) => this.onMatchEnded(snapshot));
    }

    public broadcastShoot(origin: { x: number, y: number, z: number }, hitPoint: { x: number, y: number, z: number }, targetId?: string) {
        if (!this.socket.connected) return;
        this.socket.emit("shoot", { origin, hitPoint, targetId });
    }

    public sendHit(targetId: string, damage: number, attackerId?: string, weaponId?: string) {
        if (!this.socket.connected) return;
        this.socket.emit("hit", { targetId, damage, attackerId, weaponId, sequence: ++this.hitSequence });
    }

    public requestRespawn() {
        if (!this.socket.connected) return;
        this.socket.emit("requestRespawn");
    }

    public broadcastState(position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number, w: number }) {
        if (!this.socket.connected) return;
        this.socket.emit("updateState", { position, rotation });
    }

    public broadcastBotState(botId: string, vehicleId: string, weaponId: string, position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number, w: number }, health?: number) {
        if (!this.socket.connected) return;
        this.socket.emit("botState", { botId, vehicleId, weaponId, position, rotation, health });
    }

    public broadcastBotShoot(botId: string, origin: { x: number, y: number, z: number }, hitPoint: { x: number, y: number, z: number }, targetId?: string) {
        if (!this.socket.connected) return;
        this.socket.emit("botShoot", { botId, origin, hitPoint, targetId });
    }

    public broadcastAbilityUsed(abilityName: string, actorId?: string) {
        if (!this.socket.connected) return;
        this.socket.emit("abilityUsed", { abilityName, actorId });
    }

    public dispose() {
        this.socket.disconnect();
    }
}
