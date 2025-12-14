
export enum AppMode {
  STUDIO = 'STUDIO',
  GALLERY = 'GALLERY',
  SETTINGS = 'SETTINGS'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  CINEMATIC = '21:9'
}

export enum RenderQuality {
  STANDARD = 'Standard', // Flash
  ULTRA = 'Ultra (Gemini 3.0)' // Pro
}

export enum ModelVersion {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash-image',
  GEMINI_3_0_PRO = 'gemini-3-pro-image-preview'
}

// Text models
export enum TextModelVersion {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export enum OutputResolution {
  RES_2K = '2K (Native)',
  RES_4K = '4K (Upsampled)',
  RES_8K = '8K (Gigapixel)',
  RES_50MP = '50MP (RAW)'
}

export type BodyShape = 'hourglass' | 'pear' | 'rectangle' | 'inverted-triangle' | 'apple' | 'athletic';
export type ButtShape = 'natural' | 'bubble' | 'heart' | 'round' | 'square' | 'v-shape' | 'inverted';

export interface BiometricConfig {
  age: number;
  height: number; // cm
  weight: number; // 0-100 scale (Ectomorph to Endomorph)
  muscle: number; // 0-100 scale
  bodyShape: BodyShape; // New: Fundamental skeletal structure
  buttShape: ButtShape; // New: Specific glute morphology
  bustSize: number; // 0-100 (Flat to Extreme)
  buttSize: number; // 0-100 (Flat to BBL/Curvy)
  waist: number; // 0-100 (Snatched/Corset to Straight)
  skinTexture: number; // 0-100 (Perfect to Weathered)
  ethnicity: string;
  bodyHair: 'none' | 'sparse' | 'natural' | 'hairy';
  likenessStrength: number; // 0-100 (Influence of reference image)
}

export type WardrobeMode = 'custom' | 'preset' | 'ai-directed' | 'ai-couture' | 'try-on';
export type FitPreference = 'skin-tight' | 'slim' | 'regular' | 'loose' | 'oversized';

export interface WardrobeState {
  mode: WardrobeMode;
  fitPreference: FitPreference;
  items: {
    headwear: string;
    underwear: string;
    legwear: string;
    top: string;
    bottom: string;
    shoes: string;
    accessories: string;
  };
  referenceImage?: string; // Base64 for Try-On
  lockedItems: string[]; // Array of keys (e.g. 'top', 'shoes') that are locked
}

export interface SubjectConfig {
  id: string;
  name: string; // "Subject 1"
  gender: 'female' | 'male' | 'non-binary'; // New: Gender logic
  baseImages: string[]; 
  bio: BiometricConfig;
  pose: string;
  poseLocked?: boolean; // New: Lock pose text
  poseReferenceImage?: string; // New: Uploaded pose reference
  wardrobe: WardrobeState; // Moved Wardrobe HERE (Per Subject)
}

export interface WorldConfig {
  location: string;
  lighting: string;
  timeOfDay: string;
  camera: 'smartphone' | 'full-frame' | 'cinema-camera' | 'medium-format' | 'polaroid' | 'cctv' | 'action-cam' | 'drone' | 'anamorphic' | 'macro' | 'vintage-35mm' | 'dslr' | 'mirrorless' | 'vintage-film' | 'pinhole' | 'large-format' | 'wet-plate' | 'night-vision' | 'thermal';
  cameraBrand: string; // New: Manufacturer logic (Canon, Sony, etc.)
  focalLength: string; // New: Lens selection (e.g. "85mm")
  cameraAngle: string; // New: High angle, low angle, etc.
  aperture: string; // New: f-stop
  iso: string; // New: ISO sensitivity
  selfieMode?: 'off' | 'high-angle' | 'low-angle' | 'mirror' | '0.5x-wide' | 'messy-casual' | 'group'; // New: Selfie specific angles
  chaosLevel: number; // 0-100
  bokehAmount: number; // 0-100
  negativePrompt: string; // New: Negative prompting
}

export interface AuraState {
  mode: 'solo' | 'duo';
  masterPrompt: string; // New: Stores the raw Global Director text
  coupleReferenceImage?: string; // New: Single image containing both subjects for Duo
  subjects: SubjectConfig[];
  world: WorldConfig;
  tech: {
    model: ModelVersion; // Selector for Gemini 2 or 3
    directorModel: TextModelVersion; // New: Switch for logic (Flash vs Pro)
    resolution: OutputResolution; // 2K, 4K, 8K, 50MP
    aspectRatio: AspectRatio;
    rawMode: boolean; // Flat profile
    fastMode: boolean; // New: Token saver / Speed mode
    numberOfImages: number; // New: Batch size (1-4)
    autoDownload: boolean; // New: Auto save to disk
  };
}

export interface GeneratedAsset {
  id: string;
  url: string; // This is the PNG (Lossless)
  timestamp: number;
  config: AuraState; 
  promptUsed: string;
}

// New: Persona Interface for Saving/Loading Identities
export interface Persona {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'non-binary';
  bio: BiometricConfig;
  baseImages: string[];
}
