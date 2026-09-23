import React, { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './learning-hub.css'

const blankCourse = { title: '', description: '', category: 'General', status: 'draft' }
const blankLesson = { title: '', content: '', video_url: '', position: 0 }
export default function LearningHub({ user, onBack }) {
  const admin = user.role === 'Administrator'
  const [courses, setCourses] = useState([])
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [lesson, setLesson] = useState(null)
  const [completed, setCompleted] = useState([])
  const [resources, setResources] = useState([])
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState(null)
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let ignore = false
    setLoading(true); setError(''); setLessons([]); setResources([])
    async function load() {
      if (!supabase) throw new Error('TeamFlow’s database connection is not configured.')
      const session = await supabase.auth.getUser()
      if (session.error) throw session.error
      const results = await Promise.all([
        supabase.from('learning_courses').select('*').order('created_at', { ascending: false }),
        supabase.from('learning_progress').select('lesson_id').eq('member_id', session.data.user.id),
        course ? supabase.from('learning_lessons').select('*').eq('course_id', course.id).order('position').order('created_at') : Promise.resolve({ data: [] }),
        lesson ? supabase.from('learning_resources').select('*').eq('lesson_id', lesson.id) : Promise.resolve({ data: [] }),
      ])
      const failure = results.find(result => result.error)
      if (failure) throw failure.error
      if (!ignore) { setCourses(results[0].data); setCompleted(results[1].data.map(row => row.lesson_id)); setLessons(results[2].data); setResources(results[3].data) }
    }
    load().catch(e => { if (!ignore) setError(/learning_|schema cache/.test(e.message) ? 'Learning Hub could not load. Ask your administrator to install learning-foundation.sql, then retry. Details: ' + e.message : e.message) }).finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [course?.id, lesson?.id, revision])
  const back = () => {
    if (busy) return
    if (editor) { if (!window.confirm('Discard these unsaved changes?')) return; setEditor(null) }
    else if (lesson) setLesson(null)
    else if (course) setCourse(null)
    else onBack()
    setError(''); setNotice('')
  }
  const edit = (kind, record) => { setError(''); setNotice(''); setEditor(kind); setDraft({ ...record }) }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const session = await supabase.auth.getUser()
      if (session.error) throw session.error
      const table = editor === 'course' ? 'learning_courses' : 'learning_lessons'
      const values = editor === 'course'
        ? { title: draft.title.trim(), description: draft.description, category: draft.category.trim() || 'General', status: draft.status }
        : { title: draft.title.trim(), content: draft.content, video_url: draft.video_url.trim() || null, position: Number(draft.position), course_id: course.id }
      if (!values.title) throw new Error('Please enter a title.')
      if (values.video_url && new URL(values.video_url).protocol !== 'https:') throw new Error('Use a secure HTTPS video link.')
      if (editor === 'course' && !draft.id) values.created_by = session.data.user.id
      const result = await (draft.id ? supabase.from(table).update(values).eq('id', draft.id) : supabase.from(table).insert(values)).select().single()
      if (result.error) throw result.error
      if (editor === 'course') { setCourse(result.data); setLesson(null) }
      else if (lesson?.id === result.data.id) setLesson(result.data)
      setEditor(null); setRevision(n => n + 1); setNotice('Saved successfully.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function toggleComplete() {
    setBusy(true); setError(''); setNotice('')
    try {
      const session = await supabase.auth.getUser()
      if (session.error) throw session.error
      const member_id = session.data.user.id
      const done = completed.includes(lesson.id)
      const result = done
        ? await supabase.from('learning_progress').delete().eq('member_id', member_id).eq('lesson_id', lesson.id)
        : await supabase.from('learning_progress').insert({ member_id, lesson_id: lesson.id })
      if (result.error) throw result.error
      setCompleted(list => done ? list.filter(id => id !== lesson.id) : [...list, lesson.id])
      setNotice(done ? 'Lesson marked incomplete.' : 'Lesson completed. Your progress is saved.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const field = (name, value) => setDraft(previous => ({ ...previous, [name]: value }))
  const visible = courses.filter(item => (item.title + ' ' + item.category).toLowerCase().includes(search.toLowerCase()))
  const doneCount = lessons.filter(item => completed.includes(item.id)).length
  return <main className="learning-hub">
    <header className="learning-heading"><button onClick={back} disabled={busy} aria-label="Go back">← Back</button><span>TeamFlow · Learning Hub</span></header>
    <div className="learning-title"><div><h1>{editor ? `${draft.id ? 'Edit' : 'Create'} ${editor}` : lesson?.title || course?.title || 'Make room for your next skill.'}</h1><p>{editor ? 'Save your work here. Publish a course when it is ready for members.' : course ? course.category : 'Your team’s courses, practical lessons, and resources—all in one workspace.'}</p></div>{admin && !course && !editor && <button className="primary" onClick={() => edit('course', blankCourse)}>Create course</button>}</div>
    {error && <section className="learning-error" role="alert"><p>{error}</p>{!editor && <button onClick={() => setRevision(n => n + 1)}>Retry loading</button>}</section>}
    {notice && <p className="learning-notice" role="status">{notice}</p>}
    {editor ? <form className="learning-editor" onSubmit={save}>
      <label>Title<input required maxLength={200} value={draft.title} onChange={e => field('title', e.target.value)} /></label>
      {editor === 'course' ? <><label>Category<input maxLength={100} value={draft.category} onChange={e => field('category', e.target.value)} /></label><label>Description<textarea rows={5} value={draft.description} onChange={e => field('description', e.target.value)} /></label><label>Visibility<select value={draft.status} onChange={e => field('status', e.target.value)}><option value="draft">Draft — administrators only</option><option value="published">Published — all active members</option><option value="archived">Archived — hidden from learners</option></select></label><p>Published courses are available to all active members. Do not publish private or restricted content yet.</p></> : <><label>Lesson text<textarea rows={10} value={draft.content} onChange={e => field('content', e.target.value)} /></label><label>Video link (optional)<input type="url" placeholder="https://…" value={draft.video_url || ''} onChange={e => field('video_url', e.target.value)} /></label><p>Use a video you have permission to share. It opens on the hosting website.</p><label>Lesson order<input type="number" min="0" step="1" required value={draft.position} onChange={e => field('position', e.target.value)} /></label></>}
      <div className="learning-actions"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><button type="button" onClick={back} disabled={busy}>Cancel</button></div>
    </form> : loading ? <p role="status">Loading your learning workspace…</p> : error ? null : lesson ? <article className="learning-reading">
      {admin && <button onClick={() => edit('lesson', lesson)}>Edit lesson</button>}
      {lesson.video_url?.startsWith('https://') && <a className="learning-video" href={lesson.video_url} target="_blank" rel="noopener noreferrer">Watch lesson video ↗</a>}
      <div className="learning-text">{lesson.content || 'No written lesson content has been added yet.'}</div>
      {resources.length > 0 && <section><h2>Resources</h2>{resources.filter(item => item.resource_url.startsWith('https://')).map(item => <p key={item.id}><a href={item.resource_url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></p>)}</section>}
      {course.status === 'published' ? <button className="primary" disabled={busy} onClick={toggleComplete}>{busy ? 'Saving…' : completed.includes(lesson.id) ? 'Completed · mark incomplete' : 'Mark lesson complete'}</button> : <p>Publish the course before recording learner progress.</p>}
    </article> : course ? <section>
      <p className="learning-text">{course.description}</p><div className="learning-actions">{admin && <><button onClick={() => edit('course', course)}>Edit course</button><button className="primary" onClick={() => edit('lesson', { ...blankLesson, position: lessons.length ? Math.max(...lessons.map(item => item.position)) + 1 : 0 })}>Add lesson</button><span className="learning-status">{course.status}</span></>}</div>
      <h2>Course lessons</h2><p>{doneCount} of {lessons.length} completed</p><progress aria-label="Course progress" max={Math.max(lessons.length, 1)} value={doneCount} />
      {lessons.length ? <ol className="learning-lessons">{lessons.map((item, index) => <li key={item.id}><button onClick={() => { setLesson(item); setNotice('') }}><span>{index + 1}. {item.title}</span><span>{completed.includes(item.id) ? 'Completed' : 'Open lesson →'}</span></button></li>)}</ol> : <div className="learning-empty"><h3>Lessons are on their way</h3><p>{admin ? 'Add the first lesson above to start building this course.' : 'Your team has not added lessons to this course yet.'}</p></div>}
    </section> : <section><label className="learning-search">Find a course<input type="search" placeholder="Search by title or category" value={search} onChange={e => setSearch(e.target.value)} /></label><h2>Course library</h2>{visible.length ? <div className="learning-courses">{visible.map(item => <button className="learning-course" key={item.id} onClick={() => { setCourse(item); setNotice('') }}><span className="learning-category">{item.category}{admin && ` · ${item.status}`}</span><h3>{item.title}</h3><p>{item.description || 'Explore this course and its lessons.'}</p><strong>View course →</strong></button>)}</div> : <div className="learning-empty"><h3>{search ? 'No matching courses' : 'Your learning journey starts here'}</h3><p>{search ? 'Try a different title or category.' : admin ? 'Create your first course, add lessons, then publish it for your members.' : 'Published courses will appear here when your team makes them available.'}</p></div>}</section>}
  </main>
}
