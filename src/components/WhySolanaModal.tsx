import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Zap, Search, QrCode, Shield, Sparkles } from 'lucide-react'

interface WhySolanaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const WhySolanaModal: React.FC<WhySolanaModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[92vw] sm:w-full rounded-2xl p-6 bg-white border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-[#7B2FF7]">
              <Zap className="w-4 h-4" />
            </span>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Por que Solana?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Como a tecnologia torna a divisão de contas simples, instantânea e verificável para
            todos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3">
          {/* Card 1: Pagamentos */}
          <div className="p-3.5 rounded-xl border border-border bg-[#F7F7FB] hover:border-[#7B2FF7]/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Pagamentos</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A Solana permite pagamentos digitais rápidos e de baixo custo.
                </p>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[10px] font-medium"
                  >
                    Solana — Pagamentos
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transparência */}
          <div className="p-3.5 rounded-xl border border-border bg-[#F7F7FB] hover:border-[#7B2FF7]/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7B2FF7] flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Transparência</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transações podem possuir registros verificáveis.
                </p>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[10px] font-medium"
                  >
                    Solana — Transparência
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Solana Pay */}
          <div className="p-3.5 rounded-xl border border-border bg-[#F7F7FB] hover:border-[#7B2FF7]/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Solana Pay</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pode ser utilizado para criar experiências de cobrança e pagamento por QR Code.
                </p>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] font-medium"
                  >
                    Solana Pay — Cobrança
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Squads */}
          <div className="p-3.5 rounded-xl border border-border bg-[#F7F7FB] hover:border-[#7B2FF7]/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Squads</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Em uma evolução do produto, grupos como repúblicas, atléticas e centros acadêmicos
                  poderiam utilizar carteiras compartilhadas com regras de aprovação.
                </p>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-medium"
                  >
                    Squads — Evolução futura
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges footer list */}
        <div className="pt-2 border-t border-border flex flex-wrap gap-1.5 justify-center">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[#7B2FF7] text-[11px] font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Google Gemini — Inteligência
          </Badge>
          <Badge
            variant="outline"
            className="border-border bg-slate-50 text-foreground text-[11px] font-medium"
          >
            Solana — Pagamentos
          </Badge>
          <Badge
            variant="outline"
            className="border-border bg-slate-50 text-foreground text-[11px] font-medium"
          >
            Solana Pay — Cobrança
          </Badge>
          <Badge
            variant="outline"
            className="border-border bg-slate-50 text-foreground text-[11px] font-medium"
          >
            Squads — Evolução futura
          </Badge>
        </div>

        <p className="text-[11px] text-center text-muted-foreground pt-1">
          Recursos representados no protótipo para demonstração. Integrações reais estão em
          desenvolvimento.
        </p>
      </DialogContent>
    </Dialog>
  )
}
