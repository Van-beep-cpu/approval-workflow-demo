export type Role = 'intake' | 'review' | 'approval'

export type Status =
  | 'new'
  | 'returned'
  | 'in_review'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'

export type Priority = 'Low' | 'Normal' | 'High'

/** Fields that can only be changed through an approved change request. */
export type EditableField = 'title' | 'category' | 'priority' | 'dueDate'

export type LogTone = 'neutral' | 'positive' | 'negative' | 'info'

export interface LogEntry {
  id: string
  at: number
  role: Role
  title: string
  detail?: string
  tone: LogTone
}

export interface ChangeRequest {
  id: string
  field: EditableField
  from: string
  to: string
  reason: string
  requestedBy: Role
  requestedAt: number
  status: 'pending' | 'approved' | 'rejected'
  decidedBy?: Role
  decidedAt?: number
  note?: string
}

export interface Rec {
  id: string
  title: string
  category: string
  priority: Priority
  dueDate: string
  description: string
  status: Status
  createdAt: number
  updatedAt: number
  log: LogEntry[]
  changes: ChangeRequest[]
}

export type StepAction = 'submit' | 'forward' | 'return' | 'approve' | 'reject'
