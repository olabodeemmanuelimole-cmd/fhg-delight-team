import React, { useState } from 'react'
import IllustrationCanvas from './IllustrationCanvas'
import './story-workspace.css'

export default function StoryWorkspace({ brief, onChange, projectId, dirty }) {
  const [tab, setTab] = useState('characters')
  const [request, setRequest] = useState(null)
  const [target, setTarget] = useState(null)
  const characters = brief.studioCharacters || []
  const scenes = brief.studioScenes || []
  const change = (key, rows) => onChange({ [key]: rows })
  const update = (key, rows, id, patch) => change(key, rows.map(row => row.id === id ? { ...row, ...patch } : row))
  function remove(key, rows, row) {
    if (window.confirm(`Remove ${row.name || row.title || 'this record'} from the project? Saved artwork will remain available.`)) change(key, rows.filter(item => item.id !== row.id))
  }
  function prepare(kind, row) {
    const cast = characters.filter(character => row.characterIds?.includes(character.id))
    const prompt = kind === 'character'
      ? `Create a character reference sheet: full body, half body and facial expressions. Name: ${row.name}. Age: ${row.age}. Fixed appearance: ${row.dna}. Outfit: ${row.outfit}. Keep identity consistent across views.`
      : `Illustrate this scene: ${row.title}. Action: ${row.action}. Shot: ${row.shot}. Lighting: ${row.lighting}. Characters: ${cast.map(c => `${c.name}, age ${c.age}, appearance ${c.dna}, outfit ${c.outfit}`).join('; ')}. Continuity: ${brief['Continuity rules'] || ''}`
    setTarget({ kind, id: row.id })
    setRequest({ prompt: prompt.slice(0, 6000), referenceId: row.artworkId || cast.find(c => c.artworkId)?.artworkId || '', token: crypto.randomUUID() })
    setTab('artwork')
  }
  function attach(id) {
    if (!target) return
    const key = target.kind === 'character' ? 'studioCharacters' : 'studioScenes'
    update(key, target.kind === 'character' ? characters : scenes, target.id, { artworkId: id })
  }
  function move(index, offset) {
    const next = [...scenes], destination = index + offset
    if (destination < 0 || destination >= next.length) return
    ;[next[index], next[destination]] = [next[destination], next[index]]
    change('studioScenes', next)
  }
  function exportProject() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, characters, scenes, style: brief.stylePreset }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'tio-story-project.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="tio-story">
    <header><span className="tio-story-eyebrow">YOUR BOOK WORKSPACE</span><h2>Build your story, scene by scene.</h2><p>{characters.length} characters · {scenes.length} scenes. Save the project to keep your changes across devices.</p></header>
    <nav className="learning-actions" aria-label="Illustration workspace">{['characters', 'scenes', 'storyboard', 'artwork'].map(item => <button type="button" key={item} aria-pressed={tab === item} className={tab === item ? 'primary' : ''} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
    {tab === 'characters' && <><p>Define the appearance that should remain consistent throughout the book.</p>{characters.map(c => <article className="tio-story-card" key={c.id}><label>Character name<input maxLength={120} value={c.name} onChange={e => update('studioCharacters', characters, c.id, { name: e.target.value })}/></label><label>Age<input maxLength={60} value={c.age} onChange={e => update('studioCharacters', characters, c.id, { age: e.target.value })}/></label><label>Fixed appearance<textarea maxLength={2000} value={c.dna} onChange={e => update('studioCharacters', characters, c.id, { dna: e.target.value })}/></label><label>Clothing and accessories<textarea maxLength={1000} value={c.outfit} onChange={e => update('studioCharacters', characters, c.id, { outfit: e.target.value })}/></label><div className="learning-actions"><button type="button" disabled={!c.name.trim() || !c.dna.trim()} onClick={() => prepare('character', c)}>Prepare reference sheet</button><button type="button" onClick={() => remove('studioCharacters', characters, c)}>Remove character</button></div>{c.artworkId && <p>Reference artwork linked.</p>}</article>)}<button type="button" disabled={characters.length >= 30} onClick={() => change('studioCharacters', [...characters, { id: crypto.randomUUID(), name: '', age: '', dna: '', outfit: '' }])}>+ Add character</button></>}
    {tab === 'scenes' && <>{scenes.map((s, index) => <article className="tio-story-card" key={s.id}><h3>Scene {index + 1}</h3><label>Scene title<input maxLength={150} value={s.title} onChange={e => update('studioScenes', scenes, s.id, { title: e.target.value })}/></label><label>Action and setting<textarea maxLength={2000} value={s.action} onChange={e => update('studioScenes', scenes, s.id, { action: e.target.value })}/></label><label>Camera shot<select value={s.shot} onChange={e => update('studioScenes', scenes, s.id, { shot: e.target.value })}>{['Wide establishing shot', 'Full body', 'Close-up portrait', 'Two-person interaction', 'Over the shoulder'].map(v => <option key={v}>{v}</option>)}</select></label><label>Lighting<input maxLength={200} value={s.lighting} onChange={e => update('studioScenes', scenes, s.id, { lighting: e.target.value })}/></label><fieldset><legend>Characters in this scene</legend>{!characters.length && <p>Add a character first.</p>}{characters.map(c => <label className="tio-story-check" key={c.id}><input type="checkbox" checked={s.characterIds.includes(c.id)} onChange={e => update('studioScenes', scenes, s.id, { characterIds: e.target.checked ? [...s.characterIds, c.id] : s.characterIds.filter(id => id !== c.id) })}/>{c.name || 'Unnamed character'}</label>)}</fieldset><div className="learning-actions"><button type="button" disabled={!s.action.trim()} onClick={() => prepare('scene', s)}>Prepare scene artwork</button><button type="button" onClick={() => remove('studioScenes', scenes, s)}>Remove scene</button></div></article>)}<button type="button" disabled={scenes.length >= 60} onClick={() => change('studioScenes', [...scenes, { id: crypto.randomUUID(), title: '', action: '', shot: 'Wide establishing shot', lighting: 'Soft daylight', characterIds: [] }])}>+ Add scene</button></>}
    {tab === 'storyboard' && <>{!scenes.length && <p>Add scenes to arrange your book here.</p>}<ol className="tio-story-board">{scenes.map((s, index) => <li className="tio-story-card" key={s.id}><h3>{index + 1}. {s.title || 'Untitled scene'}</h3><p>{s.action || 'No scene description yet.'}</p><p>{s.artworkId ? 'Artwork linked' : 'Artwork pending'} · {s.shot}</p><div className="learning-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)}>Move earlier</button><button type="button" disabled={index === scenes.length - 1} onClick={() => move(index, 1)}>Move later</button><button type="button" onClick={() => prepare('scene', s)}>Open artwork</button></div></li>)}</ol><button type="button" onClick={exportProject}>Export story data</button></>}
    <div hidden={tab !== 'artwork'}>{target && <p>Working on {target.kind === 'character' ? characters.find(c => c.id === target.id)?.name : scenes.find(s => s.id === target.id)?.title}. Successful generation links the artwork to this record; save the project afterward.</p>}{projectId ? <IllustrationCanvas projectId={projectId} dirty={dirty} preparedRequest={request} onGenerated={attach}/> : <p>Save your project first to open the artwork canvas.</p>}</div>
  </section>
}
