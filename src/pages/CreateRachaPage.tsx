import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import {
  RachaCategory,
  CATEGORIES,
  formatCurrencyBRL,
  parseCurrencyInput,
  generateId,
  InterpretedRachaData,
} from '@/types/racha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  Equal,
  Sliders,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ParticipantRow {
  id: string
  name: string
  amount: number
  paid: boolean
}

export default function CreateRachaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { createRacha, currentNickname } = useRacha()
  const { user, isAuthenticated } = useAuth()

  const prefilled = (location.state as { prefilled?: InterpretedRachaData })?.prefilled

  // Form states
  const [name, setName] = useState(prefilled?.name || '')
  const [totalAmount, setTotalAmount] = useState<number>(prefilled?.totalAmount || 0)
  const [rawAmountInput, setRawAmountInput] = useState<string>(
    prefilled?.totalAmount ? formatCurrencyBRL(prefilled.totalAmount) : '',
  )
  const [category, setCategory] = useState<RachaCategory>(prefilled?.category || 'Faculdade')
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [isRecurring, setIsRecurring] = useState(prefilled?.category === 'República')
  const [recurringGroupName, setRecurringGroupName] = useState('')

  const [participants, setParticipants] = useState<ParticipantRow[]>(() => {
    if (prefilled?.participants && prefilled.participants.length > 0) {
      return prefilled.participants.map((p) => ({
        id: generateId(),
        name: p.name,
        amount: p.amount,
        paid: Boolean(p.paid),
      }))
    }
    // Default 2 participants
    const userMe = isAuthenticated && user?.name ? user.name : currentNickname || 'Você'
    return [
      { id: generateId(), name: userMe, amount: 0, paid: false },
      { id: generateId(), name: 'Amigo 1', amount: 0, paid: false },
    ]
  })

  // Format currency on blur or typing
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = parseCurrencyInput(raw)
    setTotalAmount(parsed)
    setRawAmountInput(parsed > 0 ? formatCurrencyBRL(parsed) : '')

    if (splitMode === 'equal') {
      redistributeEqually(parsed, participants.length)
    }
  }

  // Redistribute equally with remainder to the last participant
  const redistributeEqually = (total: number, count: number) => {
    if (count <= 0) return
    const baseShare = Math.floor((total / count) * 100) / 100
    let runningSum = 0

    setParticipants((prev) =>
      prev.map((p, idx) => {
        if (idx === prev.length - 1) {
          const lastAmount = Math.round((total - runningSum) * 100) / 100
          return { ...p, amount: Math.max(0, lastAmount) }
        }
        runningSum += baseShare
        return { ...p, amount: baseShare }
      }),
    )
  }

  // Handle Switch to Equal split
  const handleSetSplitEqual = () => {
    setSplitMode('equal')
    redistributeEqually(totalAmount, participants.length)
  }

  // Handle Add Participant
  const handleAddParticipant = () => {
    const newCount = participants.length + 1
    const newParticipant: ParticipantRow = {
      id: generateId(),
      name: `Pessoa ${newCount}`,
      amount: 0,
      paid: false,
    }

    if (splitMode === 'equal') {
      const updated = [...participants, newParticipant]
      const baseShare = Math.floor((totalAmount / newCount) * 100) / 100
      let runningSum = 0

      const recalculated = updated.map((p, idx) => {
        if (idx === updated.length - 1) {
          const lastAmount = Math.round((totalAmount - runningSum) * 100) / 100
          return { ...p, amount: Math.max(0, lastAmount) }
        }
        runningSum += baseShare
        return { ...p, amount: baseShare }
      })
      setParticipants(recalculated)
    } else {
      setParticipants((prev) => [...prev, newParticipant])
    }
  }

  // Handle Remove Participant
  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      toast.error('O racha precisa de pelo menos 1 participante.')
      return
    }
    const updated = participants.filter((p) => p.id !== id)
    if (splitMode === 'equal') {
      const baseShare = Math.floor((totalAmount / updated.length) * 100) / 100
      let runningSum = 0
      const recalculated = updated.map((p, idx) => {
        if (idx === updated.length - 1) {
          const lastAmount = Math.round((totalAmount - runningSum) * 100) / 100
          return { ...p, amount: Math.max(0, lastAmount) }
        }
        runningSum += baseShare
        return { ...p, amount: baseShare }
      })
      setParticipants(recalculated)
    } else {
      setParticipants(updated)
    }
  }

  // Handle Change Participant Name
  const handleUpdateParticipantName = (id: string, newName: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)))
  }

  // Handle Change Participant Amount (custom mode)
  const handleUpdateParticipantAmount = (id: string, raw: string) => {
    const parsed = parseCurrencyInput(raw)
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, amount: parsed } : p)))
  }

  // Live calculation and validation
  const sumOfParts = Math.round(participants.reduce((acc, p) => acc + p.amount, 0) * 100) / 100
  const difference = Math.round((totalAmount - sumOfParts) * 100) / 100
  const isSumValid = totalAmount > 0 && Math.abs(difference) < 0.05
  const isFormValid =
    name.trim().length > 0 && totalAmount > 0 && participants.length > 0 && isSumValid

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Submit
  const handleConfirmRacha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      const months = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ]
      const curMonth = `${months[new Date().getMonth()]}/${new Date().getFullYear()}`
      const recGroupId = isRecurring ? `group-${generateId()}` : undefined

      const newRacha = await createRacha({
        name: isRecurring && !name.includes('/') ? `${name.trim()} - ${curMonth}` : name.trim(),
        category,
        totalAmount,
        splitType: splitMode,
        isRecurring,
        recurringGroupId: recGroupId,
        recurringGroupName: isRecurring ? recurringGroupName.trim() || name.trim() : undefined,
        referenceMonth: isRecurring ? curMonth : undefined,
        creatorNickname: isAuthenticated && user?.name ? user.name : currentNickname || 'Você',
        owner: user?.id || undefined,
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name.trim() || 'Sem nome',
          amount: p.amount,
          paid: p.paid,
        })),
      })

      toast.success('Racha criado com sucesso! 🎉')
      navigate(`/racha/${newRacha.id}`, { state: { justCreated: true } })
    } catch (err) {
      console.error('Erro ao criar racha:', err)
      toast.error('Erro ao salvar racha. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-3 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Criar racha
            </h1>
            <p className="text-xs text-muted-foreground">
              Defina valores e quem vai dividir com você
            </p>
          </div>
        </div>

        {prefilled && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-[#7B2FF7] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Preenchido por IA
          </span>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleConfirmRacha} className="space-y-5">
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 shadow-subtle space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label
              htmlFor="racha-name"
              className="text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Nome do racha
            </Label>
            <Input
              id="racha-name"
              type="text"
              placeholder="Ex.: Viagem da turma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-sm font-medium border-border"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor Total */}
            <div className="space-y-1.5">
              <Label
                htmlFor="racha-amount"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Valor total
              </Label>
              <Input
                id="racha-amount"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={rawAmountInput}
                onChange={handleAmountChange}
                className="h-11 rounded-xl text-sm font-bold border-border tabular-nums"
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Categoria
              </Label>
              <Select
                value={category}
                onValueChange={(val) => {
                  const cat = val as RachaCategory
                  setCategory(cat)
                  if (cat === 'República') {
                    setIsRecurring(true)
                  }
                }}
              >
                <SelectTrigger className="h-11 rounded-xl text-sm font-medium border-border bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.label} value={c.label} className="text-xs font-medium">
                      <span className="mr-2">{c.emoji}</span>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modo República Toggle Card */}
          <div className="pt-2 border-t border-border/80">
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏠</span>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Modo República (Despesa Recorrente)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Fixa os moradores e gera cobranças automáticas todo mês
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="recurring-checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-[#7B2FF7] accent-[#7B2FF7] cursor-pointer"
                />
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-purple-200/60 space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Nome do grupo / república
                  </Label>
                  <Input
                    type="text"
                    placeholder="Ex.: República Aloprados"
                    value={recurringGroupName}
                    onChange={(e) => setRecurringGroupName(e.target.value)}
                    className="h-9 text-xs bg-white border-purple-200"
                  />
                  <p className="text-[10px] text-purple-700">
                    💡 Cada mês terá sua própria cobrança mantendo o mesmo grupo de participantes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participantes Section */}
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Participantes ({participants.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Como o total será distribuído entre os amigos
              </p>
            </div>

            {/* Split Mode Buttons */}
            <div className="inline-flex p-1 bg-[#F7F7FB] border border-border rounded-xl">
              <button
                type="button"
                onClick={handleSetSplitEqual}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === 'equal'
                    ? 'bg-white text-[#7B2FF7] shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Equal className="w-3.5 h-3.5" />
                Dividir igual
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('custom')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === 'custom'
                    ? 'bg-white text-[#7B2FF7] shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Personalizada
              </button>
            </div>
          </div>

          {/* Participant Rows */}
          <div className="space-y-2.5">
            {participants.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7F7FB] border border-border/80 group hover:border-[#7B2FF7]/30 transition-colors"
              >
                {/* Index / Avatar */}
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7B2FF7] text-xs font-bold flex items-center justify-center shrink-0">
                  {p.name ? p.name.charAt(0).toUpperCase() : index + 1}
                </div>

                {/* Name Input */}
                <div className="flex-1">
                  <Input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdateParticipantName(p.id, e.target.value)}
                    placeholder="Nome do participante"
                    className="h-9 text-xs sm:text-sm font-medium rounded-lg border-border bg-white"
                  />
                </div>

                {/* Amount Input */}
                <div className="w-28 sm:w-32">
                  <Input
                    type="text"
                    inputMode="numeric"
                    disabled={splitMode === 'equal'}
                    value={formatCurrencyBRL(p.amount)}
                    onChange={(e) => handleUpdateParticipantAmount(p.id, e.target.value)}
                    className={`h-9 text-xs sm:text-sm font-bold rounded-lg tabular-nums text-right ${
                      splitMode === 'equal'
                        ? 'bg-slate-100 text-muted-foreground border-transparent'
                        : 'bg-white border-border text-foreground'
                    }`}
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(p.id)}
                  className="p-2 text-muted-foreground/60 hover:text-destructive hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  aria-label="Remover participante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add participant button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddParticipant}
            className="w-full h-11 border-dashed border-2 border-border hover:border-[#7B2FF7] hover:text-[#7B2FF7] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Adicionar participante
          </Button>
        </div>

        {/* Live Validation Warning Banner */}
        {!isSumValid && totalAmount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                A soma das partes ({formatCurrencyBRL(sumOfParts)}) não bate com o total (
                {formatCurrencyBRL(totalAmount)}).
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Diferença: <strong>{formatCurrencyBRL(Math.abs(difference))}</strong>{' '}
                {difference > 0 ? 'a menos' : 'a mais'}. Ajuste os valores ou clique em
                &quot;Dividir igual&quot;.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-12 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-base font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {isSubmitting ? 'Salvando no banco de dados...' : 'Confirmar racha'}
          </Button>
        </div>
      </form>
    </div>
  )
}
