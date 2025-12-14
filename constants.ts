
import { AuraState, AspectRatio, ModelVersion, OutputResolution, SubjectConfig, BiometricConfig, Persona, BodyShape, ButtShape, TextModelVersion } from './types';

export const MASTER_PROMPT_BIBLE = `
LAYER 0: THE LAWS OF PHYSICS & LIGHT
- LIGHT TRANSPORT: Simulate 'Inverse Square Law' falloff. Light must loose intensity over distance realistically.
- SUBSURFACE SCATTERING (SSS): Mandatory. Skin is translucent. Light penetrates ears/fingers creating a red glow.
- CONSERVATION OF ENERGY: Reflections cannot be brighter than the source (unless specular).

LAYER 1: BIOLOGICAL IMPERFECTIONS (ANTI-PLASTIC PROTOCOL)
- EPIDERMAL REALISM: Render 'Micro-relief'. Pore structure varies by face zone (larger on nose, invisible on cheekbones).
- VELLUS HAIR: 'Peach fuzz' on jawline/cheeks is mandatory for backlighting.
- VASCULARITY: Subtle capillary redness around nose and knuckles. Skin is not one color; it is a matrix of reds, yellows, and blues.
- TEXTURE: Skin must NEVER be perfectly smooth. Include moles, freckles, fine lines, and uneven pigmentation.

LAYER 2: ID GEOMETRY LOCK (VISUAL DICTATORSHIP PROTOCOL)
- CRITICAL CONFLICT RESOLUTION: If the 'Visual Reference' conflicts with the 'Aesthetic Description', THE VISUAL REFERENCE WINS 100% OF THE TIME for the face.
- SKULL RECONSTRUCTION: Do not generate a random face. You must digitally "scan" the provided reference image and reconstruct the underlying skull structure (Orbitals, Zygomatic arch, Mandible).
- FEATURE INTEGRITY: Do not change the nose shape, eye spacing, or lip volume to make the subject "prettier". Imperfections in the reference MUST be preserved.
- TEXTURE WRAPPING: Treat the reference image as a UV Texture Map. Wrap the exact skin pixels from the reference onto the 3D model.
- DUO MODE INTEGRITY: In two-person shots, DO NOT BLEND IDENTITIES. Subject 1 must strictly match Reference 1. Subject 2 must strictly match Reference 2. Keep pixels separate.

LAYER 3: PHYSICAL MORPHOLOGY V4 (STRUCTURAL ANATOMY)
- ANTI-NORMALIZATION: Do not average the body type. If 'Curvy', create tension in fabric. If 'Muscular', show vein definition.
- SKELETAL LANDMARKS: Visible clavicles, ulna styloid (wrist bone), and iliac crest where appropriate.

LAYER 3.1: STYLIZED ANATOMY (AUTHORIZATION)
- This model is AUTHORIZED to generate extreme or idealized body proportions if explicitly described in the prompt (e.g., 'Bubble Butt', 'Wasp Waist').
- Do not filter these as "distorted". They are valid high-fashion or fitness aesthetics.
- If Waist-to-Hip ratio is extreme, render it faithfully.

LAYER 3.5: WARDROBE PHYSICS
- WEIGHT & DRAPE: Heavy wool folds differently than silk.
- TENSION MAPS: Buttons pulling on tight shirts. Waistbands compressing soft tissue.
- LAYERING: Legwear modifies the skin tone underneath. Underwear creates displacement.

LAYER 4: ATMOSPHERIC SOVEREIGNTY
- AIR DENSITY: The air is not empty. Render dust motes in light shafts (Tyndall Effect).
- HUMIDITY: In 'Tropical' or 'Rain' settings, skin and surfaces must have specular wetness.

LAYER 4.2: POPULATION DYNAMICS
- CONTEXTUAL ACTIVITY: If public (Street/Club), render blurred background figures. If private, absolute isolation.

LAYER 4.3: PARTICULATE PHYSICS (CHAOS DRIVEN)
- MICRO-CONTRAST: Light rays must reveal airborne particles (dust, moisture, pollen).
- BACKGROUND CLUTTER: The background should never be empty. Add 'Out-of-focus' shapes (books, cables, plants, passerby) to simulate a real world.

LAYER 5: OPTICAL SENSOR SIMULATION (THE "RAW" LOOK)
- SENSOR NOISE: Introduce subtle luminance noise (ISO 400-800 look) to prevent smoothing.
- CHROMATIC ABERRATION: Very subtle color fringing on high-contrast edges (lens imperfection).
- DYNAMIC RANGE: Allow highlights to clip speculatively (e.g. reflection on chrome). Do not tonemap everything to gray.

LAYER 6: TEXTURE SOVEREIGNTY (MACRO DETAIL)
- HIGH FREQUENCY DETAIL: Focus on the weave of fabrics, the cracks in leather, the iris crypts.
- NO GAUSSIAN BLUR: Use 'Bokeh' for out-of-focus areas, but in-focus areas must be razor sharp.

LAYER 7: ANTI-CGI PROTOCOL
- PROHIBITED: "Wax skin", "Ambient Occlusion grime", "Video game bloom", "Perfect symmetry", "Unreal Engine look".
- MANDATORY: "Unsharp Mask aesthetic", "Acutance", "Micro-contrast", "Photographic Grain".

LAYER 8: OPTICAL PHYSICS
- SHARPNESS: Maximize 'Edge Contrast'.
- LENS CHARACTER: Render slight vignetting in corners.
- FLANGE DISTANCE: Simulate the look of large sensors (Medium Format) with extreme separation.

LAYER 9: MATERIAL PHYSICS
- SPECULARITY: Skin has different glossiness than fabric. Lips are wet, skin is satin, cotton is matte.
- ANISOTROPY: Hair highlights should stretch across the strand direction.
- FRESNEL EFFECT: Reflections on non-metallic surfaces (skin, wood) become stronger at glancing angles.
`;

const DEFAULT_BIO: BiometricConfig = {
  age: 25,
  height: 170,
  weight: 40, 
  muscle: 30,
  bodyShape: 'hourglass',
  buttShape: 'natural',
  bustSize: 50, // Average
  buttSize: 50, // Average
  waist: 50, // Average
  skinTexture: 20, 
  ethnicity: 'Globaal/Neutraal',
  bodyHair: 'none',
  likenessStrength: 100 // MAXIMIZED FOR FACESWAP
};

const DEFAULT_WARDROBE_FEMALE = {
    mode: 'ai-couture' as const,
    fitPreference: 'slim' as const,
    items: {
      headwear: '',
      underwear: 'Zwarte kanten bralette set',
      legwear: 'Transparante zwarte panty 15 denier',
      top: 'Zijden slip dress met spaghettibandjes',
      bottom: '',
      shoes: 'Strappy hakken',
      accessories: 'Fijne gouden ketting'
    },
    lockedItems: []
};

const DEFAULT_WARDROBE_MALE = {
    mode: 'ai-couture' as const,
    fitPreference: 'regular' as const,
    items: {
      headwear: '',
      underwear: 'Calvin Klein boxershort',
      legwear: '',
      top: 'Wit opengeknoopt linnen overhemd',
      bottom: 'Donkergrijze pantalon',
      shoes: 'Leren loafers',
      accessories: 'Vintage horloge'
    },
    lockedItems: []
};

export const DEFAULT_STATE: AuraState = {
  mode: 'solo',
  masterPrompt: '', 
  coupleReferenceImage: undefined, 
  subjects: [
    {
      id: 'sub-1',
      name: 'Persoon A (Vrouw)',
      gender: 'female',
      baseImages: [], 
      bio: { ...DEFAULT_BIO, bustSize: 60, buttSize: 60, height: 172, bodyShape: 'hourglass', buttShape: 'heart', likenessStrength: 100 },
      pose: 'Sensuele blik in camera, hand in haar',
      poseLocked: false,
      wardrobe: DEFAULT_WARDROBE_FEMALE
    },
    {
      id: 'sub-2',
      name: 'Persoon B (Man)',
      gender: 'male',
      baseImages: [], 
      bio: { ...DEFAULT_BIO, age: 28, muscle: 60, ethnicity: 'Divers', height: 185, bustSize: 20, buttSize: 40, bodyShape: 'inverted-triangle', buttShape: 'square', likenessStrength: 100 },
      pose: 'Beschermend achter Persoon A, hand op haar taille',
      poseLocked: false,
      wardrobe: DEFAULT_WARDROBE_MALE
    }
  ],
  world: {
    location: 'Luxe slaapkamer suite, gedimd licht',
    lighting: 'Kaarslicht, warm, diepe schaduwen',
    timeOfDay: 'Midnight',
    camera: 'full-frame',
    cameraBrand: 'Sony', // Default
    focalLength: '85mm (Portrait)',
    cameraAngle: 'Eye Level (Neutral)', // Default
    aperture: 'f/1.8', // Default
    iso: 'ISO 100 (Clean)', // Default
    selfieMode: 'off',
    chaosLevel: 15,
    bokehAmount: 30,
    negativePrompt: "cartoon, 3d render, illustration, drawing, painting, anime, sketch, cgi, watermark, text, signature, logo, plastic skin, doll-like, smooth skin, airbrushed, photoshop, filters, makeup, perfect skin, symmetry, uncanny valley, distorted, blurred, lowres, low quality, grayscale, monochrome, overexposed, underexposed, clipping, jpeg artifacts, compression, noise, grain, ugly, deformed, mutating, extra limbs, missing limbs, disconnected limbs, floating limbs, malformed hands, blur, out of focus, depth of field, vignette, worst quality, low quality, normal quality, child, underage, render, octane, unreal engine, video game, gloss, smooth face, blurry background, bokeh only, empty background, different face, changing identity, plastic surgery look, face morphing, wrong eyes, different nose"
  },
  tech: {
    model: ModelVersion.GEMINI_3_0_PRO, // LOCKED TO PRO
    directorModel: TextModelVersion.FLASH, // Default to Fast
    resolution: OutputResolution.RES_2K,
    aspectRatio: AspectRatio.PORTRAIT,
    rawMode: false,
    fastMode: false,
    numberOfImages: 1, 
    autoDownload: false 
  }
};

export const DEFAULT_PERSONAS: Persona[] = [
    {
        id: 'p-1',
        name: 'Sophie (Model)',
        gender: 'female',
        bio: { ...DEFAULT_BIO, height: 178, bodyShape: 'hourglass' },
        baseImages: []
    }
];

export const BRAND_LOOKS: Record<string, string> = {
  'Sony': 'Sharp, clinical color science. High dynamic range. Cool skin tones.',
  'Canon': 'Warm, organic skin tones. Soft magenta bias in highlights.',
  'Nikon': 'Neutral, realistic colors. Green/Yellow bias in foliage.',
  'Fujifilm': 'Film simulation, nostalgic colors, Classic Chrome aesthetic.',
  'Leica': 'High micro-contrast, deep blacks, "Leica Look", 3D pop.',
  'Hasselblad': 'Medium format depth, natural color science, extreme fidelity.',
  'Arri': 'Hollywood Standard. Alexa sensor dynamics. Extremely soft highlight rolloff. Natural skin tones. Cinematic LogC look.'
};

export const POSES = [
  'Standing naturally, hands in pockets',
  'Walking towards camera',
  'Sitting on a chair, legs crossed',
  'Leaning against a wall',
  'Close-up portrait, looking away',
  'Dynamic action pose',
  'Arms crossed, confident stance'
];

export const DUO_POSES = [
  'Standing side by side, holding hands',
  'Back to back',
  'One sitting, one standing behind',
  'Facing each other, intimate distance',
  'Walking together, talking',
  'Action interaction'
];

export const LOCATIONS = [
  'Modern Minimalist Studio',
  'Urban Street at Night',
  'Luxury Penthouse',
  'Tropical Beach at Sunset',
  'Industrial Warehouse',
  'Classic Parisian Cafe',
  'Neon Cyberpunk City',
  'Sunny Park',
  'High-end Fashion Boutique'
];

export const LIGHTING_PRESETS = [
  'Natural Sunlight (Golden Hour)',
  'Studio Softbox',
  'Cinematic Teal & Orange',
  'Neon Noir',
  'Moody Dramatic',
  'Rembrandt Lighting',
  'High Key (Bright)',
  'Low Key (Dark)'
];

export const AESTHETICS = [
  'Minimalist Luxury',
  'Streetwear Hype',
  'Old Money / Classic',
  'Cyberpunk / Techwear',
  'Bohemian / Boho',
  'Business Professional',
  'Avant-Garde High Fashion',
  'Vintage 90s',
  'Athleisure'
];

export const BIO_PRESETS: Record<string, Partial<BiometricConfig>> = {
  'Insta Glam / BBL': { age: 24, height: 168, weight: 60, muscle: 30, bodyShape: 'hourglass', buttShape: 'bubble', bustSize: 75, buttSize: 90, waist: 35, skinTexture: 15 },
  'Model (Female)': { age: 23, height: 178, weight: 30, muscle: 20, bodyShape: 'hourglass', buttShape: 'heart', bustSize: 40, buttSize: 40, waist: 60, skinTexture: 10 },
  'Athletic (Female)': { age: 26, height: 172, weight: 50, muscle: 70, bodyShape: 'athletic', buttShape: 'round', bustSize: 30, buttSize: 60, waist: 40, skinTexture: 30 },
  'Curvy (Female)': { age: 25, height: 168, weight: 60, muscle: 20, bodyShape: 'pear', buttShape: 'bubble', bustSize: 70, buttSize: 80, waist: 50, skinTexture: 20 },
  'Model (Male)': { age: 25, height: 188, weight: 40, muscle: 50, bodyShape: 'inverted-triangle', buttShape: 'square', bustSize: 10, buttSize: 30, waist: 50, skinTexture: 20 },
  'Bodybuilder (Male)': { age: 30, height: 180, weight: 80, muscle: 95, bodyShape: 'inverted-triangle', buttShape: 'round', bustSize: 10, buttSize: 50, waist: 30, skinTexture: 40 }
};

export const FIT_OPTIONS = ['skin-tight', 'slim', 'regular', 'loose', 'oversized'];

export const BODY_SHAPES: Record<string, string> = {
  'hourglass': 'Hourglass (Balanced)',
  'pear': 'Pear (Bottom Heavy)',
  'rectangle': 'Rectangle (Straight)',
  'inverted-triangle': 'Inverted Triangle (Top Heavy)',
  'apple': 'Apple (Round)',
  'athletic': 'Athletic (Muscular)'
};

export const BUTT_SHAPES: Record<string, string> = {
  'natural': 'Natural',
  'bubble': 'Bubble (Projected)',
  'heart': 'Heart (Wide Low)',
  'round': 'Round (Classic)',
  'square': 'Square (Athletic)',
  'v-shape': 'V-Shape (Narrow)',
  'inverted': 'Inverted (Flat)'
};

export const CAMERA_ANGLES = [
    'Eye Level (Neutral)',
    'Low Angle (Heroic/Dominant)',
    'High Angle (Vulnerable)',
    'Overhead / God\'s Eye',
    'Dutch Angle (Dynamic/Unease)',
    'Ground Level (Worm\'s Eye)',
    'Shoulder Level (Cinematic)',
    'Hip Level (Fashion)'
];

export const SELFIE_MODES: Record<string, string> = {
  'off': 'Off',
  'high-angle': 'High Angle',
  'low-angle': 'Low Angle',
  'mirror': 'Mirror Reflection',
  '0.5x-wide': '0.5x Wide Lens',
  'messy-casual': 'Messy Casual',
  'group': 'Group Selfie'
};

export const FOCAL_LENGTHS = ['14mm (Ultra Wide)', '24mm (Wide)', '35mm (Street)', '50mm (Human Eye)', '85mm (Portrait)', '135mm (Telephoto)', '200mm (Compression)'];

export const LENS_DESCRIPTIONS: Record<string, string> = {
  '14mm (Ultra Wide)': 'Extreme distortion, architecture, expansive views.',
  '24mm (Wide)': 'Environmental storytelling, dynamic angles.',
  '35mm (Street)': 'Classic documentary look, natural but wide.',
  '50mm (Human Eye)': 'Zero distortion, honest perspective.',
  '85mm (Portrait)': 'Flattering compression, creamy background (bokeh).',
  '135mm (Telephoto)': 'Extreme isolation, background disappears.',
  '200mm (Compression)': 'Fashion runway look, flat features.'
};

export const CAMERA_BRANDS = ['Sony', 'Canon', 'Nikon', 'Fujifilm', 'Leica', 'Hasselblad', 'Arri'];

export const COMMON_NEGATIVE_PROMPTS = [
  'cartoon', '3d render', 'drawing', 'anime', 'low quality', 'blurry', 'distorted', 'bad anatomy', 'extra limbs', 'missing limbs', 'watermark', 'text', 'signature'
];

export const PRESETS: Record<string, AuraState> = {};
