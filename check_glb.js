const fs = require('fs');

function readGlb(path) {
    const buffer = fs.readFileSync(path);
    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46546C67) return; // 'glTF'
    const jsonLen = buffer.readUInt32LE(12);
    const jsonString = buffer.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonString);
    const names = gltf.nodes ? gltf.nodes.map(n => n.name) : [];
    const meshes = gltf.meshes ? gltf.meshes.map(m => m.name) : [];
    const mats = gltf.materials ? gltf.materials.map(m => m.name) : [];
    console.log(path);
    console.log("Nodes:", names.filter(Boolean));
    console.log("Meshes:", meshes.filter(Boolean));
    console.log("Materials:", mats.filter(Boolean));
}

readGlb('./public/assets/models/vehicles/Police_Sports.glb');
readGlb('./public/assets/models/vehicles/Pickup.glb');
readGlb('./src/assets/models/vehicles/Police_Sports.glb');
readGlb('./src/assets/models/vehicles/Pickup.glb');
