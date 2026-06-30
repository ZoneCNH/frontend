import {
  LayoutDashboard,
  TrendingUp,
  Heart,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type ModuleId = 'binance' | 'market-data' | 'macro-data'

export interface ModuleRoute {
  path: string
  label: string
  icon: LucideIcon
}

export interface ModuleDefinition {
  id: ModuleId
  name: string
  description: string
  icon: LucideIcon
  routes: ModuleRoute[]
}

const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  binance: {
    id: 'binance',
    name: 'Binance',
    description: 'Binance 行情采集与服务平台',
    icon: TrendingUp,
    routes: [
      { path: '/binance', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/binance/market', label: 'Market Data', icon: TrendingUp },
      { path: '/binance/health', label: 'Health', icon: Heart },
      { path: '/binance/alerts', label: 'Alerts', icon: Bell },
      { path: '/binance/admin', label: 'Admin', icon: Settings },
    ],
  },
  'market-data': {
    id: 'market-data',
    name: 'Market Data',
    description: '通用行情数据管理',
    icon: TrendingUp,
    routes: [],
  },
  'macro-data': {
    id: 'macro-data',
    name: 'Macro Data',
    description: '宏观经济数据管理',
    icon: TrendingUp,
    routes: [],
  },
}

export function getModule(id: ModuleId): ModuleDefinition | undefined {
  return MODULE_REGISTRY[id]
}

export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY)
}

export function getActiveModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter(m => m.routes.length > 0)
}
