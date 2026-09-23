import React, { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './learning-hub.css'

const tools = [
  { id: 'positioning', name: 'Gig Positioning Architect', description: 'Plan distinct services, buyer groups, and a balanced gig portfolio.', fields: ['Core services', 'Skills and tools', 'Target buyers', 'Existing gigs', 'Services you cannot deliver'] },
  { id: 'titles', name: 'Keyword & Gig Title Research', description: 'Prepare your niche and research references for keyword and title development.', fields: ['Service or niche', 'Target buyers', 'Platforms and specializations', 'Existing keywords', 'Competitor links'] },
  { id: 'copy', name: 'Gig Description & Sales Copy', description: 'Shape a clear offer grounded in your real skills and proof.', fields: ['Service', 'Target audience', 'Buyer problem', 'Deliverables and exclusions', 'Verified proof and credentials', 'Tone and writing approach'] },
  { id: 'pricing', name: 'Pricing, Packages & FAQs', description: 'Define scope, delivery, revisions, and the questions buyers need answered.', fields: ['Service and positioning', 'Basic scope', 'Standard scope', 'Premium scope', 'Delivery and revisions', 'Pricing references', 'Buyer questions'] },
  { id: 'bio', name: 'Profile Identity & Bio', description: 'Develop a coherent professional identity across your services.', fields: ['Professional name', 'Specialization', 'Target audience', 'Real experience and credentials', 'Approach and differentiator'] },
  { id: 'visuals', name: 'Visual Identity & Gig Images', description: 'Prepare direction for profile imagery, a brand mark, and gig thumbnails.', fields: ['Brand personality', 'Services and audience', 'Existing visual assets', 'Preferred visual direction', 'Assets you have permission to use'] },
  { id: 'portfolio', name: 'Portfolio Builder', description: 'Structure real projects or clearly labelled concept case studies.', fields: ['Service focus', 'Project type: real or concept', 'Project context and goal', 'Your actual contribution', 'Deliverables', 'Verified outcomes'] },
  { id: 'experience', name: 'Work Experience Builder', description: 'Present genuine professional experience with specific responsibilities.', fields: ['Actual roles and employers', 'Employment type and dates', 'Responsibilities', 'Skills and tools', 'Deliverables and supported results'] },
  { id: 'illustration', name: 'Illustration Studio', description: 'Plan a book through approved characters, assets, environments, and scenes.', fields: ['Book title and audience', 'Book dimensions and format', 'Art style and colour direction', 'Manuscript or story outline', 'Characters and locked features', 'Recurring objects and locations', 'Scene plan', 'Continuity rules'] },
]
export default function CreativeHub({ onBack }) {
  const [category, setCategory] = useState('fiverr')
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState({})
  const [draftId, setDraftId] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let ignore = false
    setLoading(true); setError('')
    async function load() {
      if (!supabase) throw new Error('TeamFlow’s database connection is unavailable.')
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const result = await supabase.from('creative_projects').select('*').eq('owner_id', auth.user.id).order('updated_at', { ascending: false })
      if (result.error) throw result.error
      if (!ignore) setDrafts(result.data)
    }
    load().catch(e => { if (!ignore) setError('Saved projects could not load. Check the connection and that creative-hub-foundation.sql is installed. ' + e.message) }).finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [revision])
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function open(tool, project) {
    setSelected(tool); setDraftId(project?.id || null); setTitle(project?.title || ''); setBrief(project?.brief || {}); setDirty(false); setNotice('')
  }
  function back() {
    if (busy || (dirty && !window.confirm('Leave without saving your brief changes?'))) return
    if (selected) { setSelected(null); setDirty(false); setNotice('') } else onBack()
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (!title.trim()) throw new Error('Enter a project name.')
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const values = { title: title.trim(), tool_id: selected.id, brief }
      const query = draftId ? supabase.from('creative_projects').update(values).eq('id', draftId).eq('owner_id', auth.user.id) : supabase.from('creative_projects').insert({ ...values, owner_id: auth.user.id })
      const result = await query.select().single()
      if (result.error) throw result.error
      setDraftId(result.data.id); setDirty(false); setNotice('Brief saved to your TeamFlow account. No AI generation has run.'); setRevision(n => n + 1)
    } catch (e) { setError('Could not save: ' + e.message) } finally { setBusy(false) }
  }
  function download() {
    const content = '# ' + (title || selected.name) + '\n\nTool: ' + selected.name + '\n\nProject brief — not AI-generated output.\n\n' + selected.fields.map(field => '## ' + field + '\n' + (brief[field] || 'Not supplied') + '\n').join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'tio-project-brief.md'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const visible = tools.filter(tool => category === 'design' ? tool.id === 'illustration' : tool.id !== 'illustration')
  return <main className="learning-hub"><header className="learning-heading"><button onClick={back} disabled={busy}>← Back</button><span>TeamFlow · TIO Creative Hub</span></header>
    <div className="learning-title"><div><h1>{selected?.name || 'Give your next idea a clear direction.'}</h1><p>{selected?.description || 'Build a professional brief, organize your work, and return to it when you are ready.'}</p></div></div>
    <p className="learning-notice">Project planning is available. AI research, writing, and image generation are not connected yet.</p>
    {error && <div className="learning-error" role="alert"><p>{error}</p><button onClick={() => setRevision(n => n + 1)} disabled={busy}>Retry connection</button></div>}
    {notice && <p role="status">{notice}</p>}
    {selected ? <form className="learning-editor" onSubmit={save}>
      <label>Project name<input required maxLength={200} value={title} onChange={e => { setTitle(e.target.value); setDirty(true) }} /></label>
      {selected.fields.map(field => <label key={field}>{field}<textarea rows={field.includes('Manuscript') ? 9 : 3} maxLength={30000} value={brief[field] || ''} onChange={e => { setBrief(previous => ({ ...previous, [field]: e.target.value })); setDirty(true) }} /></label>)}
      <p>Use information you own or have permission to share. Keep passwords and secret keys out of your brief. Concept work must be labelled; real experience and results must be accurate.</p>
      {selected.id === 'illustration' && <p>Planned workflow: story analysis → approved character and location references → storyboard → artwork → consistency review → page layout. These production stages are not active yet.</p>}
      <div className="learning-actions"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save project brief'}</button><button type="button" onClick={download}>Download brief</button><span>{dirty ? 'Unsaved changes' : draftId ? 'Saved project' : 'New project'}</span></div>
    </form> : <><nav className="learning-actions" aria-label="Creative categories"><button aria-pressed={category === 'fiverr'} className={category === 'fiverr' ? 'primary' : ''} onClick={() => setCategory('fiverr')}>Fiverr Ecosystem</button><button aria-pressed={category === 'design'} className={category === 'design' ? 'primary' : ''} onClick={() => setCategory('design')}>Design & Illustration</button></nav>
      <div className="learning-courses">{visible.map(tool => <button className="learning-course" key={tool.id} onClick={() => open(tool)}><h3>{tool.name}</h3><p>{tool.description}</p><strong>Prepare a brief →</strong></button>)}</div>
      <h2 style={{ marginTop: 40 }}>Your saved projects</h2>{loading ? <p role="status">Loading saved projects…</p> : !error && !drafts.length ? <p>No projects yet. Choose a tool above to start your first brief.</p> : <ul className="learning-lessons">{drafts.map(project => { const tool = tools.find(item => item.id === project.tool_id); return tool && <li key={project.id}><button onClick={() => open(tool, project)}><span>{project.title}</span><span>{tool.name} →</span></button></li> })}</ul>}
    </>}
  </main>
}
