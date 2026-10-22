/** Rebuild the five licensed replacements from their preserved Blender sources. */
import { spawnSync } from 'node:child_process';
const blender = process.env.BLENDER_BIN ?? (process.platform === 'darwin' ? '/Applications/Blender.app/Contents/MacOS/Blender' : 'blender');
const result = spawnSync(blender, ['--background', '--threads', '2', '--python-exit-code', '1', '--python', 'scripts/prepare-distinct-vehicles.py'], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Blender preparation failed (${result.status ?? result.signal}).`);
await import('./optimize-distinct-vehicles.mjs');
