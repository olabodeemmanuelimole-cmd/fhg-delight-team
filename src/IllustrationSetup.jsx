import React, { useState } from 'react'
import { illustrationStyles } from './illustrationStyles'

function renderHumanAdultPreview(styleId) {
  switch (styleId) {
    case '3d-storybook':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="g3d-bg" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#1e3a8a"/>
              <stop offset="60%" stopColor="#0f172a"/>
              <stop offset="100%" stopColor="#020617"/>
            </radialGradient>
            <radialGradient id="g3d-skin" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#ffedd5"/>
              <stop offset="45%" stopColor="#fed7aa"/>
              <stop offset="85%" stopColor="#f97316"/>
              <stop offset="100%" stopColor="#9a3412"/>
            </radialGradient>
            <radialGradient id="g3d-hair" cx="30%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#64748b"/>
              <stop offset="50%" stopColor="#334155"/>
              <stop offset="100%" stopColor="#0f172a"/>
            </radialGradient>
            <radialGradient id="g3d-iris" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="60%" stopColor="#0284c7"/>
              <stop offset="100%" stopColor="#0f172a"/>
            </radialGradient>
            <linearGradient id="g3d-shirt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="50%" stopColor="#1d4ed8"/>
              <stop offset="100%" stopColor="#1e3a8a"/>
            </linearGradient>
          </defs>
          <rect width="160" height="120" rx="8" fill="url(#g3d-bg)"/>
          {/* Shoulders & Collared Shirt */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="url(#g3d-shirt)"/>
          <path d="M70 90 L80 106 L90 90 Z" fill="#ffffff"/>
          {/* Neck */}
          <rect x="71" y="74" width="18" height="18" rx="4" fill="#fed7aa"/>
          {/* Human Ears */}
          <ellipse cx="53" cy="52" rx="4.5" ry="7.5" fill="#fed7aa"/>
          <ellipse cx="107" cy="52" rx="4.5" ry="7.5" fill="#fed7aa"/>
          {/* Human Head & Face */}
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="url(#g3d-skin)"/>
          {/* Human Hair Style */}
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 C102 32 92 24 80 24 C68 24 58 32 52 46 Z" fill="url(#g3d-hair)"/>
          {/* Eyebrows */}
          <path d="M60 40 Q68 37 75 41" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          {/* Expressive 3D Eyes */}
          <ellipse cx="67" cy="46" rx="5" ry="5.5" fill="#ffffff"/>
          <ellipse cx="93" cy="46" rx="5" ry="5.5" fill="#ffffff"/>
          <circle cx="67" cy="46" r="4" fill="url(#g3d-iris)"/>
          <circle cx="93" cy="46" r="4" fill="url(#g3d-iris)"/>
          <circle cx="65.5" cy="44.2" r="1.6" fill="#ffffff"/>
          <circle cx="91.5" cy="44.2" r="1.6" fill="#ffffff"/>
          <circle cx="68.2" cy="47.5" r="0.7" fill="#ffffff"/>
          <circle cx="94.2" cy="47.5" r="0.7" fill="#ffffff"/>
          {/* Nose & Mouth */}
          <path d="M78 50 L82 57 L77 60" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.65"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'watercolour':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="wc-blur">
              <feGaussianBlur stdDeviation="2"/>
            </filter>
          </defs>
          <rect width="160" height="120" rx="8" fill="#faf8f5"/>
          {/* Soft Watercolor Washes */}
          <circle cx="80" cy="55" r="45" fill="#e2e8f0" opacity="0.5" filter="url(#wc-blur)"/>
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#93c5fd" opacity="0.65" filter="url(#wc-blur)"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fed7aa" opacity="0.65" filter="url(#wc-blur)"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 Z" fill="#64748b" opacity="0.6" filter="url(#wc-blur)"/>
          {/* Gentle Pencil Sketch Outlines */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120" stroke="#475569" strokeWidth="1.2" strokeDasharray="14 2" fill="none"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" stroke="#475569" strokeWidth="1.3" fill="none"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" stroke="#475569" strokeWidth="1.2" fill="none"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" stroke="#475569" strokeWidth="1.2" fill="none"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" stroke="#475569" strokeWidth="1.3" fill="none"/>
          <path d="M60 40 Q68 37 75 41" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4" fill="#334155"/>
          <circle cx="93" cy="46" r="4" fill="#334155"/>
          <path d="M78 50 L81 56 L77 59" stroke="#475569" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M71 67 Q80 72 89 67" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'gouache':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#334155"/>
          {/* Opaque Gouache Color Masses */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#1d4ed8"/>
          <rect x="71" y="74" width="18" height="18" fill="#fdba74"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" fill="#fdba74"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" fill="#fdba74"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffedd5"/>
          <path d="M80 18 A26 32 0 0 1 106 50 L80 50 Z" fill="#fed7aa"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 C102 32 92 24 80 24 C68 24 58 32 52 46 Z" fill="#1e293b"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#0f172a"/>
          <circle cx="93" cy="46" r="4.5" fill="#0f172a"/>
          <path d="M78 50 L82 57 L77 60" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M71 67 Q80 73 89 67" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'paper':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
            </filter>
          </defs>
          <rect width="160" height="120" rx="8" fill="#fef3c7"/>
          {/* Layered Cut Paper Adult Human Layers */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#0284c7" filter="url(#paper-shadow)"/>
          <rect x="71" y="74" width="18" height="18" fill="#fed7aa" filter="url(#paper-shadow)"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" fill="#fed7aa" filter="url(#paper-shadow)"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" fill="#fed7aa" filter="url(#paper-shadow)"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffedd5" filter="url(#paper-shadow)"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 C102 32 92 24 80 24 C68 24 58 32 52 46 Z" fill="#334155" filter="url(#paper-shadow)"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4" fill="#0f172a" filter="url(#paper-shadow)"/>
          <circle cx="93" cy="46" r="4" fill="#0f172a" filter="url(#paper-shadow)"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'vector':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#0f172a"/>
          {/* Crisp Clean Vector Lines & Fills */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#3b82f6"/>
          <path d="M70 90 L80 106 L90 90 Z" fill="#ffffff"/>
          <rect x="71" y="74" width="18" height="18" fill="#fed7aa"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" fill="#fed7aa"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" fill="#fed7aa"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffedd5"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 C102 32 92 24 80 24 C68 24 58 32 52 46 Z" fill="#1e293b"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#0f172a"/>
          <circle cx="93" cy="46" r="4.5" fill="#0f172a"/>
          <circle cx="65.5" cy="44.5" r="1.5" fill="#ffffff"/>
          <circle cx="91.5" cy="44.5" r="1.5" fill="#ffffff"/>
          <path d="M78 50 L82 57 L77 60" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'crayon':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#fffbeb"/>
          {/* Crayon Textured Strokes */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" stroke="#2563eb" strokeWidth="5" strokeDasharray="5 2 3 2" fill="#93c5fd"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" stroke="#ea580c" strokeWidth="5" strokeDasharray="6 3 2 4" fill="#fed7aa"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" stroke="#1e293b" strokeWidth="5" strokeDasharray="4 2 2 3" fill="#64748b"/>
          <path d="M60 40 Q68 37 75 41" stroke="#1e293b" strokeWidth="3" strokeDasharray="3 2" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#1e293b" strokeWidth="3" strokeDasharray="3 2" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#1e293b"/>
          <circle cx="93" cy="46" r="4.5" fill="#1e293b"/>
          <path d="M71 67 Q80 73 89 67" stroke="#dc2626" strokeWidth="3" strokeDasharray="4 2" fill="none"/>
        </svg>
      )

    case 'pencil-wash':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#f8fafc"/>
          {/* Graphite Sketch Outlines with Light Color Wash */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#bfdbfe" opacity="0.5"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fed7aa" opacity="0.45"/>
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120" stroke="#334155" strokeWidth="1.3" fill="none"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" stroke="#334155" strokeWidth="1.4" strokeDasharray="16 2" fill="none"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" stroke="#334155" strokeWidth="1.2" fill="none"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" stroke="#334155" strokeWidth="1.2" fill="none"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" stroke="#334155" strokeWidth="1.4" fill="none"/>
          <path d="M60 40 Q68 37 75 41" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4" fill="#334155"/>
          <circle cx="93" cy="46" r="4" fill="#334155"/>
          <path d="M78 50 L81 56 L77 59" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <path d="M71 67 Q80 72 89 67" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'ink':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ink-hatch" width="5" height="5" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="5" stroke="#0f172a" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="160" height="120" rx="8" fill="#f1f5f9"/>
          {/* Black Ink Outlines & Cross-Hatch Shading */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="url(#ink-hatch)"/>
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" stroke="#0f172a" strokeWidth="2.2" fill="none"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2"/>
          <path d="M80 18 A26 32 0 0 1 106 50 L80 50 Z" fill="url(#ink-hatch)"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" stroke="#0f172a" strokeWidth="2.4" fill="#0f172a"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#dc2626"/>
          <circle cx="93" cy="46" r="4.5" fill="#dc2626"/>
          <circle cx="67" cy="46" r="4.5" stroke="#0f172a" strokeWidth="1.2" fill="none"/>
          <circle cx="93" cy="46" r="4.5" stroke="#0f172a" strokeWidth="1.2" fill="none"/>
          <path d="M71 67 Q80 73 89 67" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'anime':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#e0f2fe"/>
          {/* Clean 2D Anime Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#2563eb" stroke="#0f172a" strokeWidth="1.5"/>
          <rect x="71" y="74" width="18" height="18" fill="#fed7aa" stroke="#0f172a" strokeWidth="1.2"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffedd5" stroke="#0f172a" strokeWidth="1.8"/>
          {/* Anime Cel Shading */}
          <path d="M80 18 A26 32 0 0 1 106 50 L80 50 Z" fill="#fed7aa" opacity="0.6"/>
          <path d="M50 44 C47 26 60 16 80 16 C100 16 113 26 110 44 C102 28 92 22 80 22 C68 22 58 28 50 44 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          {/* Shining Anime Eyes */}
          <ellipse cx="67" cy="46" rx="5" ry="7" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2"/>
          <ellipse cx="93" cy="46" rx="5" ry="7" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2"/>
          <circle cx="65.5" cy="43.5" r="2" fill="#ffffff"/>
          <circle cx="91.5" cy="43.5" r="2" fill="#ffffff"/>
          <path d="M78 50 L81 56 L77 58" stroke="#ea580c" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M71 67 Q80 72 89 67" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'manga':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="manga-dots" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#000000"/>
            </pattern>
          </defs>
          <rect width="160" height="120" rx="8" fill="#ffffff"/>
          {/* B&W High-Contrast Manga Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="url(#manga-dots)"/>
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" stroke="#000000" strokeWidth="2.2" fill="none"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#ffffff" stroke="#000000" strokeWidth="2.2"/>
          <path d="M80 18 A26 32 0 0 1 106 50 L80 50 Z" fill="url(#manga-dots)"/>
          <path d="M50 44 C47 26 60 16 80 16 C100 16 113 26 110 44 Z" fill="#000000"/>
          <path d="M60 40 Q68 37 75 41" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="67" cy="46" rx="4.5" ry="6.5" fill="#000000"/>
          <ellipse cx="93" cy="46" rx="4.5" ry="6.5" fill="#000000"/>
          <circle cx="65.5" cy="43.5" r="1.8" fill="#ffffff"/>
          <circle cx="91.5" cy="43.5" r="1.8" fill="#ffffff"/>
          <path d="M71 67 Q80 72 89 67" stroke="#000000" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'clay':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="clay-skin" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffedd5"/>
              <stop offset="75%" stopColor="#fed7aa"/>
              <stop offset="100%" stopColor="#c2410c"/>
            </radialGradient>
            <radialGradient id="clay-shirt" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#1d4ed8"/>
            </radialGradient>
          </defs>
          <rect width="160" height="120" rx="8" fill="#fef3c7"/>
          {/* Rounded Sculpted Clay Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="url(#clay-shirt)"/>
          <rect x="71" y="74" width="18" height="18" rx="4" fill="url(#clay-skin)"/>
          <ellipse cx="53" cy="52" rx="4" ry="7" fill="url(#clay-skin)"/>
          <ellipse cx="107" cy="52" rx="4" ry="7" fill="url(#clay-skin)"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="url(#clay-skin)"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 Z" fill="#334155"/>
          <path d="M60 40 Q68 37 75 41" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#0f172a"/>
          <circle cx="93" cy="46" r="4.5" fill="#0f172a"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'collage':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#e2e8f0"/>
          {/* Assembled Mixed-Media Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#2563eb"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46 Z" fill="#475569"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fed7aa"/>
          <circle cx="67" cy="46" r="4" fill="#0f172a"/>
          <circle cx="93" cy="46" r="4" fill="#0f172a"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <line x1="20" y1="15" x2="140" y2="105" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="4 3"/>
        </svg>
      )

    case 'pastel':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="pastel-blur">
              <feGaussianBlur stdDeviation="3"/>
            </filter>
          </defs>
          <rect width="160" height="120" rx="8" fill="#fae8ff"/>
          {/* Soft Powdery Pastel Glow Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#60a5fa" filter="url(#pastel-blur)"/>
          <ellipse cx="80" cy="50" rx="28" ry="34" fill="#fdba74" filter="url(#pastel-blur)"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fed7aa" opacity="0.85"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" fill="#64748b" opacity="0.8"/>
          <path d="M60 40 Q68 37 75 41" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#334155"/>
          <circle cx="93" cy="46" r="4.5" fill="#334155"/>
          <path d="M71 67 Q80 73 89 67" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'vintage':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" rx="8" fill="#fef3c7"/>
          <rect x="6" y="6" width="148" height="108" rx="4" stroke="#78350f" strokeWidth="1" fill="none" strokeDasharray="4 2"/>
          {/* Classic Vintage Children's Book Engraving Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#fde68a" stroke="#78350f" strokeWidth="1.5"/>
          <rect x="71" y="74" width="18" height="18" fill="#fde68a" stroke="#78350f" strokeWidth="1.2"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fde68a" stroke="#78350f" strokeWidth="1.8"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" fill="#78350f"/>
          <path d="M60 40 Q68 37 75 41" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4" stroke="#78350f" strokeWidth="1.2" fill="#78350f"/>
          <circle cx="93" cy="46" r="4" stroke="#78350f" strokeWidth="1.2" fill="#78350f"/>
          <path d="M71 67 Q80 72 89 67" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'comic':
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="comic-dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="#ef4444"/>
            </pattern>
          </defs>
          <rect width="160" height="120" rx="8" fill="#fef08a"/>
          {/* Bold Comic Book Style Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#2563eb" stroke="#000000" strokeWidth="2.5"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="url(#comic-dots)"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="#fed7aa" opacity="0.75" stroke="#000000" strokeWidth="2.5"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" fill="#000000"/>
          <path d="M60 40 Q68 37 75 41" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#06b6d4" stroke="#000000" strokeWidth="1.8"/>
          <circle cx="93" cy="46" r="4.5" fill="#06b6d4" stroke="#000000" strokeWidth="1.8"/>
          <path d="M71 67 Q80 73 89 67" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        </svg>
      )

    case 'digital':
    default:
      return (
        <svg viewBox="0 0 160 120" className="style-preview-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="digi-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a"/>
              <stop offset="100%" stopColor="#1e1b4b"/>
            </linearGradient>
            <radialGradient id="digi-skin" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffedd5"/>
              <stop offset="75%" stopColor="#fed7aa"/>
              <stop offset="100%" stopColor="#ea580c"/>
            </radialGradient>
          </defs>
          <rect width="160" height="120" rx="8" fill="url(#digi-bg)"/>
          {/* Atmospheric Digital Paint Adult Human */}
          <path d="M25 120 C32 94 58 90 80 90 C102 90 128 94 135 120 Z" fill="#3b82f6"/>
          <rect x="71" y="74" width="18" height="18" fill="#fed7aa"/>
          <ellipse cx="80" cy="50" rx="26" ry="32" fill="url(#digi-skin)"/>
          <path d="M52 46 C50 26 62 16 80 16 C98 16 110 26 108 46" fill="#1e293b"/>
          <path d="M60 40 Q68 37 75 41" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M85 41 Q92 37 100 40" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="67" cy="46" r="4.5" fill="#38bdf8"/>
          <circle cx="93" cy="46" r="4.5" fill="#38bdf8"/>
          <circle cx="65.5" cy="44.5" r="1.5" fill="#ffffff"/>
          <circle cx="91.5" cy="44.5" r="1.5" fill="#ffffff"/>
          <path d="M71 67 Q80 73 89 67" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )
  }
}

export default function IllustrationSetup({ brief, onChange }) {
  const [reading, setReading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Selected style in illustrationStyles array
  const selectedIndex = Math.max(
    0,
    illustrationStyles.findIndex(style => style.id === brief.stylePreset?.id)
  )
  const currentStyle = illustrationStyles[selectedIndex] || illustrationStyles[0]

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadError('')
    if (!/\.(md|txt)$/i.test(file.name) || file.size > 120000) {
      setUploadError('Choose a .txt or .md manuscript up to 120 KB. DOCX and PDF import are not available yet.')
      return
    }
    setReading(true)
    try {
      const text = await file.text()
      if (!text.trim() || text.includes('\u0000')) throw new Error('This file is empty or is not a readable text manuscript.')
      onChange({ manuscript: { name: file.name, text }, analysisStatus: 'not_started' })
    } catch (e) { setUploadError(e.message) } finally { setReading(false) }
  }

  React.useEffect(() => {
    if (!brief.creationMode) {
      onChange({ creationMode: 'manual' })
    }
  }, [])

  const changeMode = mode => {
    if (mode === brief.creationMode) return
    onChange({ creationMode: mode })
  }

  const selectStyle = style => {
    onChange({ stylePreset: { ...style } })
  }

  return <section>
    <fieldset disabled={reading}><legend>How would you like to create?</legend>
      <div className="learning-actions">
        <button type="button" aria-pressed={(brief.creationMode || 'manual') === 'manual'} className={(brief.creationMode || 'manual') === 'manual' ? 'primary' : ''} onClick={() => changeMode('manual')}>Manual creation</button>
        <button type="button" aria-pressed={brief.creationMode === 'manuscript'} className={brief.creationMode === 'manuscript' ? 'primary' : ''} onClick={() => changeMode('manuscript')}>Manuscript-assisted</button>
      </div>
      <p>{(brief.creationMode || 'manual') === 'manual' ? 'Define your characters, objects, locations, and scenes yourself. No upload is required.' : 'Upload a story first. AI analysis and proposed characters will require your approval when analysis is connected.'}</p>
    </fieldset>

    {/* Compact Style Selector and Single Adult Human Preview */}
    <div className="style-picker-container">
      <label htmlFor="style-preset-selector" className="style-picker-label">Choose style preset</label>
      <select
        id="style-preset-selector"
        required
        value={currentStyle.id}
        onChange={e => {
          const chosen = illustrationStyles.find(style => style.id === e.target.value)
          if (chosen) selectStyle(chosen)
        }}
        className="style-picker-select"
      >
        {illustrationStyles.map(style => (
          <option value={style.id} key={style.id}>{style.name}</option>
        ))}
      </select>

      {/* Single Adult Human Avatar Sample Preview Box */}
      <div className="style-picker-preview-box">
        <div className="style-picker-thumbnail">
          {renderHumanAdultPreview(currentStyle.id)}
        </div>
        <div className="style-picker-info">
          <strong className="style-picker-title">{currentStyle.name}</strong>
          <p className="style-picker-desc">{currentStyle.rendering}</p>
        </div>
      </div>
    </div>

    {brief.creationMode === 'manuscript' && <div><label>Upload manuscript (.txt or .md, up to 120 KB)<input type="file" accept=".txt,.md,text/plain,text/markdown" disabled={reading} onChange={upload} /></label><p>Text is read on this device and stored with your private project when you save. It is not sent to an AI provider.</p>{reading && <p role="status">Reading manuscript…</p>}{uploadError && <p role="alert">{uploadError}</p>}{brief.manuscript && <><p>Attached: {brief.manuscript.name}</p><details><summary>Read imported manuscript</summary><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto', overflowWrap: 'anywhere' }}>{brief.manuscript.text}</pre></details><button type="button" onClick={() => onChange({ manuscript: null, analysisStatus: 'not_started' })}>Remove manuscript</button></>}<p>Analysis has not run. Story extraction and approval screens will become available after AI is connected.</p></div>}
    {brief.creationMode === 'manual' && brief.manuscript && <p>Your previous manuscript remains saved but is not used in Manual mode.</p>}
  </section>
}
