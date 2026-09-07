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
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rachaName: string
  shareCode: string
  perPersonAmount: number
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onOpenChange,
  rachaName,
  shareCode,
  perPersonAmount,
}) => {
  const [copied, setCopied] = useState(false)

  const fakeLink = `racha.ai/r/${shareCode || 'viagem-congresso-7k2m'}`

  const suggestedMessage = `🎓 Racha do(a) ${rachaName}\n\nSua parte: ${formatCurrencyBRL(
    perPersonAmount,
  )}\n\nAcompanhe e pague pelo Racha.AI:\nhttps://${fakeLink}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${fakeLink}`)
    setCopied(true)
    toast.success('Link copiado! ✅')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(suggestedMessage)}`
    window.open(url, '_blank')
  }

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      `https://${fakeLink}`,
    )}&text=${encodeURIComponent(`🎓 Racha: ${rachaName} - Sua parte: ${formatCurrencyBRL(perPersonAmount)}`)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw] rounded-2xl p-6 bg-white border border-border shadow-2xl">
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

        <div className="space-y-4 pt-2">
          {/* Fictitious Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Link compartilhável
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={fakeLink}
                className="h-10 text-xs sm:text-sm font-mono bg-[#F7F7FB] border-border text-foreground"
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
            <label className="text-xs font-semibold text-muted-foreground">Mensagem sugerida</label>
            <textarea
              readOnly
              rows={4}
              value={suggestedMessage}
              className="w-full p-2.5 rounded-xl bg-[#F7F7FB] border border-border text-xs text-muted-foreground font-mono resize-none focus:outline-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
