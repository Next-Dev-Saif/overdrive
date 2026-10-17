import { Color3, Mesh, MeshBuilder, RawTexture, Scene, StandardMaterial, Texture } from '@babylonjs/core';

type Palette = { zenith: number[]; horizon: number[]; far: number[]; near: number[] };
const palettes: Record<string, Palette> = {
    wasteland: { zenith: [66, 91, 110], horizon: [226, 175, 115], far: [159, 119, 87], near: [105, 76, 57] },
    glacial: { zenith: [32, 66, 103], horizon: [191, 218, 231], far: [121, 160, 185], near: [70, 106, 134] },
    neon: { zenith: [9, 15, 31], horizon: [65, 53, 89], far: [38, 42, 66], near: [20, 29, 43] },
    facility: { zenith: [48, 72, 90], horizon: [176, 187, 184], far: [102, 123, 131], near: [58, 76, 84] },
    race: { zenith: [47, 99, 141], horizon: [194, 212, 209], far: [100, 133, 135], near: [48, 82, 73] },
};

/** Seamless equirectangular illustration: layered dunes, ice peaks, city or refinery silhouettes. */
export function createSkyPixels(theme: string, width = 2048, height = 1024): Uint8Array {
    const palette = palettes[theme] ?? palettes.wasteland;
    const pixels = new Uint8Array(width * height * 4);
    const city = theme === 'neon', industrial = theme === 'facility', ice = theme === 'glacial';
    for (let x = 0; x < width; x++) {
        const u = x / (width - 1), angle = u * Math.PI * 2;
        const ridge = .51 - .035 * Math.sin(angle * 5) - .025 * Math.sin(angle * 11 + 1) - .015 * Math.cos(angle * 23);
        const nearRidge = .55 - .022 * Math.sin(angle * 7 + 2) - .012 * Math.cos(angle * 17);
        const block = Math.floor(u * 80) % 80, local = (u * 80) % 1;
        const roof = .49 - (.025 + .08 * (.5 + .5 * Math.sin(block * 7.13)));
        for (let y = 0; y < height; y++) {
            const v = y / (height - 1), blend = Math.min(1, v / .52);
            let color = palette.zenith.map((c, i) => c + (palette.horizon[i] - c) * blend);
            // Soft cloud ribbons fade before the poles and wrap continuously in longitude.
            const cloud = Math.pow(Math.max(0, Math.sin(angle * 3 + v * 21) * Math.cos(v * 39 + Math.sin(angle * 4))), 6) * Math.max(0, 1 - Math.abs(v - .34) / .19) * (city ? 9 : 22);
            color = color.map(c => c + cloud);
            if (v > ridge) color = ice && v < ridge + .018 ? [207, 225, 233] : palette.far;
            if (v > nearRidge) color = palette.near;
            if ((city || industrial) && local > .12 && local < .88 && v > roof && v < .58) {
                color = palette.near;
                if (city && local > .23 && local < .77 && y % 9 < 2 && v > roof + .008) color = block % 3 ? [98, 174, 189] : [192, 115, 167];
                if (industrial && local > .43 && local < .55 && v < roof + .008) color = [207, 150, 91];
            }
            // Narrow refinery stacks sit above the tanks without adding scene meshes.
            if (industrial && block % 3 === 0 && local > .65 && local < .74 && v > roof - .045 && v < .56) color = palette.near;
            if (v > .6) color = palette.near;
            const offset = (y * width + x) * 4;
            pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2]; pixels[offset + 3] = 255;
        }
    }
    // Identical seam columns, including discrete building details.
    for (let y = 0; y < height; y++) pixels.copyWithin((y * width + width - 1) * 4, y * width * 4, y * width * 4 + 4);
    return pixels;
}

/** One camera-centred sky dome replaces all non-playable outer landscape geometry. */
export function buildOuterLandscape(scene: Scene, theme: string, _radius: number): void {
    const sky = MeshBuilder.CreateSphere(`sky-${theme}`, { diameter: 1800, segments: 32, sideOrientation: Mesh.BACKSIDE }, scene);
    const texture = RawTexture.CreateRGBATexture(createSkyPixels(theme), 2048, 1024, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    texture.wrapU = Texture.WRAP_ADDRESSMODE; texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    const material = new StandardMaterial(`sky-${theme}-material`, scene);
    // StandardMaterial adds emissiveColor to emissiveTexture; white clips every texel to white.
    material.emissiveTexture = texture; material.emissiveColor = Color3.Black();
    material.diffuseColor = Color3.Black(); material.specularColor = Color3.Black();
    material.disableLighting = true; material.fogEnabled = false;
    sky.material = material; sky.infiniteDistance = true; sky.isPickable = false;
    sky.metadata = { presentationOnly: true, outerLandscape: true, skybox: true };
    // Scene disposal owns the material/texture; never freeze this camera-relative world matrix.
}
