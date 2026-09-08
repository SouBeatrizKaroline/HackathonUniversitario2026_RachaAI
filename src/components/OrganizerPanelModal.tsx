import React, { useState, useEffect } from 'react'
import {
  Racha,
  Participant,
  formatCurrencyBRL,
  parseCurrencyInput,
  generateId,
} from '@/types/racha'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sliders,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Equal,
  ShieldAlert,
  Repeat,
  BellRing,
} from 'lucide-react'
import { toast } from 'sonner'
import { CobrancaModal } from '@/components/CobrancaModal'

interface OrganizerPanelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  racha: Racha
  onSave: (changes: {
    name: string
    totalAmount: number
    splitType: 'equal' | 'custom'
    participants: Participant[]
    isRecurring?: boolean
    recurringGroupName?: string
  }) => Promise<void>
}

export const OrganizerPanelModal: React.FC<OrganizerPanelModalProps> = ({
  open,
  onOpenChange,
  racha,
  onSave,
}) => {
  const [name, setName] = useState(racha.name)
  const [totalAmount, setTotalAmount] = useState(racha.totalAmount)
  const [rawTotalInput, setRawTotalInput] = useState(formatCurrencyBRL(racha.totalAmount))
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>(racha.splitType || 'equal')
  const [participants, setParticipants] = useState<Participant[]>(racha.participants)
  const [isRecurring, setIsRecurring] = useState(Boolean(racha.isRecurring))
  const [recurringGroupName, setRecurringGroupName] = useState(
    racha.recurringGroupName || racha.name.replace(/ - \w+\/\d+$/, ''),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isBatchCobrancaOpen, setIsBatchCobrancaOpen] = useState(false)

  // Reset form whenever modal opens with latest racha
  useEffect(() => {
    if (open) {
      setName(racha.name)
      setTotalAmount(racha.totalAmount)
      setRawTotalInput(formatCurrencyBRL(racha.totalAmount))
      setSplitMode(racha.splitType || 'equal')
      setParticipants(racha.participants)
      setIsRecurring(Boolean(racha.isRecurring))
      setRecurringGroupName(racha.recurringGroupName || racha.name.replace(/ - \w+\/\d+$/, ''))
    }
  }, [open, racha])

  const redistributeEqually = (total: number, parts: Participant[]) => {
    if (parts.length === 0) return parts
    const baseShare = Math.floor((total / parts.length) * 100) / 100
    let runningSum = 0

    return parts.map((p, idx) => {
      if (idx === parts.length - 1) {
        const lastAmount = Math.round((total - runningSum) * 100) / 100
        return { ...p, amount: Math.max(0, lastAmount) }
      }
      runningSum += baseShare
      return { ...p, amount: baseShare }
    })
  }

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrencyInput(e.target.value)
    setTotalAmount(parsed)
    setRawTotalInput(parsed > 0 ? formatCurrencyBRL(parsed) : '')

    if (splitMode === 'equal') {
      setParticipants((prev) => redistributeEqually(parsed, prev))
    }
  }

  const handleSetSplitEqual = () => {
    setSplitMode('equal')
    setParticipants((prev) => redistributeEqually(totalAmount, prev))
  }

  const handleAddParticipant = () => {
    const newCount = participants.length + 1
    const newP: Participant = {
      id: `new-${generateId()}`,
      name: `Participante ${newCount}`,
      amount: 0,
      paid: false,
    }

    const updated = [...participants, newP]
    if (splitMode === 'equal') {
      setParticipants(redistributeEqually(totalAmount, updated))
    } else {
      setParticipants(updated)
    }
  }

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      toast.error('O racha deve ter pelo menos um participante.')
      return
    }
    const updated = participants.filter((p) => p.id !== id)
    if (splitMode === 'equal') {
      setParticipants(redistributeEqually(totalAmount, updated))
    } else {
      setParticipants(updated)
    }
  }

  const handleUpdateName = (id: string, newName: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)))
  }

  const handleUpdateAmount = (id: string, raw: string) => {
    const parsed = parseCurrencyInput(raw)
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, amount: parsed } : p)))
  }

  // Calculations & validation
  const sumOfParts = Math.round(participants.reduce((acc, p) => acc + p.amount, 0) * 100) / 100
  const diff = Math.round((totalAmount - sumOfParts) * 100) / 100
  const isSumValid = totalAmount > 0 && Math.abs(diff) < 0.05
  const isFormValid = name.trim().length > 0 && totalAmount > 0 && isSumValid

  const handleSave = async () => {
    if (!isFormValid || isSaving) return
    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        totalAmount,
        splitType: splitMode,
        participants,
        isRecurring,
        recurringGroupName: isRecurring ? recurringGroupName.trim() || name.trim() : undefined,
      })
      toast.success('Racha atualizado com sucesso! ✅')
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar alterações.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-[#7B2FF7]">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Painel do organizador
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ajuste valores, participantes e regras do racha em tempo real
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Nome e Valor */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome do racha
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm font-semibold rounded-xl border-border"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Valor total
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                value={rawTotalInput}
                onChange={handleTotalChange}
                className="h-10 text-base font-bold rounded-xl border-border tabular-nums"
              />
            </div>
          </div>

          {/* Opção Modo República / Recorrente */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <div>
                  <p className="text-xs font-bold text-foreground">Modo República (Recorrente)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Gera cobranças mensais fixas com o mesmo grupo
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="modal-recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-[#7B2FF7] accent-[#7B2FF7] cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-purple-200/60">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Nome do grupo da república
                </Label>
                <Input
                  value={recurringGroupName}
                  onChange={(e) => setRecurringGroupName(e.target.value)}
                  placeholder="Ex.: República Aloprados"
                  className="h-9 text-xs mt-1 bg-white border-purple-200"
                />
              </div>
            )}
          </div>

          {/* Participantes & Divisão */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Participantes ({participants.length})
                </Label>
                {participants.filter((p) => !p.paid).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsBatchCobrancaOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    <BellRing className="w-3 h-3 text-amber-600" />
                    <span>Cobrar todos pendentes</span>
                  </button>
                )}
              </div>

              <div className="inline-flex p-0.5 bg-[#F7F7FB] border border-border rounded-xl">
                <button
                  type="button"
                  onClick={handleSetSplitEqual}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    splitMode === 'equal'
                      ? 'bg-white text-[#7B2FF7] shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Equal className="w-3 h-3" />
                  Dividir igual
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('custom')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    splitMode === 'custom'
                      ? 'bg-white text-[#7B2FF7] shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  Personalizada
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F7FB] border border-border/80"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#7B2FF7] text-xs font-bold flex items-center justify-center shrink-0">
                    {p.name ? p.name.charAt(0).toUpperCase() : idx + 1}
                  </div>

                  <Input
                    value={p.name}
                    onChange={(e) => handleUpdateName(p.id, e.target.value)}
                    placeholder="Nome"
                    className="h-8 text-xs font-medium bg-white border-border flex-1"
                  />

                  <div className="w-24">
                    <Input
                      type="text"
                      inputMode="numeric"
                      disabled={splitMode === 'equal'}
                      value={formatCurrencyBRL(p.amount)}
                      onChange={(e) => handleUpdateAmount(p.id, e.target.value)}
                      className={`h-8 text-xs font-bold tabular-nums text-right ${
                        splitMode === 'equal'
                          ? 'bg-slate-100 text-muted-foreground border-transparent'
                          : 'bg-white border-border text-foreground'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-red-50 transition-colors shrink-0"
                    title="Remover participante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddParticipant}
              className="w-full h-9 border-dashed border-border hover:border-[#7B2FF7] hover:text-[#7B2FF7] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar participante
            </Button>
          </div>

          {/* Validation warning */}
          {!isSumValid && totalAmount > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Soma das partes ({formatCurrencyBRL(sumOfParts)}) difere do total (
                  {formatCurrencyBRL(totalAmount)}).
                </p>
                <p className="text-[11px] text-amber-700">
                  Diferença: {formatCurrencyBRL(Math.abs(diff))}. Clique em &quot;Dividir
                  igual&quot; ou ajuste os valores manuais.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold rounded-xl h-10"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!isFormValid || isSaving}
            onClick={handleSave}
            className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-bold rounded-xl h-10 px-4"
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>

        <CobrancaModal
          open={isBatchCobrancaOpen}
          onOpenChange={setIsBatchCobrancaOpen}
          rachaName={name}
          shareCode={racha.shareCode || racha.id}
          participantsList={participants.filter((p) => !p.paid)}
          isBatch={true}
        />
      </DialogContent>
    </Dialog>
  )
}
