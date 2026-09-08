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
import { Copy, Check, MessageCircle, Send, BellRing, Mail, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendRachaEmailInvites } from '@/services/invites'
import { useAuth } from '@/context/AuthContext'

interface CobrancaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rachaName: string
  shareCode: string
  rachaId?: string
  participant?: Participant | null
  participantsList?: Participant[]
  isBatch?: boolean
}

export const CobrancaModal: React.FC<CobrancaModalProps> = ({
  open,
  onOpenChange,
  rachaName,
  shareCode,
  rachaId,
  participant,
  participantsList,
  isBatch = false,
}) => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
  } | null>(null)

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

  const perPersonAmount = isBatch
    ? activeParticipants.length > 0
      ? totalBatchPending / activeParticipants.length
      : 0
    : activeParticipants[0].amount

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    const rawEmails = emailInput
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    if (rawEmails.length === 0) {
      toast.error('Digite ao menos um e-mail válido.')
      return
    }

    setIsSendingEmail(true)
    setEmailFeedback(null)
    try {
      const res = await sendRachaEmailInvites({
        rachaId: rachaId || shareCode || 'demo',
        rachaName,
        shareCode: shareCode || 'demo',
        invitedBy: user?.name || 'Organizador',
        perPersonAmount,
        emails: rawEmails,
      })

      if (res.smtpEnabled && res.sentCount > 0) {
        toast.success(`E-mail enviado para ${res.sentCount} convidado(s)! 🚀`)
        setEmailFeedback({
          type: 'success',
          text: `Convite enviado com sucesso para ${res.sentCount} destinatário(s) via SMTP!`,
        })
        setEmailInput('')
      } else {
        toast.info('Convite(s) registrado(s) no sistema.')
        setEmailFeedback({
          type: 'warning',
          text:
            res.message ||
            'Convite registrado no banco de dados. Para entrega real na caixa de entrada, configure as variáveis SMTP no painel.',
        })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar convite por e-mail.')
      setEmailFeedback({
        type: 'error',
        text: 'Não foi possível enviar os convites por e-mail. Verifique os dados e tente novamente.',
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

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
      <DialogContent className="max-w-lg w-[94vw] rounded-2xl p-6 bg-white border border-border shadow-2xl">
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

        <Tabs defaultValue="mensagens" className="w-full pt-1">
          <TabsList className="grid grid-cols-2 w-full mb-3 bg-[#F7F7FB] p-1 rounded-xl">
            <TabsTrigger value="mensagens" className="rounded-lg text-xs font-bold">
              WhatsApp / Telegram
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#7B2FF7]" />
              Convidar por e-mail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mensagens" className="space-y-4 m-0">
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
                rows={4}
                value={friendlyMessage}
                className="w-full p-3 rounded-xl bg-[#F7F7FB] border border-border text-xs text-foreground font-sans resize-none focus:outline-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-3.5 m-0">
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#7B2FF7]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Convite oficial por e-mail</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                O participante recebe um e-mail com a marca Racha.AI informando o nome do racha e
                sua parte de <strong>{formatCurrencyBRL(perPersonAmount)}</strong>, com o link
                direto para acompanhar e pagar.
              </p>
            </div>

            {emailFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  emailFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : emailFeedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {emailFeedback.text}
              </div>
            )}

            <form onSubmit={handleSendEmailInvite} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  E-mail(s) dos participantes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="amigo1@faculdade.edu.br, amigo2@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F7FB] border border-border text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#7B2FF7]"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Dica: separe múltiplos e-mails por vírgula ou nova linha.
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSendingEmail || !emailInput.trim()}
                className="w-full h-10 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold rounded-xl text-xs gap-2 shadow-md transition-all"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enviando convite...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    Enviar convite por e-mail
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
