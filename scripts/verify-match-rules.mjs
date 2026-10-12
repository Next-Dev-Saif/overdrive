import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const out = resolve('node_modules/.cache/overdrive-match-check');
await mkdir(out, { recursive: true });
const source = await readFile('shared/match.ts', 'utf8');
await writeFile(`${out}/match.js`, ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText);
const match = await import(pathToFileURL(`${out}/match.js`));
{
    const source = await readFile('src/game/match/CombatRules.ts', 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText.replace("../../../shared/match", './match.js');
    await writeFile(`${out}/CombatRules.js`, code);
}
const combat = await import(pathToFileURL(`${out}/CombatRules.js`));

const teams = Array.from({ length: 10 }, (_, index) => match.teamForHumanIndex(index));
assert.equal(teams.filter(team => team === 'alpha').length, 5);
assert.equal(teams.filter(team => team === 'bravo').length, 5);
assert.equal(match.areOpponents('alpha', 'bravo'), true);
assert.equal(match.areOpponents('alpha', 'alpha'), false);
assert.equal(combat.isAuthoritativeBotSource({ entityId: 'match_123:bot:bravo:4', kind: 'bot' }, true, false), true);
assert.equal(combat.isAuthoritativeBotSource({ entityId: 'match_123:bot:bravo:4', kind: 'bot' }, false, false), false, 'remote bot replicas are visual-only');
assert.equal(combat.isAuthoritativeBotSource({ entityId: 'socket-human', kind: 'human' }, true, false), false);

for (const team of match.TEAM_IDS) {
    const spawns = Array.from({ length: 5 }, (_, slot) => match.getTeamSpawn(team, slot, 12));
    assert.equal(new Set(spawns.map(spawn => `${spawn.x}:${spawn.z}`)).size, 5);
    assert.ok(spawns.every(spawn => spawn.y === 12));
}

const now = 10_000;
const snapshot = { startsAt: now + 7000, endsAt: now + 307_000, winner: null };
assert.equal(match.resolveMatchPhase(snapshot, now), 'intro');
assert.equal(match.resolveMatchPhase(snapshot, now + 4500), 'countdown');
assert.equal(match.resolveMatchPhase(snapshot, now + 7000), 'playing');
assert.equal(match.resolveMatchPhase(snapshot, now + 307_000), 'ended');

console.log('PASS: 5v5 balancing, opponent policy, team spawns, and match phases.');
