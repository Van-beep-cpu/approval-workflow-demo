import { isoDate } from './lib'
import { reducer, type Action } from './reducer'
import type { Priority, Rec, Role, StepAction } from './types'

/**
 * Sample data. Records are built by replaying real actions through the reducer,
 * so every seeded status has a matching, consistent activity log.
 */
export function createSeed(now = Date.now()): Rec[] {
  const H = 3600000
  let records: Rec[] = []
  const run = (a: Action) => {
    records = reducer(records, a)
  }
  const last = () => records[records.length - 1].id

  const create = (
    hoursAgo: number,
    title: string,
    category: string,
    priority: Priority,
    dueInDays: number,
    description: string,
  ) =>
    run({
      type: 'create',
      at: now - hoursAgo * H,
      role: 'intake',
      data: { title, category, priority, dueDate: isoDate(dueInDays, now), description },
    })
  const step = (hoursAgo: number, role: Role, s: StepAction, note?: string) =>
    run({ type: 'step', at: now - hoursAgo * H, role, id: last(), step: s, note })

  create(170, 'Laptop replacement for design team', 'Equipment', 'Normal', 12, 'Current device no longer receives security updates.')
  step(168, 'intake', 'submit')
  step(150, 'review', 'forward', 'Specs match the standard device profile.')
  step(140, 'approval', 'approve')

  create(120, 'Shared drive access for project folder', 'Access', 'High', 3, 'Read and write access for two team members.')
  step(118, 'intake', 'submit')
  step(96, 'review', 'forward')

  create(98, 'Second monitor for hot desk area', 'Equipment', 'Low', 20, 'Three desks currently have no external display.')
  step(97, 'intake', 'submit')
  run({
    type: 'requestChange',
    at: now - 30 * H,
    role: 'review',
    id: last(),
    field: 'priority',
    to: 'Normal',
    reason: 'Desks are booked every day next month.',
  })

  create(80, 'Annual licence renewal for diagramming tool', 'Purchasing', 'Normal', 9, 'Renewal for the existing seats, no change in plan.')
  step(79, 'intake', 'submit')
  step(60, 'review', 'return', 'Seat count is missing.')

  create(72, 'Workshop: writing clear specifications', 'Training', 'Normal', 30, 'One-day workshop for the product team.')
  step(70, 'intake', 'submit')
  step(52, 'review', 'forward')
  step(40, 'approval', 'reject', 'Postponed to next quarter.')

  create(50, 'Meeting room booking rule exception', 'Facilities', 'Low', 15, 'Recurring weekly booking longer than the default limit.')
  step(48, 'intake', 'submit')

  create(26, 'Replacement badge reader at side entrance', 'Facilities', 'High', 5, 'Reader fails intermittently.')
  step(25, 'intake', 'submit')
  step(8, 'review', 'forward', 'Confirmed on site.')

  create(20, 'Onboarding checklist access for new starter', 'Access', 'Normal', 6, 'Access to onboarding workspace and templates.')

  create(6, 'Ergonomic chair for desk 14', 'Equipment', 'Normal', 14, 'Requested after workplace assessment.')

  create(2, 'Online course: spreadsheet modelling', 'Training', 'Low', 45, 'Self-paced course, four modules.')

  return records
}
