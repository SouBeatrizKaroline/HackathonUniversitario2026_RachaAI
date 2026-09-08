import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrencyBRL, Racha } from '@/types/racha'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  PiggyBank,
  Receipt,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  Wallet,
  Users,
  Award,
} from 'lucide-react'

export default function HistoricoFinanceiroPage() {
  const { user, isAuthenticated } = useAuth()
  const { rachas, financialSummary } = useRacha()
  const [filterPeriod, setFilterPeriod] = useState<'todos' | 'concluidos' | 'pendentes'>('todos')
  const [selectedMonth, setSelectedMonth] = useState<string>('todos')

  const {
    totalSplit,
    totalCollected,
    totalPending,
    rachasCount,
    paymentsCount,
    pendingPaymentsCount,
    completionRate,
    byMonth,
    byCategory,
  } = financialSummary

  // Max for bar chart scaling
  const maxMonthValue = Math.max(...byMonth.map((m) => m.total), 1)

  // Filtered rachas list
  const filteredRachas = rachas.filter((r) => {
    const isCompleted = r.participants.every((p) => p.paid)
    if (filterPeriod === 'concluidos' && !isCompleted) return false
    if (filterPeriod === 'pendentes' && isCompleted) return false

    if (selectedMonth !== 'todos') {
      const d = new Date(r.createdAt)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (k !== selectedMonth) return false
    }
    return true
  })

  // Group rachas by Month
  const rachasByMonthMap = new Map<string, Racha[]>()
  for (const r of filteredRachas) {
    const d = new Date(r.createdAt)
    const monthLabel = isNaN(d.getTime())
      ? 'Outros'
      : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const capitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
    if (!rachasByMonthMap.has(capitalized)) {
      rachasByMonthMap.set(capitalized, [])
    }
    rachasByMonthMap.get(capitalized)!.push(r)
  }

  const getCategoryEmoji = (cat: string) => {
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
    <div className="max-w-4xl mx-auto px-4 py-3 sm:py-6 space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7B2FF7] flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Histórico Financeiro
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visão consolidada de arrecadações, pagamentos e evolução das contas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="text-xs font-semibold rounded-xl h-9 border-purple-200 text-[#7B2FF7] hover:bg-purple-50 gap-1.5"
          >
            <Link to="/carteira">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Abrir Carteira Coletiva</span>
            </Link>
          </Button>

          <Button
            asChild
            className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-xl h-9 shadow-sm"
          >
            <Link to="/racha/novo">Novo racha</Link>
          </Button>
        </div>
      </div>

      {/* 2. CONQUISTA / DESTAQUE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7B2FF7] via-[#8F44FD] to-[#5916C4] p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -translate-y-4 translate-x-4 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Conquista do Semestre</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Vocês já racharam {formatCurrencyBRL(totalSplit)} este semestre 🎉
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Com o Racha.AI, já foram liquidados {paymentsCount} pagamentos sem estresse entre
              amigos e moradores da república.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shrink-0 text-center sm:text-right space-y-1">
            <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider block">
              Taxa de Liquidação
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-300">{completionRate}%</div>
            <p className="text-[11px] text-purple-200 font-medium">
              {formatCurrencyBRL(totalCollected)} arrecadados
            </p>
          </div>
        </div>
      </div>

      {/* 3. TOTAIS AGREGADOS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Dividido */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Dividido</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-[#7B2FF7]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-foreground tabular-nums">
            {formatCurrencyBRL(totalSplit)}
          </p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span>{rachasCount} rachas criados</span>
          </span>
        </div>

        {/* Arrecadado */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Arrecadado (Pago)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 tabular-nums">
            {formatCurrencyBRL(totalCollected)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span>{paymentsCount} cotas quitadas</span>
          </span>
        </div>

        {/* Pendente */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pendente</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-600 tabular-nums">
            {formatCurrencyBRL(totalPending)}
          </p>
          <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <span>{pendingPaymentsCount} pendências abertas</span>
          </span>
        </div>

        {/* Volume de Rachas */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Rachas e Grupos</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-foreground tabular-nums">
            {rachasCount}
          </p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span>
              Média de {formatCurrencyBRL(rachasCount > 0 ? totalSplit / rachasCount : 0)}
            </span>
          </span>
        </div>
      </div>

      {/* 4. EVOLUÇÃO VISUAL POR MÊS (Gráfico CSS / SVG puro) */}
      <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7B2FF7]" />
              Evolução dos Rachas por Mês
            </h2>
            <p className="text-xs text-muted-foreground">
              Volume total movimentado e comparativo de pagamentos quitados
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#7B2FF7]" />
              <span className="text-muted-foreground">Total Rachado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">Quitado</span>
            </div>
          </div>
        </div>

        {byMonth.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nenhuma movimentação registrada para montar o gráfico.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-end min-h-[160px] pt-6 pb-2 border-b border-border/70">
              {byMonth.map((m) => {
                const totalH = Math.max(12, Math.round((m.total / maxMonthValue) * 120))
                const paidH = Math.max(6, Math.round((m.paid / maxMonthValue) * 120))
                const isSelected = selectedMonth === m.monthKey

                return (
                  <button
                    key={m.monthKey}
                    type="button"
                    onClick={() =>
                      setSelectedMonth((prev) => (prev === m.monthKey ? 'todos' : m.monthKey))
                    }
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all group ${
                      isSelected ? 'bg-purple-50 ring-2 ring-[#7B2FF7]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">
                      {formatCurrencyBRL(m.total)}
                    </span>

                    {/* Dual bar */}
                    <div className="flex items-end gap-1.5 h-[120px]">
                      {/* Total Bar */}
                      <div
                        className="w-4 sm:w-5 bg-[#7B2FF7] rounded-t-md transition-all group-hover:bg-[#6A23E0]"
                        style={{ height: `${totalH}px` }}
                        title={`Total: ${formatCurrencyBRL(m.total)} (${m.rachasCount} rachas)`}
                      />
                      {/* Paid Bar */}
                      <div
                        className="w-4 sm:w-5 bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-600"
                        style={{ height: `${paidH}px` }}
                        title={`Quitado: ${formatCurrencyBRL(m.paid)}`}
                      />
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-bold text-foreground block">{m.label}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        {m.rachasCount} {m.rachasCount === 1 ? 'racha' : 'rachas'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedMonth !== 'todos' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground font-medium">
                  Filtrando pelo mês selecionado:{' '}
                  <strong>{byMonth.find((m) => m.monthKey === selectedMonth)?.label}</strong>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMonth('todos')}
                  className="h-7 text-xs text-[#7B2FF7] hover:bg-purple-50"
                >
                  Limpar filtro de mês
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CATEGORIAS DE GASTOS */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Divisão por Categorias
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {byCategory.map((cat) => (
              <div
                key={cat.category}
                className="p-3 rounded-xl border border-border/80 bg-[#F7F7FB] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryEmoji(cat.category)}</span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{cat.category}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {cat.count} {cat.count === 1 ? 'racha' : 'rachas'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {formatCurrencyBRL(cat.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. LISTAGEM DETALHADA DE RACHAS PASSADOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Histórico de Rachas ({filteredRachas.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Abra qualquer racha para verificar cotas, comprovantes e pagadores
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterPeriod('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterPeriod === 'todos'
                  ? 'bg-[#7B2FF7] text-white'
                  : 'bg-white border border-border text-foreground hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterPeriod('concluidos')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterPeriod === 'concluidos'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white border border-border text-foreground hover:bg-slate-50'
              }`}
            >
              ✓ 100% Quitados
            </button>
            <button
              onClick={() => setFilterPeriod('pendentes')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterPeriod === 'pendentes'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-white border border-border text-foreground hover:bg-slate-50'
              }`}
            >
              ⏳ Com Pendências
            </button>
          </div>
        </div>

        {/* Grouped by month cards */}
        {filteredRachas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
            <span className="text-3xl">🔍</span>
            <h3 className="text-sm font-bold text-foreground">Nenhum racha com esse filtro</h3>
            <p className="text-xs text-muted-foreground">
              Experimente alterar o filtro de status ou selecionar todos os meses.
            </p>
          </div>
        ) : (
          Array.from(rachasByMonthMap.entries()).map(([monthHeading, rachasList]) => (
            <div key={monthHeading} className="space-y-2.5">
              <div className="flex items-center gap-2 pt-2">
                <Calendar className="w-3.5 h-3.5 text-[#7B2FF7]" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {monthHeading} ({rachasList.length})
                </span>
                <div className="flex-1 h-px bg-border/70" />
              </div>

              <div className="space-y-2.5">
                {rachasList.map((racha) => {
                  const paidAmount = racha.participants
                    .filter((p) => p.paid)
                    .reduce((acc, p) => acc + p.amount, 0)
                  const total = racha.totalAmount
                  const isCompleted =
                    racha.participants.length > 0 && racha.participants.every((p) => p.paid)
                  const percent =
                    total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 0
                  const dateStr = new Date(racha.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })

                  return (
                    <Link
                      key={racha.id}
                      to={
                        racha.isDemo || racha.id === 'demo' ? '/racha/demo' : `/racha/${racha.id}`
                      }
                      className="block bg-white rounded-2xl border border-border shadow-subtle p-4 hover:shadow-elevation hover:border-[#7B2FF7]/40 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">
                            {getCategoryEmoji(racha.category)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-[#7B2FF7] transition-colors">
                                {racha.name}
                              </h3>
                              {isCompleted ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold">
                                  ✓ Quitado
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-medium"
                                >
                                  Pendente
                                </Badge>
                              )}
                              {racha.isRecurring && (
                                <Badge
                                  variant="outline"
                                  className="border-purple-300 text-[#7B2FF7] bg-purple-50 text-[10px]"
                                >
                                  República
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dateStr} • {racha.category} • {racha.participants.length}{' '}
                              participantes
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
                          <div className="text-left sm:text-right">
                            <span className="text-sm sm:text-base font-black text-foreground block tabular-nums">
                              {formatCurrencyBRL(total)}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {formatCurrencyBRL(paidAmount)} pagos ({percent}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-semibold text-[#7B2FF7] group-hover:translate-x-1 transition-transform">
                            <span className="hidden sm:inline">Abrir</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-[#F7F7FB] overflow-hidden mt-3">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-[#7B2FF7]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
