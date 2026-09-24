/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface ByldrMeshDefinition {
  model: string;
  name: string;
  type: string;
  size: [number, number, number];
  unit: string;
  mesh: {
    vertex_count: number;
    triangle_count: number;
    vertices: [number, number, number][];
    normals?: [number, number, number][];
    triangles: [number, number, number][];
  };
}

export const BYLDR_BBB_1X1X1_DATA: ByldrMeshDefinition = {
  model: 'bbb_1x1x1',
  name: 'BYLDR Brick Block',
  type: 'brick',
  size: [1, 1, 1],
  unit: 'mm',
  mesh: {
    vertex_count: 100,
    triangle_count: 196,
    vertices: [
      [-2.540001, 2.703287, 5.079994],
      [-0.376183, 2.703287, 4.147575],
      [-0.617165, 2.703287, 4.071312],
      [-0.843689, 2.703287, 3.959145],
      [-1.05043, 2.703287, 3.813728],
      [-1.232559, 2.703287, 3.638451],
      [0.498138, 2.703287, 0.965935],
      [0.73259, 2.703287, 1.060425],
      [2.540001, 2.703287, 0.0],
      [0.949852, 2.703287, 1.189598],
      [1.144859, 2.703287, 1.350418],
      [-1.385796, 2.703287, 3.437431],
      [-1.506546, 2.703287, 3.21537],
      [-1.59198, 2.703287, 2.977486],
      [-0.498138, 2.703287, 0.965935],
      [-0.252022, 2.703287, 0.90834],
      [-2.540001, 2.703287, 0.0],
      [0.0, 2.703287, 0.889],
      [0.252022, 2.703287, 0.90834],
      [1.313034, 2.703287, 1.539124],
      [1.450424, 2.703287, 1.751282],
      [1.553825, 2.703287, 1.981926],
      [2.540001, 2.703287, 5.079994],
      [1.59198, 2.703287, 2.977486],
      [1.506546, 2.703287, 3.21537],
      [1.385796, 2.703287, 3.437431],
      [1.232559, 2.703287, 3.638451],
      [1.050438, 2.703287, 3.813728],
      [1.620804, 2.703287, 2.22567],
      [1.649788, 2.703287, 2.476768],
      [1.640114, 2.703287, 2.729332],
      [0.843689, 2.703287, 3.959145],
      [0.61718, 2.703287, 4.071312],
      [0.37619, 2.703287, 4.147575],
      [-1.640106, 2.703287, 2.729332],
      [-1.649788, 2.703287, 2.476768],
      [-1.620796, 2.703287, 2.22567],
      [-1.553818, 2.703287, 1.981926],
      [-1.450417, 2.703287, 1.751282],
      [-1.313026, 2.703287, 1.539124],
      [-1.144852, 2.703287, 1.350418],
      [0.126389, 2.703287, 4.18615],
      [0.0, 2.703287, 4.190987],
      [-0.126381, 2.703287, 4.18615],
      [-0.949852, 2.703287, 1.189598],
      [-0.732574, 2.703287, 1.060425],
      [2.540001, -3.646715, 0.0],
      [2.540001, -3.646715, 5.079994],
      [-2.540001, -3.646715, 0.0],
      [-2.540001, -3.646715, 5.079994],
      [-1.650993, -3.646715, 4.190987],
      [-1.650993, -3.646715, 0.889],
      [1.651009, -3.646715, 0.889],
      [1.651009, -3.646715, 4.190987],
      [0.126389, 3.646715, 4.18615],
      [0.0, 3.646715, 4.190987],
      [0.37619, 3.646715, 4.147575],
      [0.61718, 3.646715, 4.071312],
      [0.843689, 3.646715, 3.959145],
      [1.050438, 3.646715, 3.813728],
      [1.232559, 3.646715, 3.638451],
      [1.385796, 3.646715, 3.437431],
      [1.506546, 3.646715, 3.21537],
      [1.59198, 3.646715, 2.977486],
      [1.640114, 3.646715, 2.729332],
      [1.649788, 3.646715, 2.476768],
      [1.620804, 3.646715, 2.22567],
      [1.553825, 3.646715, 1.981926],
      [1.450424, 3.646715, 1.751282],
      [1.313034, 3.646715, 1.539124],
      [1.144859, 3.646715, 1.350418],
      [0.949852, 3.646715, 1.189598],
      [0.73259, 3.646715, 1.060425],
      [0.498138, 3.646715, 0.965935],
      [0.252022, 3.646715, 0.90834],
      [0.0, 3.646715, 0.889],
      [-0.252022, 3.646715, 0.90834],
      [-0.498138, 3.646715, 0.965935],
      [-0.732574, 3.646715, 1.060425],
      [-0.949852, 3.646715, 1.189598],
      [-1.144852, 3.646715, 1.350418],
      [-1.313026, 3.646715, 1.539124],
      [-1.450417, 3.646715, 1.751282],
      [-1.553818, 3.646715, 1.981926],
      [-1.620796, 3.646715, 2.22567],
      [-1.649788, 3.646715, 2.476768],
      [-1.640106, 3.646715, 2.729332],
      [-1.59198, 3.646715, 2.977486],
      [-1.506546, 3.646715, 3.21537],
      [-1.385796, 3.646715, 3.437431],
      [-1.232559, 3.646715, 3.638451],
      [-1.05043, 3.646715, 3.813728],
      [-0.843689, 3.646715, 3.959145],
      [-0.617165, 3.646715, 4.071312],
      [-0.376183, 3.646715, 4.147575],
      [-0.126381, 3.646715, 4.18615],
      [1.651009, 1.814287, 4.190987],
      [1.651009, 1.814287, 0.889],
      [-1.650993, 1.814287, 0.889],
      [-1.650993, 1.814287, 4.190987],
    ],
    triangles: [
      [0, 1, 2],
      [2, 3, 0],
      [0, 3, 4],
      [0, 4, 5],
      [6, 7, 8],
      [8, 7, 9],
      [8, 9, 10],
      [5, 11, 0],
      [0, 11, 12],
      [0, 12, 13],
      [14, 15, 16],
      [16, 15, 17],
      [16, 17, 8],
      [8, 17, 18],
      [8, 18, 6],
      [10, 19, 8],
      [8, 19, 20],
      [8, 20, 21],
      [22, 23, 24],
      [24, 25, 22],
      [22, 25, 26],
      [22, 26, 27],
      [21, 28, 8],
      [8, 28, 29],
      [8, 29, 22],
      [22, 29, 30],
      [22, 30, 23],
      [27, 31, 22],
      [22, 31, 32],
      [22, 32, 33],
      [13, 34, 0],
      [0, 34, 35],
      [0, 35, 16],
      [16, 35, 36],
      [16, 36, 37],
      [37, 38, 16],
      [16, 38, 39],
      [16, 39, 40],
      [33, 41, 22],
      [22, 41, 42],
      [22, 42, 0],
      [0, 42, 43],
      [0, 43, 1],
      [40, 44, 16],
      [16, 44, 45],
      [16, 45, 14],
      [8, 22, 46],
      [46, 22, 47],
      [16, 8, 48],
      [48, 8, 46],
      [0, 16, 49],
      [49, 16, 48],
      [22, 0, 47],
      [47, 0, 49],
      [50, 49, 51],
      [51, 49, 48],
      [51, 48, 52],
      [52, 48, 46],
      [52, 46, 53],
      [53, 46, 47],
      [53, 47, 50],
      [50, 47, 49],
      [54, 55, 42],
      [42, 55, 43],
      [42, 41, 54],
      [54, 41, 33],
      [54, 33, 56],
      [56, 33, 32],
      [56, 32, 57],
      [57, 32, 31],
      [57, 31, 58],
      [58, 31, 27],
      [58, 27, 59],
      [59, 27, 26],
      [59, 26, 60],
      [60, 26, 25],
      [60, 25, 61],
      [61, 25, 24],
      [61, 24, 62],
      [62, 24, 23],
      [62, 23, 63],
      [63, 23, 30],
      [63, 30, 64],
      [64, 30, 29],
      [64, 29, 65],
      [65, 29, 28],
      [65, 28, 66],
      [66, 28, 21],
      [66, 21, 67],
      [67, 21, 20],
      [67, 20, 68],
      [68, 20, 19],
      [68, 19, 69],
      [69, 19, 10],
      [69, 10, 70],
      [70, 10, 9],
      [70, 9, 71],
      [71, 9, 7],
      [71, 7, 72],
      [72, 7, 6],
      [72, 6, 73],
      [73, 6, 18],
      [73, 18, 74],
      [74, 18, 17],
      [74, 17, 75],
      [75, 17, 15],
      [75, 15, 76],
      [76, 15, 14],
      [76, 14, 77],
      [77, 14, 45],
      [77, 45, 78],
      [78, 45, 44],
      [78, 44, 79],
      [79, 44, 40],
      [79, 40, 80],
      [80, 40, 39],
      [80, 39, 81],
      [81, 39, 38],
      [81, 38, 82],
      [82, 38, 37],
      [82, 37, 83],
      [83, 37, 36],
      [83, 36, 84],
      [84, 36, 35],
      [84, 35, 85],
      [85, 35, 34],
      [85, 34, 86],
      [86, 34, 13],
      [86, 13, 87],
      [87, 13, 12],
      [87, 12, 88],
      [88, 12, 11],
      [88, 11, 89],
      [89, 11, 5],
      [89, 5, 90],
      [90, 5, 4],
      [90, 4, 91],
      [91, 4, 3],
      [91, 3, 92],
      [92, 3, 2],
      [92, 2, 93],
      [93, 2, 1],
      [93, 1, 94],
      [94, 1, 43],
      [94, 43, 95],
      [95, 43, 55],
      [75, 55, 54],
      [76, 89, 75],
      [75, 89, 90],
      [90, 91, 75],
      [75, 91, 92],
      [75, 92, 93],
      [93, 94, 75],
      [75, 94, 95],
      [75, 95, 55],
      [54, 56, 75],
      [75, 56, 57],
      [75, 57, 58],
      [76, 77, 89],
      [89, 77, 78],
      [89, 78, 79],
      [58, 59, 75],
      [75, 59, 60],
      [75, 60, 61],
      [79, 80, 89],
      [89, 80, 81],
      [89, 81, 82],
      [86, 87, 85],
      [85, 87, 84],
      [82, 83, 89],
      [89, 83, 84],
      [89, 84, 88],
      [88, 84, 87],
      [61, 62, 75],
      [75, 62, 63],
      [75, 63, 64],
      [73, 66, 72],
      [72, 66, 67],
      [72, 67, 68],
      [64, 65, 75],
      [75, 65, 66],
      [75, 66, 74],
      [74, 66, 73],
      [68, 69, 72],
      [72, 69, 70],
      [72, 70, 71],
      [96, 97, 53],
      [53, 97, 52],
      [97, 98, 52],
      [52, 98, 51],
      [98, 99, 51],
      [51, 99, 50],
      [99, 96, 50],
      [50, 96, 53],
      [99, 98, 96],
      [96, 98, 97],
    ],
  },
};

/**
 * Recalculates analytical vertex normals and segments for the BBB3005 model.
 * Produces an unindexed geometry buffer where every face segment (outer walls, roof,
 * cylindrical stud, stud cap, bottom rim, inner cavity) has mathematically exact normals.
 */
export function createBBB3005Geometry(scaleToGrid = true): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const rawVertices = BYLDR_BBB_1X1X1_DATA.mesh.vertices;
  const rawTriangles = BYLDR_BBB_1X1X1_DATA.mesh.triangles;

  const xzScale = scaleToGrid ? (0.5 - 0.0125) / 5.08 : 1.0;
  const zOffset = scaleToGrid ? -2.54 : 0.0;

  // Transform raw vertices into world coordinates
  const transformedVertices: [number, number, number][] = rawVertices.map(([vx, vy, vz]) => {
    const x = vx * xzScale;
    let y: number;
    if (scaleToGrid) {
      if (vy <= 2.703287) {
        y = (vy + 3.646715) * (0.6 / 6.35);
      } else {
        const studProgress = (vy - 2.703287) / (3.646715 - 2.703287);
        y = 0.6 + studProgress * 0.1125;
      }
    } else {
      y = vy;
    }
    const z = (vz + zOffset) * xzScale;
    return [x, y, z];
  });

  const triCount = rawTriangles.length; // 196
  const vertexCount = triCount * 3; // 588

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const segments = new Float32Array(vertexCount);
  const voxelCoords = new Float32Array(vertexCount * 3);

  for (let t = 0; t < triCount; t++) {
    const [i0, i1, i2] = rawTriangles[t];
    const v0 = transformedVertices[i0];
    const v1 = transformedVertices[i1];
    const v2 = transformedVertices[i2];

    // Determine geometry segment
    // 0: Outer Walls, 1: Roof, 2: Stud Cylinder, 3: Stud Cap, 4: Bottom Rim, 5: Inner Walls, 6: Inner Ceiling
    let segmentId = 0.0;
    if (t < 48) {
      // Triangles 0..47: Horizontal Roof Plate
      segmentId = 1.0;
    } else if (t < 56) {
      // Triangles 48..55: 4 Outer Vertical Walls
      segmentId = 0.0;
    } else if (t < 64) {
      // Triangles 56..63: Bottom Rim Lip
      segmentId = 4.0;
    } else if (t < 128) {
      // Triangles 64..127: Cylindrical Stud Side Wall
      segmentId = 2.0;
    } else if (t < 186) {
      // Triangles 128..185: Stud Top Circular Disc Cap
      segmentId = 3.0;
    } else if (t < 194) {
      // Triangles 186..193: Inner Cavity Vertical Walls
      segmentId = 5.0;
    } else {
      // Triangles 194..195: Inner Cavity Ceiling
      segmentId = 6.0;
    }

    // Calculate face normal
    const ax = v1[0] - v0[0];
    const ay = v1[1] - v0[1];
    const az = v1[2] - v0[2];
    const bx = v2[0] - v0[0];
    const by = v2[1] - v0[1];
    const bz = v2[2] - v0[2];

    let fnx = ay * bz - az * by;
    let fny = az * bx - ax * bz;
    let fnz = ax * by - ay * bx;
    const fnLen = Math.sqrt(fnx * fnx + fny * fny + fnz * fnz) || 1.0;
    fnx /= fnLen;
    fny /= fnLen;
    fnz /= fnLen;

    const triVerts = [v0, v1, v2];

    for (let j = 0; j < 3; j++) {
      const idx = (t * 3 + j);
      const [vx, vy, vz] = triVerts[j];

      positions[idx * 3] = vx;
      positions[idx * 3 + 1] = vy;
      positions[idx * 3 + 2] = vz;

      // Recalculated exact vertex normal based on segment
      let nx = fnx;
      let ny = fny;
      let nz = fnz;

      if (segmentId === 1.0 || segmentId === 3.0) {
        // Roof or Stud Cap: pristine flat upward normal
        nx = 0.0;
        ny = 1.0;
        nz = 0.0;
      } else if (segmentId === 4.0 || segmentId === 6.0) {
        // Bottom Rim or Cavity Ceiling: pristine flat downward normal
        nx = 0.0;
        ny = -1.0;
        nz = 0.0;
      } else if (segmentId === 2.0) {
        // Stud Cylinder side: exact continuous radial cylinder normal around (0, y, 0)
        const rad = Math.sqrt(vx * vx + vz * vz) || 1.0;
        nx = vx / rad;
        ny = 0.0;
        nz = vz / rad;
      } else if (segmentId === 0.0) {
        // Outer Walls: clamp to dominant axis
        if (Math.abs(fnx) > Math.abs(fnz)) {
          nx = fnx > 0 ? 1.0 : -1.0;
          ny = 0.0;
          nz = 0.0;
        } else {
          nx = 0.0;
          ny = 0.0;
          nz = fnz > 0 ? 1.0 : -1.0;
        }
      } else if (segmentId === 5.0) {
        // Inner Cavity Walls: clamp to inward dominant axis
        if (Math.abs(fnx) > Math.abs(fnz)) {
          nx = fnx > 0 ? 1.0 : -1.0;
          ny = 0.0;
          nz = 0.0;
        } else {
          nx = 0.0;
          ny = 0.0;
          nz = fnz > 0 ? 1.0 : -1.0;
        }
      }

      normals[idx * 3] = nx;
      normals[idx * 3 + 1] = ny;
      normals[idx * 3 + 2] = nz;

      // Box UV unwrapping ensuring seamless, non-stretched texture mapping
      if (Math.abs(ny) > 0.7) {
        uvs[idx * 2] = (vx + 0.25) / 0.5;
        uvs[idx * 2 + 1] = (vz + 0.25) / 0.5;
      } else if (segmentId === 2.0) {
        uvs[idx * 2] = (Math.atan2(vz, vx) / (2.0 * Math.PI)) + 0.5;
        uvs[idx * 2 + 1] = (vy - 0.6) / 0.1125;
      } else if (Math.abs(nx) > Math.abs(nz)) {
        uvs[idx * 2] = (vz + 0.25) / 0.5;
        uvs[idx * 2 + 1] = vy / 0.6;
      } else {
        uvs[idx * 2] = (vx + 0.25) / 0.5;
        uvs[idx * 2 + 1] = vy / 0.6;
      }

      segments[idx] = segmentId;

      voxelCoords[idx * 3] = vx;
      voxelCoords[idx * 3 + 1] = vy;
      voxelCoords[idx * 3 + 2] = vz;
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aSegment', new THREE.BufferAttribute(segments, 1));
  geom.setAttribute('aVoxelCoord', new THREE.BufferAttribute(voxelCoords, 3));

  return geom;
}

// Backward-compatible alias
export const createByldr1x1Geometry = createBBB3005Geometry;

// Populate recalculated normals into the raw BYLDR_BBB_1X1X1_DATA for JSON export
(function populateRawModelNormals() {
  const verts = BYLDR_BBB_1X1X1_DATA.mesh.vertices;
  const tris = BYLDR_BBB_1X1X1_DATA.mesh.triangles;
  const accNormals: [number, number, number][] = verts.map(() => [0, 0, 0]);

  for (const [i0, i1, i2] of tris) {
    const v0 = verts[i0];
    const v1 = verts[i1];
    const v2 = verts[i2];
    const ax = v1[0] - v0[0];
    const ay = v1[1] - v0[1];
    const az = v1[2] - v0[2];
    const bx = v2[0] - v0[0];
    const by = v2[1] - v0[1];
    const bz = v2[2] - v0[2];

    const fnx = ay * bz - az * by;
    const fny = az * bx - ax * bz;
    const fnz = ax * by - ay * bx;
    const len = Math.sqrt(fnx * fnx + fny * fny + fnz * fnz) || 1.0;

    for (const vi of [i0, i1, i2]) {
      accNormals[vi][0] += fnx / len;
      accNormals[vi][1] += fny / len;
      accNormals[vi][2] += fnz / len;
    }
  }

  BYLDR_BBB_1X1X1_DATA.mesh.normals = accNormals.map(([nx, ny, nz]) => {
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
    return [
      Number((nx / l).toFixed(6)),
      Number((ny / l).toFixed(6)),
      Number((nz / l).toFixed(6)),
    ];
  });
})();

