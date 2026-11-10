import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { reducer, type Action } from './reducer'
import { createSeed } from './seed'
import type { Rec, Role } from './types'

const KEY = 'approval-workflow-demo:v1'

interface Persisted {
  records: Rec[]
  role: Role
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted
      if (Array.isArray(parsed.records) && parsed.role) return parsed
    }
  } catch {
    // Storage unavailable or corrupt: fall back to fresh sample data.
  }
  return { records: createSeed(), role: 'intake' }
}

/** Distributive omit so each action variant keeps its own fields. */
type Dispatchable = Action extends infer A ? (A extends { at: number } ? Omit<A, 'at' | 'role'> : never) : never

interface Store {
  records: Rec[]
  role: Role
  setRole: (r: Role) => void
  /** Dispatches an action as the current role, stamped with the current time. */
  act: (a: Dispatchable) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load)
  const [records, dispatch] = useReducer(reducer, initial.records)
  const [role, setRole] = useState<Role>(initial.role)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ records, role } satisfies Persisted))
    } catch {
      // Ignore: the demo still works in memory.
    }
  }, [records, role])

  const act = useCallback(
    (a: Dispatchable) => dispatch({ ...a, at: Date.now(), role } as Action),
    [role],
  )
  const reset = useCallback(() => {
    dispatch({ type: 'replace', records: createSeed() })
    setRole('intake')
  }, [])

  const value = useMemo(() => ({ records, role, setRole, act, reset }), [records, role, act, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
