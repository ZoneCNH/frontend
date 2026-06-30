import { NavLink, useLocation } from 'react-router-dom'
import type { ModuleDefinition } from '../../modules/registry'

type Props = {
  modules: ModuleDefinition[]
}

export function TopNav({ modules }: Props) {
  const location = useLocation()
  const currentModuleId = location.pathname.split('/')[1] || 'binance'

  return (
    <header className="flex h-12 items-center border-b border-border bg-bg-surface px-4">
      {/* Logo */}
      <NavLink
        to="/"
        className="mr-6 flex items-center gap-2 text-text-primary no-underline"
      >
        <span className="text-lg font-semibold tracking-tight">ZoneCNH</span>
      </NavLink>

      {/* Module Switcher */}
      <nav className="flex items-center gap-1" aria-label="Module switcher">
        {modules.map(mod => {
          const isActive = currentModuleId === mod.id
          return (
            <NavLink
              key={mod.id}
              to={mod.routes[0]?.path ?? `/${mod.id}`}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-bg-elevated text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              <mod.icon size={16} />
              {mod.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Right side — status indicators */}
      <div className="ml-auto flex items-center gap-3">
        <StatusDot label="Client" />
        <StatusDot label="Server" />
      </div>
    </header>
  )
}

function StatusDot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span className="inline-block h-2 w-2 rounded-full bg-accent-green shadow-[0_0_6px_#00E676]" />
      {label}
    </div>
  )
}
