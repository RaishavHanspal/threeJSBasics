import { Vector3 } from "three";
/** use meshAccumulator class from HavokPlugin as developed with @babylonjs/core
 * override to support in three.js, inorder to create meshImposter/shape using model geometry
 */
export class MeshAccumulator {
    private _vertices: any[];
    private _indices: any[];
    private _isRightHanded: any;
    private _collectIndices: any;
    /**
     * Constructor of the mesh accumulator
     * @param mesh - The mesh used to compute the world matrix.
     * @param collectIndices - use mesh indices
     * @param scene - The scene used to determine the right handed system.
     *
     * Merge mesh and its children so whole hierarchy can be used as a mesh shape or convex hull
     */
    constructor(mesh, collectIndices, scene) {
        this._vertices = []; /// Vertices in body space
        this._indices = [];
        this._isRightHanded = scene.useRightHandedSystem;
        this._collectIndices = collectIndices;
    }
    /**
     * Adds a mesh to the physics engine.
     * @param mesh The mesh to add.
     * @param includeChildren Whether to include the children of the mesh.
     *
     * This method adds a mesh to the physics engine by computing the world matrix,
     * multiplying it with the body from world matrix, and then transforming the
     * coordinates of the mesh's vertices. It also adds the indices of the mesh
     * to the physics engine. If includeChildren is true, it will also add the
     * children of the mesh to the physics engine, ignoring any children which
     * have a physics impostor. This is useful for creating a physics engine
     * that accurately reflects the mesh and its children.
     */

    static TransformCoordinatesFromFloatsToRef(x, y, z, transformation, result) {
        const m = transformation.m;
        const rx = x * m[0] + y * m[4] + z * m[8] + m[12];
        const ry = x * m[1] + y * m[5] + z * m[9] + m[13];
        const rz = x * m[2] + y * m[6] + z * m[10] + m[14];
        const rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);
        result.x = rx * rw;
        result.y = ry * rw;
        result.z = rz * rw;
        return result;
    }

    static TransformCoordinates(vector, transformation) {
        const result = new Vector3(0, 0, 0);
        MeshAccumulator.TransformCoordinatesToRef(vector, transformation, result);
        return result;
    }

    static TransformCoordinatesToRef(vector, transformation, result) {
        MeshAccumulator.TransformCoordinatesFromFloatsToRef(vector.x, vector.y, vector.z, transformation, result);
        return result;
    }

    _addMesh(mesh, vertexData, meshIndices) {
        /** use a 4X4 identity matrix */
        const identityMatrix = { m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
        const numVerts = vertexData.length / 3;
        const indexOffset = this._vertices.length;
        for (let v = 0; v < numVerts; v++) {
            const pos = new Vector3(vertexData[v * 3 + 0], vertexData[v * 3 + 1], vertexData[v * 3 + 2]);
            this._vertices.push(MeshAccumulator.TransformCoordinates(pos, identityMatrix));
        }
        if (this._collectIndices) {
            if (meshIndices) {
                for (let i = 0; i < meshIndices.length; i += 3) {
                    // Havok wants the correct triangle winding to enable the interior triangle optimization
                    if (this._isRightHanded) {
                        this._indices.push(meshIndices[i + 0] + indexOffset);
                        this._indices.push(meshIndices[i + 1] + indexOffset);
                        this._indices.push(meshIndices[i + 2] + indexOffset);
                    }
                    else {
                        this._indices.push(meshIndices[i + 2] + indexOffset);
                        this._indices.push(meshIndices[i + 1] + indexOffset);
                        this._indices.push(meshIndices[i + 0] + indexOffset);
                    }
                }
            }
        }
    }

    /**
     * Allocate and populate the vertex positions inside the physics plugin.
     *
     * @returns An array of floats, whose backing memory is inside the plugin. The array contains the
     * positions of the mesh vertices, where a position is defined by three floats. You must call
     * freeBuffer() on the returned array once you have finished with it, in order to free the
     * memory inside the plugin..
     */
    getVertices(plugin) {
        const nFloats = this._vertices.length * 3;
        const bytesPerFloat = 4;
        const nBytes = nFloats * bytesPerFloat;
        const bufferBegin = plugin._malloc(nBytes);
        const ret = new Float32Array(plugin.HEAPU8.buffer, bufferBegin, nFloats);
        for (let i = 0; i < this._vertices.length; i++) {
            ret[i * 3 + 0] = this._vertices[i].x;
            ret[i * 3 + 1] = this._vertices[i].y;
            ret[i * 3 + 2] = this._vertices[i].z;
        }
        return { offset: bufferBegin, numObjects: nFloats };
    }
    freeBuffer(plugin, arr) {
        plugin._free(arr.offset);
    }
    /**
     * Allocate and populate the triangle indices inside the physics plugin
     *
     * @returns A new Int32Array, whose backing memory is inside the plugin. The array contains the indices
     * of the triangle positions, where a single triangle is defined by three indices. You must call
     * freeBuffer() on this array once you have finished with it, to free the memory inside the plugin..
     */
    getTriangles(plugin) {
        const bytesPerInt = 4;
        const nBytes = this._indices.length * bytesPerInt;
        const bufferBegin = plugin._malloc(nBytes);
        const ret = new Int32Array(plugin.HEAPU8.buffer, bufferBegin, this._indices.length);
        for (let i = 0; i < this._indices.length; i++) {
            ret[i] = this._indices[i];
        }
        return { offset: bufferBegin, numObjects: this._indices.length };
    }
}