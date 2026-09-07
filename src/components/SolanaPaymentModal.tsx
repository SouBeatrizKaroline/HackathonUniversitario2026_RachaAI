import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL, generateTxHash } from '@/types/racha'
import { Check, Copy, ExternalLink, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface SolanaPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  participantName: string
  rachaName: string
  onPaymentSuccess: (txHash: string) => void
}

export const SolanaPaymentModal: React.FC<SolanaPaymentModalProps> = ({
  open,
  onOpenChange,
  amount,
  participantName,
  rachaName,
  onPaymentSuccess,
}) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [showTxDetails, setShowTxDetails] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [fakeTimestamp, setFakeTimestamp] = useState<string>('')

  const handleSimulatePayment = () => {
    setStatus('processing')
    const hash = generateTxHash()
    setTxHash(hash)
    const now = new Date()
    setFakeTimestamp(
      `Slot #${Math.floor(290000000 + Math.random() * 500000)} • ${now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
    )

    setTimeout(() => {
      setStatus('success')
    }, 1200)
  }

  const handleConclude = () => {
    onPaymentSuccess(txHash)
    onOpenChange(false)
    // reset state after close
    setTimeout(() => {
      setStatus('idle')
      setShowTxDetails(false)
    }, 300)
  }

  const handleCopyHash = () => {
    navigator.clipboard.writeText(`solana-tx-${txHash}`)
    toast.success('ID da transação copiado!')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (status === 'processing') return
        onOpenChange(newOpen)
        if (!newOpen) {
          setTimeout(() => {
            setStatus('idle')
            setShowTxDetails(false)
          }, 200)
        }
      }}
    >
      <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl p-6 bg-white border border-border shadow-xl">
        {status !== 'success' ? (
          <div>
            <DialogHeader className="text-left pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Pagamento Coletivo
                </span>
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-700 bg-amber-50 text-[11px] font-medium"
                >
                  Demonstração
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground pt-1">
                Pague {formatCurrencyBRL(amount)}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Participante: <strong className="text-foreground">{participantName}</strong> •{' '}
                {rachaName}
              </p>
            </DialogHeader>

            <div className="py-5 flex flex-col items-center">
              {/* Demonstrable QR Code Card */}
              <div className="relative w-52 h-52 p-3 bg-white border-2 border-dashed border-[#7B2FF7]/40 rounded-2xl flex flex-col items-center justify-center shadow-subtle group hover:border-[#7B2FF7] transition-all">
                {/* Simulated QR Code SVG pattern */}
                <svg
                  className="w-40 h-40"
                  viewBox="0 0 140 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="140" height="140" rx="8" fill="#FBFBFF" />
                  {/* Top-left position block */}
                  <rect x="14" y="14" width="32" height="32" rx="4" fill="#7B2FF7" />
                  <rect x="20" y="20" width="20" height="20" rx="2" fill="#FFFFFF" />
                  <rect x="25" y="25" width="10" height="10" rx="1" fill="#7B2FF7" />

                  {/* Top-right position block */}
                  <rect x="94" y="14" width="32" height="32" rx="4" fill="#7B2FF7" />
                  <rect x="100" y="20" width="20" height="20" rx="2" fill="#FFFFFF" />
                  <rect x="105" y="25" width="10" height="10" rx="1" fill="#7B2FF7" />

                  {/* Bottom-left position block */}
                  <rect x="14" y="94" width="32" height="32" rx="4" fill="#7B2FF7" />
                  <rect x="20" y="100" width="20" height="20" rx="2" fill="#FFFFFF" />
                  <rect x="25" y="105" width="10" height="10" rx="1" fill="#7B2FF7" />

                  {/* Simulated matrix pixels */}
                  <rect x="54" y="18" width="6" height="6" fill="#1A1A2E" />
                  <rect x="66" y="18" width="8" height="6" fill="#1A1A2E" />
                  <rect x="78" y="18" width="6" height="6" fill="#1A1A2E" />
                  <rect x="54" y="28" width="10" height="6" fill="#7B2FF7" />
                  <rect x="70" y="28" width="14" height="6" fill="#1A1A2E" />
                  <rect x="58" y="40" width="8" height="8" fill="#1A1A2E" />
                  <rect x="74" y="40" width="6" height="8" fill="#7B2FF7" />
                  <rect x="18" y="56" width="8" height="8" fill="#1A1A2E" />
                  <rect x="32" y="56" width="6" height="6" fill="#7B2FF7" />
                  <rect x="46" y="54" width="12" height="10" fill="#1A1A2E" />
                  <rect x="66" y="56" width="10" height="6" fill="#1A1A2E" />
                  <rect x="84" y="54" width="8" height="12" fill="#7B2FF7" />
                  <rect x="100" y="58" width="12" height="6" fill="#1A1A2E" />
                  <rect x="118" y="54" width="8" height="8" fill="#1A1A2E" />
                  <rect x="56" y="72" width="14" height="6" fill="#1A1A2E" />
                  <rect x="76" y="70" width="12" height="8" fill="#7B2FF7" />
                  <rect x="96" y="74" width="8" height="8" fill="#1A1A2E" />
                  <rect x="112" y="72" width="14" height="6" fill="#1A1A2E" />
                  <rect x="54" y="86" width="8" height="8" fill="#7B2FF7" />
                  <rect x="70" y="84" width="16" height="6" fill="#1A1A2E" />
                  <rect x="92" y="88" width="12" height="6" fill="#1A1A2E" />
                  <rect x="54" y="100" width="10" height="8" fill="#1A1A2E" />
                  <rect x="72" y="98" width="10" height="12" fill="#7B2FF7" />
                  <rect x="90" y="102" width="8" height="8" fill="#1A1A2E" />
                  <rect x="106" y="98" width="18" height="10" fill="#1A1A2E" />
                  <rect x="58" y="116" width="14" height="10" fill="#1A1A2E" />
                  <rect x="80" y="118" width="10" height="8" fill="#7B2FF7" />
                  <rect x="98" y="116" width="8" height="8" fill="#1A1A2E" />
                  <rect x="114" y="116" width="12" height="10" fill="#1A1A2E" />

                  {/* Center Solana logo badge */}
                  <circle cx="70" cy="70" r="14" fill="#FFFFFF" stroke="#E4E4F0" strokeWidth="2" />
                  <path
                    d="M64 66L76 66M64 70L76 70M64 74L76 74"
                    stroke="#7B2FF7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Badge inside card */}
                <span className="absolute bottom-1 bg-white/95 px-2 py-0.5 rounded-full text-[10px] text-muted-foreground border border-border shadow-xs">
                  QR Code Demonstrativo
                </span>
              </div>

              {/* Solana label and explanation */}
              <div className="text-center mt-3 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#7B2FF7] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#7B2FF7] animate-pulse" />
                  Pagamento via Solana
                </div>
                <p className="text-xs text-muted-foreground max-w-xs px-2">
                  Pagamentos rápidos, de baixo custo e verificáveis.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSimulatePayment}
                disabled={status === 'processing'}
                className="w-full h-12 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando na rede...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Simular pagamento
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground/80 mt-2.5 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Demonstração de produto. Nenhum valor real será cobrado.
              </p>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-2 animate-fade-in-up">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mb-3">
              <Check className="w-9 h-9 text-emerald-600 stroke-[3]" />
            </div>

            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
              Pagamento confirmado! ✅
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 mb-4">
              Seu pagamento foi registrado com sucesso no racha.
            </p>

            {/* Receipt Card */}
            <div className="bg-[#F7F7FB] border border-border rounded-xl p-4 text-left space-y-2.5 text-xs mb-4">
              <div className="flex justify-between items-center py-0.5 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-bold text-base text-foreground tabular-nums">
                  {formatCurrencyBRL(amount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[11px]">
                  Confirmado
                </Badge>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted-foreground">Rede</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#7B2FF7]" />
                  Solana
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 pt-1 border-t border-border/60">
                <span className="text-muted-foreground">ID da transação</span>
                <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                  <span>{txHash}</span>
                  <button
                    onClick={handleCopyHash}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    title="Copiar ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible/Expandable details */}
            {showTxDetails && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left text-xs mb-4 space-y-1 text-amber-900 animate-fade-in">
                <div className="flex items-center gap-1 font-semibold text-amber-800">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Comprovante de Demonstração
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Transação simulada para demonstração. Nenhum valor real foi movido.
                </p>
                <div className="text-[10px] text-amber-700/80 pt-1 font-mono">{fakeTimestamp}</div>
              </div>
            )}

            <div className="space-y-2">
              {!showTxDetails ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTxDetails(true)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground border-border"
                >
                  Ver detalhes da transação
                </Button>
              ) : null}

              <Button
                onClick={handleConclude}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Concluir</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
