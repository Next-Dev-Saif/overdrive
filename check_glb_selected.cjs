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
        console.log(`\n=== ${name} (${path}) ===`);
        console.log("Nodes:", nodes);
    } catch (e) {
        console.log("Error reading", path, e.message);
    }
}

const files = [
    'Phantom (Hatchback)', './src/assets/models/vehicles/Hatchback.glb',
    'Manticore (Police_SUV)', './src/assets/models/vehicles/Police_SUV.glb',
    'Valkyrie (Muscle_2)', './src/assets/models/vehicles/Muscle_2.glb',
    'Wraith (Sedan)', './src/assets/models/vehicles/Sedan.glb',
    'Behemoth (Firetruck)', './src/assets/models/vehicles/Firetruck.glb'
];

for (let i = 0; i < files.length; i += 2) {
    readGlb(files[i+1], files[i]);
}
