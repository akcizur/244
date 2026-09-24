/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrickType, BRICK_TYPES, BrickMaterialType } from './types';
import * as THREE from 'three';

export interface LegoJsonGeometry {
  uuid: string;
  type: string;
  width?: number;
  height?: number;
  depth?: number;
  radiusTop?: number;
  radiusBottom?: number;
  radialSegments?: number;
}

export interface LegoJsonMaterial {
  uuid: string;
  type: string;
  color: number;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  ior?: number;
}

export interface LegoJsonMesh {
  uuid: string;
  type: 'Mesh';
  name: string;
  geometry: string;
  material: string;
  matrix: number[];
}

export interface LegoJsonObjectGroup {
  uuid: string;
  type: 'Group';
  name: string;
  children: (LegoJsonMesh | LegoJsonObjectGroup)[];
  matrix?: number[];
}

export interface LegoBrickJsonDocument {
  metadata: {
    version: number;
    type: string;
    generator: string;
  };
  geometries: LegoJsonGeometry[];
  materials: LegoJsonMaterial[];
  object: LegoJsonObjectGroup;
}

/**
 * Generates canonical Three.js 4.5 Object JSON in LegoBrickJsonGenerator format.
 * Dimensions are standard LEGO millimeter specifications:
 * - 1 stud pitch = 8.0 mm
 * - 1x1 brick body: width: 7.8, height: 9.6, depth: 7.8
 * - Stud: radiusTop: 2.4, radiusBottom: 2.4, height: 1.8, radialSegments: 32
 * - Body matrix Y: 4.8 (height / 2)
 * - Stud matrix Y: 10.5 (height + studHeight / 2)
 */
export function generateLegoBrickJson(
  type: BrickType,
  colorHex: number,
  materialType: BrickMaterialType = 'BASIC'
): LegoBrickJsonDocument {
  const is1x1 = type.studsX === 1 && type.studsZ === 1 && type.h >= 0.5;

  // Real LEGO dimensions in mm
  const bodyWidth = Number((type.studsX * 8.0 - 0.2).toFixed(1));
  const bodyDepth = Number((type.studsZ * 8.0 - 0.2).toFixed(1));
  const bodyHeight = type.h <= 0.25 ? 3.2 : 9.6;
  const studRadius = 2.4;
  const studHeight = 1.8;

  const bodyGeoUuid = is1x1
    ? 'B111-BODY-0000-0000-000000000001'
    : `B-${type.id.toUpperCase()}-BODY`;
  const studGeoUuid = is1x1
    ? 'B111-STUD-0000-0000-000000000002'
    : 'B111-STUD-0000-0000-000000000002';
  const matUuid = is1x1
    ? 'M001-LEGO-RED-0000-000000000001'
    : `M001-LEGO-${colorHex.toString(16).toUpperCase()}`;

  const geometries: LegoJsonGeometry[] = [
    {
      uuid: bodyGeoUuid,
      type: 'BoxGeometry',
      width: bodyWidth,
      height: bodyHeight,
      depth: bodyDepth,
    },
    {
      uuid: studGeoUuid,
      type: 'CylinderGeometry',
      radiusTop: studRadius,
      radiusBottom: studRadius,
      height: studHeight,
      radialSegments: 32,
    },
  ];

  const material: LegoJsonMaterial = {
    uuid: matUuid,
    type: materialType === 'GLASS' ? 'MeshPhysicalMaterial' : 'MeshStandardMaterial',
    color: colorHex,
    roughness: materialType === 'GLASS' ? 0.05 : 0.2,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: materialType === 'GLASS' ? 0.02 : 0.1,
  };

  if (materialType === 'GLASS') {
    material.transmission = 0.97;
    material.ior = 1.52;
  }

  const bodyMatrixY = bodyHeight / 2;
  const studMatrixY = bodyHeight + studHeight / 2;

  const children: LegoJsonMesh[] = [];

  // Main Brick Body Mesh
  children.push({
    uuid: is1x1 ? 'C001-BODY-MESH-0000-000000000001' : `C-BODY-${type.id}`,
    type: 'Mesh',
    name: 'Brick_Body',
    geometry: bodyGeoUuid,
    material: matUuid,
    matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, bodyMatrixY, 0, 1],
  });

  // Top Studs
  if (is1x1) {
    children.push({
      uuid: 'C002-STUD-MESH-0000-000000000002',
      type: 'Mesh',
      name: 'Top_Stud',
      geometry: studGeoUuid,
      material: matUuid,
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, studMatrixY, 0, 1],
    });
  } else {
    const startX = -((type.studsX - 1) * 8.0) / 2;
    const startZ = -((type.studsZ - 1) * 8.0) / 2;
    let studIndex = 1;

    for (let x = 0; x < type.studsX; x++) {
      for (let z = 0; z < type.studsZ; z++) {
        const posX = Number((startX + x * 8.0).toFixed(2));
        const posZ = Number((startZ + z * 8.0).toFixed(2));

        children.push({
          uuid: `C-STUD-${type.id}-${studIndex++}`,
          type: 'Mesh',
          name: type.studsX * type.studsZ === 1 ? 'Top_Stud' : `Top_Stud_${x}_${z}`,
          geometry: studGeoUuid,
          material: matUuid,
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, posX, studMatrixY, posZ, 1],
        });
      }
    }
  }

  const groupName = `Lego_Brick_${type.studsX}x${type.studsZ}`;
  const groupUuid = is1x1
    ? 'O001-LEGO-BRICK-1X1-000000000001'
    : `O001-LEGO-${type.id.toUpperCase()}`;

  return {
    metadata: {
      version: 4.5,
      type: 'Object',
      generator: 'LegoBrickJsonGenerator',
    },
    geometries,
    materials: [material],
    object: {
      uuid: groupUuid,
      type: 'Group',
      name: groupName,
      children,
    },
  };
}

/**
 * Generates full scene JSON in LegoBrickJsonGenerator format with all placed bricks in world coordinates.
 */
export function generateSceneLegoJson(bricks: THREE.Group[]): LegoBrickJsonDocument {
  const geometriesMap = new Map<string, LegoJsonGeometry>();
  const materialsMap = new Map<string, LegoJsonMaterial>();

  // Base Stud Geometry (standard 2.4mm radius, 1.8mm height)
  const studGeoUuid = 'B111-STUD-0000-0000-000000000002';
  geometriesMap.set(studGeoUuid, {
    uuid: studGeoUuid,
    type: 'CylinderGeometry',
    radiusTop: 2.4,
    radiusBottom: 2.4,
    height: 1.8,
    radialSegments: 32,
  });

  const brickChildren: LegoJsonObjectGroup[] = [];

  bricks.forEach((brick, index) => {
    const typeId = brick.userData.typeId || 'bb3005';
    const type = BRICK_TYPES.find((t) => t.id === typeId) || BRICK_TYPES[0];
    const matType: BrickMaterialType = brick.userData.materialType || 'BASIC';

    // Find brick color from first mesh material
    let brickColor = 0xde1a24;
    brick.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m.color) {
          brickColor = m.color.getHex();
        }
      }
    });

    const bodyWidth = Number((type.studsX * 8.0 - 0.2).toFixed(1));
    const bodyDepth = Number((type.studsZ * 8.0 - 0.2).toFixed(1));
    const bodyHeight = type.h <= 0.25 ? 3.2 : 9.6;

    const bodyGeoUuid = `B-GEO-${type.id}-${bodyWidth}x${bodyDepth}`;
    if (!geometriesMap.has(bodyGeoUuid)) {
      geometriesMap.set(bodyGeoUuid, {
        uuid: bodyGeoUuid,
        type: 'BoxGeometry',
        width: bodyWidth,
        height: bodyHeight,
        depth: bodyDepth,
      });
    }

    const matUuid = `M-MAT-${brickColor.toString(16)}-${matType}`;
    if (!materialsMap.has(matUuid)) {
      materialsMap.set(matUuid, {
        uuid: matUuid,
        type: matType === 'GLASS' ? 'MeshPhysicalMaterial' : 'MeshStandardMaterial',
        color: brickColor,
        roughness: matType === 'GLASS' ? 0.05 : 0.2,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: matType === 'GLASS' ? 0.02 : 0.1,
      });
    }

    const bodyMatrixY = bodyHeight / 2;
    const studMatrixY = bodyHeight + 1.8 / 2;

    const meshChildren: LegoJsonMesh[] = [
      {
        uuid: `C-BODY-${index}`,
        type: 'Mesh',
        name: 'Brick_Body',
        geometry: bodyGeoUuid,
        material: matUuid,
        matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, bodyMatrixY, 0, 1],
      },
    ];

    const startX = -((type.studsX - 1) * 8.0) / 2;
    const startZ = -((type.studsZ - 1) * 8.0) / 2;
    let sIdx = 0;
    for (let x = 0; x < type.studsX; x++) {
      for (let z = 0; z < type.studsZ; z++) {
        const posX = Number((startX + x * 8.0).toFixed(2));
        const posZ = Number((startZ + z * 8.0).toFixed(2));
        meshChildren.push({
          uuid: `C-STUD-${index}-${sIdx++}`,
          type: 'Mesh',
          name: type.studsX * type.studsZ === 1 ? 'Top_Stud' : `Top_Stud_${x}_${z}`,
          geometry: studGeoUuid,
          material: matUuid,
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, posX, studMatrixY, posZ, 1],
        });
      }
    }

    // World transformation matrix (converted from engine 0.5m grid to 8.0mm Lego units: scale factor 16)
    const mmX = Number((brick.position.x * 16).toFixed(1));
    const mmY = Number((brick.position.y * 16).toFixed(1));
    const mmZ = Number((brick.position.z * 16).toFixed(1));

    const rotMatrix = new THREE.Matrix4().makeRotationY(brick.rotation.y);
    rotMatrix.setPosition(mmX, mmY, mmZ);

    brickChildren.push({
      uuid: `O-BRICK-${index}`,
      type: 'Group',
      name: `Lego_Brick_${type.studsX}x${type.studsZ}`,
      matrix: Array.from(rotMatrix.elements),
      children: meshChildren,
    });
  });

  return {
    metadata: {
      version: 4.5,
      type: 'Object',
      generator: 'LegoBrickJsonGenerator',
    },
    geometries: Array.from(geometriesMap.values()),
    materials: Array.from(materialsMap.values()),
    object: {
      uuid: 'O-LEGO-SCENE-ROOT',
      type: 'Group',
      name: 'Lego_Model_Scene',
      children: brickChildren,
    },
  };
}
