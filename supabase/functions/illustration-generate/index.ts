import { createClient } from 'npm:@supabase/supabase-js@2'
const origin = Deno.env.get('APP_ORIGIN') || 'https://teamflow-fhg-delight.vercel.app'
const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' }
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers })
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return reply(405, { error: 'POST required' })
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key || Deno.env.get('ILLUSTRATION_ENABLED') !== 'true') return reply(503, { error: 'Generation is disabled. Ask the administrator to configure the Gemini secret and enable testing.' })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return reply(401, { error: 'Sign in first' })
  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) return reply(401, { error: 'Your session expired. Sign in again.' })
  let generationId: string | null = null
  try {
    const raw = await req.text()
    if (raw.length > 12000) return reply(413, { error: 'Request too large' })
    const body = JSON.parse(raw)
    if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 6000 || !['1:1','4:5','16:9'].includes(body.aspectRatio)) return reply(400, { error: 'Enter a description up to 6,000 characters and a supported aspect ratio.' })
    const { data: profile } = await db.from('profiles').select('role,status').eq('id', auth.user.id).single()
    if (profile?.role !== 'admin' || profile.status !== 'active') return reply(403, { error: 'Image generation is restricted to active administrators during testing.' })
    const { data: project } = await db.from('creative_projects').select('brief').eq('id', body.projectId).eq('owner_id', auth.user.id).eq('tool_id','illustration').single()
    if (!project?.brief?.stylePreset?.id) return reply(400, { error: 'Save an illustration project with an art style first.' })
    const parts: unknown[] = [{ text: 'Create one illustration. Preserve the selected project style. Project style: ' + JSON.stringify(project.brief.stylePreset).slice(0,4000) + '\nRequested artwork: ' + body.prompt }]
    if (body.referenceId) {
      const { data: reference } = await db.from('illustration_generations').select('storage_path').eq('id', body.referenceId).eq('owner_id', auth.user.id).eq('project_id',body.projectId).eq('status','complete').single()
      if (!reference?.storage_path) return reply(400, { error: 'Reference artwork is unavailable.' })
      const { data: blob, error } = await db.storage.from('illustration-artwork').download(reference.storage_path)
      if (error || !blob || blob.size > 15728640) return reply(400, { error: 'Could not load the reference image.' })
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192))
      parts.push({ inlineData: { mimeType: blob.type, data: btoa(binary) } })
      parts.push({ text: 'Use the attached artwork as the visual reference. Preserve character identity unless the requested change explicitly says otherwise.' })
    }
    const { data: reserved, error: reserveError } = await db.rpc('reserve_illustration', { p_owner: auth.user.id, p_project: body.projectId, p_request: body.requestId, p_prompt: body.prompt })
    if (reserveError) return reply(429, { error: reserveError.message })
    generationId = reserved
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role:'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: body.aspectRatio, imageSize: '1K' } } }),
      signal: AbortSignal.timeout(110000),
    })
    if (!response.ok) throw new Error(response.status === 429 ? 'Gemini quota or billing limit reached. Check Google AI Studio.' : 'Gemini rejected the request. Check model access and billing in Google AI Studio.')
    const result = await response.json()
    const image = result.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData && !part.thought)?.inlineData
    if (!image || !['image/png','image/jpeg','image/webp'].includes(image.mimeType)) throw new Error('Gemini returned no usable image. The request may have been blocked; no artwork was saved.')
    if (image.data.length > 21000000) throw new Error('Generated image exceeded the storage limit.')
    const bytes = Uint8Array.from(atob(image.data), c => c.charCodeAt(0))
    const extension = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/jpeg' ? 'jpg' : 'webp'
    const path = `${auth.user.id}/${body.projectId}/${generationId}.${extension}`
    const { error: uploadError } = await db.storage.from('illustration-artwork').upload(path, bytes, { contentType: image.mimeType })
    if (uploadError) throw new Error('Generation finished but artwork could not be stored. Contact the administrator before retrying; generation may have been charged.')
    const { error: updateError } = await db.from('illustration_generations').update({ status:'complete', storage_path:path }).eq('id',generationId)
    if (updateError) throw new Error('Artwork stored, but its record could not be updated. Contact the administrator before retrying.')
    return reply(200, { id:generationId })
  } catch (e) {
    if (generationId) await db.from('illustration_generations').update({status:'failed'}).eq('id',generationId)
    return reply(400, { error: e instanceof SyntaxError ? 'Invalid request' : e instanceof Error ? e.message : 'Generation failed' })
  }
})
