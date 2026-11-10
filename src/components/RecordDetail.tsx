import { useState, type FormEvent } from 'react'
import {
  CATEGORIES,
  EDITABLE_FIELDS,
  FIELD_LABEL,
  PRIORITIES,
  ROLE_LABEL,
  ROLE_PERSON,
  STATUS_OWNER,
  formatDate,
  formatDateTime,
  formatFieldValue,
} from '../lib'
import { isClosed, pendingChange } from '../reducer'
import { useStore } from '../store'
import type { ChangeRequest, EditableField, LogEntry, Rec, Role, StepAction } from '../types'
import { Button, Card, CardHeader, Field, Pill, PriorityLabel, StatusBadge, inputClass } from './ui'

export function RecordDetail({ rec }: { rec: Rec }) {
  return (
    <div className="space-y-4">
      <a href="#/" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <span aria-hidden>←</span> All requests
      </a>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">{rec.id}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight break-words text-slate-900">{rec.title}</h1>
        </div>
        <StatusBadge status={rec.status} />
      </div>

      <Stepper rec={rec} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <StepPanel rec={rec} />
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 text-sm sm:grid-cols-4 sm:px-5">
              <Item label="Category">{rec.category}</Item>
              <Item label="Priority">
                <PriorityLabel priority={rec.priority} />
              </Item>
              <Item label="Due date">{formatDate(rec.dueDate)}</Item>
              <Item label="Created">{formatDateTime(rec.createdAt)}</Item>
              {rec.description && (
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-xs text-slate-500">Description</dt>
                  <dd className="mt-1 break-words text-slate-700">{rec.description}</dd>
                </div>
              )}
            </dl>
          </Card>
          <ChangeRequests rec={rec} />
        </div>
        <ActivityLog log={rec.log} />
      </div>
    </div>
  )
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{children}</dd>
    </div>
  )
}

/* ---------- Progress ---------- */

const STEPS = ['Intake', 'Review', 'Approval', 'Closed']
const STEP_INDEX = { new: 0, returned: 0, in_review: 1, awaiting_approval: 2, approved: 3, rejected: 3 } as const

function Stepper({ rec }: { rec: Rec }) {
  const current = STEP_INDEX[rec.status]
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < current || rec.status === 'approved'
        const active = i === current && !done
        const failed = active && rec.status === 'rejected'
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="min-w-0">
            <div className={`h-1 rounded-full ${failed ? 'bg-rose-500' : done ? 'bg-emerald-500' : active ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <p className={`mt-1.5 truncate text-xs ${active || done ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
              {i === 3 && rec.status === 'approved' ? 'Approved' : i === 3 && rec.status === 'rejected' ? 'Rejected' : label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Current step ---------- */

interface StepConfig {
  heading: string
  help: string
  primary: { step: StepAction; label: string }
  secondary?: { step: StepAction; label: string; danger?: boolean }
}

const STEP_CONFIG: Record<Role, StepConfig> = {
  intake: {
    heading: 'Intake: check and submit',
    help: 'Confirm the details are complete, then hand the request to Review.',
    primary: { step: 'submit', label: 'Submit for review' },
  },
  review: {
    heading: 'Review: check the request',
    help: 'Forward it to Approval, or return it to Intake if something is missing.',
    primary: { step: 'forward', label: 'Forward to approval' },
    secondary: { step: 'return', label: 'Return to intake' },
  },
  approval: {
    heading: 'Approval: final decision',
    help: 'Approving or rejecting closes the request.',
    primary: { step: 'approve', label: 'Approve' },
    secondary: { step: 'reject', label: 'Reject', danger: true },
  },
}

function StepPanel({ rec }: { rec: Rec }) {
  const { role, setRole, act } = useStore()
  const [note, setNote] = useState('')
  const owner = STATUS_OWNER[rec.status]

  if (!owner) {
    return (
      <Card className="px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-slate-900">This request is closed</p>
        <p className="mt-1 text-sm text-slate-600">
          It was {rec.status === 'approved' ? 'approved' : 'rejected'} by Approval. The full history is in the activity log.
        </p>
      </Card>
    )
  }

  if (owner !== role) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Waiting for {ROLE_LABEL[owner]}</p>
          <p className="mt-1 text-sm text-slate-600">
            {ROLE_LABEL[role]} has nothing to do on this request right now.
          </p>
        </div>
        <Button onClick={() => setRole(owner)}>View as {ROLE_LABEL[owner]}</Button>
      </Card>
    )
  }

  const cfg = STEP_CONFIG[role]
  const run = (step: StepAction) => {
    act({ type: 'step', id: rec.id, step, note })
    setNote('')
  }

  return (
    <Card className="border-indigo-200 ring-1 ring-indigo-100">
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-indigo-700 uppercase">Your step</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">{cfg.heading}</h2>
          <p className="mt-1 text-sm text-slate-600">{cfg.help}</p>
        </div>
        <Field label="Note for the log (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className={inputClass} />
        </Field>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" onClick={() => run(cfg.primary.step)}>
            {cfg.primary.label}
          </Button>
          {cfg.secondary && (
            <Button variant={cfg.secondary.danger ? 'danger' : 'secondary'} onClick={() => run(cfg.secondary!.step)}>
              {cfg.secondary.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ---------- Change requests ---------- */

function ChangeRequests({ rec }: { rec: Rec }) {
  const [open, setOpen] = useState(false)
  const pending = pendingChange(rec)
  const canRequest = !isClosed(rec) && !pending
  const history = rec.changes.filter((c) => c.status !== 'pending').reverse()

  return (
    <Card>
      <CardHeader
        title="Change requests"
        aside={
          canRequest && !open ? (
            <Button onClick={() => setOpen(true)}>Request a change</Button>
          ) : undefined
        }
      />
      <div className="divide-y divide-slate-100">
        {open && canRequest && <ChangeForm rec={rec} onClose={() => setOpen(false)} />}
        {pending && <PendingChange rec={rec} change={pending} />}
        {history.map((c) => (
          <div key={c.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 px-4 py-3 text-sm sm:px-5">
            <div className="min-w-0">
              <p className="break-words text-slate-900">
                <span className="font-medium">{FIELD_LABEL[c.field]}:</span> <Diff change={c} />
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Requested by {ROLE_LABEL[c.requestedBy]} · decided by {c.decidedBy ? ROLE_LABEL[c.decidedBy] : '—'}
              </p>
            </div>
            <Pill className={c.status === 'approved' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-800 ring-rose-200'}>
              {c.status === 'approved' ? 'Approved' : 'Rejected'}
            </Pill>
          </div>
        ))}
        {!open && !pending && history.length === 0 && (
          <p className="px-4 py-4 text-sm text-slate-600 sm:px-5">
            {isClosed(rec)
              ? 'No changes were requested on this request.'
              : 'Fields are locked. A change needs sign-off from a second role before it is applied.'}
          </p>
        )}
      </div>
    </Card>
  )
}

function Diff({ change: c }: { change: ChangeRequest }) {
  return (
    <>
      <span className="text-slate-500 line-through">{formatFieldValue(c.field, c.from)}</span>
      <span aria-hidden className="mx-1.5 text-slate-400">→</span>
      <span className="font-medium">{formatFieldValue(c.field, c.to)}</span>
    </>
  )
}

function PendingChange({ rec, change: c }: { rec: Rec; change: ChangeRequest }) {
  const { role, setRole, act } = useStore()
  const [note, setNote] = useState('')
  const own = c.requestedBy === role
  const decide = (decision: 'approved' | 'rejected') => act({ type: 'decideChange', id: rec.id, changeId: c.id, decision, note })
  const other: Role = c.requestedBy === 'review' ? 'approval' : 'review'

  return (
    <div className="space-y-3 bg-amber-50/60 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-amber-800 uppercase">Pending change</p>
        <p className="text-xs text-slate-500">
          {ROLE_LABEL[c.requestedBy]} · {formatDateTime(c.requestedAt)}
        </p>
      </div>
      <p className="text-sm break-words text-slate-900">
        <span className="font-medium">{FIELD_LABEL[c.field]}:</span> <Diff change={c} />
      </p>
      {c.reason && <p className="text-sm break-words text-slate-600">Reason: {c.reason}</p>}
      {own ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200/70 pt-3">
          <p className="min-w-0 text-sm text-slate-600">Your role requested this, so a different role has to decide.</p>
          <Button onClick={() => setRole(other)}>View as {ROLE_LABEL[other]}</Button>
        </div>
      ) : (
        <div className="space-y-3 border-t border-amber-200/70 pt-3">
          <Field label="Note for the log (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className={inputClass} />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" onClick={() => decide('approved')}>
              Approve change
            </Button>
            <Button variant="danger" onClick={() => decide('rejected')}>
              Reject change
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChangeForm({ rec, onClose }: { rec: Rec; onClose: () => void }) {
  const { act } = useStore()
  const [field, setField] = useState<EditableField>('priority')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')

  const options = field === 'category' ? CATEGORIES : field === 'priority' ? PRIORITIES : null
  const valid = to.trim() !== '' && to.trim() !== rec[field]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    act({ type: 'requestChange', id: rec.id, field, to, reason })
    onClose()
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-4 py-4 sm:px-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Field">
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value as EditableField)
              setTo('')
            }}
            className={inputClass}
          >
            {EDITABLE_FIELDS.map((f) => (
              <option key={f} value={f}>
                {FIELD_LABEL[f]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`New value (now: ${formatFieldValue(field, rec[field])})`}>
          {options ? (
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {options
                .filter((o) => o !== rec[field])
                .map((o) => (
                  <option key={o}>{o}</option>
                ))}
            </select>
          ) : (
            <input
              type={field === 'dueDate' ? 'date' : 'text'}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <Field label="Reason">
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={140} placeholder="Why is this change needed?" className={inputClass} />
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          Send for sign-off
        </Button>
      </div>
    </form>
  )
}

/* ---------- Activity log ---------- */

const TONE_DOT: Record<LogEntry['tone'], string> = {
  neutral: 'bg-slate-400',
  info: 'bg-indigo-500',
  positive: 'bg-emerald-500',
  negative: 'bg-rose-500',
}

function ActivityLog({ log }: { log: LogEntry[] }) {
  const entries = [...log].reverse()
  return (
    <Card className="min-w-0">
      <CardHeader title="Activity" aside={<span className="text-xs text-slate-500">{log.length} entries</span>} />
      <ol className="px-4 py-4 sm:px-5">
        {entries.map((e, i) => (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 && <span className="absolute top-3 bottom-0 left-[3px] w-px bg-slate-200" aria-hidden />}
            <span className={`relative mt-1.5 size-[7px] shrink-0 rounded-full ${TONE_DOT[e.tone]}`} aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-medium break-words text-slate-900">{e.title}</p>
              {e.detail && <p className="mt-0.5 break-words text-slate-600">{e.detail}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {ROLE_PERSON[e.role]} ({ROLE_LABEL[e.role]}) · <time dateTime={new Date(e.at).toISOString()}>{formatDateTime(e.at)}</time>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
