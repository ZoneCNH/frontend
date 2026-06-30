import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'
import type { ModuleDefinition } from '../../modules/registry'

type Props = {
  modules: ModuleDefinition[]
}

export function AppLayout({ modules }: Props) {
  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <TopNav modules={modules} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
