/** Headless interaction/markup checks for setup. The WebGL preview is stubbed, not browser-tested. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import ts from 'typescript';
const out = resolve('node_modules/.cache/overdrive-setup-check');
const compiled = new Set();
async function compile(file) {
    if (compiled.has(file)) return;
    compiled.add(file);
    let source = file.endsWith('/GarageRenderer.tsx') ? 'export function GarageRenderer() { return <div data-preview="stub" />; }' : await readFile(file, 'utf8');
    source = source.replace(/import ['"][^'"]+\.css['"];?/g, '');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    for (const match of code.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
        let dependency = resolve(dirname(file), match[1] + '.ts');
        try { await access(dependency); } catch { dependency += 'x'; }
        await compile(dependency);
    }
    code = code.replace(/from (['"])(\.[^'"]+)\1/g, 'from $1$2.js$1');
    const target = resolve(out, file.replace(process.cwd() + '/', '').replace(/\.tsx?$/, '.js'));
    await mkdir(dirname(target), { recursive: true }); await writeFile(target, code);
}
await compile(resolve('src/components/page-sections/setup/MatchSetupScreen.tsx'));
const load = path => import(pathToFileURL(resolve(out, path)));
const { MatchSetupScreen } = await load('src/components/page-sections/setup/MatchSetupScreen.js');
const { EquipmentPicker } = await load('src/components/page-sections/setup/EquipmentPicker.js');
const { DEFAULT_SETUP, validateSetup, setupDestination } = await load('src/components/page-sections/setup/setupState.js');
assert.deepEqual(validateSetup(null), DEFAULT_SETUP);
assert.deepEqual(validateSetup({ mode: 'bad', map: 'deleted', vehicle: 'missing', weapon: 'missing', color: 'bad' }), DEFAULT_SETUP);
let setup = { ...DEFAULT_SETUP }, starts = 0;
const props = () => ({ setup, onChange: next => { setup = next; }, username: 'Driver', onStart: () => { starts++; }, onSettings() {}, onLogout() {} });
function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
}
let screen = nodes(MatchSetupScreen(props()));
const mapCards = screen.filter(node => node.type === 'button' && node.props.className === 'setup-map');
assert.equal(mapCards.length, 4);
mapCards[2].props.onClick();
assert.equal(setup.map, 'glacial'); assert.equal(starts, 0, 'selecting a map never queues');
let equipment = nodes(EquipmentPicker({ setup, onChange: props().onChange }));
const textOf = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join('') : node?.props ? textOf(node.props.children) : '';
equipment.find(node => node.type === 'button' && textOf(node).includes('Wraith')).props.onClick();
equipment = nodes(EquipmentPicker({ setup, onChange: props().onChange }));
equipment.find(node => node.type === 'button' && textOf(node).includes('Tactical Nuke')).props.onClick();
assert.equal(setup.vehicle, 'wraith'); assert.equal(setup.weapon, 'nuke'); assert.equal(starts, 0);
let html = renderToStaticMarkup(createElement(MatchSetupScreen, props()));
assert.match(html, /Wraith · Tactical Nuke/); assert.match(html, /Glacial Outpost/);
screen = nodes(MatchSetupScreen(props()));
screen.find(node => node.props?.className === 'setup-start').props.onClick(); assert.equal(starts, 1);
const saved = JSON.stringify(setup); assert.deepEqual(validateSetup(JSON.parse(saved)), setup);
screen.find(node => node.type === 'input' && node.props.value === 'deathrace').props.onChange();
assert.equal(setupDestination(setup.mode), 'race');
html = renderToStaticMarkup(createElement(MatchSetupScreen, props()));
assert.match(html, /Start unarmed/); assert.match(html, /Blacktop Circuit/); assert.doesNotMatch(html, /<select/);
assert.equal(setup.vehicle, 'wraith'); assert.equal(setup.weapon, 'nuke', 'race preserves arena equipment');
assert.equal(setupDestination('freeroam'), 'game'); assert.equal(setupDestination('deathmatch'), 'queue');
for (const id of ['wasteland','facility','glacial','neon','blacktop']) await access(`public/assets/maps/${id}.jpg`);
assert.doesNotMatch(html, /Watch Game|Leaderboard|Private lobby|Equip loadout/);
const luminance = hex => { const rgb = hex.match(/\w\w/g).map(value => parseInt(value,16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4); return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
assert.ok((luminance('b8b8b8')+.05)/(luminance('303030')+.05) > 4.5, 'muted text meets AA on the lightest menu surface');
console.log('PASS: map selection without launch, immediate loadout updates, explicit start, saved preference validation, race restrictions/loadout preservation, map assets, accessible controls and text contrast.');
