import { Color3, Mesh, ShaderMaterial } from '@babylonjs/core';

/** Animated surface-space filaments and travelling waves; vertex displacement stays on the GPU. */
export function electricSurface(mesh: Mesh, kind: 'shield' | 'emp'): { material: ShaderMaterial; update: (seconds: number) => void } {
    const material = new ShaderMaterial(`${kind}-electric-surface`, mesh.getScene(), {
        vertexSource: `precision highp float;
            attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
            uniform mat4 worldViewProjection; uniform float time; uniform float ripple;
            varying vec2 vUV; varying float vRim;
            void main() {
                vUV = uv;
                float flow = sin(position.y * 2.3 + time * 2.1) * sin(position.x * 1.7 - position.z * 1.8 + time);
                vec3 displaced = position + normal * flow * ripple;
                vRim = .45 + .55 * abs(normal.y);
                gl_Position = worldViewProjection * vec4(displaced, 1.0);
            }`,
        fragmentSource: `precision highp float;
            varying vec2 vUV; varying float vRim;
            uniform float time; uniform float opacity; uniform float style; uniform vec3 tint;
            void main() {
                float angle = vUV.x * 6.2831853;
                float bend = sin(angle * 7.0 + time * 1.8) * .13 + sin(angle * 19.0 - time * 3.0) * .045;
                float bands = abs(sin((vUV.y + bend) * (22.0 + style * 16.0) - time * (2.0 + style * 3.0)));
                float bolt = pow(1.0 - bands, 26.0);
                float branches = pow(1.0 - abs(sin(angle * 11.0 + sin(vUV.y * 60.0 + time * 2.0) * 1.5)), 34.0);
                float wave = pow(.5 + .5 * sin(vUV.y * 55.0 - time * 7.0), 12.0);
                float energy = bolt + branches * .6 + wave * (.15 + style * .3);
                gl_FragColor = vec4(tint * (.35 + energy * 1.6), (.035 + energy * .65) * vRim * opacity);
            }`,
    }, { attributes: ['position', 'normal', 'uv'], uniforms: ['worldViewProjection', 'time', 'opacity', 'ripple', 'style', 'tint'], needAlphaBlending: true });
    material.backFaceCulling = false;
    material.disableDepthWrite = true;
    material.setFloat('style', kind === 'emp' ? 1 : 0);
    material.setFloat('ripple', kind === 'emp' ? .025 : .22);
    material.setColor3('tint', kind === 'emp' ? new Color3(.22, .65, 1) : new Color3(.65, .92, 1));
    material.setFloat('time', 0);
    material.setFloat('opacity', 1);
    mesh.material = material; mesh.isPickable = false; mesh.checkCollisions = false;
    return { material, update: seconds => { material.setFloat('time', seconds); if (kind === 'emp') material.setFloat('opacity', Math.max(0, 1 - seconds / .5)); } };
}
