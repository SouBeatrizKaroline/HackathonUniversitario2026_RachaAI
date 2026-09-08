import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL } from '@/types/racha'
import { MonthlySummaryData } from '@/services/geminiService'
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  AlertTriangle,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface MonthlySummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: MonthlySummaryData | null
  isLoading?: boolean
  onRegenerate?: () => void
}

export const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({
  open,
  onOpenChange,
  summary,
  isLoading = false,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false)

  if (!summary && !isLoading) return null

  const shareText = summary
    ? `🏠 Resumo Mensal — ${summary.rachaName} (${summary.referenceMonth})\n\n${summary.geminiText}\n\nAcompanhe no Racha.AI: ${window.location.href}`
    : ''

  const handleCopyText = () => {
    if (!shareText) return
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    toast.success('Resumo copiado para a área de transferência! 📋')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    if (!shareText) return
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleShareTelegram = () => {
    if (!shareText) return
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      window.location.href,
    )}&text=${encodeURIComponent(`🏠 Resumo da República - ${summary?.rachaName}: \n\n${summary?.geminiText}`)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[94vw] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-[#7B2FF7]">
              <Sparkles className="w-5 h-5 text-[#7B2FF7]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Resumo Mensal da República
                </DialogTitle>
                <Badge className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[10px] font-bold">
                  Gemini IA
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {summary ? `${summary.rachaName} • ${summary.referenceMonth}` : 'Gerando com IA...'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#7B2FF7] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              O Gemini está analisando os pagamentos e pendências do mês...
            </p>
            <p className="text-xs text-muted-foreground">
              Calculando totais, histórico de atrasos e gerando texto amigável.
            </p>
          </div>
        ) : summary ? (
          <div className="space-y-4 pt-2">
            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
                  <span>Total Pago</span>
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold text-emerald-800 tabular-nums">
                  {formatCurrencyBRL(summary.paidAmount)}
                </div>
                <div className="text-[11px] text-emerald-700">
                  {summary.paidCount} de {summary.totalCount} moradores
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
                  <span>Total Pendente</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold text-amber-800 tabular-nums">
                  {formatCurrencyBRL(summary.pendingAmount)}
                </div>
                <div className="text-[11px] text-amber-700">
                  {summary.pendingCount} pendente{summary.pendingCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            {/* Ranking: Quem mais atrasa / pendências */}
            <div className="p-3.5 rounded-xl bg-[#F7F7FB] border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Status de pendências do mês
                </span>
                {summary.pendingCount === 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold">
                    Nenhum atraso 🎉
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-700 font-bold">
                    {summary.pendingCount} morador{summary.pendingCount === 1 ? '' : 'es'} devendo
                  </span>
                )}
              </div>

              {summary.topPending.length === 0 ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                  <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Parabéns pra república! Todo mundo pagou em dia neste mês. Ninguém atrasou!
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {summary.topPending.map((p, idx) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-border/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}º
                        </span>
                        <span className="font-bold text-foreground">{p.name}</span>
                        {p.monthsLate && p.monthsLate > 1 && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-amber-300 bg-amber-50 text-amber-700 px-1.5 py-0"
                          >
                            {p.monthsLate} meses pendentes
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold text-amber-700 tabular-nums">
                        {formatCurrencyBRL(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gemini Redaction Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/80 via-white to-amber-50/40 border border-purple-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B2FF7]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mensagem redigida pelo Gemini</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] border-purple-200 text-purple-700 bg-white"
                >
                  {summary.source === 'client_fallback' ? 'Heurística Local' : 'Google Gemini'}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-white/90 border border-purple-100 text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed font-sans shadow-2xs">
                {summary.geminiText}
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                ℹ️ Sugestão amigável em pt-BR gerada para ser enviada no grupo da república sem
                criar climão.
              </p>
            </div>

            {/* Sharing actions */}
            <div className="space-y-2 pt-1 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground block">
                Compartilhar resumo com a casa
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4 ml-0.5" />
                  </div>
                  <span className="text-xs font-bold">Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-border text-foreground transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-foreground flex items-center justify-center mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold">{copied ? 'Copiado!' : 'Copiar texto'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
