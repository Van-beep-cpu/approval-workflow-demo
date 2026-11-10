import type { EditableField, Priority, Role, Status } from './types'

export const ROLES: Role[] = ['intake', 'review', 'approval']

export const ROLE_LABEL: Record<Role, string> = {
  intake: 'Intake',
  review: 'Review',
  approval: 'Approval',
}

/** Sample people, one per role. Purely illustrative. */
export const ROLE_PERSON: Record<Role, string> = {
  intake: 'Alex Kim',
  review: 'Sam Rivera',
  approval: 'Jordan Lee',
}

export const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  returned: 'Returned',
  in_review: 'In review',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const STATUSES = Object.keys(STATUS_LABEL) as Status[]

/** Which role has to act on a record in a given status (null = closed). */
export const STATUS_OWNER: Record<Status, Role | null> = {
  new: 'intake',
  returned: 'intake',
  in_review: 'review',
  awaiting_approval: 'approval',
  approved: null,
  rejected: null,
}

export const CATEGORIES = ['Access', 'Equipment', 'Facilities', 'Purchasing', 'Training']
export const PRIORITIES: Priority[] = ['Low', 'Normal', 'High']

export const FIELD_LABEL: Record<EditableField, string> = {
  title: 'Title',
  category: 'Category',
  priority: 'Priority',
  dueDate: 'Due date',
}

export const EDITABLE_FIELDS = Object.keys(FIELD_LABEL) as EditableField[]

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (ts: number) => dateTime.format(ts)

/** Formats an ISO date string (yyyy-mm-dd) without timezone shifts. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return dateOnly.format(new Date(y, m - 1, d))
}

export function formatFieldValue(field: EditableField, value: string) {
  return field === 'dueDate' ? formatDate(value) : value
}

export function timeAgo(ts: number, now = Date.now()) {
  const min = Math.max(0, Math.round((now - ts) / 60000))
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return `${d} d ago`
}

export function isoDate(daysFromNow: number, now = Date.now()) {
  const d = new Date(now + daysFromNow * 86400000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
