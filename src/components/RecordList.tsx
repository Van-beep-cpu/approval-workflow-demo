import { useMemo, useState, type FormEvent } from 'react'
import { CATEGORIES, PRIORITIES, ROLE_LABEL, STATUSES, STATUS_LABEL, STATUS_OWNER, formatDate, isoDate, timeAgo } from '../lib'
import { pendingChange } from '../reducer'
import { useStore } from '../store'
import type { Priority, Rec, Status } from '../types'
import { Button, Card, Field, Pill, PriorityLabel, StatusBadge, inputClass } from './ui'

type Scope = 'all' | 'mine'

export function RecordList() {
  const { records, role } = useStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [scope, setScope] = useState<Scope>('all')
  const [creating, setCreating] = useState(false)

  const needsMe = (r: Rec) => {
    const pc = pendingChange(r)
    return STATUS_OWNER[r.status] === role || (!!pc && pc.requestedBy !== role)
  }
  const mineCount = records.filter(needsMe).length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter((r) => status === 'all' || r.status === status)
      .filter((r) => scope === 'all' || needsMe(r))
      .filter((r) => !q || [r.id, r.title, r.category].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    // needsMe depends on role only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, query, status, scope, role])

  const filtered = query.trim() !== '' || status !== 'all' || scope !== 'all'
  const clear = () => {
    setQuery('')
    setStatus('all')
    setScope('all')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            {mineCount === 0
              ? `Nothing is waiting for ${ROLE_LABEL[role]} right now.`
              : `${mineCount} ${mineCount === 1 ? 'request needs' : 'requests need'} action from ${ROLE_LABEL[role]}.`}
          </p>
        </div>
        {role === 'intake' && !creating && (
          <Button variant="primary" onClick={() => setCreating(true)}>
            New request
          </Button>
        )}
      </div>

      {creating && <NewRequestForm onClose={() => setCreating(false)} />}

      <Card>
        <div className="grid gap-3 border-b border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, title or category"
            aria-label="Search requests"
            className={inputClass}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | 'all')}
            aria-label="Filter by status"
            className={`${inputClass} sm:w-48`}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <div role="radiogroup" aria-label="Scope" className="flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
            {(['all', 'mine'] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={scope === s}
                onClick={() => setScope(s)}
                className={`min-h-9 flex-1 rounded px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 sm:min-h-0 ${
                  scope === s ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'all' ? 'All' : `My queue (${mineCount})`}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No requests match these filters</p>
            <p className="mt-1 text-sm text-slate-600">Try a different search term or status.</p>
            <Button className="mt-4" onClick={clear}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <table className="hidden w-full table-fixed text-left text-sm md:table">
              <thead className="border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  <th className="w-28 px-5 py-2.5 font-medium">ID</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="w-28 px-3 py-2.5 font-medium">Category</th>
                  <th className="w-24 px-3 py-2.5 font-medium">Priority</th>
                  <th className="w-28 px-3 py-2.5 font-medium">Due</th>
                  <th className="w-40 px-3 py-2.5 font-medium">Status</th>
                  <th className="w-24 px-5 py-2.5 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="group relative hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                    <td className="px-3 py-3">
                      <a
                        href={`#/r/${r.id}`}
                        className="block truncate font-medium text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-indigo-600"
                      >
                        {r.title}
                      </a>
                      <RowFlags rec={r} needsMe={needsMe(r)} />
                    </td>
                    <td className="truncate px-3 py-3 text-slate-600">{r.category}</td>
                    <td className="px-3 py-3 text-slate-600">
                      <PriorityLabel priority={r.priority} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600 tabular-nums">{formatDate(r.dueDate)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-slate-500 tabular-nums">{timeAgo(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: stacked rows */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <a href={`#/r/${r.id}`} className="block px-4 py-3.5 active:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-slate-500">{r.id}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1.5 text-sm font-medium break-words text-slate-900">{r.title}</p>
                    <RowFlags rec={r} needsMe={needsMe(r)} />
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>{r.category}</span>
                      <PriorityLabel priority={r.priority} />
                      <span className="tabular-nums">Due {formatDate(r.dueDate)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
          <span>
            Showing {rows.length} of {records.length}
          </span>
          {filtered && rows.length > 0 && (
            <button type="button" onClick={clear} className="font-medium text-indigo-700 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}

function RowFlags({ rec, needsMe }: { rec: Rec; needsMe: boolean }) {
  const pc = pendingChange(rec)
  if (!needsMe && !pc) return null
  return (
    <div className="relative mt-1.5 flex flex-wrap gap-1.5">
      {needsMe && <Pill className="bg-indigo-50 text-indigo-700 ring-indigo-200">Needs your action</Pill>}
      {pc && <Pill className="bg-white text-slate-600 ring-slate-300">Change pending</Pill>}
    </div>
  )
}

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { act } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<Priority>('Normal')
  const [dueDate, setDueDate] = useState(isoDate(14))
  const [description, setDescription] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    act({ type: 'create', data: { title: title.trim(), category, priority, dueDate, description: description.trim() } })
    onClose()
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">New request</h2>
        <Field label="Title">
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Description (optional)">
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} className={inputClass} />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Create request
          </Button>
        </div>
      </form>
    </Card>
  )
}
