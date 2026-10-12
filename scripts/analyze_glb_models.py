#!/usr/bin/env python3
"""Read-only structural audit for the vehicle GLB assets."""

from __future__ import annotations

import json
import math
import struct
import sys
from pathlib import Path


def mat_mul(a: list[float], b: list[float]) -> list[float]:
    return [sum(a[row + k * 4] * b[k + col * 4] for k in range(4)) for col in range(4) for row in range(4)]


def node_matrix(node: dict) -> list[float]:
    if "matrix" in node:
        return node["matrix"]
    tx, ty, tz = node.get("translation", [0, 0, 0])
    qx, qy, qz, qw = node.get("rotation", [0, 0, 0, 1])
    sx, sy, sz = node.get("scale", [1, 1, 1])
    xx, yy, zz = qx * qx, qy * qy, qz * qz
    xy, xz, yz = qx * qy, qx * qz, qy * qz
    wx, wy, wz = qw * qx, qw * qy, qw * qz
    return [
        (1 - 2 * (yy + zz)) * sx, (2 * (xy + wz)) * sx, (2 * (xz - wy)) * sx, 0,
        (2 * (xy - wz)) * sy, (1 - 2 * (xx + zz)) * sy, (2 * (yz + wx)) * sy, 0,
        (2 * (xz + wy)) * sz, (2 * (yz - wx)) * sz, (1 - 2 * (xx + yy)) * sz, 0,
        tx, ty, tz, 1,
    ]


def transform_point(matrix: list[float], point: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = point
    return (
        matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
        matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
        matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
    )


def parse_glb(path: Path) -> tuple[dict, int]:
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("invalid GLB 2.0 header")
    offset, document, binary_bytes = 12, None, 0
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset:offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b" \t\r\n\0"))
        elif chunk_type == 0x004E4942:
            binary_bytes += chunk_length
    if document is None:
        raise ValueError("missing JSON chunk")
    return document, binary_bytes


def analyze(path: Path) -> dict:
    doc, binary_bytes = parse_glb(path)
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    materials = doc.get("materials", [])
    buffer_views = doc.get("bufferViews", [])
    identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    worlds: dict[int, list[float]] = {}

    scene_index = doc.get("scene", 0)
    scenes = doc.get("scenes", [])
    roots = scenes[scene_index].get("nodes", []) if scenes else list(range(len(nodes)))

    def walk(index: int, parent: list[float]) -> None:
        world = mat_mul(parent, node_matrix(nodes[index]))
        worlds[index] = world
        for child in nodes[index].get("children", []):
            walk(child, world)

    for root in roots:
        walk(root, identity)

    vertex_count = index_count = triangles = primitives = morph_targets = 0
    global_min = [math.inf, math.inf, math.inf]
    global_max = [-math.inf, -math.inf, -math.inf]
    used_extensions: set[str] = set(doc.get("extensionsUsed", []))
    mesh_nodes = []

    for node_index, node in enumerate(nodes):
        if "mesh" not in node:
            continue
        mesh_index = node["mesh"]
        mesh = meshes[mesh_index]
        mesh_nodes.append(node.get("name") or mesh.get("name") or f"node_{node_index}")
        for primitive in mesh.get("primitives", []):
            primitives += 1
            attrs = primitive.get("attributes", {})
            if "POSITION" in attrs:
                accessor = accessors[attrs["POSITION"]]
                vertex_count += accessor.get("count", 0)
                if "min" in accessor and "max" in accessor:
                    lo, hi = accessor["min"], accessor["max"]
                    corners = [(x, y, z) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])]
                    world = worlds.get(node_index, identity)
                    for corner in corners:
                        point = transform_point(world, corner)
                        for axis in range(3):
                            global_min[axis] = min(global_min[axis], point[axis])
                            global_max[axis] = max(global_max[axis], point[axis])
            count = accessors[primitive["indices"]].get("count", 0) if "indices" in primitive else accessors[attrs["POSITION"]].get("count", 0)
            index_count += count
            if primitive.get("mode", 4) == 4:
                triangles += count // 3
            morph_targets += len(primitive.get("targets", []))
            used_extensions.update(primitive.get("extensions", {}).keys())

    names = [(node.get("name") or "").strip() for node in nodes]
    lowered = [name.lower() for name in names]
    wheel_names = [name for name in names if any(token in name.lower() for token in ("wheel", "tire", "tyre"))]
    turret_names = [name for name in names if any(token in name.lower() for token in ("turret", "barrel", "cannon", "gun", "weapon"))]
    body_names = [name for name in names if any(token in name.lower() for token in ("body", "chassis", "frame"))]

    image_info = []
    for image in doc.get("images", []):
        size = None
        if "bufferView" in image:
            size = buffer_views[image["bufferView"]].get("byteLength")
        image_info.append({"name": image.get("name"), "mime": image.get("mimeType"), "uri": image.get("uri"), "bytes": size})

    dimensions = [global_max[i] - global_min[i] for i in range(3)] if vertex_count and all(math.isfinite(v) for v in global_min) else None
    material_modes = {}
    texture_slots = 0
    for material in materials:
        mode = material.get("alphaMode", "OPAQUE")
        material_modes[mode] = material_modes.get(mode, 0) + 1
        pbr = material.get("pbrMetallicRoughness", {})
        texture_slots += sum(1 for key in ("baseColorTexture", "metallicRoughnessTexture") if key in pbr)
        texture_slots += sum(1 for key in ("normalTexture", "occlusionTexture", "emissiveTexture") if key in material)

    return {
        "file": str(path),
        "bytes": path.stat().st_size,
        "generator": doc.get("asset", {}).get("generator"),
        "copyright": doc.get("asset", {}).get("copyright"),
        "nodes": len(nodes),
        "mesh_nodes": len(mesh_nodes),
        "meshes": len(meshes),
        "primitives": primitives,
        "vertices": vertex_count,
        "triangles": triangles,
        "materials": len(materials),
        "material_modes": material_modes,
        "textures": len(doc.get("textures", [])),
        "images": image_info,
        "texture_slots": texture_slots,
        "binary_bytes": binary_bytes,
        "dimensions": dimensions,
        "bounds_min": global_min if dimensions else None,
        "bounds_max": global_max if dimensions else None,
        "animations": len(doc.get("animations", [])),
        "skins": len(doc.get("skins", [])),
        "morph_targets": morph_targets,
        "cameras": len(doc.get("cameras", [])),
        "lights": len(doc.get("extensions", {}).get("KHR_lights_punctual", {}).get("lights", [])),
        "extensions": sorted(used_extensions),
        "wheel_nodes": wheel_names,
        "turret_nodes": turret_names,
        "body_nodes": body_names,
        "root_nodes": [names[index] or f"node_{index}" for index in roots],
        "mesh_node_names": mesh_nodes,
        "all_node_names": names,
    }


def fmt_dimensions(values: list[float] | None) -> str:
    return "unknown" if not values else "×".join(f"{value:.2f}" for value in values)


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "src/assets/models")
    results = [analyze(path) for path in sorted(root.rglob("*.glb"))]
    print("file\tMiB\tnodes\tmeshes\tprims\tvertices\ttris\tmats\ttex\tdimensions\twheel-nodes\tanimations/skins")
    for item in results:
        rel = Path(item["file"]).relative_to(root)
        print(
            f"{rel}\t{item['bytes']/1024/1024:.2f}\t{item['nodes']}\t{item['meshes']}\t{item['primitives']}\t"
            f"{item['vertices']}\t{item['triangles']}\t{item['materials']}\t{item['textures']}\t"
            f"{fmt_dimensions(item['dimensions'])}\t{len(item['wheel_nodes'])}\t{item['animations']}/{item['skins']}"
        )
    print("\nDETAILS")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
