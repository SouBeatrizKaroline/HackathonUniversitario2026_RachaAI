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
import { formatCurrencyBRL } from '@/types/racha'
import { Share2, Copy, Check, MessageCircle, Send, Mail, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendRachaEmailInvites } from '@/services/invites'
import { useAuth } from '@/context/AuthContext'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rachaName: string
  shareCode: string
  rachaId?: string
  perPersonAmount: number
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onOpenChange,
  rachaName,
  shareCode,
  rachaId,
  perPersonAmount,
}) => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    text: string
  } | null>(null)

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
        toast.info('Convite registrado no sistema.')
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

  // Real URL linking directly to the live racha route
  const realUrl = `${window.location.origin}/racha/${shareCode || 'viagem-congresso-7k2m'}`

  const suggestedMessage = `🎓 Racha: ${rachaName}\n\nSua parte: ${formatCurrencyBRL(
    perPersonAmount,
  )}\n\nAcompanhe e pague pelo Racha.AI:\n${realUrl}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(realUrl)
    setCopied(true)
    toast.success('Link de convite copiado! ✅')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(suggestedMessage)}`
    window.open(url, '_blank')
  }

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      realUrl,
    )}&text=${encodeURIComponent(`🎓 Racha: ${rachaName} - Sua parte: ${formatCurrencyBRL(perPersonAmount)}`)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[94vw] rounded-2xl p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-[#7B2FF7]">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Compartilhar racha
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Envie para o grupo no WhatsApp ou Telegram
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full pt-1">
          <TabsList className="grid grid-cols-2 w-full mb-3 bg-[#F7F7FB] p-1 rounded-xl">
            <TabsTrigger value="link" className="rounded-lg text-xs font-bold">
              Link & Mensagens
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#7B2FF7]" />
              Convidar por e-mail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 m-0">
            {/* Real Link Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Link compartilhável
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={realUrl}
                  className="h-10 text-xs sm:text-sm font-mono bg-[#F7F7FB] border-border text-foreground truncate"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  variant="outline"
                  className="h-10 px-3 text-xs font-semibold shrink-0 border-border hover:bg-slate-50"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share Icon Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Enviar diretamente
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp */}
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

                {/* Telegram */}
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

                {/* Copiar Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-border text-foreground transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-foreground flex items-center justify-center mb-1 shadow-xs group-hover:scale-105 transition-transform">
                    <Copy className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Pre-written message preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Mensagem sugerida
              </label>
              <textarea
                readOnly
                rows={3}
                value={suggestedMessage}
                className="w-full p-2.5 rounded-xl bg-[#F7F7FB] border border-border text-xs text-muted-foreground font-mono resize-none focus:outline-none"
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
                Envie o convite formal com a marca Racha.AI e a parte individual estimada (
                <strong>{formatCurrencyBRL(perPersonAmount)}</strong>). Ao abrir o link, os amigos
                entram direto neste racha!
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
                  E-mail(s) dos convidados
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
