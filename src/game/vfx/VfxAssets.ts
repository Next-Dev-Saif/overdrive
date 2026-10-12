/** Runtime metadata for the deliberately small, locally hosted VFX atlas set. */
export interface VfxSpriteSheetDefinition {
    readonly url: string;
    readonly columns: number;
    readonly rows: number;
    readonly frameCount: number;
    readonly textureWidth: number;
    readonly textureHeight: number;
}

export const VFX_SPRITE_SHEETS = {
    explosion: {
        url: '/assets/vfx/pyro/explosion-02hd-5x5.png',
        columns: 5,
        rows: 5,
        frameCount: 25,
        textureWidth: 1024,
        textureHeight: 1024,
    },
    explosionLight: {
        url: '/assets/vfx/pyro/explosion-light-5x5.png',
        columns: 5,
        rows: 5,
        frameCount: 25,
        textureWidth: 1024,
        textureHeight: 1024,
    },
    fireball: {
        url: '/assets/vfx/pyro/fireball-03-8x8.png',
        columns: 8,
        rows: 8,
        frameCount: 64,
        textureWidth: 1024,
        textureHeight: 1024,
    },
    discSmoke: {
        url: '/assets/vfx/pyro/disc-smoke-16x4.png',
        columns: 16,
        rows: 4,
        frameCount: 64,
        textureWidth: 1024,
        textureHeight: 512,
    },
} as const satisfies Record<string, VfxSpriteSheetDefinition>;

export type VfxSpriteSheetId = keyof typeof VFX_SPRITE_SHEETS;
