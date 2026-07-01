import { cn } from '../../../lib/utils'

const ALL_PRODUCT_LINES = ['spot', 'um_perp', 'cm_perp', 'options'] as const
export type ProductLine = (typeof ALL_PRODUCT_LINES)[number]

const PL_LABELS: Record<ProductLine, string> = {
  spot: 'Spot', um_perp: 'USDⓈ-M', cm_perp: 'COIN-M', options: 'Options',
}

type Props = {
  lines: { productLine: string }[]
  selected: ProductLine | null
  onChange: (pl: ProductLine | null) => void
}

export function ProductLineFilter({ lines, selected, onChange }: Props) {
  const activeSet = new Set(lines.map(l => l.productLine))

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium transition-colors',
          selected === null
            ? 'bg-accent-blue text-bg-primary'
            : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
        )}
      >
        All
      </button>
      {ALL_PRODUCT_LINES.map(pl => (
        <button
          key={pl}
          type="button"
          onClick={() => onChange(pl)}
          disabled={!activeSet.has(pl)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            !activeSet.has(pl) && 'cursor-not-allowed opacity-30',
            selected === pl
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
          )}
        >
          {PL_LABELS[pl]}
          {lines.find(l => l.productLine === pl) && (
            <span className="ml-1 text-[10px] opacity-60">●</span>
          )}
        </button>
      ))}
    </div>
  )
}
