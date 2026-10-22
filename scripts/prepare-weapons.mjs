/** Rebuild all five downloaded mounted-weapon derivatives from preserved Blender sources. */
import { spawnSync } from 'node:child_process';
const blender = process.env.BLENDER_BIN ?? (process.platform === 'darwin' ? '/Applications/Blender.app/Contents/MacOS/Blender' : 'blender');
const result = spawnSync(blender, ['--background', '--threads', '2', '--python-exit-code', '1', '--python', 'scripts/prepare-weapons.py'], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Weapon preparation failed (${result.status ?? result.signal}).`);
