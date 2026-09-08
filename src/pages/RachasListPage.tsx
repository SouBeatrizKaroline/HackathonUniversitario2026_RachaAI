import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrencyBRL, Racha, RachaCategory, CATEGORIES } from '@/types/racha'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  UserPlus,
} from 'lucide-react'

export default function RachasListPage() {
  const { isAuthenticated } = useAuth()
  const { rachas, resetDemoRacha } = useRacha()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  // Filter logic
  const filteredRachas = rachas.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.participants.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'Todas' || r.category === selectedCategory

    return matchesSearch && matchesCategory
  })

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
    <div className="max-w-3xl mx-auto px-4 py-3 sm:py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Meus rachas
            </h1>
            {!isAuthenticated && (
              <Badge
                variant="outline"
                className="border-amber-400 bg-amber-50 text-amber-800 text-[10px]"
              >
                Modo Demo
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acompanhe arrecadações e histórico de pagamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Button
              asChild
              variant="outline"
              className="text-xs border-purple-200 text-[#7B2FF7] hover:bg-purple-50 rounded-xl h-10 px-3"
            >
              <Link to="/cadastro" className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Criar conta</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            className="hidden sm:inline-flex bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-xl h-10 px-4 shadow-sm"
          >
            <Link to="/assistente" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Novo racha</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por nome ou participante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white border-border text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === 'Todas'
                ? 'bg-[#7B2FF7] text-white'
                : 'bg-white border border-border text-foreground hover:bg-slate-50'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setSelectedCategory(c.label)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors flex items-center gap-1 ${
                selectedCategory === c.label
                  ? 'bg-[#7B2FF7] text-white font-semibold'
                  : 'bg-white border border-border text-foreground hover:bg-slate-50'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRachas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7B2FF7] mx-auto flex items-center justify-center text-xl">
              🔍
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhum racha encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Tente buscar com outros termos ou crie um novo racha agora.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                asChild
                className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs rounded-xl"
              >
                <Link to="/assistente">Criar racha</Link>
              </Button>
              <Button
                variant="outline"
                onClick={resetDemoRacha}
                className="text-xs rounded-xl border-border"
              >
                Restaurar racha demo
              </Button>
            </div>
          </div>
        ) : (
          filteredRachas.map((racha) => {
            const total = racha.totalAmount
            const paidAmount = racha.participants
              .filter((p) => p.paid)
              .reduce((acc, curr) => acc + curr.amount, 0)
            const percent = total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 0
            const pendingCount = racha.participants.filter((p) => !p.paid).length

            return (
              <Link
                key={racha.id}
                to={racha.isDemo || racha.id === 'demo' ? '/racha/demo' : `/racha/${racha.id}`}
                className="block bg-white rounded-2xl border border-border shadow-subtle p-4 sm:p-5 hover:shadow-elevation hover:border-[#7B2FF7]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{getEmoji(racha.category)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground group-hover:text-[#7B2FF7] transition-colors line-clamp-1">
                          {racha.name}
                        </h3>
                        {racha.isDemo && (
                          <Badge
                            variant="outline"
                            className="border-amber-400 text-amber-700 bg-amber-50 text-[10px] shrink-0"
                          >
                            Demo
                          </Badge>
                        )}
                        {racha.isRecurring && (
                          <Badge
                            variant="outline"
                            className="border-purple-300 text-[#7B2FF7] bg-purple-50 text-[10px] shrink-0"
                          >
                            🏠 Recorrente
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {racha.category} • {racha.participants.length} participantes (
                        {pendingCount === 0 ? 'tudo pago' : `${pendingCount} pendentes`})
                        {racha.referenceMonth && ` • ${racha.referenceMonth}`}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#7B2FF7] group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mt-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground tabular-nums">
                      {formatCurrencyBRL(paidAmount)} de {formatCurrencyBRL(total)}
                    </span>
                    <span className="text-xs font-bold text-[#7B2FF7] tabular-nums">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#F7F7FB] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7B2FF7] to-[#9D5BFF] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Floating Action Button (FAB) for New Racha on mobile/desktop */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30">
        <Button
          asChild
          className="w-13 h-13 rounded-full bg-[#7B2FF7] hover:bg-[#6A23E0] text-white flex items-center justify-center shadow-xl shadow-purple-500/35 border-2 border-white hover:scale-105 active:scale-95 transition-all p-0"
          aria-label="Criar novo racha"
        >
          <Link to="/assistente">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
