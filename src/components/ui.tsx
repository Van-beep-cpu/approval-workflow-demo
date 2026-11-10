import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { STATUS_LABEL } from '../lib'
import type { Priority, Status } from '../types'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'danger'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
  danger: 'bg-white text-rose-700 hover:bg-rose-50 border-rose-200',
}

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        'disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9',
        VARIANT[variant],
        className,
      )}
    />
  )
}

/** text-base on small screens prevents iOS from zooming into focused fields. */
export const inputClass =
  'block w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500/30 sm:text-sm'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-slate-100 text-slate-700 ring-slate-200',
  returned: 'bg-amber-50 text-amber-800 ring-amber-200',
  in_review: 'bg-sky-50 text-sky-800 ring-sky-200',
  awaiting_approval: 'bg-violet-50 text-violet-800 ring-violet-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
}

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: Status }) => (
  <Pill className={STATUS_STYLE[status]}>{STATUS_LABEL[status]}</Pill>
)

const PRIORITY_DOT: Record<Priority, string> = {
  Low: 'bg-slate-300',
  Normal: 'bg-sky-500',
  High: 'bg-rose-500',
}

export const PriorityLabel = ({ priority }: { priority: Priority }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span className={cx('size-1.5 rounded-full', PRIORITY_DOT[priority])} aria-hidden />
    {priority}
  </span>
)

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-lg border border-slate-200 bg-white', className)}>{children}</section>
}

export function CardHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {aside}
    </div>
  )
}
