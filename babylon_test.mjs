import { Vector3, TransformNode, MeshBuilder, Scene, NullEngine } from "@babylonjs/core/index.js";

const engine = new NullEngine();
const scene = new Scene(engine);

const root = new TransformNode("root", scene);
root.position = new Vector3(100, 15, 100);

const child = MeshBuilder.CreateBox("child", {}, scene);
child.position = new Vector3(0, 1, 0);
child.parent = root;
child.computeWorldMatrix(true);

console.log("Child local pos:", child.position.x, child.position.y, child.position.z);
console.log("Child absolute pos:", child.getAbsolutePosition().x, child.getAbsolutePosition().y, child.getAbsolutePosition().z);
