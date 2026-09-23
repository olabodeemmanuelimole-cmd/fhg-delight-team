import React, { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export default function IllustrationCanvas({ projectId, dirty }) {
  const [images,setImages]=useState([]), [selected,setSelected]=useState(null), [reference,setReference]=useState('')
  const [prompt,setPrompt]=useState(''), [ratio,setRatio]=useState('1:1'), [busy,setBusy]=useState(false)
  const [error,setError]=useState(''), [zoom,setZoom]=useState(1), [revision,setRevision]=useState(0)
  const [admin,setAdmin]=useState(false), [loading,setLoading]=useState(true)
  const canvas=useRef(null)
  useEffect(()=>{
    let ignore=false
    setLoading(true); setError('')
    async function load(){
      const {data:auth,error:authError}=await supabase.auth.getUser(); if(authError) throw authError
      const {data:profile,error:profileError}=await supabase.from('profiles').select('role,status').eq('id',auth.user.id).single(); if(profileError) throw profileError
      if(!ignore) setAdmin(profile?.role==='admin' && profile.status==='active')
      const {data,error}=await supabase.from('illustration_generations').select('*').eq('project_id',projectId).eq('status','complete').order('created_at',{ascending:false}); if(error) throw error
      const ready=await Promise.all(data.map(async row=>{const {data:link,error}=await supabase.storage.from('illustration-artwork').createSignedUrl(row.storage_path,3600); if(error) throw error; return {...row,url:link.signedUrl}}))
      if(!ignore){setImages(ready);setSelected(old=>ready.find(row=>row.id===old?.id)||ready[0]||null)}
    }
    load().catch(e=>{if(!ignore)setError('Artwork could not load: '+e.message)}).finally(()=>{if(!ignore)setLoading(false)})
    return ()=>{ignore=true}
  },[projectId,revision])
  useEffect(()=>{
    if(!selected || !canvas.current)return
    let ignore=false
    const image=new Image(); image.crossOrigin='anonymous'
    image.onload=()=>{if(ignore||!canvas.current)return;const surface=canvas.current;surface.width=image.naturalWidth;surface.height=image.naturalHeight;surface.getContext('2d').drawImage(image,0,0)}
    image.onerror=()=>{if(!ignore)setError('Image link expired or could not load. Refresh artwork.')}
    image.src=selected.url
    return ()=>{ignore=true}
  },[selected])
  async function generate(){
    if(!window.confirm('Send this description, your saved style, and the selected reference (if any) to Google Gemini? API charges may apply.'))return
    setBusy(true);setError('')
    try{
      const {error}=await supabase.functions.invoke('illustration-generate',{body:{projectId,prompt,aspectRatio:ratio,referenceId:reference||null,requestId:crypto.randomUUID()}})
      if(error){let message=error.message;try{message=(await error.context.json()).error||message}catch{}throw new Error(message)}
      setRevision(n=>n+1)
    }catch(e){setError(e.message+' Do not immediately retry an uncertain timeout: refresh the artwork list first.')}
    finally{setBusy(false)}
  }
  function download(){try{const a=document.createElement('a');a.download='tio-artwork.png';a.href=canvas.current.toDataURL('image/png');a.click()}catch{setError('Could not export artwork. Refresh and try again.')}}
  return <section style={{marginTop:40}} aria-label="Illustration canvas"><h2>Illustration canvas</h2><p>Generate artwork, use it as a reference for a scene, and download the result. This first canvas supports zoom and scroll, not drawing or page-layout editing.</p>
    {error&&<p role="alert" className="learning-error">{error}</p>}
    <div className="learning-actions"><button type="button" disabled={busy} onClick={()=>setRevision(n=>n+1)}>Refresh artwork</button>{selected&&<><label>Zoom<select value={zoom} onChange={e=>setZoom(Number(e.target.value))}><option value="0.5">50%</option><option value="1">Fit width</option><option value="1.5">150%</option><option value="2">200%</option></select></label><button type="button" onClick={download}>Download PNG</button></>}</div>
    <div style={{background:'#e4e9ed',border:'1px solid #bdc9d3',borderRadius:12,overflow:'auto',maxHeight:650,minHeight:280,padding:16}}>{selected?<canvas ref={canvas} aria-label="Generated illustration" style={{width:`${zoom*100}%`,maxWidth:'none',height:'auto',display:'block',background:'white'}}/>:<p>{loading?'Loading artwork…':'Your generated artwork will appear here.'}</p>}</div>
    {!!images.length&&<label>View saved artwork<select value={selected?.id||''} onChange={e=>setSelected(images.find(image=>image.id===e.target.value))}>{images.map((image,index)=><option key={image.id} value={image.id}>{images.length-index}. {image.prompt.slice(0,70)}</option>)}</select></label>}
    {admin&&<fieldset disabled={busy} style={{marginTop:24}}><legend>Administrator generation test</legend><label>Describe the character or scene<textarea maxLength={6000} rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)}/></label><label>Canvas shape<select value={ratio} onChange={e=>setRatio(e.target.value)}><option value="1:1">Square</option><option value="4:5">Portrait</option><option value="16:9">Landscape</option></select></label><label>Visual reference<select value={reference} onChange={e=>setReference(e.target.value)}><option value="">None — new artwork</option>{images.map((image,index)=><option key={image.id} value={image.id}>{images.length-index}. {image.prompt.slice(0,60)}</option>)}</select></label><p>The backend must be deployed and enabled. Maximum 10 attempts per administrator in 24 hours, one per minute; failed attempts count. This is a request limit, not a dollar cap.</p>{dirty&&<p>Save your brief changes before generating.</p>}<button type="button" className="primary" disabled={busy||dirty||!prompt.trim()} onClick={generate}>{busy?'Generating and saving…':'Generate artwork with Gemini'}</button></fieldset>}
  </section>
}
