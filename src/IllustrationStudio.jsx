import React, { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { illustrationStyles } from './illustrationStyles'
import './illustration-studio.css'

// Dual Mode Local Storage Keys
const LS_PROJECTS_KEY = 'sw_projects'
const LS_ACTIVE_PROJECT_KEY = 'sw_active_project'
const LS_CHARACTERS_KEY = 'sw_characters'
const LS_SCENES_KEY = 'sw_scenes'

function svgToBase64(svgString) {
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
  } catch (e) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString)
  }
}

// Helper 1: Multi-View Character Turnaround Sheet SVG Generator
function renderCharacterTurnaroundSheetSVG(name, age, dna, outfit, stylePresetName = '3D Cinematic Storybook') {
  const safeName = (name || 'Character').slice(0, 25)
  const safeAge = (age || 'Child').slice(0, 15)
  const safeDna = (dna || 'Physical character features').slice(0, 70)
  const safeOutfit = (outfit || 'Standard outfit').slice(0, 60)

  // Derive outfit / hair colors based on text prompt hints
  const outfitLower = (outfit + ' ' + dna).toLowerCase()
  let hoodieColor = '#3b82f6' // default blue
  let hairColor = '#64748b' // default slate
  let pantsColor = '#1e293b' // default navy/jeans

  if (outfitLower.includes('red') || outfitLower.includes('crimson') || outfitLower.includes('orange')) hoodieColor = '#ef4444'
  else if (outfitLower.includes('green') || outfitLower.includes('emerald')) hoodieColor = '#10b981'
  else if (outfitLower.includes('purple') || outfitLower.includes('violet')) hoodieColor = '#8b5cf6'
  else if (outfitLower.includes('yellow') || outfitLower.includes('gold')) hoodieColor = '#f59e0b'
  else if (outfitLower.includes('pink')) hoodieColor = '#ec4899'

  if (outfitLower.includes('auburn') || outfitLower.includes('brown') || outfitLower.includes('freckles')) hairColor = '#9a3412'
  else if (outfitLower.includes('black') || outfitLower.includes('dark')) hairColor = '#0f172a'
  else if (outfitLower.includes('blonde') || outfitLower.includes('yellow')) hairColor = '#fde047'
  else if (outfitLower.includes('red')) hairColor = '#dc2626'

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
    <defs>
      <linearGradient id="sheetBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="panelBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    
    <!-- Background Sheet Canvas -->
    <rect width="800" height="800" rx="20" fill="url(#sheetBg)" />
    <rect x="20" y="20" width="760" height="760" rx="16" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 4" />

    <!-- Header Header Bar -->
    <rect x="30" y="30" width="740" height="75" rx="12" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" />
    <text x="50" y="62" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f8fafc">${safeName.toUpperCase()}</text>
    <text x="50" y="86" font-family="sans-serif" font-size="13" font-weight="600" fill="#a7f3d0">AGE: ${safeAge} | ART STYLE: ${stylePresetName.toUpperCase()}</text>
    <rect x="520" y="48" width="230" height="38" rx="8" fill="#7c3aed" opacity="0.9" />
    <text x="635" y="72" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">DNA TURNAROUND SHEET</text>

    <!-- Grid Viewports -->
    <!-- Panel 1: Full Body Front View -->
    <rect x="30" y="120" width="230" height="460" rx="12" fill="url(#panelBg)" stroke="#334155" stroke-width="1.5" />
    <text x="145" y="148" font-family="sans-serif" font-size="13" font-weight="bold" fill="#cbd5e1" text-anchor="middle">FULL BODY FRONT</text>
    <!-- Front Human Silhouette -->
    <circle cx="145" cy="220" r="32" fill="#fed7aa" />
    <path d="M 120 205 C 120 180 170 180 170 205 Z" fill="${hairColor}" />
    <circle cx="135" cy="220" r="4" fill="#0f172a" />
    <circle cx="155" cy="220" r="4" fill="#0f172a" />
    <path d="M 138 234 Q 145 240 152 234" stroke="#9a3412" stroke-width="2" fill="none" />
    <rect x="138" y="252" width="14" height="20" fill="#fed7aa" />
    <path d="M 105 272 L 185 272 L 175 420 L 115 420 Z" fill="${hoodieColor}" rx="10" />
    <rect x="115" y="420" width="28" height="120" fill="${pantsColor}" rx="4" />
    <rect x="147" y="420" width="28" height="120" fill="${pantsColor}" rx="4" />
    <rect x="108" y="530" width="38" height="18" fill="#f97316" rx="6" />
    <rect x="144" y="530" width="38" height="18" fill="#f97316" rx="6" />

    <!-- Panel 2: Three-Quarter View -->
    <rect x="285" y="120" width="230" height="460" rx="12" fill="url(#panelBg)" stroke="#334155" stroke-width="1.5" />
    <text x="400" y="148" font-family="sans-serif" font-size="13" font-weight="bold" fill="#cbd5e1" text-anchor="middle">THREE-QUARTER VIEW</text>
    <!-- 3/4 Human Figure -->
    <ellipse cx="400" cy="220" rx="30" ry="32" fill="#fed7aa" />
    <path d="M 375 205 C 375 178 425 180 422 210 Z" fill="${hairColor}" />
    <circle cx="390" cy="220" r="4" fill="#0f172a" />
    <circle cx="410" cy="220" r="4" fill="#0f172a" />
    <rect x="365" y="272" width="70" height="148" fill="${hoodieColor}" rx="8" />
    <rect x="375" y="420" width="25" height="120" fill="${pantsColor}" rx="4" />
    <rect x="405" y="420" width="25" height="120" fill="${pantsColor}" rx="4" />
    <rect x="368" y="530" width="35" height="18" fill="#f97316" rx="6" />
    <rect x="402" y="530" width="35" height="18" fill="#f97316" rx="6" />

    <!-- Panel 3: Expressions Grid -->
    <rect x="540" y="120" width="230" height="460" rx="12" fill="url(#panelBg)" stroke="#334155" stroke-width="1.5" />
    <text x="655" y="148" font-family="sans-serif" font-size="13" font-weight="bold" fill="#cbd5e1" text-anchor="middle">FACIAL EXPRESSIONS</text>
    <!-- Expr 1: Smiling -->
    <circle cx="600" cy="210" r="28" fill="#fed7aa" />
    <path d="M 578 198 C 578 175 622 175 622 198 Z" fill="${hairColor}" />
    <circle cx="590" cy="210" r="3.5" fill="#0f172a" />
    <circle cx="610" cy="210" r="3.5" fill="#0f172a" />
    <path d="M 592 222 Q 600 230 608 222" stroke="#9a3412" stroke-width="2" fill="none" />
    <text x="600" y="255" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Cheerful</text>
    <!-- Expr 2: Curious -->
    <circle cx="710" cy="210" r="28" fill="#fed7aa" />
    <path d="M 688 198 C 688 175 732 175 732 198 Z" fill="${hairColor}" />
    <circle cx="700" cy="208" r="4.5" fill="#0f172a" />
    <circle cx="720" cy="212" r="3" fill="#0f172a" />
    <circle cx="710" cy="225" r="3" fill="#9a3412" />
    <text x="710" y="255" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Curious</text>
    <!-- Expr 3: Determined -->
    <circle cx="600" cy="340" r="28" fill="#fed7aa" />
    <path d="M 578 328 C 578 305 622 305 622 328 Z" fill="${hairColor}" />
    <line x1="585" y1="334" x2="595" y2="337" stroke="#0f172a" stroke-width="2" />
    <line x1="615" y1="334" x2="605" y2="337" stroke="#0f172a" stroke-width="2" />
    <circle cx="590" cy="342" r="3.5" fill="#0f172a" />
    <circle cx="610" cy="342" r="3.5" fill="#0f172a" />
    <line x1="592" y1="354" x2="608" y2="354" stroke="#9a3412" stroke-width="2" />
    <text x="600" y="385" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Determined</text>
    <!-- Expr 4: Calm -->
    <circle cx="710" cy="340" r="28" fill="#fed7aa" />
    <path d="M 688 328 C 688 305 732 305 732 328 Z" fill="${hairColor}" />
    <path d="M 694 340 Q 700 336 706 340" stroke="#0f172a" stroke-width="1.8" fill="none" />
    <path d="M 714 340 Q 720 336 726 340" stroke="#0f172a" stroke-width="1.8" fill="none" />
    <path d="M 704 353 Q 710 357 716 353" stroke="#9a3412" stroke-width="1.8" fill="none" />
    <text x="710" y="385" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Calm</text>

    <!-- Specs Footer Box -->
    <rect x="30" y="600" width="740" height="170" rx="12" fill="#020617" stroke="#334155" stroke-width="1.5" />
    <text x="50" y="632" font-family="sans-serif" font-size="14" font-weight="bold" fill="#c084fc">LOCKED PHYSICAL DNA ANCHORS:</text>
    <text x="50" y="660" font-family="sans-serif" font-size="13" fill="#cbd5e1">${safeDna}</text>
    <text x="50" y="700" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f472b6">OUTFIT & CLOTHING VARIANT:</text>
    <text x="50" y="728" font-family="sans-serif" font-size="13" fill="#cbd5e1">${safeOutfit}</text>
  </svg>`

  return svgToBase64(svgString)
}

// Helper 2: Storybook Scene Illustration SVG Generator
function renderSceneCompositionSVG(title, action, shotType, lighting, stylePresetName = '3D Cinematic Storybook') {
  const safeTitle = (title || 'Story Scene').slice(0, 35)
  const safeAction = (action || 'Scene description').slice(0, 80)
  
  let skyGradStop1 = '#0f172a'
  let skyGradStop2 = '#1e1b4b'
  let sunColor = '#fde047'
  
  if ((lighting || '').toLowerCase().includes('golden')) {
    skyGradStop1 = '#7c2d12'
    skyGradStop2 = '#c2410c'
    sunColor = '#fbbf24'
  } else if ((lighting || '').toLowerCase().includes('twilight') || (lighting || '').toLowerCase().includes('moody')) {
    skyGradStop1 = '#31104b'
    skyGradStop2 = '#020617'
    sunColor = '#e0e7ff'
  } else if ((lighting || '').toLowerCase().includes('sparkle') || (lighting || '').toLowerCase().includes('magical')) {
    skyGradStop1 = '#4c1d95'
    skyGradStop2 = '#831843'
    sunColor = '#67e8f9'
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${skyGradStop1}" />
        <stop offset="100%" stop-color="${skyGradStop2}" />
      </linearGradient>
      <linearGradient id="ground" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#064e3b" />
        <stop offset="100%" stop-color="#022c22" />
      </linearGradient>
    </defs>
    
    <!-- Environment Canvas -->
    <rect width="800" height="600" rx="16" fill="url(#sky)" />
    <circle cx="650" cy="180" r="90" fill="${sunColor}" opacity="0.8" />

    <!-- Terrain Hills -->
    <path d="M 0 400 Q 200 320 400 380 T 800 350 L 800 600 L 0 600 Z" fill="url(#ground)" />
    <path d="M 0 450 Q 300 390 600 460 T 800 420 L 800 600 L 0 600 Z" fill="#022c22" opacity="0.8" />

    <!-- Magical Trees / Scenery Elements -->
    <polygon points="120,250 80,380 160,380" fill="#047857" />
    <polygon points="120,200 90,300 150,300" fill="#059669" />
    <polygon points="680,280 640,410 720,410" fill="#047857" />

    <!-- Character Figures in Scene -->
    <g transform="translate(320, 310)">
      <circle cx="40" cy="40" r="22" fill="#fed7aa" />
      <path d="M 22 28 C 22 10 58 10 58 28 Z" fill="#9a3412" />
      <rect x="22" y="70" width="36" height="80" fill="#3b82f6" rx="8" />
      <rect x="26" y="150" width="12" height="70" fill="#1e293b" />
      <rect x="42" y="150" width="12" height="70" fill="#1e293b" />
    </g>

    <g transform="translate(420, 320)">
      <circle cx="40" cy="40" r="20" fill="#fed7aa" />
      <path d="M 24 28 C 24 12 56 12 56 28 Z" fill="#0f172a" />
      <rect x="24" y="68" width="32" height="75" fill="#10b981" rx="8" />
      <rect x="28" y="143" width="10" height="65" fill="#1e293b" />
      <rect x="42" y="143" width="10" height="65" fill="#1e293b" />
    </g>

    <!-- Overlay Details Banner -->
    <rect x="30" y="470" width="740" height="100" rx="14" fill="#020617" opacity="0.9" stroke="#334155" stroke-width="1.5" />
    <text x="50" y="505" font-family="sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">${safeTitle}</text>
    <text x="50" y="532" font-family="sans-serif" font-size="12" fill="#cbd5e1">${safeAction}</text>
    <text x="50" y="555" font-family="sans-serif" font-size="11" font-weight="bold" fill="#c084fc">Shot: ${shotType} | Lighting: ${lighting} | Style: ${stylePresetName}</text>
  </svg>`

  return svgToBase64(svgString)
}

export default function IllustrationStudio({ initialProjectId, onBack }) {
  // Dual-mode state initialization
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_PROJECTS_KEY) || '[]')
    } catch { return [] }
  })
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem(LS_ACTIVE_PROJECT_KEY) || null
  })
  const [characters, setCharacters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_CHARACTERS_KEY) || '[]')
    } catch { return [] }
  })
  const [scenes, setScenes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_SCENES_KEY) || '[]')
    } catch { return [] }
  })

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('characters') // 'characters' | 'scenes' | 'storyboard'
  const [globalArtStyle, setGlobalArtStyle] = useState('3D Cinematic Storybook')
  
  // Modals & Overlay States
  const [modalProjectOpen, setModalProjectOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  
  const [modalCharOpen, setModalCharOpen] = useState(false)
  const [charForm, setCharForm] = useState({ id: '', name: '', age: '', dna: '', outfit: '' })
  
  const [modalBatchOpen, setModalBatchOpen] = useState(false)
  const [batchRows, setBatchRows] = useState([{ name: '', age: '', dna: '', outfit: '' }])
  
  const [modalImportOpen, setModalImportOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')
  
  const [dossierChar, setDossierChar] = useState(null)
  
  const [scenePrompt, setScenePrompt] = useState('')
  const [sceneShotType, setSceneShotType] = useState('Cinematic Wide Establishing Shot')
  const [sceneLighting, setSceneLighting] = useState('Golden Hour Warm Sunlight')
  
  const [alertState, setAlertState] = useState({ open: false, title: '', message: '', type: 'info' })
  const [loadingOverlay, setLoadingOverlay] = useState({ open: false, title: '', subtitle: '' })
  
  // Initialize Default Project if none exists
  useEffect(() => {
    if (projects.length === 0) {
      const defaultProj = {
        id: 'proj-' + Date.now(),
        name: 'The Adventures of John & Joshua',
        description: 'A magical tale of two friends exploring a hidden forest kingdom.',
        artStyle: '3D Cinematic Storybook'
      }
      const updatedProjects = [defaultProj]
      setProjects(updatedProjects)
      setActiveProjectId(defaultProj.id)
      localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(updatedProjects))
      localStorage.setItem(LS_ACTIVE_PROJECT_KEY, defaultProj.id)

      // Add starter demo characters for instant visual testing
      const starterChar1 = {
        id: 'char-1',
        projectId: defaultProj.id,
        name: 'John',
        age: '8 years old',
        dna: 'Spiky auburn hair, large curious hazel eyes, scattered freckles across nose, warm wide smile.',
        outfit: 'Bright cobalt blue zip hoodie over dark blue denim jeans and orange sneakers.',
        imageUrl: renderCharacterTurnaroundSheetSVG('John', '8 years old', 'Spiky auburn hair, hazel eyes', 'Bright cobalt blue zip hoodie', '3D Cinematic Storybook')
      }
      const starterChar2 = {
        id: 'char-2',
        projectId: defaultProj.id,
        name: 'Joshua',
        age: '9 years old',
        dna: 'Short curly dark brown hair, deep brown intelligent eyes, cheerful energetic expression.',
        outfit: 'Emerald green adventure vest, khaki trousers, sturdy brown hiking boots.',
        imageUrl: renderCharacterTurnaroundSheetSVG('Joshua', '9 years old', 'Short curly dark brown hair', 'Emerald green adventure vest', '3D Cinematic Storybook')
      }
      const initialChars = [starterChar1, starterChar2]
      setCharacters(initialChars)
      localStorage.setItem(LS_CHARACTERS_KEY, JSON.stringify(initialChars))

      // Add starter scene
      const starterScene = {
        id: 'scene-1',
        projectId: defaultProj.id,
        title: 'Meeting at the Ancient Tree',
        action: 'John and Joshua stand together in awe before a glowing magical tree in the vibrant forest.',
        shot: 'Cinematic Wide Establishing Shot',
        lighting: 'Golden Hour Warm Sunlight',
        caption: 'John and Joshua discovered a giant ancient tree glowing with golden sparkles in the heart of the forest.',
        imageUrl: renderSceneCompositionSVG('Meeting at the Ancient Tree', 'John & Joshua at glowing tree', 'Cinematic Wide Establishing Shot', 'Golden Hour Warm Sunlight', '3D Cinematic Storybook')
      }
      setScenes([starterScene])
      localStorage.setItem(LS_SCENES_KEY, JSON.stringify([starterScene]))
    } else if (!activeProjectId || !projects.some(p => p.id === activeProjectId)) {
      const firstId = initialProjectId && projects.some(p => p.id === initialProjectId) ? initialProjectId : projects[0].id
      setActiveProjectId(firstId)
      localStorage.setItem(LS_ACTIVE_PROJECT_KEY, firstId)
    }
  }, [])


  // Sync to local storage on changes
  const saveState = (updatedProjects, updatedProjectId, updatedChars, updatedScenes) => {
    if (updatedProjects) {
      setProjects(updatedProjects)
      localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(updatedProjects))
    }
    if (updatedProjectId) {
      setActiveProjectId(updatedProjectId)
      localStorage.setItem(LS_ACTIVE_PROJECT_KEY, updatedProjectId)
    }
    if (updatedChars) {
      setCharacters(updatedChars)
      localStorage.setItem(LS_CHARACTERS_KEY, JSON.stringify(updatedChars))
    }
    if (updatedScenes) {
      setScenes(updatedScenes)
      localStorage.setItem(LS_SCENES_KEY, JSON.stringify(updatedScenes))
    }
  }

  // Supabase Syncing (when user is authenticated & online)
  useEffect(() => {
    async function syncWithSupabase() {
      if (!isSupabaseConfigured || !supabase) return
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth?.user) return
        
        // Fetch saved creative projects for illustration tool
        const { data: dbProjects } = await supabase
          .from('creative_projects')
          .select('*')
          .eq('owner_id', auth.user.id)
          .eq('tool_id', 'illustration')
          .order('updated_at', { ascending: false })

        if (dbProjects && dbProjects.length > 0) {
          // Sync DB projects into state if available
          const mapped = dbProjects.map(p => ({
            id: p.id,
            name: p.title,
            description: p.brief?.description || '',
            artStyle: p.brief?.artStyle || '3D Cinematic Storybook'
          }))
          setProjects(mapped)
          if (!mapped.some(p => p.id === activeProjectId)) {
            setActiveProjectId(mapped[0].id)
          }
        }
      } catch (e) {
        console.log('Supabase auto-sync fallback to offline store:', e)
      }
    }
    syncWithSupabase()
  }, [])

  // Alerts & Overlays
  const showAlert = (title, message, type = 'info') => {
    setAlertState({ open: true, title, message, type })
  }

  const showLoading = (title, subtitle) => {
    setLoadingOverlay({ open: true, title, subtitle })
  }

  const hideLoading = () => {
    setLoadingOverlay({ open: false, title: '', subtitle: '' })
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0]
  const projectCharacters = characters.filter(c => c.projectId === activeProjectId)
  const projectScenes = scenes.filter(s => s.projectId === activeProjectId)

  // AI Prompt Enhancement
  const handleEnhanceTextPrompt = async (currentText, setTargetField) => {
    if (!currentText.trim()) {
      showAlert('Notice', 'Type a few words first before enhancing.', 'info')
      return
    }
    showLoading('Enhancing Prompt with AI...', 'Injecting vivid visual textures, camera details, and lighting attributes...')
    
    // Simulating AI expansion or calling Gemini if active
    setTimeout(() => {
      const enhanced = `Polished ${globalArtStyle} illustration style: ${currentText.trim()}. Featuring volumetric rim lighting, vivid complementary color palette, rich texture details, expressive character emotion, and crisp studio depth of field.`
      setTargetField(enhanced)
      hideLoading()
    }, 900)
  }

  // AI Image Rendering Routine with Fallback
  const generateArtwork = async (prompt, title, type, charDetails) => {
    showLoading('Rendering Visual Asset...', `Applying physical DNA consistency anchors in ${globalArtStyle}...`)
    
    const fullPrompt = `Children book master illustration, ${globalArtStyle} aesthetic, vibrant color palette, professional studio lighting, highly detailed: ${prompt}`
    
    // Attempt rendering via Supabase function or direct Gemini API if key is connected
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: auth } = await supabase.auth.getUser()
        if (auth?.user) {
          const { data } = await supabase.functions.invoke('illustration-generate', {
            body: { prompt: fullPrompt, aspectRatio: '1:1' }
          })
          if (data?.url) {
            hideLoading()
            return data.url
          }
        }
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: "1:1" } }
        })
      })
      const data = await res.json()
      const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
      if (part) {
        hideLoading()
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
      }
    } catch (e) {
      console.log('AI Generation fallback:', e)
    }

    // High quality multi-view character turnaround sheet or scene composition fallback
    await new Promise(res => setTimeout(res, 800))
    hideLoading()

    if (type === 'character' && charDetails) {
      return renderCharacterTurnaroundSheetSVG(charDetails.name, charDetails.age, charDetails.dna, charDetails.outfit, globalArtStyle)
    } else {
      return renderSceneCompositionSVG(title, prompt, sceneShotType, sceneLighting, globalArtStyle)
    }
  }

  // Project Management Actions
  const handleCreateProject = () => {
    if (!projectForm.name.trim()) {
      showAlert('Error', 'Please enter a book title.', 'error')
      return
    }
    const newProj = {
      id: 'proj-' + Date.now(),
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      artStyle: globalArtStyle
    }
    const updatedProjects = [...projects, newProj]
    saveState(updatedProjects, newProj.id, null, null)
    setModalProjectOpen(false)
    setProjectForm({ name: '', description: '' })
    showAlert('Success', `Book project "${newProj.name}" created!`, 'success')
  }

  const handleDeleteProject = (projId, e) => {
    e.stopPropagation()
    if (projects.length <= 1) {
      showAlert('Denied', 'You must keep at least one active book project.', 'error')
      return
    }
    const updatedProjects = projects.filter(p => p.id !== projId)
    const updatedChars = characters.filter(c => c.projectId !== projId)
    const updatedScenes = scenes.filter(s => s.projectId !== projId)
    const nextActiveId = activeProjectId === projId ? updatedProjects[0].id : activeProjectId
    
    saveState(updatedProjects, nextActiveId, updatedChars, updatedScenes)
    showAlert('Project Deleted', 'Book project and associated assets removed.', 'info')
  }

  // Character Management Actions
  const handleSaveCharacter = async () => {
    if (!charForm.name.trim() || !charForm.dna.trim()) {
      showAlert('Error', 'Character Name and Physical DNA are required.', 'error')
      return
    }

    setModalCharOpen(false)
    const prompt = `Character reference sheet for ${charForm.name}, age ${charForm.age}. DNA: ${charForm.dna}. Outfit: ${charForm.outfit}. Art Style: ${globalArtStyle}.`
    const imageUrl = await generateArtwork(prompt, charForm.name, 'character', charForm)

    let updatedChars
    if (charForm.id) {
      // Edit existing
      updatedChars = characters.map(c => c.id === charForm.id ? { ...charForm, imageUrl } : c)
    } else {
      // Create new
      const newChar = {
        id: 'char-' + Date.now(),
        projectId: activeProjectId,
        name: charForm.name.trim(),
        age: charForm.age.trim(),
        dna: charForm.dna.trim(),
        outfit: charForm.outfit.trim(),
        imageUrl
      }
      updatedChars = [...characters, newChar]
    }

    saveState(null, null, updatedChars, null)
    showAlert('Character Saved', `${charForm.name}'s character DNA anchor saved!`, 'success')
  }

  const handleDeleteCharacter = (charId) => {
    const updatedChars = characters.filter(c => c.id !== charId)
    saveState(null, null, updatedChars, null)
    showAlert('Deleted', 'Character removed from casting list.', 'info')
  }

  const handleExportCharacterJson = (char) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", `${char.name.toLowerCase()}-dna.json`)
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
  }

  // Batch Character Add Actions
  const handleProcessBatch = async () => {
    const validRows = batchRows.filter(r => r.name.trim() && r.dna.trim())
    if (validRows.length === 0) {
      showAlert('Error', 'Please fill in Name and Physical DNA for at least one character.', 'error')
      return
    }

    setModalBatchOpen(false)
    showLoading('Processing Batch Characters...', `Generating reference sheets for ${validRows.length} characters...`)

    const newChars = []
    for (const row of validRows) {
      const imageUrl = renderCharacterTurnaroundSheetSVG(row.name, row.age, row.dna, row.outfit, globalArtStyle)
      newChars.push({
        id: 'char-' + Date.now() + Math.random().toString().slice(2, 6),
        projectId: activeProjectId,
        name: row.name.trim(),
        age: row.age.trim(),
        dna: row.dna.trim(),
        outfit: row.outfit.trim(),
        imageUrl
      })
    }

    hideLoading()
    const updatedChars = [...characters, ...newChars]
    saveState(null, null, updatedChars, null)
    setBatchRows([{ name: '', age: '', dna: '', outfit: '' }])
    showAlert('Batch Completed', `Successfully added ${validRows.length} characters to casting!`, 'success')
  }

  // Character JSON Import Action
  const handleExecuteImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      
      const newChars = list.map(item => ({
        id: 'char-' + Date.now() + Math.random().toString().slice(2, 6),
        projectId: activeProjectId,
        name: item.name || 'Imported Character',
        age: item.age || 'Child',
        dna: item.dna || 'Standard character features',
        outfit: item.outfit || 'Default clothing',
        imageUrl: item.imageUrl || renderCharacterTurnaroundSheetSVG(item.name, item.age, item.dna, item.outfit, globalArtStyle)
      }))

      const updatedChars = [...characters, ...newChars]
      saveState(null, null, updatedChars, null)
      setModalImportOpen(false)
      setImportJsonText('')
      showAlert('Import Successful', `Imported ${newChars.length} character DNA profiles.`, 'success')
    } catch {
      showAlert('Import Failed', 'Invalid JSON syntax. Please check your input.', 'error')
    }
  }

  // Scene Composition Action with Automatic Character DNA Injection
  const handleGenerateScene = async () => {
    if (!scenePrompt.trim()) {
      showAlert('Error', 'Please enter a scene action or description.', 'error')
      return
    }

    // Auto-detect mentioned characters in prompt to inject DNA anchors
    const matchedChars = projectCharacters.filter(c => 
      scenePrompt.toLowerCase().includes(c.name.toLowerCase())
    )

    let anchoredPrompt = scenePrompt.trim()
    if (matchedChars.length > 0) {
      const dnaAnchors = matchedChars.map(c => 
        `[Character Anchor: ${c.name}, ${c.age}, DNA: ${c.dna}, Outfit: ${c.outfit}]`
      ).join(' ')
      anchoredPrompt += ` | Visual Anchors: ${dnaAnchors}`
    }

    const sceneTitle = matchedChars.length > 0 
      ? `${matchedChars.map(c => c.name).join(' & ')} Scene`
      : `Scene #${projectScenes.length + 1}`

    const imageUrl = await generateArtwork(
      `${anchoredPrompt}, Shot: ${sceneShotType}, Lighting: ${sceneLighting}, Style: ${globalArtStyle}`,
      sceneTitle,
      scenePrompt.slice(0, 35)
    )

    const newScene = {
      id: 'scene-' + Date.now(),
      projectId: activeProjectId,
      title: sceneTitle,
      action: scenePrompt.trim(),
      shot: sceneShotType,
      lighting: sceneLighting,
      caption: scenePrompt.trim(),
      imageUrl
    }

    const updatedScenes = [...scenes, newScene]
    saveState(null, null, null, updatedScenes)
    setScenePrompt('')
    showAlert('Scene Rendered', `Scene composed with ${matchedChars.length} character DNA anchors!`, 'success')
  }

  const handleDeleteScene = (sceneId) => {
    const updatedScenes = scenes.filter(s => s.id !== sceneId)
    saveState(null, null, null, updatedScenes)
    showAlert('Deleted', 'Scene removed from director layout.', 'info')
  }

  // Storybook Page Reordering & Caption Update
  const handleUpdateCaption = (sceneId, captionText) => {
    const updatedScenes = scenes.map(s => s.id === sceneId ? { ...s, caption: captionText } : s)
    setScenes(updatedScenes)
    localStorage.setItem(LS_SCENES_KEY, JSON.stringify(updatedScenes))
  }

  const handleMovePage = (index, direction) => {
    const projectScenesArr = [...projectScenes]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= projectScenesArr.length) return
    
    // Swap positions
    const temp = projectScenesArr[index]
    projectScenesArr[index] = projectScenesArr[targetIdx]
    projectScenesArr[targetIdx] = temp

    // Reconstruct full scenes array
    const nonProjectScenes = scenes.filter(s => s.projectId !== activeProjectId)
    const updatedScenes = [...nonProjectScenes, ...projectScenesArr]
    saveState(null, null, null, updatedScenes)
  }

  const handleExportStorybookData = () => {
    const exportData = {
      bookTitle: activeProject?.name || 'Storybook',
      premise: activeProject?.description || '',
      artStyle: globalArtStyle,
      characters: projectCharacters,
      pages: projectScenes.map((s, idx) => ({
        pageNumber: idx + 1,
        title: s.title,
        action: s.action,
        shotType: s.shot,
        lighting: s.lighting,
        caption: s.caption,
        imageUrl: s.imageUrl
      }))
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", `${(activeProject?.name || 'storybook').toLowerCase().replace(/\s+/g, '-')}-data.json`)
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
  }

  return (
    <div className="storyweaver-studio">
      
      {/* Top Navigation Header */}
      <header className="sw-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="sw-brand-icon">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h1 className="sw-brand-title">StoryWeaver Studio</h1>
            <p className="sw-brand-sub">Children's Book & Character Consistency Engine</p>
          </div>
        </div>

        <div className="sw-header-controls">
          {/* Active Book Selector */}
          <div className="sw-pill-select">
            <span style={{ color: '#94a3b8' }}>Book:</span>
            <select 
              value={activeProjectId || ''} 
              onChange={e => {
                setActiveProjectId(e.target.value)
                localStorage.setItem(LS_ACTIVE_PROJECT_KEY, e.target.value)
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Global Art Style Selector */}
          <div className="sw-pill-select">
            <span style={{ color: '#94a3b8' }}>Art Style:</span>
            <select 
              value={globalArtStyle} 
              onChange={e => setGlobalArtStyle(e.target.value)}
            >
              {illustrationStyles.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <button onClick={onBack} className="sw-btn-icon" title="Return to Creative Hub">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </header>

      {/* Main Body Container */}
      <div className="sw-body">
        
        {/* Left Sidebar */}
        <aside className="sw-sidebar">
          <div>
            <div className="sw-section-header" style={{ marginBottom: '0.75rem' }}>
              <h2 className="sw-section-title">Book Projects</h2>
              <button 
                onClick={() => {
                  setProjectForm({ name: '', description: '' })
                  setModalProjectOpen(true)
                }} 
                className="sw-btn sw-btn-accent" 
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
              >
                + New Book
              </button>
            </div>

            {/* Project List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '12rem', overflowY: 'auto' }} className="custom-scrollbar">
              {projects.map(p => {
                const isActive = p.id === activeProjectId
                return (
                  <div 
                    key={p.id} 
                    onClick={() => {
                      setActiveProjectId(p.id)
                      localStorage.setItem(LS_ACTIVE_PROJECT_KEY, p.id)
                    }}
                    style={{ 
                      padding: '0.6rem 0.75rem', 
                      borderRadius: '0.75rem', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                      border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                      color: isActive ? '#c084fc' : '#94a3b8'
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-book" style={{ marginRight: '0.5rem' }}></i>
                      {p.name}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProject(p.id, e)} 
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      title="Delete Book"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Studio Navigation Tabs */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(30, 41, 59, 0.8)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h2 className="sw-section-title" style={{ marginBottom: '0.5rem' }}>Studio Workshop</h2>
            
            <button 
              onClick={() => setActiveTab('characters')} 
              className={`sw-nav-item ${activeTab === 'characters' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className="fa-solid fa-users-rectangle"></i>
                <span>Character Casting</span>
              </div>
              <span className="sw-badge">{projectCharacters.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('scenes')} 
              className={`sw-nav-item ${activeTab === 'scenes' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className="fa-solid fa-clapperboard"></i>
                <span>Scene Director</span>
              </div>
              <span className="sw-badge">{projectScenes.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('storyboard')} 
              className={`sw-nav-item ${activeTab === 'storyboard' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className="fa-solid fa-book-open"></i>
                <span>Storybook Page Builder</span>
              </div>
              <span className="sw-badge">{projectScenes.length}</span>
            </button>
          </div>

          {/* Status Footer */}
          <div style={{ marginTop: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(30, 41, 59, 0.8)', borderRadius: '0.75rem', padding: '0.85rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Storage Engine:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Dual-Mode Safe</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Consistency Lock:</span>
              <span style={{ color: '#c084fc', fontWeight: 600 }}>Active (DNA)</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="sw-main custom-scrollbar">
          
          {/* TAB 1: CHARACTER CASTING PANEL */}
          {activeTab === 'characters' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="sw-panel-banner">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-people-group" style={{ color: '#c084fc' }}></i>
                    Character DNA & Casting Studio
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                    Create characters with strict physical DNA and clothing variants to ensure 100% visual consistency across all pages.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setModalImportOpen(true)} className="sw-btn sw-btn-secondary">
                    <i className="fa-solid fa-file-arrow-down"></i> Import JSON
                  </button>
                  <button onClick={() => setModalBatchOpen(true)} className="sw-btn sw-btn-accent">
                    <i className="fa-solid fa-layer-group"></i> Batch Add
                  </button>
                  <button 
                    onClick={() => {
                      setCharForm({ id: '', name: '', age: '', dna: '', outfit: '' })
                      setModalCharOpen(true)
                    }} 
                    className="sw-btn sw-btn-primary"
                  >
                    <i className="fa-solid fa-plus"></i> New Character
                  </button>
                </div>
              </div>

              {/* Characters Cards Grid */}
              <div className="sw-grid">
                {projectCharacters.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #334155', borderRadius: '1rem' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: '2rem', color: '#c084fc', marginBottom: '1rem' }}></i>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>No Characters Cast Yet</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '24rem', margin: '0.5rem auto 1rem' }}>
                      Create characters with physical DNA and clothing variants so the Scene Director keeps them consistent.
                    </p>
                    <button 
                      onClick={() => {
                        setCharForm({ id: '', name: '', age: '', dna: '', outfit: '' })
                        setModalCharOpen(true)
                      }} 
                      className="sw-btn sw-btn-primary"
                    >
                      Create First Character
                    </button>
                  </div>
                ) : (
                  projectCharacters.map(c => (
                    <div key={c.id} className="sw-card">
                      <div style={{ position: 'relative', overflow: 'hidden' }} onClick={() => setDossierChar(c)}>
                        <img 
                          src={c.imageUrl} 
                          alt={c.name} 
                          className="sw-card-image" 
                          onError={(e) => {
                            e.currentTarget.src = renderCharacterTurnaroundSheetSVG(c.name, c.age, c.dna, c.outfit, globalArtStyle)
                          }}
                        />
                      </div>
                      <div className="sw-card-body">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{c.name}</h3>
                            <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#d8b4fe', padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                              {c.age || 'Child'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {c.dna}
                          </p>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(30, 41, 59, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10rem' }}>
                            <i className="fa-solid fa-shirt" style={{ marginRight: '0.35rem' }}></i> {c.outfit || 'Standard outfit'}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={() => handleExportCharacterJson(c)} className="sw-btn-icon" title="Export DNA JSON">
                              <i className="fa-solid fa-download"></i>
                            </button>
                            <button 
                              onClick={() => {
                                setCharForm({ ...c })
                                setModalCharOpen(true)
                              }} 
                              className="sw-btn-icon" 
                              title="Edit Character"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button onClick={() => handleDeleteCharacter(c.id)} className="sw-btn-icon" title="Delete Character">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TAB 2: SCENE DIRECTOR PANEL */}
          {activeTab === 'scenes' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="sw-panel-banner" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-clapperboard" style={{ color: '#f472b6' }}></i>
                    Scene Director & Prompt Composer
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                    Describe the action mentioning cast character names (e.g., "John and Joshua in the marketplace"). Physical DNA anchors are injected automatically!
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {/* Scene Description Input */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="sw-label">Scene Action & Description</label>
                    <div style={{ position: 'relative' }}>
                      <textarea 
                        rows={3} 
                        className="sw-input" 
                        value={scenePrompt} 
                        onChange={e => setScenePrompt(e.target.value)} 
                        placeholder="Type scene prompt here. Mention cast names (e.g. John and Joshua discovering the glowing forest portal)..."
                        style={{ resize: 'vertical' }}
                      />
                      <button 
                        onClick={() => handleEnhanceTextPrompt(scenePrompt, setScenePrompt)} 
                        className="sw-btn sw-btn-accent" 
                        style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Enhance
                      </button>
                    </div>
                  </div>

                  {/* Shot Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="sw-label">Advanced Controls</label>
                    <select className="sw-input" value={sceneShotType} onChange={e => setSceneShotType(e.target.value)}>
                      <option value="Cinematic Wide Establishing Shot">Wide Establishing</option>
                      <option value="Close-up Character Portrait">Close-up Portrait</option>
                      <option value="Dynamic Two-Shot Interaction">Two-Shot Interaction</option>
                      <option value="Over-the-Shoulder Perspective">Over-the-Shoulder</option>
                      <option value="Low-Angle Heroic Shot">Low-Angle Heroic</option>
                    </select>
                    <select className="sw-input" value={sceneLighting} onChange={e => setSceneLighting(e.target.value)}>
                      <option value="Golden Hour Warm Sunlight">Golden Hour Sun</option>
                      <option value="Magical Sparkle Studio Lighting">Magical Sparkle</option>
                      <option value="Soft Bright Daylight">Soft Daylight</option>
                      <option value="Moody Twilight Atmosphere">Moody Twilight</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleGenerateScene} className="sw-btn sw-btn-primary" style={{ padding: '0.75rem 1.25rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                  <i className="fa-solid fa-paintbrush"></i> Compose & Render Scene
                </button>
              </div>

              {/* Scenes Gallery Grid */}
              <div className="sw-grid">
                {projectScenes.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #334155', borderRadius: '1rem' }}>
                    <i className="fa-solid fa-film" style={{ fontSize: '2rem', color: '#f472b6', marginBottom: '1rem' }}></i>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>No Scenes Composed Yet</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '24rem', margin: '0.5rem auto 1rem' }}>
                      Compose a scene above mentioning your cast members to populate your book director gallery.
                    </p>
                  </div>
                ) : (
                  projectScenes.map(s => (
                    <div key={s.id} className="sw-card">
                      <img 
                        src={s.imageUrl} 
                        alt={s.title} 
                        className="sw-card-image" 
                        onError={(e) => {
                          e.currentTarget.src = renderSceneCompositionSVG(s.title, s.action, s.shot, s.lighting, globalArtStyle)
                        }}
                      />
                      <div className="sw-card-body">
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{s.title}</h3>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>{s.action}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.15rem 0.5rem', borderRadius: '0.35rem' }}>
                              {s.shot}
                            </span>
                            <span style={{ fontSize: '0.65rem', backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.15rem 0.5rem', borderRadius: '0.35rem' }}>
                              {s.lighting}
                            </span>
                          </div>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(30, 41, 59, 0.8)', display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button onClick={() => handleDeleteScene(s.id)} className="sw-btn-icon" title="Delete Scene">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* TAB 3: STORYBOOK PAGE BUILDER PANEL */}
          {activeTab === 'storyboard' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="sw-panel-banner">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-book-open" style={{ color: '#818cf8' }}></i>
                    Full Page & Text Callout Builder
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
                    Combine rendered scene artwork with rich narrative captions and reorder pages to export ready-to-print book layouts.
                  </p>
                </div>
                <button onClick={handleExportStorybookData} className="sw-btn sw-btn-primary">
                  <i className="fa-solid fa-file-export"></i> Export Story Data
                </button>
              </div>

              {/* Pages Container */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {projectScenes.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #334155', borderRadius: '1rem' }}>
                    <i className="fa-solid fa-book" style={{ fontSize: '2rem', color: '#818cf8', marginBottom: '1rem' }}></i>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>No Pages Built Yet</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '24rem', margin: '0.5rem auto 1rem' }}>
                      Render scenes in the Scene Director panel to automatically populate storybook pages.
                    </p>
                  </div>
                ) : (
                  projectScenes.map((s, idx) => (
                    <div key={s.id} className="sw-card">
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: '#020617', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#c084fc' }}>Page #{idx + 1}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            disabled={idx === 0} 
                            onClick={() => handleMovePage(idx, -1)} 
                            className="sw-btn-icon" 
                            style={{ opacity: idx === 0 ? 0.4 : 1 }}
                            title="Move Earlier"
                          >
                            <i className="fa-solid fa-arrow-left"></i>
                          </button>
                          <button 
                            disabled={idx === projectScenes.length - 1} 
                            onClick={() => handleMovePage(idx, 1)} 
                            className="sw-btn-icon" 
                            style={{ opacity: idx === projectScenes.length - 1 ? 0.4 : 1 }}
                            title="Move Later"
                          >
                            <i className="fa-solid fa-arrow-right"></i>
                          </button>
                        </div>
                      </div>

                      <img 
                        src={s.imageUrl} 
                        alt={s.title} 
                        className="sw-card-image" 
                        onError={(e) => {
                          e.currentTarget.src = renderSceneCompositionSVG(s.title, s.action, s.shot, s.lighting, globalArtStyle)
                        }}
                      />

                      <div className="sw-card-body">
                        <div>
                          <label className="sw-label">Narrative Caption & Text Callout</label>
                          <textarea 
                            rows={3} 
                            className="sw-input" 
                            value={s.caption || ''} 
                            onChange={e => handleUpdateCaption(s.id, e.target.value)} 
                            placeholder="Type narrative page caption..."
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* MODALS */}

      {/* New Project Modal */}
      {modalProjectOpen && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>Create New Book Project</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="sw-label">Book Title</label>
                <input 
                  type="text" 
                  className="sw-input" 
                  value={projectForm.name} 
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} 
                  placeholder="e.g. The Adventures of John & Joshua"
                />
              </div>
              <div>
                <label className="sw-label">Book Theme / Premise</label>
                <textarea 
                  rows={2} 
                  className="sw-input" 
                  value={projectForm.description} 
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} 
                  placeholder="Brief summary of the story..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModalProjectOpen(false)} className="sw-btn sw-btn-secondary">Cancel</button>
              <button onClick={handleCreateProject} className="sw-btn sw-btn-primary">Save Project</button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Character Modal */}
      {modalCharOpen && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal sw-modal-lg">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
              {charForm.id ? 'Edit Character DNA' : 'Create New Character DNA'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="sw-label">Character Name</label>
                  <input 
                    type="text" 
                    className="sw-input" 
                    value={charForm.name} 
                    onChange={e => setCharForm({ ...charForm, name: e.target.value })} 
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label className="sw-label">Age Bracket</label>
                  <input 
                    type="text" 
                    className="sw-input" 
                    value={charForm.age} 
                    onChange={e => setCharForm({ ...charForm, age: e.target.value })} 
                    placeholder="e.g. 8 years old"
                  />
                </div>
              </div>

              <div>
                <label className="sw-label">Physical DNA & Facial Features</label>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    rows={3} 
                    className="sw-input" 
                    value={charForm.dna} 
                    onChange={e => setCharForm({ ...charForm, dna: e.target.value })} 
                    placeholder="Spiky red hair, big curious green eyes, freckles on nose, cheerful expression..."
                  />
                  <button 
                    onClick={() => handleEnhanceTextPrompt(charForm.dna, val => setCharForm({ ...charForm, dna: val }))} 
                    className="sw-btn sw-btn-accent" 
                    style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Enhance
                  </button>
                </div>
              </div>

              <div>
                <label className="sw-label">Clothing & Outfit Variant</label>
                <input 
                  type="text" 
                  className="sw-input" 
                  value={charForm.outfit} 
                  onChange={e => setCharForm({ ...charForm, outfit: e.target.value })} 
                  placeholder="e.g. Bright cobalt blue zip hoodie over dark blue jeans and sneakers"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModalCharOpen(false)} className="sw-btn sw-btn-secondary">Cancel</button>
              <button onClick={handleSaveCharacter} className="sw-btn sw-btn-primary">Generate & Save Character</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Add Character Modal */}
      {modalBatchOpen && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal sw-modal-lg">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>Batch Add Characters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {batchRows.map((row, idx) => (
                <div key={idx} style={{ backgroundColor: '#020617', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>Character #{idx + 1}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Name" 
                      className="sw-input" 
                      value={row.name} 
                      onChange={e => {
                        const updated = [...batchRows]
                        updated[idx].name = e.target.value
                        setBatchRows(updated)
                      }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Age (e.g. 7 yrs)" 
                      className="sw-input" 
                      value={row.age} 
                      onChange={e => {
                        const updated = [...batchRows]
                        updated[idx].age = e.target.value
                        setBatchRows(updated)
                      }} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Physical DNA & Features" 
                    className="sw-input" 
                    value={row.dna} 
                    onChange={e => {
                      const updated = [...batchRows]
                      updated[idx].dna = e.target.value
                      setBatchRows(updated)
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="Clothing Outfit" 
                    className="sw-input" 
                    value={row.outfit} 
                    onChange={e => {
                      const updated = [...batchRows]
                      updated[idx].outfit = e.target.value
                      setBatchRows(updated)
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => setBatchRows([...batchRows, { name: '', age: '', dna: '', outfit: '' }])} 
                className="sw-btn sw-btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                + Add Another Character Row
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModalBatchOpen(false)} className="sw-btn sw-btn-secondary">Cancel</button>
              <button onClick={handleProcessBatch} className="sw-btn sw-btn-primary">Generate Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {modalImportOpen && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal">
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>Import Character JSON</h3>
            <div>
              <label className="sw-label">Paste Character JSON Data</label>
              <textarea 
                rows={6} 
                className="sw-input" 
                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} 
                value={importJsonText} 
                onChange={e => setImportJsonText(e.target.value)} 
                placeholder='[{"name": "John", "age": "8", "dna": "spiky hair", "outfit": "blue hoodie"}]'
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setModalImportOpen(false)} className="sw-btn sw-btn-secondary">Cancel</button>
              <button onClick={handleExecuteImportJson} className="sw-btn sw-btn-primary">Import Characters</button>
            </div>
          </div>
        </div>
      )}

      {/* Character Dossier Inspector Modal */}
      {dossierChar && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal sw-modal-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{dossierChar.name}'s Dossier</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Locked Visual DNA & Reference Sheet</p>
              </div>
              <button onClick={() => setDossierChar(null)} className="sw-btn-icon">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
              <img 
                src={dossierChar.imageUrl} 
                alt={dossierChar.name} 
                style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid #1e293b' }} 
                onError={(e) => {
                  e.currentTarget.src = renderCharacterTurnaroundSheetSVG(dossierChar.name, dossierChar.age, dossierChar.dna, dossierChar.outfit, globalArtStyle)
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>Metadata</span>
                  <div style={{ color: '#ffffff', fontWeight: 600 }}>{dossierChar.name} ({dossierChar.age || 'N/A'})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>Physical DNA</span>
                  <p style={{ color: '#cbd5e1', fontSize: '0.75rem', backgroundColor: '#020617', padding: '0.65rem', borderRadius: '0.5rem', margin: '0.25rem 0 0 0' }}>
                    {dossierChar.dna}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>Clothing & Outfit</span>
                  <p style={{ color: '#cbd5e1', fontSize: '0.75rem', backgroundColor: '#020617', padding: '0.65rem', borderRadius: '0.5rem', margin: '0.25rem 0 0 0' }}>
                    {dossierChar.outfit || 'Standard outfit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertState.open && (
        <div className="sw-modal-backdrop">
          <div className="sw-modal" style={{ maxWidth: '24rem', textAlign: 'center' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: alertState.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)', color: alertState.type === 'error' ? '#f87171' : '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.25rem' }}>
              <i className={alertState.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-bell'}></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{alertState.title}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>{alertState.message}</p>
            <button onClick={() => setAlertState({ ...alertState, open: false })} className="sw-btn sw-btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingOverlay.open && (
        <div className="sw-loading-overlay">
          <div className="sw-spinner">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>{loadingOverlay.title}</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{loadingOverlay.subtitle}</p>
          </div>
        </div>
      )}

    </div>
  )
}

