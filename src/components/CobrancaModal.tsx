import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrencyBRL, Participant } from '@/types/racha'
import { Copy, Check, MessageCircle, Send, BellRing } from 'lucide-react'
import { toast } from 'sonner'

interface CobrancaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rachaName: string
  shareCode: string
  participant?: Participant | null
  participantsList?: Participant[]
  isBatch?: boolean
}

export const CobrancaModal: React.FC<CobrancaModalProps> = ({
  open,
  onOpenChange,
  rachaName,
  shareCode,
  participant,
  participantsList,
  isBatch = false,
}) => {
  const [copied, setCopied] = useState(false)

  const activeParticipants = isBatch
    ? participantsList && participantsList.length > 0
      ? participantsList
      : []
    : participant
      ? [participant]
      : []

  if (activeParticipants.length === 0) return null

  const realUrl = `${window.location.origin}/racha/${shareCode || 'viagem-congresso-7k2m'}`

  const totalBatchPending = activeParticipants.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingNames = activeParticipants
    .map((p) => `${p.name} (${formatCurrencyBRL(p.amount)})`)
    .join(', ')

  // Friendly reminder message in Brazilian Portuguese
  const friendlyMessage = isBatch
    ? `Oi pessoal! ⚠️ O mês está acabando e passando só para lembrar de fechar as contas do racha "${rachaName}".\n\nTotal ainda pendente: ${formatCurrencyBRL(
        totalBatchPending,
      )}.\nPendências: ${pendingNames}.\n\nVocê pode conferir os detalhes e pagar por aqui:\n${realUrl}\n\nValeu! 🙌`
    : `Oi ${activeParticipants[0].name}! Passando só para lembrar do nosso racha "${rachaName}".\n\nSua parte é ${formatCurrencyBRL(
        activeParticipants[0].amount,
      )}.\n\nVocê pode conferir os detalhes e pagar por aqui:\n${realUrl}\n\nValeu! 🙌`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(realUrl)
    setCopied(true)
    toast.success('Link de cobrança copiado! ✅')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(friendlyMessage)
    toast.success('Mensagem amigável copiada! ✅')
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(friendlyMessage)}`
    window.open(url, '_blank')
  }

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      realUrl,
    )}&text=${encodeURIComponent(
      `Oi ${participant.name}! Cobrança amigável do racha "${rachaName}" (${formatCurrencyBRL(
        participant.amount,
      )}):`,
    )}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw] rounded-2xl p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <BellRing className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {isBatch
                  ? 'Cobrança em massa (fim do mês)'
                  : `Cobrar ${activeParticipants[0].name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isBatch
                  ? `${activeParticipants.length} pendentes • Total de ${formatCurrencyBRL(totalBatchPending)}`
                  : `Lembrete amigável de ${formatCurrencyBRL(activeParticipants[0].amount)}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Share Channels */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Enviar cobrança direta
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 shadow-xs group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 ml-0.5" />
                </div>
                <span className="text-xs font-bold">Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-border text-foreground transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 text-foreground flex items-center justify-center mb-1 shadow-xs group-hover:scale-105 transition-transform">
                  <Copy className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{copied ? 'Copiado!' : 'Copiar link'}</span>
              </button>
            </div>
          </div>

          {/* Friendly pre-written message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">
                Mensagem personalizada
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-[#7B2FF7] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar texto
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={friendlyMessage}
              className="w-full p-3 rounded-xl bg-[#F7F7FB] border border-border text-xs text-foreground font-sans resize-none focus:outline-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
