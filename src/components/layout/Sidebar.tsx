import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { getModule } from '../../modules/registry'
import type { ModuleId } from '../../modules/registry'

export function Sidebar() {
  const location = useLocation()
  const segments = location.pathname.split('/')
  const moduleId = (segments[1] || 'binance') as ModuleId
  const module = getModule(moduleId)

  if (!module || module.routes.length === 0) return null

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-bg-surface py-3">
      {/* Module header */}
      <div className="mb-2 px-4">
        <div className="flex items-center gap-2">
          <module.icon size={18} className="text-accent-blue" />
          <span className="text-sm font-semibold text-text-primary">{module.name}</span>
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{module.description}</p>
      </div>

      {/* Module routes */}
      <nav className="flex flex-col gap-0.5 px-2" aria-label={`${module.name} navigation`}>
        {module.routes.map(route => {
          const isActive =
            route.path === '/binance'
              ? location.pathname === '/binance'
              : location.pathname.startsWith(route.path)

          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={cn(
                'flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-bg-elevated text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              <route.icon size={16} />
              {route.label}
            </NavLink>
          )
        })}
      </nav>

      {/* SLO summary at bottom */}
      <div className="mt-auto px-4 pt-4">
        <div className="rounded border border-border bg-bg-elevated p-3">
          <p className="text-xs font-medium text-text-secondary">SLO Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-green shadow-[0_0_4px_#00E676]" />
            <span className="text-xs text-text-primary">All Passing</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
