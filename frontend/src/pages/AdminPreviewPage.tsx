import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import routeIcon from '../assets/route.svg'
import { sampleBuildings, sampleCategories, sampleErrands, sampleSuppliers } from '../features/admin/admin.mock'
import type { MockErrand, Supplier } from '../features/admin/admin.mock'
import './AdminPreviewPage.css'

const sections = [['', 'Overview', '◈'], ['suppliers', 'Suppliers', '▤'], ['categories', 'Categories', '▦'], ['buildings', 'Buildings', '▥'], ['errands', 'All errands', '↗']]
const emptySupplier: Supplier = { id: '', name: '', category: '', building: '', floor: '', description: '', openingTime: '', closingTime: '', imageUrl: '' }

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close() }, [])
  return <dialog ref={ref} className="admin-dialog" aria-labelledby="admin-dialog-title" onCancel={close}>
    <div className="admin-dialog-head"><h2 id="admin-dialog-title">{title}</h2><button aria-label="Close dialog" onClick={close}>×</button></div>
    {children}
  </dialog>
}

function Badge({ status }: { status: string }) {
  return <span className={`admin-badge admin-badge-${status.toLowerCase()}`}>{status}</span>
}

function SupplierForm({ supplier, categories, buildings, save, close }: { supplier: Supplier; categories: string[]; buildings: string[]; save: (supplier: Supplier) => string | undefined; close: () => void }) {
  const [draft, setDraft] = useState(supplier)
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.name.trim()) { setError('Enter a supplier name.'); return }
    if (Boolean(draft.openingTime) !== Boolean(draft.closingTime)) { setError('Provide both opening and closing times, or leave both empty.'); return }
    const problem = save({ ...draft, name: draft.name.trim() })
    if (problem) setError(problem)
  }
  function field(key: keyof Supplier, label: string, type = 'text', maxLength = 500) {
    return <label>{label}<input type={type} value={draft[key]} maxLength={maxLength} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>
  }
  return <Modal title={supplier.id ? 'Edit supplier' : 'Add supplier'} close={close}>
    <p className="admin-muted">Keep your campus directory up to date. Changes apply to this preview only.</p>
    <form onSubmit={submit} className="admin-form">
      <label>Supplier name *<input required maxLength={60} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
      <div className="admin-form-grid">
        <label>Category *<select required value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}><option value="">Select category</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label>
        <label>Building *<select required value={draft.building} onChange={event => setDraft({ ...draft, building: event.target.value })}><option value="">Select building</option>{buildings.map(name => <option key={name}>{name}</option>)}</select></label>
      </div>
      {field('floor', 'Floor', 'text', 20)}
      <label>Description<textarea maxLength={500} rows={3} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
      <div className="admin-form-grid">{field('openingTime', 'Opening time', 'time')}{field('closingTime', 'Closing time', 'time')}</div>
      {field('imageUrl', 'Image URL', 'url')}
      {error && <p role="alert" className="admin-error">{error}</p>}
      <div className="admin-dialog-actions"><button type="button" onClick={close}>Cancel</button><button className="admin-primary">Save supplier</button></div>
    </form>
  </Modal>
}

function formatTime(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }).format(new Date(value)) : '—'
}

export function AdminPreviewPage() {
  const section = useLocation().pathname.replace(/^\/admin\/?/, '')
  const [suppliers, setSuppliers] = useState(sampleSuppliers)
  const [categories, setCategories] = useState(sampleCategories)
  const [buildings, setBuildings] = useState(sampleBuildings)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [building, setBuilding] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('recent')
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [creating, setCreating] = useState<'categories' | 'buildings' | null>(null)
  const [newName, setNewName] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<MockErrand | null>(null)
  const [resetting, setResetting] = useState(false)
  const title = sections.find(([path]) => path === section)?.[1]
  const supplierName = (id: string) => suppliers.find(supplier => supplier.id === id)?.name ?? 'Unknown supplier'
  const visibleSuppliers = suppliers.filter(supplier => supplier.name.toLowerCase().includes(query.toLowerCase()) && (!category || supplier.category === category) && (!building || supplier.building === building))
  const visibleErrands = sampleErrands.filter(errand => (!status || errand.status === status) && (!building || errand.building === building) && `${errand.id} ${errand.item} ${errand.requester} ${errand.courier ?? ''} ${supplierName(errand.supplierId)}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'credits' ? b.credits - a.credits : b.created.localeCompare(a.created))
  function clearFilters() { setQuery(''); setCategory(''); setBuilding(''); setStatus(''); setSort('recent'); setNotice('') }
  function saveSupplier(draft: Supplier) {
    if (suppliers.some(supplier => supplier.id !== draft.id && supplier.name.toLowerCase() === draft.name.toLowerCase() && supplier.building === draft.building)) { return 'A supplier with that name already exists in this building.' }
    setSuppliers(current => draft.id ? current.map(supplier => supplier.id === draft.id ? draft : supplier) : [...current, { ...draft, id: crypto.randomUUID() }])
    setEditing(null); setNotice(`${draft.name} saved to the preview.`)
  }
  function addReference(event: FormEvent) {
    event.preventDefault()
    const name = newName.trim()
    const list = creating === 'categories' ? categories : buildings
    if (!name || list.some(item => item.toLowerCase() === name.toLowerCase())) { setFormError('Enter a unique, nonblank name.'); return }
    if (creating === 'categories') setCategories([...categories, name]); else setBuildings([...buildings, name])
    setCreating(null); setNotice(`${name} added to the preview.`)
  }
  function startReference(kind: 'categories' | 'buildings') { setNewName(''); setFormError(''); setCreating(kind) }
  function errandsTable(rows: MockErrand[]) {
    return <div className="admin-table-scroll"><table><thead><tr><th>Errand</th><th>Supplier</th><th>Status</th><th>Credits</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(errand => <tr key={errand.id}><td><strong>{errand.item}</strong><small>{errand.id} · {errand.requester}</small></td><td>{supplierName(errand.supplierId)}</td><td><Badge status={errand.status} /></td><td>{errand.credits}</td><td><button aria-label={`View ${errand.id}`} onClick={() => setSelected(errand)}>View ↗</button></td></tr>)}</tbody></table>{!rows.length && <div className="admin-empty">No errands match your filters.<button onClick={clearFilters}>Clear filters</button></div>}</div>
  }
  return <div className="admin-preview">
    <header className="admin-header"><Link to="/" className="admin-brand"><span><img src={routeIcon} alt="" width={22} height={22} /></span>Campus Couriers</Link><div className="admin-identity"><span className="admin-avatar">AD</span><span>Admin preview<small>Campus operations</small></span></div></header>
    <div className="admin-shell"><aside className="admin-sidebar"><p className="admin-eyebrow">Administration</p><nav aria-label="Admin navigation">{sections.map(([path, label, icon]) => <NavLink key={path} to={`/admin${path ? `/${path}` : ''}`} end onClick={clearFilters}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav><div className="admin-sidebar-footer"><p>Small errands.<br />A connected campus.</p><Link to="/">← Back to CampusCouriers</Link></div></aside>
      <main className="admin-main"><div className="admin-preview-banner"><span><strong>Preview · Sample data</strong> Changes stay in this browser session. Sample activity is dated 2–4 Nov 2026.</span><button onClick={() => setResetting(true)}>Reset sample data</button></div>
        <div className="admin-page-heading"><div><p className="admin-eyebrow">Campus operations / {title ?? 'Page'}</p><h1>{title ?? 'Page not found'}</h1><p className="admin-muted">{section === '' ? 'A little oversight keeps campus moving.' : section === 'suppliers' ? 'Manage the places your campus relies on.' : section === 'errands' ? 'Follow every request, from pickup to completion.' : 'Keep your campus directory organised.'}</p></div>{section === 'suppliers' && <button className="admin-primary" onClick={() => setEditing({ ...emptySupplier })}>＋ Add supplier</button>}{(section === 'categories' || section === 'buildings') && <button className="admin-primary" onClick={() => startReference(section)}>＋ Add {section === 'categories' ? 'category' : 'building'}</button>}</div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {section === '' && <>
          <div className="admin-stats">{[['Active suppliers', suppliers.length, 'In your campus directory'], ['Open errands', sampleErrands.filter(e => e.status === 'Open').length, 'Waiting for a courier'], ['Accepted errands', sampleErrands.filter(e => e.status === 'Accepted').length, 'On their way'], ['Failed errands', sampleErrands.filter(e => e.status === 'Failed').length, 'Available for review']].map(([label, count, note]) => <div className="admin-stat" key={label}><p>{label}</p><strong>{count}</strong><small>{note}</small></div>)}</div>
          <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-head"><div><h2>Recent errands</h2><p className="admin-muted">The latest activity around campus</p></div><Link to="/admin/errands" onClick={clearFilters}>View all →</Link></div>{errandsTable(sampleErrands.slice(0, 4))}</section><section className="admin-panel admin-quick"><p className="admin-eyebrow">Keep things moving</p><h2>Your campus,<br />well connected.</h2><p className="admin-muted">Add a new pickup spot or keep the directory fresh.</p><button className="admin-primary" onClick={() => setEditing({ ...emptySupplier })}>＋ Add supplier</button><button onClick={() => startReference('categories')}>Add category →</button><button onClick={() => startReference('buildings')}>Add building →</button></section></div>
        </>}
        {section === 'suppliers' && <section className="admin-panel"><div className="admin-toolbar"><label className="admin-search">Search suppliers<input type="search" placeholder="Search by supplier name…" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label><label>Building<select value={building} onChange={e => setBuilding(e.target.value)}><option value="">All buildings</option>{buildings.map(name => <option key={name}>{name}</option>)}</select></label></div><div className="admin-table-scroll"><table><thead><tr><th>Supplier</th><th>Category</th><th>Location</th><th>Hours</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleSuppliers.map(supplier => <tr key={supplier.id}><td><strong>{supplier.name}</strong><small>{supplier.description || 'No description'}</small></td><td>{supplier.category}</td><td>{supplier.building}<small>{supplier.floor ? `Floor ${supplier.floor}` : 'Floor unspecified'}</small></td><td>{supplier.openingTime ? `${supplier.openingTime}–${supplier.closingTime}` : 'Not provided'}</td><td><Badge status="Active" /></td><td><button aria-label={`Edit ${supplier.name}`} onClick={() => setEditing({ ...supplier })}>Edit ↗</button></td></tr>)}</tbody></table>{!visibleSuppliers.length && <div className="admin-empty">No suppliers match your filters.<button onClick={clearFilters}>Clear filters</button></div>}</div><p className="admin-table-footer">{visibleSuppliers.length} of {suppliers.length} active suppliers</p></section>}
        {(section === 'categories' || section === 'buildings') && <section className="admin-panel"><div className="admin-panel-head"><h2>{section === 'categories' ? 'Supplier categories' : 'Campus buildings'}</h2><span className="admin-muted">{(section === 'categories' ? categories : buildings).length} active</span></div><div className="admin-directory">{(section === 'categories' ? categories : buildings).map(name => <div key={name}><span className="admin-directory-icon" aria-hidden="true">{section === 'categories' ? '▦' : '▥'}</span><div><strong>{name}</strong><small>{suppliers.filter(supplier => (section === 'categories' ? supplier.category : supplier.building) === name).length} suppliers</small></div><Badge status="Active" /></div>)}</div></section>}
        {section === 'errands' && <section className="admin-panel"><div className="admin-toolbar"><label className="admin-search">Search errands<input type="search" placeholder="Item, ID, person or supplier…" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['Open', 'Accepted', 'Completed', 'Failed', 'Cancelled'].map(name => <option key={name}>{name}</option>)}</select></label><label>Delivery building<select value={building} onChange={e => setBuilding(e.target.value)}><option value="">All buildings</option>{buildings.map(name => <option key={name}>{name}</option>)}</select></label><label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Newest first</option><option value="credits">Highest credits</option></select></label></div>{errandsTable(visibleErrands)}<p className="admin-table-footer">{visibleErrands.length} errands · Read-only monitoring</p></section>}
        {!title && <Link to="/admin">Return to overview →</Link>}
        <p className="admin-footnote">CampusCouriers Administration · All times in Singapore time</p>
      </main></div>
    {editing && <SupplierForm supplier={editing} categories={categories} buildings={buildings} save={saveSupplier} close={() => setEditing(null)} />}
    {creating && <Modal title={`Add ${creating === 'categories' ? 'category' : 'building'}`} close={() => setCreating(null)}><form className="admin-form" onSubmit={addReference}><label>Name *<input required maxLength={60} value={newName} onChange={e => setNewName(e.target.value)} /></label>{formError && <p role="alert" className="admin-error">{formError}</p>}<div className="admin-dialog-actions"><button type="button" onClick={() => setCreating(null)}>Cancel</button><button className="admin-primary">Add to directory</button></div></form></Modal>}
    {selected && <Modal title={selected.id} close={() => setSelected(null)}><Badge status={selected.status} /><h3 className="admin-detail-title">{selected.item}</h3><dl className="admin-details">{[['Supplier', supplierName(selected.supplierId)], ['Requester', selected.requester], ['Courier', selected.courier ?? 'Unassigned'], ['Delivery', selected.building], ['Credits', selected.credits], ['Created', formatTime(selected.created)], ['Accepted', formatTime(selected.accepted)], ['Expires', formatTime(selected.expires)], ['Completed', formatTime(selected.completed)], ['Failed', formatTime(selected.failed)], ['Cancelled', formatTime(selected.cancelled)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{selected.reason && <p className="admin-error"><strong>Failure reason:</strong> {selected.reason}</p>}<p className="admin-muted">Administrators can inspect errands. Status changes belong to the requester.</p></Modal>}
    {resetting && <Modal title="Reset sample data?" close={() => setResetting(false)}><p>Your preview edits will be replaced with the original sample data.</p><div className="admin-dialog-actions"><button onClick={() => setResetting(false)}>Keep edits</button><button className="admin-primary" onClick={() => { setSuppliers(sampleSuppliers); setCategories(sampleCategories); setBuildings(sampleBuildings); clearFilters(); setResetting(false); setNotice('Sample data restored.') }}>Reset sample data</button></div></Modal>}
  </div>
}

