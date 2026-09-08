import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL, Racha } from '@/types/racha'
import {
  Sparkles,
  Send,
  Plus,
  Users,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Layers,
  Repeat,
  Calendar,
  ChevronRight,
  FileText,
  UserCheck,
  UserPlus,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { MonthEndReminderBanner } from '@/components/MonthEndReminderBanner'
import { MonthlySummaryModal } from '@/components/MonthlySummaryModal'
import { generateRepublicMonthlySummary, MonthlySummaryData } from '@/services/geminiService'

const SUGGESTIONS = [
  {
    label: 'República',
    emoji: '🏠',
    text: 'Somos 4 pessoas da república e precisamos dividir o aluguel e as contas de R$ 1.600.',
  },
  { label: 'Comida', emoji: '🍕', text: 'Pedimos uma pizza e lanches de R$ 150 para 5 amigos.' },
  {
    label: 'Viagem',
    emoji: '✈️',
    text: 'Somos 6 pessoas e precisamos dividir R$ 480 da viagem da turma.',
  },
  {
    label: 'Faculdade',
    emoji: '🎓',
    text: 'Precisamos arrecadar R$ 360 para a confecção dos materiais da formatura entre 4 alunos.',
  },
  {
    label: 'Evento',
    emoji: '🎉',
    text: 'Compramos ingressos e bebidas da festa de aniversário por R$ 600 para 6 pessoas.',
  },
  { label: 'Outro', emoji: '➕', text: '' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { rachas, currentNickname, createNextMonthRecurring } = useRacha()
  const [inputText, setInputText] = useState('')
  const [creatingGroupMonth, setCreatingGroupMonth] = useState<string | null>(null)

  // Monthly summary modal state for recurring república
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<MonthlySummaryData | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) {
      // Navigate to assistant anyway
      navigate('/assistente')
      return
    }
    // Navigate to assistant passing text via state
    navigate('/assistente', { state: { initialPrompt: trimmed } })
  }

  const handleChipClick = (suggestion: (typeof SUGGESTIONS)[0]) => {
    if (suggestion.label === 'Outro') {
      setInputText('')
      return
    }
    setInputText(suggestion.text)
  }

  // Demo racha (pinned at top)
  const demoRacha = rachas.find((r) => r.id === 'demo' || r.isDemo)
  // Non-demo rachas
  const regularRachas = rachas.filter((r) => r.id !== 'demo' && !r.isDemo)

  // Recurring groups aggregation
  const recurringRachas = rachas.filter((r) => Boolean(r.isRecurring || r.recurringGroupId))

  // Group recurring rachas by recurringGroupId or groupName
  const recurringGroupsMap = new Map<string, Racha[]>()
  for (const r of recurringRachas) {
    const key = r.recurringGroupId || r.recurringGroupName || r.name
    if (!recurringGroupsMap.has(key)) {
      recurringGroupsMap.set(key, [])
    }
    recurringGroupsMap.get(key)!.push(r)
  }

  const handleGenerateNextMonth = async (groupId: string, groupName: string) => {
    setCreatingGroupMonth(groupId)
    try {
      const created = await createNextMonthRecurring(groupId)
      if (created) {
        toast.success(`Novo mês gerado para ${groupName}! 🏠`)
        navigate(`/racha/${created.id}`)
      }
    } catch {
      toast.error('Erro ao gerar próximo mês.')
    } finally {
      setCreatingGroupMonth(null)
    }
  }

  const handleOpenMonthlySummary = async (targetRacha: Racha, allRachasOfGroup: Racha[]) => {
    setIsSummaryModalOpen(true)
    setIsSummaryLoading(true)
    try {
      const res = await generateRepublicMonthlySummary(targetRacha, allRachasOfGroup)
      setSummaryData(res)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar resumo da república.')
    } finally {
      setIsSummaryLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-3 sm:py-6 space-y-6">
      {/* 0. LEMBRETE AUTOMÁTICO DE FIM DE MÊS (Aviso para pendências) */}
      <MonthEndReminderBanner recurringRachas={recurringRachas} />

      {/* 1. GREETING HEADER */}
      <div className="space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Olá{user?.name ? `, ${user.name}` : currentNickname ? `, ${currentNickname}` : ''}! 👋 O
            que vamos rachar hoje?
          </h1>
          {isAuthenticated ? (
            <Badge className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-xs font-semibold gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Conta ativa
            </Badge>
          ) : (
            <Link to="/cadastro">
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold gap-1 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Modo Demo • Criar conta para salvar
              </Badge>
            </Link>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Descreva o que precisa dividir ou escolha uma sugestão rápida abaixo.
        </p>
      </div>

      {/* Demo notice for visitors */}
      {!isAuthenticated && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-bold">Você está navegando como visitante (demonstração).</p>
              <p className="text-[11px] text-amber-800">
                Os dados são salvos localmente. Crie uma conta real para acessar de qualquer
                aparelho e proteger seus dados.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-bold rounded-xl h-8 px-3 shrink-0"
          >
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </div>
      )}

      {/* 2. CHAT INPUT CARD (Primary interaction) */}
      <div className="bg-white rounded-2xl border border-border shadow-elevation p-4 sm:p-5 transition-all">
        <form onSubmit={handleSend} className="space-y-3">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={3}
              placeholder="Ex.: Somos 6 pessoas e precisamos dividir R$ 480 da viagem da turma."
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl bg-[#F7F7FB] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B2FF7] transition-all resize-none text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              to="/racha/novo"
              className="text-xs font-semibold text-muted-foreground hover:text-[#7B2FF7] transition-colors flex items-center gap-1 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar manualmente
            </Link>

            <Button
              type="submit"
              className="h-10 px-5 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="pt-4 border-t border-border/80 mt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            Sugestões rápidas
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug.label}
                type="button"
                onClick={() => handleChipClick(sug)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F7FB] hover:bg-purple-50 hover:text-[#7B2FF7] hover:border-purple-200 border border-border text-xs font-medium text-foreground shrink-0 transition-all active:scale-95"
              >
                <span>{sug.emoji}</span>
                <span>{sug.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 RECURRING GROUPS SECTION (Modo República) */}
      {recurringGroupsMap.size > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                <Repeat className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Recorrentes (Modo República)
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {recurringGroupsMap.size} {recurringGroupsMap.size === 1 ? 'grupo' : 'grupos'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {Array.from(recurringGroupsMap.entries()).map(([groupId, groupList]) => {
              // Sort instances descending by creation date
              const sorted = [...groupList].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )
              const latestInstance = sorted[0]
              const groupName =
                latestInstance.recurringGroupName || latestInstance.name.replace(/ - \w+\/\d+$/, '')

              const totalParts = latestInstance.participants.length
              const paidParts = latestInstance.participants.filter((p) => p.paid).length
              const isMonthFinished = totalParts > 0 && paidParts === totalParts
              const monthLabel =
                latestInstance.referenceMonth ||
                new Date(latestInstance.createdAt).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })

              return (
                <div
                  key={groupId}
                  className="bg-white rounded-2xl border-2 border-purple-200/90 p-4 sm:p-5 shadow-subtle space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/70">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🏠</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{groupName}</h3>
                          <Badge className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[10px] font-bold">
                            República Fixa
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {totalParts} moradores • {formatCurrencyBRL(latestInstance.totalAmount)}
                          /mês
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMonthlySummary(latestInstance, sorted)}
                        className="text-xs font-semibold rounded-xl h-8 px-2.5 border-purple-300 hover:bg-purple-100/70 text-[#7B2FF7] bg-purple-50/50 gap-1.5"
                        title="Resumo mensal com Gemini"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Resumo do mês</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={creatingGroupMonth === groupId}
                        onClick={() => handleGenerateNextMonth(groupId, groupName)}
                        className="text-xs font-semibold rounded-xl h-8 px-2.5 border-slate-200 hover:bg-slate-50 text-foreground gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Próximo mês</span>
                      </Button>

                      <Button
                        size="sm"
                        asChild
                        className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-xl h-8 px-3"
                      >
                        <Link to={`/racha/${latestInstance.id}`}>Abrir mês</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Status of current month */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Mês atual: <strong>{monthLabel}</strong>
                    </span>
                    <span
                      className={`font-bold ${
                        isMonthFinished ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {paidParts}/{totalParts} pagaram
                    </span>
                  </div>

                  {/* Previous months history pills */}
                  {sorted.length > 1 && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Histórico de meses ({sorted.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {sorted.map((item) => {
                          const pPaid = item.participants.filter((p) => p.paid).length
                          const pTotal = item.participants.length
                          const label = item.referenceMonth || 'Mês'

                          return (
                            <Link
                              key={item.id}
                              to={`/racha/${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7F7FB] border border-border hover:border-[#7B2FF7]/50 text-[11px] font-medium text-foreground transition-all shrink-0"
                            >
                              <span>{label}:</span>
                              <span
                                className={`font-bold ${
                                  pPaid === pTotal ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                              >
                                {pPaid}/{pTotal}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. PINNED DEMO RACHA BANNER */}
      {demoRacha && (
        <div className="bg-gradient-to-r from-purple-50 via-white to-amber-50/50 rounded-2xl border-2 border-purple-200 p-4 sm:p-5 shadow-subtle relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#7B2FF7] text-white text-[11px] font-semibold hover:bg-[#7B2FF7]">
                  Racha de Demonstração
                </Badge>
                <span className="text-xs text-muted-foreground">🎓 Faculdade</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">{demoRacha.name}</h3>
              <p className="text-xs text-muted-foreground">
                Cenário pronto para você testar todo o fluxo do pitch sem precisar cadastrar nada.
              </p>
            </div>

            <Button
              asChild
              className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs sm:text-sm font-semibold rounded-xl h-10 px-4 shrink-0 shadow-sm"
            >
              <Link to="/racha/demo" className="flex items-center gap-1.5">
                <span>Ver demonstração</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* 4. MEUS RACHAS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Meus rachas
          </h2>
          <Link to="/rachas" className="text-xs font-semibold text-[#7B2FF7] hover:underline">
            Ver todos ({rachas.length})
          </Link>
        </div>

        {regularRachas.length === 0 && !demoRacha ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7B2FF7] mx-auto flex items-center justify-center text-xl">
              🎉
            </div>
            <h3 className="text-base font-bold text-foreground">
              Nenhum racha ainda. Crie o primeiro!
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Divida contas com amigos, repúblicas ou eventos de faculdade sem burocracia.
            </p>
            <Button
              asChild
              className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl text-xs h-10"
            >
              <Link to="/assistente">Criar um racha</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rachas.map((racha) => (
              <RachaListItemCard key={racha.id} racha={racha} />
            ))}
          </div>
        )}
      </div>

      {/* MODAL RESUMO DO MÊS */}
      <MonthlySummaryModal
        open={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
        summary={summaryData}
        isLoading={isSummaryLoading}
      />
    </div>
  )
}

function RachaListItemCard({ racha }: { racha: Racha }) {
  const total = racha.totalAmount
  const paidAmount = racha.participants
    .filter((p) => p.paid)
    .reduce((acc, curr) => acc + curr.amount, 0)
  const percent = total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 0

  const getEmoji = (cat: string) => {
    switch (cat) {
      case 'República':
        return '🏠'
      case 'Comida':
        return '🍕'
      case 'Viagem':
        return '✈️'
      case 'Faculdade':
        return '🎓'
      case 'Evento':
        return '🎉'
      default:
        return '➕'
    }
  }

  return (
    <Link
      to={racha.isDemo || racha.id === 'demo' ? '/racha/demo' : `/racha/${racha.id}`}
      className="block bg-white rounded-2xl border border-border shadow-subtle p-4 hover:shadow-elevation hover:border-[#7B2FF7]/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getEmoji(racha.category)}</span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-[#7B2FF7] transition-colors line-clamp-1">
              {racha.name}
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium">
              {racha.category} • {racha.participants.length} participantes
            </span>
          </div>
        </div>

        {racha.isDemo && (
          <Badge
            variant="outline"
            className="border-amber-400 text-amber-700 bg-amber-50 text-[10px] shrink-0"
          >
            Demo
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrencyBRL(paidAmount)} de {formatCurrencyBRL(total)}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">{percent}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#F7F7FB] overflow-hidden">
          <div
            className="h-full bg-[#7B2FF7] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
