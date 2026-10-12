import { AbstractMesh, type Node } from '@babylonjs/core';

/** Babylon's hierarchy-bounds predicate also receives non-mesh transform nodes. */
export function isVisibleModelMesh(node: Node): node is AbstractMesh {
    return node instanceof AbstractMesh && node.isEnabled() && node.isVisible && node.getTotalVertices() > 0;
}
