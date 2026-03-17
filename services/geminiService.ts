
import { GoogleGenAI } from "@google/genai";
import { AuraState, ModelVersion, OutputResolution, SubjectConfig, TextModelVersion } from "../types";
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
        const poseContext = context.pose ? `Subject Pose: "${context.pose}".` : "";
        const vibeContext = context.aesthetic ? `Aesthetic Style: "${context.aesthetic}".` : `Vibe: ${context.vibe}.`;
        const lockInstruction = lockedContext ? `LOCKED items: ${lockedContext}` : "";
        
        prompt = `Task: Generate a creative, high-end ${type} for a fashion scene. 
        Context: ${vibeContext} ${genderContext} ${poseContext} ${lockInstruction}
        Style: Luxury, cinematic, detailed. 
        Output: Plain text in DUTCH (Nederlands), max 20 words.`;

        const client = this.getClient(); 
        const response = await client.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: prompt 
        }); 
        return response.text?.trim() || "Klassiek tijdloze esthetiek.";
    };
    try { return await retryOperation(operation); } catch (e) { return "Fout bij genereren."; }
  }

  async generateWardrobe(context: any, lockedContext: string = ""): Promise<any> {
      const operation = async () => {
          const prompt = `Role: High-Fashion Stylist. Create a cohesive look for a ${context.gender}. 
          Age: ${context.age}, Body: ${context.bodyType}, Location: ${context.location}.
          LOCKED: ${lockedContext}
          Output: JSON (headwear, underwear, legwear, top, bottom, shoes, accessories). Language: Dutch.`;
          const client = this.getClient(); 
          const response = await client.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
          }); 
          return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { return null; }
  }

  async generateDuoLook(base64Image: string, context: any, subjectConstraints: string = ""): Promise<any> {
      const operation = async () => {
          const prompt = `Role: Duo Stylist. Analyze reference and create matching outfits. 
          Constraints: ${subjectConstraints}. 
          Output: JSON { subject1: { wardrobe: {} }, subject2: { wardrobe: {} } }. Language: Dutch.`;
          const client = this.getClient(); 
          const response = await client.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: { parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } } ] }, 
            config: { responseMimeType: 'application/json' } 
          }); 
          return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { return null; }
  }

  async generateSceneScript(userConcept: string, referenceImage?: string, lockedContext: string = "", currentContext: string = "", modelId: string = 'gemini-3-flash-preview', subjectConstraints: string = "", mode: 'solo' | 'duo' = 'solo'): Promise<any> {
      const operation = async () => {
        const promptText = `Role: Director. Concept: "${userConcept}". Mode: ${mode}. ${subjectConstraints}. 
        LOCKED: ${lockedContext}. Output: JSON with cinematic scene details. Language: Dutch/English.`;
        const client = this.getClient();
        const parts: any[] = [{ text: promptText }];
        if (referenceImage) parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(referenceImage) } });
        const response = await client.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: { parts }, 
          config: { responseMimeType: 'application/json' } 
        }); 
        return cleanAndParseJSON(response.text || "{}");
      };
      try { return await retryOperation(operation); } catch (e) { return null; }
  }

  async analyzeGarment(base64Image: string): Promise<any> {
    const operation = async () => {
        const prompt = `Role: Fashion Analyst. Analyze clothing and items. 
        Output JSON: { "headwear": "", "underwear": "", "legwear": "", "top": "", "bottom": "", "shoes": "", "accessories": "" }. 
        Language: Dutch.`;
        const client = this.getClient();
        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } }] },
            config: { responseMimeType: 'application/json' }
        });
        return cleanAndParseJSON(response.text || "{}");
    };
    try { return await retryOperation(operation); } catch (e) { return null; }
  }

  async compilePrompt(config: AuraState): Promise<string> {
    const world = config.world;
    const subjects = config.subjects.slice(0, config.mode === 'duo' ? 2 : 1);
    
    let prompt = `You are a world-class, award-winning high-end fashion and portrait photographer, a master of lighting, composition, and hyper-realistic rendering. Your task is to generate an image that is indistinguishable from a real photograph, adhering strictly to the following detailed specifications and the laws of physics.\n\n`;

    prompt += `### MASTER INSTRUCTION & CONCEPT\n`;
    prompt += `Director's Vision: ${config.masterPrompt || "High-end fashion photography, capturing the essence of modern luxury and raw human emotion."}\n\n`;

    prompt += `### ENVIRONMENT & ATMOSPHERE\n`;
    prompt += `Location: ${world.location}. The setting must be rendered with absolute physical accuracy, grounding the subjects in a tangible reality.\n`;
    prompt += `Lighting Setup: ${world.lighting}. Light must behave according to the inverse square law, with realistic falloff, bounce, and ambient occlusion. Shadows should be rich and nuanced, never pure black unless physically accurate.\n`;
    prompt += `Time of Day: ${world.timeOfDay}. The color temperature and angle of the light must perfectly reflect this time.\n`;
    prompt += `Atmospheric Chaos: Level ${world.chaosLevel}. Introduce micro-particles, dust motes, subtle atmospheric haze, or humidity in the air to give depth and volume to the space. The air is not a vacuum.\n`;
    prompt += `Bokeh & Depth of Field: Level ${world.bokehAmount}. Out-of-focus areas must exhibit realistic optical bokeh, mimicking the physical properties of high-end glass lenses.\n\n`;

    prompt += `### CAMERA & OPTICS (THE SENSOR SIMULATION)\n`;
    prompt += `Camera System: ${world.camera}. Simulate the exact sensor readout, dynamic range, and color science of this format.\n`;
    prompt += `Brand Color Science: ${world.cameraBrand}. Apply the specific color grading, highlight rolloff, and skin tone rendering characteristic of this manufacturer.\n`;
    prompt += `Lens / Focal Length: ${world.focalLength}. The perspective distortion, compression, and field of view must exactly match this focal length.\n`;
    prompt += `Camera Angle: ${world.cameraAngle}. Position the virtual camera precisely at this angle to dictate the psychological impact of the shot.\n`;
    prompt += `Aperture: ${world.aperture}. This dictates the exact depth of field. Ensure the transition from sharp focus to out-of-focus is optically perfect.\n`;
    if (world.selfieMode !== 'off') {
        prompt += `Selfie Mode: ${world.selfieMode}. Simulate the specific perspective, arm extension, and slight wide-angle distortion typical of a smartphone selfie.\n`;
    }
    prompt += `\n`;

    prompt += `### SUBJECTS & BIOMETRICS\n`;
    subjects.forEach((sub, i) => {
        prompt += `#### SUBJECT ${i + 1}: ${sub.name}\n`;
        prompt += `Gender: ${sub.gender}\n`;
        prompt += `Age: ${sub.bio.age} years old\n`;
        prompt += `Ethnicity/Background: ${sub.bio.ethnicity}\n`;
        prompt += `Physical Build: Height ${sub.bio.height}cm, Weight ${sub.bio.weight} (relative scale), Muscle Definition ${sub.bio.muscle}%, Body Shape: ${sub.bio.bodyShape}.\n`;
        if (sub.gender === 'female') {
            prompt += `Upper Body Proportion: ${sub.bio.bustSize}%, Lower Body Proportion: ${sub.bio.buttSize}%, Core/Waist: ${sub.bio.waist}%, Hip Structure: ${sub.bio.buttShape}.\n`;
        } else {
            prompt += `Chest Proportion: ${sub.bio.bustSize}%, Lower Body Proportion: ${sub.bio.buttSize}%, Core/Waist: ${sub.bio.waist}%, Hip Structure: ${sub.bio.buttShape}.\n`;
        }
        prompt += `Skin & Texture: Texture Level ${sub.bio.skinTexture}%. The skin must exhibit extreme micro-detail: pores, vellus hair (peach fuzz), subtle vascularity, uneven pigmentation, and realistic subsurface scattering. NO plastic or airbrushed skin.\n`;
        prompt += `Body Hair: ${sub.bio.bodyHair}\n`;
        prompt += `Pose & Action: ${sub.pose}. The body language must be natural, carrying weight and tension. Clothing must drape and fold realistically according to this pose.\n`;
        
        prompt += `Wardrobe & Styling (Fit: ${sub.wardrobe.fitPreference}):\n`;
        if (sub.wardrobe.items.headwear) prompt += `  - Headwear: ${sub.wardrobe.items.headwear}\n`;
        if (sub.wardrobe.items.top) prompt += `  - Top: ${sub.wardrobe.items.top}\n`;
        if (sub.wardrobe.items.bottom) prompt += `  - Bottom: ${sub.wardrobe.items.bottom}\n`;
        if (sub.wardrobe.items.underwear) prompt += `  - Base Layer: ${sub.wardrobe.items.underwear}\n`;
        if (sub.wardrobe.items.legwear) prompt += `  - Legwear: ${sub.wardrobe.items.legwear}\n`;
        if (sub.wardrobe.items.shoes) prompt += `  - Shoes: ${sub.wardrobe.items.shoes}\n`;
        if (sub.wardrobe.items.accessories) prompt += `  - Accessories: ${sub.wardrobe.items.accessories}\n`;
        
        if (sub.baseImages.length > 0) {
            prompt += `Identity Protocol: STRICT_FACE_LOCK. You MUST perfectly reconstruct the facial identity, skull structure, and unique features from the provided reference image [REFERENCE_IMAGES_FOR_SUBJECT_${i+1}]. Do not alter their core identity.\n`;
        }
        if (sub.poseReferenceImage) {
            prompt += `Pose Protocol: STRICT_POSE_LOCK. You MUST perfectly match the pose, posture, and body language from the provided reference image [POSE_REFERENCE_FOR_SUBJECT_${i+1}].\n`;
        }
        if (sub.wardrobe.referenceImage && sub.wardrobe.mode === 'try-on') {
            prompt += `Wardrobe Protocol: STRICT_CLOTHING_LOCK. You MUST perfectly reconstruct the clothing and garments from the provided reference image [CLOTHING_REFERENCE_FOR_SUBJECT_${i+1}].\n`;
        }
        prompt += `\n`;
    });

    if (config.mode === 'duo' && config.coupleReferenceImage) {
        prompt += `### DUO MODE PROTOCOL\n`;
        prompt += `Duo Reference: You MUST perfectly match the interaction, spacing, and relative positioning from the provided reference image [DUO_JOINT_REFERENCE].\n\n`;
    }

    prompt += `### THE LAWS OF PHYSICS & ANTI-CGI PROTOCOL (MANDATORY)\n`;
    prompt += `${MASTER_PROMPT_BIBLE}\n\n`;

    prompt += `### NEGATIVE CONSTRAINTS (DO NOT INCLUDE)\n`;
    prompt += `${config.world.negativePrompt}\n`;

    return prompt;
  }

  async generateImage(config: AuraState, prompt: string): Promise<string> {
    const operation = async () => {
        const client = this.getClient();
        const parts: any[] = [{ text: prompt }];
        
        const subjects = config.subjects.slice(0, config.mode === 'duo' ? 2 : 1);
        subjects.forEach((sub, i) => {
            if (sub.baseImages.length > 0) {
                parts.push({ text: `[REFERENCE_IMAGES_FOR_SUBJECT_${i+1}]` });
                sub.baseImages.forEach(img => {
                    parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(img) } });
                });
            }
            if (sub.poseReferenceImage) {
                parts.push({ text: `[POSE_REFERENCE_FOR_SUBJECT_${i+1}]` });
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(sub.poseReferenceImage) } });
            }
            if (sub.wardrobe.referenceImage && sub.wardrobe.mode === 'try-on') {
                parts.push({ text: `[CLOTHING_REFERENCE_FOR_SUBJECT_${i+1}]` });
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(sub.wardrobe.referenceImage) } });
            }
        });

        if (config.mode === 'duo' && config.coupleReferenceImage) {
            parts.push({ text: "[DUO_JOINT_REFERENCE]" });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(config.coupleReferenceImage) } });
        }

        let ar = config.tech.aspectRatio as string;
        if (ar === '21:9') ar = '16:9';

        const response = await client.models.generateContent({
            model: config.tech.model as string,
            contents: { parts },
            config: {
                imageConfig: {
                    aspectRatio: ar as any,
                    imageSize: config.tech.resolution === OutputResolution.RES_2K ? "1K" : "2K"
                }
            }
        });

        console.log("GENERATE IMAGE RESPONSE:", JSON.stringify(response, null, 2));

        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("No response candidate received.");

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`Generatie gestopt. Reden: ${candidate.finishReason}`);
        }

        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        const textPart = candidate.content?.parts?.find(p => p.text);
        if (textPart?.text) {
            throw new Error(`AI Weigering: ${textPart.text}`);
        }

        throw new Error(`No image data returned from model. Response: ${JSON.stringify(response)}`);
    };
    return await retryOperation(operation);
  }
}

export const auraEngine = new AuraEngine();
