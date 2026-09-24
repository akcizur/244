/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BrickMaterialType } from './types';

export interface BBB3005VoxelMaterialOptions {
  color: number;
  materialType?: BrickMaterialType;
  isGhost?: boolean;
  ghostValid?: boolean;
  envMap?: THREE.Texture | null;
  opacity?: number;
}

const VOXEL_VERTEX_SHADER = /* glsl */ `
attribute float aSegment;
attribute vec3 aVoxelCoord;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vSegment;
varying vec3 vVoxelCoord;
varying vec3 vViewDir;

void main() {
  vSegment = aSegment;
  vVoxelCoord = aVoxelCoord;
  vUv = uv;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  // World-space pristine surface normal
  vNormal = normalize(mat3(modelMatrix) * normal);

  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const VOXEL_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uRoughness;
uniform float uMetalness;
uniform float uClearcoat;
uniform float uClearcoatRoughness;
uniform int uMaterialType; // 0=BASIC, 1=GLASS, 2=METALLIC, 3=RUBBER
uniform float uOpacity;
uniform float uIsGhost;
uniform float uGhostValid;
uniform float uTime;

uniform vec3 uCameraPos;
uniform vec3 uKeyLightDir;
uniform vec3 uKeyLightColor;
uniform float uKeyLightIntensity;

uniform vec3 uPlayerLightPos;
uniform vec3 uPlayerLightColor;
uniform float uPlayerLightIntensity;
uniform float uPlayerLightRadius;

uniform vec3 uFillLightDir;
uniform vec3 uFillLightColor;

uniform vec3 uRimLightDir;
uniform vec3 uRimLightColor;

uniform vec3 uAmbientSky;
uniform vec3 uAmbientGround;

uniform sampler2D uEnvMap;
uniform float uEnvIntensity;
uniform float uHasEnvMap;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vSegment;
varying vec3 vVoxelCoord;
varying vec3 vViewDir;

// Equirectangular / spherical studio environment reflection
vec3 sampleEnvironment(vec3 reflectDir, float roughness) {
  if (uHasEnvMap < 0.5) {
    // Studio gradient fallback if env map not loaded yet
    float t = reflectDir.y * 0.5 + 0.5;
    return mix(vec3(0.08, 0.12, 0.20), vec3(0.95, 0.98, 1.0), pow(t, 2.0)) * uEnvIntensity;
  }
  vec2 uv;
  uv.x = atan(reflectDir.z, reflectDir.x) * (0.15915494309) + 0.5;
  uv.y = asin(clamp(reflectDir.y, -1.0, 1.0)) * (0.31830988618) + 0.5;
  return texture2D(uEnvMap, uv).rgb * uEnvIntensity;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // 1. Ghost Holographic Preview Mode
  if (uIsGhost > 0.5) {
    vec3 ghostBase = uGhostValid > 0.5 ? vec3(0.15, 0.92, 0.45) : vec3(0.95, 0.18, 0.22);
    float rim = 1.0 - max(dot(N, V), 0.0);
    float scanline = sin(vWorldPosition.y * 65.0 - uTime * 5.0) * 0.5 + 0.5;
    float alpha = 0.38 + 0.48 * pow(rim, 2.2) + 0.14 * scanline;
    vec3 col = mix(ghostBase, vec3(1.0), pow(rim, 3.0) * 0.7);
    gl_FragColor = vec4(col, alpha);
    return;
  }

  // 2. Segment-based Ambient Occlusion (Voxel Geometry Awareness)
  // Segments: 0=Walls, 1=Roof, 2=Stud Cylinder, 3=Stud Cap, 4=Bottom Rim, 5=Inner Walls, 6=Inner Ceiling
  float segmentAO = 1.0;
  
  if (vSegment > 4.5) {
    // Inner cavity walls and ceiling (5.0, 6.0) - authentic hollow interior shading without black void
    segmentAO = 0.42;
  } else if (vSegment > 0.5 && vSegment < 1.5) {
    // Roof (1.0): subtle contact ambient occlusion ring where stud connects to roof plate
    float distToCenter = length(vVoxelCoord.xz);
    float studRootRing = smoothstep(0.145, 0.185, distToCenter);
    segmentAO = 0.76 + 0.24 * studRootRing;
  } else if (vSegment > 3.5 && vSegment < 4.5) {
    // Bottom rim (4.0): slight contact shadow
    segmentAO = 0.78;
  }

  // 3. Hemisphere Studio Ambient Light
  float hemiMix = N.y * 0.5 + 0.5;
  vec3 ambientLight = mix(uAmbientGround, uAmbientSky, hemiMix) * segmentAO;

  // 4. Key Directional Light (studio bevel highlights and clean form shadows)
  vec3 L_key = normalize(-uKeyLightDir);
  float diff_key = max(dot(N, L_key), 0.0);
  vec3 H_key = normalize(L_key + V);
  float spec_key = pow(max(dot(N, H_key), 0.0), 36.0 / max(uRoughness, 0.05));

  // 5. Dedicated Player Light Radius ("LIGHTS ONLY RADIUS PLAYER")
  vec3 playerVec = uPlayerLightPos - vWorldPosition;
  float playerDist = length(playerVec);
  vec3 L_player = normalize(playerVec);
  float playerAtten = clamp(1.0 - (playerDist / uPlayerLightRadius), 0.0, 1.0);
  playerAtten = playerAtten * playerAtten / (1.0 + playerDist * 0.12);
  float diff_player = max(dot(N, L_player), 0.0) * playerAtten;
  vec3 H_player = normalize(L_player + V);
  float spec_player = pow(max(dot(N, H_player), 0.0), 36.0 / max(uRoughness, 0.05)) * playerAtten;

  // 6. Studio Fill & Rim Lights
  vec3 L_fill = normalize(-uFillLightDir);
  float diff_fill = max(dot(N, L_fill), 0.0) * 0.45;

  vec3 L_rim = normalize(-uRimLightDir);
  float diff_rim = max(dot(N, L_rim), 0.0) * 0.60;

  // Combined Direct Illumination
  vec3 directDiffuse = uKeyLightColor * (diff_key * uKeyLightIntensity) +
                       uPlayerLightColor * (diff_player * uPlayerLightIntensity) +
                       uFillLightColor * diff_fill +
                       uRimLightColor * diff_rim;

  // 7. Fresnel Reflectance for Authentic Injection-Molded ABS Plastic (IOR 1.54, F0 ~ 0.045)
  float F0 = uMaterialType == 2 ? 0.75 : (uMaterialType == 3 ? 0.02 : 0.045);
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - max(dot(N, V), 0.0), 5.0);

  // 8. Studio IBL Reflections
  vec3 R = reflect(-V, N);
  vec3 envReflect = sampleEnvironment(R, uRoughness);

  // 9. Material Differentiation
  vec3 albedo = uColor;

  if (uMaterialType == 1) {
    // GLASS / Translucent Polycarbonate Brick
    float glassTrans = 0.90;
    float depthAbsorption = exp(-0.55 * (1.0 - max(dot(N, V), 0.0)));
    vec3 glassColor = mix(albedo * 0.45, albedo, depthAbsorption);
    vec3 glassLit = glassColor * (ambientLight + directDiffuse * 0.65) +
                    envReflect * (fresnel * 1.6) +
                    (spec_key * uKeyLightColor * uKeyLightIntensity + spec_player * uPlayerLightColor * uPlayerLightIntensity) * 0.85;
    gl_FragColor = vec4(glassLit, glassTrans);
    return;
  }

  // 10. Solid ABS Plastic Shading (Canonical specification: roughness 0.20, metalness 0.0, clearcoat 1.0)
  vec3 finalColor = albedo * (ambientLight + directDiffuse * segmentAO) +
                    envReflect * (fresnel * uClearcoat * segmentAO) +
                    (spec_key * uKeyLightColor * uKeyLightIntensity + spec_player * uPlayerLightColor * uPlayerLightIntensity) * (fresnel + 0.18);

  // 11. Subtle Edge Bevel Highlight (Voxel Edge Sheen)
  vec3 edgeSheen = vec3(0.08) * pow(1.0 - max(dot(N, V), 0.0), 3.0);
  finalColor += edgeSheen * segmentAO;

  gl_FragColor = vec4(finalColor, uOpacity);
}
`;

// Shared uniform values that can be synced from the engine
export interface VoxelSceneLighting {
  cameraPos: THREE.Vector3;
  keyLightDir: THREE.Vector3;
  keyLightColor: THREE.Color;
  keyLightIntensity: number;
  playerLightPos: THREE.Vector3;
  playerLightColor: THREE.Color;
  playerLightIntensity: number;
  playerLightRadius: number;
  fillLightDir: THREE.Vector3;
  fillLightColor: THREE.Color;
  rimLightDir: THREE.Vector3;
  rimLightColor: THREE.Color;
  ambientSky: THREE.Color;
  ambientGround: THREE.Color;
  envMap: THREE.Texture | null;
  time: number;
}

export const defaultVoxelLighting: VoxelSceneLighting = {
  cameraPos: new THREE.Vector3(0, 1.6, 3.5),
  keyLightDir: new THREE.Vector3(-0.6, -1.0, -0.5).normalize(),
  keyLightColor: new THREE.Color(0xfff8ee),
  keyLightIntensity: 1.45,
  playerLightPos: new THREE.Vector3(0, 1.6, 3.5),
  playerLightColor: new THREE.Color(0xfffaf0),
  playerLightIntensity: 2.8,
  playerLightRadius: 32.0,
  fillLightDir: new THREE.Vector3(0.6, -0.8, 0.4).normalize(),
  fillLightColor: new THREE.Color(0x93c5fd),
  rimLightDir: new THREE.Vector3(0.7, -0.9, 0.8).normalize(),
  rimLightColor: new THREE.Color(0x38bdf8),
  ambientSky: new THREE.Color(0xffffff),
  ambientGround: new THREE.Color(0x0f172a),
  envMap: null,
  time: 0,
};

// Global registry of active BBB3005 voxel materials for batch uniform updates
const activeMaterials = new Set<THREE.ShaderMaterial>();

export function createBBB3005VoxelMaterial(options: BBB3005VoxelMaterialOptions): THREE.ShaderMaterial {
  const isGhost = options.isGhost ?? false;
  const ghostValid = options.ghostValid ?? true;
  const materialType = options.materialType ?? 'BASIC';
  const color = new THREE.Color(options.color);

  let matTypeInt = 0;
  if (materialType === 'GLASS') matTypeInt = 1;
  else if (materialType === 'METALLIC') matTypeInt = 2;
  else if (materialType === 'RUBBER') matTypeInt = 3;

  const roughness = materialType === 'GLASS' ? 0.04 : (materialType === 'RUBBER' ? 0.85 : 0.20);
  const metalness = materialType === 'METALLIC' ? 0.85 : 0.0;
  const clearcoat = materialType === 'RUBBER' ? 0.0 : 1.0;
  const clearcoatRoughness = materialType === 'GLASS' ? 0.02 : 0.10;

  const uniforms = {
    uColor: { value: new THREE.Vector3(color.r, color.g, color.b) },
    uRoughness: { value: roughness },
    uMetalness: { value: metalness },
    uClearcoat: { value: clearcoat },
    uClearcoatRoughness: { value: clearcoatRoughness },
    uMaterialType: { value: matTypeInt },
    uOpacity: { value: options.opacity ?? 1.0 },
    uIsGhost: { value: isGhost ? 1.0 : 0.0 },
    uGhostValid: { value: ghostValid ? 1.0 : 0.0 },
    uTime: { value: defaultVoxelLighting.time },

    uCameraPos: { value: defaultVoxelLighting.cameraPos.clone() },
    uKeyLightDir: { value: defaultVoxelLighting.keyLightDir.clone() },
    uKeyLightColor: { value: new THREE.Vector3(defaultVoxelLighting.keyLightColor.r, defaultVoxelLighting.keyLightColor.g, defaultVoxelLighting.keyLightColor.b) },
    uKeyLightIntensity: { value: defaultVoxelLighting.keyLightIntensity },

    uPlayerLightPos: { value: defaultVoxelLighting.playerLightPos.clone() },
    uPlayerLightColor: { value: new THREE.Vector3(defaultVoxelLighting.playerLightColor.r, defaultVoxelLighting.playerLightColor.g, defaultVoxelLighting.playerLightColor.b) },
    uPlayerLightIntensity: { value: defaultVoxelLighting.playerLightIntensity },
    uPlayerLightRadius: { value: defaultVoxelLighting.playerLightRadius },

    uFillLightDir: { value: defaultVoxelLighting.fillLightDir.clone() },
    uFillLightColor: { value: new THREE.Vector3(defaultVoxelLighting.fillLightColor.r, defaultVoxelLighting.fillLightColor.g, defaultVoxelLighting.fillLightColor.b) },

    uRimLightDir: { value: defaultVoxelLighting.rimLightDir.clone() },
    uRimLightColor: { value: new THREE.Vector3(defaultVoxelLighting.rimLightColor.r, defaultVoxelLighting.rimLightColor.g, defaultVoxelLighting.rimLightColor.b) },

    uAmbientSky: { value: new THREE.Vector3(defaultVoxelLighting.ambientSky.r, defaultVoxelLighting.ambientSky.g, defaultVoxelLighting.ambientSky.b) },
    uAmbientGround: { value: new THREE.Vector3(defaultVoxelLighting.ambientGround.r, defaultVoxelLighting.ambientGround.g, defaultVoxelLighting.ambientGround.b) },

    uEnvMap: { value: options.envMap ?? defaultVoxelLighting.envMap },
    uEnvIntensity: { value: 1.15 },
    uHasEnvMap: { value: (options.envMap ?? defaultVoxelLighting.envMap) ? 1.0 : 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VOXEL_VERTEX_SHADER,
    fragmentShader: VOXEL_FRAGMENT_SHADER,
    uniforms,
    transparent: isGhost || materialType === 'GLASS',
    depthWrite: !isGhost,
    depthTest: true,
    side: THREE.FrontSide,
  });

  // Track active material
  activeMaterials.add(material);

  material.addEventListener('dispose', () => {
    activeMaterials.delete(material);
  });

  return material;
}

export function updateAllVoxelMaterialsLighting(lighting: Partial<VoxelSceneLighting>) {
  if (lighting.time !== undefined) defaultVoxelLighting.time = lighting.time;
  if (lighting.cameraPos) defaultVoxelLighting.cameraPos.copy(lighting.cameraPos);
  if (lighting.keyLightDir) defaultVoxelLighting.keyLightDir.copy(lighting.keyLightDir);
  if (lighting.keyLightColor) defaultVoxelLighting.keyLightColor.copy(lighting.keyLightColor);
  if (lighting.keyLightIntensity !== undefined) defaultVoxelLighting.keyLightIntensity = lighting.keyLightIntensity;
  if (lighting.playerLightPos) defaultVoxelLighting.playerLightPos.copy(lighting.playerLightPos);
  if (lighting.playerLightColor) defaultVoxelLighting.playerLightColor.copy(lighting.playerLightColor);
  if (lighting.playerLightIntensity !== undefined) defaultVoxelLighting.playerLightIntensity = lighting.playerLightIntensity;
  if (lighting.playerLightRadius !== undefined) defaultVoxelLighting.playerLightRadius = lighting.playerLightRadius;
  if (lighting.envMap !== undefined) defaultVoxelLighting.envMap = lighting.envMap;

  for (const mat of activeMaterials) {
    if (lighting.time !== undefined && mat.uniforms.uTime) {
      mat.uniforms.uTime.value = lighting.time;
    }
    if (lighting.cameraPos && mat.uniforms.uCameraPos) {
      mat.uniforms.uCameraPos.value.copy(lighting.cameraPos);
    }
    if (lighting.keyLightDir && mat.uniforms.uKeyLightDir) {
      mat.uniforms.uKeyLightDir.value.copy(lighting.keyLightDir);
    }
    if (lighting.playerLightPos && mat.uniforms.uPlayerLightPos) {
      mat.uniforms.uPlayerLightPos.value.copy(lighting.playerLightPos);
    }
    if (lighting.playerLightIntensity !== undefined && mat.uniforms.uPlayerLightIntensity) {
      mat.uniforms.uPlayerLightIntensity.value = lighting.playerLightIntensity;
    }
    if (lighting.envMap !== undefined && mat.uniforms.uEnvMap) {
      mat.uniforms.uEnvMap.value = lighting.envMap;
      mat.uniforms.uHasEnvMap.value = lighting.envMap ? 1.0 : 0.0;
    }
  }
}
