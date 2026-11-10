import { ROLES, ROLE_LABEL, ROLE_PERSON } from '../lib'
import { useStore } from '../store'

export function DemoBar({ onReset }: { onReset: () => void }) {
  const { role, setRole } = useStore()
  return (
    <div className="sticky top-0 z-20 bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">Demo · view as</span>
        <div role="radiogroup" aria-label="View as role" className="order-3 flex w-full rounded-md bg-slate-800 p-0.5 sm:order-none sm:w-auto">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className={`min-h-9 flex-1 rounded px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400 sm:min-h-8 sm:flex-none ${
                role === r ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <span className="hidden text-sm text-slate-400 md:inline">
          Signed in as <span className="text-slate-200">{ROLE_PERSON[role]}</span>
        </span>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto min-h-8 rounded-md border border-slate-600 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
        >
          Reset demo
        </button>
      </div>
    </div>
  )
}
