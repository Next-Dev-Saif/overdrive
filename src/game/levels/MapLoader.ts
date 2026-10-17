import { createSceneryHeightSampler } from './SceneryPlacement';
import { addRaisedTerrain } from './ArenaTerrain';
import { dressArena } from './ArenaScenery';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';
import { Scene, MeshBuilder, StandardMaterial, Texture, Color3, PhysicsAggregate, PhysicsShapeType, Vector3, HemisphericLight, DirectionalLight, CubeTexture, ParticleSystem, PointLight, Material } from "@babylonjs/core";
import { TerrainMaterial } from "@babylonjs/materials/terrain/terrainMaterial";

export class MapLoader {
    /**
     * Loads the map and returns the safe spawn Y position (terrain height at center + clearance).
     * GameEngine uses this to place vehicles ON TOP of the ground, not below it.
     */
    public static async loadMap(scene: Scene, mapId: string): Promise<number> {
        if (mapId === "wasteland") {
            return this.loadWasteland(scene);
        } else if (mapId === "facility") {
            return this.loadFacility(scene);
        } else if (mapId === "glacial") {
            return this.loadGlacialOutpost(scene);
        } else if (mapId === "neon") {
            return this.loadNeonSector(scene);
        } else {
            return this.loadWasteland(scene);
        }
    }

    private static async buildCircularArena(scene: Scene, mapSize: number, groundMat: Material, wallMat: StandardMaterial, coverMat: StandardMaterial): Promise<void> {
        const radius = mapSize / 2;
        await new Promise<void>((resolve) => {
            // 1. Heightmap Terrain
            MeshBuilder.CreateGroundFromHeightMap("arenaGround", "https://playground.babylonjs.com/textures/heightMap.png", {
                width: mapSize,
                height: mapSize,
                subdivisions: 128,
                minHeight: -3,
                maxHeight: 12,
                onReady: (ground) => {
                    ground.material = groundMat;
                    ground.metadata = { terrain: true };
                    ground.receiveShadows = true;
                    addRaisedTerrain(scene, groundMat, mapSize);
                    new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0, friction: 0.5, restitution: 0.1 }, scene);
                    resolve();
                }
            }, scene);
        });
        const heightAt = createSceneryHeightSampler(scene);

        // 2. Circular Outer Wall (Composed of overlapping physics boxes for robust collision)
        const wallH = 18;
        const wallT = 15;
        const numSegments = 32;
        const segmentAngle = (Math.PI * 2) / numSegments;
        const wallWidth = (radius * 2 * Math.PI) / numSegments + 5; // +5 for overlap

        for (let i = 0; i < numSegments; i++) {
            const angle = i * segmentAngle;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const wallSegment = MeshBuilder.CreateBox(`wall_${i}`, { width: wallWidth, height: wallH, depth: wallT }, scene);
            wallSegment.position.set(x, (heightAt(x, z) ?? 0) + wallH / 2, z);
            wallSegment.rotation.y = -angle + Math.PI / 2;
            wallSegment.material = wallMat;
            new PhysicsAggregate(wallSegment, PhysicsShapeType.BOX, { mass: 0, friction: 0.2, restitution: 0.2 }, scene);
        }

        // 3. Symmetrical Rigid Covers (Pushed outward to avoid central hill)
        const coverH = 10;
        const rings = [
            { r: radius * 0.6, count: 6, size: 25 },
            { r: radius * 0.85, count: 12, size: 40 }
        ];

        rings.forEach(ring => {
            for (let i = 0; i < ring.count; i++) {
                const angle = (i / ring.count) * Math.PI * 2;
                const x = Math.cos(angle) * ring.r;
                const z = Math.sin(angle) * ring.r;

                const cover = MeshBuilder.CreateBox(`cover_${ring.r}_${i}`, { width: ring.size, height: coverH, depth: 8 }, scene);
                cover.position.set(x, (heightAt(x, z) ?? 0) + coverH / 2, z);
                cover.rotation.y = -angle + Math.PI / 2;
                cover.material = coverMat;
                new PhysicsAggregate(cover, PhysicsShapeType.BOX, { mass: 0, friction: 0.5 }, scene);
            }
        });

        // 4. Stadium Lights
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * (radius + wallT / 2);
            const z = Math.sin(angle) * (radius + wallT / 2);

            const pole = MeshBuilder.CreateCylinder(`pole_${i}`, { diameter: 4, height: 90 }, scene);
            pole.position.set(x, (heightAt(x, z) ?? 0) + 45, z);
            pole.material = wallMat;
            
            const lightX = Math.cos(angle) * (radius - 20);
            const lightZ = Math.sin(angle) * (radius - 20);
            
            const pl = new PointLight(`stadiumLight_${i}`, new Vector3(lightX, (heightAt(x, z) ?? 0) + 85, lightZ), scene);
            pl.diffuse = new Color3(1, 0.95, 0.8);
            pl.intensity = 0.3;
            pl.range = radius * 1.5;
        }
    }

    private static async loadWasteland(scene: Scene): Promise<number> {
        // Lighting & Atmosphere
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        light.intensity = 0.5;
        light.groundColor = new Color3(0.3, 0.2, 0.1);

        scene.fogMode = Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.002;
        scene.fogColor = new Color3(0.6, 0.4, 0.2);

        scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.dds", scene);

        // Materials
        const sandMat = new TerrainMaterial("sandMat", scene);
        sandMat.mixTexture = new Texture("https://playground.babylonjs.com/textures/mixMap.png", scene);
        
        const diff1 = new Texture("https://playground.babylonjs.com/textures/ground.jpg", scene);
        diff1.uScale = 40; diff1.vScale = 40;
        sandMat.diffuseTexture1 = diff1;
        
        const diff2 = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        diff2.uScale = 20; diff2.vScale = 20;
        sandMat.diffuseTexture2 = diff2;
        
        const diff3 = new Texture("https://playground.babylonjs.com/textures/grass.png", scene);
        diff3.uScale = 40; diff3.vScale = 40;
        sandMat.diffuseTexture3 = diff3;
        
        sandMat.bumpTexture1 = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        sandMat.bumpTexture1.uScale = 40; sandMat.bumpTexture1.vScale = 40;
        sandMat.bumpTexture2 = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        sandMat.bumpTexture2.uScale = 20; sandMat.bumpTexture2.vScale = 20;
        sandMat.bumpTexture3 = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        sandMat.bumpTexture3.uScale = 40; sandMat.bumpTexture3.vScale = 40;
        
        sandMat.specularColor = new Color3(0.02, 0.02, 0.02);

        const rockMat = new StandardMaterial("rockMat", scene);
        const rockTex = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        const rockBump = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        rockTex.uScale = 5; rockTex.vScale = 5;
        rockBump.uScale = 5; rockBump.vScale = 5;
        rockMat.diffuseTexture = rockTex;
        rockMat.bumpTexture = rockBump;
        rockMat.specularColor = new Color3(0, 0, 0); // Matte rocks

        const coverMat = new StandardMaterial("coverMat", scene);
        coverMat.diffuseColor = new Color3(0.6, 0.5, 0.4);

        await this.buildCircularArena(scene, 600, sandMat, rockMat, coverMat);

        // Dust Storm Weather
        const dust = new ParticleSystem("dust", 1500, scene);
        dust.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
        dust.createBoxEmitter(new Vector3(1, 0, 0), new Vector3(1, 0.1, 0), new Vector3(-300, 0, -300), new Vector3(300, 20, 300));
        dust.color1 = new Color3(0.8, 0.6, 0.4).toColor4(0.3);
        dust.color2 = new Color3(0.6, 0.4, 0.2).toColor4(0.1);
        dust.colorDead = new Color3(0, 0, 0).toColor4(0);
        dust.minSize = 10; dust.maxSize = 25; // Larger but softer smoke particles
        dust.minLifeTime = 3; dust.maxLifeTime = 7;
        dust.emitRate = 70 * GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        dust.minEmitPower = 8; dust.maxEmitPower = 15;
        dust.start();

        dressArena(scene, 'wasteland', 600);
        return 6;
    }

    private static async loadFacility(scene: Scene): Promise<number> {
        const light = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
        light.intensity = 0.8;
        light.groundColor = new Color3(0.2, 0.2, 0.2);

        scene.fogMode = Scene.FOGMODE_LINEAR;
        scene.fogStart = 150;
        scene.fogEnd = 400;
        scene.fogColor = new Color3(0.4, 0.5, 0.6);

        scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.dds", scene);

        const floorMat = new StandardMaterial("floorMat", scene);
        const floorTex = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        const floorBump = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        floorTex.uScale = 30; floorTex.vScale = 30;
        floorBump.uScale = 30; floorBump.vScale = 30;
        floorMat.diffuseTexture = floorTex;
        floorMat.bumpTexture = floorBump;
        floorMat.diffuseColor = new Color3(0.6, 0.6, 0.62); // Concrete look
        floorMat.specularColor = new Color3(0, 0, 0); // Matte concrete floor

        const wallMat = new StandardMaterial("wallMat", scene);
        const wallTex = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        const wallBump = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        wallTex.uScale = 10; wallTex.vScale = 10;
        wallBump.uScale = 10; wallBump.vScale = 10;
        wallMat.diffuseTexture = wallTex;
        wallMat.bumpTexture = wallBump;
        wallMat.diffuseColor = new Color3(0.3, 0.3, 0.35); // Darker concrete
        wallMat.specularColor = new Color3(0, 0, 0);

        const coverMat = new StandardMaterial("coverMat", scene);
        const coverTex = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        const coverBump = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        coverTex.uScale = 3; coverTex.vScale = 3;
        coverBump.uScale = 3; coverBump.vScale = 3;
        coverMat.diffuseTexture = coverTex;
        coverMat.bumpTexture = coverBump;
        coverMat.diffuseColor = new Color3(0.6, 0.6, 0.65); // Lighter concrete
        coverMat.specularColor = new Color3(0.1, 0.1, 0.1);

        await this.buildCircularArena(scene, 500, floorMat, wallMat, coverMat);

        dressArena(scene, 'facility', 500);
        return 6;
    }

    private static async loadGlacialOutpost(scene: Scene): Promise<number> {
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        light.groundColor = new Color3(0.05, 0.1, 0.2);

        scene.fogMode = Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.003;
        scene.fogColor = new Color3(0.7, 0.8, 0.9);

        scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.dds", scene);

        const iceMat = new StandardMaterial("iceMat", scene);
        const iceBump = new Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
        iceBump.uScale = 25; iceBump.vScale = 25;
        iceMat.bumpTexture = iceBump;
        iceMat.diffuseColor = new Color3(0.7, 0.85, 0.95);
        iceMat.specularColor = new Color3(0.5, 0.6, 0.7); // Softer ice highlight
        iceMat.specularPower = 64; // Tighter reflection

        const iceWallMat = new StandardMaterial("iceWallMat", scene);
        iceWallMat.diffuseColor = new Color3(0.6, 0.8, 1.0);

        const iceCoverMat = new StandardMaterial("iceCoverMat", scene);
        iceCoverMat.diffuseColor = new Color3(0.5, 0.7, 0.9);
        iceCoverMat.alpha = 1;

        await this.buildCircularArena(scene, 600, iceMat, iceWallMat, iceCoverMat);

        // Snow Weather
        const snow = new ParticleSystem("snow", 1800, scene);
        snow.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
        snow.createBoxEmitter(new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(-400, 200, -400), new Vector3(400, 200, 400));
        snow.color1 = new Color3(1, 1, 1).toColor4(0.8);
        snow.color2 = new Color3(1, 1, 1).toColor4(0.6);
        snow.colorDead = new Color3(1, 1, 1).toColor4(0);
        snow.minSize = 0.5; snow.maxSize = 1.5;
        snow.minLifeTime = 5; snow.maxLifeTime = 10;
        snow.emitRate = 350 * GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        snow.minEmitPower = 50; snow.maxEmitPower = 80;
        snow.start();

        dressArena(scene, 'glacial', 600);
        return 6;
    }

    private static async loadNeonSector(scene: Scene): Promise<number> {
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        light.intensity = 0.55; // Brighter ambient
        light.groundColor = new Color3(0.6, 0.3, 0.9);

        const dirLight = new DirectionalLight("neonMoon", new Vector3(0.5, -1, 0.5), scene);
        dirLight.intensity = 0.6; // Brighter moon
        dirLight.diffuse = new Color3(1.0, 0.6, 1.0);

        scene.fogMode = Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0005; // Reduced fog so it doesn't blur the field too much
        scene.fogColor = new Color3(0.25, 0.1, 0.4); // Brighter fog

        const asphaltMat = new StandardMaterial("asphaltMat", scene);
        const roadTex = new Texture("https://playground.babylonjs.com/textures/rock.png", scene);
        const roadBump = new Texture("https://playground.babylonjs.com/textures/rockn.png", scene);
        roadTex.uScale = 40; roadTex.vScale = 40;
        roadBump.uScale = 40; roadBump.vScale = 40;
        asphaltMat.diffuseTexture = roadTex;
        asphaltMat.bumpTexture = roadBump;
        asphaltMat.diffuseColor = new Color3(0.15, 0.15, 0.20); // Darker base to contrast neon
        asphaltMat.specularColor = new Color3(0.3, 0.3, 0.4); // Less blown-out wet reflection
        asphaltMat.specularPower = 64; // Tighter reflection

        const wallMat = new StandardMaterial("darkWall", scene);
        wallMat.diffuseColor = new Color3(0.2, 0.2, 0.25); // Brighter walls

        const neonCoverMat = new StandardMaterial("neonCover", scene);
        neonCoverMat.emissiveColor = new Color3(1, 0.1, 0.6);

        await this.buildCircularArena(scene, 600, asphaltMat, wallMat, neonCoverMat);

        // Heavy Rain Weather
        const rain = new ParticleSystem("rain", 2000, scene);
        rain.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", scene);
        rain.createBoxEmitter(new Vector3(0, -1, 0), new Vector3(0, -1, 0), new Vector3(-400, 200, -400), new Vector3(400, 200, 400));
        rain.color1 = new Color3(0.5, 0.8, 1).toColor4(0.5);
        rain.color2 = new Color3(0.5, 0.6, 1).toColor4(0.3);
        rain.colorDead = new Color3(0, 0, 0).toColor4(0);
        rain.minSize = 0.2; rain.maxSize = 0.5;
        rain.direction1 = new Vector3(0.2, -1, 0.2);
        rain.direction2 = new Vector3(0.2, -1, 0.2);
        rain.minLifeTime = 1.5; rain.maxLifeTime = 2.5;
        rain.emitRate = 600 * GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        rain.minEmitPower = 100; rain.maxEmitPower = 150;
        rain.start();

        dressArena(scene, 'neon', 600);
        return 6;
    }
}

