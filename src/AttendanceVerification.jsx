import React, { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './attendance-verification.css'

const stage = status => status === 'pending' ? ['yellow','Awaiting leader approval'] : ['present','late'].includes(status) ? ['green','Verified'] : ['red','Not checked in']

export default function AttendanceVerification({ user, officeId, team = false, onChange }) {
  const [own, setOwn] = useState(null)
  const [rows, setRows] = useState([])
  const [offices, setOffices] = useState([])
  const [office, setOffice] = useState(officeId || user.ledOfficeId || '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingOnly, setPendingOnly] = useState(true)
  const [revision, setRevision] = useState(0)
  const canApprove = user.role === 'Administrator' || user.leaderAccessLevel === 'full'
  useEffect(() => { setOffice(officeId || user.ledOfficeId || '') }, [officeId,user.ledOfficeId])
  useEffect(() => {
    if (!team || user.role !== 'Administrator' || !supabase) return
    let live = true
    supabase.from('offices').select('id,name').eq('active',true).order('name').then(({data,error}) => {
      if (!live) return
      if (error) setMessage(error.message)
      else setOffices(data || [])
    })
    return () => { live = false }
  }, [team,user.role])
  useEffect(() => {
    let live = true
    const load = async () => {
      if (!supabase || (team && (!office || !canApprove))) { setLoading(false); return }
      try {
        const result = team ? await supabase.rpc('office_attendance_today',{target_office_id:office}) : await supabase.rpc('my_attendance_today')
        if (!live) return
        if (result.error) { setMessage(`Attendance could not load: ${result.error.message}. Check that the verification SQL has been installed.`); return }
        if (team) setRows(result.data || [])
        else setOwn(result.data?.[0] || null)
      } catch { if (live) setMessage('Connection interrupted. Refresh attendance to try again.') }
      finally { if (live) setLoading(false) }
    }
    setLoading(true); load()
    const timer = window.setInterval(load,30000)
    return () => { live = false; window.clearInterval(timer) }
  }, [team,office,canApprove,revision,user.id])
  const act = async (name,args) => {
    if (busy) return
    setBusy(true); setMessage('')
    try {
      const {error} = await supabase.rpc(name,args)
      if (error) setMessage(error.message)
      else { setMessage(name === 'verify_attendance' ? 'Check-in verified.' : 'Signed out successfully.'); setCode(''); setRevision(x=>x+1); onChange?.() }
    } catch { setMessage('Connection interrupted. Refresh to check whether the action completed before retrying.') }
    finally { setBusy(false) }
  }
  const [tone,label] = stage(own?.status)
  const visible = pendingOnly ? rows.filter(row=>row.status === 'pending') : rows
  return <section className="attendance-verification" aria-label={team ? 'Daily attendance verification' : 'Today’s attendance'}>
    <div className="verification-heading"><h2>{team ? 'Daily attendance verification' : 'Today’s attendance'}</h2><button type="button" className="detail-secondary" disabled={busy || loading} onClick={()=>setRevision(x=>x+1)}>Refresh</button></div>
    <p>Red: not checked in. Yellow: awaiting approval. Green: verified by a leader. Office day follows Nigeria time.</p>
    {team ? <>
      {user.role === 'Administrator' && <label>Office<select value={office} onChange={event=>{setOffice(event.target.value);setRows([])}}><option value="">Choose an office</option>{offices.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {!canApprove ? <p>Full team-leader access is required to approve attendance.</p> : office && <>
        <div className="segment-control"><button className={pendingOnly ? 'active' : ''} onClick={()=>setPendingOnly(true)}>Awaiting approval ({rows.filter(row=>row.status==='pending').length})</button><button className={!pendingOnly ? 'active' : ''} onClick={()=>setPendingOnly(false)}>All members ({rows.length})</button></div>
        {loading ? <p role="status">Loading attendance…</p> : visible.length ? <ul>{visible.map(row=>{const [color,text]=stage(row.status);return <li key={row.member_id}><div><strong>{row.full_name}</strong><span className={`attendance-stage ${color}`}>{text}{row.signed_out_at ? ' · Signed out' : ''}</span></div>{row.status==='pending' && row.member_id!==user.id && <button className="row-action" disabled={busy} onClick={()=>{if(window.confirm(`Confirm ${row.full_name} is physically present in the office?`))act('verify_attendance',{attendance_id:row.attendance_id})}}>Verify presence</button>}{row.status==='pending' && row.member_id===user.id && <small>Another authorized leader must verify you.</small>}</li>})}</ul> : <p>No {pendingOnly ? 'unapproved check-ins' : 'active members'} for today.</p>}
      </>}
    </> : loading ? <p role="status">Loading attendance…</p> : <>
      <span className={`attendance-stage ${tone}`}>{label}{own?.signed_out_at ? ' · Signed out' : ''}</span>
      {own?.code && <p>Your daily sign-out code: <strong className="checkout-code">{own.code}</strong>. It expires at midnight Nigeria time and works once, after approval.</p>}
      {own?.status==='pending' && <p>Your check-in is recorded but does not count as verified attendance yet.</p>}
      {tone==='green' && !own?.signed_out_at && own?.code && <form onSubmit={event=>{event.preventDefault();act('sign_out_attendance',{attendance_id:own.id,daily_code:code})}}><label>Daily sign-out code<input required autoComplete="off" maxLength={8} value={code} onChange={event=>setCode(event.target.value.toUpperCase())}/></label><button className="primary" disabled={busy || code.trim().length!==8}>{busy ? 'Signing out…' : 'Sign out of office'}</button></form>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>
}
