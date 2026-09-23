import React, { useState } from 'react'
import { illustrationStyles } from './illustrationStyles'

export default function IllustrationSetup({ brief, onChange }) {
  const [reading, setReading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadError('')
    if (!/\.(md|txt)$/i.test(file.name) || file.size > 120000) { setUploadError('Choose a .txt or .md manuscript up to 120 KB. DOCX and PDF import are not available yet.'); return }
    setReading(true)
    try {
      const text = await file.text()
      if (!text.trim() || text.includes('\u0000')) throw new Error('This file is empty or is not a readable text manuscript.')
      onChange({ manuscript: { name: file.name, text }, analysisStatus: 'not_started' })
    } catch (e) { setUploadError(e.message) } finally { setReading(false) }
  }
  const changeMode = mode => {
    if (mode === brief.creationMode) return
    onChange({ creationMode: mode })
  }
  return <section>
    <fieldset disabled={reading}><legend>How would you like to create?</legend>
      <div className="learning-actions"><button type="button" aria-pressed={brief.creationMode === 'manual'} className={brief.creationMode === 'manual' ? 'primary' : ''} onClick={() => changeMode('manual')}>Manual creation</button><button type="button" aria-pressed={brief.creationMode === 'manuscript'} className={brief.creationMode === 'manuscript' ? 'primary' : ''} onClick={() => changeMode('manuscript')}>Manuscript-assisted</button></div>
      <p>{brief.creationMode === 'manual' ? 'Define your characters, objects, locations, and scenes yourself. No upload is required.' : brief.creationMode === 'manuscript' ? 'Upload a story first. AI analysis and proposed characters will require your approval when analysis is connected.' : 'Choose a path to reveal its project fields.'}</p>
    </fieldset>
    <label>Art style<select required value={brief.stylePreset?.id || ''} onChange={e => onChange({ stylePreset: { ...illustrationStyles.find(style => style.id === e.target.value) } })}><option value="" disabled>Select a built-in style</option>{illustrationStyles.map(style => <option value={style.id} key={style.id}>{style.name}</option>)}</select></label>
    {brief.stylePreset?.id && <details><summary>View saved style recipe</summary><dl>{['shapes','proportions','texture','lighting','colour','rendering'].map(key => <React.Fragment key={key}><dt style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key}</dt><dd>{brief.stylePreset[key]}</dd></React.Fragment>)}</dl><p>This recipe is saved with the project. It guides future generation; it does not guarantee identical artwork.</p></details>}
    {brief.creationMode === 'manuscript' && <div><label>Upload manuscript (.txt or .md, up to 120 KB)<input type="file" accept=".txt,.md,text/plain,text/markdown" disabled={reading} onChange={upload} /></label><p>Text is read on this device and stored with your private project when you save. It is not sent to an AI provider.</p>{reading && <p role="status">Reading manuscript…</p>}{uploadError && <p role="alert">{uploadError}</p>}{brief.manuscript && <><p>Attached: {brief.manuscript.name}</p><details><summary>Read imported manuscript</summary><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto', overflowWrap: 'anywhere' }}>{brief.manuscript.text}</pre></details><button type="button" onClick={() => onChange({ manuscript: null, analysisStatus: 'not_started' })}>Remove manuscript</button></>}<p>Analysis has not run. Story extraction and approval screens will become available after AI is connected.</p></div>}
    {brief.creationMode === 'manual' && brief.manuscript && <p>Your previous manuscript remains saved but is not used in Manual mode.</p>}
  </section>
}
