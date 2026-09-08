import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Racha, formatCurrencyBRL } from '@/types/racha'
import {
  exportRachaSummary,
  generateRachaSummaryImage,
  downloadDataUrl,
} from '@/services/exportRachaService'
import { Download, Share2, FileImage, Loader2, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface ExportSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  racha: Racha
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  open,
  onOpenChange,
  racha,
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Generate preview when modal opens
  React.useEffect(() => {
    let cancelled = false
    if (open) {
      setIsGenerating(true)
      generateRachaSummaryImage(racha)
        .then((url) => {
          if (!cancelled) {
            setPreviewUrl(url)
            setIsGenerating(false)
          }
        })
        .catch((err) => {
          console.error(err)
          if (!cancelled) setIsGenerating(false)
        })
    } else {
      setPreviewUrl(null)
      setDownloadSuccess(false)
    }

    return () => {
      cancelled = true
    }
  }, [open, racha])

  const handleDownload = async () => {
    try {
      if (previewUrl) {
        const safeName = racha.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 30)

        const filename = `resumo-${safeName}-${new Date().toISOString().slice(0, 10)}.png`
        downloadDataUrl(previewUrl, filename)
      } else {
        await exportRachaSummary(racha)
      }

      setDownloadSuccess(true)
      toast.success('Comprovante baixado com sucesso! 📥')
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar comprovante.')
    }
  }

  const handleShareNavigator = async () => {
    if (!previewUrl) return
    try {
      if (navigator.share && navigator.canShare) {
        // Convert dataUrl to blob for Web Share API
        const res = await fetch(previewUrl)
        const blob = await res.blob()
        const file = new File([blob], `resumo-${racha.name}.png`, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Resumo do Racha: ${racha.name}`,
            text: `Fechamento de contas do racha "${racha.name}". Confira os detalhes no anexo.`,
            files: [file],
          })
          toast.success('Comprovante compartilhado!')
          return
        }
      }
    } catch {
      // User cancelled or unsupported
    }

    // Fallback: download
    handleDownload()
  }

  const paidCount = racha.participants.filter((p) => p.paid).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[94vw] max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-[#7B2FF7]">
              <FileImage className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Exportar comprovante do racha
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Baixe uma imagem com o fechamento completo das contas para o grupo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Summary Highlights */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-xl bg-[#F7F7FB] border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground block">Meta</span>
              <span className="font-extrabold text-foreground tabular-nums">
                {formatCurrencyBRL(racha.totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block">Arrecadado</span>
              <span className="font-extrabold text-emerald-700 tabular-nums">
                {formatCurrencyBRL(
                  racha.participants.filter((p) => p.paid).reduce((acc, c) => acc + c.amount, 0),
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Status</span>
              <span className="font-bold text-foreground">
                {paidCount}/{racha.participants.length} pagos
              </span>
            </div>
          </div>

          {/* Preview Canvas Area */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground block">
              Pré-visualização do documento
            </span>

            <div className="w-full rounded-xl border border-border overflow-hidden bg-slate-100 max-h-72 sm:max-h-80 overflow-y-auto flex items-center justify-center p-2 relative shadow-inner">
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7B2FF7]" />
                  <span className="text-xs font-medium">
                    Renderizando artefato de alta resolução...
                  </span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Comprovante do racha ${racha.name}`}
                  className="w-full rounded-lg shadow-sm object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground py-8">Erro ao carregar visualização.</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar imagem PNG</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleShareNavigator}
              disabled={isGenerating}
              className="h-11 border-border hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#7B2FF7]" />
              <span>Compartilhar</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Inclui badge oficial <strong>Racha.AI Verificado</strong> e comprovantes individuais de
            cada participante.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
