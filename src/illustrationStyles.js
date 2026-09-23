// Versioned project presets; saved snapshots keep existing projects stable.
const rows = [
  ['3d-storybook', '3D Animated Storybook', 'Rounded sculpted forms', 'Expressive stylised proportions', 'Soft tactile materials', 'Soft dimensional lighting', 'Rich controlled colours', 'Stylised 3D render'],
  ['watercolour', 'Watercolour', 'Loose organic contours', 'Gentle natural proportions', 'Transparent washes and paper grain', 'Diffuse daylight', 'Layered translucent colours', 'Painted washes with reserved highlights'],
  ['gouache', 'Gouache', 'Bold painted silhouettes', 'Simplified expressive proportions', 'Opaque matte brushwork', 'Broad light and shadow masses', 'Opaque balanced colours', 'Layered hand-painted finish'],
  ['paper', 'Paper Cutout', 'Cut-paper silhouettes', 'Graphic simplified proportions', 'Layered paper edges', 'Subtle cast shadows', 'Limited contrasting palette', 'Dimensional paper collage'],
  ['vector', '2D Vector', 'Clean geometric contours', 'Consistent simplified proportions', 'Flat smooth fills', 'Minimal graphic shading', 'Clear solid colours', 'Crisp vector-like illustration'],
  ['crayon', 'Crayon', 'Hand-drawn irregular contours', 'Playful consistent proportions', 'Wax strokes on grainy paper', 'Simple readable lighting', 'Lively layered colours', 'Visible crayon marks'],
  ['pencil-wash', 'Pencil and Wash', 'Fine sketch contours', 'Natural expressive proportions', 'Graphite with light washes', 'Soft restrained shadows', 'Muted colour accents', 'Pencil-led painted sketch'],
  ['ink', 'Ink Storybook', 'Expressive ink contours', 'Storybook proportions', 'Hatching and ink variation', 'Line-defined shadows', 'Restrained accent palette', 'Ink drawing with selective colour'],
  ['anime', 'Anime', 'Clean expressive contours', 'Stylised consistent anatomy', 'Smooth cel surfaces', 'Cel-shaded light', 'Controlled vivid palette', '2D anime illustration'],
  ['manga', 'Manga', 'Dynamic ink contours', 'Expressive consistent anatomy', 'Screentones and hatching', 'High-contrast graphic light', 'Monochrome with optional accents', 'Printed manga finish'],
  ['clay', 'Clay', 'Soft sculpted silhouettes', 'Rounded model proportions', 'Subtle clay fingerprints', 'Soft studio lighting', 'Warm solid pigments', 'Stop-motion clay appearance'],
  ['collage', 'Collage', 'Assembled torn shapes', 'Deliberately graphic proportions', 'Layered mixed materials', 'Shallow layered shadows', 'Curated contrasting palette', 'Mixed-media assembled artwork'],
  ['pastel', 'Pastel', 'Soft blended contours', 'Gentle expressive proportions', 'Powdery pigment on paper', 'Diffuse luminous light', 'Soft layered hues', 'Visible pastel strokes'],
  ['vintage', 'Vintage Children’s Book', 'Traditional drawn contours', 'Classic storybook proportions', 'Subtle printed paper texture', 'Soft illustrative lighting', 'Muted print palette', 'Traditional print illustration'],
  ['comic', 'Comic', 'Confident contour lines', 'Expressive consistent anatomy', 'Ink and graphic fills', 'Clear dramatic shadow shapes', 'Limited bold palette', 'Sequential-art ink finish'],
  ['digital', 'Realistic Digital Painting', 'Observed organic forms', 'Natural anatomy and scale', 'Material-specific painted surfaces', 'Physically coherent light', 'Natural controlled palette', 'Detailed digital paint'],
]

export const illustrationStyles = rows.map(([id, name, shapes, proportions, texture, lighting, colour, rendering]) => ({
  id, name, version: 1, shapes, proportions, texture, lighting, colour, rendering
}))

export function validateIllustration(brief) {
  if (!['manual', 'manuscript'].includes(brief.creationMode)) return 'Choose Manual or Manuscript-assisted creation.'
  if (!illustrationStyles.some(style => style.id === brief.stylePreset?.id)) return 'Choose a built-in art style.'
  if (brief.creationMode === 'manuscript' && !brief.manuscript?.text?.trim()) return 'Upload a manuscript before saving the assisted project.'
  return null
}
