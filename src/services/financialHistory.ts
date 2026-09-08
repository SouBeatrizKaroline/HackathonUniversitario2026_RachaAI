import { Racha, FinancialSummaryAggregated, RachaCategory } from '@/types/racha'

export function computeFinancialSummary(rachas: Racha[]): FinancialSummaryAggregated {
  let totalSplit = 0
  let totalCollected = 0
  let totalPending = 0
  let rachasCount = rachas.length
  let paymentsCount = 0
  let pendingPaymentsCount = 0

  const monthMap = new Map<string, { total: number; paid: number; count: number; date: Date }>()
  const categoryMap = new Map<RachaCategory, { total: number; count: number }>()

  for (const racha of rachas) {
    totalSplit += racha.totalAmount

    let rachaPaid = 0
    let rachaPending = 0

    for (const p of racha.participants) {
      if (p.paid) {
        totalCollected += p.amount
        rachaPaid += p.amount
        paymentsCount++
      } else {
        totalPending += p.amount
        rachaPending += p.amount
        pendingPaymentsCount++
      }
    }

    // Category aggregation
    const cat = racha.category || 'Outro'
    const currCat = categoryMap.get(cat) || { total: 0, count: 0 }
    currCat.total += racha.totalAmount
    currCat.count += 1
    categoryMap.set(cat, currCat)

    // Month aggregation
    const dateObj = new Date(racha.createdAt || Date.now())
    const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear()
    const month = isNaN(dateObj.getMonth()) ? new Date().getMonth() : dateObj.getMonth()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

    const currMonth = monthMap.get(monthKey) || {
      total: 0,
      paid: 0,
      count: 0,
      date: new Date(year, month, 1),
    }
    currMonth.total += racha.totalAmount
    currMonth.paid += rachaPaid
    currMonth.count += 1
    monthMap.set(monthKey, currMonth)
  }

  // Sort months chronologically
  const sortedMonthEntries = Array.from(monthMap.entries()).sort(
    (a, b) => a[1].date.getTime() - b[1].date.getTime(),
  )

  const byMonth = sortedMonthEntries.map(([key, item]) => {
    const label = item.date.toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    })
    return {
      monthKey: key,
      label: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''),
      total: item.total,
      paid: item.paid,
      rachasCount: item.count,
    }
  })

  const byCategory = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    total: val.total,
    count: val.count,
  }))

  const completionRate =
    totalSplit > 0 ? Math.min(100, Math.round((totalCollected / totalSplit) * 100)) : 0

  return {
    totalSplit,
    totalCollected,
    totalPending,
    rachasCount,
    paymentsCount,
    pendingPaymentsCount,
    completionRate,
    byMonth,
    byCategory,
  }
}
