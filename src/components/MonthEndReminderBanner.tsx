import React, { useState, useEffect } from 'react'
import { Racha, formatCurrencyBRL } from '@/types/racha'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BellRing, X, ArrowRight } from 'lucide-react'
import { CobrancaModal } from '@/components/CobrancaModal'

interface MonthEndReminderBannerProps {
  recurringRachas: Racha[]
  forceCheck?: boolean
}

interface PendingReminder {
  racha: Racha
  pendingCount: number
  pendingTotal: number
  daysUntilMonthEnd: number
}

const DISMISS_KEY_PREFIX = 'rachaai_dismiss_reminder_'

export const MonthEndReminderBanner: React.FC<MonthEndReminderBannerProps> = ({
  recurringRachas,
  forceCheck = false,
}) => {
  const [selectedRachaForBatch, setSelectedRachaForBatch] = useState<Racha | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [dismissedRachas, setDismissedRachas] = useState<Record<string, boolean>>({})

  // Determine current day of month and days remaining
  const now = new Date()
  const currentDay = now.getDate()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysUntilMonthEnd = lastDayOfMonth - currentDay
  const isMonthEnding = daysUntilMonthEnd <= 5 || forceCheck // Últimos 5 dias do mês

  const todayDateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

  // Check which reminders are dismissed today
  useEffect(() => {
    try {
      const dismissed: Record<string, boolean> = {}
      for (const r of recurringRachas) {
        const storedDate = localStorage.getItem(`${DISMISS_KEY_PREFIX}${r.id}`)
        if (storedDate === todayDateStr) {
          dismissed[r.id] = true
        }
      }
      setDismissedRachas(dismissed)
    } catch {
      /* ignore */
    }
  }, [recurringRachas, todayDateStr])

  // Filter qualifying recurring rachas with pending participants
  const qualifyingReminders: PendingReminder[] = []

  for (const racha of recurringRachas) {
    if (dismissedRachas[racha.id]) continue

    const pendingParts = racha.participants.filter((p) => !p.paid)
    if (pendingParts.length === 0) continue

    const pendingTotal = pendingParts.reduce((acc, curr) => acc + curr.amount, 0)
    qualifyingReminders.push({
      racha,
      pendingCount: pendingParts.length,
      pendingTotal,
      daysUntilMonthEnd,
    })
  }

  // Only display if we're in the last 5 days (or forceCheck) and there's at least 1 pending recurring racha
  if (!isMonthEnding || qualifyingReminders.length === 0) {
    return null
  }

  const handleDismiss = (rachaId: string) => {
    try {
      localStorage.setItem(`${DISMISS_KEY_PREFIX}${rachaId}`, todayDateStr)
      setDismissedRachas((prev) => ({ ...prev, [rachaId]: true }))
    } catch {
      /* ignore */
    }
  }

  const handleOpenBatchCobranca = (racha: Racha) => {
    setSelectedRachaForBatch(racha)
    setIsBatchModalOpen(true)
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {qualifyingReminders.map(({ racha, pendingCount, pendingTotal, daysUntilMonthEnd }) => (
        <div
          key={racha.id}
          className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/80 p-4 sm:p-4.5 shadow-subtle"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </span>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Lembrete automático de fim de mês
                  </span>
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {daysUntilMonthEnd === 0
                      ? 'Último dia do mês!'
                      : daysUntilMonthEnd === 1
                        ? 'Falta 1 dia'
                        : `Faltam ${daysUntilMonthEnd} dias`}
                  </span>
                </div>

                <p className="text-sm font-bold text-foreground">
                  ⚠️ O mês está acabando e ainda faltam {pendingCount} pagamento
                  {pendingCount === 1 ? '' : 's'} no racha{' '}
                  <span className="text-[#7B2FF7]">{racha.recurringGroupName || racha.name}</span> —{' '}
                  <span className="text-amber-800 font-extrabold">
                    {formatCurrencyBRL(pendingTotal)}
                  </span>{' '}
                  pendentes.
                </p>

                <p className="text-xs text-muted-foreground">
                  Como organizador, você pode cobrar todos os pendentes de uma vez só ou enviar
                  lembrete amigável no WhatsApp da república.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                size="sm"
                onClick={() => handleOpenBatchCobranca(racha)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-3.5 shadow-xs gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Cobrar todos ({pendingCount})</span>
              </Button>

              <button
                type="button"
                onClick={() => handleDismiss(racha.id)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-amber-100/70 transition-colors"
                title="Dispensar por hoje"
                aria-label="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {selectedRachaForBatch && (
        <CobrancaModal
          open={isBatchModalOpen}
          onOpenChange={setIsBatchModalOpen}
          rachaName={selectedRachaForBatch.recurringGroupName || selectedRachaForBatch.name}
          shareCode={selectedRachaForBatch.shareCode || selectedRachaForBatch.id}
          participantsList={selectedRachaForBatch.participants.filter((p) => !p.paid)}
          isBatch={true}
        />
      )}
    </div>
  )
}
