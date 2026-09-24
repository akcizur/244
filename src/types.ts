export type BuildMode = 'BUILD' | 'ERASE';
export type Theme = 'dark' | 'light';
export type BrickMaterialType = 'BASIC' | 'GLASS';

export interface BrickColor {
  hex: number;
  label: string;
  css: string;
  isGlass?: boolean;
}

export const BRICK_GRID_UNIT = 0.5; // Grid spacing in meters (50cm)

export interface BrickType {
  id: string;
  name: string;
  w: number;
  l: number;
  h: number;
  studsX: number;
  studsZ: number;
}

export const BRICK_TYPES: BrickType[] = [
  { id: 'bb3005', name: '1x1 Kostka (BYLDR Block)', w: 0.5, l: 0.5, h: 0.6, studsX: 1, studsZ: 1 },
  { id: 'bb3004', name: '1x2 Kostka (3004)', w: 1.0, l: 0.5, h: 0.6, studsX: 2, studsZ: 1 },
  { id: 'bb3003', name: '2x2 Kostka (3003)', w: 1.0, l: 1.0, h: 0.6, studsX: 2, studsZ: 2 },
  { id: 'bb3001', name: '2x4 Kostka (3001)', w: 2.0, l: 1.0, h: 0.6, studsX: 4, studsZ: 2 },
  { id: 'bb3024', name: '1x1 Destička (3024)', w: 0.5, l: 0.5, h: 0.2, studsX: 1, studsZ: 1 },
  { id: 'bb3023', name: '1x2 Destička (3023)', w: 1.0, l: 0.5, h: 0.2, studsX: 2, studsZ: 1 },
];

// Authentic LEGO color palette with top 4 iconic primary colors & transparent glass colors
export const COLORS: BrickColor[] = [
  { hex: 0xde1a24, label: 'Červená (Classic Red)', css: '#de1a24' },
  { hex: 0x0055bf, label: 'Modrá (Classic Blue)', css: '#0055bf' },
  { hex: 0x287f46, label: 'Zelená (Dark Green)', css: '#287f46' },
  { hex: 0xfed500, label: 'Žlutá (Bright Yellow)', css: '#fed500' },
  { hex: 0xf4f4f4, label: 'Bílá (Pure White)', css: '#f4f4f4' },
  { hex: 0x18181a, label: 'Černá (Jet Black)', css: '#18181a' },
  { hex: 0xff7e14, label: 'Oranžová (Bright Orange)', css: '#ff7e14' },
  { hex: 0x9ba19d, label: 'Šedá (Medium Stone)', css: '#9ba19d' },
  { hex: 0x545955, label: 'Tmavá šedá (Dark Stone)', css: '#545955' },
  { hex: 0xc91a5b, label: 'Magenta (Reddish Violet)', css: '#c91a5b' },
  { hex: 0x48a0c9, label: 'Azurová (Medium Blue)', css: '#48a0c9' },
  { hex: 0x583927, label: 'Hnědá (Reddish Brown)', css: '#583927' },
  { hex: 0xbbd632, label: 'Limetková (Lime Green)', css: '#bbd632' },
  { hex: 0x4b317a, label: 'Fialová (Dark Purple)', css: '#4b317a' },
  { hex: 0xd0f0fd, label: 'Ledová (Trans-Clear Ice)', css: '#d0f0fd', isGlass: true },
  { hex: 0xd4fc12, label: 'Neonová (Trans-Neon Green)', css: '#d4fc12', isGlass: true },
];

export interface EngineState {
  mode: BuildMode;
  colorIdx: number;
  materialType: BrickMaterialType;
  rotation: number; // 0, 1, 2, 3 (each is 90 deg)
  invOpen: boolean;
  brickTypeId: string;
  soundEnabled: boolean;
  brickCount: number;
  canUndo: boolean;
  realisticFx: boolean;
  ssaoEnabled: boolean;
  sunAngle: number;
  dynamicSunOrbit: boolean;
}
