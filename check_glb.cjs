const fs = require('fs');

function readGlb(path, name) {
    try {
        const buffer = fs.readFileSync(path);
        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x46546C67) return; // 'glTF'
        const jsonLen = buffer.readUInt32LE(12);
        const jsonString = buffer.toString('utf8', 20, 20 + jsonLen);
        const gltf = JSON.parse(jsonString);
        const nodes = gltf.nodes ? gltf.nodes.map(n => n.name).filter(Boolean) : [];
        const bodyNodes = nodes.filter(n => n.toLowerCase().includes('body'));
        console.log(`\n=== ${name} (${path}) ===`);
        console.log("Body Nodes:", bodyNodes);
    } catch (e) {
        console.log("Error reading", path, e.message);
    }
}

const files = [
    'Phantom', './src/assets/models/vehicles/Sports.glb',
    'Manticore', './src/assets/models/vehicles/SUV.glb',
    'Valkyrie', './src/assets/models/vehicles/Muscle.glb',
    'Wraith', './src/assets/models/vehicles/Roadster.glb',
    'Behemoth', './src/assets/models/vehicles/Truck.glb',
    'BehemothAlt', './src/assets/models/vehicles/Monster_Truck.glb',
    'ManticoreAlt', './src/assets/models/vehicles/Muscle_2.glb'
];

for (let i = 0; i < files.length; i += 2) {
    readGlb(files[i+1], files[i]);
}
