import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { formatCurrencyBRL, Participant } from '@/types/racha'
import { SolanaPaymentModal } from '@/components/SolanaPaymentModal'
import { ShareModal } from '@/components/ShareModal'
import { GeminiAssistantPanel } from '@/components/GeminiAssistantPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  MoreVertical,
  Plus,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

export default function RachaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    getRacha,
    markParticipantPaid,
    markParticipantPending,
    removeParticipantFromRacha,
    addParticipantToRacha,
    updateRacha,
    currentNickname,
    setIsNicknameModalOpen,
  } = useRacha()

  const rachaId = id || 'demo'
  const racha = getRacha(rachaId)

  // Success banner when just created
  const [showCreatedBanner, setShowCreatedBanner] = useState(
    Boolean((location.state as { justCreated?: boolean })?.justCreated),
  )

  useEffect(() => {
    if (showCreatedBanner) {
      const timer = setTimeout(() => setShowCreatedBanner(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [showCreatedBanner])

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentParticipant, setPaymentParticipant] = useState<Participant | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isGeminiSheetOpen, setIsGeminiSheetOpen] = useState(false)

  if (!racha) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Racha não encontrado</h2>
        <p className="text-sm text-muted-foreground">
          O racha solicitado não existe ou foi removido.
        </p>
        <Button asChild className="bg-[#7B2FF7]">
          <Link to="/dashboard">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  // Calculations
  const total = racha.totalAmount
  const paidParticipants = racha.participants.filter((p) => p.paid)
  const pendingParticipants = racha.participants.filter((p) => !p.paid)
  const paidAmount = paidParticipants.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingAmount = Math.max(0, total - paidAmount)
  const percent = total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 0

  // Match current user
  const effectiveNickname = currentNickname || 'Você'
  const currentUserParticipant = racha.participants.find(
    (p) =>
      p.name.toLowerCase() === effectiveNickname.toLowerCase() ||
      p.name.toLowerCase() === 'você' ||
      (currentNickname === '' && p.name.toLowerCase() === 'você'),
  )

  const isCurrentUserParticipant = Boolean(currentUserParticipant)
  const currentUserHasPaid = currentUserParticipant?.paid

  // Open payment for current user
  const handleOpenMyPayment = () => {
    if (!currentUserParticipant) {
      setIsNicknameModalOpen(true)
      return
    }
    setPaymentParticipant(currentUserParticipant)
    setIsPaymentModalOpen(true)
  }

  // Handle open payment for specific participant
  const handleOpenPaymentFor = (p: Participant) => {
    setPaymentParticipant(p)
    setIsPaymentModalOpen(true)
  }

  // Success payment callback
  const handlePaymentSuccess = (txHash: string) => {
    if (paymentParticipant) {
      markParticipantPaid(racha.id, paymentParticipant.id, txHash)
      toast.success('Pagamento registrado! ✅')
    }
  }

  // Join racha if not in list
  const handleJoinRacha = () => {
    const name = currentNickname || 'Você'
    addParticipantToRacha(racha.id, name)
    toast.success(`Você entrou no racha como ${name}!`)
  }

  // Handle Gemini recalculate suggestion
  const handleGeminiApplyChange = (newCount: number, newTotal: number) => {
    const existing = [...racha.participants]
    const needed = newCount - existing.length

    if (needed > 0) {
      const perPerson = Math.round((newTotal / newCount) * 100) / 100
      const newParticipants = [...existing]
      for (let i = 0; i < needed; i++) {
        newParticipants.push({
          id: `p-extra-${Date.now()}-${i}`,
          name: `Participante ${existing.length + i + 1}`,
          amount: perPerson,
          paid: false,
        })
      }
      // Re-split amounts
      const updated = newParticipants.map((p, idx) => {
        if (idx === newParticipants.length - 1) {
          const sumOthers = perPerson * (newParticipants.length - 1)
          return { ...p, amount: Math.round((newTotal - sumOthers) * 100) / 100 }
        }
        return { ...p, amount: perPerson }
      })

      updateRacha(racha.id, {
        participants: updated,
      })
    }
  }

  const avgShare =
    racha.participants.length > 0
      ? racha.participants[0].amount || Math.round((total / racha.participants.length) * 100) / 100
      : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-2 sm:py-6 space-y-5 relative">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground line-clamp-1 max-w-[220px] sm:max-w-md">
                {racha.name}
              </h1>
              {racha.isDemo && (
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-700 bg-amber-50 text-[10px] shrink-0 font-medium"
                >
                  Demonstração
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {racha.category} • Criado em {new Date(racha.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsShareModalOpen(true)}
          variant="outline"
          size="sm"
          className="rounded-xl border-border hover:bg-[#F7F7FB] text-xs font-semibold gap-1.5 h-9"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </div>

      {/* 2. SUCCESS BANNER ON CREATION */}
      {showCreatedBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between shadow-subtle animate-fade-in-up">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Racha criado! 🎉</p>
              <p className="text-xs text-emerald-800">
                Compartilhe o link com os participantes para começar a arrecadar.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreatedBanner(false)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 3. SUMMARY CARD (Prominent) */}
      <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-elevation space-y-4">
        <div className="flex items-baseline justify-between border-b border-border/70 pb-3">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Meta Total
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {formatCurrencyBRL(total)}
          </span>
        </div>

        {/* Mini stats side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-emerald-700 block mb-0.5">
              Arrecadado
            </span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
              {formatCurrencyBRL(paidAmount)}
            </span>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-700 block mb-0.5">Falta</span>
            <span className="text-lg sm:text-xl font-bold text-amber-700 tabular-nums">
              {formatCurrencyBRL(pendingAmount)}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#7B2FF7]" />
              {percent}% arrecadado
            </span>
            <span className="text-muted-foreground font-normal">
              {paidParticipants.length} de {racha.participants.length} pagos
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#F7F7FB] border border-border/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7B2FF7] to-[#9D5BFF] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. PARTICIPANTS LIST */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Participantes ({racha.participants.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            {pendingParticipants.length} pendentes
          </span>
        </div>

        <div className="space-y-2">
          {racha.participants.map((p) => {
            const isMe =
              p.name.toLowerCase() === effectiveNickname.toLowerCase() ||
              p.name.toLowerCase() === 'você'

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-purple-50/50 border-purple-200'
                    : 'bg-[#F7F7FB] border-border/70 hover:bg-slate-50'
                }`}
              >
                {/* Left: icon + name + badges */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {p.paid ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4 stroke-[2]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{p.name}</span>
                      {isMe && (
                        <Badge className="bg-[#7B2FF7] hover:bg-[#7B2FF7] text-white text-[9px] px-1.5 py-0 h-4">
                          você
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {p.paid ? (
                        <span className="text-emerald-700 font-semibold">
                          Pago • {p.paidAt || 'Confirmado'}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Aguardando pagamento</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Action Dropdown */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums block">
                      {formatCurrencyBRL(p.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        p.paid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {p.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  {/* Participant actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                        aria-label="Ações do participante"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-xl w-44 text-xs font-medium"
                    >
                      {!p.paid ? (
                        <DropdownMenuItem
                          onClick={() => handleOpenPaymentFor(p)}
                          className="cursor-pointer text-emerald-700"
                        >
                          <Zap className="w-3.5 h-3.5 mr-2" />
                          Simular pagamento
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            markParticipantPending(racha.id, p.id)
                            toast.info(`Status de ${p.name} alterado para pendente.`)
                          }}
                          className="cursor-pointer text-amber-700"
                        >
                          <Clock className="w-3.5 h-3.5 mr-2" />
                          Marcar como pendente
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => {
                          removeParticipantFromRacha(racha.id, p.id)
                          toast.info(`${p.name} removido do racha.`)
                        }}
                        className="cursor-pointer text-destructive"
                      >
                        Remover do racha
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagar minha parte BUTTON (Visible if current user is participant and pending) */}
        {isCurrentUserParticipant && !currentUserHasPaid ? (
          <div className="pt-2">
            <Button
              onClick={handleOpenMyPayment}
              className="w-full h-12 bg-gradient-to-r from-[#7B2FF7] to-[#9D5BFF] hover:from-[#6A23E0] hover:to-[#8B48F7] text-white text-sm sm:text-base font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Pagar minha parte ({formatCurrencyBRL(currentUserParticipant.amount)})</span>
            </Button>
          </div>
        ) : !isCurrentUserParticipant ? (
          /* Button to join if not in participant list */
          <div className="pt-2">
            <Button
              onClick={handleJoinRacha}
              variant="outline"
              className="w-full h-11 border-dashed border-[#7B2FF7]/50 text-[#7B2FF7] hover:bg-purple-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Participar deste racha</span>
            </Button>
          </div>
        ) : (
          <div className="pt-1 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sua parte já está paga!
            </span>
          </div>
        )}
      </div>

      {/* 5. TRANSPARÊNCIA SECTION */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7B2FF7]" />
            <h3 className="text-sm font-bold text-foreground">Todo mundo sabe quanto entrou.</h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            Verificável
          </Badge>
        </div>

        {/* 3 mini stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[#F7F7FB] p-2 rounded-xl">
            <span className="text-[10px] text-muted-foreground block">Meta:</span>
            <span className="font-bold text-foreground tabular-nums">
              {formatCurrencyBRL(total)}
            </span>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl text-emerald-800">
            <span className="text-[10px] text-emerald-600 block">Recebido:</span>
            <span className="font-bold tabular-nums">{formatCurrencyBRL(paidAmount)}</span>
          </div>
          <div className="bg-amber-50 p-2 rounded-xl text-amber-800">
            <span className="text-[10px] text-amber-600 block">Pendente:</span>
            <span className="font-bold tabular-nums">{formatCurrencyBRL(pendingAmount)}</span>
          </div>
        </div>

        {/* Histórico list */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Histórico
          </span>

          {racha.history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2 text-center">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {racha.history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F7FB] border border-border/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">
                        {h.participantName} pagou {formatCurrencyBRL(h.amount)}
                      </span>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{h.timestamp}</span>
                        {h.txHash && (
                          <span className="font-mono text-purple-700 bg-purple-50 px-1 rounded">
                            {h.txHash}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">
                    Confirmado
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote in italic */}
        <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/70 text-center">
          &ldquo;Os participantes acompanham o mesmo status do racha, reduzindo dúvidas sobre quem
          pagou e quanto ainda falta.&rdquo;
        </p>

        {/* Compartilhar racha button at the bottom of transparency */}
        <div className="pt-2">
          <Button
            onClick={() => setIsShareModalOpen(true)}
            variant="outline"
            className="w-full h-10 border-border hover:bg-[#F7F7FB] text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-[#7B2FF7]" />
            <span>Compartilhar racha</span>
          </Button>
        </div>
      </div>

      {/* 6. FLOATING ACTION BUTTON (FAB) - "Perguntar ao Gemini" */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsGeminiSheetOpen((prev) => !prev)}
          className={`h-13 px-4 sm:px-5 rounded-full bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] text-white flex items-center gap-2 shadow-xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all border-2 border-white animate-pulse-subtle ${
            isGeminiSheetOpen ? 'rotate-90 bg-slate-800' : ''
          }`}
          aria-label="Perguntar ao Gemini"
          title="Perguntar ao Gemini"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-xs sm:text-sm font-bold">Perguntar ao Gemini</span>
        </button>
      </div>

      {/* MODALS */}
      {paymentParticipant && (
        <SolanaPaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          amount={paymentParticipant.amount}
          participantName={paymentParticipant.name}
          rachaName={racha.name}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <ShareModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        rachaName={racha.name}
        shareCode={racha.shareCode || 'viagem-congresso-7k2m'}
        perPersonAmount={avgShare}
      />

      <GeminiAssistantPanel
        racha={racha}
        isOpen={isGeminiSheetOpen}
        onClose={() => setIsGeminiSheetOpen(false)}
        onApplyChange={handleGeminiApplyChange}
      />
    </div>
  )
}
