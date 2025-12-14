
import { GoogleGenAI } from "@google/genai";
import { AuraState, ModelVersion, OutputResolution, SubjectConfig } from "../types";
import { MASTER_PROMPT_BIBLE, BRAND_LOOKS } from "../constants";

const cleanBase64 = (b64: string) => { if (!b64) return ""; return b64.split(',')[1] || b64; };
const cleanAndParseJSON = (text: string) => { if (!text) return {}; let clean = text.trim(); if (clean.startsWith('```')) { clean = clean.replace(/^```(json)?\n/, '').replace(/\n```$/, ''); } clean = clean.trim(); try { return JSON.parse(clean); } catch (e) { console.error("JSON Parse Error:", e, "Input text:", text); return {}; } };
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, backoff = 2000): Promise<T> { try { return await operation(); } catch (error: any) { const isRetryable = error?.status === 429 || error?.code === 429 || error?.status === 503 || error?.code === 503 || error?.status === 500 || error?.code === 500 || error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('overloaded'); if (retries > 0 && isRetryable) { console.warn(`API Error (${error.status || error.code}). Retrying in ${backoff}ms...`); await wait(backoff); return retryOperation(operation, retries - 1, backoff * 2); } throw error; } }

export class AuraEngine {
  private getClient() { const key = process.env.API_KEY || ''; return new GoogleGenAI({ apiKey: key }); }

  async generateConcept(type: string, context: any, lockedContext: string = ""): Promise<string> {
    const operation = async () => {
        let prompt = "";
        const genderContext = context.gender ? `Target Gender: ${context.gender}.` : "";
        const poseContext = context.pose ? `Subject Pose: "${context.pose}". Ensure the item works with this pose.` : "";
        const vibeContext = context.aesthetic ? `Aesthetic Style: "${context.aesthetic}".` : `Vibe: ${context.vibe}.`;
        const lockInstruction = lockedContext ? `CRITICAL CONSTRAINT: The following items are LOCKED by the user. Your suggestion MUST MATCH and compliment these items: ${lockedContext}` : "";
        const currentItemContext = context.currentItem ? `CONTEXT: The user currently has selected: "${context.currentItem}". TASK: Suggest a stylish ALTERNATIVE / VARIATION of this item.` : "TASK: Suggest a high-end luxury fashion item for this category.";

        if (type === 'aesthetic') {
            prompt = `Context: Aesthetic style "${context.aesthetic}". Location: "${context.location}". ${lockInstruction} Task: Create a highly detailed wardrobe description. Details: Include fabrics, colors, fit, layers, and accessories. Style: ${context.aesthetic}, luxury, photorealistic. Output: Plain text in DUTCH (Nederlands), max 40 words.`;
        } else if (['top', 'bottom', 'shoes', 'accessories', 'underwear', 'legwear', 'headwear'].includes(type)) {
            prompt = `Context: ${vibeContext} Location: "${context.location}". ${genderContext} ${poseContext} ${currentItemContext} ${lockInstruction} Category: ${type.toUpperCase()}. Requirement: Must match the scene, gender, pose, AND the locked items provided above. If 'underwear' and gender is female, think lace/silk. If male, think boxers/briefs. Output: Just the item name and material in DUTCH (e.g. "Zwart zijden oversized blouse").`;
        } else if (type === 'pose') {
            prompt = `Context: Location "${context.location}", ${vibeContext} Task: Describe a creative, natural pose. Output: Plain text in DUTCH, max 15 words.`;
        } else {
            prompt = `Context: ${JSON.stringify(context)} Task: Generate a creative, short, high-end description for a ${type}. Style: Luxury, cinematic, detailed. Output: Plain text in DUTCH, max 20 words.`;
        }
        const client = this.getClient(); const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, }); return response.text?.trim() || "Klassiek tijdloze esthetiek.";
    };
    try { return await retryOperation(operation); } catch (e) { console.error("Concept Gen Failed", e); return "Fout bij genereren."; }
  }

  async generateWardrobe(context: any, lockedContext: string = ""): Promise<any> {
      const operation = async () => {
          const prompt = `
          Role: High-Fashion Stylist. 
          
          CRITICAL SUBJECT DATA:
          - GENDER: ${context.gender.toUpperCase()} (STRICT COMPLIANCE REQUIRED).
          - AGE: ${context.age}
          - BODY TYPE: ${context.bodyType}
          - POSE: "${context.pose}"
          
          SCENE CONTEXT:
          - Aesthetic: ${context.aesthetic || "High Luxury"}
          - Location: ${context.location}
          
          LOCKED ITEMS (DO NOT CHANGE):
          ${lockedContext || "None."}
          
          TASK: Create a cohesive, luxury COMPLETE LOOK for a ${context.gender}.
          
          GENDER RULES (ABSOLUTE):
          1. IF MALE: DO NOT suggest bras, panties, skirts, dresses, heels, or blouses. Use Boxers, Briefs, Trousers, Suits, Shirts, Loafers/Boots.
          2. IF FEMALE: Use Lingerie, Dresses, Skirts, Heels as appropriate for the style.
          
          Output: JSON object with keys (lowercase): headwear, underwear, legwear, top, bottom, shoes, accessories. Language: DUTCH.
          `;
          const client = this.getClient(); const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } }); return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Wardrobe Gen Failed", e); return null; }
  }

  async generateDuoLook(base64Image: string, context: any, subjectConstraints: string = ""): Promise<any> {
      const operation = async () => {
          const prompt = `
          Role: Expert Duo Stylist. 
          Task: Analyze Couple Reference Image and Generate matching outfits for Location: "${context.location}" and Aesthetic: "${context.aesthetic}".
          
          CONSTRAINTS:
          ${subjectConstraints ? `STRICT GENDER MAPPING: ${subjectConstraints}. Ensure Subject 1 gets the outfit for their gender, and Subject 2 gets the outfit for their gender.` : ""}
          
          STRICT JSON OUTPUT: { "subject1": { "wardrobe": { "headwear": "", "underwear": "", "legwear": "", "top": "", "bottom": "", "shoes": "", "accessories": "" } }, "subject2": { "wardrobe": { "headwear": "", "underwear": "", "legwear": "", "top": "", "bottom": "", "shoes": "", "accessories": "" } } } 
          Language: Dutch.
          `;
          const client = this.getClient(); const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } } ] }, config: { responseMimeType: 'application/json' } }); return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Duo Look Failed", e); return null; }
  }

  async generateSceneScript(userConcept: string, referenceImage?: string, lockedContext: string = "", currentContext: string = "", modelId: string = 'gemini-2.5-flash', subjectConstraints: string = "", mode: 'solo' | 'duo' = 'solo'): Promise<any> {
      const operation = async () => {
        const entropy = Math.random().toString(36).substring(7);
        const promptText = `
        Role: Auteur Film Director & Cinematographer (Christopher Nolan / Denis Villeneuve style).
        Task: Create a HIGHLY SPECIFIC, CINEMATIC scene definition based on the Concept: "${userConcept}".
        
        SHOT MODE: ${mode.toUpperCase()}
        
        CRITICAL INSTRUCTION FOR LOCATION:
        - The 'location' field MUST be derived STRICTLY from the user's concept ("${userConcept}"). 
        - If the concept implies a different setting than the previous context, you MUST OVERRIDE the location.
        - BE SPECIFIC: Do not just say "Living Room". Say "Minimalist Loft with floor-to-ceiling windows overlooking a rainy Tokyo skyline".
        - ADD ATMOSPHERE: Include details about humidity, dust, smoke, or rain.

        CRITICAL INSTRUCTION FOR CAMERA ANGLE:
        - Determine the BEST camera angle to tell this story.
        - Options: 'Eye Level', 'Low Angle (Heroic/Dominant)', 'High Angle (Vulnerable)', 'Overhead (God's Eye)', 'Dutch Angle (Unease)', 'Ground Level', 'Shoulder Level'.
        - MAPPING: If the concept is intimidating, choose 'Low Angle'. If chaotic, choose 'Dutch Angle'.

        CRITICAL INSTRUCTION FOR SUBJECTS:
        - ${subjectConstraints}
        - MODE = ${mode.toUpperCase()}.
        - IF SOLO: GENERATE DATA FOR SUBJECT 1 ONLY. DO NOT CREATE A SECOND SUBJECT. OMIT 'subject2' FROM JSON.
        - IF DUO: GENERATE FOR BOTH SUBJECT 1 AND SUBJECT 2.
        - ACTION: The 'pose' must be a dynamic action description, not just a static standing pose. Describe hands, head tilt, and interaction with props.
        
        ${referenceImage ? "VISUAL INSPIRATION: Use the provided image to determine the aesthetic, location style, and lighting. DO NOT COPY tattoos, scars, or body markings from people in this reference image. Focus on the mood and composition." : ""}
        ${currentContext ? `PREVIOUS CONTEXT (Overwrite this if concept differs): ${currentContext}` : ""}
        ${lockedContext ? `LOCKED ITEMS (Keep these): ${lockedContext}` : ""}
        
        REQUIREMENTS:
        1. WARDROBE: Invent a full, detailed outfit matching the scene/concept. Use specific fabrics (silk, leather, latex, denim).
        2. LIGHTING: Design complex lighting. Specify the KEY LIGHT color and the RIM LIGHT color (e.g. "Teal Key with Hot Pink Rim").
        3. CAMERA: Choose the best camera brand and focal length for this genre.
        
        OUTPUT FORMAT: JSON ONLY.
        KEYS: 
        - location (String: Very detailed description of environment + atmosphere)
        - lighting (String: Specific lighting setup + colors)
        - camera (String: 'smartphone' | 'cinema-camera' | 'full-frame')
        - cameraBrand (String: 'Arri' | 'Sony' | 'Leica' etc)
        - cameraAngle (String: The chosen angle)
        - focalLength (String: e.g., '35mm', '85mm')
        - chaosLevel (Number: 0-100)
        - bokehAmount (Number: 0-100)
        - pose (String: Detailed action)
        - subject1: { wardrobe: { headwear, underwear, legwear, top, bottom, shoes, accessories } }
        - subject2: { ... } (ONLY IF DUO).
        
        VALUES MUST BE IN DUTCH (Nederlands) EXCEPT FOR TECH SPECS.
        VARIATION SEED: ${entropy}.
        `;
        
        const parts: any[] = [{ text: promptText }];
        if (referenceImage) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(referenceImage) } });
        }

        const client = this.getClient(); 
        const response = await client.models.generateContent({ 
            model: modelId, 
            contents: { parts }, 
            config: { responseMimeType: 'application/json', temperature: 1.0 } 
        }); 
        return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Director Script Failed", e); return null; }
  }

  async analyzeGarment(base64Image: string): Promise<any> {
      const operation = async () => {
        const prompt = `
        Role: Expert Fashion Analyst.
        Task: Analyze the clothing in this image in extreme detail.
        
        Identify the specific garment items and their attributes:
        1. Material (Silk, Denim, Leather, etc.)
        2. Color (Specific hex or name)
        3. Cut/Fit (Oversized, Slim, Cropped)
        
        OUTPUT JSON KEYS (Must match exactly):
        - headwear
        - top
        - bottom
        - shoes
        - accessories
        - underwear (if visible)
        - legwear (if visible)
        
        Language: DUTCH (Nederlands).
        Example: "Zwart leren motorjack met zilveren ritsen"
        `;
        const client = this.getClient(); const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } } ] }, config: { responseMimeType: 'application/json' } }); return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Garment Analysis Failed", e); return {}; }
  }

  async analyzePose(base64Image: string): Promise<string> {
      const operation = async () => {
        const prompt = `
          ANALYZE POSE - SKELETAL STRUCTURE ONLY.
          Ignore: Gender, Clothing, Background, Lighting, Colors.
          Focus on: Limb positioning, head angle, hand placement, spine curvature, and interaction with environment.
          Task: Describe the physical action and body geometry in high detail.
          Output Language: Dutch (Nederlands).
          Max Length: 50 words.
        `;
        const client = this.getClient(); const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } } ] } }); return response.text?.trim() || "";
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Pose Analysis Failed", e); return ""; }
  }

  async analyzeSubjectReferences(images: string[]): Promise<any> {
      const operation = async () => {
          const prompt = `
          Analyze these reference images of a subject. 
          Extract the following biometric, pose and wardrobe details into a strict JSON object:
          {
              "gender": "male" | "female",
              "bio": {
                  "age": number,
                  "ethnicity": string (estimate in Dutch),
                  "skinTexture": number (0-100 estimate)
              },
              "pose": string (Short description of posture in Dutch),
              "garment": string (Short description of clothing style/aesthetic in Dutch, e.g. "Casual Chic", "Business Suit")
          }
          `;
          const parts: any[] = [{ text: prompt }];
          images.forEach(img => {
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(img) } });
          });

          const client = this.getClient(); 
          const response = await client.models.generateContent({ 
              model: 'gemini-2.5-flash', 
              contents: { parts }, 
              config: { responseMimeType: 'application/json' } 
          }); 
          return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { console.error("Batch Analysis Failed", e); return {}; }
  }

  async compilePrompt(state: AuraState): Promise<string> {
    const world = state.world; const isDuo = state.mode === 'duo'; const isFast = state.tech.fastMode;
    const activeSubjects = isDuo ? state.subjects : [state.subjects[0]];

    const subjectsPrompt = activeSubjects.map((sub, index) => {
    const bio = sub.bio; const fit = sub.wardrobe.fitPreference; const w = sub.wardrobe.items;
    let bioDesc = "";
    
    // --- HYPER-MORPHOLOGY V3.5 ENGINE (GENDER BIFURCATED) ---
    
    let anatomicalStructure = "";
    let softTissueDynamics = ""; 
    
    const isMale = sub.gender === 'male';
    const isFemale = !isMale; // Default to female logic for non-binary to ensure base morph
    
    if (isMale) {
        // === MALE MORPHOLOGY LOGIC ===
        anatomicalStructure += " [BIOLOGY: MALE] ";
        
        // 1. SHOULDER & WAIST (V-Taper vs Blocky)
        if (bio.bodyShape === 'inverted-triangle' || bio.bodyShape === 'athletic') {
             anatomicalStructure += " [MORPHOLOGY: V-TAPER] Wide clavicles and heavy deltoids tapering down to a narrow, dense waist. ";
        } else if (bio.bodyShape === 'rectangle') {
             anatomicalStructure += " [MORPHOLOGY: POWERLIFTER BLOCK] Thick core. Wide waist. Heavy skeletal density. ";
        } else if (bio.bodyShape === 'apple' || bio.weight > 70) {
             anatomicalStructure += " [MORPHOLOGY: HEAVYSET/DAD BOD] Soft midsection. Endomorphic build. No visible abs. ";
        } else {
             anatomicalStructure += " [MORPHOLOGY: MALE STANDARD] Balanced proportions. ";
        }

        // 2. CHEST (Pectorals) - Mapping 'bustSize' to Pectoral Mass
        if (bio.bustSize > 75) {
            anatomicalStructure += " [CHEST: MASSIVE PECS] IFBB Pro chest development. Clear separation between pectorals. Shelf-like upper chest. ";
            softTissueDynamics += " Clothing stretches tightly across the chest plate. ";
        } else if (bio.bustSize < 30) {
            anatomicalStructure += " [CHEST: LEAN/RUNNER] Flat chest. Visible ribcage definition. ";
        } else {
            anatomicalStructure += " [CHEST: ATHLETIC] Defined pectorals. ";
        }

        // 3. LEGS & GLUTES - Mapping 'buttSize' to Quad/Hamstring Mass
        if (bio.buttSize > 75) {
             anatomicalStructure += " [LEGS: TREE TRUNKS] Massive quadriceps (sweeps). Thick hamstrings. Glutes are muscular and square, not round/feminine. ";
        } else if (bio.buttSize < 30) {
             anatomicalStructure += " [LEGS: SLENDER] Thin calves and thighs. Rock star skinny. ";
        }

        // 4. DEFINITION
        if (bio.muscle > 70) anatomicalStructure += " [DEFINITION: RIPPED] Vascularity on forearms. Striated deltoids. <8% Bodyfat. ";
        else if (bio.muscle > 40) anatomicalStructure += " [DEFINITION: ATHLETIC] Visible muscle tone. ";
        else anatomicalStructure += " [DEFINITION: SOFT] No visible muscle separation. ";

    } else {
        // === FEMALE MORPHOLOGY LOGIC ===
        anatomicalStructure += " [BIOLOGY: FEMALE] ";
        const shape = bio.buttShape || 'natural';
        
        // 1. WAIST-TO-HIP
        const isSnatched = bio.waist < 50 && (bio.buttSize > 60 || bio.bodyShape === 'hourglass' || bio.bodyShape === 'pear');

        // 2. GLUTE GEOMETRY
        switch(shape) {
             case 'bubble': 
                anatomicalStructure += " [GLUTEAL GEOMETRY: HIGH SHELF] The glutes must have EXTREME UPPER PROJECTION. Create a distinct 'shelf'. Gravity-defying roundness. "; 
                softTissueDynamics += " CLOTHING PHYSICS: Fabric must stretch tightly across the peak of the glutes. ";
                break;
             case 'heart': 
                anatomicalStructure += " [GLUTEAL GEOMETRY: WIDE HEART] Maximum width at the bottom of the hips. 'A-frame' silhouette. "; 
                break;
             case 'square': 
                anatomicalStructure += " [GLUTEAL GEOMETRY: ATHLETIC SQUARE] Prominent hip dips. Muscular density. "; 
                break;
             case 'natural':
                anatomicalStructure += " [GLUTEAL GEOMETRY: NATURAL TEARDROP] Balanced distribution. ";
                break;
             default: 
                anatomicalStructure += ` [GLUTEAL GEOMETRY: ${shape.toUpperCase()}]. `;
                break;
        }

        // 3. WAIST
        if (isSnatched) {
            anatomicalStructure += " [MORPHOLOGY: HYPER-HOURGLASS] WAIST-TO-HIP RATIO: 0.6. Tiny waist relative to hips. ";
            softTissueDynamics += " TENSION: Waistband digs slightly into skin. ";
        } else if (bio.waist > 70) {
            anatomicalStructure += " [MORPHOLOGY: STRAIGHT/RECTANGLE] Minimal difference between waist and hip width. ";
        }

        // 4. VOLUME
        if (bio.buttSize > 85) {
            anatomicalStructure += " [VOLUME: EXTREME/BBL] Impossibly wide hips. Thighs must touch. ";
        } else if (bio.buttSize > 60) {
            anatomicalStructure += " [VOLUME: CURVY] Soft, heavy feminine curves. ";
        } else if (bio.buttSize < 30) {
            anatomicalStructure += " [VOLUME: RUNWAY SLENDER] Hip bones visible. Very narrow frame. Thigh gap. ";
        }

        // 5. BUST
        if (bio.bustSize > 80) anatomicalStructure += " [BUST: HEAVY/FULL] Significant upper body volume. Fabric straining. ";
        else if (bio.bustSize < 30) anatomicalStructure += " [BUST: PETITE] Flat/Athletic chest. ";
    }

    // 6. IDENTITY & FACE (Forensic Lock)
    let identityMandate = "";
    if (sub.baseImages.length > 0 && bio.likenessStrength > 40) {
        identityMandate = `
        [FORENSIC IDENTITY MAPPING]
        - TARGET: CLONE THE FACE FROM THE 'MASTER ANCHOR' IMAGE.
        - STRICT GEOMETRY: Do not alter nose width, eye spacing, or jawline.
        - TEXTURE PROJECTION: Map the exact skin details from source to output.
        - BODY INDEPENDENCE: USE THE GENERATED BODY MORPHOLOGY, BUT KEEP THE FACE EXACT.
        `;
    }

    // 7. COMPILE
    if (isFast) {
        bioDesc = `SUBJECT ${index + 1}: ${anatomicalStructure} ${softTissueDynamics}`;
    } else {
        let heightContext = bio.height > 178 ? "TALL/STATUESQUE" : bio.height < 160 ? "PETITE" : "AVERAGE HEIGHT";
        let muscleContext = bio.muscle > 60 ? "FITNESS MODEL DEFINITION" : "SOFT/NATURAL";
        
        bioDesc = `SUBJECT ${index + 1} (${sub.name}):
        GENDER: ${sub.gender}. AGE: ${bio.age}. STATURE: ${heightContext}. BUILD: ${muscleContext}.
        
        >>> MORPHOLOGY MANDATE (NON-NEGOTIABLE):
        ${anatomicalStructure}
        ${softTissueDynamics}
        ${identityMandate}
        <<< END MORPHOLOGY`;
    }
    
    // WARDROBE
    let wardrobeInstruction = "";
    if (sub.wardrobe.mode === 'try-on' && sub.wardrobe.referenceImage) {
        wardrobeInstruction = `[WARDROBE: VISUAL CLONE] IGNORE text description. Clone the outfit from the attached CLOTHING REFERENCE IMAGE exactly. [OVERRIDE: DO NOT MATCH SUBJECT ${index === 0 ? '2' : '1'} STYLE]`;
    } else {
        wardrobeInstruction = `WARDROBE: ${w.top}, ${w.bottom}, ${w.shoes}, ${w.headwear}, ${w.accessories}. FIT: ${fit}.`;
    }

    const poseInstruction = sub.poseLocked ? `POSE (LOCKED): "${sub.pose}"` : `POSE: "${sub.pose}"`;
    return `${bioDesc}\n${poseInstruction}\n${wardrobeInstruction}`;
    }).join('\n\n [SEPARATION: ENSURE SUBJECTS DO NOT MORPH / IDENTITY FIREWALL] \n\n');

    // ATMOSPHERE & OPTICS
    let atmosphericEngine = "";
    if (world.chaosLevel > 50) atmosphericEngine = "ATMOSPHERE: Volumetric light, dust, haze. Lived-in environment.";
    
    // Camera Logic with Strict Selfie Perspective
    let optics = "";
    if (world.camera === 'smartphone') {
        const sm = world.selfieMode || 'off';
        if (sm !== 'off') {
             optics = `[CAMERA: SMARTPHONE FRONT-FACING] [PERSPECTIVE: SELFIE POV] `;
             if (sm === 'mirror') {
                 optics += `ACTION: Mirror Selfie. The subject is holding a smartphone in their hand, facing a mirror. The phone IS VISIBLE in the reflection. `;
             } else {
                 optics += `ACTION: The subject is holding the camera. Arm extended towards the lens. The image is taken from the phone's perspective (POV). `;
                 if (sm === 'high-angle') optics += `ANGLE: High (MySpace style). Camera above head. `;
                 if (sm === 'low-angle') optics += `ANGLE: Low (Chin up). `;
                 if (sm === '0.5x-wide') optics += `LENS: 0.5x Ultra-Wide. Distortion on face/hands. `;
             }
             optics += `IMPERFECTIONS: Digital noise, smartphone post-processing, flash falloff.`;
        } else {
             optics = `CAMERA: Smartphone Rear Camera. LENS: Wide 24mm equivalent. LOOK: Sharp, digital, computational photography.`;
        }
    } else {
        optics = `CAMERA: ${world.cameraBrand} ${world.camera}. LENS: ${world.focalLength}. ANGLE: ${world.cameraAngle || 'Neutral'}. APERTURE: ${world.aperture}. ISO: ${world.iso}.`;
    }

    const preamble = `${MASTER_PROMPT_BIBLE}\n\nTASK: GENERATE HYPER-REALISTIC IMAGE.`;
    const masterNarrative = state.masterPrompt ? `NARRATIVE: "${state.masterPrompt}"` : "";
    const negativeBlock = world.negativePrompt ? `\nNEGATIVE PROMPT: ${world.negativePrompt}` : "";

    return `${preamble} ${masterNarrative} SCENE: ${world.location}, ${world.lighting}, ${world.timeOfDay}. ${atmosphericEngine} ${optics} \n\n${subjectsPrompt} ${negativeBlock}`;
  }

  async generateImage(state: AuraState, compiledPrompt: string): Promise<string> {
    const operation = async () => {
        const modelId = ModelVersion.GEMINI_3_0_PRO;
        const parts: any[] = [{ text: compiledPrompt }];

        // ANTI-COLLAGE INJECTION
        parts.push({ text: "NEGATIVE PROMPT: collage, composite, split screen, picture in picture, floating image, watermark, ui elements, text overlay, multiple angles, reference sheet, boxy waist, straight hips, male hips (if female), flat glutes (if curvy), anatomical impossibility, bad hands." });

        if (state.mode === 'duo' && state.coupleReferenceImage) {
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(state.coupleReferenceImage) } });
             parts.push({ text: `JOINT REFERENCE: Use ONLY for facial identity. DO NOT COMPOSITE THE IMAGE ITSELF. GENERATE NEW PIXELS.` });
        }

        const activeSubjects = state.mode === 'duo' ? state.subjects : [state.subjects[0]];
        
        // Strict Separation of Reference Data
        activeSubjects.forEach((sub, i) => {
            const subjectLabel = `SUBJECT_${i + 1}`; // Underscore for better tokenization
            
            // SEPARATOR TO PREVENT BLEED
            if (i > 0) {
                parts.push({ text: `\n\n<<< IDENTITY FIREWALL >>>\nSWITCHING CONTEXT. STOP GENERATING SUBJECT 1. START GENERATING ${subjectLabel} (${sub.gender}). DO NOT BLEND FEATURES.\n\n` });
            }

            if (sub.baseImages?.length) {
                // Header Block with MASTER ANCHOR Logic
                parts.push({ text: `\n>>> START VISUAL DATA FOR ${subjectLabel} (${sub.gender}) <<<\n` });
                
                sub.baseImages.forEach((img, idx) => {
                    const isAnchor = idx === 0;
                    if (isAnchor) {
                         parts.push({ text: `[TARGET: ${subjectLabel}] [ACTION: CLONE FACE GEOMETRY] The following image is the MASTER ANCHOR.` });
                         parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(img) } });
                    } else {
                         parts.push({ text: `[TARGET: ${subjectLabel}] [ACTION: ADD DEPTH] Secondary reference.` });
                         parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(img) } });
                    }
                });
                
                // Footer Block
                parts.push({ text: `>>> END VISUAL DATA FOR ${subjectLabel} <<<\nCRITICAL: FORENSIC IDENTITY LOCK ACTIVE for ${subjectLabel}.` });
            }
            
            if (sub.poseReferenceImage) {
                 parts.push({ text: `\n[POSE REFERENCE FOR ${subjectLabel}]` });
                 parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(sub.poseReferenceImage) } });
                 parts.push({ text: `USE SKELETAL STRUCTURE ONLY. DO NOT COMPOSITE IMAGE.` });
            }
            
            if (sub.wardrobe.referenceImage && sub.wardrobe.mode === 'try-on') {
                parts.push({ text: `\n[CLOTHING REFERENCE FOR ${subjectLabel}]` });
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(sub.wardrobe.referenceImage) } });
                parts.push({ text: `CRITICAL: CLOTHING CLONE PROTOCOL. The above image is the EXACT OUTFIT for ${subjectLabel}. Ignore any conflicting text descriptions. Transfer the fabric, pattern, cut, and ACCESSORIES (jewelry, bags, glasses) onto ${subjectLabel}. DO NOT TRANSFER TATTOOS, SCARS, BIRTHMARKS, OR BODY MODIFICATIONS from this reference image. The subject's skin must remain consistent with their bio settings.` });
            }
        });

        // Resolve requested resolution to 2K or 4K for API
        // For 50MP we request the maximum '4K' from API as base
        let requestedSize = '2K';
        if (state.tech.resolution === OutputResolution.RES_4K || 
            state.tech.resolution === OutputResolution.RES_8K ||
            state.tech.resolution === OutputResolution.RES_50MP) {
            requestedSize = '4K';
        }

        const client = this.getClient();
        const response = await client.models.generateContent({ 
            model: modelId, 
            contents: { parts }, 
            config: { 
                imageConfig: { 
                    aspectRatio: state.tech.aspectRatio === '21:9' ? '16:9' : state.tech.aspectRatio, 
                    imageSize: requestedSize 
                } 
            } 
        });
        
        if (!response.candidates?.length) throw new Error("No content.");
        const candidate = response.candidates[0];
        if (candidate.finishReason === 'SAFETY') throw new Error("Generated image blocked by Safety Filters. Try adjusting the prompt or changing the pose.");
        
        // Success Path
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
        }

        // Error Handling: If model returned text instead of image (e.g. rejection)
        const textResponse = candidate.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
             console.warn("Model returned text:", textResponse);
             // Return a structured error that the UI can display nicely, or throw
             throw new Error(`AI REFUSAL: ${textResponse}`);
        }

        throw new Error("No image data received from API.");
    };
    try { return await retryOperation(operation); } catch (e: any) { console.error("Image Generation Failed:", e); throw new Error(e.message || "Image Generation Failed"); }
  }
}
export const auraEngine = new AuraEngine();
