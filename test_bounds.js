import { Scene, NullEngine, SceneLoader, Mesh, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF/index.js';
import fs from 'fs';

async function test() {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    
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
        const name = files[i];
        const path = files[i+1];
        try {
            const data = fs.readFileSync(path);
            const blob = new Blob([data]);
            const url = URL.createObjectURL(blob);
            
            const result = await SceneLoader.ImportMeshAsync("", url, "", scene, undefined, ".glb");
            let nodeNames = result.transformNodes.map(n => n.name);
            let meshNames = result.meshes.map(m => m.name);
            console.log(`\n=== ${name} (${path}) ===`);
            console.log("Nodes:", nodeNames.filter(n => n.includes("body")));
            console.log("Meshes:", meshNames.filter(m => m.includes("body")));
            
            // Clean up
            result.meshes.forEach(m => m.dispose());
            result.transformNodes.forEach(n => n.dispose());
            result.skeletons.forEach(s => s.dispose());
            result.particleSystems.forEach(p => p.dispose());
            result.animationGroups.forEach(a => a.dispose());
        } catch (e) {
            console.log(`Failed to load ${path}:`, e.message);
        }
    }
}
test();
