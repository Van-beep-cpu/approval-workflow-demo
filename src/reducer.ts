import { FIELD_LABEL, formatFieldValue } from './lib'
import type { EditableField, LogEntry, Priority, Rec, Role, Status, StepAction } from './types'

export type Action =
  | {
      type: 'create'
      at: number
      role: Role
      data: Pick<Rec, 'title' | 'category' | 'priority' | 'dueDate' | 'description'>
    }
  | { type: 'step'; at: number; role: Role; id: string; step: StepAction; note?: string }
  | {
      type: 'requestChange'
      at: number
      role: Role
      id: string
      field: EditableField
      to: string
      reason: string
    }
  | {
      type: 'decideChange'
      at: number
      role: Role
      id: string
      changeId: string
      decision: 'approved' | 'rejected'
      note?: string
    }
  | { type: 'replace'; records: Rec[] }

interface Transition {
  role: Role
  from: Status[]
  to: Status
  title: string
  tone: LogEntry['tone']
}

export const TRANSITIONS: Record<StepAction, Transition> = {
  submit: { role: 'intake', from: ['new', 'returned'], to: 'in_review', title: 'Submitted for review', tone: 'info' },
  forward: { role: 'review', from: ['in_review'], to: 'awaiting_approval', title: 'Forwarded to approval', tone: 'info' },
  return: { role: 'review', from: ['in_review'], to: 'returned', title: 'Returned to intake', tone: 'negative' },
  approve: { role: 'approval', from: ['awaiting_approval'], to: 'approved', title: 'Approved request', tone: 'positive' },
  reject: { role: 'approval', from: ['awaiting_approval'], to: 'rejected', title: 'Rejected request', tone: 'negative' },
}

export const isClosed = (r: Rec) => r.status === 'approved' || r.status === 'rejected'
export const pendingChange = (r: Rec) => r.changes.find((c) => c.status === 'pending')

function withLog(rec: Rec, at: number, role: Role, entry: Pick<LogEntry, 'title' | 'detail' | 'tone'>): Rec {
  return {
    ...rec,
    updatedAt: at,
    log: [...rec.log, { id: `${rec.id}-${rec.log.length + 1}`, at, role, ...entry }],
  }
}

function update(records: Rec[], id: string, fn: (r: Rec) => Rec): Rec[] {
  return records.map((r) => (r.id === id ? fn(r) : r))
}

export function reducer(records: Rec[], a: Action): Rec[] {
  switch (a.type) {
    case 'replace':
      return a.records

    case 'create': {
      const rec: Rec = {
        ...a.data,
        id: `REQ-${1001 + records.length}`,
        status: 'new',
        createdAt: a.at,
        updatedAt: a.at,
        log: [],
        changes: [],
      }
      return [...records, withLog(rec, a.at, a.role, { title: 'Created request', tone: 'neutral' })]
    }

    case 'step':
      return update(records, a.id, (r) => {
        const t = TRANSITIONS[a.step]
        if (t.role !== a.role || !t.from.includes(r.status)) return r
        return withLog({ ...r, status: t.to }, a.at, a.role, {
          title: t.title,
          detail: a.note?.trim() || undefined,
          tone: t.tone,
        })
      })

    case 'requestChange':
      return update(records, a.id, (r) => {
        const to = a.to.trim()
        if (isClosed(r) || pendingChange(r) || !to || to === r[a.field]) return r
        const next: Rec = {
          ...r,
          changes: [
            ...r.changes,
            {
              id: `${r.id}-C${r.changes.length + 1}`,
              field: a.field,
              from: r[a.field],
              to,
              reason: a.reason.trim(),
              requestedBy: a.role,
              requestedAt: a.at,
              status: 'pending',
            },
          ],
        }
        return withLog(next, a.at, a.role, {
          title: `Requested change to ${FIELD_LABEL[a.field].toLowerCase()}`,
          detail: `${formatFieldValue(a.field, r[a.field])} → ${formatFieldValue(a.field, to)}${a.reason.trim() ? ` · ${a.reason.trim()}` : ''}`,
          tone: 'info',
        })
      })

    case 'decideChange':
      return update(records, a.id, (r) => {
        const c = r.changes.find((x) => x.id === a.changeId)
        // Four-eyes rule: the requesting role cannot decide its own change.
        if (!c || c.status !== 'pending' || c.requestedBy === a.role) return r
        const approved = a.decision === 'approved'
        const next: Rec = {
          ...r,
          ...(approved ? ({ [c.field]: c.field === 'priority' ? (c.to as Priority) : c.to } as Partial<Rec>) : {}),
          changes: r.changes.map((x) =>
            x.id === c.id
              ? { ...x, status: a.decision, decidedBy: a.role, decidedAt: a.at, note: a.note?.trim() || undefined }
              : x,
          ),
        }
        const label = FIELD_LABEL[c.field].toLowerCase()
        return withLog(next, a.at, a.role, {
          title: approved ? `Approved change to ${label}` : `Rejected change to ${label}`,
          detail: approved
            ? `${formatFieldValue(c.field, c.from)} → ${formatFieldValue(c.field, c.to)}`
            : `Kept ${formatFieldValue(c.field, c.from)}${a.note?.trim() ? ` · ${a.note.trim()}` : ''}`,
          tone: approved ? 'positive' : 'negative',
        })
      })
  }
}
