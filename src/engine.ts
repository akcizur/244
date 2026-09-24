import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BRICK_TYPES, BrickType, COLORS, BRICK_GRID_UNIT, BrickMaterialType } from './types';
import { playSnapSound, playRemoveSound, playRotateSound } from './audio';
import { createPlasticTextureMaps, createFloorTextures, createStudLogoBumpMap, createRadialGridMaterial } from './textures';
import { createByldr1x1Geometry, createBBB3005Geometry } from './byldrMesh';
import { createBBB3005VoxelMaterial, updateAllVoxelMaterialsLighting } from './voxelShader';

export interface CursorUpdateData {
  inCanvas: boolean;
  screenX: number;
  screenY: number;
  worldPos: THREE.Vector3 | null;
  isHoveringBrick: boolean;
  activeMode: 'BUILD' | 'ERASE';
}

export interface EngineCallbacks {
  onBrickCountChange: (count: number) => void;
  onCanUndoChange: (canUndo: boolean) => void;
  onStatusChange: (status: 'loading' | 'ready' | 'error', text?: string) => void;
  onHeightChange?: (height: number) => void;
  onEscape?: () => boolean;
  onCursorUpdate?: (data: CursorUpdateData) => void;
}

// Applies seamless box-projected UV mapping so procedural normal maps, scratches, and noises render undistorted across all faces and rounded rows
function applyUniformBrickUVs(geom: THREE.BufferGeometry) {
  const pos = geom.getAttribute('position');
  const norm = geom.getAttribute('normal');
  const uv = geom.getAttribute('uv');
  if (!pos || !norm || !uv) return;

  const count = pos.count;
  for (let i = 0; i < count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const nz = Math.abs(norm.getZ(i));

    let u = 0;
    let v = 0;
    if (ny >= nx && ny >= nz) {
      // Top or Bottom face
      u = px * 2.0;
      v = pz * 2.0;
    } else if (nx >= ny && nx >= nz) {
      // Left or Right side face
      u = pz * 2.0;
      v = py * 2.0;
    } else {
      // Front or Back face
      u = px * 2.0;
      v = py * 2.0;
    }
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

// Creates brick geometry with rounded rows (beveled fillets on top/bottom rows and smooth rounded vertical corners)
function createRoundedBoxGeometry(
  w: number,
  h: number,
  l: number,
  radius = 0.020, // Rounded vertical corners (20mm fillet)
  bevel = 0.012   // Rounded beveled rows along the perimeter (12mm fillet)
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hl = l / 2;
  const r = Math.max(0.002, Math.min(radius, hw - 0.01, hl - 0.01));

  shape.moveTo(-hw + r, -hl);
  shape.lineTo(hw - r, -hl);
  shape.quadraticCurveTo(hw, -hl, hw, -hl + r);
  shape.lineTo(hw, hl - r);
  shape.quadraticCurveTo(hw, hl, hw - r, hl);
  shape.lineTo(-hw + r, hl);
  shape.quadraticCurveTo(-hw, hl, -hw, hl - r);
  shape.lineTo(-hw, -hl + r);
  shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: Math.max(0.02, h - bevel * 2),
    bevelEnabled: true,
    bevelSegments: 5, // 5 smooth curved segments for rounded rows
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 12, // 12 segments for smooth rounded corners
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.rotateX(Math.PI / 2);
  geom.center();
  geom.computeVertexNormals();
  applyUniformBrickUVs(geom);
  return geom;
}

// Creates the hollow wall sleeve with outer rounded corners, inner cavity walls, and bottom rim
function createHollowSleeveGeometry(
  bodyW: number,
  bodyL: number,
  cavityH: number,
  wallThickness = 0.038,
  cornerRadius = 0.020
): THREE.BufferGeometry {
  const outerShape = new THREE.Shape();
  const hw = bodyW / 2;
  const hl = bodyL / 2;
  const rOut = Math.max(0.002, Math.min(cornerRadius, hw - 0.01, hl - 0.01));

  // Outer rounded rectangle (CCW)
  outerShape.moveTo(-hw + rOut, -hl);
  outerShape.lineTo(hw - rOut, -hl);
  outerShape.quadraticCurveTo(hw, -hl, hw, -hl + rOut);
  outerShape.lineTo(hw, hl - rOut);
  outerShape.quadraticCurveTo(hw, hl, hw - rOut, hl);
  outerShape.lineTo(-hw + rOut, hl);
  outerShape.quadraticCurveTo(-hw, hl, -hw, hl - rOut);
  outerShape.lineTo(-hw, -hl + rOut);
  outerShape.quadraticCurveTo(-hw, -hl, -hw + rOut, -hl);

  // Inner cavity hole (CW - clockwise so normals face inward into the cavity)
  const innerHole = new THREE.Path();
  const inHw = hw - wallThickness;
  const inHl = hl - wallThickness;
  const rIn = Math.max(0.001, rOut - wallThickness);

  innerHole.moveTo(-inHw + rIn, -inHl);
  innerHole.quadraticCurveTo(-inHw, -inHl, -inHw, -inHl + rIn);
  innerHole.lineTo(-inHw, inHl - rIn);
  innerHole.quadraticCurveTo(-inHw, inHl, -inHw + rIn, inHl);
  innerHole.lineTo(inHw - rIn, inHl);
  innerHole.quadraticCurveTo(inHw, inHl, inHw, inHl - rIn);
  innerHole.lineTo(inHw, -inHl + rIn);
  innerHole.quadraticCurveTo(inHw, -inHl, inHw - rIn, -inHl);
  innerHole.lineTo(-inHw + rIn, -inHl);

  outerShape.holes.push(innerHole);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: cavityH,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 12,
  };

  const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  geom.rotateX(-Math.PI / 2);
  geom.computeVertexNormals();
  applyUniformBrickUVs(geom);
  return geom;
}

// Creates hollow cylindrical clutch tube for inner underside cavity
function createHollowClutchTubeGeometry(
  outerRadius: number,
  innerRadius: number,
  height: number
): THREE.BufferGeometry {
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true); // CW
  ringShape.holes.push(ringHole);

  const tubeGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 24,
  });
  tubeGeo.rotateX(-Math.PI / 2);
  tubeGeo.computeVertexNormals();
  applyUniformBrickUVs(tubeGeo);
  return tubeGeo;
}

export class BrickEngine {
  public static readonly GRID_UNIT = 0.5; // 0.5m grid spacing
  public static readonly LAYER_HEIGHT = 0.2; // 0.2m layer height (1 plate = 0.2m, 1 brick = 0.6m)

  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  
  private brickModelCache: Map<string, THREE.Group> = new Map();
  private defaultBrickModel: THREE.Group | null = null;
  private ghost: THREE.Group | null = null;
  private bricks: THREE.Group[] = [];
  private undoStack: THREE.Group[] = [];

  // Theme & Lighting references
  public currentTheme: 'dark' | 'light' = 'dark';
  public realisticFx: boolean = true;
  private floorMesh: THREE.Mesh | null = null;
  private radialGridMesh: THREE.Mesh | null = null;
  private radialGridMaterial: THREE.ShaderMaterial | null = null;
  private eraseHighlightBox: THREE.BoxHelper | null = null;
  private currentHoveredBrick: THREE.Group | null = null;

  private hemiLight: THREE.HemisphereLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;

  // Postprocessing & Screen Space Ambient Occlusion (SSAO)
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private ssaoPass: SSAOPass | null = null;
  private outputPass: OutputPass | null = null;
  public ssaoEnabled: boolean = true;

  // Soft Dynamic Shadow System & Sunlight Angle
  public sunAngle: number = 65; // degrees (azimuth 0 - 360)
  public sunElevation: number = 42; // degrees (elevation 15 - 75)
  public dynamicSunOrbit: boolean = false;

  // Auto Cursor Integration
  public autoCursorEnabled: boolean = true;
  public mouseScreenPos: THREE.Vector2 = new THREE.Vector2(0, 0);
  public isCursorInCanvas: boolean = false;
  public lastMouseClientX: number = 0;
  public lastMouseClientY: number = 0;
  public hoveredWorldPos: THREE.Vector3 | null = null;

  // Window event listeners for cleanup
  private onKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private onKeyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private onMouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseUpHandler: ((e: MouseEvent) => void) | null = null;
  private onWheelHandler: ((e: WheelEvent) => void) | null = null;
  private onContextMenuHandler: ((e: MouseEvent) => void) | null = null;

  // PBR Texture maps
  private plasticRoughnessMap: THREE.CanvasTexture | null = null;
  private plasticBumpMap: THREE.CanvasTexture | null = null;
  private studLogoBumpMap: THREE.CanvasTexture | null = null;
  
  // Real player eye height: 1.6m above floor.
  // 1x1 brick (3005) is 0.5m x 0.5m x 0.6m. Stacking 3 bricks = 1.8m (just above eye level)
  public readonly EYE_HEIGHT = 1.6;
  public playerHeight = 1.6;
  public minPlayerHeight = 0.6;
  public maxPlayerHeight = 16.0;

  private MOVE_SPEED = 0.08;
  private LOOK_SPEED = 0.003;
  
  public mode: 'BUILD' | 'ERASE' = 'BUILD';
  public colorIdx: number = 0;
  public materialType: BrickMaterialType = 'BASIC';
  public rotation: number = 0; // 0, 1, 2, 3
  public brickTypeId: string = 'bb3005';
  public soundEnabled: boolean = true;
  
  private input = {
    forward: 0,
    side: 0,
    pitch: 0,
    yaw: 0,
    lastX: 0 as number | null,
    lastY: 0 as number | null,
  };
  
  private keysDown = new Set<string>();
  private isPointerLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private animationFrameId: number | null = null;
  private callbacks: EngineCallbacks;
  private isDestroyed = false;

  // Placement sparkling particle bursts
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private playerLight: THREE.PointLight | null = null;

  // Generates photorealistic studio HDR softbox environment reflections
  private createStudioEnvironment(): THREE.Texture {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0f1522);

    // Large main overhead studio diffuser softbox
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    topSoftbox.position.set(0, 14, 0);
    topSoftbox.rotation.x = Math.PI / 2;
    envScene.add(topSoftbox);

    // Key front-left tall strip softbox for crisp specular edge highlights on brick bevels
    const leftStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 18),
      new THREE.MeshBasicMaterial({ color: 0xfffaf2 })
    );
    leftStrip.position.set(-10, 8, 6);
    leftStrip.lookAt(0, 3, 0);
    envScene.add(leftStrip);

    // Cool fill softbox (right)
    const rightSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 14),
      new THREE.MeshBasicMaterial({ color: 0xdbeafe })
    );
    rightSoftbox.position.set(11, 8, -4);
    rightSoftbox.lookAt(0, 2, 0);
    envScene.add(rightSoftbox);

    // Back rim accent softbox for transparent glass refractions & rim sheen
    const backRim = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 8),
      new THREE.MeshBasicMaterial({ color: 0x93c5fd })
    );
    backRim.position.set(0, 6, -14);
    backRim.lookAt(0, 2, 0);
    envScene.add(backRim);

    const texture = pmremGenerator.fromScene(envScene, 0.04).texture;
    pmremGenerator.dispose();
    return texture;
  }

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    
    // Scene setup with deep dark slate background and subtle crisp linear distance fog ("do dálky do ztracena")
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);
    this.scene.fog = new THREE.Fog(0x0a0e17, 16, 42);

    // Camera: Real human eye height (1.6m), standing 3.5m back
    const aspect = container.clientWidth / container.clientHeight || window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.05, 500);
    this.camera.position.set(0, this.EYE_HEIGHT, 3.5);

    // Renderer: High precision with soft contact shadows and ACES filmic tonemapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; // Realistic soft contact shadows
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    // Setup Postprocessing Effect Composer with Screen Space Ambient Occlusion (SSAO)
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
    this.ssaoPass.kernelRadius = 0.38; // 38cm in world units: deep definition for brick crevices & studs
    this.ssaoPass.minDistance = 0.001; // Catch micro-gaps between bricks (hairline seam)
    this.ssaoPass.maxDistance = 0.22;
    this.ssaoPass.output = SSAOPass.OUTPUT.Default;

    this.composer.addPass(this.ssaoPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // Studio IBL Environment reflections with custom softboxes
    this.scene.environment = this.createStudioEnvironment();

    this.raycaster = new THREE.Raycaster();

    // High-contrast clean studio ambient lighting
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.95);
    this.scene.add(this.hemiLight);

    // Key directional light for crisp bevel highlights and soft contact shadows
    this.keyLight = new THREE.DirectionalLight(0xfff8ee, 1.45);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 80;
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.normalBias = 0.032; // Eliminates shadow acne and delivers solid contact shadows
    this.keyLight.shadow.radius = 2.2;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);
    this.updateSunPosition();

    // Dedicated player studio spotlight / point light ("LIGHTS ONLY RADIUS PLAYER")
    this.playerLight = new THREE.PointLight(0xfffaf0, 2.8, 32, 1.4);
    this.playerLight.castShadow = false;
    this.scene.add(this.playerLight);

    // Secondary fill light for balanced contrast
    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    this.fillLight.position.set(-10, 12, -8);
    this.scene.add(this.fillLight);

    // Studio rim light for crisp edge silhouettes against dark backdrop
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    this.rimLight.position.set(-12, 16, -14);
    this.scene.add(this.rimLight);

    // Polished studio floor with subtle specular sheen and shadow reception
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x101622,
      roughness: 0.65, // Soft studio floor reflection
      metalness: 0.12,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.name = 'FLOOR';
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Procedural Grid Lines with Radial Blur Gradient falloff and anti-aliasing
    this.radialGridMaterial = createRadialGridMaterial(this.currentTheme);
    const gridGeo = new THREE.PlaneGeometry(160, 160);
    this.radialGridMesh = new THREE.Mesh(gridGeo, this.radialGridMaterial);
    this.radialGridMesh.rotation.x = -Math.PI / 2;
    this.radialGridMesh.position.y = 0.001; // Just 1mm above floor plane to sit perfectly flush
    this.radialGridMesh.renderOrder = 1;
    this.scene.add(this.radialGridMesh);

    // Setup input listeners
    this.setupWindowEvents();
    this.loadModelAndStart();
  }

  // Instant data initialization: generates procedural rounded bricks immediately
  private loadModelAndStart() {
    this.callbacks.onStatusChange('loading', 'INICIALIZACE MODELŮ...');
    
    // Procedurally pre-generate all rounded brick models instantaneously
    for (const b of BRICK_TYPES) {
      const procedural = this.generateProceduralBrickMesh(b);
      this.brickModelCache.set(b.id, procedural);
    }
    this.defaultBrickModel = this.brickModelCache.get('bb3005') || null;
    
    this.callbacks.onStatusChange('ready');
    this.updateGhost();
    this.animate();
  }

  public getBrickType(id: string): BrickType {
    const found = BRICK_TYPES.find((b) => b.id === id);
    return found || BRICK_TYPES[0];
  }

  // Generates procedural LEGO brick with hollow inner cavity, underside clutch tubes, rounded rows, and realistic textures
  private generateProceduralBrickMesh(type: BrickType): THREE.Group {
    const group = new THREE.Group();
    group.name = `Lego_Brick_${type.studsX}x${type.studsZ}`;
    const { normalMap, roughnessMap } = createPlasticTextureMaps();
    const studBumpMap = this.studLogoBumpMap || (this.studLogoBumpMap = createStudLogoBumpMap());

    // Authentic ABS injection-molded plastic matching user's canonical specification:
    // roughness: 0.2, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.20,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.10,
      clearcoatNormalMap: normalMap,
      clearcoatNormalScale: new THREE.Vector2(0.08, 0.08),
      ior: 1.54,
      reflectivity: 0.5,
      specularIntensity: 1.0,
      envMapIntensity: 1.1,
      sheen: 0.25,
      sheenRoughness: 0.25,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.06, 0.06),
      roughnessMap: roughnessMap,
      side: THREE.FrontSide,
      flatShading: false,
    });

    const studMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.10,
      clearcoatNormalMap: normalMap,
      clearcoatNormalScale: new THREE.Vector2(0.08, 0.08),
      ior: 1.54,
      reflectivity: 0.5,
      specularIntensity: 1.0,
      envMapIntensity: 1.1,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.06, 0.06),
      bumpMap: studBumpMap,
      bumpScale: 0.008,
      roughnessMap: roughnessMap,
      side: THREE.FrontSide,
      flatShading: false,
    });

    // The 1x1x1 brick is officially replaced by the BYLDR CAD Mesh (bbb_1x1x1 / BBB3005)
    if (type.id === 'bb3005' || type.id === 'bbb_1x1x1' || (type.studsX === 1 && type.studsZ === 1 && type.h >= 0.5)) {
      const byldrGeo = createBBB3005Geometry(true);
      const voxelMat = createBBB3005VoxelMaterial({
        color: 0xffffff,
        materialType: this.materialType,
        envMap: this.scene.environment,
      });
      const byldrMesh = new THREE.Mesh(byldrGeo, voxelMat);
      byldrMesh.name = 'Brick_Body';
      byldrMesh.userData.isBBB3005 = true;
      byldrMesh.castShadow = true;
      byldrMesh.receiveShadow = true;
      group.add(byldrMesh);

      return group;
    }

    // Canonical LEGO clearance seam: 0.2mm total clearance in 8.0mm stud pitch (0.0125 in 0.5m grid unit)
    // Results in exact 7.8mm x 7.8mm body for 1x1, 15.8mm for 1x2, 31.8mm for 2x4
    const SEAM_CLEARANCE = 0.0125;
    const bodyW = type.w - SEAM_CLEARANCE;
    const bodyL = type.l - SEAM_CLEARANCE;
    const bodyH = type.h;

    // Wall & roof thicknesses creating the authentic inner hollow cavity (vnitřní prostor)
    const wallThickness = 0.038;
    const roofThickness = type.h >= 0.5 ? 0.052 : 0.038;
    const cavityHeight = bodyH - roofThickness;

    // 1. Hollow Wall Perimeter Sleeve (outer rounded walls, inner cavity walls, and bottom rim)
    const sleeveGeo = createHollowSleeveGeometry(bodyW, bodyL, cavityHeight, wallThickness, 0.020);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, bodyMat);
    sleeveMesh.name = 'Brick_Body';
    sleeveMesh.position.set(0, 0, 0); // Bottom rim starts flush at y = 0.0
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    // 2. Top Roof Cap (beveled rounded rows on top, inner ceiling on bottom)
    const roofGeo = createRoundedBoxGeometry(bodyW, roofThickness, bodyL, 0.020, 0.012);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMat);
    roofMesh.name = 'Roof_Cap';
    roofMesh.position.set(0, cavityHeight + roofThickness / 2, 0); // Top of roof sits at y = bodyH
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    // 3. Real LEGO Underside Clutch System: Tubes, Pins, Reinforcing Ribs & Under-Stud Pockets
    const tubeHeight = cavityHeight - 0.004;
    const ribHeight = tubeHeight * 0.85; // Ribs taper slightly near bottom rim for smooth clutch insertion
    const inHw = (bodyW - 2 * wallThickness) / 2;
    const inHl = (bodyL - 2 * wallThickness) / 2;

    if (type.studsX >= 2 && type.studsZ >= 2) {
      // Full hollow cylindrical clutch tubes between each 2x2 stud cluster
      const outerTubeRadius = 0.158;
      const innerTubeRadius = 0.118;
      const tubeGeo = createHollowClutchTubeGeometry(outerTubeRadius, innerTubeRadius, tubeHeight);

      const numTubesX = type.studsX - 1;
      const numTubesZ = type.studsZ - 1;
      const startTubeX = -(numTubesX - 1) * BRICK_GRID_UNIT / 2;
      const startTubeZ = -(numTubesZ - 1) * BRICK_GRID_UNIT / 2;

      for (let tx = 0; tx < numTubesX; tx++) {
        for (let tz = 0; tz < numTubesZ; tz++) {
          const posX = startTubeX + tx * BRICK_GRID_UNIT;
          const posZ = startTubeZ + tz * BRICK_GRID_UNIT;
          
          // Clutch tube
          const tubeMesh = new THREE.Mesh(tubeGeo, bodyMat);
          tubeMesh.position.set(posX, 0.004, posZ);
          tubeMesh.castShadow = true;
          tubeMesh.receiveShadow = true;
          group.add(tubeMesh);

          // Internal reinforcing ribs connecting clutch tube to the side walls (authentic real LEGO mold design)
          const ribLenZ = Math.max(0.01, inHl - Math.abs(posZ) - outerTubeRadius);
          if (ribLenZ > 0.02) {
            const ribGeoZ = new THREE.BoxGeometry(0.016, ribHeight, ribLenZ);
            
            // Rib toward +Z wall
            const ribZPos = new THREE.Mesh(ribGeoZ, bodyMat);
            ribZPos.position.set(posX, cavityHeight - ribHeight / 2, posZ + outerTubeRadius + ribLenZ / 2);
            ribZPos.castShadow = true;
            ribZPos.receiveShadow = true;
            group.add(ribZPos);

            // Rib toward -Z wall
            const ribZNeg = new THREE.Mesh(ribGeoZ, bodyMat);
            ribZNeg.position.set(posX, cavityHeight - ribHeight / 2, posZ - (outerTubeRadius + ribLenZ / 2));
            ribZNeg.castShadow = true;
            ribZNeg.receiveShadow = true;
            group.add(ribZNeg);
          }

          // If 2x2 (single center tube), also add X-direction ribs connecting to left and right inner walls
          if (numTubesX === 1) {
            const ribLenX = Math.max(0.01, inHw - Math.abs(posX) - outerTubeRadius);
            if (ribLenX > 0.02) {
              const ribGeoX = new THREE.BoxGeometry(ribLenX, ribHeight, 0.016);
              const ribXPos = new THREE.Mesh(ribGeoX, bodyMat);
              ribXPos.position.set(posX + outerTubeRadius + ribLenX / 2, cavityHeight - ribHeight / 2, posZ);
              ribXPos.castShadow = true;
              ribXPos.receiveShadow = true;
              group.add(ribXPos);

              const ribXNeg = new THREE.Mesh(ribGeoX, bodyMat);
              ribXNeg.position.set(posX - (outerTubeRadius + ribLenX / 2), cavityHeight - ribHeight / 2, posZ);
              ribXNeg.castShadow = true;
              ribXNeg.receiveShadow = true;
              group.add(ribXNeg);
            }
          }
        }
      }

      // If 2x4 or longer (multiple tubes in X): add central spine ribs connecting adjacent tubes
      if (numTubesX > 1) {
        const gapBetweenTubes = BRICK_GRID_UNIT - outerTubeRadius * 2;
        if (gapBetweenTubes > 0.02) {
          const spineGeo = new THREE.BoxGeometry(gapBetweenTubes, ribHeight * 0.9, 0.016);
          for (let tx = 0; tx < numTubesX - 1; tx++) {
            const spineX = startTubeX + (tx + 0.5) * BRICK_GRID_UNIT;
            const spineMesh = new THREE.Mesh(spineGeo, bodyMat);
            spineMesh.position.set(spineX, cavityHeight - ribHeight * 0.45, 0);
            spineMesh.castShadow = true;
            spineMesh.receiveShadow = true;
            group.add(spineMesh);
          }
        }
      }
    } else if ((type.studsX >= 2 && type.studsZ === 1) || (type.studsX === 1 && type.studsZ >= 2)) {
      // Real LEGO 1xN construction: Center clutch pins with transverse grip ribs
      const pinRadius = 0.075;
      const pinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius, tubeHeight, 20);
      pinGeo.computeVertexNormals();
      applyUniformBrickUVs(pinGeo);

      const isAlongX = type.studsX > 1;
      const numPins = isAlongX ? type.studsX - 1 : type.studsZ - 1;
      const startPin = -(numPins - 1) * BRICK_GRID_UNIT / 2;

      for (let p = 0; p < numPins; p++) {
        const offset = startPin + p * BRICK_GRID_UNIT;
        const posX = isAlongX ? offset : 0;
        const posZ = isAlongX ? 0 : offset;
        
        const pinMesh = new THREE.Mesh(pinGeo, bodyMat);
        pinMesh.position.set(posX, 0.004 + tubeHeight / 2, posZ);
        pinMesh.castShadow = true;
        pinMesh.receiveShadow = true;
        group.add(pinMesh);

        // Transverse grip ribs anchoring the pin to the inner side walls
        const wallDist = isAlongX ? inHl : inHw;
        const ribLen = Math.max(0.01, wallDist - pinRadius);
        if (ribLen > 0.01) {
          const ribGeo = isAlongX
            ? new THREE.BoxGeometry(0.016, ribHeight, ribLen)
            : new THREE.BoxGeometry(ribLen, ribHeight, 0.016);

          const rib1 = new THREE.Mesh(ribGeo, bodyMat);
          const rib2 = new THREE.Mesh(ribGeo, bodyMat);
          if (isAlongX) {
            rib1.position.set(posX, cavityHeight - ribHeight / 2, pinRadius + ribLen / 2);
            rib2.position.set(posX, cavityHeight - ribHeight / 2, -(pinRadius + ribLen / 2));
          } else {
            rib1.position.set(pinRadius + ribLen / 2, cavityHeight - ribHeight / 2, posZ);
            rib2.position.set(-(pinRadius + ribLen / 2), cavityHeight - ribHeight / 2, posZ);
          }
          rib1.castShadow = true;
          rib1.receiveShadow = true;
          rib2.castShadow = true;
          rib2.receiveShadow = true;
          group.add(rib1);
          group.add(rib2);
        }
      }
    } else {
      // Real LEGO 1x1 construction: 4 interior corner clutch fillets for gripping round stud
      const cornerSize = 0.045;
      const cornerGeo = new THREE.BoxGeometry(cornerSize, tubeHeight, cornerSize);
      const cx = inHw - cornerSize / 2;
      const cz = inHl - cornerSize / 2;
      const corners = [
        [-cx, -cz],
        [cx, -cz],
        [-cx, cz],
        [cx, cz],
      ];
      corners.forEach(([x, z]) => {
        const cMesh = new THREE.Mesh(cornerGeo, bodyMat);
        cMesh.position.set(x, 0.004 + tubeHeight / 2, z);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        group.add(cMesh);
      });
    }

    // 4. Under-Stud Ceiling Pockets (authentic circular indentations in cavity ceiling under each stud)
    const ceilingPocketGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.012, 24);
    ceilingPocketGeo.computeVertexNormals();
    applyUniformBrickUVs(ceilingPocketGeo);

    const startX = -(type.w / 2) + BRICK_GRID_UNIT / 2;
    const startZ = -(type.l / 2) + BRICK_GRID_UNIT / 2;

    for (let x = 0; x < type.studsX; x++) {
      for (let z = 0; z < type.studsZ; z++) {
        const posX = startX + x * BRICK_GRID_UNIT;
        const posZ = startZ + z * BRICK_GRID_UNIT;

        // Internal under-stud ceiling socket
        const pocketMesh = new THREE.Mesh(ceilingPocketGeo, bodyMat);
        pocketMesh.position.set(posX, cavityHeight - 0.006, posZ);
        pocketMesh.castShadow = true;
        pocketMesh.receiveShadow = true;
        group.add(pocketMesh);
      }
    }

    // 5. Authentic Studs on Top of the Roof (exact 2.4mm radius, 1.8mm height in 8mm grid -> 0.15 radius, 0.1125 height in 0.5m engine units)
    const studRadius = 0.15;
    const studHeight = 0.1125;
    const studGeo = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 32);
    // Smooth rounded bevel rim on stud cap
    const studCapGeo = new THREE.CylinderGeometry(studRadius * 0.94, studRadius, 0.008, 32);

    for (let x = 0; x < type.studsX; x++) {
      for (let z = 0; z < type.studsZ; z++) {
        const posX = startX + x * BRICK_GRID_UNIT;
        const posZ = startZ + z * BRICK_GRID_UNIT;
        const posY = type.h + studHeight / 2;

        const studMesh = new THREE.Mesh(studGeo, bodyMat);
        studMesh.name = type.studsX * type.studsZ === 1 ? 'Top_Stud' : `Top_Stud_${x}_${z}`;
        studMesh.position.set(posX, posY, posZ);
        studMesh.castShadow = true;
        studMesh.receiveShadow = true;
        group.add(studMesh);

        const capMesh = new THREE.Mesh(studCapGeo, studMat);
        capMesh.name = 'Top_Stud_Cap';
        capMesh.position.set(posX, type.h + studHeight + 0.004, posZ);
        capMesh.castShadow = true;
        capMesh.receiveShadow = true;
        group.add(capMesh);
      }
    }

    return group;
  }

  private getModelForType(typeId: string): THREE.Group {
    if (this.brickModelCache.has(typeId)) {
      return this.brickModelCache.get(typeId)!;
    }
    const type = this.getBrickType(typeId);
    const procedural = this.generateProceduralBrickMesh(type);
    this.brickModelCache.set(typeId, procedural);
    return procedural;
  }

  public setMaterialType(mat: BrickMaterialType) {
    this.materialType = mat;
    this.updateGhost();
  }

  public createBrick(
    colorHex: number,
    isGhost = false,
    rotation = 0,
    typeId = this.brickTypeId,
    materialType: BrickMaterialType = this.materialType
  ): THREE.Group {
    const group = new THREE.Group();
    const type = this.getBrickType(typeId);
    const baseModel = this.getModelForType(typeId);
    const model = baseModel.clone(true);
    const { normalMap, roughnessMap } = createPlasticTextureMaps();
    const studBumpMap = this.studLogoBumpMap || (this.studLogoBumpMap = createStudLogoBumpMap());

    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const isBBB3005 = mesh.userData.isBBB3005 || type.id === 'bb3005' || type.id === 'bbb_1x1x1';

        if (isBBB3005) {
          mesh.material = createBBB3005VoxelMaterial({
            color: colorHex,
            materialType,
            isGhost,
            ghostValid: this.mode === 'BUILD',
            envMap: this.scene.environment,
          });
          mesh.castShadow = !isGhost;
          mesh.receiveShadow = !isGhost;
          return;
        }

        if (isGhost) {
          if (materialType === 'GLASS') {
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: this.mode === 'BUILD' ? colorHex : 0xef4444,
              transmission: 0.90,
              opacity: 0.70,
              transparent: true,
              roughness: 0.05,
              ior: 1.52,
              thickness: 0.08,
              clearcoat: 0.95,
              clearcoatRoughness: 0.03,
              envMapIntensity: 2.2,
              side: THREE.DoubleSide,
            });
          } else {
            mesh.material = new THREE.MeshBasicMaterial({
              color: this.mode === 'BUILD' ? 0x10b981 : 0xef4444,
              transparent: true,
              opacity: 0.48,
              side: THREE.DoubleSide,
            });
          }
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        } else {
          const isStudCap =
            mesh.geometry instanceof THREE.CylinderGeometry &&
            (mesh.geometry as THREE.CylinderGeometry).parameters.height < 0.015;

          if (materialType === 'GLASS') {
            // Authentic Translucent / Glass LEGO brick (polycarbonate/acrylic with physical ray transmission & hollow cavity refraction)
            const glassMat = new THREE.MeshPhysicalMaterial({
              color: colorHex,
              roughness: isStudCap ? 0.04 : 0.02,
              metalness: 0.0,
              transmission: 0.97, // High light transmission for crystal semi-transparency
              transparent: true,
              opacity: 1.0,
              ior: 1.52, // Optical acrylic / polycarbonate
              thickness: 0.075, // Physical wall thickness (7.5cm world scale) - enables true semi-transparent translucency without darkness!
              attenuationColor: new THREE.Color(colorHex),
              attenuationDistance: 0.95, // Rich color depth in thicker areas (edges & tubes)
              clearcoat: 1.0,
              clearcoatRoughness: 0.02,
              clearcoatNormalMap: normalMap,
              clearcoatNormalScale: new THREE.Vector2(0.18, 0.18),
              specularIntensity: 1.0,
              specularColor: new THREE.Color(0xffffff),
              envMapIntensity: 2.8,
              normalMap: normalMap,
              normalScale: new THREE.Vector2(0.32, 0.32),
              roughnessMap: roughnessMap,
              bumpMap: isStudCap ? studBumpMap : null,
              bumpScale: isStudCap ? 0.007 : 0,
              side: THREE.DoubleSide, // Essential for hollow cavity and inner wall transmission!
              depthWrite: true,
              flatShading: false,
            });
            (glassMat as any).dispersion = 0.018; // Physical chromatic aberration dispersion
            mesh.material = glassMat;
          } else {
            // Realistic injection-molded ABS plastic matching user's canonical specification:
            // roughness: 0.2, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: colorHex,
              roughness: isStudCap ? 0.18 : 0.20,
              metalness: 0.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.10,
              clearcoatNormalMap: normalMap,
              clearcoatNormalScale: new THREE.Vector2(0.08, 0.08),
              ior: 1.54,
              reflectivity: 0.5,
              specularIntensity: 1.0,
              specularColor: new THREE.Color(0xffffff),
              sheen: 0.25,
              sheenRoughness: 0.25,
              sheenColor: new THREE.Color(colorHex),
              envMapIntensity: 1.1,
              normalMap: normalMap,
              normalScale: new THREE.Vector2(0.06, 0.06),
              roughnessMap: roughnessMap,
              bumpMap: isStudCap ? studBumpMap : null,
              bumpScale: isStudCap ? 0.008 : 0,
              side: THREE.FrontSide,
              flatShading: false,
            });
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      }
    });

    // Base & horizontal alignment: model is already centered at (0, 0) and bottom is at y = 0.0
    model.position.set(0, 0, 0);

    group.add(model);
    group.rotation.y = rotation * (Math.PI / 2);

    const isRotated = rotation % 2 !== 0;
    group.userData = {
      typeId: type.id,
      w: isRotated ? type.l : type.w,
      l: isRotated ? type.w : type.l,
      h: type.h,
      materialType: materialType,
    };

    return group;
  }

  // Dynamic theme switching between Dark (default) and Light
  public setTheme(theme: 'dark' | 'light') {
    this.currentTheme = theme;
    if (theme === 'dark') {
      this.scene.background = new THREE.Color(0x0a0e17);
      this.scene.fog = new THREE.Fog(0x0a0e17, 14, 38);
      if (this.floorMesh) {
        (this.floorMesh.material as THREE.MeshStandardMaterial).color.set(0x101622);
        (this.floorMesh.material as THREE.MeshStandardMaterial).roughness = this.realisticFx ? 0.65 : 0.88;
        (this.floorMesh.material as THREE.MeshStandardMaterial).metalness = this.realisticFx ? 0.12 : 0.05;
      }
      if (this.radialGridMaterial) {
        this.radialGridMaterial.uniforms.uTheme.value = 0.0;
        this.radialGridMaterial.uniforms.uColorMinor.value.set(0x223048);
        this.radialGridMaterial.uniforms.uColorMajor.value.set(0x10b981);
      }
      if (this.hemiLight) {
        this.hemiLight.color.set(0xffffff);
        this.hemiLight.groundColor.set(0x0a0e17);
        this.hemiLight.intensity = 0.85;
      }
      if (this.keyLight) {
        this.keyLight.color.set(0xffffff);
        this.keyLight.intensity = 1.25;
      }
      if (this.playerLight) {
        this.playerLight.color.setHex(0xffffff);
      }
      if (this.rimLight) {
        this.rimLight.color.set(0x93c5fd);
      }
    } else {
      this.scene.background = new THREE.Color(0xf1f5f9);
      this.scene.fog = new THREE.Fog(0xf1f5f9, 14, 38);
      if (this.floorMesh) {
        (this.floorMesh.material as THREE.MeshStandardMaterial).color.set(0xe2e8f0);
        (this.floorMesh.material as THREE.MeshStandardMaterial).roughness = this.realisticFx ? 0.50 : 0.80;
        (this.floorMesh.material as THREE.MeshStandardMaterial).metalness = this.realisticFx ? 0.08 : 0.02;
      }
      if (this.radialGridMaterial) {
        this.radialGridMaterial.uniforms.uTheme.value = 1.0;
        this.radialGridMaterial.uniforms.uColorMinor.value.set(0x94a3b8);
        this.radialGridMaterial.uniforms.uColorMajor.value.set(0x059669);
      }
      if (this.hemiLight) {
        this.hemiLight.color.set(0xffffff);
        this.hemiLight.groundColor.set(0xe2e8f0);
        this.hemiLight.intensity = 0.95;
      }
      if (this.keyLight) {
        this.keyLight.color.set(0xffffff);
        this.keyLight.intensity = 1.15;
      }
      if (this.playerLight) {
        this.playerLight.color.setHex(0xfffaf0);
      }
      if (this.rimLight) {
        this.rimLight.color.set(0x60a5fa);
      }
    }
  }

  // Toggle realistic scene effects (soft contact shadows, rim lighting, floor sheen)
  public setRealisticFx(enabled: boolean) {
    this.realisticFx = enabled;
    this.renderer.shadowMap.enabled = enabled;
    if (this.keyLight) {
      this.keyLight.castShadow = enabled;
    }
    if (this.rimLight) {
      this.rimLight.visible = enabled;
    }
    if (this.floorMesh) {
      const mat = this.floorMesh.material as THREE.MeshStandardMaterial;
      if (this.currentTheme === 'dark') {
        mat.roughness = enabled ? 0.65 : 0.88;
        mat.metalness = enabled ? 0.12 : 0.05;
      } else {
        mat.roughness = enabled ? 0.50 : 0.80;
        mat.metalness = enabled ? 0.08 : 0.02;
      }
      mat.needsUpdate = true;
    }
    this.updateSunPosition();
  }

  // Toggle Screen Space Ambient Occlusion (SSAO)
  public setSSAOEnabled(enabled: boolean) {
    this.ssaoEnabled = enabled;
  }

  // Set sunlight angle (azimuth 0 - 360 deg) and optional elevation (15 - 75 deg)
  public setSunAngle(angle: number, elevation?: number) {
    this.sunAngle = ((angle % 360) + 360) % 360;
    if (elevation !== undefined) {
      this.sunElevation = Math.max(15, Math.min(78, elevation));
    }
    this.updateSunPosition();
  }

  // Toggle continuous dynamic orbit of the sun
  public setDynamicSunOrbit(enabled: boolean) {
    this.dynamicSunOrbit = enabled;
  }

  // Calculates dynamic sunlight angle and automatically fits shadow frustum around bricks
  public updateSunPosition() {
    if (!this.keyLight) return;
    const radAzimuth = THREE.MathUtils.degToRad(this.sunAngle);
    const radElevation = THREE.MathUtils.degToRad(this.sunElevation);
    const distance = 32;

    const x = Math.cos(radAzimuth) * Math.cos(radElevation) * distance;
    const y = Math.max(7, Math.sin(radElevation) * distance);
    const z = Math.sin(radAzimuth) * Math.cos(radElevation) * distance;

    this.keyLight.position.set(x, y, z);

    // Calculate center of bricks to focus shadow camera and light target
    let targetX = 0;
    let targetY = 0.5;
    let targetZ = 0;

    if (this.bricks.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      for (const b of this.bricks) {
        minX = Math.min(minX, b.position.x - b.userData.w / 2);
        maxX = Math.max(maxX, b.position.x + b.userData.w / 2);
        minY = Math.min(minY, b.position.y - b.userData.h / 2);
        maxY = Math.max(maxY, b.position.y + b.userData.h / 2);
        minZ = Math.min(minZ, b.position.z - b.userData.l / 2);
        maxZ = Math.max(maxZ, b.position.z + b.userData.l / 2);
      }

      targetX = (minX + maxX) / 2;
      targetY = (minY + maxY) / 2;
      targetZ = (minZ + maxZ) / 2;

      // Dynamically fit shadow frustum tightly around the build for maximum shadow sharpness
      const maxDim = Math.max(maxX - minX, maxZ - minZ, maxY - minY, 8);
      const halfSize = Math.max(8, (maxDim / 2) * 1.5 + 4);
      const cam = this.keyLight.shadow.camera;
      cam.left = -halfSize;
      cam.right = halfSize;
      cam.top = halfSize;
      cam.bottom = -halfSize;
      cam.near = 1;
      cam.far = distance * 2.2;
      cam.updateProjectionMatrix();
    } else {
      const cam = this.keyLight.shadow.camera;
      cam.left = -16;
      cam.right = 16;
      cam.top = 16;
      cam.bottom = -16;
      cam.near = 1;
      cam.far = distance * 2.2;
      cam.updateProjectionMatrix();
    }

    this.keyLight.target.position.set(targetX, targetY, targetZ);
    this.keyLight.target.updateMatrixWorld();

    // Secondary fill light position moves opposite to sun
    if (this.fillLight) {
      this.fillLight.position.set(-x * 0.6, 12, -z * 0.6);
    }
    // Rim light highlights brick edges from behind
    if (this.rimLight) {
      this.rimLight.position.set(-x * 0.8, 16, -z * 0.8);
    }

    // Dynamic sun warmth and intensity depending on sun elevation angle
    if (this.currentTheme === 'dark') {
      if (this.sunElevation < 30) {
        this.keyLight.color.set(0xffdfb8); // Warm sunrise/sunset
        this.keyLight.intensity = 1.12;
      } else {
        this.keyLight.color.set(0xffffff);
        this.keyLight.intensity = 1.25;
      }
    } else {
      if (this.sunElevation < 30) {
        this.keyLight.color.set(0xffeedd);
        this.keyLight.intensity = 1.05;
      } else {
        this.keyLight.color.set(0xffffff);
        this.keyLight.intensity = 1.15;
      }
    }
  }

  private checkCollision(pos: THREE.Vector3, w: number, l: number, h: number, exclude: THREE.Group | null = null): boolean {
    const margin = 0.015; // 15mm tolerance ensures adjacent flush bricks do not falsely collide
    const boxCenter = new THREE.Vector3(pos.x, pos.y + h / 2, pos.z);
    const b1 = new THREE.Box3().setFromCenterAndSize(
      boxCenter,
      new THREE.Vector3(Math.max(0.04, w - margin), Math.max(0.04, h - margin), Math.max(0.04, l - margin))
    );

    for (const b of this.bricks) {
      if (b === exclude) continue;
      const bw = b.userData.w;
      const bl = b.userData.l;
      const bh = b.userData.h;
      const otherCenter = new THREE.Vector3(b.position.x, b.position.y + bh / 2, b.position.z);
      const b2 = new THREE.Box3().setFromCenterAndSize(
        otherCenter,
        new THREE.Vector3(Math.max(0.04, bw - margin), Math.max(0.04, bh - margin), Math.max(0.04, bl - margin))
      );
      if (b1.intersectsBox(b2)) return true;
    }
    return false;
  }

  // Calculate snapped coordinate for a given coordinate & dimension along grid step (0.5m)
  public snapToGrid(coord: number, dim: number): number {
    const studs = Math.round(dim / BRICK_GRID_UNIT);
    if (studs % 2 === 1) {
      // Odd number of studs (e.g. 1 stud = 0.5m): center sits at half-grid points (..., -0.75, -0.25, 0.25, 0.75, ...)
      return (Math.round((coord - 0.25) / BRICK_GRID_UNIT) * BRICK_GRID_UNIT) + 0.25;
    } else {
      // Even number of studs (e.g. 2 studs = 1.0m): center sits at whole grid steps (..., -1.0, -0.5, 0.0, 0.5, 1.0, ...)
      return Math.round(coord / BRICK_GRID_UNIT) * BRICK_GRID_UNIT;
    }
  }

  public performAction(ndc?: THREE.Vector2) {
    const screenCoord = ndc || (this.autoCursorEnabled && this.isCursorInCanvas ? this.mouseScreenPos : new THREE.Vector2(0, 0));
    this.raycaster.setFromCamera(screenCoord, this.camera);
    const floorObj = this.scene.getObjectByName('FLOOR');
    const intersects = this.raycaster.intersectObjects(floorObj ? [floorObj, ...this.bricks] : this.bricks, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let target: THREE.Object3D | null = hit.object;
      while (target && target.parent && target.parent !== this.scene && target.name !== 'FLOOR') {
        target = target.parent;
      }

      if (!target) return;

      if (this.mode === 'BUILD') {
        const activeColor = COLORS[this.colorIdx]?.hex ?? 0xde1a24;
        const b = this.createBrick(activeColor, false, this.rotation, this.brickTypeId, this.materialType);
        
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);

        let snapX: number;
        let snapZ: number;
        let snapY: number;

        if (target.name === 'FLOOR') {
          const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));
          snapX = this.snapToGrid(p.x, b.userData.w);
          snapZ = this.snapToGrid(p.z, b.userData.l);
          snapY = 0.0; // Sits directly on floor plate plane
        } else {
          if (Math.abs(normal.y) > 0.5) {
            const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));
            snapX = this.snapToGrid(p.x, b.userData.w);
            snapZ = this.snapToGrid(p.z, b.userData.l);
            if (normal.y > 0) {
              snapY = target.position.y + target.userData.h; // Bottom sits flush on top of lower brick
            } else {
              snapY = Math.max(0.0, target.position.y - b.userData.h);
            }
          } else {
            // Side face attachment
            const dimAlongNormal = Math.abs(normal.x) > 0.5 ? b.userData.w : b.userData.l;
            const p = hit.point.clone().add(normal.clone().multiplyScalar(dimAlongNormal / 2 + 0.04));
            snapX = this.snapToGrid(p.x, b.userData.w);
            snapZ = this.snapToGrid(p.z, b.userData.l);
            const layerBottom = Math.max(0.0, Math.round(hit.point.y / BrickEngine.LAYER_HEIGHT) * BrickEngine.LAYER_HEIGHT);
            snapY = layerBottom;
          }
        }

        const finalPos = new THREE.Vector3(snapX, snapY, snapZ);
        if (!this.checkCollision(finalPos, b.userData.w, b.userData.l, b.userData.h)) {
          b.position.copy(finalPos);
          this.scene.add(b);
          this.bricks.push(b);
          this.undoStack.push(b);
          this.updateSunPosition();
          playSnapSound(this.soundEnabled);
          this.spawnPlacementParticles(new THREE.Vector3(finalPos.x, finalPos.y + b.userData.h, finalPos.z), activeColor);
          this.callbacks.onBrickCountChange(this.bricks.length);
          this.callbacks.onCanUndoChange(this.undoStack.length > 0);
          if (this.ghost) {
            this.ghost.visible = false;
          }
        }
      } else if (this.mode === 'ERASE' && target.name !== 'FLOOR') {
        const brickGroup = target as THREE.Group;
        if (this.eraseHighlightBox) {
          this.eraseHighlightBox.visible = false;
        }
        this.scene.remove(brickGroup);
        this.bricks = this.bricks.filter((x) => x !== brickGroup);
        this.undoStack = this.undoStack.filter((x) => x !== brickGroup);
        this.updateSunPosition();
        playRemoveSound(this.soundEnabled);
        this.callbacks.onBrickCountChange(this.bricks.length);
        this.callbacks.onCanUndoChange(this.undoStack.length > 0);
      }
    }
  }

  // Sparkling placement particle burst
  private spawnPlacementParticles(pos: THREE.Vector3, colorHex: number) {
    const count = 10;
    const pGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });

    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat.clone());
      pMesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.1) * 0.25,
        (Math.random() - 0.5) * 0.4
      ));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.6 + 0.6,
        (Math.random() - 0.5) * 1.5
      );
      this.scene.add(pMesh);
      this.particles.push({ mesh: pMesh, vel, life: 0, maxLife: 0.4 });
    }
  }

  public undo() {
    const last = this.undoStack.pop();
    if (last) {
      this.scene.remove(last);
      this.bricks = this.bricks.filter((b) => b !== last);
      this.updateSunPosition();
      playRemoveSound(this.soundEnabled);
      this.callbacks.onBrickCountChange(this.bricks.length);
      this.callbacks.onCanUndoChange(this.undoStack.length > 0);
      this.updateGhost();
    }
  }

  public clearAll() {
    for (const b of this.bricks) {
      this.scene.remove(b);
    }
    this.bricks = [];
    this.undoStack = [];
    this.updateSunPosition();
    playRemoveSound(this.soundEnabled);
    this.callbacks.onBrickCountChange(0);
    this.callbacks.onCanUndoChange(false);
    this.updateGhost();
  }

  public rotate() {
    this.rotation = (this.rotation + 1) % 4;
    playRotateSound(this.soundEnabled);
    this.updateGhost();
  }

  public setMode(m: 'BUILD' | 'ERASE') {
    this.mode = m;
    this.updateGhost();
  }

  public setColorIdx(idx: number) {
    this.colorIdx = idx;
    this.updateGhost();
  }

  public setBrickType(typeId: string) {
    this.brickTypeId = typeId;
    this.updateGhost();
  }

  public elevate(delta: number) {
    this.playerHeight = Math.max(this.minPlayerHeight, Math.min(this.maxPlayerHeight, this.playerHeight + delta));
    if (this.callbacks.onHeightChange) {
      this.callbacks.onHeightChange(this.playerHeight);
    }
  }

  public resetCamera() {
    this.playerHeight = this.EYE_HEIGHT;
    if (this.callbacks.onHeightChange) {
      this.callbacks.onHeightChange(this.playerHeight);
    }
    this.camera.position.set(0, this.EYE_HEIGHT, 4.0);
    this.input.pitch = 0;
    this.input.yaw = 0;
    this.camera.quaternion.setFromEuler(new THREE.Euler(0, 0, 0, 'YXZ'));
  }

  public getBricks(): THREE.Group[] {
    return this.bricks;
  }

  public addBrickAt(
    pos: THREE.Vector3,
    typeId: string,
    colorIdx: number,
    rot = 0,
    materialType: BrickMaterialType = 'BASIC'
  ): THREE.Group {
    const color = COLORS[colorIdx] || COLORS[0];
    const b = this.createBrick(color.hex, false, rot, typeId, materialType);
    b.position.copy(pos);
    this.scene.add(b);
    this.bricks.push(b);
    return b;
  }

  public loadPreset(name: 'tower' | 'pyramid' | 'house') {
    this.clearAll();
    const H = 0.6; // Brick height

    if (name === 'tower') {
      // 4-level fortress tower matching human height (2.4m tall) with Glass crystal battlement gems
      for (let lvl = 0; lvl < 4; lvl++) {
        const y = lvl * H;
        const color = lvl % 2 === 0 ? 1 : 4; // Classic Blue & White
        this.addBrickAt(new THREE.Vector3(0, y, -0.5), 'bb3004', color, 0, 'BASIC');
        this.addBrickAt(new THREE.Vector3(0, y, 0.5), 'bb3004', color, 0, 'BASIC');
        this.addBrickAt(new THREE.Vector3(-0.75, y, 0), 'bb3005', color, 0, 'BASIC');
        this.addBrickAt(new THREE.Vector3(0.75, y, 0), 'bb3005', color, 0, 'BASIC');
      }
      // Crenellations / Battlements with sparkling translucent GLASS bricks
      const topY = 4 * H;
      this.addBrickAt(new THREE.Vector3(-0.75, topY, -0.5), 'bb3005', 0, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(0.75, topY, -0.5), 'bb3005', 0, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(-0.75, topY, 0.5), 'bb3005', 0, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(0.75, topY, 0.5), 'bb3005', 0, 0, 'GLASS');
    } else if (name === 'pyramid') {
      // Tier 0 base: 4x 2x2 bricks (Dark Green)
      this.addBrickAt(new THREE.Vector3(-0.5, 0, -0.5), 'bb3003', 2, 0, 'BASIC');
      this.addBrickAt(new THREE.Vector3(0.5, 0, -0.5), 'bb3003', 2, 0, 'BASIC');
      this.addBrickAt(new THREE.Vector3(-0.5, 0, 0.5), 'bb3003', 2, 0, 'BASIC');
      this.addBrickAt(new THREE.Vector3(0.5, 0, 0.5), 'bb3003', 2, 0, 'BASIC');

      // Tier 1: 2x2 brick centered (Bright Yellow)
      this.addBrickAt(new THREE.Vector3(0, H, 0), 'bb3003', 3, 0, 'BASIC');

      // Tier 2: 1x1 glass pinnacle (Trans-Clear Ice Glass)
      this.addBrickAt(new THREE.Vector3(0.25, 2 * H, 0.25), 'bb3005', 14, 0, 'GLASS');
    } else if (name === 'house') {
      // Cabin structure
      this.addBrickAt(new THREE.Vector3(0, 0, -1.0), 'bb3001', 3, 0, 'BASIC');
      this.addBrickAt(new THREE.Vector3(0, H, -1.0), 'bb3001', 3, 0, 'BASIC');
      
      this.addBrickAt(new THREE.Vector3(-1.0, 0, 0), 'bb3004', 3, 1, 'BASIC');
      this.addBrickAt(new THREE.Vector3(-1.0, H, 0), 'bb3004', 3, 1, 'BASIC');
      this.addBrickAt(new THREE.Vector3(1.0, 0, 0), 'bb3004', 3, 1, 'BASIC');
      this.addBrickAt(new THREE.Vector3(1.0, H, 0), 'bb3004', 3, 1, 'BASIC');

      // Glass windows & corner studs
      this.addBrickAt(new THREE.Vector3(-0.75, 0, 0.75), 'bb3005', 14, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(-0.75, H, 0.75), 'bb3005', 14, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(0.75, 0, 0.75), 'bb3005', 14, 0, 'GLASS');
      this.addBrickAt(new THREE.Vector3(0.75, H, 0.75), 'bb3005', 14, 0, 'GLASS');

      // Lintel & roof plate (Classic Red)
      this.addBrickAt(new THREE.Vector3(0, 2 * H, 0.75), 'bb3004', 0, 0, 'BASIC');
      this.addBrickAt(new THREE.Vector3(0, 2 * H, -0.25), 'bb3001', 0, 0, 'BASIC');
    }

    this.undoStack = [];
    this.updateSunPosition();
    playSnapSound(this.soundEnabled);
    this.callbacks.onBrickCountChange(this.bricks.length);
    this.callbacks.onCanUndoChange(false);
    this.updateGhost();
  }

  public updateGhost() {
    if (this.ghost) {
      this.scene.remove(this.ghost);
      this.ghost = null;
    }
    if (this.mode !== 'BUILD') return;
    const colorHex = COLORS[this.colorIdx]?.hex ?? 0xde1a24;
    this.ghost = this.createBrick(colorHex, true, this.rotation, this.brickTypeId, this.materialType);
    this.ghost.visible = false;
    this.scene.add(this.ghost);
  }

  // Set joystick move input from touch
  public setJoystickInput(forward: number, side: number) {
    this.input.forward = forward;
    this.input.side = side;
  }

  // Touch look delta
  public addTouchLook(dx: number, dy: number) {
    this.input.yaw -= dx * this.LOOK_SPEED;
    this.input.pitch -= dy * this.LOOK_SPEED;
    this.input.pitch = Math.max(-1.5, Math.min(1.5, this.input.pitch));
  }

  private setupWindowEvents() {
    this.onKeyDownHandler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      this.keysDown.add(e.code);

      if (e.code === 'Escape') {
        const handled = this.callbacks.onEscape?.();
        if (!handled) {
          if (this.mode === 'ERASE') {
            this.setMode('BUILD');
          } else {
            this.undo();
          }
        }
      } else if (e.code === 'KeyR') {
        this.rotate();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        this.undo();
      } else if (e.code === 'KeyB') {
        this.setMode('BUILD');
      } else if (e.code === 'KeyE' || e.code === 'KeyX') {
        this.setMode('ERASE');
      } else if (e.code === 'PageUp') {
        this.elevate(0.5);
      } else if (e.code === 'PageDown') {
        this.elevate(-0.5);
      } else if (e.code === 'KeyQ') {
        this.elevate(-0.3);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.performAction();
      }
    };

    this.onKeyUpHandler = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
    };

    let isMouseDown = false;
    let isRightDown = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const updateMousePos = (e: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const inCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      this.isCursorInCanvas = inCanvas;
      this.lastMouseClientX = e.clientX;
      this.lastMouseClientY = e.clientY;
      if (inCanvas) {
        this.mouseScreenPos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseScreenPos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    // Desktop mouse look on drag, right-click orbit/look, or single click to place/remove
    this.onMouseDownHandler = (e: MouseEvent) => {
      if (e.target === this.renderer.domElement) {
        updateMousePos(e);
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        isDragging = false;

        if (e.button === 0) {
          isMouseDown = true;
        } else if (e.button === 2) {
          isRightDown = true;
        }
      }
    };

    this.onMouseMoveHandler = (e: MouseEvent) => {
      updateMousePos(e);
      if (isMouseDown || isRightDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        const totalDist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);

        if (totalDist > 4) {
          isDragging = true;
          this.addTouchLook(dx, dy);
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    this.onMouseUpHandler = (e: MouseEvent) => {
      if (e.target === this.renderer.domElement) {
        updateMousePos(e);
        if (e.button === 0 && isMouseDown) {
          isMouseDown = false;
          // Klikem uz stavet: build immediately at cursor position without lag!
          if (!isDragging) {
            this.performAction(this.mouseScreenPos);
          }
        } else if (e.button === 2 && isRightDown) {
          isRightDown = false;
          // Right-click quick rotate
          if (!isDragging) {
            this.rotate();
          }
        }
      }
      isMouseDown = false;
      isRightDown = false;
      isDragging = false;
    };

    this.onContextMenuHandler = (e: MouseEvent) => {
      if (e.target === this.renderer.domElement) {
        e.preventDefault();
      }
    };

    this.onWheelHandler = (e: WheelEvent) => {
      if (e.target === this.renderer.domElement) {
        e.preventDefault();
        if (e.ctrlKey || e.shiftKey) {
          this.rotate();
        } else {
          this.elevate(e.deltaY > 0 ? -0.25 : 0.25);
        }
      }
    };

    window.addEventListener('keydown', this.onKeyDownHandler);
    window.addEventListener('keyup', this.onKeyUpHandler);
    window.addEventListener('mousedown', this.onMouseDownHandler);
    window.addEventListener('mousemove', this.onMouseMoveHandler);
    window.addEventListener('mouseup', this.onMouseUpHandler);
    window.addEventListener('contextmenu', this.onContextMenuHandler);
    window.addEventListener('wheel', this.onWheelHandler, { passive: false });

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  public onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.ssaoPass) {
      this.ssaoPass.setSize(width, height);
    }
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Dynamic continuous sun orbit if enabled
    if (this.dynamicSunOrbit && this.realisticFx) {
      this.sunAngle = (this.sunAngle + 0.12) % 360;
      this.updateSunPosition();
    }

    // Process keyboard movement
    let kbForward = 0;
    let kbSide = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) kbForward += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) kbForward -= 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) kbSide -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) kbSide += 1;

    const totalForward = this.input.forward !== 0 ? this.input.forward : kbForward;
    const totalSide = this.input.side !== 0 ? this.input.side : kbSide;

    const df = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    df.y = 0;
    df.normalize();
    const ds = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    ds.y = 0;
    ds.normalize();

    this.camera.position.add(df.multiplyScalar(totalForward * this.MOVE_SPEED));
    this.camera.position.add(ds.multiplyScalar(totalSide * this.MOVE_SPEED));
    this.camera.position.y = this.playerHeight;
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.input.pitch, this.input.yaw, 0, 'YXZ'));

    // Update particle sparkles
    const delta = 0.016;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      } else {
        p.vel.y -= 4.0 * delta; // gravity
        p.mesh.position.addScaledVector(p.vel, delta);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - p.life / p.maxLife);
      }
    }

    // Auto Cursor & Snapping Calculation
    const screenCoord = this.autoCursorEnabled && this.isCursorInCanvas
      ? this.mouseScreenPos
      : new THREE.Vector2(0, 0);

    this.raycaster.setFromCamera(screenCoord, this.camera);
    const floorObj = this.scene.getObjectByName('FLOOR');
    const hits = this.raycaster.intersectObjects(floorObj ? [floorObj, ...this.bricks] : this.bricks, true);

    let isHoveringBrick = false;
    let targetWorldPos: THREE.Vector3 | null = null;

    if (hits.length > 0) {
      const hit = hits[0];
      let target: THREE.Object3D | null = hit.object;
      while (target && target.parent && target.parent !== this.scene && target.name !== 'FLOOR') {
        target = target.parent;
      }

      if (target) {
        isHoveringBrick = target.name !== 'FLOOR';
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);

        if (this.mode === 'BUILD' && this.ghost) {
          let gx: number;
          let gz: number;
          let gy: number;

          if (target.name === 'FLOOR') {
            const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));
            gx = this.snapToGrid(p.x, this.ghost.userData.w);
            gz = this.snapToGrid(p.z, this.ghost.userData.l);
            gy = 0.0; // Sits directly on floor plate plane
          } else {
            if (Math.abs(normal.y) > 0.5) {
              const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));
              gx = this.snapToGrid(p.x, this.ghost.userData.w);
              gz = this.snapToGrid(p.z, this.ghost.userData.l);
              gy = normal.y > 0
                ? target.position.y + target.userData.h
                : Math.max(0.0, target.position.y - this.ghost.userData.h);
            } else {
              // Side face attachment
              const dimAlongNormal = Math.abs(normal.x) > 0.5 ? this.ghost.userData.w : this.ghost.userData.l;
              const p = hit.point.clone().add(normal.clone().multiplyScalar(dimAlongNormal / 2 + 0.04));
              gx = this.snapToGrid(p.x, this.ghost.userData.w);
              gz = this.snapToGrid(p.z, this.ghost.userData.l);
              const layerBottom = Math.max(0.0, Math.round(hit.point.y / BrickEngine.LAYER_HEIGHT) * BrickEngine.LAYER_HEIGHT);
              gy = layerBottom;
            }
          }

          this.ghost.position.set(gx, gy, gz);
          this.ghost.visible = true;
          targetWorldPos = this.ghost.position;

          // Check placement collision and update ghost shader state
          const hasCollision = this.checkCollision(this.ghost.position, this.ghost.userData.w, this.ghost.userData.l, this.ghost.userData.h);
          this.ghost.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial && child.material.uniforms?.uGhostValid) {
              child.material.uniforms.uGhostValid.value = hasCollision ? 0.0 : 1.0;
            }
          });

          // Connect cursor world position to radial grid shader
          if (this.radialGridMaterial) {
            this.radialGridMaterial.uniforms.uCursorPos.value.set(gx, gz);
            this.radialGridMaterial.uniforms.uCursorHighlight.value = 0.85;
          }
        } else if (this.mode === 'ERASE') {
          if (this.ghost) this.ghost.visible = false;
          if (target.name !== 'FLOOR') {
            if (!this.eraseHighlightBox) {
              this.eraseHighlightBox = new THREE.BoxHelper(target, 0xef4444);
              (this.eraseHighlightBox.material as THREE.LineBasicMaterial).depthTest = false;
              (this.eraseHighlightBox.material as THREE.LineBasicMaterial).transparent = true;
              (this.eraseHighlightBox.material as THREE.LineBasicMaterial).opacity = 0.85;
              this.eraseHighlightBox.renderOrder = 999;
              this.scene.add(this.eraseHighlightBox);
            } else {
              this.eraseHighlightBox.setFromObject(target);
              this.eraseHighlightBox.visible = true;
            }
            targetWorldPos = target.position;
          } else if (this.eraseHighlightBox) {
            this.eraseHighlightBox.visible = false;
          }
        }
      }
    } else {
      if (this.ghost) this.ghost.visible = false;
      if (this.eraseHighlightBox) this.eraseHighlightBox.visible = false;
      if (this.radialGridMaterial) {
        this.radialGridMaterial.uniforms.uCursorHighlight.value = 0.15;
      }
    }

    this.hoveredWorldPos = targetWorldPos;

    // Lights only radius around player
    if (this.playerLight) {
      this.playerLight.position.set(this.camera.position.x, this.camera.position.y + 2.5, this.camera.position.z);
    }

    // Grid radial blur follows player vision into distance
    if (this.radialGridMaterial) {
      this.radialGridMaterial.uniforms.uPlayerPos.value.set(this.camera.position.x, this.camera.position.z);
    }

    // Sync BBB3005 voxel shader lighting and environment uniforms
    updateAllVoxelMaterialsLighting({
      time: performance.now() * 0.001,
      cameraPos: this.camera.position,
      keyLightDir: this.keyLight.position.clone().negate().normalize(),
      keyLightColor: this.keyLight.color,
      keyLightIntensity: this.keyLight.intensity,
      playerLightPos: this.camera.position,
      playerLightColor: this.playerLight?.color ?? new THREE.Color(0xfffaf0),
      playerLightIntensity: this.playerLight?.intensity ?? 2.8,
      playerLightRadius: 32.0,
      envMap: this.scene.environment,
    });

    // Report cursor status to UI callbacks
    if (this.callbacks.onCursorUpdate) {
      this.callbacks.onCursorUpdate({
        inCanvas: this.isCursorInCanvas,
        screenX: this.lastMouseClientX,
        screenY: this.lastMouseClientY,
        worldPos: targetWorldPos,
        isHoveringBrick,
        activeMode: this.mode,
      });
    }

    // Render using EffectComposer with SSAO if enabled & realisticFx
    if (this.realisticFx && this.ssaoEnabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.eraseHighlightBox) {
      this.scene.remove(this.eraseHighlightBox);
      this.eraseHighlightBox.dispose();
      this.eraseHighlightBox = null;
    }
    if (this.radialGridMaterial) {
      this.radialGridMaterial.dispose();
      this.radialGridMaterial = null;
    }
    if (this.radialGridMesh) {
      this.scene.remove(this.radialGridMesh);
      this.radialGridMesh.geometry.dispose();
      this.radialGridMesh = null;
    }
    if (this.onKeyDownHandler) window.removeEventListener('keydown', this.onKeyDownHandler);
    if (this.onKeyUpHandler) window.removeEventListener('keyup', this.onKeyUpHandler);
    if (this.onMouseDownHandler) window.removeEventListener('mousedown', this.onMouseDownHandler);
    if (this.onMouseMoveHandler) window.removeEventListener('mousemove', this.onMouseMoveHandler);
    if (this.onMouseUpHandler) window.removeEventListener('mouseup', this.onMouseUpHandler);
    if (this.onContextMenuHandler) window.removeEventListener('contextmenu', this.onContextMenuHandler);
    if (this.onWheelHandler) window.removeEventListener('wheel', this.onWheelHandler);
    window.removeEventListener('resize', this.onResize);
    if (this.composer) {
      this.composer.dispose();
    }
    if (this.ssaoPass) {
      this.ssaoPass.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
