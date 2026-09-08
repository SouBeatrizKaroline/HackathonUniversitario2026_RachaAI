import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import {
  formatCurrencyBRL,
  parseCurrencyInput,
  CarteiraCompartilhada,
  CarteiraProposta,
  CarteiraMovimento,
  CarteiraMembro,
} from '@/types/racha'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Wallet,
  Plus,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  ChevronRight,
  Repeat,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

export default function CarteiraPage() {
  const { user, isAuthenticated } = useAuth()
  const {
    primaryCarteira,
    contributeToCarteira,
    proposeCarteiraExpense,
    approveProposal,
    currentNickname,
    setIsWhySolanaModalOpen,
  } = useRacha()

  const [activeTab, setActiveTab] = useState<'movimentos' | 'propostas' | 'membros'>('movimentos')

  // Modals state
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [contributeAmountStr, setContributeAmountStr] = useState('')
  const [contributeDesc, setContributeDesc] = useState('')
  const [contributeName, setContributeName] = useState('')
  const [isSubmittingContribute, setIsSubmittingContribute] = useState(false)

  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false)
  const [proposeTitle, setProposeTitle] = useState('')
  const [proposeAmountStr, setProposeAmountStr] = useState('')
  const [proposeRecipient, setProposeRecipient] = useState('')
  const [proposeName, setProposeName] = useState('')
  const [isSubmittingPropose, setIsSubmittingPropose] = useState(false)

  // Current user's effective display name for voting and proposals
  const currentActorName = isAuthenticated
    ? user?.name || user?.email?.split('@')[0] || 'Usuário'
    : currentNickname || 'Você'

  const carteira = primaryCarteira

  // Handlers
  const handleOpenContribute = () => {
    setContributeAmountStr('')
    setContributeDesc('')
    setContributeName(currentActorName)
    setIsContributeModalOpen(true)
  }

  const handleSubmitContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(contributeAmountStr)
    if (amount <= 0) {
      toast.error('Informe um valor maior que R$ 0,00.')
      return
    }

    setIsSubmittingContribute(true)
    try {
      await contributeToCarteira(
        carteira.id,
        amount,
        contributeDesc.trim() || 'Depósito voluntário no caixa',
        contributeName.trim() || currentActorName,
      )
      toast.success(`Contribuição de ${formatCurrencyBRL(amount)} creditada com sucesso! 💰`)
      setIsContributeModalOpen(false)
    } catch {
      toast.error('Erro ao realizar contribuição.')
    } finally {
      setIsSubmittingContribute(false)
    }
  }

  const handleOpenPropose = () => {
    setProposeTitle('')
    setProposeAmountStr('')
    setProposeRecipient('')
    setProposeName(currentActorName)
    setIsProposeModalOpen(true)
  }

  const handleSubmitPropose = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseCurrencyInput(proposeAmountStr)
    if (!proposeTitle.trim()) {
      toast.error('Informe a descrição/motivo da despesa.')
      return
    }
    if (amount <= 0) {
      toast.error('Informe um valor válido.')
      return
    }
    if (amount > carteira.balance) {
      toast.error(
        `O valor solicitado (${formatCurrencyBRL(amount)}) ultrapassa o saldo atual do caixa (${formatCurrencyBRL(carteira.balance)}).`,
      )
      return
    }

    setIsSubmittingPropose(true)
    try {
      await proposeCarteiraExpense(
        carteira.id,
        proposeTitle.trim(),
        amount,
        proposeRecipient.trim(),
        proposeName.trim() || currentActorName,
      )
      toast.success('Proposta de saída submetida para votação dos membros! 🗳️')
      setIsProposeModalOpen(false)
      setActiveTab('propostas')
    } catch {
      toast.error('Erro ao submeter proposta.')
    } finally {
      setIsSubmittingPropose(false)
    }
  }

  const handleApprove = async (proposal: CarteiraProposta) => {
    try {
      const res = await approveProposal(carteira.id, proposal.id, currentActorName)
      if (res.executed) {
        toast.success(
          `Aprovação atingiu o quórum (${carteira.threshold}/${carteira.threshold})! Despesa de ${formatCurrencyBRL(proposal.amount)} liquidada com sucesso! 💸`,
        )
      } else {
        toast.success('Seu voto de aprovação foi registrado com sucesso! 🗳️')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar aprovação.')
    }
  }

  const pendingProposals = carteira.proposals.filter((p) => p.status === 'pendente')
  const completedProposals = carteira.proposals.filter((p) => p.status !== 'pendente')

  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:py-6 space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7B2FF7] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Carteira da República
                </h1>
                {carteira.isDemo && (
                  <Badge
                    variant="outline"
                    className="border-amber-400 bg-amber-50 text-amber-800 text-[10px]"
                  >
                    Demo Coletivo
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Caixa compartilhado para compras comuns, reparos e fundo de emergência
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWhySolanaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-[#7B2FF7] hover:bg-purple-50 transition-colors border border-border"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Por que Squads?</span>
          </button>
        </div>
      </div>

      {/* 2. CARD DO SALDO & AÇÕES PRINCIPAIS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-5 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#7B2FF7]/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Saldo do Caixa Coletivo
              </span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-semibold">
                Multisig {carteira.threshold} de {carteira.members.length} aprovações
              </Badge>
            </div>

            <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white tabular-nums">
              {formatCurrencyBRL(carteira.balance)}
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
              {carteira.description ||
                'Caixa gerido coletivamente pela república com proteção de governança por votação.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              onClick={handleOpenContribute}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl h-11 px-5 shadow-lg shadow-emerald-900/30 gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Contribuir / Depositar</span>
            </Button>

            <Button
              onClick={handleOpenPropose}
              className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold text-xs sm:text-sm rounded-2xl h-11 px-5 shadow-lg shadow-purple-900/30 gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Propor saída do caixa</span>
            </Button>
          </div>
        </div>

        {/* Info pills */}
        <div className="relative z-10 pt-5 mt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            <span>
              <strong>{carteira.members.length}</strong> membros participantes
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Regra de saída: <strong>{carteira.threshold} aprovações</strong> exigidas
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              <strong>{pendingProposals.length}</strong>{' '}
              {pendingProposals.length === 1 ? 'proposta pendente' : 'propostas pendentes'}
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 AVISO PENDÊNCIAS DE APROVAÇÃO (Destaque se houver propostas pendentes) */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-200 text-amber-900">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-amber-950">
                Aprovações Pendentes ({pendingProposals.length})
              </h3>
            </div>
            <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200 text-xs font-bold">
              Ação Requerida
            </Badge>
          </div>

          <div className="space-y-3">
            {pendingProposals.map((prop) => {
              const isProposer = currentActorName.toLowerCase() === prop.proposerName.toLowerCase()
              const hasVoted = prop.approvals.some(
                (a) => a.approverName.toLowerCase() === currentActorName.toLowerCase(),
              )

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border border-amber-200 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-foreground">{prop.title}</span>
                      <span className="text-sm font-black text-rose-600 tabular-nums">
                        −{formatCurrencyBRL(prop.amount)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Proposto por <strong>{prop.proposerName}</strong>
                      {prop.recipient && ` • Destinatário: ${prop.recipient}`}
                    </p>

                    {/* Progress of approvals */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="font-semibold text-amber-900">
                        {prop.currentApprovals} de {prop.requiredApprovals} aprovações necessárias
                      </span>
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (prop.currentApprovals / prop.requiredApprovals) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {prop.approvals.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Já aprovado por: {prop.approvals.map((a) => a.approverName).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isProposer ? (
                      <span className="text-xs text-muted-foreground italic px-2">
                        Você propôs esta despesa
                      </span>
                    ) : hasVoted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Você já aprovou
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleApprove(prop)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-sm active:scale-95"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Aprovar saída</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. TABS: MOVIMENTAÇÕES, PROPOSTAS, MEMBROS */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab('movimentos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'movimentos'
                ? 'bg-[#7B2FF7] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Extrato ({carteira.movements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('propostas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'propostas'
                ? 'bg-[#7B2FF7] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Propostas & Votações ({carteira.proposals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('membros')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'membros'
                ? 'bg-[#7B2FF7] text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Membros ({carteira.members.length})</span>
          </button>
        </div>

        {/* TAB 1: MOVIMENTAÇÕES */}
        {activeTab === 'movimentos' && (
          <div className="bg-white rounded-2xl border border-border shadow-subtle p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Histórico de Entradas e Saídas
              </h3>
              <span className="text-xs text-muted-foreground">Atualizado em tempo real</span>
            </div>

            {carteira.movements.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                <span className="text-2xl">💸</span>
                <p>Nenhuma movimentação realizada ainda nesta carteira.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {carteira.movements.map((mov) => {
                  const isDeposit = mov.type === 'deposito'

                  return (
                    <div
                      key={mov.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isDeposit
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-foreground">{mov.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {isDeposit ? 'Depositado por' : 'Autor:'}{' '}
                            <strong className="text-foreground">{mov.authorName}</strong>
                            {mov.recipient && ` • Pago para: ${mov.recipient}`} • {mov.timestamp}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm sm:text-base font-black tabular-nums ${
                            isDeposit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isDeposit ? '+' : '−'}
                          {formatCurrencyBRL(mov.amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {isDeposit ? 'Entrada' : 'Saída'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROPOSTAS */}
        {activeTab === 'propostas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Regra da república: são necessários no mínimo {carteira.threshold} votos de membros
                distintos para que uma saída seja debitada do caixa.
              </p>
              <Button
                size="sm"
                onClick={handleOpenPropose}
                className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-xl h-8 px-3"
              >
                Nova Proposta
              </Button>
            </div>

            {carteira.proposals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
                <span className="text-3xl">🗳️</span>
                <h4 className="text-sm font-bold text-foreground">Nenhuma proposta registrada</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Precisa comprar algo para a casa? Proponha uma saída do caixa para que os outros
                  moradores aprovem.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {carteira.proposals.map((prop) => {
                  const isPending = prop.status === 'pendente'
                  const isApproved = prop.status === 'aprovada'
                  const hasVoted = prop.approvals.some(
                    (a) => a.approverName.toLowerCase() === currentActorName.toLowerCase(),
                  )
                  const isProposer =
                    currentActorName.toLowerCase() === prop.proposerName.toLowerCase()

                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-2xl border border-border shadow-subtle p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-foreground">{prop.title}</h4>
                            {isApproved ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold">
                                ✓ Aprovada e Paga
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-amber-400 bg-amber-50 text-amber-800 text-[10px] font-bold"
                              >
                                Votação em andamento ({prop.currentApprovals}/
                                {prop.requiredApprovals})
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Proposto por <strong>{prop.proposerName}</strong>
                            {prop.recipient && ` • Para: ${prop.recipient}`}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-lg font-black text-rose-600 block tabular-nums">
                            −{formatCurrencyBRL(prop.amount)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {prop.currentApprovals}/{prop.requiredApprovals} aprovações
                          </span>
                        </div>
                      </div>

                      {/* Approvals list */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Aprovações ({prop.approvals.length})
                        </span>
                        {prop.approvals.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            Nenhum voto de aprovação registrado ainda.
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {prop.approvals.map((a) => (
                              <Badge
                                key={a.id}
                                variant="secondary"
                                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {a.approverName} ({a.timestamp})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Vote action if pending */}
                      {isPending && (
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Necessário mais{' '}
                            <strong>{prop.requiredApprovals - prop.currentApprovals}</strong>{' '}
                            voto(s) para liberação automática.
                          </span>

                          {!isProposer && !hasVoted && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(prop)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-3 gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEMBROS */}
        {activeTab === 'membros' && (
          <div className="bg-white rounded-2xl border border-border shadow-subtle p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Moradores e Cotistas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Contribuições acumuladas no caixa da casa
                </p>
              </div>
              <Badge className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-xs font-bold">
                {carteira.members.length} moradores
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {carteira.members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-border bg-[#F7F7FB] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-[#7B2FF7] font-bold text-sm flex items-center justify-center">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">{m.name}</span>
                        {m.role === 'admin' && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] font-bold">
                            Admin
                          </Badge>
                        )}
                        {m.isVerified && (
                          <span className="text-emerald-600 text-xs font-bold" title="Verificado">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Morador da república
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-foreground block tabular-nums">
                      {formatCurrencyBRL(m.totalContributed)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Contribuído</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: CONTRIBUIR / DEPOSITAR */}
      <Dialog open={isContributeModalOpen} onOpenChange={setIsContributeModalOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-2xl bg-white p-5 sm:p-6 border border-border shadow-2xl">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </span>
              Contribuir para o Caixa Coletivo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adicione valor ao fundo da república para suprir gastos comuns.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitContribute} className="space-y-4 my-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Valor da contribuição (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={contributeAmountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '')
                    if (!clean) {
                      setContributeAmountStr('')
                      return
                    }
                    const num = parseInt(clean, 10) / 100
                    setContributeAmountStr(
                      num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                    )
                  }}
                  className="pl-10 h-11 text-base font-bold text-foreground rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Quem está contribuindo?
              </label>
              <Input
                type="text"
                placeholder="Seu nome ou apelido"
                value={contributeName}
                onChange={(e) => setContributeName(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Descrição / Referência (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ex.: Depósito mensal fundo de reserva"
                value={contributeDesc}
                onChange={(e) => setContributeDesc(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributeModalOpen(false)}
                className="text-xs rounded-xl h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingContribute}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 shadow-sm"
              >
                {isSubmittingContribute ? 'Processando...' : 'Confirmar Depósito'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL: PROPOR SAÍDA (MULTISIG SIMULADO) */}
      <Dialog open={isProposeModalOpen} onOpenChange={setIsProposeModalOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-2xl bg-white p-5 sm:p-6 border border-border shadow-2xl">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-[#7B2FF7]">
                <Send className="w-4 h-4" />
              </span>
              Propor Saída do Caixa
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A saída precisa ser aprovada por {carteira.threshold} membros antes que o saldo seja
              debitado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPropose} className="space-y-4 my-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Motivo / Finalidade da despesa *
              </label>
              <Input
                type="text"
                placeholder="Ex.: Conserto do botijão de gás da cozinha"
                value={proposeTitle}
                onChange={(e) => setProposeTitle(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Valor a debitar (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={proposeAmountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '')
                    if (!clean) {
                      setProposeAmountStr('')
                      return
                    }
                    const num = parseInt(clean, 10) / 100
                    setProposeAmountStr(num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
                  }}
                  className="pl-10 h-11 text-base font-bold text-foreground rounded-xl"
                  required
                />
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                Saldo disponível no caixa: {formatCurrencyBRL(carteira.balance)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Destinatário / Fornecedor (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ex.: Depósito de Gás Universitário"
                value={proposeRecipient}
                onChange={(e) => setProposeRecipient(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Proponente (seu nome)
              </label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={proposeName}
                onChange={(e) => setProposeName(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProposeModalOpen(false)}
                className="text-xs rounded-xl h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPropose}
                className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold text-xs rounded-xl h-10 px-5 shadow-sm"
              >
                {isSubmittingPropose ? 'Submetendo...' : 'Submeter Proposta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
