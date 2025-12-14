
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, LuxuryButton, LuxuryInput, LuxurySlider, LuxurySelect, LuxuryDropdown, ImageUploader, MultiImageUploader, AuraLoader, ReviewModal, Collapsible } from './components/UIComponents';
import { DEFAULT_STATE, PRESETS, POSES, DUO_POSES, LOCATIONS, LIGHTING_PRESETS, AESTHETICS, BIO_PRESETS, FIT_OPTIONS, DEFAULT_PERSONAS, BODY_SHAPES, BUTT_SHAPES, SELFIE_MODES, FOCAL_LENGTHS, LENS_DESCRIPTIONS, CAMERA_BRANDS, COMMON_NEGATIVE_PROMPTS, CAMERA_ANGLES } from './constants';
import { AuraState, AppMode, GeneratedAsset, AspectRatio, ModelVersion, OutputResolution, SubjectConfig, Persona, TextModelVersion } from './types';
import { auraEngine } from './services/geminiService';

// Declare globals
declare var JSZip: any;

const App = () => {
  // --- State ---
  const [hasKey, setHasKey] = useState(false);
  const [config, setConfig] = useState<AuraState>(DEFAULT_STATE);
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0); 
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(''); 
  const [subProgress, setSubProgress] = useState(''); 
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [magicLoading, setMagicLoading] = useState<string | null>(null);
  const [selectedAesthetic, setSelectedAesthetic] = useState('');
  
  // Director State
  const [directorImage, setDirectorImage] = useState<string | null>(null);

  // Mobile specific state
  const [mobileTab, setMobileTab] = useState<'setup' | 'preview'>('setup');

  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  
  const [pendingSuggestion, setPendingSuggestion] = useState<{
      isOpen: boolean;
      title: string;
      content: any;
      onAccept: () => void;
  }>({ isOpen: false, title: '', content: null, onAccept: () => {} });

  // --- API Key Check ---
  useEffect(() => {
    const checkKey = async () => {
       if ((window as any).aistudio) {
           try {
             const selected = await (window as any).aistudio.hasSelectedApiKey();
             setHasKey(selected);
           } catch(e) {
             console.error("Key check failed", e);
           }
       } else {
           setHasKey(true);
       }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
      if ((window as any).aistudio) {
          try {
              await (window as any).aistudio.openSelectKey();
              setHasKey(true);
          } catch (e) {
              console.error("Select key failed", e);
          }
      }
  };

  // --- Helpers ---
  const getActiveSubject = () => config.subjects[activeSubjectIdx];
  const updateSubject = (updater: (s: SubjectConfig) => SubjectConfig) => {
      setConfig(prev => {
          const newSubs = [...prev.subjects];
          newSubs[activeSubjectIdx] = updater(newSubs[activeSubjectIdx]);
          return { ...prev, subjects: newSubs };
      });
  };

  const getLockedContext = (sub: SubjectConfig) => {
      if (!sub.wardrobe.lockedItems.length) return "";
      const locked = sub.wardrobe.lockedItems.map(key => {
          return `${key}: ${sub.wardrobe.items[key as keyof typeof sub.wardrobe.items]}`;
      }).join(", ");
      return `Locked Items for ${sub.name}: [${locked}].`;
  };

  const getGenderedLabel = (key: string, gender: string) => {
      const isFemale = gender === 'female';
      const isMale = gender === 'male';

      switch (key) {
          case 'underwear': return isFemale ? 'Lingerie / BH & Slip' : isMale ? 'Boxershorts / Briefs' : 'Ondergoed';
          case 'legwear': return isFemale ? 'Panty / Kousen' : isMale ? 'Sokken / Thermisch' : 'Beenmode';
          case 'top': return isFemale ? 'Top / Blouse / Jurk' : isMale ? 'Shirt / Overhemd / Pak' : 'Top / Bovenkleding';
          case 'bottom': return isFemale ? 'Rok / Broek' : isMale ? 'Broek / Pantalon' : 'Broek / Onderkleding';
          default: return key;
      }
  };

  // Helper for dynamic biometric labels
  const getBioLabel = (key: string, gender: string) => {
      const isMale = gender === 'male';
      switch(key) {
          case 'bustSize': return isMale ? 'Borstspier Massa (Pecs)' : 'Bust Volume / Cup';
          case 'buttSize': return isMale ? 'Been/Glute Massa' : 'Heup / Billen Volume';
          case 'waist': return isMale ? 'Middel / Core' : 'Taille (Snatched)';
          case 'muscle': return 'Spierdefinitie';
          case 'weight': return 'Lichaamsgewicht';
          case 'height': return 'Lengte';
          case 'likenessStrength': return 'Face Likeness';
          case 'skinTexture': return 'Huid Textuur';
          default: return key;
      }
  };

  // --- High Fidelity Download Logic ---
  const handleDownload = async (asset: GeneratedAsset, format: 'png' | 'jpg') => {
      setIsProcessingDownload(true);
      try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = asset.url;
          
          await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
          });

          // Determine Target Dimensions based on Resolution & Aspect Ratio
          let targetW = img.width;
          let targetH = img.height;
          
          const res = asset.config.tech.resolution;
          const ar = asset.config.tech.aspectRatio;
          
          let longEdge = 2048; // Default Native
          if (res === OutputResolution.RES_4K) longEdge = 3840;
          if (res === OutputResolution.RES_8K) longEdge = 7680;
          if (res === OutputResolution.RES_50MP) longEdge = 8700; // ~50.3 MP

          // Calculate dimensions based on AR
          if (ar === AspectRatio.SQUARE) {
              targetW = longEdge;
              targetH = longEdge;
          } else if (ar === AspectRatio.PORTRAIT) {
              targetW = Math.round(longEdge * (9/16));
              targetH = longEdge;
          } else if (ar === AspectRatio.LANDSCAPE) {
              targetW = longEdge;
              targetH = Math.round(longEdge * (9/16));
          } else if (ar === AspectRatio.CINEMATIC) {
              targetW = longEdge;
              targetH = Math.round(longEdge * (9/21));
          }

          // Use Canvas for Upscaling/Resampling
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) throw new Error("Canvas context failed");

          // High Quality Filtering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw
          ctx.drawImage(img, 0, 0, targetW, targetH);

          // Export
          const filename = `aura-${res.split(' ')[0]}-${asset.id}.${format}`;
          
          if (format === 'png') {
              // PNG: Lossless
              canvas.toBlob((blob) => {
                  if (blob) {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                  }
              }, 'image/png');
          } else {
              // JPG: High Quality 1.0
              const url = canvas.toDataURL('image/jpeg', 1.0);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }

      } catch (e) {
          console.error("Download failed", e);
          alert("Upscale failed. Downloading original file.");
          const link = document.createElement("a");
          link.href = asset.url;
          link.download = `aura-backup-${asset.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } finally {
          setIsProcessingDownload(false);
      }
  };

  // --- Update Handlers ---
  const updateBio = (key: keyof SubjectConfig['bio'], val: any) => {
      updateSubject(s => ({ ...s, bio: { ...s.bio, [key]: val } }));
  };

  const updateWardrobe = (key: keyof SubjectConfig['wardrobe']['items'], val: string) => {
      updateSubject(s => ({ ...s, wardrobe: { ...s.wardrobe, items: { ...s.wardrobe.items, [key]: val } } }));
  };

  const toggleLock = (key: string) => {
      updateSubject(s => {
          const current = s.wardrobe.lockedItems;
          const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
          return { ...s, wardrobe: { ...s.wardrobe, lockedItems: next } };
      });
  };

  const addSubjectImage = (b64: string) => {
      updateSubject(s => ({ ...s, baseImages: [...s.baseImages, b64].slice(0, 5) }));
  };
  const removeSubjectImage = (idx: number) => {
      updateSubject(s => ({ ...s, baseImages: s.baseImages.filter((_, i) => i !== idx) }));
  };

  // --- AI Actions ---
  const handleMagicGen = async (field: string, contextType: string) => {
      setMagicLoading(field);
      try {
          const sub = getActiveSubject();
          let suggestion = "";
          
          if (field === 'location') {
              suggestion = await auraEngine.generateConcept('location', { 
                  aesthetic: selectedAesthetic || config.world.negativePrompt, 
                  vibe: config.masterPrompt 
              });
              if (suggestion) setConfig(prev => ({ ...prev, world: { ...prev.world, location: suggestion } }));
          } 
          else if (field === 'pose') {
              suggestion = await auraEngine.generateConcept('pose', {
                  location: config.world.location,
                  vibe: selectedAesthetic
              });
              if (suggestion) updateSubject(s => ({ ...s, pose: suggestion }));
          }
          else if (['top', 'bottom', 'shoes', 'headwear', 'accessories', 'underwear', 'legwear'].includes(field)) {
              suggestion = await auraEngine.generateConcept(field, {
                  aesthetic: selectedAesthetic,
                  location: config.world.location,
                  gender: sub.gender,
                  pose: sub.pose,
                  currentItem: (sub.wardrobe.items as any)[field]
              }, getLockedContext(sub));
              if (suggestion) updateWardrobe(field as any, suggestion);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setMagicLoading(null);
      }
  };

  const handleDirectorScript = async () => {
    if (!config.masterPrompt && !directorImage) {
        alert("Please enter a concept or upload a reference image for the Director.");
        return;
    }
    setMagicLoading('director');
    try {
        const sub = getActiveSubject();
        // Construct basic constraints
        const constraints = config.subjects.map((s, i) => `Subject ${i+1}: ${s.gender}, ${s.bio.age}yo.`).join('; ');
        
        const script = await auraEngine.generateSceneScript(
            config.masterPrompt || "Analyze reference image and create a scene.",
            directorImage || undefined,
            getLockedContext(sub),
            `Current Location: ${config.world.location}`,
            'gemini-2.5-flash',
            constraints,
            config.mode
        );

        if (script) {
            setPendingSuggestion({
                isOpen: true,
                title: '🎬 Director\'s Cut',
                content: script,
                onAccept: () => {
                    // Apply World Settings
                    setConfig(prev => ({
                        ...prev,
                        world: {
                            ...prev.world,
                            location: script.location || prev.world.location,
                            lighting: script.lighting || prev.world.lighting,
                            timeOfDay: script.timeOfDay || prev.world.timeOfDay,
                            camera: script.camera || prev.world.camera,
                            cameraBrand: script.cameraBrand || prev.world.cameraBrand,
                            focalLength: script.focalLength || prev.world.focalLength,
                            cameraAngle: script.cameraAngle || prev.world.cameraAngle,
                            aperture: script.aperture || prev.world.aperture,
                            chaosLevel: script.chaosLevel || prev.world.chaosLevel
                        }
                    }));
                    
                    // Apply Subject 1 Settings
                    if (script.subject1 && script.subject1.wardrobe) {
                         const s1Wardrobe = script.subject1.wardrobe;
                         setConfig(prev => {
                             const newSubs = [...prev.subjects];
                             newSubs[0] = {
                                 ...newSubs[0],
                                 pose: script.pose || newSubs[0].pose,
                                 wardrobe: { ...newSubs[0].wardrobe, items: { ...newSubs[0].wardrobe.items, ...s1Wardrobe } }
                             };
                             return { ...prev, subjects: newSubs };
                         });
                    }

                    // Apply Subject 2 Settings (if duo)
                    if (config.mode === 'duo' && script.subject2 && script.subject2.wardrobe) {
                        const s2Wardrobe = script.subject2.wardrobe;
                         setConfig(prev => {
                             const newSubs = [...prev.subjects];
                             newSubs[1] = {
                                 ...newSubs[1],
                                 wardrobe: { ...newSubs[1].wardrobe, items: { ...newSubs[1].wardrobe.items, ...s2Wardrobe } }
                             };
                             return { ...prev, subjects: newSubs };
                         });
                    }
                    
                    setPendingSuggestion(p => ({ ...p, isOpen: false }));
                }
            });
        }
    } catch (e) {
        console.error(e);
        alert("Director failed to write script.");
    } finally {
        setMagicLoading(null);
    }
  };
  
  const handleAnalyzeOutfit = async () => {
    const sub = getActiveSubject();
    if (!sub.wardrobe.referenceImage) return;

    setMagicLoading('analyzing-outfit');
    try {
        const analysis = await auraEngine.analyzeGarment(sub.wardrobe.referenceImage);
        if (analysis) {
             updateSubject(s => {
                 // 1. Merge analysis into current items
                 const newItems = { ...s.wardrobe.items, ...analysis };
                 
                 // 2. Lock the fields that have values (so they are "fixed")
                 const keysToLock = Object.keys(analysis).filter(k => analysis[k]);
                 const newLocks = [...new Set([...s.wardrobe.lockedItems, ...keysToLock])];

                 return {
                     ...s,
                     wardrobe: {
                         ...s.wardrobe,
                         items: newItems,
                         lockedItems: newLocks,
                         mode: 'ai-couture' // 3. SWITCH MODE back to Creative so user sees the text inputs
                     }
                 };
             });
        }
    } catch(e) { console.error(e); }
    finally { setMagicLoading(null); }
  };

  const generate = async () => {
      if (!hasKey) { handleConnectKey(); return; }
      
      setIsGenerating(true);
      setProgress('Initializing Quantum Engine...');
      setSubProgress('Compiling biometrics...');

      // Switch to preview tab on mobile automatically
      setMobileTab('preview');

      try {
          const prompt = await auraEngine.compilePrompt(config);
          
          setProgress('Rendering Image...');
          setSubProgress('Calculating light paths...');
          
          // Generate multiple images if configured
          const count = config.tech.numberOfImages || 1;
          const newAssets: GeneratedAsset[] = [];

          for (let i = 0; i < count; i++) {
              setSubProgress(`Generating frame ${i+1}/${count}...`);
              const b64 = await auraEngine.generateImage(config, prompt);
              const asset: GeneratedAsset = {
                  id: Date.now().toString() + i,
                  url: b64,
                  timestamp: Date.now(),
                  config: { ...config },
                  promptUsed: prompt
              };
              newAssets.push(asset);
          }

          setGallery(prev => [...newAssets, ...prev]);
          if (newAssets.length > 0) setSelectedAsset(newAssets[0]);
          
          if (config.tech.autoDownload) {
             newAssets.forEach(a => handleDownload(a, 'png'));
          }

      } catch (e: any) {
          console.error(e);
          alert(`Error: ${e.message}`);
          setIsGenerating(false); // Reset only on error, success keeps preview open
      } finally {
          setIsGenerating(false);
          setProgress('');
          setSubProgress('');
      }
  };

  const generateWardrobe = async () => {
    setMagicLoading('wardrobe');
    try {
        const sub = getActiveSubject();
        const locked = getLockedContext(sub);
        const suggestion = await auraEngine.generateWardrobe({
            ...sub.bio,
            gender: sub.gender,
            pose: sub.pose,
            aesthetic: selectedAesthetic, 
            location: config.world.location,
            bodyType: sub.bio.bodyShape
        }, locked);
        
        if (suggestion) {
            setPendingSuggestion({
                isOpen: true,
                title: 'AI Stylist Proposal',
                content: suggestion,
                onAccept: () => {
                   updateSubject(s => ({
                       ...s,
                       wardrobe: {
                           ...s.wardrobe,
                           items: { ...s.wardrobe.items, ...suggestion }
                       }
                   }));
                   setPendingSuggestion(p => ({ ...p, isOpen: false }));
                }
            });
        }
    } catch(e) { console.error(e); } finally { setMagicLoading(null); }
  };
  
  if (!hasKey) {
      return (
          <div className="flex h-[100dvh] items-center justify-center bg-[#050505] text-center">
              <div className="space-y-6 max-w-md p-8">
                  <div className="w-20 h-20 bg-aura-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <span className="text-4xl">💎</span>
                  </div>
                  <h1 className="text-3xl font-light tracking-[0.2em] text-white">AURA AI STUDIO</h1>
                  <p className="text-gray-400 font-light">Ultra-High Fidelity Persona Engine</p>
                  <LuxuryButton onClick={handleConnectKey} className="w-full">
                      Connect Gemini API Key
                  </LuxuryButton>
                  <p className="text-xs text-gray-600">Must be a paid tier key for Veo/Pro access.</p>
              </div>
          </div>
      );
  }

  const activeSub = getActiveSubject();

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#050505] text-gray-200 overflow-hidden font-sans selection:bg-aura-accent selection:text-white">
      {isGenerating && <AuraLoader text={progress} subtext={subProgress} />}
      {isProcessingDownload && <AuraLoader text="UPSCALING" subtext="Enhancing resolution..." />}
      
      <ReviewModal 
        isOpen={pendingSuggestion.isOpen}
        title={pendingSuggestion.title}
        content={pendingSuggestion.content}
        onAccept={pendingSuggestion.onAccept}
        onReject={() => setPendingSuggestion(p => ({ ...p, isOpen: false }))}
      />

      {/* MOBILE TAB SWITCHER (Visible only on mobile) */}
      <div className="md:hidden flex border-b border-white/10 bg-[#0a0a0a]">
          <button 
            onClick={() => setMobileTab('setup')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${mobileTab === 'setup' ? 'text-aura-accent border-b-2 border-aura-accent' : 'text-gray-500'}`}
          >
            Studio Setup
          </button>
          <button 
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest ${mobileTab === 'preview' ? 'text-aura-accent border-b-2 border-aura-accent' : 'text-gray-500'}`}
          >
            Result Gallery
          </button>
      </div>

      {/* LEFT PANEL: CONTROLS */}
      <div className={`w-full md:w-[450px] flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md z-10 
          ${mobileTab === 'setup' ? 'flex-1 overflow-y-auto' : 'hidden md:flex md:h-full'}
      `}>
         {/* HEADER (Desktop Only) */}
         <div className="hidden md:block p-6 border-b border-white/5 bg-gradient-to-r from-[#0a0a0a] to-[#111]">
            <h1 className="text-xl font-light tracking-[0.3em] text-white flex items-center gap-2">
                <span className="text-aura-accent">✦</span> AURA
            </h1>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
             {/* MODE SELECTOR */}
             <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-lg">
                     <button 
                       onClick={() => setConfig(prev => ({ ...prev, mode: 'solo' }))}
                       className={`py-2 text-xs uppercase tracking-widest rounded-md transition-all ${config.mode === 'solo' ? 'bg-aura-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                         Solo
                     </button>
                     <button 
                       onClick={() => setConfig(prev => ({ ...prev, mode: 'duo' }))}
                       className={`py-2 text-xs uppercase tracking-widest rounded-md transition-all ${config.mode === 'duo' ? 'bg-aura-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                         Duo
                     </button>
                 </div>
                 
                 {config.mode === 'duo' && (
                     <div className="flex gap-2 justify-center">
                         {config.subjects.map((sub, idx) => (
                             <button
                               key={sub.id}
                               onClick={() => setActiveSubjectIdx(idx)}
                               className={`px-4 py-1 text-[10px] uppercase rounded-full border transition-all ${activeSubjectIdx === idx ? 'border-aura-accent text-aura-accent bg-aura-accent/10' : 'border-white/10 text-gray-600'}`}
                             >
                                 {sub.name}
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             {/* SUBJECT CONFIGURATION */}
             <GlassCard className="p-4" delay={100}>
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-bold text-white uppercase tracking-widest">Subject Identity</h3>
                     <span className="text-[10px] text-gray-500">{activeSub.gender.toUpperCase()}</span>
                 </div>
                 
                 <LuxurySelect
                    label="Gender Identity"
                    value={activeSub.gender}
                    options={['female', 'male', 'non-binary']}
                    onChange={(v) => updateSubject(s => ({ ...s, gender: v }))}
                 />
                 
                 <MultiImageUploader 
                    label="Face Reference (Identity Lock)" 
                    images={activeSub.baseImages} 
                    onAdd={addSubjectImage}
                    onRemove={removeSubjectImage}
                 />

                 <Collapsible title="Biometrics & Body" defaultOpen>
                     <LuxurySlider label="Age" value={activeSub.bio.age} min={18} max={90} onChange={v => updateBio('age', v)} />
                     <LuxurySlider label={getBioLabel('height', activeSub.gender)} value={activeSub.bio.height} min={140} max={220} onChange={v => updateBio('height', v)} info="cm" />
                     <LuxurySlider label={getBioLabel('weight', activeSub.gender)} value={activeSub.bio.weight} min={0} max={100} onChange={v => updateBio('weight', v)} info="Ectomorph vs Endomorph" />
                     <LuxurySlider label={getBioLabel('muscle', activeSub.gender)} value={activeSub.bio.muscle} min={0} max={100} onChange={v => updateBio('muscle', v)} />
                     
                     <div className="my-4 border-t border-white/5 pt-4">
                         <LuxurySlider label={getBioLabel('bustSize', activeSub.gender)} value={activeSub.bio.bustSize} min={0} max={100} onChange={v => updateBio('bustSize', v)} />
                         <LuxurySlider label={getBioLabel('waist', activeSub.gender)} value={activeSub.bio.waist} min={0} max={100} onChange={v => updateBio('waist', v)} />
                         <LuxurySlider label={getBioLabel('buttSize', activeSub.gender)} value={activeSub.bio.buttSize} min={0} max={100} onChange={v => updateBio('buttSize', v)} />
                     </div>

                     <LuxurySelect 
                        label="Body Shape" 
                        value={activeSub.bio.bodyShape} 
                        options={Object.keys(BODY_SHAPES)} 
                        onChange={v => updateBio('bodyShape', v)} 
                     />
                     
                     <LuxurySelect 
                        label="Body Hair" 
                        value={activeSub.bio.bodyHair} 
                        options={['none', 'sparse', 'natural', 'hairy']} 
                        onChange={v => updateBio('bodyHair', v)} 
                     />
                 </Collapsible>
                 
                 <Collapsible title="Wardrobe & Styling">
                    <div className="mb-4">
                        <LuxurySelect
                            label="Styling Mode"
                            value={activeSub.wardrobe.mode === 'try-on' ? 'Visual Clone / Try-On' : 'AI Creative'}
                            options={['AI Creative', 'Visual Clone / Try-On']}
                            onChange={(v) => updateSubject(s => ({
                                ...s,
                                wardrobe: { ...s.wardrobe, mode: v === 'Visual Clone / Try-On' ? 'try-on' : 'ai-couture' }
                            }))}
                        />
                    </div>

                    {activeSub.wardrobe.mode === 'try-on' ? (
                        <>
                            <ImageUploader 
                                label="Clothing Reference (Virtual Try-On)"
                                image={activeSub.wardrobe.referenceImage || null}
                                onUpload={b64 => updateSubject(s => ({
                                    ...s,
                                    wardrobe: { ...s.wardrobe, referenceImage: b64 }
                                }))}
                            />
                            {activeSub.wardrobe.referenceImage && (
                                <div className="mb-6">
                                     <LuxuryButton 
                                        variant="secondary" 
                                        onClick={handleAnalyzeOutfit} 
                                        isLoading={magicLoading === 'analyzing-outfit'}
                                        className="w-full text-xs border-aura-accent/40 bg-aura-accent/5 hover:bg-aura-accent/20"
                                     >
                                         🔮 Analyze & Lock Outfit (Convert to Text)
                                     </LuxuryButton>
                                     <p className="text-[10px] text-gray-500 mt-2 text-center">
                                         Analyzes the image, fills the text fields, and switches to 'AI Creative' mode with locked items.
                                     </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between mb-4">
                                 <LuxuryButton variant="secondary" onClick={generateWardrobe} isLoading={magicLoading === 'wardrobe'} className="w-full text-xs">
                                     ✨ AI Stylist (Auto-Match)
                                 </LuxuryButton>
                            </div>
                            {Object.keys(activeSub.wardrobe.items).map(key => (
                                <LuxuryInput
                                    key={key}
                                    label={getGenderedLabel(key, activeSub.gender)}
                                    value={(activeSub.wardrobe.items as any)[key]}
                                    onChange={(v) => updateWardrobe(key as any, v)}
                                    onMagic={() => handleMagicGen(key, 'wardrobe')}
                                    magicLoading={magicLoading === key}
                                    isLocked={(activeSub.wardrobe.lockedItems as string[]).includes(key)}
                                    onToggleLock={() => toggleLock(key)}
                                />
                            ))}
                        </>
                    )}
                 </Collapsible>

                 <Collapsible title="Pose & Action">
                     <LuxuryInput 
                        label="Pose Description" 
                        value={activeSub.pose} 
                        onChange={v => updateSubject(s => ({ ...s, pose: v }))} 
                        onMagic={() => handleMagicGen('pose', 'action')}
                        magicLoading={magicLoading === 'pose'}
                        area 
                     />
                     <ImageUploader 
                        label="Pose Reference (Skeleton)"
                        image={activeSub.poseReferenceImage || null}
                        onUpload={b64 => updateSubject(s => ({ ...s, poseReferenceImage: b64 }))}
                     />
                 </Collapsible>
             </GlassCard>

             {/* WORLD SETTINGS */}
             <GlassCard className="p-4" delay={200}>
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">World & Camera</h3>
                 <LuxuryInput 
                    label="Location" 
                    value={config.world.location} 
                    onChange={v => setConfig(p => ({ ...p, world: { ...p.world, location: v } }))} 
                    onMagic={() => handleMagicGen('location', 'world')}
                    magicLoading={magicLoading === 'location'}
                    area
                 />
                 
                 {/* NEW: LIGHTING & TIME OF DAY CONTROLS */}
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <LuxuryDropdown
                        label="Lighting Style"
                        value={config.world.lighting}
                        options={LIGHTING_PRESETS}
                        onChange={v => setConfig(p => ({ ...p, world: { ...p.world, lighting: v } }))}
                    />
                    <LuxurySelect
                        label="Time of Day"
                        value={config.world.timeOfDay}
                        options={['Sunrise', 'Morning', 'Noon', 'Golden Hour', 'Blue Hour', 'Evening', 'Midnight']}
                        onChange={v => setConfig(p => ({ ...p, world: { ...p.world, timeOfDay: v } }))}
                    />
                 </div>
                 
                 {/* NEW: APERTURE & DEPTH OF FIELD */}
                 <div className="grid grid-cols-2 gap-4 mb-4 border-b border-white/5 pb-4">
                     <LuxuryDropdown
                        label="Aperture (F-Stop)"
                        value={config.world.aperture}
                        options={['f/1.2 (Dreamy)', 'f/1.8 (Portrait)', 'f/2.8 (Sharp)', 'f/5.6 (Deep)', 'f/11 (Landscape)']}
                        onChange={v => setConfig(p => ({ ...p, world: { ...p.world, aperture: v } }))}
                     />
                     <LuxurySlider 
                        label="Bokeh / Blur" 
                        value={config.world.bokehAmount} 
                        min={0} 
                        max={100} 
                        onChange={v => setConfig(p => ({ ...p, world: { ...p.world, bokehAmount: v } }))} 
                     />
                 </div>

                 {/* CAMERA DEVICE & SELFIE MODE */}
                 <LuxurySelect 
                    label="Camera Device" 
                    value={config.world.camera}
                    options={['smartphone', 'full-frame', 'cinema-camera', 'polaroid', 'cctv', 'drone', 'vintage-film']}
                    onChange={v => setConfig(p => ({ ...p, world: { ...p.world, camera: v } }))}
                 />

                 {config.world.camera === 'smartphone' && (
                     <LuxurySelect
                        label="Selfie Mode"
                        value={config.world.selfieMode || 'off'}
                        options={Object.keys(SELFIE_MODES)}
                        onChange={v => setConfig(p => ({ ...p, world: { ...p.world, selfieMode: v } }))}
                     />
                 )}

                 <LuxurySelect 
                    label="Camera Brand" 
                    value={config.world.cameraBrand}
                    options={CAMERA_BRANDS}
                    onChange={v => setConfig(p => ({ ...p, world: { ...p.world, cameraBrand: v } }))}
                 />
                 <LuxuryDropdown
                    label="Focal Length"
                    value={config.world.focalLength}
                    options={FOCAL_LENGTHS}
                    onChange={v => setConfig(p => ({ ...p, world: { ...p.world, focalLength: v } }))}
                 />
                 <LuxuryDropdown
                    label="Camera Angle"
                    value={config.world.cameraAngle}
                    options={CAMERA_ANGLES}
                    onChange={v => setConfig(p => ({ ...p, world: { ...p.world, cameraAngle: v } }))}
                 />
                 <LuxurySlider label="Chaos Level" value={config.world.chaosLevel} min={0} max={100} onChange={v => setConfig(p => ({ ...p, world: { ...p.world, chaosLevel: v } }))} />
                 
                 {/* Director's Cut Section */}
                 <div className="mt-6 pt-4 border-t border-white/5">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-aura-accent uppercase tracking-widest">Director's Master Script</span>
                        <button 
                            onClick={handleDirectorScript}
                            disabled={magicLoading === 'director'}
                            className="text-xs bg-aura-accent/10 border border-aura-accent/30 hover:bg-aura-accent hover:text-white px-3 py-1 rounded transition-all flex items-center gap-2"
                        >
                           {magicLoading === 'director' ? 'WRITING...' : '🎬 AUTO-DIRECT SCENE'}
                        </button>
                     </div>
                     <LuxuryInput 
                         label=""
                         placeholder="Describe a scene concept..."
                         value={config.masterPrompt}
                         onChange={v => setConfig(p => ({ ...p, masterPrompt: v }))}
                         area
                     />
                     <ImageUploader 
                        label="Moodboard / Reference Scene"
                        image={directorImage}
                        onUpload={setDirectorImage}
                     />
                 </div>
             </GlassCard>

             {/* TECH SETTINGS (RESTORED) */}
             <GlassCard className="p-4" delay={300}>
                <Collapsible title="Studio Tech & Output" defaultOpen={false}>
                    <LuxurySelect
                        label="Aspect Ratio"
                        value={config.tech.aspectRatio}
                        options={Object.values(AspectRatio)}
                        onChange={(v) => setConfig(p => ({ ...p, tech: { ...p.tech, aspectRatio: v } }))}
                    />
                    <LuxurySelect
                        label="Resolution & Quality"
                        value={config.tech.resolution}
                        options={Object.values(OutputResolution)}
                        onChange={(v) => setConfig(p => ({ ...p, tech: { ...p.tech, resolution: v } }))}
                    />
                    
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Batch Size</span>
                            <span className="text-xs text-aura-accent font-mono">{config.tech.numberOfImages} Image{config.tech.numberOfImages > 1 ? 's' : ''}</span>
                        </div>
                        <LuxurySlider 
                            label="" 
                            value={config.tech.numberOfImages} 
                            min={1} 
                            max={4} 
                            onChange={(v) => setConfig(p => ({ ...p, tech: { ...p.tech, numberOfImages: v } }))} 
                        />
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quantum Engine</span>
                            <span className="text-[10px] text-gray-600">Flash for Speed, Pro for Realism</span>
                        </div>
                        <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                            <button
                                onClick={() => setConfig(p => ({ ...p, tech: { ...p.tech, model: ModelVersion.GEMINI_2_5_FLASH } }))}
                                className={`px-3 py-1.5 text-[9px] uppercase font-bold rounded transition-all ${config.tech.model === ModelVersion.GEMINI_2_5_FLASH ? 'bg-aura-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Flash 2.5
                            </button>
                            <button
                                onClick={() => setConfig(p => ({ ...p, tech: { ...p.tech, model: ModelVersion.GEMINI_3_0_PRO } }))}
                                className={`px-3 py-1.5 text-[9px] uppercase font-bold rounded transition-all ${config.tech.model === ModelVersion.GEMINI_3_0_PRO ? 'bg-aura-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Pro 3.0
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Auto-Save to Disk</span>
                        <button 
                            onClick={() => setConfig(p => ({ ...p, tech: { ...p.tech, autoDownload: !p.tech.autoDownload } }))}
                            className={`w-10 h-5 rounded-full relative transition-colors ${config.tech.autoDownload ? 'bg-aura-accent' : 'bg-gray-800'}`}
                        >
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${config.tech.autoDownload ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                </Collapsible>
             </GlassCard>
             
             {/* GENERATE BTN */}
             <div className="pt-4 pb-10">
                 <LuxuryButton onClick={generate} disabled={isGenerating} className="w-full py-4 text-base tracking-[0.2em] shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                     {isGenerating ? 'RENDERING...' : 'GENERATE REALITY'}
                 </LuxuryButton>
             </div>
         </div>
      </div>

      {/* RIGHT PANEL: GALLERY & PREVIEW */}
      <div className={`w-full md:flex-1 bg-[#050505] relative flex flex-col 
          ${mobileTab === 'preview' ? 'flex-1' : 'hidden md:flex md:h-full'}
      `}>
          {selectedAsset ? (
              <div className="flex-1 relative group overflow-hidden flex items-center justify-center bg-black">
                  <img 
                    src={selectedAsset.url} 
                    alt="Result" 
                    className="max-h-full max-w-full object-contain shadow-2xl"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <LuxuryButton variant="secondary" onClick={() => handleDownload(selectedAsset, 'png')}>
                          Download PNG (HQ)
                      </LuxuryButton>
                      <LuxuryButton variant="secondary" onClick={() => handleDownload(selectedAsset, 'jpg')}>
                          JPG
                      </LuxuryButton>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-700">
                  <div className="w-24 h-24 border border-gray-800 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl opacity-20">📷</span>
                  </div>
                  <p className="font-light tracking-widest text-sm">NO IMAGE GENERATED</p>
                  <p className="text-xs text-gray-800 mt-2">Mobile: Tap 'Generate Reality' in Studio Setup</p>
              </div>
          )}

          {/* FILM STRIP */}
          <div className="h-32 bg-[#0a0a0a] border-t border-white/5 flex items-center p-4 gap-4 overflow-x-auto custom-scrollbar z-20">
              {gallery.map(asset => (
                  <button 
                    key={asset.id} 
                    onClick={() => setSelectedAsset(asset)}
                    className={`relative aspect-square h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0 ${selectedAsset?.id === asset.id ? 'border-aura-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                      <img src={asset.url} className="w-full h-full object-cover" />
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default App;
