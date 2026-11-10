import { useEffect, useSyncExternalStore } from 'react'
import { DemoBar } from './components/DemoBar'
import { RecordDetail } from './components/RecordDetail'
import { RecordList } from './components/RecordList'
import { Button } from './components/ui'
import { StoreProvider, useStore } from './store'

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const useHash = () => useSyncExternalStore(subscribe, () => window.location.hash)

function Shell() {
  const { records, reset } = useStore()
  const hash = useHash()
  const id = hash.match(/^#\/r\/(.+)$/)?.[1]
  const rec = id ? records.find((r) => r.id === decodeURIComponent(id)) : undefined

  // Start every screen at the top, like a page navigation would.
  useEffect(() => window.scrollTo(0, 0), [id])

  const onReset = () => {
    reset()
    window.location.hash = '#/'
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBar onReset={onReset} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
            <span className="grid size-6 place-items-center rounded-md bg-indigo-600 text-white" aria-hidden>
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5l3 3 6-6.5" />
              </svg>
            </span>
            Approval Workflow
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {id && !rec ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-900">Request not found</p>
            <p className="mt-1 text-sm text-slate-600">It may have been removed by a demo reset.</p>
            <Button className="mt-4" onClick={() => (window.location.hash = '#/')}>
              Back to all requests
            </Button>
          </div>
        ) : rec ? (
          <RecordDetail key={rec.id} rec={rec} />
        ) : (
          <RecordList />
        )}
      </main>

      <footer className="border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500 sm:px-6">Demo · sample data only</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
