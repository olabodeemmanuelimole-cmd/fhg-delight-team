import React, { useEffect, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft'
import { ArrowRight } from '@phosphor-icons/react/ArrowRight'
import { Bell } from '@phosphor-icons/react/Bell'
import { BookOpen } from '@phosphor-icons/react/BookOpen'
import { Briefcase } from '@phosphor-icons/react/Briefcase'
import { CalendarCheck } from '@phosphor-icons/react/CalendarCheck'
import { CaretDown } from '@phosphor-icons/react/CaretDown'
import { Check } from '@phosphor-icons/react/Check'
import { CheckCircle } from '@phosphor-icons/react/CheckCircle'
import { DotsThree } from '@phosphor-icons/react/DotsThree'
import { House } from '@phosphor-icons/react/House'
import { ListChecks } from '@phosphor-icons/react/ListChecks'
import { Plus } from '@phosphor-icons/react/Plus'
import { Receipt } from '@phosphor-icons/react/Receipt'
import { Sparkle } from '@phosphor-icons/react/Sparkle'
import { Target } from '@phosphor-icons/react/Target'
import { TrendUp } from '@phosphor-icons/react/TrendUp'
import { Users } from '@phosphor-icons/react/Users'
import { Wallet } from '@phosphor-icons/react/Wallet'
import { isSupabaseConfigured, supabase } from './supabase'

const nav = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'activity', label: 'Activity', icon: ListChecks },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'finances', label: 'Finance', icon: Wallet },
  { id: 'more', label: 'More', icon: DotsThree },
]

const activities = [
  { icon: Briefcase, title: 'Brand identity package', meta: 'Upwork · Completed', value: '+₦148,000', tone: 'green' },
  { icon: CalendarCheck, title: 'Friday attendance', meta: 'Checked in at 8:42 AM', value: '+20 pts', tone: 'blue' },
  { icon: Receipt, title: 'Workspace subscription', meta: 'Personal book · Debit', value: '-₦12,500', tone: 'red' },
]

const modules = [
  { id: 'orders', icon: Briefcase, label: 'Orders', sub: '5 active', color: 'navy' },
  { id: 'plans', icon: Target, label: 'Weekly plan', sub: '72% complete', color: 'green' },
  { id: 'attendance', icon: CalendarCheck, label: 'Attendance', sub: 'Present today', color: 'blue' },
  { id: 'books', icon: BookOpen, label: 'Finance', sub: 'Income and expenses', color: 'amber' },
]

function Logo() {
  return <div className="brand"><span className="brand-mark"><TrendUp weight="bold" /></span><span>TeamFlow</span></div>
}

const demoUsers = {
  member: { name: 'Amara Okafor', initials: 'AO', role: 'Member', rank: 'Newbie', office: 'Ikeja Central' },
  leader: { name: 'Kelechi Adebayo', initials: 'KA', role: 'Team leader', rank: 'Senior Manager', office: 'Ikeja Central' },
  admin: { name: 'Olabode Emmanuel Imole', initials: 'OE', role: 'Administrator', rank: 'Qualified Sapphire Director', office: 'Delight Team Office' },
}

function AuthPage({ onAuthenticate }) {
  const registrationInvite = new URLSearchParams(window.location.search).get('register') === '1'
  const [mode, setMode] = useState(registrationInvite ? 'register' : 'signin')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async event => {
    event.preventDefault()
    setBusy(true); setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const fullName = String(form.get('fullName') || 'TeamFlow Member')
    if (!isSupabaseConfigured) { setBusy(false); setMessage('Supabase is not configured yet.'); return }
    const result = mode === 'register'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.href } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) { setMessage(result.error.message); setBusy(false); return }
    if (mode === 'register' && !result.data.session) {
      setMessage('Account created. Check your email to confirm your address, then sign in.')
      setMode('signin'); setBusy(false); return
    }
    await onAuthenticate(result.data.user, mode === 'register')
    setBusy(false)
  }
  return <main className="auth-shell"><aside className="auth-story"><Logo /><div><span className="eyebrow">Team progress, clearly recorded</span><h1>One workspace.<br />Every level aligned.</h1><p>Track work, finances, attendance and team growth with access designed around your organization.</p></div><small>Secure role-based workspace · Mobile-first</small></aside><section className="auth-panel"><div className="auth-card"><div className="auth-mobile-brand"><Logo /></div><span className="eyebrow">Welcome to TeamFlow</span><h2>{mode === 'signin' ? 'Sign in to your workspace' : 'Create your member account'}</h2><p>{mode === 'signin' ? 'Enter your account details to continue.' : 'Your team leader will review the account after registration.'}</p><div className="auth-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setMessage('') }}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage('') }}>Register</button></div><form onSubmit={submit}>{mode === 'register' && <label>Full name<input name="fullName" required placeholder="Your full name" /></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" minLength="8" required placeholder="At least 8 characters" /></label>{message && <div className="auth-message" role="status">{message}</div>}<button className="primary auth-submit" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}{!busy && <ArrowRight />}</button></form><div className="auth-note"><CheckCircle /><span><strong>Protected account access</strong><small>Your session is securely managed by Supabase and restored automatically on this device.</small></span></div></div></section></main>
}

function Onboarding({ onFinish, account }) {
  const params = new URLSearchParams(window.location.search)
  const invitedOfficeId = params.get('office') || ''
  const leaderInviteToken = params.get('leaderInvite') || ''
  const draftKey = `teamflow-onboarding-${account?.id || 'guest'}`
  const savedDraft = (() => { try { return JSON.parse(localStorage.getItem(draftKey) || '{}') } catch { return {} } })()
  const initialStep = Math.min(4, Math.max(0, Number(params.get('step') ?? savedDraft.step ?? 0)))
  const forceMobile = params.get('capture') === 'mobile'
  const [step, setStep] = useState(initialStep)
  const [fullName, setFullName] = useState(savedDraft.fullName || account?.name || '')
  const [phone, setPhone] = useState(savedDraft.phone || '')
  const [bio, setBio] = useState(savedDraft.bio || '')
  const [rank, setRank] = useState(savedDraft.rank || 'Newbie')
  const [ranks, setRanks] = useState(['Newbie', 'E-member', 'Distributor', 'Manager', 'Senior Manager'])
  const [office, setOffice] = useState(savedDraft.office || '')
  const [officeId, setOfficeId] = useState(invitedOfficeId || savedDraft.officeId || '')
  const [offices, setOffices] = useState([])
  const [organization, setOrganization] = useState({ name: 'FHG Delight Team', director_name: 'Olabode Emmanuel Imole', director_title: 'Sapphire Director', welcome_message: 'Welcome to the team. We are delighted to have you join a community built on consistency, honest growth and people supporting one another.' })
  const [sponsorId, setSponsorId] = useState(savedDraft.sponsorId || '')
  const [sponsors, setSponsors] = useState([])
  const [sponsorsLoading, setSponsorsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ step, fullName, phone, bio, rank, office, officeId, sponsorId }))
  }, [draftKey, step, fullName, phone, bio, rank, office, officeId, sponsorId])
  useEffect(() => {
    if (!supabase) return
    supabase.from('offices').select('id,name,location,leader_display_name').eq('active', true).order('name').then(({ data }) => {
      const available = data || []
      setOffices(available)
      const preferred = available.find(item => item.id === invitedOfficeId) || available.find(item => item.id === officeId) || available.find(item => item.name === office) || available[0]
      if (preferred) { setOffice(preferred.name); setOfficeId(preferred.id) }
    })
    supabase.from('ranks').select('name').eq('active', true).order('sort_order').then(({ data }) => {
      if (data?.length) setRanks(data.map(item => item.name))
    })
    supabase.from('organizations').select('name,director_name,director_title,welcome_message').eq('active', true).limit(1).maybeSingle().then(({ data }) => {
      if (data) setOrganization(data)
    })
  }, [])
  useEffect(() => {
    setSponsorId('')
    setSponsors([])
    if (!supabase || !officeId) return
    setSponsorsLoading(true)
    supabase.rpc('sponsors_for_office', { selected_office_id: officeId }).then(({ data }) => {
      const eligible = data || []
      setSponsors(eligible)
      if (savedDraft.officeId === officeId && eligible.some(person => person.id === savedDraft.sponsorId)) setSponsorId(savedDraft.sponsorId)
      setSponsorsLoading(false)
    })
  }, [officeId])
  const finish = async () => {
    if (!officeId) { setSaveError('Please choose an available office.'); return }
    setSaving(true); setSaveError('')
    const { error } = await supabase.rpc('complete_registration', { selected_office_id: officeId, selected_sponsor_id: sponsorId || null, selected_rank: rank, member_phone: phone || null, member_bio: bio || null })
    if (error) {
      setSaving(false)
      // Refresh the account before keeping the user on onboarding. An overall
      // administrator may already have been activated directly in Supabase and
      // must not be blocked just because they do not have an office membership.
      await onFinish()
      setSaveError(error.message)
      return
    }
    if (leaderInviteToken) {
      const { error: inviteError } = await supabase.rpc('claim_team_leader_invitation', { invitation_token:leaderInviteToken })
      if (inviteError) { setSaving(false); setSaveError(`Your profile was saved, but the leader invitation could not be claimed: ${inviteError.message}`); return }
    }
    setSaving(false)
    localStorage.removeItem(draftKey)
    onFinish()
  }
  const steps = [
    <section className="welcome" key="welcome">
      <div className="welcome-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><TrendUp weight="duotone" /></div>
      <span className="eyebrow">One place for your progress</span>
      <h1>Build better habits.<br />Grow with your team.</h1>
      <p>Track your work, finances, goals, attendance and team activity from one focused workspace.</p>
    </section>,
    <section key="profile">
      <div className="step-heading"><span>Profile setup</span><h2>Tell us about yourself</h2><p>This information helps your team leader identify and support you.</p></div>
      <label>Full name<input value={fullName} onChange={event => setFullName(event.target.value)} /></label>
      <label>Phone number<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="Your phone number" /></label>
      <label>Short bio<textarea value={bio} onChange={event => setBio(event.target.value)} placeholder="Tell your team a little about yourself." /></label>
      <label>Current rank<select value={rank} onChange={e => setRank(e.target.value)}>{ranks.map(name => <option key={name}>{name}</option>)}</select></label>
    </section>,
    <section key="office">
      <div className="step-heading"><span>Your office</span><h2>Choose where you belong</h2><p>Your office determines the team leader who reviews and supports your activity.</p></div>
      {invitedOfficeId && offices.some(item => item.id === invitedOfficeId) && <div className="interaction-message" role="status">Your team leader’s office has been selected from the invitation. You can change it if needed.</div>}
      {(offices.length ? offices : [{id:'',name:'Loading offices…',location:'Please wait'}]).map(item => <button type="button" className={`select-card ${office === item.name ? 'selected' : ''}`} onClick={() => { setOffice(item.name); setOfficeId(item.id) }} key={item.name} disabled={!item.id}><span className="office-symbol">{item.name.split(' ').map(word => word[0]).slice(0,2).join('')}</span><span><strong>{item.name}</strong><small>{item.location}{item.leader_display_name ? ` · ${item.leader_display_name}` : ''}</small></span>{office === item.name && item.id && <CheckCircle weight="fill" />}</button>)}
      <label>Sponsor<select value={sponsorId} onChange={event => setSponsorId(event.target.value)} disabled={!officeId || sponsorsLoading}><option value="">{sponsorsLoading ? 'Loading office members…' : sponsors.length ? 'Select a sponsor or continue without one' : 'No registered sponsors in this office yet'}</option>{sponsors.map(person => <option value={person.id} key={person.id}>{person.full_name} · {person.rank}{person.role === 'team_leader' ? ' · Team Leader' : ''}</option>)}</select><small className="field-help">Only eligible registered members in your selected office appear here.</small></label>
    </section>,
    <section key="letter" className="letter">
      <div className="leader-avatar">{(offices.find(item => item.id === officeId)?.leader_display_name || 'TL').replace(/^Mr\s+/i, '').split(' ').map(word => word[0]).slice(0,2).join('').toUpperCase()}</div><span className="eyebrow">A welcome from your leaders</span><h2>Welcome to {organization.name}</h2>
      <blockquote>“{organization.welcome_message}”</blockquote>
      <div className="signature-grid"><div><strong>{offices.find(item => item.id === officeId)?.leader_display_name || 'Team Leader'}</strong><small>Team Leader, {office}</small></div><div><strong>{organization.director_name}</strong><small>{organization.director_title}, {organization.name}</small></div></div>
    </section>,
    <section key="pending" className="pending">
      <div className="success-mark"><Check weight="bold" /></div><span className={`status-chip ${account?.status === 'active' ? 'active-status' : 'warning'}`}>{account?.status === 'active' ? 'Account active' : 'Pending approval'}</span><h2>Your profile is ready</h2>
      <p>{account?.status === 'active' ? 'Your administrator account is active. Complete this step to open the organization workspace.' : leaderInviteToken ? 'Your profile and team-leader access request will be sent to the overall administrator for approval.' : 'Your team leader will review your registration. You can explore your portal while approval is pending.'}</p>
      <div className="summary-row"><span>Office</span><strong>{office}</strong></div><div className="summary-row"><span>Rank</span><strong>{rank}</strong></div>
    </section>,
  ]
  return <main className={`onboarding-shell ${forceMobile ? 'force-mobile-onboarding' : ''}`}><header><Logo />{step > 0 && step < 4 && <span className="step-count">{step} of 3</span>}</header><div className="onboarding-body">{steps[step]}{saveError && <div className="auth-message" role="status">{saveError}</div>}</div><footer className="onboarding-footer">{step > 0 && step < 4 && <button className="back" onClick={() => setStep(step - 1)}><ArrowLeft /> Back</button>}<button className="primary" disabled={saving} onClick={() => step === 4 ? finish() : setStep(step + 1)}>{saving ? 'Saving…' : step === 0 ? 'Get started' : step === 4 ? 'Open my portal' : 'Continue'} {!saving && <ArrowRight />}</button></footer></main>
}

function Topbar({ user, onNavigate }) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long' })
  return <header className="topbar"><div><span className="today">{today}</span><h1>{greeting}, {user.name.split(' ')[0]}</h1></div><button className="icon-button" aria-label="Open notifications" onClick={() => onNavigate?.(user.role === 'Administrator' ? 'adminnotifications' : 'notifications')}><Bell /><span className="notification-dot" /></button></header>
}

function HomePage({ onNavigate, user }) {
  const [period, setPeriod] = useState('This month')
  const [summary, setSummary] = useState({orders:0,activeOrders:0,grossOrders:0,completedEarnings:0,planProgress:0,attendance:'Not checked in',transactions:0})
  const [recent, setRecent] = useState([])
  useEffect(() => {
    let cancelled = false
    const loadSummary = async () => {
      const monthStart = new Date()
      if (period === 'Last month') monthStart.setMonth(monthStart.getMonth() - 1)
      monthStart.setDate(1)
      monthStart.setHours(0,0,0,0)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      const [ordersResult, plansResult, attendanceResult, booksResult] = await Promise.all([
        supabase.from('orders').select('project_name,amount,platform,fee_percent,status,created_at,completed_at').eq('user_id',user.id).order('created_at',{ascending:false}),
        supabase.from('weekly_plans').select('completion_percent,primary_goal,updated_at').eq('user_id',user.id).order('week_start',{ascending:false}).limit(1),
        supabase.from('attendance').select('status,checked_in_at,attendance_date').eq('user_id',user.id).order('attendance_date',{ascending:false}).limit(1),
        supabase.from('cash_books').select('cash_transactions(entry_type,amount,description,created_at)').eq('owner_id',user.id).limit(10),
      ])
      const allOrderRows = ordersResult.data || []
      const orderRows = allOrderRows.filter(item => new Date(item.created_at) >= monthStart && new Date(item.created_at) < monthEnd)
      const transactions = (booksResult.data || []).flatMap(book => book.cash_transactions || [])
      const grossOrders = orderRows.reduce((sum,item) => sum + Number(item.amount),0)
      const completedEarnings = allOrderRows.filter(item => item.status === 'completed' && new Date(item.completed_at || item.updated_at || item.created_at) >= monthStart && new Date(item.completed_at || item.updated_at || item.created_at) < monthEnd).reduce((sum,item) => sum + Number(item.amount)*(1-Number(item.fee_percent || 0)/100),0)
      const activeOrders = orderRows.filter(item => item.status === 'active').length
      const latestAttendance = attendanceResult.data?.[0]
      const money = amount => `₦${Number(amount || 0).toLocaleString('en-NG',{maximumFractionDigits:2})}`
      const orderMoney = amount => `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}`
      const orderActivity = orderRows.slice(0,2).map(item => ({icon:Briefcase,title:item.project_name,meta:`${item.platform} · ${item.status}`,value:orderMoney(item.amount),tone:'green',date:item.created_at}))
      const transactionActivity = transactions.slice(0,2).map(item => ({icon:Receipt,title:item.description,meta:`Finance · ${item.entry_type}`,value:`${item.entry_type === 'credit' ? '+' : '-'}${money(item.amount)}`,tone:item.entry_type === 'credit' ? 'green' : 'red',date:item.created_at}))
      if (!cancelled) {
        setSummary({orders:orderRows.length,activeOrders,grossOrders,completedEarnings,planProgress:plansResult.data?.[0]?.completion_percent || 0,attendance:latestAttendance?.status || 'Not checked in',transactions:transactions.length})
        setRecent([...orderActivity,...transactionActivity].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3))
      }
    }
    loadSummary()
    return () => { cancelled = true }
  }, [user.id, period])
  const money = amount => `₦${Number(amount || 0).toLocaleString('en-NG',{maximumFractionDigits:2})}`
  const dollars = amount => `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}`
  const liveModules = [
    {...modules[0],sub:`${summary.activeOrders} active`},
    {...modules[1],sub:`${summary.planProgress}% complete`},
    {...modules[2],sub:summary.attendance.replace(/^./,letter=>letter.toUpperCase())},
    {...modules[3],sub:`${summary.transactions} entries`},
  ]
  return <><Topbar user={user} onNavigate={onNavigate} /><main className="page-content">
    <div className="profile-strip"><div className="avatar">{user.initials}</div><div><strong>{user.name}</strong><span>{user.rank} · {user.office}</span></div><span className="status-chip warning">{user.role === 'Member' ? 'Pending' : user.role}</span></div>
    <section className="balance-card"><div className="balance-head"><span>Completed earnings</span><button onClick={() => setPeriod(period === 'This month' ? 'Last month' : 'This month')}>{period} <CaretDown /></button></div><strong className="balance">{dollars(summary.completedEarnings)}</strong><div className="balance-stats"><div><span>Gross orders</span><strong>{dollars(summary.grossOrders)}</strong></div><div><span>Active orders</span><strong>{summary.activeOrders}</strong></div></div><div className="balance-glow" /></section>
    <section className="week-card"><div className="section-title"><div><span>This week</span><h2>Keep the momentum</h2></div><strong>{summary.planProgress}%</strong></div><div className="progress"><span style={{width:`${summary.planProgress}%`}} /></div><div className="week-metrics"><div><Target /><span><strong>{summary.planProgress}%</strong> plan complete</span></div><div><CalendarCheck /><span><strong>{summary.attendance}</strong> today</span></div></div></section>
    <section><div className="section-title"><h2>Quick access</h2><button onClick={() => onNavigate('activity')}>View all</button></div><div className="module-grid">{liveModules.map(({id,icon: Icon, label, sub, color}) => <button className="module" key={label} onClick={() => onNavigate(id)}><span className={`module-icon ${color}`}><Icon weight="duotone" /></span><strong>{label}</strong><small>{sub}</small></button>)}</div></section>
    <section><div className="section-title"><h2>Recent activity</h2><button onClick={() => onNavigate('activity')}>See all</button></div>{recent.length ? <div className="activity-list">{recent.map(({icon: Icon,title,meta,value,tone},index) => <article key={`${title}-${index}`}><span className={`activity-icon ${tone}`}><Icon /></span><div><strong>{title}</strong><small>{meta}</small></div><b className={tone}>{value}</b></article>)}</div> : <div className="live-empty">Your recent orders and finance entries will appear here.</div>}</section>
  </main></>
}

const screenData = {
  activity: {
    title: 'My activity', subtitle: 'Your latest work across the portal', action: 'Add order', icon: TrendUp,
    heroLabel: 'Personal activity overview', listTitle: 'Latest updates',
    metrics: [['Records','0'],['This month','0']], tabs: ['All activity'], rows: [],
    note: ['One personal timeline','Orders, attendance, plans and Finance entries appear here in the order they happened.']
  },
  orders: {
    title: 'Orders', subtitle: 'Track freelance work and earnings', action: 'Add order', icon: Briefcase,
    metrics: [['Gross this month','₦376,400'],['Net after fees','₦301,120']],
    tabs: ['All 8','Active 5','Completed 3'],
    rows: [
      ['Brand identity package','Upwork · Due 4 Sep','₦185,000','Active'],
      ['Landing page redesign','Fiverr · Due 7 Sep','₦96,400','Active'],
      ['Social campaign assets','Direct client · 29 Aug','₦95,000','Completed'],
    ]
  },
  plans: {
    title: 'Weekly plan', subtitle: '1-7 September · Week 36', action: 'Edit plan', icon: Target,
    metrics: [['Goals completed','5 of 7'],['Leader score','Pending']],
    tabs: ['Current week','Previous'],
    rows: [
      ['Deliver two client projects','Completed','100%','Done'],
      ['Contact five new prospects','3 of 5 reached','60%','In progress'],
      ['Attend all office sessions','4 of 5 days','80%','In progress'],
    ]
  },
  books: {
    title: 'Finance', subtitle: 'Income, expenses and transaction history', action: 'Add entry', icon: BookOpen,
    metrics: [['Approved balance','₦284,650'],['Pending review','₦36,000']],
    tabs: ['Personal book','Office earnings'],
    rows: [
      ['Brand identity payment','Today · Credit','+₦148,000','Approved'],
      ['Workspace subscription','Yesterday · Debit','-₦12,500','Approved'],
      ['Landing page deposit','30 Aug · Credit','+₦36,000','Pending'],
    ]
  },
  bookdetail: {
    title: 'Finance book', subtitle: 'Balance and transaction history', action: 'Add entry', icon: BookOpen,
    heroLabel: 'Book balance', listTitle: 'Transactions', metrics: [['Balance','—'],['Entries','0']], tabs: ['All entries'], rows: [],
    note: ['Complete transaction history','Credits increase the balance and debits reduce it. Every edited entry keeps its previous values.']
  },
  withdrawals: {
    title: 'Withdrawals', subtitle: 'Recorded Finance withdrawals', action: 'Record withdrawal', icon: Wallet,
    heroLabel: 'Withdrawal history', listTitle: 'Recent withdrawals',
    metrics: [['Naira withdrawn','₦0'],['Dollar withdrawn','$0']],
    tabs: ['All withdrawals'], rows: [],
    note: ['Withdrawals reduce the selected balance','Every withdrawal creates a linked debit entry, so the Finance balance and withdrawal history always agree.']
  },
  attendance: {
    title: 'Attendance', subtitle: 'September record · Ikeja Central', action: 'Check in', icon: CalendarCheck,
    metrics: [['Attendance rate','92%'],['Current streak','8 days']],
    tabs: ['This week','This month'],
    rows: [
      ['Monday, 1 September','Checked in · 8:42 AM','Present','Present'],
      ['Friday, 29 August','Checked in · 9:11 AM','Late','Late'],
      ['Thursday, 28 August','Checked in · 8:36 AM','Present','Present'],
    ]
  },
  team: {
    title: 'My team', subtitle: 'Your sponsorship network', action: 'Invite member', icon: Users,
    heroLabel: 'Team overview', listTitle: 'Direct downline',
    metrics: [['Direct members','3'],['Team activity','86%']],
    tabs: ['Direct 3','All network 12'],
    rows: [
      ['Tobi Adeyemi','Distributor · Ikeja Central','84%','Active'],
      ['Zainab Musa','Newbie · Lekki Growth Hub','71%','Active'],
      ['David Eze','E-member · Ikeja Central','48%','Needs support'],
    ],
    note: ['Sponsor visibility','You can view team activity, income summaries and weekly plans, but not private finance entries.']
  },
  announcements: {
    title: 'Announcements', subtitle: 'Updates from your office and admin', action: 'New announcement', icon: Bell,
    heroLabel: 'Inbox summary', listTitle: 'Latest updates',
    metrics: [['Unread','2'],['This month','8']],
    tabs: ['All updates','Unread 2'],
    rows: [
      ['September office target','Admin · Today, 8:00 AM','New','Everyone'],
      ['Friday review starts at 4 PM','Kelechi · Yesterday','New','Ikeja team'],
      ['Leadership workshop','Admin · 29 Aug','Read','Team leaders'],
    ]
  },
  feedback: {
    title: 'Feedback & ideas', subtitle: 'Speak directly to your leaders', action: 'Write message', icon: Sparkle,
    heroLabel: 'Your messages', listTitle: 'Message history',
    metrics: [['Open','2'],['Resolved','5']],
    tabs: ['Feedback','Suggestions'],
    rows: [
      ['Weekly review timing','To Kelechi · Today','Open','Feedback'],
      ['Add client reminder alerts','To Admin · 28 Aug','Received','Suggestion'],
      ['More weekend training','To Kelechi · 21 Aug','Resolved','Suggestion'],
    ],
    note: ['Choose the right recipient','Messages sent to Admin remain visible to Admin even when they concern your office.']
  },
  events: {
    title: 'Events', subtitle: 'Sessions and milestones for your team', action: 'Add event', icon: CalendarCheck,
    heroLabel: 'September events', listTitle: 'Upcoming schedule',
    metrics: [['Upcoming','4'],['Completed','7']],
    tabs: ['Upcoming 4','Completed 7'],
    rows: [
      ['Growth strategy session','3 Sep · 10:00 AM','2 days','Office'],
      ['Client outreach sprint','6 Sep · 9:00 AM','5 days','Team'],
      ['Leadership workshop','12 Sep · 11:00 AM','11 days','Leaders'],
    ],
    note: ['Mark events as done','Your completion is personal and does not change the event for other members.']
  },
  rewards: {
    title: 'Points & rewards', subtitle: 'Consistency earns recognition', action: 'View reward rules', icon: Sparkle,
    heroLabel: 'Available points', listTitle: 'Recent points',
    metrics: [['Points balance','2,460'],['Naira value','₦2,460']],
    tabs: ['Activity','Rewards'],
    rows: [
      ['Weekly plan submitted','Sunday · Week 36','+100','Earned'],
      ['Office attendance','Today · 8:42 AM','+20','Earned'],
      ['Order completed','Brand identity package','+250','Earned'],
    ],
    note: ['Points are not automatic cash','The displayed value uses the current rate. Admin decides which rewards are redeemable and when.']
  },
  notifications: {
    title: 'Notifications', subtitle: 'Reviews, reminders and team updates', action: 'Mark all as read', icon: Bell,
    heroLabel: 'Notification center', listTitle: 'Today',
    metrics: [['Unread','4'],['This week','12']],
    tabs: ['All','Unread 4'],
    rows: [
      ['Your weekly plan was reviewed','Kelechi scored it 82%','2 min','Unread'],
      ['Office event tomorrow','Growth strategy session · 10 AM','1 hr','Unread'],
      ['Transaction approved','₦148,000 added to your balance','3 hr','Read'],
    ]
  },
  profile: {
    title: 'My profile', subtitle: 'Personal and organization details', action: 'Edit profile', icon: Users,
    heroLabel: 'Amara Okafor · Newbie', listTitle: 'Organization',
    metrics: [['Member since','May 2026'],['Profile status','Pending']],
    tabs: ['Overview','Activity'],
    rows: [
      ['Ikeja Central','Current office','Active','Office'],
      ['Chidi Nwosu','Your sponsor','Senior Manager','Sponsor'],
      ['Kelechi Adebayo','Team leader','Ikeja Central','Leader'],
    ],
    note: ['Moving to another office?','Submit a transfer request. Your new team leader must approve it before the change takes effect.']
  },
  settings: {
    title: 'Settings', subtitle: 'Account, privacy and preferences', action: 'Save changes', icon: DotsThree,
    heroLabel: 'Account preferences', listTitle: 'Settings',
    metrics: [['Profile visibility','Team only'],['Security','Protected']],
    tabs: ['Account','Preferences'],
    rows: [
      ['Personal information','Name, phone number and bio','Edit','Account'],
      ['Notifications','Push and email preferences','On','Preferences'],
      ['Privacy & visibility','Who can view your activity','Team','Privacy'],
    ],
    note: ['Your records stay protected','Sponsors see approved activity summaries. Personal finance details remain private from other members.']
  },
  history: {
    title: 'Edit history', subtitle: 'Brand identity payment', action: 'Edit transaction', icon: Receipt,
    heroLabel: 'Current transaction', listTitle: 'Change timeline',
    metrics: [['Current value','₦148,000'],['Changes','2']],
    tabs: ['History','Details'],
    rows: [
      ['Amount updated','₦145,000 → ₦148,000','Today','Amara'],
      ['Description updated','Final deposit → Brand identity payment','31 Aug','Amara'],
      ['Transaction created','Original record','30 Aug','Created'],
    ],
    note: ['History cannot be erased','Every edit keeps the previous value, new value, editor and timestamp for accountability.']
  },
  eventdetail: {
    title: 'Event details', subtitle: 'Growth strategy session', action: 'Mark as done', icon: CalendarCheck,
    heroLabel: 'Wednesday, 3 September', listTitle: 'Event information',
    metrics: [['Start time','10:00 AM'],['Location','Training room']],
    tabs: ['Overview','Attendees 24'],
    rows: [
      ['Ikeja Central Office','Event location','Office','Location'],
      ['Kelechi Adebayo','Created by team leader','Host','Leader'],
      ['Strategy workbook','Bring your weekly plan','Required','Preparation'],
    ],
    note: ['Completion is personal','Marking this event as done updates only your own activity and points record.']
  },
  leaderdashboard: {
    title: 'Leader dashboard', subtitle: 'Ikeja Central · Team overview', action: 'New announcement', icon: TrendUp,
    heroLabel: 'Office performance', listTitle: 'Needs your attention',
    metrics: [['Active members','48'],['Weekly completion','78%']],
    tabs: ['Overview','Approvals 5'],
    rows: [
      ['Weekly plans awaiting review','Friday scoring queue','12','Plans'],
      ['Office transfer requests','New members requesting approval','3','Approvals'],
      ['Attendance excuses','Absences awaiting review','5','Attendance'],
    ],
    note: ['Leader visibility','You can review records for members assigned to Ikeja Central. Other leaders’ personal records remain private.']
  },
  members: {
    title: 'Office members', subtitle: 'Ikeja Central · 48 members', action: 'Invite member', icon: Users,
    heroLabel: 'Member directory', listTitle: 'Recently active',
    metrics: [['Active today','36'],['Pending approval','4']],
    tabs: ['All 48','Pending 4'],
    rows: [
      ['Amara Okafor','Newbie · Sponsor: Chidi Nwosu','92%','Active'],
      ['Tobi Adeyemi','Distributor · 3 direct members','86%','Active'],
      ['David Eze','E-member · No downline','48%','Needs support'],
    ]
  },
  memberprofile: {
    title: 'Member performance', subtitle: 'Amara Okafor · Newbie', action: 'Send message', icon: Users,
    heroLabel: 'September performance', listTitle: 'Member summary',
    metrics: [['Activity score','82%'],['Points','2,460']],
    tabs: ['Overview','Records'],
    rows: [
      ['Weekly plan','5 of 7 goals completed','72%','Review'],
      ['Attendance','11 present · 1 late','92%','Strong'],
      ['Freelance orders','₦376,400 gross this month','5 active','Orders'],
    ],
    note: ['Privacy boundary','Personal finance entries are hidden. Leaders see only summaries and records permitted for office review.']
  },
  planreview: {
    title: 'Review weekly plan', subtitle: 'Amara Okafor · Week 36', action: 'Submit review', icon: Target,
    heroLabel: 'Friday cross-check', listTitle: 'Goal assessment',
    metrics: [['Member progress','72%'],['Your score','82%']],
    tabs: ['Goals','Review notes'],
    rows: [
      ['Deliver two client projects','Member marked complete','100%','Good'],
      ['Contact five new prospects','3 of 5 completed','60%','Partial'],
      ['Attend all office sessions','4 of 5 attended','80%','Good'],
    ],
    note: ['Review becomes part of the record','Submitting locks this Friday review and notifies the member. Admin can still audit the score and notes.']
  },
  attendanceregister: {
    title: 'Attendance register', subtitle: 'Ikeja Central · Today', action: 'Mark attendance', icon: CalendarCheck,
    heroLabel: 'Monday, 1 September', listTitle: 'Member attendance',
    metrics: [['Present','36'],['Absent / late','12']],
    tabs: ['All 48','Exceptions 12'],
    rows: [
      ['Amara Okafor','Checked in · 8:42 AM','Present','Present'],
      ['Tobi Adeyemi','Checked in · 9:11 AM','Late','Late'],
      ['David Eze','Health excuse submitted','Review','Absent'],
    ],
    note: ['Exceptions need context','Every absence requires an excuse category and comment before it can be reviewed.']
  },
  transferapprovals: {
    title: 'Transfer approvals', subtitle: 'Incoming office requests', action: 'Review requests', icon: Users,
    heroLabel: 'Approval queue', listTitle: 'Pending requests',
    metrics: [['Pending','3'],['Approved this month','8']],
    tabs: ['Incoming 3','History'],
    rows: [
      ['Zainab Musa','Lekki Growth Hub → Ikeja Central','Today','Pending'],
      ['Emeka Obi','Abuja Central → Ikeja Central','Yesterday','Pending'],
      ['Bola Yusuf','Lekki Growth Hub → Ikeja Central','29 Aug','Pending'],
    ],
    note: ['Approval changes office visibility','Once approved, the member moves into your office scope and their former leader loses office-level access.']
  },
  bookreview: {
    title: 'Finance review', subtitle: 'Ikeja Central · Approval queue', action: 'Review entries', icon: BookOpen,
    heroLabel: 'Office-level books', listTitle: 'Pending entries',
    metrics: [['Awaiting review','₦186,000'],['Entries','6']],
    tabs: ['Pending 6','Approved'],
    rows: [
      ['Amara Okafor','Office earnings · Credit','+₦36,000','Pending'],
      ['Tobi Adeyemi','Office earnings · Credit','+₦120,000','Pending'],
      ['David Eze','Team expense · Debit','-₦30,000','Pending'],
    ],
    note: ['Personal books remain private','This queue contains only office-visible books and entries submitted for leader review.']
  },
  teamreports: {
    title: 'Team reports', subtitle: 'Ikeja Central · September', action: 'Export report', icon: TrendUp,
    heroLabel: 'Monthly office summary', listTitle: 'Report sections',
    metrics: [['Gross orders','₦8.4M'],['Attendance','88%']],
    tabs: ['This month','Last month'],
    rows: [
      ['Performance summary','Orders, plans and activity','Updated','Overview'],
      ['Attendance report','Daily presence and excuses','48 members','Attendance'],
      ['Financial rollup','Office books grouped by currency','NGN + USD','Finance'],
    ],
    note: ['Reports respect permissions','Exports include office-visible information only and preserve currency separation.']
  },
  feedbackinbox: {
    title: 'Feedback inbox', subtitle: 'Messages sent to you', action: 'Reply to member', icon: Bell,
    heroLabel: 'Leader inbox', listTitle: 'Recent messages',
    metrics: [['Unread','5'],['Resolved','18']],
    tabs: ['Feedback 4','Suggestions 3'],
    rows: [
      ['Weekly review timing','Amara Okafor · Today','New','Feedback'],
      ['More weekend training','Tobi Adeyemi · Yesterday','Open','Suggestion'],
      ['Office internet stability','David Eze · 29 Aug','Resolved','Feedback'],
    ],
    note: ['Inbox is recipient-based','You only see messages addressed directly to you. Admin retains organization-wide visibility.']
  },
  excusereview: {
    title: 'Review attendance excuse', subtitle: 'David Eze · 1 September', action: 'Approve excuse', icon: CalendarCheck,
    heroLabel: 'Health-related absence', listTitle: 'Review details',
    metrics: [['Attendance status','Absent'],['Submitted','8:18 AM']],
    tabs: ['Excuse','Member history'],
    rows: [
      ['Reason category','Health','Submitted','Category'],
      ['Member explanation','Unwell and unable to attend','Read','Comment'],
      ['Previous attendance','9 present · 1 late this month','90%','History'],
    ],
    note: ['Approval preserves the absence','Approving accepts the explanation but keeps the day recorded as absent with an approved excuse.']
  },
  admindashboard: {
    title: 'Admin dashboard', subtitle: 'Organization-wide overview', action: 'Create office', icon: TrendUp,
    heroLabel: 'FHG Delight Team', listTitle: 'Needs admin attention',
    metrics: [['Total members','386'],['Active offices','9']],
    tabs: ['Overview','Approvals 14'],
    rows: [
      ['New registrations','Profiles awaiting approval','8','Members'],
      ['Leader promotions','Role changes awaiting review','3','Roles'],
      ['Office transfer escalations','Requests needing admin action','3','Transfers'],
    ],
    note: ['Global visibility with accountability','Admin can review all offices and audit changes, including leader activity and protected financial records.']
  },
  offices: {
    title: 'Office management', subtitle: '9 active offices', action: 'Add office', icon: Briefcase,
    heroLabel: 'Organization footprint', listTitle: 'Office directory',
    metrics: [['Total members','386'],['Locations','5']],
    tabs: ['Active 9','Archived'],
    rows: [
      ['Ikeja Central','Kelechi Adebayo · Lagos','48','Active'],
      ['Lekki Growth Hub','Ngozi Eze · Lagos','31','Active'],
      ['Abuja Central','Samuel Ibrahim · Abuja','26','Active'],
    ],
    note: ['Every office needs one accountable leader','Leader reassignment keeps historical records tied to the office and records the effective date.']
  },
  officedetail: {
    title: 'Office details', subtitle: 'Office management and performance', action: 'Change office status', icon: Briefcase,
    heroLabel: 'Office overview', listTitle: 'Performance summary',
    metrics: [['Members','0'],['Gross orders','$0']],
    tabs: ['Overview'],
    rows: [],
    note: ['Office-level visibility','This page contains only records belonging to members currently assigned to this office.']
  },
  leaders: {
    title: 'Team leaders', subtitle: 'Roles and office assignments', action: 'Assign leader', icon: Users,
    heroLabel: 'Leadership network', listTitle: 'Active leaders',
    metrics: [['Team leaders','9'],['Pending promotion','3']],
    tabs: ['Active 9','Pending 3'],
    rows: [
      ['Kelechi Adebayo','Ikeja Central · 48 members','92%','Active'],
      ['Ngozi Eze','Lekki Growth Hub · 31 members','88%','Active'],
      ['Samuel Ibrahim','Abuja Central · 26 members','84%','Active'],
    ],
    note: ['Leader access follows office assignment','A leader can manage their own office but cannot view another leader’s personal records.']
  },
  orgmembers: {
    title: 'All members', subtitle: 'Organization-wide directory', action: 'Invite member', icon: Users,
    heroLabel: 'Member network', listTitle: 'Recently active',
    metrics: [['Members','386'],['Pending approval','8']],
    tabs: ['All 386','Pending 8'],
    rows: [
      ['Amara Okafor','Ikeja Central · Newbie','Active','Member'],
      ['Tobi Adeyemi','Ikeja Central · Distributor','Active','Member'],
      ['Zainab Musa','Lekki Growth Hub · Newbie','Pending','Approval'],
    ],
    note: ['Directory and downline are separate structures','Office assignment controls leader visibility; sponsor relationships control the downline view.']
  },
  roles: {
    title: 'Roles & permissions', subtitle: 'Control organization access', action: 'Create role', icon: Users,
    heroLabel: 'Access governance', listTitle: 'Permission profiles',
    metrics: [['Active roles','4'],['Custom rules','12']],
    tabs: ['Roles 4','Permission map'],
    rows: [
      ['Administrator','Full organization access','1','System'],
      ['Team leader','Own office and assigned members','9','Managed'],
      ['Distributor','Self and sponsored downline','124','Standard'],
      ['Member','Personal records only','252','Standard'],
    ],
    note: ['Access is additive and auditable','Office visibility and sponsor visibility are evaluated separately, while every permission change is recorded.']
  },
  transfers: {
    title: 'Office transfers', subtitle: 'Review member movement', action: 'New transfer', icon: Briefcase,
    heroLabel: 'Transfer approval queue', listTitle: 'Pending requests',
    metrics: [['Pending','3'],['Approved this month','18']],
    tabs: ['Pending 3','History'],
    rows: [
      ['Amara Okafor','Ikeja Central → Lekki Growth Hub','2h','Awaiting leader'],
      ['David Eze','Abuja Central → Ikeja Central','1d','Admin review'],
      ['Fatima Bello','Lekki Growth Hub → Abuja Central','2d','Awaiting leader'],
    ],
    note: ['Records stay with the member','The new leader approves access; historical attendance, plans, and transactions keep their original office attribution.']
  },
  pointsettings: {
    title: 'Points settings', subtitle: 'Rewards and conversion rules', action: 'Add rule', icon: Sparkle,
    heroLabel: 'Current conversion', listTitle: 'Earning rules',
    metrics: [['1,000 points','₦1,000'],['Active rules','4']],
    tabs: ['Rules','Eligibility'],
    rows: [
      ['Office attendance','Daily verified check-in','20 pts','Active'],
      ['Completed order','Order marked complete','50 pts','Active'],
      ['Weekly plan','Submitted before deadline','30 pts','Active'],
      ['Friday review','Plan reviewed by leader','10 pts','Active'],
    ],
    note: ['Points do not guarantee payment','Conversion shows reward value; payout eligibility is controlled separately and requires admin approval.']
  },
  announcementtargeting: {
    title: 'New announcement', subtitle: 'Choose audience and delivery', action: 'Create announcement', icon: Bell,
    heroLabel: 'Audience reach', listTitle: 'Target groups',
    metrics: [['Selected reach','386'],['Offices','9']],
    tabs: ['Audience','Delivery'],
    rows: [
      ['Everyone','All active organization members','386','Selected'],
      ['Team leaders only','Leaders across every office','9','Group'],
      ['Specific offices','Choose one or more locations','0','Choose'],
      ['Specific people','Search individual recipients','0','Choose'],
    ],
    note: ['Recipient lists are saved at send time','Delivery history preserves exactly who received the announcement, even when roles or offices change later.']
  },
  reports: {
    title: 'Reports & analytics', subtitle: 'Organization performance', action: 'Export report', icon: TrendUp,
    heroLabel: 'September overview', listTitle: 'Performance by module',
    metrics: [['Recorded income','₦24.8m'],['Attendance rate','87%']],
    tabs: ['Overview','By office'],
    rows: [
      ['Freelance orders','186 completed across 9 offices','₦18.4m','Income'],
      ['Weekly plans','312 plans submitted this month','81%','Completion'],
      ['Attendance','8,426 verified check-ins','87%','Present'],
      ['Member growth','28 approved registrations','7.8%','Growth'],
    ],
    note: ['Reports respect currency boundaries','Naira and Dollar books are reported separately; totals are never combined without an explicit exchange-rate snapshot.']
  },
  auditlog: {
    title: 'Audit history', subtitle: 'Security and record changes', action: 'Export log', icon: CheckCircle,
    heroLabel: 'Immutable activity trail', listTitle: 'Recent changes',
    metrics: [['Events today','48'],['Flagged','2']],
    tabs: ['All activity','Flagged 2'],
    rows: [
      ['Cash entry edited','Amara changed ₦120,000 → ₦148,000','10:42','Financial'],
      ['Role permission updated','Admin changed Team leader access','09:18','Security'],
      ['Office transfer approved','Ngozi approved Amara’s request','Yesterday','Transfer'],
      ['Attendance excuse reviewed','Kelechi approved David’s excuse','Yesterday','Attendance'],
    ],
    note: ['History cannot be overwritten','Each event stores the actor, timestamp, affected record, and before-and-after values where applicable.']
  },
  adminnotifications: {
    title: 'Notifications', subtitle: 'Updates needing your attention', action: 'Mark all read', icon: Bell,
    heroLabel: 'Your inbox', listTitle: 'Recent notifications',
    metrics: [['Unread','6'],['Approvals','3']],
    tabs: ['All','Unread 6'],
    rows: [
      ['Office transfer request','Amara wants to join Lekki Growth Hub','5m','Approval'],
      ['Weekly plan submitted','Tobi submitted Week 36 plan','22m','Plan'],
      ['Attendance excuse','David added a health explanation','1h','Review'],
      ['New announcement','September leadership session','3h','Announcement'],
    ],
    note: ['Notifications follow access rights','Opening an alert never grants additional access; the linked record is checked against the user’s current permissions.']
  },
  adminsettings: {
    title: 'Profile & settings', subtitle: 'Account and preferences', action: 'Edit profile', icon: Users,
    heroLabel: 'Administrator account', listTitle: 'Account settings',
    metrics: [['Role','Admin'],['Active sessions','2']],
    tabs: ['Profile','Security'],
    rows: [
      ['Personal details','Name, phone and profile photo','Complete','Profile'],
      ['Login & security','Password and two-step verification','Strong','Protected'],
      ['Notification preferences','Push, email and approval alerts','On','Enabled'],
      ['Currency display','Default dashboard presentation','NGN','Preference'],
    ],
    note: ['Identity changes are protected','Role, office, sponsor, and account status changes require authorized workflows and remain visible in the audit history.']
  }
}

const moduleActionTargets = {
  activity: 'addorder', attendanceregister: 'markattendance',
  orders: 'addorder', plans: 'editplan', books: 'addentry', bookdetail:'addentry', attendance: 'checkin',
  withdrawals: 'recordwithdrawal',
  announcements: 'createannouncement', feedback: 'sendfeedback', events: 'createevent',
  leaderdashboard: 'createannouncement', feedbackinbox: 'createannouncement', memberprofile:'createannouncement',
  planreview:'reviewplan', bookreview:'books', excusereview:'attendanceregister', history:'books', eventdetail:'events', roles:'leaders',
  admindashboard: 'addoffice', offices: 'addoffice', leaders: 'assignleader', transfers: 'transfer', profile: 'editprofile', settings: 'editprofile', adminsettings: 'editprofile', announcementtargeting: 'createannouncement', pointsettings:'addpointrule',
}

function ModulePage({ type, onBack, onNavigate, onSelectOffice, onSelectMember, onSelectBook = bookId => { window.sessionStorage.setItem('teamflowSelectedBook',bookId); onNavigate('bookdetail') }, onReviewPlan, onEditOrder, onEditFinance, onViewFinanceHistory, selectedOfficeId, selectedMemberId, selectedBookId, selectedTransactionId, user }) {
  const data = screenData[type]
  const Icon = data.icon
  const [activeTab, setActiveTab] = useState(0)
  const [message, setMessage] = useState('')
  const [liveRows, setLiveRows] = useState(null)
  const [liveMetrics, setLiveMetrics] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [recordScope, setRecordScope] = useState('mine')
  const [officeDetail, setOfficeDetail] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const effectiveBookId=selectedBookId||window.sessionStorage.getItem('teamflowSelectedBook')
  const liveAdminTypes = ['admindashboard','leaderdashboard','offices','officedetail','leaders','orgmembers','members','attendanceregister']
  const liveEngagementTypes = ['announcements','feedback','feedbackinbox','events','rewards','pointsettings','notifications','adminnotifications']
  const liveOperationTypes = ['team','memberprofile','withdrawals','history','transfers','transferapprovals','reports','teamreports','auditlog','profile','settings','adminsettings']
  const isCoreModule = ['activity','orders','plans','attendance','books','bookdetail'].includes(type)
  const isLiveModule = isCoreModule || liveAdminTypes.includes(type) || liveEngagementTypes.includes(type) || liveOperationTypes.includes(type)
  useEffect(() => {
    if (!isLiveModule || !supabase) return
    setLiveRows(null)
    setLiveMetrics(null)
    let cancelled = false
    const money = amount => `₦${Number(amount || 0).toLocaleString('en-NG', {maximumFractionDigits:2})}`
    const load = async () => {
      let rows = []; let metrics = data.metrics; let error = null
      if (type === 'activity') {
        const [ordersResult,plansResult,attendanceResult,booksResult] = await Promise.all([
          supabase.from('orders').select('id,project_name,amount,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
          supabase.from('weekly_plans').select('id,primary_goal,completion_percent,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
          supabase.from('attendance').select('id,status,attendance_date,checked_in_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
          supabase.from('cash_books').select('id,name,currency,cash_transactions(id,entry_type,amount,description,created_at)').eq('owner_id',user.id),
        ])
        error=ordersResult.error||plansResult.error||attendanceResult.error||booksResult.error
        const formatAmount=(amount,currency)=>currency==='USD'?`$${Number(amount||0).toLocaleString('en-US',{maximumFractionDigits:2})}`:money(amount)
        const activity=[
          ...(ordersResult.data||[]).map(item=>({when:item.created_at,row:[item.project_name,`Freelance order · ${new Date(item.created_at).toLocaleString()}`,`$${Number(item.amount||0).toLocaleString('en-US',{maximumFractionDigits:2})}`,item.status]})),
          ...(plansResult.data||[]).map(item=>({when:item.created_at,row:[item.primary_goal,`Weekly plan · ${new Date(item.created_at).toLocaleString()}`,`${item.completion_percent}%`,'Plan']})),
          ...(attendanceResult.data||[]).map(item=>({when:item.checked_in_at||item.created_at,row:[`Attendance · ${item.status}`,new Date(`${item.attendance_date}T00:00:00`).toLocaleDateString(),item.status==='absent'?'Excused':'Recorded','Attendance']})),
          ...(booksResult.data||[]).flatMap(book=>(book.cash_transactions||[]).map(item=>({when:item.created_at,row:[item.description,`${book.name} · ${new Date(item.created_at).toLocaleString()}`,`${item.entry_type==='credit'?'+':'-'}${formatAmount(item.amount,book.currency)}`,'Finance']}))),
        ].sort((a,b)=>new Date(b.when)-new Date(a.when)).slice(0,40)
        rows=activity.map(item=>item.row)
        const monthStart=new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
        metrics=[['Records',String(activity.length)],['This month',String(activity.filter(item=>new Date(item.when)>=monthStart).length)]]
      } else if (type === 'orders') {
        let query = supabase.from('orders').select('id,user_id,project_name,amount,platform,fee_percent,status,created_at,profiles(full_name)').order('created_at',{ascending:false})
        if (recordScope === 'mine') query = query.eq('user_id', user.id)
        const result = await query
        error = result.error
        const dollars = amount => `$${Number(amount || 0).toLocaleString('en-US', {maximumFractionDigits:2})}`
        rows = (result.data || []).map(item => [item.project_name, `${recordScope === 'team' ? `${item.profiles?.full_name || 'Team member'} · ` : ''}${item.platform} · ${item.fee_percent}% fee · ${new Date(item.created_at).toLocaleDateString()}`, dollars(item.amount), item.status, item.id, item.user_id])
        const gross = (result.data || []).reduce((sum,item) => sum + Number(item.amount),0)
        const completed = (result.data || []).filter(item => item.status === 'completed').reduce((sum,item) => sum + Number(item.amount)*(1-Number(item.fee_percent || 0)/100),0)
        metrics = [['Gross orders',dollars(gross)],['Net completed',dollars(completed)]]
      } else if (type === 'plans') {
        const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
        const weekStart = monday.toISOString().slice(0,10)
        let query = supabase.from('weekly_plans').select('id,user_id,week_start,primary_goal,completion_percent,review_rating,review_note,reviewed_at,edit_count,profiles!weekly_plans_user_id_fkey(full_name)').order('week_start',{ascending:false})
        query = activeTab === 0 ? query.eq('week_start',weekStart) : query.lt('week_start',weekStart).limit(12)
        if (recordScope === 'mine') query = query.eq('user_id',user.id)
        let result
        if (recordScope === 'team' && user.ledOfficeId) {
          const membershipsResult = await supabase.from('office_memberships').select('user_id').eq('office_id',user.ledOfficeId).is('ended_at',null)
          const memberIds = (membershipsResult.data || []).map(item=>item.user_id)
          result = membershipsResult.error ? membershipsResult : memberIds.length ? await query.in('user_id',memberIds) : {data:[],error:null}
        } else result = await query
        error = result.error
        rows = (result.data || []).map(item => [recordScope === 'team' ? (item.profiles?.full_name || 'Team member') : item.primary_goal, `${recordScope === 'team' ? `${item.primary_goal} · ` : ''}Week of ${new Date(`${item.week_start}T00:00:00`).toLocaleDateString()}`, `${item.completion_percent}%`, item.review_rating || (item.reviewed_at ? 'Reviewed' : 'Pending review'), item.id, item.user_id, item.reviewed_at])
        const plans = result.data || []
        const average = plans.length ? Math.round(plans.reduce((sum,item)=>sum+Number(item.completion_percent || 0),0)/plans.length) : 0
        metrics = [[recordScope === 'team' ? 'Plans submitted' : 'Plan progress',recordScope === 'team' ? String(plans.length) : `${plans[0]?.completion_percent || 0}%`],['Average completion',`${average}%`]]
      } else if (type === 'attendance') {
        const today = new Date()
        const rangeStart = new Date(today)
        if (activeTab === 0) rangeStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
        else rangeStart.setDate(1)
        const startDate = rangeStart.toISOString().slice(0,10)
        const previousStart = new Date(rangeStart)
        if (activeTab === 0) previousStart.setDate(previousStart.getDate() - 7)
        else previousStart.setMonth(previousStart.getMonth() - 1)
        const previousStartDate = previousStart.toISOString().slice(0,10)
        let query = supabase.from('attendance').select('id,user_id,office_id,attendance_date,status,checked_in_at,excuse_status,excuse_category,comment,profiles!attendance_user_id_fkey(full_name)').gte('attendance_date',startDate).order('attendance_date',{ascending:false})
        let previousQuery = supabase.from('attendance').select('user_id,office_id,status,attendance_date').gte('attendance_date',previousStartDate).lt('attendance_date',startDate)
        if (recordScope === 'mine') query = query.eq('user_id',user.id)
        else if (user.ledOfficeId) query = query.eq('office_id',user.ledOfficeId)
        if (recordScope === 'mine') previousQuery = previousQuery.eq('user_id',user.id)
        else if (user.ledOfficeId) previousQuery = previousQuery.eq('office_id',user.ledOfficeId)
        const [result, previousResult] = await Promise.all([query, previousQuery])
        error = result.error || previousResult.error
        rows = (result.data || []).map(item => [recordScope === 'team' ? (item.profiles?.full_name || 'Office member') : new Date(`${item.attendance_date}T00:00:00`).toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'short'}), `${recordScope === 'team' ? `${new Date(`${item.attendance_date}T00:00:00`).toLocaleDateString('en-NG',{day:'numeric',month:'short'})} · ` : ''}${item.checked_in_at ? `Checked in ${new Date(item.checked_in_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : item.status === 'absent' ? `${item.excuse_category || 'Absence'} · ${item.excuse_status || 'Pending review'}` : 'No check-in'}`, item.status === 'absent' ? (item.excuse_status || 'Pending') : item.status.replace(/^./,letter=>letter.toUpperCase()), item.status, item.id, item.user_id, item.excuse_status])
        const attended = (result.data || []).filter(item => item.status === 'present' || item.status === 'late').length
        const total = result.data?.length || 0
        const rate = total ? Math.round(attended / total * 100) : 0
        const previousRows = previousResult.data || []
        const previousAttended = previousRows.filter(item => item.status === 'present' || item.status === 'late').length
        const previousRate = previousRows.length ? Math.round(previousAttended / previousRows.length * 100) : 0
        const difference = rate - previousRate
        metrics = [['Attendance rate',`${rate}%`],['Period trend',previousRows.length ? `${difference > 0 ? '+' : ''}${difference}%` : 'No prior data']]
      } else if (type === 'books' || type === 'bookdetail') {
        let query = supabase.from('cash_books').select('id,owner_id,name,currency,visibility,cash_transactions(id,entry_type,amount,description,transaction_date,notes,created_at,updated_at)').order('created_at',{ascending:false})
        if (type === 'bookdetail') query = query.eq('id',effectiveBookId)
        else if (recordScope === 'mine') query = query.eq('owner_id',user.id)
        else {
          query = query.eq('visibility','office')
          if (user.ledOfficeId) {
            const membershipsResult = await supabase.from('office_memberships').select('user_id').eq('office_id',user.ledOfficeId).is('ended_at',null)
            const memberIds = (membershipsResult.data || []).map(item=>item.user_id)
            query = memberIds.length ? query.in('owner_id',memberIds) : query.in('owner_id',['00000000-0000-0000-0000-000000000000'])
          }
        }
        const result = await query
        error = result.error
        const transactions = (result.data || []).flatMap(book => (book.cash_transactions || []).map(item => ({...item,book:book.name,currency:book.currency,owner_id:book.owner_id}))).sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
        const formatCurrency = (amount,currency) => currency === 'USD' ? `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}` : money(amount)
        const bookRows=(type==='bookdetail'?[]:(result.data||[])).map(book=>{
          const balance=(book.cash_transactions||[]).reduce((sum,item)=>sum+(item.entry_type==='credit'?Number(item.amount):-Number(item.amount)),0)
          return [book.name,`${book.currency} · ${book.visibility==='office'?'Office visible':'Personal'}`,formatCurrency(balance,book.currency),'book',null,book.owner_id,false,book.id]
        })
        const transactionRows=transactions.map(item => [item.description, `${item.book} · ${item.currency} · ${new Date(`${item.transaction_date}T00:00:00`).toLocaleDateString()}`, `${item.entry_type === 'credit' ? '+' : '-'}${formatCurrency(item.amount,item.currency)}`, item.entry_type, item.id, item.owner_id, item.updated_at !== item.created_at])
        rows=[...bookRows,...transactionRows]
        const balanceFor = currency => transactions.filter(item=>item.currency===currency).reduce((sum,item) => sum + (item.entry_type === 'credit' ? Number(item.amount) : -Number(item.amount)),0)
        metrics = [['Naira balance',money(balanceFor('NGN'))],['Dollar balance',`$${balanceFor('USD').toLocaleString('en-US',{maximumFractionDigits:2})}`]]
        if(type==='bookdetail'){
          const book=result.data?.[0]
          const balance=book?(book.cash_transactions||[]).reduce((sum,item)=>sum+(item.entry_type==='credit'?Number(item.amount):-Number(item.amount)),0):0
          metrics=[['Balance',book?formatCurrency(balance,book.currency):'—'],['Entries',String(book?.cash_transactions?.length||0)]]
        }
      } else if (type === 'history') {
        if (!selectedTransactionId) error = {message:'Select a Finance entry to view its history.'}
        else {
          const [transactionResult,historyResult] = await Promise.all([
            supabase.from('cash_transactions').select('id,amount,cash_books(name,currency)').eq('id',selectedTransactionId).single(),
            supabase.from('cash_transaction_history').select('id,old_value,new_value,changed_at').eq('transaction_id',selectedTransactionId).order('changed_at',{ascending:false}),
          ])
          error=transactionResult.error||historyResult.error
          const transaction=transactionResult.data; const history=historyResult.data||[]
          const currency=transaction?.cash_books?.currency||'NGN'
          const formatCurrency=amount=>currency==='USD'?`$${Number(amount||0).toLocaleString('en-US',{maximumFractionDigits:2})}`:money(amount)
          rows=history.map(item=>['Entry updated',new Date(item.changed_at).toLocaleString(),`${formatCurrency(item.old_value?.amount)} → ${formatCurrency(item.new_value?.amount)}`,'Changed'])
          metrics=[['Current value',transaction?formatCurrency(transaction.amount):'—'],['Changes',String(history.length)]]
        }
      } else if (type === 'withdrawals') {
        const result = await supabase.from('withdrawals').select('id,amount,currency,notes,recorded_at,cash_books(name)').eq('user_id',user.id).order('recorded_at',{ascending:false})
        error = result.error
        const withdrawals = result.data || []
        const formatCurrency = (amount,currency) => currency === 'USD' ? `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}` : money(amount)
        rows = withdrawals.map(item=>['Withdrawal',`${item.cash_books?.name || 'Finance book'} · ${new Date(item.recorded_at).toLocaleDateString()}${item.notes ? ` · ${item.notes}` : ''}`,formatCurrency(item.amount,item.currency),'Recorded',item.id])
        const totalFor = currency => withdrawals.filter(item=>item.currency===currency).reduce((sum,item)=>sum+Number(item.amount),0)
        metrics = [['Naira withdrawn',money(totalFor('NGN'))],['Dollar withdrawn',`$${totalFor('USD').toLocaleString('en-US',{maximumFractionDigits:2})}`]]
      } else if (type === 'team') {
        const result = await supabase.rpc('downline_performance',{target_user_id:null})
        error = result.error
        const people = result.data || []
        rows = people.map(item => [item.full_name, `${item.office_name || 'Office pending'} · ${item.rank}`, `${item.active_orders} active`, Number(item.attendance_rate) >= 50 || Number(item.active_orders) > 0 ? 'Active' : 'Needs support', item.user_id])
        metrics = [['Direct downlines',String(people.length)],['Active this period',String(people.filter(item=>Number(item.attendance_rate) >= 50 || Number(item.active_orders) > 0).length)]]
      } else if (type === 'memberprofile') {
        if (!selectedMemberId) error = {message:'Select a member from My Team first.'}
        else {
          const result = await supabase.rpc('downline_performance',{target_user_id:selectedMemberId})
          error = result.error
          const member = result.data?.[0]
          if (member) {
            const dollars = amount => `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}`
            metrics = [['Attendance',`${Number(member.attendance_rate || 0)}%`],['Plan progress',`${Number(member.plan_completion || 0)}%`]]
            rows = [
              ['Member',`${member.rank} · ${member.office_name || 'Office pending'}`,member.full_name,'Profile'],
              ['Freelance orders',`${member.order_count} total orders`,`${member.active_orders} active`,'Orders'],
              ['Completed earnings','Completed freelance orders only',dollars(member.completed_earnings),'Income'],
              ['Attendance','Present and late attendance records',`${Number(member.attendance_rate || 0)}%`,'Attendance'],
              ['Weekly plans','Average submitted-plan completion',`${Number(member.plan_completion || 0)}%`,'Plans'],
              ['Last activity',member.last_activity ? new Date(member.last_activity).toLocaleString() : 'No activity recorded','Updated','Activity'],
            ]
          } else rows = []
        }
      } else if (type === 'announcements') {
        const result = await supabase.from('announcements').select('title,message,audience,published_at').order('published_at',{ascending:false})
        error = result.error
        rows = (result.data || []).map(item => [item.title,item.message,new Date(item.published_at).toLocaleDateString(),item.audience])
        metrics = [['Announcements',String(result.data?.length || 0)],['Latest',result.data?.[0] ? new Date(result.data[0].published_at).toLocaleDateString() : 'None']]
      } else if (type === 'feedback' || type === 'feedbackinbox') {
        const result = await supabase.from('feedback_messages').select('id,sender_id,recipient_id,subject,message,message_type,status,created_at,profiles!feedback_messages_sender_id_fkey(full_name)').order('created_at',{ascending:false})
        error = result.error
        const messages = type === 'feedbackinbox' ? (result.data || []).filter(item => user.role === 'Administrator' || item.recipient_id === user.id) : (result.data || []).filter(item => item.sender_id === user.id)
        rows = messages.map(item => [item.subject,`${type === 'feedbackinbox' ? `${item.profiles?.full_name || 'Member'} · ` : ''}${item.message}`,item.message_type,item.status,item.id])
        metrics = [['Messages',String(messages.length)],['Open',String(messages.filter(item => item.status !== 'resolved').length)]]
      } else if (type === 'events') {
        const [result,completionResult] = await Promise.all([supabase.from('team_events').select('id,name,description,location,starts_at').order('starts_at',{ascending:true}),supabase.from('event_completions').select('event_id').eq('user_id',user.id)])
        error = result.error || completionResult.error
        const completed = new Set((completionResult.data || []).map(item=>item.event_id))
        rows = (result.data || []).map(item => [item.name,`${item.location || 'Location pending'} · ${item.description || ''}`,new Date(item.starts_at).toLocaleString(),completed.has(item.id) ? 'Done' : new Date(item.starts_at) > new Date() ? 'Upcoming' : 'Past',item.id])
        metrics = [['Events',String(result.data?.length || 0)],['Upcoming',String((result.data || []).filter(item => new Date(item.starts_at)>new Date()).length)]]
      } else if (type === 'rewards') {
        const [ledgerResult,rulesResult] = await Promise.all([supabase.from('points_ledger').select('action,points,created_at').order('created_at',{ascending:false}),supabase.from('points_rules').select('action,points,naira_per_point').eq('active',true)])
        error = ledgerResult.error || rulesResult.error
        const ledger = ledgerResult.data || []; const total = ledger.reduce((sum,item)=>sum+Number(item.points),0)
        const nairaRate = Number(rulesResult.data?.[0]?.naira_per_point || 1)
        rows = ledger.map(item => [item.action.replaceAll('_',' '),new Date(item.created_at).toLocaleDateString(),`+${item.points}`, 'Earned'])
        metrics = [['Total points',String(total)],['Naira value',money(total*nairaRate)]]
      } else if (type === 'pointsettings') {
        const result=await supabase.from('points_rules').select('action,points,naira_per_point,active,updated_at').order('action')
        error=result.error
        const labels={attendance_checkin:'Office attendance',order_logged:'Order logged',weekly_plan_submitted:'Weekly plan submitted',event_completed:'Event completed'}
        rows=(result.data||[]).map(item=>[labels[item.action]||item.action.replaceAll('_',' '),`Worth ${money(Number(item.points)*Number(item.naira_per_point))} at the current display rate`,`${item.points} pts`,item.active?'Active':'Inactive',item.action,null,item.points])
        metrics=[['1,000 points',money(1000*Number(result.data?.[0]?.naira_per_point||0))],['Active rules',String((result.data||[]).filter(item=>item.active).length)]]
      } else if (type === 'notifications' || type === 'adminnotifications') {
        const result = await supabase.from('notifications').select('id,title,message,kind,related_type,related_id,read_at,created_at').order('created_at',{ascending:false})
        error = result.error
        rows = (result.data || []).map(item => [item.title,item.message,new Date(item.created_at).toLocaleDateString(),item.read_at ? 'Read' : 'Unread',item.id,item.related_type,item.related_id])
        metrics = [['Unread',String((result.data || []).filter(item => !item.read_at).length)],['All',String(result.data?.length || 0)]]
      } else if (type === 'transfers' || type === 'transferapprovals') {
        const [transfersResult,officesResult,profilesResult] = await Promise.all([
          supabase.from('office_transfers').select('id,user_id,from_office_id,to_office_id,reason,status,requested_at').order('requested_at',{ascending:false}),
          supabase.from('offices').select('id,name'), supabase.from('profiles').select('id,full_name')
        ])
        error = transfersResult.error || officesResult.error || profilesResult.error
        const officeNames=Object.fromEntries((officesResult.data||[]).map(item=>[item.id,item.name])); const profileNames=Object.fromEntries((profilesResult.data||[]).map(item=>[item.id,item.full_name]))
        const transfers=(transfersResult.data||[]).filter(item=>type==='transfers'||item.status==='pending')
        rows=transfers.map(item=>[profileNames[item.user_id]||'Member',`${officeNames[item.from_office_id]||'Office'} → ${officeNames[item.to_office_id]||'Office'} · ${item.reason}`,new Date(item.requested_at).toLocaleDateString(),item.status.replace(/^./,letter=>letter.toUpperCase()),item.id])
        metrics=[['Pending',String((transfersResult.data||[]).filter(item=>item.status==='pending').length)],['All requests',String(transfersResult.data?.length||0)]]
      } else if (type === 'reports' || type === 'teamreports') {
        const now=new Date(); const currentStart=new Date(now.getFullYear(),now.getMonth(),1); const periodStart=activeTab===0?currentStart:new Date(now.getFullYear(),now.getMonth()-1,1); const periodEnd=activeTab===0?new Date(now.getFullYear(),now.getMonth()+1,1):currentStart
        const startIso=periodStart.toISOString(); const endIso=periodEnd.toISOString(); const startDate=startIso.slice(0,10); const endDate=endIso.slice(0,10)
        let memberIds = null
        const reportOfficeId=selectedOfficeId||user.ledOfficeId
        if (type === 'teamreports' && reportOfficeId) {
          const membershipsResult = await supabase.from('office_memberships').select('user_id').eq('office_id',reportOfficeId).is('ended_at',null)
          error = membershipsResult.error
          memberIds = (membershipsResult.data || []).map(item=>item.user_id)
        }
        const empty = Promise.resolve({data:[],error:null})
        let ordersQuery=supabase.from('orders').select('amount,status').gte('created_at',startIso).lt('created_at',endIso)
        let attendanceQuery=supabase.from('attendance').select('status').gte('attendance_date',startDate).lt('attendance_date',endDate)
        let plansQuery=supabase.from('weekly_plans').select('completion_percent').gte('week_start',startDate).lt('week_start',endDate)
        let booksQuery=supabase.from('cash_books').select('currency,visibility,cash_transactions(entry_type,amount,transaction_date)').gte('cash_transactions.transaction_date',startDate).lt('cash_transactions.transaction_date',endDate)
        if(memberIds?.length){ordersQuery=ordersQuery.in('user_id',memberIds);plansQuery=plansQuery.in('user_id',memberIds);booksQuery=booksQuery.in('owner_id',memberIds)}
        if(reportOfficeId&&type==='teamreports')attendanceQuery=attendanceQuery.eq('office_id',reportOfficeId)
        if(type==='teamreports')booksQuery=booksQuery.eq('visibility','office')
        const [ordersResult,attendanceResult,plansResult,booksResult] = await Promise.all([
          memberIds?.length===0?empty:ordersQuery, attendanceQuery, memberIds?.length===0?empty:plansQuery, memberIds?.length===0?empty:booksQuery,
        ])
        error=ordersResult.error||attendanceResult.error||plansResult.error||booksResult.error
        const gross=(ordersResult.data||[]).reduce((sum,item)=>sum+Number(item.amount),0); const attendance=attendanceResult.data||[]; const attended=attendance.filter(item=>item.status==='present'||item.status==='late').length
        const plans=plansResult.data||[]; const avg=plans.length?Math.round(plans.reduce((sum,item)=>sum+Number(item.completion_percent),0)/plans.length):0
        const balanceFor=currency=>(booksResult.data||[]).filter(book=>book.currency===currency).flatMap(book=>book.cash_transactions||[]).reduce((sum,item)=>sum+(item.entry_type==='credit'?Number(item.amount):-Number(item.amount)),0)
        const orderMoney = amount => `$${Number(amount || 0).toLocaleString('en-US',{maximumFractionDigits:2})}`
        rows=[['Orders report','Completed and active freelance orders',orderMoney(gross),'Live'],['Attendance report',`${attended} attended of ${attendance.length} records`,attendance.length?`${Math.round(attended/attendance.length*100)}%`:'0%','Live'],['Weekly plans','Average completion',`${avg}%`,'Live'],['Naira Finance rollup','Income minus expenses in NGN',money(balanceFor('NGN')),'Live'],['Dollar Finance rollup','Income minus expenses in USD',orderMoney(balanceFor('USD')),'Live']]
        metrics=[['Gross orders',orderMoney(gross)],['Attendance',attendance.length?`${Math.round(attended/attendance.length*100)}%`:'0%']]
      } else if (type === 'auditlog') {
        const result=await supabase.from('audit_log').select('action,entity_type,entity_id,created_at').order('created_at',{ascending:false}).limit(100)
        error=result.error; rows=(result.data||[]).map(item=>[item.action.replaceAll('_',' '),item.entity_type,new Date(item.created_at).toLocaleString(),'Recorded']); metrics=[['Audit events',String(result.data?.length||0)],['Latest',result.data?.[0]?new Date(result.data[0].created_at).toLocaleDateString():'None']]
      } else if (type === 'profile' || type === 'settings' || type === 'adminsettings') {
        rows=[['Full name',user.name,'Current','Profile'],['Role',user.isTeamLeader?`${user.role} · Team leader`:user.role,'Active','Access'],['Rank',user.rank,'Current','Rank'],['Office',user.office,'Active','Assignment']]
        metrics=[['Account status',user.status],['Role',user.role]]
      } else if (type === 'leaderdashboard') {
        const officeResult = await supabase.from('offices').select('id,name').eq('leader_id',user.id).eq('active',true).maybeSingle()
        error = officeResult.error
        if (officeResult.data) {
          const membershipsResult = await supabase.from('office_memberships').select('user_id').eq('office_id',officeResult.data.id).is('ended_at',null)
          const memberIds = [...new Set([user.id,...(membershipsResult.data || []).map(item => item.user_id)])]
          const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
          const [profilesResult, plansResult, attendanceResult, transfersResult, ordersResult] = memberIds.length ? await Promise.all([
            supabase.from('profiles').select('id,status').in('id',memberIds),
            supabase.from('weekly_plans').select('completion_percent,reviewed_at').in('user_id',memberIds),
            supabase.from('attendance').select('id,status,excuse_status').in('user_id',memberIds).gte('attendance_date',monthStart.toISOString().slice(0,10)),
            supabase.from('office_transfers').select('id,status').eq('to_office_id',officeResult.data.id),
            supabase.from('orders').select('id,user_id,project_name,amount,fee_percent,status,created_at,profiles(full_name)').in('user_id',memberIds).gte('created_at',monthStart.toISOString()).order('created_at',{ascending:false}),
          ]) : [{data:[]},{data:[]},{data:[]},{data:[]},{data:[]}]
          error = error || membershipsResult.error || profilesResult.error || plansResult.error || attendanceResult.error || transfersResult.error || ordersResult.error
          const activeMembers = (profilesResult.data || []).filter(item => item.status === 'active').length
          const pendingPlans = (plansResult.data || []).filter(item => !item.reviewed_at).length
          const pendingExcuses = (attendanceResult.data || []).filter(item => item.status === 'absent' && item.excuse_status === 'pending').length
          const pendingTransfers = (transfersResult.data || []).filter(item => item.status === 'pending').length
          const completionValues = (plansResult.data || []).map(item => Number(item.completion_percent || 0))
          const averageCompletion = completionValues.length ? Math.round(completionValues.reduce((sum,value)=>sum+value,0)/completionValues.length) : 0
          const orders=ordersResult.data || []; const gross=orders.reduce((sum,item)=>sum+Number(item.amount),0)
          const completedNet=orders.filter(item=>item.status==='completed').reduce((sum,item)=>sum+Number(item.amount)*(1-Number(item.fee_percent||0)/100),0)
          const attended=(attendanceResult.data||[]).filter(item=>item.status==='present'||item.status==='late').length
          const attendanceRate=attendanceResult.data?.length?Math.round(attended/attendanceResult.data.length*100):0
          const dollars=amount=>`$${Number(amount||0).toLocaleString('en-US',{maximumFractionDigits:2})}`
          metrics = [['Office members',String(activeMembers)],['Gross orders',dollars(gross)]]
          rows = [
            ['Orders this month',`${orders.filter(item=>item.status==='active').length} active · ${orders.filter(item=>item.status==='completed').length} completed`,`${orders.length} total`,'Orders'],
            ['Net completed earnings','After platform fees',dollars(completedNet),'Earnings'],
            ['Office attendance',`${attended} attended of ${attendanceResult.data?.length||0} records`,`${attendanceRate}%`,'Attendance'],
            ['Weekly plan progress','Average member completion',`${averageCompletion}%`,'Plans'],
            ['Weekly plans awaiting review','Friday scoring queue',String(pendingPlans),'Plans'],
            ['Office transfer requests','Incoming office approvals',String(pendingTransfers),'Approvals'],
            ['Attendance excuses','Absences awaiting review',String(pendingExcuses),'Attendance'],
            ...orders.slice(0,3).map(item=>[item.project_name,`${item.profiles?.full_name||'Office member'} · ${item.status}`,dollars(item.amount),'Recent order']),
          ]
        } else rows = []
      } else if (type === 'admindashboard') {
        const monthStart=new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)
        const [profilesResult, officesResult, transfersResult, ordersResult] = await Promise.all([
          supabase.from('profiles').select('id,full_name,rank,role,status,created_at').order('created_at',{ascending:false}),
          supabase.from('offices').select('id,active'),
          supabase.from('office_transfers').select('id,status'),
          supabase.from('orders').select('amount,fee_percent,status').gte('created_at',monthStart.toISOString()),
        ])
        error = profilesResult.error || officesResult.error || transfersResult.error || ordersResult.error
        const profiles = profilesResult.data || []; const pending = profiles.filter(item => item.status === 'pending')
        const orders=ordersResult.data||[]; const gross=orders.reduce((sum,item)=>sum+Number(item.amount),0)
        rows = [['Organization orders',`${orders.filter(item=>item.status==='active').length} active · ${orders.filter(item=>item.status==='completed').length} completed`,`$${gross.toLocaleString('en-US',{maximumFractionDigits:2})}`,'This month'],...pending.map(item => [item.full_name, `${item.rank} · ${new Date(item.created_at).toLocaleDateString()}`, 'Review', 'Pending', item.id])]
        metrics = [['Total members',String(profiles.length)],['Orders this month',String(orders.length)]]
      } else if (type === 'offices') {
        const result = await supabase.from('offices').select('id,name,location,leader_display_name,active').order('name')
        error = result.error
        rows = (result.data || []).map(item => [item.name, `${item.leader_display_name || 'Leader not assigned'} · ${item.location}`, item.active ? 'Open' : 'Closed', item.active ? 'Active' : 'Archived', item.id])
        metrics = [['Active offices',String((result.data || []).filter(item => item.active).length)],['Total offices',String(result.data?.length || 0)]]
      } else if (type === 'officedetail') {
        if (!selectedOfficeId) { error = { message:'Choose an office from the directory first.' } }
        else {
          const [officeResult,membershipsResult] = await Promise.all([
            supabase.from('offices').select('id,name,location,leader_id,leader_display_name,active').eq('id',selectedOfficeId).single(),
            supabase.from('office_memberships').select('user_id').eq('office_id',selectedOfficeId).is('ended_at',null),
          ])
          error = officeResult.error || membershipsResult.error
          const office = officeResult.data
          const memberIds = [...new Set([...(membershipsResult.data || []).map(item => item.user_id),...(office?.leader_id?[office.leader_id]:[])])]
          let orders = []; let attendance = []; let plans = []
          if (memberIds.length) {
            const [ordersResult,attendanceResult,plansResult] = await Promise.all([
              supabase.from('orders').select('amount,status').in('user_id',memberIds),
              supabase.from('attendance').select('status').eq('office_id',selectedOfficeId),
              supabase.from('weekly_plans').select('completion_percent').in('user_id',memberIds),
            ])
            error = error || ordersResult.error || attendanceResult.error || plansResult.error
            orders = ordersResult.data || []; attendance = attendanceResult.data || []; plans = plansResult.data || []
          }
          const gross = orders.reduce((sum,item)=>sum+Number(item.amount),0)
          const attended = attendance.filter(item=>item.status === 'present' || item.status === 'late').length
          const attendanceRate = attendance.length ? Math.round(attended / attendance.length * 100) : 0
          const planAverage = plans.length ? Math.round(plans.reduce((sum,item)=>sum+Number(item.completion_percent || 0),0) / plans.length) : 0
          setOfficeDetail(office || null)
          metrics = [['Members',String(memberIds.length)],['Gross orders',`$${gross.toLocaleString('en-US',{maximumFractionDigits:2})}`]]
          rows = [
            ['Office status',office?.active ? 'Members can select this office during registration' : 'Hidden from new registrations',office?.active ? 'Active' : 'Archived',office?.active ? 'Active' : 'Archived'],
            ['Team leader',office?.leader_display_name || 'No leader assigned',office?.location || 'Location pending','Leadership'],
            ['Attendance rate',`${attendance.length} recorded attendance entries`,`${attendanceRate}%`,'Attendance'],
            ['Weekly plans',`${plans.length} submitted plans`,`${planAverage}% average`,'Plans'],
            ['Freelance orders',`${orders.filter(item=>item.status === 'active').length} active · ${orders.filter(item=>item.status === 'completed').length} completed`,`${orders.length} total`,'Orders'],
          ]
        }
      } else if (type === 'leaders' || type === 'orgmembers' || type === 'members') {
        const [profilesResult, membershipsResult, invitationsResult] = await Promise.all([
          supabase.from('profiles').select('id,full_name,rank,role,status,created_at').order('full_name'),
          supabase.from('office_memberships').select('user_id,office:offices(id,name)').is('ended_at',null),
          type === 'leaders' && user.role === 'Administrator' ? supabase.from('team_leader_invitations').select('id,status,claimed_by,created_at,office:offices(id,name),claimant:profiles!team_leader_invitations_claimed_by_fkey(full_name,rank)').in('status',['pending','claimed']).order('created_at',{ascending:false}) : Promise.resolve({data:[],error:null}),
        ])
        error = profilesResult.error || membershipsResult.error || invitationsResult.error
        const officeByUser = Object.fromEntries((membershipsResult.data || []).map(item => [item.user_id,item.office?.name || 'Office pending']))
        if(type === 'members' && user.ledOffice)officeByUser[user.id]=user.ledOffice
        const scopeOfficeId = type === 'members' ? user.ledOfficeId : selectedOfficeId
        const scopedMemberIds = scopeOfficeId ? new Set([...(membershipsResult.data || []).filter(item => item.office?.id === scopeOfficeId).map(item=>item.user_id),...(type === 'members' ? [user.id] : [])]) : null
        const scopeOfficeName = type === 'members' ? user.ledOffice : (membershipsResult.data || []).find(item=>item.office?.id===scopeOfficeId)?.office?.name
        if(scopeOfficeName)setOfficeDetail({id:scopeOfficeId,name:scopeOfficeName})
        const profiles = (profilesResult.data || []).filter(item => ((type === 'orgmembers' || type === 'members') || item.role === 'team_leader') && (!scopedMemberIds || scopedMemberIds.has(item.id)))
        rows = profiles.map(item => [item.full_name, `${officeByUser[item.id] || 'Office pending'} · ${item.rank}`, item.role === 'team_leader' ? 'Team leader' : item.role === 'admin' ? 'Administrator' : 'Member', item.status, item.id])
        if (type === 'leaders') rows = [...(invitationsResult.data || []).map(item => [item.claimant?.full_name || 'Invitation not claimed', `${item.office?.name || 'Office'} · ${item.claimant?.rank || 'Registration link sent'}`, item.claimed_by ? 'Approval requested' : 'Awaiting registration', 'Pending', item.id, item.claimed_by, 'leader-invite']), ...rows]
        metrics = type === 'leaders'
          ? [['Team leaders',String(profiles.length)],['Pending',String(invitationsResult.data?.length || 0)]]
          : [['Members',String(profiles.length)],['Pending approval',String(profiles.filter(item => item.status === 'pending').length)]]
      } else if (type === 'attendanceregister') {
        if (!user.ledOfficeId && user.role !== 'Administrator') error={message:'A team-leader office assignment is required.'}
        else {
          let query=supabase.from('attendance').select('id,user_id,attendance_date,status,checked_in_at,excuse_status,excuse_category,comment,profiles!attendance_user_id_fkey(full_name)').order('attendance_date',{ascending:false}).limit(100)
          if (user.ledOfficeId) query=query.eq('office_id',user.ledOfficeId)
          const result=await query; error=result.error
          rows=(result.data||[]).map(item=>[item.profiles?.full_name||'Office member',`${new Date(`${item.attendance_date}T00:00:00`).toLocaleDateString()} · ${item.checked_in_at?new Date(item.checked_in_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):item.comment||item.excuse_category||'No check-in'}`,item.status==='absent'?(item.excuse_status||'Pending'):item.status,item.status,item.id,item.user_id,item.excuse_status])
          const attended=(result.data||[]).filter(item=>item.status==='present'||item.status==='late').length
          metrics=[['Recorded',String(result.data?.length||0)],['Present / late',String(attended)]]
        }
      }
      if (!cancelled) {
        setMessage(error ? `Could not load live records: ${error.message}` : '')
        setLiveRows(rows); setLiveMetrics(metrics)
      }
    }
    load()
    return () => { cancelled = true }
  }, [type, refreshKey, recordScope, user.id, user.ledOfficeId, activeTab, selectedOfficeId, selectedMemberId, effectiveBookId, selectedTransactionId])
  const displayRows = isLiveModule ? (liveRows || []) : data.rows
  const displayMetrics = isLiveModule ? (liveMetrics || data.metrics) : data.metrics
  const visibleRows = displayRows.filter(row => {
    if (type === 'orders') return activeTab === 0 || (activeTab === 1 ? row[3] === 'active' : row[3] === 'completed')
    if (type === 'offices') return activeTab === 0 ? row[3] === 'Active' : row[3] === 'Archived'
    if (type === 'team') return activeTab === 0 || row[3] === 'Active'
    if (type === 'members') return activeTab === 0 || row[3] === 'pending'
    if (type === 'attendanceregister') return activeTab === 0 || row[3] === 'absent' || row[3] === 'late'
    if (type === 'books') return row[1].includes(activeTab === 0 ? 'NGN' : 'USD')
    if (type === 'announcements') return activeTab === 0 || row[3] === 'office'
    if (type === 'feedback' || type === 'feedbackinbox') return row[2] === (activeTab === 0 ? 'feedback' : 'suggestion')
    if (type === 'events') return activeTab === 0 ? row[3] !== 'Past' : row[3] === 'Past'
    if (type === 'notifications' || type === 'adminnotifications') return activeTab === 0 || row[3] === 'Unread'
    if (type === 'pointsettings') return activeTab === 0 ? row[3] === 'Active' : row[3] === 'Inactive'
    return true
  }).filter(row => !filterQuery.trim() || row.slice(0,4).some(value => String(value || '').toLowerCase().includes(filterQuery.trim().toLowerCase())))
  const displayTabs = type === 'orders' ? [`All ${displayRows.length}`,`Active ${displayRows.filter(row => row[3] === 'active').length}`,`Completed ${displayRows.filter(row => row[3] === 'completed').length}`]
    : type === 'plans' ? ['Current week','Previous weeks']
    : type === 'team' ? [`Direct ${displayRows.length}`,`Active ${displayRows.filter(row=>row[3] === 'Active').length}`]
    : type === 'books' ? ['Naira (NGN)','Dollar (USD)']
    : type === 'admindashboard' ? ['Overview',`Approvals ${displayRows.length}`]
    : type === 'leaderdashboard' ? ['Overview','Team reviews']
    : type === 'offices' ? [`Active ${displayMetrics[0]?.[1] || 0}`,'Archived']
    : type === 'leaders' ? [`Active ${displayMetrics[1]?.[1] || 0}`,'All leaders']
    : type === 'orgmembers' ? [`All ${displayMetrics[0]?.[1] || 0}`,`Pending ${displayMetrics[1]?.[1] || 0}`]
    : type === 'members' ? [`All ${displayMetrics[0]?.[1] || 0}`,`Pending ${displayMetrics[1]?.[1] || 0}`]
    : type === 'attendanceregister' ? [`All ${displayMetrics[0]?.[1] || 0}`,'Exceptions']
    : type === 'announcements' ? [`All ${displayMetrics[0]?.[1] || 0}`,'Office updates']
    : type === 'feedback' || type === 'feedbackinbox' ? ['Feedback','Suggestions']
    : type === 'events' ? [`Upcoming ${displayMetrics[1]?.[1] || 0}`,'Past events']
    : type === 'notifications' || type === 'adminnotifications' ? [`All ${displayMetrics[1]?.[1] || 0}`,`Unread ${displayMetrics[0]?.[1] || 0}`]
    : type === 'pointsettings' ? ['Active rules','Inactive rules']
    : data.tabs
  const liveSubtitle = type === 'offices' ? `${displayMetrics[0]?.[1] || 0} active offices`
    : type === 'officedetail' ? `${officeDetail?.name || 'Selected office'} · ${officeDetail?.location || 'Office overview'}`
    : type === 'leaderdashboard' ? `${user.ledOffice || 'Assigned office'} · Team overview`
    : type === 'members' ? `${user.ledOffice || user.office} · ${displayMetrics[0]?.[1] || 0} members`
    : type === 'attendanceregister' ? `${user.ledOffice || user.office} · Office attendance`
    : type === 'attendance' ? `${recordScope === 'team' ? (user.ledOffice || user.office) : user.office} · ${activeTab === 0 ? 'This week' : 'This month'}`
    : type === 'plans' ? `${recordScope === 'team' ? (user.ledOffice || user.office) : 'Your plan'} · ${activeTab === 0 ? 'Current week' : 'Previous weeks'}`
    : type === 'teamreports' && selectedOfficeId ? `${officeDetail?.name || 'Selected office'} · Live report`
    : type === 'team' ? 'People who selected you as their sponsor'
    : type === 'memberprofile' ? 'Downline performance overview'
    : type === 'leaders' ? `${displayMetrics[0]?.[1] || 0} team leaders`
    : type === 'orgmembers' ? `${displayMetrics[0]?.[1] || 0} ${selectedOfficeId ? `${officeDetail?.name || 'office'} members` : 'organization accounts'}`
    : data.subtitle
  const liveHeroLabel = type === 'leaderdashboard' ? (user.ledOffice || 'Office performance') : type === 'members' ? (user.ledOffice || user.office) : type === 'attendanceregister' ? `${user.ledOffice || user.office} register` : type === 'orders' ? 'Current order earnings' : data.heroLabel
  const approveMember = async memberId => {
    setMessage('Approving member…')
    const { error } = await supabase.rpc('admin_set_profile_status', { target_user_id:memberId, new_status:'active' })
    setMessage(error ? error.message : 'Member approved successfully.')
    if (!error) setRefreshKey(value => value + 1)
  }
  const setMemberStatus = async (memberId, status) => {
    setMessage(`Updating member status…`)
    const { error } = await supabase.rpc('set_office_member_status',{target_user_id:memberId,new_status:status})
    setMessage(error ? error.message : `Member status changed to ${status}.`)
    if (!error) setRefreshKey(value=>value+1)
  }
  const deleteMember = async memberId => {
    if (!window.confirm('Permanently delete this member account and all records that can be safely removed? This cannot be undone.')) return
    setMessage('Deleting member account…')
    const { error } = await supabase.rpc('admin_delete_member_account',{target_user_id:memberId})
    setMessage(error ? error.message : 'Member account permanently deleted.')
    if (!error) setRefreshKey(value=>value+1)
  }
  const deleteOffice = async () => {
    if (!officeDetail || !window.confirm(`Permanently delete ${officeDetail.name}? This works only when the office has no members or linked records.`)) return
    setMessage('Deleting office…')
    const { error } = await supabase.rpc('admin_delete_empty_office',{target_office_id:officeDetail.id})
    setMessage(error ? error.message : 'Office permanently deleted.')
    if (!error) onNavigate('offices')
  }
  const decideTransfer = async (transferId, decision) => {
    setMessage(`${decision === 'approved' ? 'Approving' : 'Rejecting'} transfer…`)
    const { error } = await supabase.rpc('decide_office_transfer',{transfer_id:transferId,decision})
    setMessage(error ? error.message : `Transfer ${decision}.`)
    if(!error) setRefreshKey(value=>value+1)
  }
  const reviewAttendanceExcuse = async (attendanceId, decision) => {
    setMessage(`${decision === 'approved' ? 'Approving' : 'Rejecting'} excuse…`)
    const { error } = await supabase.rpc('review_attendance_excuse',{attendance_id:attendanceId,decision})
    setMessage(error ? error.message : `Attendance excuse ${decision}.`)
    if (!error) setRefreshKey(value => value + 1)
  }
  const updateOrderStatus = async (orderId, status) => {
    setMessage(`${status === 'completed' ? 'Completing' : status === 'active' ? 'Reopening' : 'Cancelling'} order…`)
    const { error } = await supabase.from('orders').update({ status, completed_at:status === 'completed' ? new Date().toISOString() : null, updated_at:new Date().toISOString() }).eq('id',orderId).eq('user_id',user.id)
    setMessage(error ? error.message : `Order marked ${status}.`)
    if (!error) setRefreshKey(value => value + 1)
  }
  const deleteOrder = async orderId => {
    if(!window.confirm('Delete this order permanently? This cannot be undone.'))return
    setMessage('Deleting order…')
    const { error }=await supabase.from('orders').delete().eq('id',orderId).eq('user_id',user.id)
    setMessage(error?error.message:'Order deleted successfully.')
    if(!error)setRefreshKey(value=>value+1)
  }
  const deleteFinanceTransaction = async transactionId => {
    if(!window.confirm('Delete this Finance entry permanently? This cannot be undone.'))return
    setMessage('Deleting Finance entry…')
    const { error }=await supabase.rpc('delete_finance_transaction',{target_transaction_id:transactionId})
    setMessage(error?error.message:'Finance entry deleted successfully.')
    if(!error)setRefreshKey(value=>value+1)
  }
  const completeEvent = async eventId => {
    setMessage('Marking event as done…')
    const { error } = await supabase.rpc('complete_team_event',{target_event_id:eventId})
    setMessage(error ? error.message : 'Event completed. Your points have been updated.')
    if (!error) setRefreshKey(value=>value+1)
  }
  const updateFeedbackStatus = async (messageId,status) => {
    setMessage('Updating message…')
    const { error } = await supabase.rpc('update_feedback_status',{target_message_id:messageId,new_status:status})
    setMessage(error ? error.message : `Message marked ${status}.`)
    if (!error) setRefreshKey(value=>value+1)
  }
  const openNotification = async (notificationId,destination) => {
    await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',notificationId)
    if (destination && screenData[destination]) onNavigate(destination)
    else { setMessage('Notification marked as read.'); setRefreshKey(value=>value+1) }
  }
  const changePointsRule = async (action,points,active) => {
    setMessage('Updating reward rule…')
    const { error }=await supabase.rpc('admin_update_points_rule',{target_action:action,new_points:points,new_active:active,new_naira_per_point:null})
    setMessage(error?error.message:'Reward rule updated.')
    if(!error)setRefreshKey(value=>value+1)
  }
  const changePointsConversion = async () => {
    const entered=window.prompt('How many Naira should one point display as?','1')
    if(entered===null)return
    const rate=Number(entered)
    if(!Number.isFinite(rate)||rate<0){setMessage('Enter a valid conversion rate.');return}
    const firstRule=displayRows[0]?.[4]
    if(!firstRule){setMessage('No reward rule is available.');return}
    const { error }=await supabase.rpc('admin_update_points_rule',{target_action:firstRule,new_points:null,new_active:null,new_naira_per_point:rate})
    setMessage(error?error.message:'Displayed Naira conversion updated for every rule.')
    if(!error)setRefreshKey(value=>value+1)
  }
  const shareUrl = async ({ url, title, text, copiedMessage }) => {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); setMessage('Invitation shared successfully.'); return }
      catch (error) { if (error?.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); setMessage(copiedMessage) }
    catch { window.prompt('Copy this registration link', url) }
  }
  const exportVisibleRows = () => {
    if(!visibleRows.length){setMessage('There are no records to export for this period.');return}
    const protect=value=>{const text=String(value??'');const safe=/^[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`}
    const csv=[['Section','Description','Value','Status'],...visibleRows.map(row=>row.slice(0,4))].map(row=>row.map(protect).join(',')).join('\r\n')
    const blob=new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url
    link.download=`teamflow-${type}-${activeTab===0?'current':'previous'}-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url)
    setMessage('Report downloaded successfully.')
  }
  const shareInviteLink = async () => {
    const officeId = type === 'members' ? user.ledOfficeId : selectedOfficeId || user.ledOfficeId || ''
    if (type === 'members' && !officeId) {
      setMessage('Assign yourself to an office before creating an office invitation.')
      return
    }
    const inviteUrl = new URL(window.location.origin)
    inviteUrl.searchParams.set('register', '1')
    if (officeId) inviteUrl.searchParams.set('office', officeId)
    const officeName = officeDetail?.name || user.ledOffice || user.office || 'TeamFlow'
    await shareUrl({ url:inviteUrl.toString(), title:`Join ${officeName} on TeamFlow`, text:`Create your TeamFlow account and join ${officeName}.`, copiedMessage:officeId ? 'Office registration link copied. Send it to the new member.' : 'General registration link copied. The new member will choose an office.' })
  }
  const shareLeaderInviteLink = async () => {
    if (!officeDetail?.id) { setMessage('Open the office you want this leader to manage first.'); return }
    setMessage('Creating secure team-leader invitation…')
    const { data:token, error } = await supabase.rpc('admin_create_team_leader_invitation',{target_office_id:officeDetail.id})
    if (error) { setMessage(error.message); return }
    const inviteUrl = new URL(window.location.origin)
    inviteUrl.searchParams.set('register','1'); inviteUrl.searchParams.set('office',officeDetail.id); inviteUrl.searchParams.set('leaderInvite',token)
    await shareUrl({url:inviteUrl.toString(),title:`Lead ${officeDetail.name} on TeamFlow`,text:`Register for TeamFlow and request team-leader access for ${officeDetail.name}.`,copiedMessage:'Team-leader invitation copied. Access will remain pending until you approve it.'})
    setRefreshKey(value=>value+1)
  }
  const decideLeaderInvitation = async (invitationId, decision) => {
    setMessage(`${decision === 'approved' ? 'Approving' : 'Revoking'} team-leader request…`)
    const functionName=decision==='approved'?'admin_approve_team_leader_invitation':'admin_revoke_team_leader_invitation'
    const { error }=await supabase.rpc(functionName,{invitation_id:invitationId})
    setMessage(error?error.message:`Team-leader invitation ${decision}.`)
    if(!error)setRefreshKey(value=>value+1)
  }
  const runAction = async () => {
    if (type === 'team' || type === 'members' || type === 'orgmembers') { await shareInviteLink(); return }
    if (type === 'reports' || type === 'teamreports' || type === 'auditlog') { exportVisibleRows(); return }
    if (type === 'rewards') { setMessage('Your point history and the current Naira display value are shown below.'); return }
    if (type === 'transferapprovals') { setActiveTab(0); setMessage('Use Approve or Reject beside each pending transfer.'); return }
    if (type === 'notifications' || type === 'adminnotifications') {
      const { error } = await supabase.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null)
      setMessage(error ? error.message : 'All notifications marked as read.')
      if (!error) setRefreshKey(value => value + 1)
      return
    }
    if (type === 'officedetail' && officeDetail) {
      const nextActive = !officeDetail.active
      setMessage(`${nextActive ? 'Activating' : 'Archiving'} office…`)
      const { error } = await supabase.from('offices').update({active:nextActive}).eq('id',officeDetail.id)
      setMessage(error ? error.message : `Office ${nextActive ? 'activated' : 'archived'} successfully.`)
      if (!error) setRefreshKey(value => value + 1)
      return
    }
    const target = moduleActionTargets[type]
    if (target) onNavigate(target)
    else setMessage(`${data.action} selected. This workflow will be connected to live records next.`)
  }
  const filterable = ['activity','orders','plans','books','attendance','withdrawals','team','announcements','feedback','events','notifications','adminnotifications','members','attendanceregister','transferapprovals','feedbackinbox','admindashboard','offices','leaders','orgmembers','transfers','reports','teamreports','auditlog','pointsettings'].includes(type)
  return <main className="detail-screen"><header className="detail-header"><button className="icon-button" aria-label="Go back" onClick={onBack}><ArrowLeft /></button><div><h1>{data.title}</h1><span>{liveSubtitle}</span></div><button className="icon-button" aria-label="Open notifications" onClick={() => onNavigate(type.startsWith('admin') ? 'adminnotifications' : 'notifications')}><Bell /></button></header><div className="detail-content">
    <section className={`detail-hero ${type}`}><div className="detail-hero-title"><span><Icon weight="duotone" /></span><small>{liveHeroLabel || (type === 'books' ? 'Finance overview' : type === 'plans' ? 'Weekly progress' : 'Monthly attendance')}</small></div><div className="metric-pair">{displayMetrics.map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><button className="primary" onClick={runAction}>{type === 'officedetail' ? (officeDetail?.active ? <><CheckCircle />Archive office</> : <><CheckCircle />Activate office</>) : <><Plus weight="bold" />{data.action}</>}</button>{type === 'attendance' && <button className="detail-secondary" onClick={() => onNavigate('absence')}>Report absence</button>}</section>
    {(type === 'orders' || type === 'attendance' || type === 'plans' || type === 'books') && (user.isTeamLeader || user.role === 'Administrator') && <div className="segment-control scope-control"><button className={recordScope === 'mine' ? 'active' : ''} onClick={() => { setRecordScope('mine'); setActiveTab(0); setMessage('') }}>{type === 'orders' ? 'My orders' : type === 'attendance' ? 'My attendance' : type === 'plans' ? 'My plan' : 'My Finance'}</button><button className={recordScope === 'team' ? 'active' : ''} onClick={() => { setRecordScope('team'); setActiveTab(0); setMessage('') }}>{type === 'orders' ? (user.role === 'Administrator' ? 'Organization orders' : 'Team orders') : type === 'attendance' ? 'Office attendance' : type === 'plans' ? 'Team plans' : 'Office Finance'}</button></div>}
    <div className="segment-control">{displayTabs.map((tab,i) => <button className={i === activeTab ? 'active' : ''} onClick={() => { setActiveTab(i); setMessage('') }} key={tab}>{tab}</button>)}</div>
    {type === 'admindashboard' && <div className="admin-shortcuts"><button onClick={() => onNavigate('offices')}><Briefcase />Offices</button><button onClick={() => onNavigate('leaders')}><Users />Leaders</button><button onClick={() => onNavigate('orgmembers')}><Users />Members</button><button onClick={() => onNavigate('transfers')}><ArrowRight />Transfers</button><button onClick={() => onNavigate('reports')}><TrendUp />Reports</button><button onClick={() => onNavigate('pointsettings')}><Sparkle />Rewards</button><button onClick={() => onNavigate('auditlog')}><CheckCircle />Audit</button></div>}
    {type === 'officedetail' && <><div className="admin-shortcuts"><button onClick={() => onNavigate('teamreports')}><TrendUp />View report</button><button onClick={() => onNavigate('orgmembers')}><Users />Office members</button><button onClick={() => onNavigate('leaders')}><Users />Leaders</button>{user.role === 'Administrator' && <button onClick={shareLeaderInviteLink}><Plus />Invite team leader</button>}</div>{user.role === 'Administrator' && <button className="danger-action" onClick={deleteOffice}>Permanently delete empty office</button>}</>}
    {type === 'books' && recordScope === 'mine' && <div className="admin-shortcuts"><button onClick={() => onNavigate('createbook')}><BookOpen />New book</button><button onClick={() => onNavigate('withdrawals')}><Wallet />Withdrawals</button></div>}
    {type === 'leaderdashboard' && <div className="admin-shortcuts"><button onClick={() => onNavigate('members')}><Users />Members</button><button onClick={() => onNavigate('transferapprovals')}><ArrowRight />Transfers</button><button onClick={() => onNavigate('teamreports')}><TrendUp />Reports</button></div>}
    {message && <div className="interaction-message" role="status">{message}</div>}
    {type === 'pointsettings' && user.role === 'Administrator' && <section className="reward-controls"><button className="detail-secondary" onClick={changePointsConversion}>Change Naira conversion</button>{visibleRows.map(row=><div className="reward-control-row" key={row[4]}><span><strong>{row[0]}</strong><small>{row[2]} · {row[3]}</small></span><span className="row-actions"><button onClick={()=>changePointsRule(row[4],Math.max(0,Number(row[6])-10),row[3]==='Active')}>−10</button><button onClick={()=>changePointsRule(row[4],Number(row[6])+10,row[3]==='Active')}>+10</button><button onClick={()=>changePointsRule(row[4],Number(row[6]),row[3]!=='Active')}>{row[3]==='Active'?'Disable':'Enable'}</button></span></div>)}</section>}
    {(type === 'books'||type==='bookdetail') && <section className="records finance-actions"><div className="section-title"><h2>{type==='bookdetail'?'Transactions':recordScope==='mine'?'Your Finance books':'Office Finance books'}</h2>{filterable&&<button onClick={()=>{setFilterOpen(value=>!value);if(filterOpen)setFilterQuery('')}}>{filterOpen?'Close':'Filter'}</button>}</div>{filterOpen&&<input className="record-filter" value={filterQuery} onChange={event=>setFilterQuery(event.target.value)} placeholder="Search Finance records" autoFocus/>}{visibleRows.length?visibleRows.map(([title,meta,value,status,recordId,recordOwnerId,wasEdited,bookId],index)=><article key={recordId||bookId||`book-${title}-${index}`}><span className={`record-symbol ${status}`}><BookOpen /></span><div><strong>{title}</strong><small>{meta}{wasEdited?' · Edited':''}</small><b>{value}</b></div>{status==='book'?<button className="row-action" onClick={()=>onSelectBook(bookId)}>Open</button>:recordId&&recordOwnerId===user.id?<span className="row-actions"><button onClick={()=>onEditFinance(recordId)}>Edit</button><button onClick={()=>onViewFinanceHistory(recordId)}>History</button><button className="danger" onClick={()=>deleteFinanceTransaction(recordId)}>Delete</button></span>:<span className="record-value"><small>View only</small></span>}</article>):<div className="live-empty">{type==='bookdetail'?'No transactions yet. Use Add entry to record income or an expense.':'No Finance books yet. Create a book to begin.'}</div>}</section>}
    <section className="records"><div className="section-title"><h2>{data.listTitle || (type === 'plans' ? (recordScope === 'team' ? 'Team submissions' : 'Your plan') : type === 'attendance' ? (recordScope === 'team' ? 'Office register' : 'Daily history') : 'Recent records')}</h2>{filterable && <button onClick={() => { setFilterOpen(value=>!value); if(filterOpen)setFilterQuery('') }}>{filterOpen?'Close':'Filter'}</button>}</div>{filterOpen && filterable && <input className="record-filter" value={filterQuery} onChange={event=>setFilterQuery(event.target.value)} placeholder="Search these records" autoFocus />}{visibleRows.length ? visibleRows.map(([title,meta,value,status,recordId,recordOwnerId,reviewState], index) => type === 'offices' ? <button className="office-directory-row" key={recordId} onClick={() => onSelectOffice(recordId)}><span className={`record-symbol ${status.toLowerCase()}`}><Briefcase /></span><span><strong>{title}</strong><small>{meta}</small></span><span className="record-value"><b>{value}</b><small>{status}</small></span><ArrowRight /></button> : type === 'team' ? <button className="office-directory-row" key={recordId} onClick={() => onSelectMember(recordId)}><span className={`record-symbol ${status.toLowerCase().replaceAll(' ','-')}`}><Users /></span><span><strong>{title}</strong><small>{meta}</small></span><span className="record-value"><b>{value}</b><small>{status}</small></span><ArrowRight /></button> : <article key={`${title}-${index}`}><span className={`record-symbol ${status.toLowerCase().replaceAll(' ','-')}`}><Icon /></span><div><strong>{title}</strong><small>{meta}</small></div>{type === 'leaders' && reviewState === 'leader-invite' ? <span className="row-actions">{recordOwnerId && <button onClick={()=>decideLeaderInvitation(recordId,'approved')}>Approve</button>}<button className="danger" onClick={()=>decideLeaderInvitation(recordId,'revoked')}>Revoke</button></span> : (type === 'orgmembers' || type === 'members') && recordId !== user.id ? <span className="row-actions member-actions">{status !== 'active' && <button onClick={() => setMemberStatus(recordId,'active')}>Approve</button>}{status === 'active' && <button onClick={() => setMemberStatus(recordId,'suspended')}>Suspend</button>}{status === 'suspended' && <button onClick={() => setMemberStatus(recordId,'pending')}>Set pending</button>}{user.role === 'Administrator' && <button className="danger" onClick={() => deleteMember(recordId)}>Delete</button>}</span> : type === 'plans' && recordScope === 'team' && !reviewState ? <button className="row-action" onClick={() => onReviewPlan(recordId)}>Review</button> : type === 'attendance' && recordScope === 'team' && status === 'absent' && reviewState === 'pending' ? <span className="row-actions"><button onClick={() => reviewAttendanceExcuse(recordId,'approved')}>Approve</button><button onClick={() => reviewAttendanceExcuse(recordId,'rejected')}>Reject</button></span> : type === 'orders' && recordOwnerId === user.id ? <span className="row-actions"><button onClick={() => onEditOrder(recordId)}>Edit</button>{status === 'active' ? <><button onClick={() => updateOrderStatus(recordId,'completed')}>Complete</button><button onClick={() => updateOrderStatus(recordId,'cancelled')}>Cancel</button></> : <button onClick={() => updateOrderStatus(recordId,'active')}>Reopen</button>}<button className="danger" onClick={()=>deleteOrder(recordId)}>Delete</button></span> : type === 'events' && status !== 'Done' ? <button className="row-action" onClick={() => completeEvent(recordId)}>Mark done</button> : type === 'feedbackinbox' && status !== 'resolved' ? <span className="row-actions"><button onClick={() => updateFeedbackStatus(recordId,'open')}>Open</button><button onClick={() => updateFeedbackStatus(recordId,'resolved')}>Resolve</button></span> : (type === 'notifications' || type === 'adminnotifications') ? <button className="row-action" onClick={() => openNotification(recordId,recordOwnerId)}>Open</button> : type === 'admindashboard' && status === 'Pending' ? <button className="row-action" onClick={() => approveMember(recordId)}>Approve</button> : (type === 'transfers' || type === 'transferapprovals') && status === 'Pending' && (user.role === 'Administrator' || user.role === 'Team leader' || user.isTeamLeader) ? <span className="row-actions"><button onClick={()=>decideTransfer(recordId,'approved')}>Approve</button><button onClick={()=>decideTransfer(recordId,'rejected')}>Reject</button></span> : <span className="record-value"><b>{value}</b><small>{status}</small></span>}</article>) : <div className="live-empty">{filterQuery ? 'No records match your search.' : type === 'admindashboard' ? 'No registrations are awaiting approval.' : type === 'offices' ? `No ${activeTab === 0 ? 'active' : 'archived'} offices.` : type === 'orders' && activeTab > 0 ? `No ${activeTab === 1 ? 'active' : 'completed'} orders yet.` : type === 'team' ? 'No active downlines yet. Members will appear here after selecting you as their sponsor.' : 'No live records yet. Use the action above to add the first one.'}</div>}</section>
    {type === 'plans' && <aside className="info-note"><Sparkle /><div><strong>Friday review</strong><p>Your team leader will score this plan after the weekly cross-check.</p></div></aside>}
    {type === 'books' && <aside className="info-note"><CheckCircle /><div><strong>Currencies stay separate</strong><p>Naira and Dollar balances are calculated independently and are never added together.</p></div></aside>}
    {data.note && <aside className="info-note"><CheckCircle /><div><strong>{data.note[0]}</strong><p>{type === 'leaderdashboard' ? `You can review records for members assigned to ${user.ledOffice || 'your office'}. Other leaders’ personal records remain private.` : data.note[1]}</p></div></aside>}
  </div></main>
}

const formData = {
  editprofile: {
    title: 'Edit profile', subtitle: 'Update your personal account details', submit: 'Save profile',
    notice: 'Your organization role, rank, office and sponsor cannot be changed from this form.',
    fields: [['Full name','','profile-name'],['Phone number','','profile-phone']]
  },
  assignleader: {
    title: 'Assign team leader', subtitle: 'Promote a registered person and link an office', submit: 'Assign team leader',
    notice: 'The person becomes active and receives team-leader access for the selected office. Offices that already have a linked leader cannot be replaced here.',
    fields: [
      ['Registered person','Select a person','dynamic-member'],
      ['Office','Select an office','dynamic-office'],
    ]
  },
  addoffice: {
    title: 'Add office', subtitle: 'Create an organization office', submit: 'Create office',
    notice: 'The office becomes available during registration immediately. You can link the leader’s account later.',
    fields: [
      ['Office name','','text'],
      ['Location','','text'],
      ['Team leader name','','text'],
    ]
  },
  checkin: {
    title: 'Office check-in', subtitle: 'Record today’s attendance', submit: 'Confirm check-in',
    notice: 'Your arrival time is recorded when you confirm. Report an absence only when you could not attend.',
    fields: [
      ['Office','Your selected office','profile-office'],
      ['Attendance date','','today-readonly'],
      ['Arrival status','Present','arrival-status'],
      ['Optional note','','textarea'],
    ]
  },
  markattendance: {
    title: 'Mark team attendance', subtitle: 'Record attendance for an office member', submit: 'Save attendance',
    notice: 'You can record attendance only for members assigned to the office you lead. Marking an absence requires a category and explanation.',
    fields: [
      ['Office member','Select a member','dynamic-office-member'],
      ['Attendance status','Present','attendance-status'],
      ['Excuse category','Health','absence-category'],
      ['Comment or explanation','','textarea'],
    ]
  },
  addorder: {
    title: 'Add order', subtitle: 'Create a freelance work record', submit: 'Save order',
    notice: 'Order values are recorded in US dollars. An order counts toward completed earnings only after you mark it completed.',
    fields: [
      ['Project name','Brand identity package','text'],
      ['Amount (USD)','185','number'],
      ['Platform','Upwork','order-platform'],
      ['Custom platform fee (%)','0','percentage'],
      ['Status','Active','order-status'],
      ['Notes','Logo system, brand guide and social templates.','textarea'],
    ]
  },
  editorder: {
    title: 'Edit order', subtitle: 'Update project details, status and platform fee', submit: 'Save changes',
    notice: 'Upwork uses a 10% fee and Fiverr uses 20%. For Direct client or Other, enter the actual fee percentage agreed.',
    fields: [
      ['Project name','','order-edit-name'],
      ['Amount (USD)','','order-edit-amount'],
      ['Platform','Upwork','order-edit-platform'],
      ['Custom platform fee (%)','0','order-edit-fee'],
      ['Status','Active','order-edit-status'],
      ['Notes','','order-edit-notes'],
    ]
  },
  addentry: {
    title: 'Add finance entry', subtitle: 'Record income or an expense', submit: 'Add transaction',
    notice: 'The selected book determines the currency. Edited entries retain a visible history.',
    fields: [
      ['Finance book','Select a book','dynamic-book'],
      ['Entry type','Credit (+)','finance-entry-type'],
      ['Amount','148000','number'],
      ['Description','Brand identity payment','text'],
      ['Transaction date','','today-readonly'],
      ['Notes','Final payment received from client.','textarea'],
    ]
  },
  editfinance: {
    title: 'Edit Finance entry', subtitle: 'Update the record while preserving its history', submit: 'Save changes',
    notice: 'The previous values remain available from the entry’s History button.',
    fields: [
      ['Entry type','Credit (+)','finance-edit-type'],
      ['Amount','0','finance-edit-amount'],
      ['Description','','finance-edit-description'],
      ['Transaction date','','finance-edit-date'],
      ['Notes','','finance-edit-notes'],
    ]
  },
  createbook: {
    title: 'Create Finance book', subtitle: 'Separate balances by purpose and currency', submit: 'Create book',
    notice: 'A book’s currency cannot be mixed with another currency. Office-visible books can be included in team-leader reports.',
    fields: [
      ['Book name','Personal Finance','text'],
      ['Currency','NGN','book-currency'],
      ['Visibility','Personal','book-visibility'],
    ]
  },
  recordwithdrawal: {
    title: 'Record withdrawal', subtitle: 'Create a withdrawal and linked debit', submit: 'Save withdrawal',
    notice: 'The withdrawal cannot exceed the available balance in the selected book.',
    fields: [
      ['Finance book','Select a book','dynamic-book'],
      ['Amount','1000','number'],
      ['Notes','Withdrawal purpose or reference.','textarea'],
    ]
  },
  transfer: {
    title: 'Change office', subtitle: 'Request an organization transfer', submit: 'Submit request',
    notice: 'Your current office remains active until the new team leader approves this request.',
    fields: [
      ['Current office','Current office','profile-office'],
      ['New office','Select a new office','dynamic-transfer-office'],
      ['Reason for transfer','Relocated closer to Lekki and need easier access to sessions.','textarea'],
      ['Effective date','8 September 2026','text'],
    ]
  },
  absence: {
    title: 'Report absence', subtitle: 'Explain a missed office day', submit: 'Send excuse',
    notice: 'Your team leader will review the excuse. The attendance record remains absent until reviewed.',
    fields: [
      ['Date absent','','today-readonly'],
      ['Excuse category','Health','absence-category'],
      ['Explanation','I was unwell and unable to attend the morning office session.','textarea'],
      ['Supporting note','No document attached','readonly'],
    ]
  },
  editplan: {
    title: 'Edit weekly plan', subtitle: '1–7 September · Week 36', submit: 'Save weekly plan',
    notice: 'Your first submission does not count as an edit. After three later edits, the plan becomes read-only.',
    fields: [
      ['Primary goal','Deliver two client projects','text'],
      ['Prospecting target','Contact five new prospects','text'],
      ['Attendance goal','Attend all office sessions','text'],
      ['Expected outcome','Complete priority projects and grow the client pipeline.','textarea'],
      ['Completion (%)','0','percentage'],
      ['Review status','Pending Friday review','readonly'],
    ]
  },
  reviewplan: {
    title: 'Review weekly plan', subtitle: 'Friday team-leader review', submit: 'Submit review',
    notice: 'Submitting the review records your score, rating, notes and review time. The member will see the result.',
    fields: [
      ['Completion score (%)','0','percentage'],
      ['Rating','Good','plan-rating'],
      ['Review note','Add a short explanation for the member.','textarea'],
    ]
  },
  sendfeedback: {
    title: 'Send feedback', subtitle: 'Speak directly to a leader', submit: 'Send message',
    notice: 'Feedback addressed to Admin is visible to Admin. Your team leader only sees messages sent directly to them.',
    fields: [
      ['Message type','Feedback','message-type'],
      ['Send to','Team leader','feedback-recipient'],
      ['Subject','Weekly review timing','text'],
      ['Message','Could Friday reviews begin earlier so members can respond before the weekend?','textarea'],
    ]
  },
  createannouncement: {
    title: 'Create announcement', subtitle: 'Broadcast an organization update', submit: 'Publish announcement',
    notice: 'Team leaders can broadcast to their office. Only Admin can target everyone across all offices.',
    fields: [
      ['Audience','Organization','announcement-audience'],
      ['Office','Select an office','communication-office'],
      ['Individual recipient','Select a member','announcement-recipient'],
      ['Title','Friday review starts at 4 PM','text'],
      ['Message','Please submit all weekly updates before the review session begins.','textarea'],
    ]
  },
  createevent: {
    title: 'Create event', subtitle: 'Schedule an office activity', submit: 'Create event',
    notice: 'Members mark completion individually. Their action does not close the event for anyone else.',
    fields: [
      ['Event name','Growth strategy session','text'],
      ['Audience','Organization','event-audience'],
      ['Office','Select an office','communication-office'],
      ['Date and time','','datetime'],
      ['Location','Office training room','text'],
      ['Description','Bring your weekly plan and strategy workbook.','textarea'],
    ]
  },
  addpointrule: {
    title: 'Add reward rule', subtitle: 'Create a new points-earning action', submit: 'Save reward rule',
    notice: 'Use a short unique action code. Members receive these points only when the corresponding activity awards that action.',
    fields: [
      ['Rule name','Training completed','text'],
      ['Action code','training_completed','text'],
      ['Points','25','number'],
    ]
  }
}

function FormPage({ type, onBack, selectedPlanId, selectedOrderId, selectedTransactionId, user }) {
  const data = formData[type]
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [leaderCandidates, setLeaderCandidates] = useState([])
  const [availableLeaderOffices, setAvailableLeaderOffices] = useState([])
  const [transferOffices, setTransferOffices] = useState([])
  const [userBooks, setUserBooks] = useState([])
  const [communicationOffices, setCommunicationOffices] = useState([])
  const [announcementRecipients, setAnnouncementRecipients] = useState([])
  const [officeMembers, setOfficeMembers] = useState([])
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingFinance, setEditingFinance] = useState(null)
  const planWeekSubtitle = (() => {
    const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    return `${monday.toLocaleDateString('en-NG',{day:'numeric',month:'short'})} – ${sunday.toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}`
  })()
  useEffect(() => {
    if (type === 'editorder' && selectedOrderId) {
      supabase.from('orders').select('id,project_name,amount,platform,fee_percent,status,notes,completed_at').eq('id',selectedOrderId).eq('user_id',user.id).single().then(({data,error})=>{setEditingOrder(data || null);if(error)setSubmitMessage(error.message)})
      return
    }
    if (type === 'editfinance' && selectedTransactionId) {
      supabase.from('cash_transactions').select('id,entry_type,amount,description,transaction_date,notes').eq('id',selectedTransactionId).single().then(({data,error})=>{setEditingFinance(data||null);if(error)setSubmitMessage(error.message)})
      return
    }
    if (type === 'createannouncement' || type === 'createevent') {
      Promise.all([
        supabase.from('offices').select('id,name,location').eq('active',true).order('name'),
        supabase.from('profiles').select('id,full_name,role,status').neq('status','suspended').order('full_name'),
      ]).then(([officesResult,peopleResult])=>{
        setCommunicationOffices(officesResult.data || [])
        setAnnouncementRecipients(peopleResult.data || [])
        if (officesResult.error || peopleResult.error) setSubmitMessage(officesResult.error?.message || peopleResult.error?.message)
      })
    }
    if (type === 'addentry' || type === 'recordwithdrawal') {
      supabase.from('cash_books').select('id,name,currency').eq('owner_id',user.id).order('name').then(({data,error})=>{ setUserBooks(data || []); if(error) setSubmitMessage(error.message) })
    }
    if (type === 'markattendance') {
      if (!user.ledOfficeId) { setSubmitMessage('You need an assigned team-leader office before marking team attendance.'); return }
      supabase.from('office_memberships').select('user_id,profile:profiles!office_memberships_user_id_fkey(full_name,status)').eq('office_id',user.ledOfficeId).is('ended_at',null).then(({data,error})=>{
        setOfficeMembers((data || []).filter(item=>item.profile?.status!=='suspended'))
        if(error)setSubmitMessage(error.message)
      })
      return
    }
    if (type === 'transfer') {
      supabase.from('offices').select('id,name,location').eq('active',true).neq('name',user.office).order('name').then(({data,error}) => { setTransferOffices(data || []); if(error) setSubmitMessage(error.message) })
      return
    }
    if (type !== 'assignleader') return
    Promise.all([
      supabase.from('profiles').select('id,full_name,rank,status').neq('role','admin').neq('role','team_leader').order('full_name'),
      supabase.from('offices').select('id,name,location').eq('active',true).is('leader_id',null).order('name'),
    ]).then(([peopleResult, officesResult]) => {
      setLeaderCandidates(peopleResult.data || [])
      setAvailableLeaderOffices(officesResult.data || [])
      if (peopleResult.error || officesResult.error) setSubmitMessage(peopleResult.error?.message || officesResult.error?.message)
    })
  }, [type, user.id, user.office, selectedOrderId, selectedTransactionId])
  const submitForm = async event => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitMessage('')
    const values = new FormData(event.currentTarget)
    const value = label => String(values.get(label) || '').trim()
    const numericAmount = label => Number(value(label).replace(/[^0-9.]/g, ''))
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    let error = null
    if (type === 'editprofile') {
      ;({ error } = await supabase.rpc('update_my_profile', { new_full_name:value('Full name'), new_phone:value('Phone number') || null }))
    } else if (type === 'transfer') {
      ;({ error } = await supabase.rpc('request_office_transfer', { target_office_id:value('New office'), transfer_reason:value('Reason for transfer') }))
    } else if (type === 'createannouncement') {
      const audience=value('Audience')
      ;({ error } = await supabase.rpc('publish_targeted_announcement', { announcement_title:value('Title'), announcement_message:value('Message'), target_audience:audience, target_office_id:value('Office') || null, target_user_id:value('Individual recipient') || null }))
    } else if (type === 'sendfeedback') {
      ;({ error } = await supabase.rpc('submit_feedback', { feedback_type:value('Message type').toLowerCase() === 'suggestion' ? 'suggestion' : 'feedback', feedback_subject:value('Subject'), feedback_message:value('Message'), send_to_admin:value('Send to').toLowerCase().includes('admin') }))
    } else if (type === 'createevent') {
      const eventDate = value('Date and time') ? new Date(value('Date and time')).toISOString() : null
      ;({ error } = await supabase.rpc('create_targeted_event', { event_name:value('Event name'), event_description:value('Description') || null, event_location:value('Location') || null, event_starts_at:eventDate, target_audience:value('Audience'), target_office_id:value('Office') || null }))
    } else if (type === 'assignleader') {
      ;({ error } = await supabase.rpc('admin_assign_team_leader', { target_user_id:value('Registered person'), target_office_id:value('Office') }))
    } else if (type === 'addoffice') {
      ;({ error } = await supabase.rpc('admin_create_office', { office_name:value('Office name'), office_location:value('Location'), office_leader_name:value('Team leader name') || null }))
    } else if (type === 'addorder') {
      const platform=value('Platform'); const fee=platform==='Upwork'?10:platform==='Fiverr'?20:numericAmount('Custom platform fee (%)')
      ;({ error } = await supabase.from('orders').insert({ user_id:userId, project_name:value('Project name'), amount:numericAmount('Amount (USD)'), platform, fee_percent:fee, status:value('Status').toLowerCase(), completed_at:value('Status').toLowerCase()==='completed'?new Date().toISOString():null, notes:value('Notes') || null }))
    } else if (type === 'editorder') {
      const platform=value('Platform'); const status=value('Status').toLowerCase(); const fee=platform==='Upwork'?10:platform==='Fiverr'?20:numericAmount('Custom platform fee (%)')
      if(!selectedOrderId)error={message:'Choose one of your orders before editing.'}
      else ({error}=await supabase.from('orders').update({project_name:value('Project name'),amount:numericAmount('Amount (USD)'),platform,fee_percent:fee,status,completed_at:status==='completed'?(editingOrder?.completed_at || new Date().toISOString()):null,notes:value('Notes')||null,updated_at:new Date().toISOString()}).eq('id',selectedOrderId).eq('user_id',userId))
    } else if (type === 'checkin') {
      ;({ error } = await supabase.rpc('submit_attendance', { attendance_status:value('Arrival status').toLowerCase(), attendance_note:value('Optional note') || null, absence_category:null }))
    } else if (type === 'markattendance') {
      const status=value('Attendance status').toLowerCase()
      ;({ error } = await supabase.rpc('leader_record_attendance', { target_user_id:value('Office member'), attendance_status:status, attendance_note:value('Comment or explanation') || null, absence_category:status==='absent' ? value('Excuse category') : null }))
    } else if (type === 'absence') {
      ;({ error } = await supabase.rpc('submit_attendance', { attendance_status:'absent', attendance_note:value('Explanation'), absence_category:value('Excuse category') }))
    } else if (type === 'addentry') {
      ;({ error } = await supabase.rpc('add_finance_transaction', { target_book_id:value('Finance book'), transaction_type:value('Entry type').toLowerCase().startsWith('credit') ? 'credit' : 'debit', transaction_amount:numericAmount('Amount'), transaction_description:value('Description'), transaction_day:new Date().toISOString().slice(0,10), transaction_notes:value('Notes') || null }))
    } else if (type === 'createbook') {
      ;({ error } = await supabase.rpc('create_finance_book',{book_name:value('Book name'),book_currency:value('Currency'),book_visibility:value('Visibility').toLowerCase()}))
    } else if (type === 'recordwithdrawal') {
      ;({ error } = await supabase.rpc('record_finance_withdrawal',{target_book_id:value('Finance book'),withdrawal_amount:numericAmount('Amount'),withdrawal_notes:value('Notes') || null}))
    } else if (type === 'editfinance') {
      if(!selectedTransactionId) error={message:'Choose one of your Finance entries before editing.'}
      else ({error}=await supabase.rpc('update_finance_transaction',{target_transaction_id:selectedTransactionId,transaction_type:value('Entry type').toLowerCase().startsWith('credit')?'credit':'debit',transaction_amount:numericAmount('Amount'),transaction_description:value('Description'),transaction_day:value('Transaction date'),transaction_notes:value('Notes')||null}))
    } else if (type === 'editplan') {
      const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      const weekStart = monday.toISOString().slice(0,10)
      const { data: existing } = await supabase.from('weekly_plans').select('edit_count').eq('user_id', userId).eq('week_start', weekStart).maybeSingle()
      if ((existing?.edit_count || 0) >= 3) error = { message:'This plan has reached its three-edit limit.' }
      else ({ error } = await supabase.from('weekly_plans').upsert({ user_id:userId, week_start:weekStart, primary_goal:value('Primary goal'), prospecting_target:value('Prospecting target'), attendance_goal:value('Attendance goal'), expected_outcome:value('Expected outcome'), completion_percent:numericAmount('Completion (%)'), edit_count:existing ? existing.edit_count + 1 : 0, updated_at:new Date().toISOString() }, { onConflict:'user_id,week_start' }))
    } else if (type === 'reviewplan') {
      if (!selectedPlanId) error = { message:'Choose a submitted team plan first.' }
      else ({ error } = await supabase.rpc('review_weekly_plan', { plan_id:selectedPlanId, completion_score:numericAmount('Completion score (%)'), rating:value('Rating').toLowerCase(), leader_note:value('Review note') }))
    } else if (type === 'addpointrule') {
      const action=value('Action code').toLowerCase().replace(/[^a-z0-9_]+/g,'_')
      ;({ error } = await supabase.rpc('admin_create_points_rule',{target_action:action,rule_points:numericAmount('Points')}))
    }
    setSubmitting(false)
    if (error) {
      const duplicateBook=error.message?.includes('cash_books_owner_id_name_currency_key') || error.code==='23505'
      setSubmitMessage(duplicateBook?'You already have a Finance book with this name and currency. Open the existing book or choose a different name.':error.message)
    } else if (type === 'createbook' || type === 'addentry') {
      onBack()
    } else {
      setSubmitMessage('Saved successfully. Your live dashboard will now include this record.')
    }
  }
  if(type==='addentry'){
    const preferredBookId=window.sessionStorage.getItem('teamflowSelectedBook')||''
    return <main className="form-screen"><header className="detail-header"><button className="icon-button" aria-label="Go back" onClick={onBack}><ArrowLeft /></button><div><h1>{data.title}</h1><span>{data.subtitle}</span></div></header><div className="form-content"><div className="form-progress"><span>Finance record</span><strong>{preferredBookId?'Selected book ready':'Choose a Finance book'}</strong></div><form className="record-form" onSubmit={submitForm}><label>Finance book<select name="Finance book" required defaultValue={preferredBookId}><option value="" disabled>{userBooks.length?'Select a book':'Create a Finance book first'}</option>{userBooks.map(book=><option value={book.id} key={book.id}>{book.name} · {book.currency}</option>)}</select></label><label>Entry type<select name="Entry type" defaultValue="Credit (+)"><option>Credit (+)</option><option>Debit (-)</option></select></label><label>Amount<input name="Amount" required type="number" min="0.01" step="0.01" placeholder="0.00"/></label><label>Description<input name="Description" required maxLength="160" placeholder="What was this payment for?"/></label><label>Notes<textarea name="Notes" maxLength="1000" placeholder="Optional reference or explanation"/></label><aside className="info-note"><CheckCircle /><div><strong>Currency follows the book</strong><p>The selected book determines whether this entry is recorded in Naira or Dollars.</p></div></aside>{submitMessage&&<div className="interaction-message" role="status">{submitMessage}</div>}<button className="primary form-submit" disabled={submitting||!userBooks.length} type="submit">{submitting?'Saving…':data.submit}<ArrowRight /></button></form></div></main>
  }
  if (type === 'editfinance') return <main className="form-screen"><header className="detail-header"><button className="icon-button" aria-label="Go back" onClick={onBack}><ArrowLeft /></button><div><h1>{data.title}</h1><span>{data.subtitle}</span></div></header><div className="form-content"><div className="form-progress"><span>Finance record</span><strong>Every change is recorded</strong></div>{editingFinance ? <form key={editingFinance.id} className="record-form" onSubmit={submitForm}><label>Entry type<select name="Entry type" defaultValue={editingFinance.entry_type==='credit'?'Credit (+)':'Debit (-)'}><option>Credit (+)</option><option>Debit (-)</option></select></label><label>Amount<input name="Amount" required type="number" min="0.01" step="0.01" defaultValue={editingFinance.amount}/></label><label>Description<input name="Description" required maxLength="160" defaultValue={editingFinance.description}/></label><label>Transaction date<input name="Transaction date" required type="date" defaultValue={editingFinance.transaction_date}/></label><label>Notes<textarea name="Notes" maxLength="1000" defaultValue={editingFinance.notes||''}/></label><aside className="info-note"><CheckCircle /><div><strong>History stays visible</strong><p>{data.notice}</p></div></aside>{submitMessage&&<div className={`interaction-message ${submitMessage.startsWith('Saved')?'success':''}`} role="status">{submitMessage}</div>}<button className="primary form-submit" disabled={submitting} type="submit">{submitting?'Saving…':data.submit}<ArrowRight /></button></form>:<div className="live-empty">Loading Finance entry…</div>}</div></main>
  return <main className="form-screen"><header className="detail-header"><button className="icon-button" onClick={onBack}><ArrowLeft /></button><div><h1>{data.title}</h1><span>{type === 'editplan' ? planWeekSubtitle : data.subtitle}</span></div></header><div className="form-content">
    <div className="form-progress"><span>New record</span><strong>Required fields</strong></div>
      <form key={editingOrder?.id || type} className="record-form" onSubmit={submitForm}>{data.fields.map(([label,value,kind]) => <label key={label}>{label}{kind === 'textarea' ? <textarea name={label} defaultValue={value} /> : kind === 'order-edit-notes' ? <textarea name={label} defaultValue={editingOrder?.notes || ''} /> : kind === 'order-edit-name' ? <input name={label} required defaultValue={editingOrder?.project_name || ''} /> : kind === 'order-edit-amount' ? <input name={label} required type="number" min="0" step="0.01" defaultValue={editingOrder?.amount || ''} /> : kind === 'order-edit-fee' ? <input name={label} type="number" min="0" max="100" step="0.01" defaultValue={editingOrder?.fee_percent || 0} /> : kind === 'order-edit-platform' ? <select name={label} defaultValue={editingOrder?.platform || 'Upwork'}><option>Upwork</option><option>Fiverr</option><option>Direct client</option><option>LinkedIn</option><option>Other</option></select> : kind === 'order-edit-status' ? <select name={label} defaultValue={(editingOrder?.status || 'active').replace(/^./,letter=>letter.toUpperCase())}><option>Active</option><option>Completed</option><option>Cancelled</option></select> : kind === 'profile-name' ? <input name={label} defaultValue={user.name} /> : kind === 'profile-phone' ? <input name={label} defaultValue="" placeholder="Your phone number" /> : kind === 'profile-office' ? <input name={label} defaultValue={user.office} readOnly /> : kind === 'today-readonly' ? <input name={label} defaultValue={new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} readOnly /> : kind === 'dynamic-office-member' ? <select name={label} required defaultValue=""><option value="" disabled>{officeMembers.length ? value : 'No active office members'}</option>{officeMembers.map(item=><option value={item.user_id} key={item.user_id}>{item.profile?.full_name || 'Office member'}</option>)}</select> : kind === 'dynamic-book' ? <select name={label} required defaultValue=""><option value="" disabled>{userBooks.length ? value : 'Create a Finance book first'}</option>{userBooks.map(book=><option value={book.id} key={book.id}>{book.name} · {book.currency}</option>)}</select> : kind === 'dynamic-transfer-office' ? <select name={label} required defaultValue=""><option value="" disabled>{transferOffices.length ? value : 'No other active offices'}</option>{transferOffices.map(office => <option value={office.id} key={office.id}>{office.name} · {office.location}</option>)}</select> : kind === 'dynamic-member' ? <select name={label} required defaultValue=""><option value="" disabled>{leaderCandidates.length ? value : 'No eligible registered people yet'}</option>{leaderCandidates.map(person => <option value={person.id} key={person.id}>{person.full_name} · {person.rank} · {person.status}</option>)}</select> : kind === 'dynamic-office' ? <select name={label} required defaultValue=""><option value="" disabled>{availableLeaderOffices.length ? value : 'No unassigned offices available'}</option>{availableLeaderOffices.map(office => <option value={office.id} key={office.id}>{office.name} · {office.location}</option>)}</select> : kind === 'communication-office' ? <select name={label} defaultValue=""><option value="">{user.isTeamLeader && user.role !== 'Administrator' ? `${user.ledOffice || user.office} (automatic)` : 'Choose when targeting an office'}</option>{communicationOffices.map(office=><option value={office.id} key={office.id}>{office.name} · {office.location}</option>)}</select> : kind === 'announcement-recipient' ? <select name={label} defaultValue=""><option value="">Choose only for an individual announcement</option>{announcementRecipients.map(person=><option value={person.id} key={person.id}>{person.full_name} · {person.role.replace('_',' ')}</option>)}</select> : kind === 'announcement-audience' ? <select name={label} defaultValue={user.role === 'Administrator' ? 'organization' : 'office'}>{user.role === 'Administrator' && <><option value="organization">Everyone</option><option value="leaders">All team leaders</option><option value="individual">Individual member</option></>}<option value="office">Office members</option></select> : kind === 'event-audience' ? <select name={label} defaultValue={user.role === 'Administrator' ? 'organization' : 'office'}>{user.role === 'Administrator' && <option value="organization">Everyone</option>}<option value="office">Office members</option></select> : kind === 'message-type' ? <select name={label} defaultValue="Feedback"><option>Feedback</option><option>Suggestion</option></select> : kind === 'feedback-recipient' ? <select name={label} defaultValue="Team leader"><option>Team leader</option><option>Admin</option></select> : kind === 'datetime' ? <input name={label} type="datetime-local" required min={new Date().toISOString().slice(0,16)} /> : kind === 'order-platform' ? <select name={label} defaultValue={value}><option>Upwork</option><option>Fiverr</option><option>Direct client</option><option>LinkedIn</option><option>Other</option></select> : kind === 'order-status' ? <select name={label} defaultValue={value}><option>Active</option><option>Completed</option><option>Cancelled</option></select> : kind === 'finance-entry-type' ? <select name={label} defaultValue={value}><option>Credit (+)</option><option>Debit (-)</option></select> : kind === 'book-currency' ? <select name={label} defaultValue={value}><option>NGN</option><option>USD</option></select> : kind === 'book-visibility' ? <select name={label} defaultValue={value}><option>Personal</option><option>Office</option></select> : kind === 'arrival-status' ? <select name={label} defaultValue={value}><option>Present</option><option>Late</option></select> : kind === 'attendance-status' ? <select name={label} defaultValue={value}><option>Present</option><option>Late</option><option>Absent</option></select> : kind === 'absence-category' ? <select name={label} defaultValue={value}><option>Health</option><option>Emergency</option><option>Travel</option><option>Personal</option><option>Other</option></select> : kind === 'plan-rating' ? <select name={label} defaultValue={value}><option>Good</option><option>Poor</option></select> : kind === 'percentage' ? <input name={label} type="number" min="0" max="100" step="1" defaultValue={value} /> : kind === 'select' ? <select name={label} defaultValue={value}><option>{value}</option><option>Other</option></select> : <input name={label} type={kind === 'number' ? 'number' : 'text'} min={kind === 'number' ? '0' : undefined} step={kind === 'number' ? '0.01' : undefined} defaultValue={value} readOnly={kind === 'readonly'} />}</label>)}
      <aside className="info-note"><CheckCircle /><div><strong>Before you submit</strong><p>{data.notice}</p></div></aside>
      {submitMessage && <div className={`interaction-message ${submitMessage.startsWith('Saved') ? 'success' : ''}`} role="status">{submitMessage}</div>}
      <button className="primary form-submit" disabled={submitting || (type === 'assignleader' && (!leaderCandidates.length || !availableLeaderOffices.length))} type="submit">{submitting ? 'Saving…' : data.submit}<ArrowRight /></button>
    </form>
  </div></main>
}

function Placeholder({ page, user, onNavigate }) {
  const content = {
    activity: ['Activity', 'Everything you are working on', modules],
    team: ['My team', 'Your sponsorship network', [{icon: Users,label:'Direct recruits',sub:'3 members',color:'navy'},{icon: TrendUp,label:'Team performance',sub:'+12% this month',color:'green'}]],
    finances: ['Finance', 'Income, expenses and approvals', [{icon: Wallet,label:'Personal finance',sub:'View your balance',color:'green'},{icon: BookOpen,label:'Office earnings',sub:'Office-visible records',color:'navy'}]],
    more: ['More', 'Communication and account tools', [{icon: Bell,label:'Announcements',sub:'Team updates',color:'blue'},{icon: Sparkle,label:'Suggestions',sub:'Share an idea',color:'amber'},{icon: CalendarCheck,label:'Events',sub:'Team activities',color:'green'},{icon: Sparkle,label:'Points & rewards',sub:'Your earned points',color:'navy'},{icon: Briefcase,label:'Change office',sub:'Request a transfer',color:'blue'},{icon: Users,label:'Profile & settings',sub:'Account details',color:'green'}]],
  }[page]
  const destinations = {'Personal finance':'books','Office earnings':'books','Announcements':'announcements','Suggestions':'feedback','Events':'events','Points & rewards':'rewards','Change office':'transfers','Profile & settings':'profile','Direct recruits':'team','Team performance':'team'}
  const createTarget = page === 'finances' ? 'addentry' : page === 'more' ? 'sendfeedback' : 'addorder'
  return <><Topbar user={user} onNavigate={onNavigate} /><main className="page-content"><div className="page-heading"><span>Workspace</span><h2>{content[0]}</h2><p>{content[1]}</p></div><div className="feature-list">{content[2].map(({id,icon:Icon,label,sub,color}) => <button key={label} onClick={() => onNavigate(id || destinations[label])}><span className={`module-icon ${color}`}><Icon /></span><span><strong>{label}</strong><small>{sub}</small></span><ArrowRight /></button>)}</div><div className="empty-panel"><span><Plus /></span><h3>Add your first record</h3><p>New items will appear here once you start tracking your activity.</p><button className="primary" onClick={() => onNavigate(createTarget)}>Create record</button></div></main></>
}

function AppShell({ user }) {
  const params = new URLSearchParams(window.location.search)
  const [active, setActive] = useState(params.get('tab') || 'home')
  const [navigationHistory, setNavigationHistory] = useState([])
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [selectedOfficeId, setSelectedOfficeId] = useState(null)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const forceMobile = new URLSearchParams(window.location.search).get('capture') === 'mobile'
  const isAdmin = user.role === 'Administrator'
  const adminPages = new Set(['admindashboard','offices','officedetail','leaders','orgmembers','transfers','reports','auditlog','adminnotifications','adminsettings','roles','pointsettings','announcementtargeting'])
  const leaderPages = new Set(['leaderdashboard','members','transferapprovals','teamreports','feedbackinbox','attendanceregister','bookreview','excusereview','planreview'])
  const viewingAdmin = adminPages.has(active)
  const viewingLeader = leaderPages.has(active)
  const isModule = Boolean(screenData[active])
  const isForm = Boolean(formData[active])
  const navigate = destination => {
    // Office scope should survive only when the user deliberately drills down
    // from an office. Opening a directory from the main admin portal means all
    // organization records, even if an office was viewed earlier.
    if ((destination === 'orgmembers' || destination === 'leaders') && active !== 'officedetail') setSelectedOfficeId(null)
    if (active !== destination) setNavigationHistory(history => [...history, active])
    setActive(destination)
  }
  const setNavigation = id => navigate(id)
  const goBack = () => {
    setActive(navigationHistory.at(-1) || 'home')
    setNavigationHistory(history => history.slice(0,-1))
  }
  const selectOffice = officeId => { setSelectedOfficeId(officeId); navigate('officedetail') }
  const reviewPlan = planId => { setSelectedPlanId(planId); navigate('reviewplan') }
  const editOrder = orderId => { setSelectedOrderId(orderId); navigate('editorder') }
  const editFinance = transactionId => { setSelectedTransactionId(transactionId); navigate('editfinance') }
  const viewFinanceHistory = transactionId => { setSelectedTransactionId(transactionId); navigate('history') }
  const selectMember = memberId => { setSelectedMemberId(memberId); navigate('memberprofile') }
  const openCreate = destination => { setQuickCreateOpen(false); navigate(destination) }
  return <div className={`app-shell ${forceMobile ? 'force-mobile' : ''}`}>{isAdmin && <button className="portal-switch" onClick={() => navigate(viewingAdmin ? 'home' : 'admindashboard')}>{viewingAdmin ? 'My portal' : 'Admin dashboard'}</button>}{user.isTeamLeader && <button className="portal-switch leader-switch" onClick={() => navigate(viewingLeader ? 'home' : 'leaderdashboard')}>{viewingLeader ? 'My portal' : 'Team leader portal'}</button>}<aside className="sidebar"><Logo /><nav>{nav.map(({id,label,icon:Icon}) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setNavigation(id)}><Icon weight={active === id ? 'fill' : 'regular'} /><span>{label}</span></button>)}</nav><div className="side-user"><div className="avatar">{user.initials}</div><span><strong>{user.name}</strong><small>{user.isTeamLeader ? `${user.role} · Team leader` : user.role}</small></span></div></aside><div className="app-main">{active === 'home' ? <HomePage onNavigate={navigate} user={user} /> : isModule ? <ModulePage type={active} onBack={goBack} onNavigate={navigate} onSelectOffice={selectOffice} onSelectMember={selectMember} onReviewPlan={reviewPlan} onEditOrder={editOrder} onEditFinance={editFinance} onViewFinanceHistory={viewFinanceHistory} selectedOfficeId={selectedOfficeId} selectedMemberId={selectedMemberId} selectedTransactionId={selectedTransactionId} user={user} /> : isForm ? <FormPage type={active} onBack={goBack} selectedPlanId={selectedPlanId} selectedOrderId={selectedOrderId} selectedTransactionId={selectedTransactionId} user={user} /> : <Placeholder page={active} user={user} onNavigate={navigate} />}</div>{!isModule && !isForm && <><nav className="bottom-nav">{nav.map(({id,label,icon:Icon}) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setNavigation(id)}><Icon weight={active === id ? 'fill' : 'regular'} /><span>{label}</span></button>)}</nav><button className="fab" aria-label="Create a new record" aria-expanded={quickCreateOpen} onClick={() => setQuickCreateOpen(value => !value)}><Plus weight="bold" /></button>{quickCreateOpen && <div className="quick-create-backdrop" role="presentation" onClick={() => setQuickCreateOpen(false)}><section className="quick-create-sheet" role="dialog" aria-modal="true" aria-label="Create a new record" onClick={event => event.stopPropagation()}><div><span>Quick create</span><h2>What would you like to add?</h2></div><button onClick={() => openCreate('addorder')}><Briefcase weight="duotone" /><span><strong>Freelance order</strong><small>Record a new client project</small></span><ArrowRight /></button><button onClick={() => openCreate('addentry')}><Wallet weight="duotone" /><span><strong>Finance entry</strong><small>Add income or an expense</small></span><ArrowRight /></button><button onClick={() => openCreate('editplan')}><Target weight="duotone" /><span><strong>Weekly plan</strong><small>Create or update this week’s plan</small></span><ArrowRight /></button><button className="quick-create-cancel" onClick={() => setQuickCreateOpen(false)}>Cancel</button></section></div>}</>}</div>
}

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const bypassAuth = params.get('view') === 'dashboard'
  const [user, setUser] = useState(bypassAuth ? demoUsers.member : null)
  const [onboarded, setOnboarded] = useState(bypassAuth)
  const [authLoading, setAuthLoading] = useState(!bypassAuth)
  const loadAccount = async authUser => {
    if (!authUser) { setUser(null); setAuthLoading(false); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, rank, status')
      .eq('id', authUser.id)
      .maybeSingle()
    const { data: memberships } = await supabase
      .from('office_memberships')
      .select('office:offices(name)')
      .eq('user_id', authUser.id)
      .is('ended_at', null)
    const { data: ledOffice } = await supabase
      .from('offices')
      .select('id,name')
      .eq('leader_id', authUser.id)
      .eq('active', true)
      .maybeSingle()
    const role = profile?.role === 'admin' ? 'Administrator' : profile?.role === 'team_leader' ? 'Team leader' : 'Member'
    const fullName = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'TeamFlow Member'
    const initials = fullName.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase()
    const office = memberships?.[0]?.office?.name || 'Office pending'
    setUser({ id: authUser.id, name: fullName, initials, role, rank: profile?.rank || 'Newbie', office, status: profile?.status || 'pending', isTeamLeader:Boolean(ledOffice), ledOffice:ledOffice?.name || null, ledOfficeId:ledOffice?.id || null })
    // Overall administrators manage the whole organization and do not require
    // approval or an office membership before entering their portal.
    setOnboarded(profile?.role === 'admin' || Boolean(memberships?.length))
    setAuthLoading(false)
  }
  useEffect(() => {
    if (bypassAuth) return
    if (!supabase) { setAuthLoading(false); return }
    const loadingTimeout = window.setTimeout(() => setAuthLoading(false), 10000)
    supabase.auth.getSession().then(({ data }) => loadAccount(data.session?.user || null)).catch(() => setAuthLoading(false))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => loadAccount(session?.user || null))
    return () => { window.clearTimeout(loadingTimeout); listener.subscription.unsubscribe() }
  }, [])
  const authenticate = async account => { setAuthLoading(true); await loadAccount(account) }
  if (authLoading) return <main className="auth-loading"><Logo /><span>Opening your workspace…</span></main>
  if (!user) return <AuthPage onAuthenticate={authenticate} />
  const finishOnboarding = async () => {
    const { data } = await supabase.auth.getUser()
    await loadAccount(data.user)
  }
  return onboarded ? <AppShell user={user} /> : <Onboarding account={user} onFinish={finishOnboarding} />
}
