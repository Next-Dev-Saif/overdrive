const fs = require('fs');
const path = require('path');

const dir = './src/assets/models/vehicles/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'));

for (const file of files) {
    const filepath = path.join(dir, file);
    try {
        const buffer = fs.readFileSync(filepath);
        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x46546C67) continue;
        const jsonLen = buffer.readUInt32LE(12);
        const jsonString = buffer.toString('utf8', 20, 20 + jsonLen);
        const gltf = JSON.parse(jsonString);
        const nodes = gltf.nodes ? gltf.nodes.map(n => n.name).filter(Boolean) : [];
        if (nodes.some(n => n.toLowerCase().includes('wheel'))) {
            console.log(`\n=== ${file} HAS WHEELS ===`);
            console.log("Nodes:", nodes.filter(n => n.includes('body') || n.includes('wheel')));
        }
    } catch (e) {
        // ignore
    }
}
