import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { formatCurrencyBRL, AppNotification } from '@/types/racha'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Vote,
  Sparkles,
} from 'lucide-react'

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, unreadNotificationsCount, markNotificationsAsRead, clearNotifications } =
    useRacha()

  const handleOpenChange = (open: boolean) => {
    if (open && unreadNotificationsCount > 0) {
      markNotificationsAsRead()
    }
  }

  const handleNotificationClick = (n: AppNotification) => {
    if (n.link) {
      navigate(n.link)
      return
    }

    if (
      n.type === 'carteira_proposta_criada' ||
      n.type === 'carteira_proposta_aprovada' ||
      n.type === 'carteira_contribuicao'
    ) {
      navigate('/carteira')
      return
    }

    const rId = n.rachaId || 'demo'
    if (rId === 'demo') {
      navigate('/racha/demo')
    } else {
      navigate(`/racha/${rId}`)
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B2FF7]"
          aria-label={`Notificações (${unreadNotificationsCount} não lidas)`}
          title="Notificações de pagamento"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-[10px] font-extrabold text-white ring-2 ring-white animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl p-0 bg-white border border-border shadow-elevation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-[#F7F7FB] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-100 text-[#7B2FF7]">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-foreground">Notificações</span>
            {unreadNotificationsCount > 0 && (
              <span className="text-[10px] bg-[#7B2FF7] text-white px-1.5 py-0.2 rounded-full font-bold">
                {unreadNotificationsCount} novas
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={markNotificationsAsRead}
                className="text-[11px] font-medium text-[#7B2FF7] hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar lidas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="text-[11px] text-muted-foreground hover:text-destructive p-1 rounded"
                title="Limpar histórico"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List of notifications */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#7B2FF7] mx-auto flex items-center justify-center">
                <Bell className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-xs font-semibold text-foreground">Nenhuma notificação</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Quando alguém pagar um racha ou criar propostas no caixa da república, você será
                avisado aqui em tempo real.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isProposalCreated = n.type === 'carteira_proposta_criada'
              const isProposalApproved = n.type === 'carteira_proposta_aprovada'
              const isCarteiraDeposit = n.type === 'carteira_contribuicao'
              const isCarteiraType = isProposalCreated || isProposalApproved || isCarteiraDeposit

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-purple-50/40 transition-colors ${
                    !n.read ? 'bg-purple-50/25' : ''
                  }`}
                >
                  {/* Icon */}
                  {isProposalCreated && (
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Vote className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  )}

                  {isProposalApproved && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}

                  {isCarteiraDeposit && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  )}

                  {!isCarteiraType && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Carteira - Proposta criada */}
                    {isProposalCreated && (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                            Caixa Coletivo
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {n.title || 'Nova proposta no caixa da república'}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 leading-snug">
                          <strong className="text-foreground">{n.actorName || 'Morador'}</strong>{' '}
                          propôs saída de{' '}
                          <strong className="text-amber-800 font-bold">
                            {formatCurrencyBRL(n.amount)}
                          </strong>
                        </p>
                        {n.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5 italic">
                            &quot;{n.description}&quot;
                          </p>
                        )}
                      </>
                    )}

                    {/* Carteira - Proposta aprovada */}
                    {isProposalApproved && (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900">
                            Aprovado
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {n.title || 'Proposta aprovada ✅'}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 leading-snug">
                          Saída de{' '}
                          <strong className="text-rose-600 font-bold">
                            {formatCurrencyBRL(n.amount)}
                          </strong>{' '}
                          atingiu o quórum e foi liquidada.
                        </p>
                        {n.newBalance !== undefined && (
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            Novo saldo do caixa:{' '}
                            <span className="font-bold text-foreground">
                              {formatCurrencyBRL(n.newBalance)}
                            </span>
                          </p>
                        )}
                        {n.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {n.description}
                          </p>
                        )}
                      </>
                    )}

                    {/* Carteira - Contribuição */}
                    {isCarteiraDeposit && (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-900">
                            Depósito
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {n.title || 'Depósito no caixa coletivo'}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 leading-snug">
                          <strong className="text-foreground">{n.actorName || 'Morador'}</strong>{' '}
                          depositou{' '}
                          <strong className="text-emerald-700 font-bold">
                            {formatCurrencyBRL(n.amount)}
                          </strong>
                        </p>
                        {n.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {n.description}
                          </p>
                        )}
                      </>
                    )}

                    {/* Racha - Pagamento comum */}
                    {!isCarteiraType && (
                      <>
                        <p className="text-xs font-medium text-foreground">
                          <strong className="text-foreground">{n.participantName}</strong> pagou{' '}
                          <strong className="text-emerald-700 font-bold">
                            {formatCurrencyBRL(n.amount)}
                          </strong>
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          no racha{' '}
                          <span className="font-semibold text-foreground/80">{n.rachaName}</span>
                        </p>
                      </>
                    )}

                    {/* Footer link/action */}
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{n.timestamp}</span>
                      <span className="text-[#7B2FF7] font-semibold flex items-center gap-0.5 hover:underline">
                        {isCarteiraType ? 'Ver na carteira' : 'Abrir racha'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
