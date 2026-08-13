const KG_PER_LB = 0.45359237

export function kgToLb(kg: number, step = 5): number {
  const lb = kg / KG_PER_LB
  if (step <= 0) return Math.round(lb)
  const snapped = Math.round(lb / step) * step
  return Number.isInteger(snapped) ? snapped : Math.round(snapped * 10) / 10
}

export function lbToKg(lb: number): number {
  return Math.round((lb * KG_PER_LB) * 100) / 100
}

export function formatLb(kg?: number): string {
  if (kg == null) return 'lb'
  return `${kgToLb(kg)} lb`
}

export function formatVolumeLb(kg: number): string {
  return `${Math.round(kg / KG_PER_LB).toLocaleString()} lb`
}
