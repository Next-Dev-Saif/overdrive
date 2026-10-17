/** Curated clips from new-assets/audio; only this subset is shipped and decoded. */
export const AUDIO_ASSETS = {
    gunshot: 'rebgun.ogg', plasma: 'laser.ogg', missile: 'rerocket2.ogg',
    mortar: 'rebangmortar.ogg', nuke: 'launch_nook.ogg',
    explosion: 'rebangrcrocket.ogg', nukeExplosion: 'bang_nook.ogg', death: 'death_explosion.ogg',
    engine: 'v8deep.ogg', pickup: 'repickup.ogg',
    lightning: 'schterminator.ogg', shockwave: 'sonic_shot.ogg', phantom: 'stealth.ogg',
    manticore: 'airblast.ogg', valkyrie: 'speed_boost.ogg', wraith: 'singularity.ogg',
    behemoth: 'superchargedpowerup.ogg',
} as const;
export type AudioCue = keyof typeof AUDIO_ASSETS;
export const AUDIO_ASSET_ROOT = '/assets/audio/imported/';
