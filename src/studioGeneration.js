import { supabase } from './supabase'
import { illustrationStyles } from './illustrationStyles'

export async function generateStudioArtwork({ project, style, prompt, characters, scenes, referenceId }) {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Sign in before generating artwork.')
  const stylePreset = illustrationStyles.find(s => s.name === style || s.id === style)
  if (!stylePreset) throw new Error('Choose a supported art style before generating.')
  const cloudId = project.cloudId || (/^[0-9a-f-]{36}$/i.test(project.id) ? project.id : null)
  let previous = {}
  if (cloudId) {
    const { data, error } = await supabase.from('creative_projects').select('brief').eq('id', cloudId).eq('owner_id', auth.user.id).single()
    if (error) throw error
    previous = data.brief || {}
  }
  const clean = rows => rows.filter(r => r.projectId === project.id).map(({ imageUrl, ...r }) => r)
  const values = { title: project.name, tool_id: 'illustration', brief: { ...previous, description: project.description, creationMode: 'manual', artStyle: style, stylePreset, studioCharacters: clean(characters), studioScenes: clean(scenes) } }
  const query = cloudId ? supabase.from('creative_projects').update(values).eq('id', cloudId).eq('owner_id', auth.user.id) : supabase.from('creative_projects').insert({ ...values, owner_id: auth.user.id })
  const { data: saved, error: saveError } = await query.select().single()
  if (saveError) throw saveError
  // Retain the cloud mapping even if generation fails, avoiding duplicate projects on retry.
  project.cloudId = saved.id
  const { data, error } = await supabase.functions.invoke('illustration-generate', { body: { projectId: saved.id, requestId: crypto.randomUUID(), prompt, aspectRatio: '1:1', referenceId: referenceId || null } })
  if (error) {
    let message = error.message
    try { message = (await error.context.json()).error || message } catch {}
    throw new Error(message)
  }
  if (!data?.id) throw new Error('No artwork record returned. Check saved generations before retrying.')
  const { data: artwork, error: recordError } = await supabase.from('illustration_generations').select('id,storage_path').eq('id', data.id).single()
  if (recordError) throw new Error('Artwork generated but could not be loaded. Do not generate again; check saved generations.')
  const imageUrl = await getStudioImageUrl(artwork.storage_path)
  return { imageUrl, artworkId: artwork.id, storagePath: artwork.storage_path }
}

export async function getStudioImageUrl(path) {
  const { data, error } = await supabase.storage.from('illustration-artwork').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
