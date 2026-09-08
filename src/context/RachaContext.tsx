import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { Racha, Participant, RachaHistoryEntry, generateId, generateTxHash } from '@/types/racha'
import { DEMO_RACHA } from '@/data/seed'

import {
  fetchAllRachas,
  fetchRachaByIdOrCode,
  createRachaRecord,
  recordParticipantPayment,
  recordParticipantPending,
  addParticipantRecord,
  removeParticipantRecord,
  updateParticipantRecord,
  updateRachaRecord,
  claimRachasForUser,
  PagamentoRecord,
} from '@/services/rachas'
import {
  PaymentNotification,
  AppNotification,
  CarteiraCompartilhada,
  CarteiraProposta,
  CarteiraMovimento,
  FinancialSummaryAggregated,
  CarteiraNotifPreferences,
  DEFAULT_CARTEIRA_NOTIF_PREFS,
} from '@/types/racha'
import {
  fetchAllCarteiras,
  addCarteiraContribution,
  createCarteiraProposal,
  approveCarteiraProposal,
  updateCarteiraThreshold,
  updateCarteiraMemberPreferences,
  DEMO_CARTEIRA,
  CarteiraPropostaRecord,
  CarteiraMovimentoRecord,
} from '@/services/carteiras'
import { computeFinancialSummary } from '@/services/financialHistory'
import pb from '@/lib/pocketbase/client'

interface RachaContextType {
  rachas: Racha[]
  isLoading: boolean
  currentNickname: string
  setCurrentNickname: (name: string) => void
  getRacha: (id: string) => Racha | undefined
  fetchRemoteRacha: (idOrCode: string) => Promise<Racha | null>
  createRacha: (data: Omit<Racha, 'id' | 'createdAt' | 'history'>) => Promise<Racha>
  updateRacha: (id: string, updates: Partial<Racha>) => Promise<void>
  deleteRacha: (id: string) => void
  markParticipantPaid: (
    rachaId: string,
    participantId: string,
    txHash?: string,
    userId?: string,
  ) => Promise<void>
  markParticipantPending: (rachaId: string, participantId: string) => Promise<void>
  addParticipantToRacha: (
    rachaId: string,
    name: string,
    amount?: number,
    userId?: string,
  ) => Promise<void>
  removeParticipantFromRacha: (rachaId: string, participantId: string) => Promise<void>
  updateParticipant: (
    rachaId: string,
    participantId: string,
    updates: Partial<Participant>,
  ) => Promise<void>
  saveOrganizerChanges: (
    rachaId: string,
    changes: {
      name: string
      totalAmount: number
      splitType: 'equal' | 'custom'
      participants: Participant[]
    },
  ) => Promise<void>
  createNextMonthRecurring: (recurringGroupId: string) => Promise<Racha | null>
  resetDemoRacha: () => void
  isNicknameModalOpen: boolean
  setIsNicknameModalOpen: (open: boolean) => void
  isWhySolanaModalOpen: boolean
  setIsWhySolanaModalOpen: (open: boolean) => void
  notifications: AppNotification[]
  unreadNotificationsCount: number
  markNotificationsAsRead: () => void
  clearNotifications: () => void
  addAppNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  syncLocalStorageRachasToUser: (userId: string) => Promise<number>
  // Carteira Coletiva (República)
  carteiras: CarteiraCompartilhada[]
  primaryCarteira: CarteiraCompartilhada | undefined
  contributeToCarteira: (
    carteiraId: string,
    amount: number,
    description: string,
    authorName?: string,
  ) => Promise<void>
  proposeCarteiraExpense: (
    carteiraId: string,
    title: string,
    amount: number,
    recipient?: string,
    proposerName?: string,
  ) => Promise<void>
  approveProposal: (
    carteiraId: string,
    proposalId: string,
    approverName?: string,
  ) => Promise<{ executed: boolean }>
  updateCarteiraQuorum: (carteiraId: string, newThreshold: number) => Promise<void>
  updateMemberNotifPreferences: (
    carteiraId: string,
    memberKey: string,
    preferences: CarteiraNotifPreferences,
  ) => Promise<void>
  getMemberNotifPreferences: (carteiraId: string, memberKey: string) => CarteiraNotifPreferences
  // Histórico financeiro
  financialSummary: FinancialSummaryAggregated
}

const STORAGE_KEY = 'rachaai_rachas'
const USER_KEY = 'rachaai_nickname'
const NOTIFS_KEY = 'rachaai_notifications'

const RachaContext = createContext<RachaContextType | undefined>(undefined)

export const RachaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rachas, setRachas] = useState<Racha[]>([DEMO_RACHA])
  const [isLoading, setIsLoading] = useState(true)
  const [carteiras, setCarteiras] = useState<CarteiraCompartilhada[]>([DEMO_CARTEIRA])

  const [currentNickname, setCurrentNicknameState] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_KEY) || ''
    } catch {
      return ''
    }
  })

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      /* ignore */
    }
    return [
      {
        id: 'notif-demo-1',
        type: 'pagamento_racha',
        rachaId: 'demo',
        rachaName: 'Viagem para Congresso Universitário',
        participantName: 'Ana Clara',
        amount: 80,
        timestamp: 'Há 10 minutos',
        read: false,
        link: '/racha/demo',
      },
      {
        id: 'notif-demo-prop',
        type: 'carteira_proposta_criada',
        carteiraId: 'demo-carteira-rep',
        carteiraName: 'Caixa da República',
        proposalId: 'cprop-1',
        title: 'Nova proposta no caixa da república',
        description: 'Conserto emergencial da fechadura eletrônica',
        actorName: 'Mateus',
        amount: 140,
        timestamp: 'Há 3 horas',
        read: false,
        link: '/carteira',
      },
    ]
  })

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications))
    } catch {
      /* ignore */
    }
  }, [notifications])

  // Seed default República Recurring group if not present so user can test República out of the box
  useEffect(() => {
    setRachas((prev) => {
      const hasRecurring = prev.some(
        (r) => r.isRecurring || r.recurringGroupId === 'republica-demo',
      )
      if (hasRecurring) return prev

      const demoRepublic: Racha = {
        id: 'demo-republica-1',
        name: 'República Aloprados - Maio/2025',
        category: 'República',
        totalAmount: 1800,
        splitType: 'equal',
        isRecurring: true,
        recurringGroupId: 'republica-demo',
        recurringGroupName: 'República Aloprados',
        referenceMonth: 'Maio/2025',
        creatorNickname: 'Lucas',
        description: 'Aluguel, internet de fibra e contas de consumo da república.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
        participants: [
          { id: 'rep-p1', name: 'Lucas', amount: 450, paid: true, paidAt: 'Há 3 dias' },
          { id: 'rep-p2', name: 'Mateus', amount: 450, paid: true, paidAt: 'Há 2 dias' },
          { id: 'rep-p3', name: 'Rodrigo', amount: 450, paid: false },
          { id: 'rep-p4', name: 'Gabriel', amount: 450, paid: false },
        ],
        history: [
          {
            id: 'rep-h1',
            participantName: 'Lucas',
            amount: 450,
            timestamp: 'Há 3 dias',
            status: 'Confirmado',
          },
          {
            id: 'rep-h2',
            participantName: 'Mateus',
            amount: 450,
            timestamp: 'Há 2 dias',
            status: 'Confirmado',
          },
        ],
      }

      return [...prev, demoRepublic]
    })
  }, [])

  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [isWhySolanaModalOpen, setIsWhySolanaModalOpen] = useState(false)

  // Initial load from PocketBase backend with localStorage fallback
  useEffect(() => {
    let mounted = true
    async function loadInitial() {
      try {
        const remoteList = await fetchAllRachas()
        if (mounted && remoteList && remoteList.length > 0) {
          setRachas(remoteList)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteList))
          } catch {
            /* intentionally ignored */
          }
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.warn('Erro ao carregar dados remotos:', err)
      }

      // Local storage fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0 && mounted) {
            setRachas(parsed)
          }
        }
      } catch {
        /* intentionally ignored */
      }

      if (mounted) setIsLoading(false)
    }

    // Initial carteiras load
    async function loadCarteiras() {
      try {
        const remoteCarteiras = await fetchAllCarteiras()
        if (mounted && remoteCarteiras && remoteCarteiras.length > 0) {
          setCarteiras(remoteCarteiras)
        }
      } catch (err) {
        console.warn('Erro ao carregar carteiras remotas:', err)
      }
    }

    loadInitial()
    loadCarteiras()
    return () => {
      mounted = false
    }
  }, [])

  // Sync to local cache
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rachas))
      } catch (e) {
        console.error('Failed to save rachas to localStorage', e)
      }
    }
  }, [rachas, isLoading])

  // Realtime subscription for incoming payments and carteira shared wallet updates
  useEffect(() => {
    let unsubs: (() => Promise<void>)[] = []
    let cancelled = false

    // 1. Pagamentos de rachas
    pb.collection('pagamentos')
      .subscribe<PagamentoRecord>('*', (e) => {
        if (e.action === 'create' && e.record) {
          const rec = e.record
          setRachas((currentRachas) => {
            const targetRacha = currentRachas.find((r) => r.id === rec.racha)
            const rachaName = targetRacha?.name || 'Racha'

            setNotifications((prev) => {
              if (prev.some((n) => n.id === rec.id || (rec.txHash && n.txHash === rec.txHash))) {
                return prev
              }
              return [
                {
                  id: rec.id,
                  type: 'pagamento_racha',
                  rachaId: rec.racha,
                  rachaName,
                  participantName: rec.participantName,
                  amount: rec.amount,
                  timestamp: rec.timestamp || 'Agora há pouco',
                  txHash: rec.txHash,
                  read: false,
                  link: `/racha/${rec.racha}`,
                },
                ...prev,
              ]
            })

            return currentRachas
          })
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubs.push(fn)
        }
      })
      .catch(() => {})

    // 2. Propostas da carteira compartilhada (novas ou atualizadas/aprovadas)
    pb.collection('carteira_propostas')
      .subscribe<CarteiraPropostaRecord>('*', (e) => {
        if (!e.record) return
        const prop = e.record
        const currentUserAuthId = pb.authStore.record?.id
        const currentLocalNickname = (localStorage.getItem(USER_KEY) || '').trim().toLowerCase()

        if (e.action === 'create') {
          // Quando alguém cria uma proposta, notificar se quem criou NÃO for o usuário atual
          const isProposerMe =
            (currentUserAuthId && prop.proposerUser === currentUserAuthId) ||
            (currentLocalNickname &&
              prop.proposerName?.trim().toLowerCase() === currentLocalNickname)

          // Se eu não sou o proponente, verificar preferências de notificação do morador
          if (!isProposerMe) {
            setCarteiras((currentCarteiras) => {
              const targetCart = currentCarteiras.find((c) => c.id === prop.carteira)
              const memberKey = currentUserAuthId || currentLocalNickname
              const memberPrefs =
                (memberKey && targetCart?.notifPreferences?.[memberKey]) ||
                DEFAULT_CARTEIRA_NOTIF_PREFS

              if (memberPrefs.novaProposta !== false) {
                setNotifications((prev) => {
                  const notifId = `prop-created-${prop.id}`
                  if (prev.some((n) => n.id === notifId)) return prev

                  return [
                    {
                      id: notifId,
                      type: 'carteira_proposta_criada',
                      carteiraId: prop.carteira,
                      carteiraName: targetCart?.name || 'Caixa da República',
                      proposalId: prop.id,
                      title: 'Nova proposta no caixa da república',
                      description: prop.title,
                      actorName: prop.proposerName,
                      amount: prop.amount,
                      timestamp: 'Agora há pouco',
                      read: false,
                      link: '/carteira',
                    },
                    ...prev,
                  ]
                })
              }
              return currentCarteiras
            })
          }
        } else if (e.action === 'update' && prop.status === 'aprovada') {
          // Quando a proposta for aprovada (atingiu quórum), verificar preferências
          setCarteiras((currentCarteiras) => {
            const targetCart = currentCarteiras.find((c) => c.id === prop.carteira)
            const memberKey = currentUserAuthId || currentLocalNickname
            const memberPrefs =
              (memberKey && targetCart?.notifPreferences?.[memberKey]) ||
              DEFAULT_CARTEIRA_NOTIF_PREFS

            if (memberPrefs.propostaAprovada !== false) {
              setNotifications((prev) => {
                const notifId = `prop-approved-${prop.id}`
                if (prev.some((n) => n.id === notifId)) return prev

                return [
                  {
                    id: notifId,
                    type: 'carteira_proposta_aprovada',
                    carteiraId: prop.carteira,
                    carteiraName: targetCart?.name || 'Caixa da República',
                    proposalId: prop.id,
                    title: 'Proposta aprovada ✅',
                    description: `${prop.title} — Débito efetuado no caixa`,
                    actorName: prop.proposerName,
                    amount: prop.amount,
                    timestamp: 'Agora há pouco',
                    read: false,
                    link: '/carteira',
                  },
                  ...prev,
                ]
              })
            }
            return currentCarteiras
          })
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubs.push(fn)
        }
      })
      .catch(() => {})

    // 3. Movimentações da carteira (depósitos / contribuições)
    pb.collection('carteira_movimentos')
      .subscribe<CarteiraMovimentoRecord>('*', (e) => {
        if (e.action === 'create' && e.record && e.record.type === 'deposito') {
          const mov = e.record
          const currentUserAuthId = pb.authStore.record?.id
          const currentLocalNickname = (localStorage.getItem(USER_KEY) || '').trim().toLowerCase()

          const isAuthorMe =
            (currentUserAuthId && mov.user === currentUserAuthId) ||
            (currentLocalNickname && mov.authorName?.trim().toLowerCase() === currentLocalNickname)

          // Notificar membros quando há um novo depósito, respeitando preferências
          if (!isAuthorMe) {
            setCarteiras((currentCarteiras) => {
              const targetCart = currentCarteiras.find((c) => c.id === mov.carteira)
              const memberKey = currentUserAuthId || currentLocalNickname
              const memberPrefs =
                (memberKey && targetCart?.notifPreferences?.[memberKey]) ||
                DEFAULT_CARTEIRA_NOTIF_PREFS

              if (memberPrefs.contribuicoes !== false) {
                setNotifications((prev) => {
                  const notifId = `mov-deposito-${mov.id}`
                  if (prev.some((n) => n.id === notifId)) return prev

                  return [
                    {
                      id: notifId,
                      type: 'carteira_contribuicao',
                      carteiraId: mov.carteira,
                      carteiraName: targetCart?.name || 'Caixa da República',
                      title: 'Novo depósito no caixa coletivo',
                      description: mov.description || 'Contribuição ao fundo de reserva',
                      actorName: mov.authorName,
                      amount: mov.amount,
                      timestamp: 'Agora há pouco',
                      read: false,
                      link: '/carteira',
                    },
                    ...prev,
                  ]
                })
              }
              return currentCarteiras
            })
          }
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubs.push(fn)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      unsubs.forEach((fn) => fn().catch(() => {}))
    }
  }, [])

  // Method to sync and adopt local/unowned rachas when user signs in
  const syncLocalStorageRachasToUser = useCallback(
    async (userId: string): Promise<number> => {
      try {
        const localRachaIds = rachas
          .filter((r) => !r.isDemo && r.id !== 'demo' && (!r.owner || r.owner === ''))
          .map((r) => r.id)

        const claimedCount = await claimRachasForUser(userId, {
          nickname: currentNickname,
          rachaIds: localRachaIds,
        })

        if (claimedCount > 0) {
          // Refresh rachas
          const refreshed = await fetchAllRachas()
          setRachas(refreshed)
        }
        return claimedCount
      } catch (err) {
        console.warn('Erro ao sincronizar rachas locais:', err)
        return 0
      }
    },
    [rachas, currentNickname],
  )

  const setCurrentNickname = useCallback((name: string) => {
    const trimmed = name.trim()
    setCurrentNicknameState(trimmed)
    try {
      if (trimmed) {
        localStorage.setItem(USER_KEY, trimmed)
      } else {
        localStorage.removeItem(USER_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  const getRacha = useCallback(
    (idOrCode: string) => {
      if (idOrCode === 'demo') {
        return (
          rachas.find(
            (r) => r.id === 'demo' || r.isDemo || r.shareCode === 'viagem-congresso-7k2m',
          ) || DEMO_RACHA
        )
      }
      return rachas.find(
        (r) => r.id === idOrCode || r.shareCode === idOrCode || (r.isDemo && idOrCode === 'demo'),
      )
    },
    [rachas],
  )

  const fetchRemoteRacha = useCallback(
    async (idOrCode: string): Promise<Racha | null> => {
      const existing = getRacha(idOrCode)
      if (existing) return existing

      const remote = await fetchRachaByIdOrCode(idOrCode)
      if (remote) {
        setRachas((prev) => {
          if (prev.some((x) => x.id === remote.id)) return prev
          return [remote, ...prev]
        })
      }
      return remote
    },
    [getRacha],
  )

  const createRacha = useCallback(
    async (data: Omit<Racha, 'id' | 'createdAt' | 'history'>): Promise<Racha> => {
      try {
        const created = await createRachaRecord(data)
        setRachas((prev) => [created, ...prev])
        return created
      } catch (err) {
        console.warn('Erro ao salvar racha no PocketBase, criando localmente:', err)
        const newId = generateId()
        const shareCode = `${data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 16)}-${newId}`

        const fallbackRacha: Racha = {
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
          shareCode,
          history: data.participants
            .filter((p) => p.paid)
            .map((p) => ({
              id: generateId(),
              participantName: p.name,
              amount: p.amount,
              timestamp: 'Agora há pouco',
              status: 'Confirmado',
              txHash: p.txHash || generateTxHash(),
            })),
        }

        setRachas((prev) => [fallbackRacha, ...prev])
        return fallbackRacha
      }
    },
    [],
  )

  const updateRacha = useCallback(async (id: string, updates: Partial<Racha>) => {
    setRachas((prev) => prev.map((racha) => (racha.id === id ? { ...racha, ...updates } : racha)))
    try {
      await updateRachaRecord(id, updates as any)
    } catch (err) {
      console.warn('Erro ao atualizar racha no PocketBase:', err)
    }
  }, [])

  const deleteRacha = useCallback((id: string) => {
    setRachas((prev) => prev.filter((racha) => racha.id !== id))
    pb.collection('rachas')
      .delete(id)
      .catch(() => {})
  }, [])

  const updateParticipant = useCallback(
    async (rachaId: string, participantId: string, updates: Partial<Participant>) => {
      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r
          return {
            ...r,
            participants: r.participants.map((p) =>
              p.id === participantId ? { ...p, ...updates } : p,
            ),
          }
        }),
      )

      try {
        await updateParticipantRecord(participantId, updates)
      } catch (err) {
        console.warn('Erro ao atualizar participante no PocketBase:', err)
      }
    },
    [],
  )

  const saveOrganizerChanges = useCallback(
    async (
      rachaId: string,
      changes: {
        name: string
        totalAmount: number
        splitType: 'equal' | 'custom'
        participants: Participant[]
      },
    ) => {
      const target = rachas.find((r) => r.id === rachaId || (rachaId === 'demo' && r.isDemo))
      const isDemo = rachaId === 'demo' || target?.isDemo

      // Optimistic update
      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r
          return {
            ...r,
            name: changes.name,
            totalAmount: changes.totalAmount,
            splitType: changes.splitType,
            participants: changes.participants,
          }
        }),
      )

      if (isDemo) return

      try {
        // 1. Update racha metadata
        await updateRachaRecord(rachaId, {
          name: changes.name,
          totalAmount: changes.totalAmount,
          splitType: changes.splitType,
        })

        // 2. Sync participants
        const existingParticipants = target?.participants || []
        const currentIds = new Set(changes.participants.map((p) => p.id))

        // Deleted participants
        for (const ep of existingParticipants) {
          if (!currentIds.has(ep.id)) {
            await removeParticipantRecord(ep.id).catch(() => {})
          }
        }

        // Updated or New participants
        const updatedParticipantsList: Participant[] = []
        for (const p of changes.participants) {
          const isExisting = existingParticipants.some((ep) => ep.id === p.id)
          if (isExisting) {
            await updateParticipantRecord(p.id, {
              name: p.name,
              amount: p.amount,
            }).catch(() => {})
            updatedParticipantsList.push(p)
          } else {
            // New participant added during editing
            const created = await addParticipantRecord(rachaId, p.name, p.amount)
            updatedParticipantsList.push({
              ...p,
              id: created.id,
            })
          }
        }

        // Re-sync IDs if new ones were generated
        setRachas((prev) =>
          prev.map((r) => (r.id === rachaId ? { ...r, participants: updatedParticipantsList } : r)),
        )
      } catch (err) {
        console.error('Erro ao salvar alterações do organizador no PocketBase:', err)
      }
    },
    [rachas],
  )

  const markParticipantPaid = useCallback(
    async (
      rachaId: string,
      participantId: string,
      customTxHash?: string,
      customUserId?: string,
    ) => {
      const hash = customTxHash || generateTxHash()
      const effectiveUserId = customUserId || pb.authStore.record?.id || undefined
      let paidPName = ''
      let paidAmount = 0
      let targetRachaName = ''

      // Optimistic update
      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

          targetRachaName = r.name
          let targetParticipant: Participant | undefined
          const updatedParticipants = r.participants.map((p) => {
            if (p.id === participantId || p.name.toLowerCase() === participantId.toLowerCase()) {
              const updatedP = {
                ...p,
                paid: true,
                paidAt: 'Agora há pouco',
                txHash: hash,
                user: effectiveUserId || p.user,
                isVerified: Boolean(effectiveUserId || p.user),
              }
              targetParticipant = updatedP
              paidPName = p.name
              paidAmount = p.amount
              return updatedP
            }
            return p
          })

          if (!targetParticipant) return r

          const newHistoryEntry: RachaHistoryEntry = {
            id: generateId(),
            participantName: targetParticipant.name,
            amount: targetParticipant.amount,
            timestamp: 'Agora há pouco',
            status: 'Confirmado',
            txHash: targetParticipant.txHash,
            user: effectiveUserId || targetParticipant.user,
            isVerified: Boolean(effectiveUserId || targetParticipant.user),
          }

          return {
            ...r,
            participants: updatedParticipants,
            history: [newHistoryEntry, ...r.history],
          }
        }),
      )

      // Add notification for creator
      if (paidPName) {
        setNotifications((prev) => [
          {
            id: generateId(),
            rachaId,
            rachaName: targetRachaName || 'Racha',
            participantName: paidPName,
            amount: paidAmount,
            timestamp: 'Agora há pouco',
            txHash: hash,
            read: false,
          },
          ...prev,
        ])
      }

      // Sync backend
      try {
        await recordParticipantPayment(rachaId, participantId, hash, effectiveUserId)
      } catch (err) {
        console.warn('Erro ao sincronizar pagamento no PocketBase:', err)
      }
    },
    [],
  )

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const addAppNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      setNotifications((prev) => [
        {
          id: generateId(),
          timestamp: 'Agora há pouco',
          read: false,
          ...notification,
        },
        ...prev,
      ])
    },
    [],
  )

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const markParticipantPending = useCallback(async (rachaId: string, participantId: string) => {
    setRachas((prev) =>
      prev.map((r) => {
        if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

        const targetP = r.participants.find((p) => p.id === participantId)
        const updatedParticipants = r.participants.map((p) => {
          if (p.id === participantId) {
            return {
              ...p,
              paid: false,
              paidAt: undefined,
              txHash: undefined,
            }
          }
          return p
        })

        return {
          ...r,
          participants: updatedParticipants,
          history: r.history.filter((h) => h.participantName !== targetP?.name),
        }
      }),
    )

    try {
      await recordParticipantPending(rachaId, participantId)
    } catch (err) {
      console.warn('Erro ao sincronizar status pendente no PocketBase:', err)
    }
  }, [])

  const addParticipantToRacha = useCallback(
    async (rachaId: string, name: string, amount?: number, customUserId?: string) => {
      const targetRacha = rachas.find((r) => r.id === rachaId || (rachaId === 'demo' && r.isDemo))
      const count = (targetRacha?.participants.length || 0) + 1
      const newAmount =
        amount !== undefined
          ? amount
          : targetRacha
            ? Math.round((targetRacha.totalAmount / count) * 100) / 100
            : 0

      const effectiveUserId = customUserId || pb.authStore.record?.id || undefined
      const tempId = generateId()

      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

          const newP: Participant = {
            id: tempId,
            name,
            amount: newAmount,
            paid: false,
            user: effectiveUserId,
            isVerified: Boolean(effectiveUserId),
          }

          return {
            ...r,
            participants: [...r.participants, newP],
          }
        }),
      )

      try {
        const record = await addParticipantRecord(
          targetRacha?.id || rachaId,
          name,
          newAmount,
          effectiveUserId,
        )
        if (record && record.id) {
          setRachas((prev) =>
            prev.map((r) => {
              if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r
              return {
                ...r,
                participants: r.participants.map((p) =>
                  p.id === tempId ? { ...p, id: record.id } : p,
                ),
              }
            }),
          )
        }
      } catch (err) {
        console.warn('Erro ao persistir novo participante no PocketBase:', err)
      }
    },
    [rachas],
  )

  const removeParticipantFromRacha = useCallback(async (rachaId: string, participantId: string) => {
    setRachas((prev) =>
      prev.map((r) => {
        if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r
        return {
          ...r,
          participants: r.participants.filter((p) => p.id !== participantId),
        }
      }),
    )

    try {
      await removeParticipantRecord(participantId)
    } catch (err) {
      console.warn('Erro ao remover participante do PocketBase:', err)
    }
  }, [])

  const createNextMonthRecurring = useCallback(
    async (recurringGroupId: string): Promise<Racha | null> => {
      const groupRachas = rachas.filter((r) => r.recurringGroupId === recurringGroupId)
      if (groupRachas.length === 0) return null

      // Sort by creation date descending to pick the latest instance as template
      const template = [...groupRachas].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]

      // Determine next month name
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

      const currentMonthIndex = new Date().getMonth()
      const nextMonthIndex = (currentMonthIndex + 1) % 12
      const nextMonthName = months[nextMonthIndex]
      const year = nextMonthIndex === 0 ? new Date().getFullYear() + 1 : new Date().getFullYear()
      const referenceMonth = `${nextMonthName}/${year}`

      const groupName = template.recurringGroupName || template.name.replace(/ - \w+\/\d+$/, '')

      const newRachaData: Omit<Racha, 'id' | 'createdAt' | 'history'> = {
        name: `${groupName} - ${referenceMonth}`,
        category: 'República',
        totalAmount: template.totalAmount,
        splitType: template.splitType,
        isRecurring: true,
        recurringGroupId,
        recurringGroupName: groupName,
        referenceMonth,
        creatorNickname: template.creatorNickname || currentNickname || 'Você',
        owner: pb.authStore.record?.id || template.owner || undefined,
        description: `Mensalidade recorrente de ${referenceMonth} da ${groupName}`,
        participants: template.participants.map((p) => ({
          id: generateId(),
          name: p.name,
          amount: p.amount,
          paid: false,
        })),
      }

      try {
        const created = await createRachaRecord(newRachaData)
        setRachas((prev) => [created, ...prev])
        return created
      } catch (err) {
        console.warn('Erro ao criar próximo mês recorrente no PocketBase:', err)
        const fallback = await createRacha(newRachaData)
        return fallback
      }
    },
    [rachas, currentNickname, createRacha],
  )

  const resetDemoRacha = useCallback(() => {
    setRachas((prev) => {
      const filtered = prev.filter(
        (r) => r.id !== 'demo' && !r.isDemo && r.id !== 'demo-republica-1',
      )
      const demoRepublic: Racha = {
        id: 'demo-republica-1',
        name: 'República Aloprados - Maio/2025',
        category: 'República',
        totalAmount: 1800,
        splitType: 'equal',
        isRecurring: true,
        recurringGroupId: 'republica-demo',
        recurringGroupName: 'República Aloprados',
        referenceMonth: 'Maio/2025',
        creatorNickname: 'Lucas',
        description: 'Aluguel, internet de fibra e contas de consumo da república.',
        createdAt: new Date().toISOString(),
        participants: [
          { id: 'rep-p1', name: 'Lucas', amount: 450, paid: true, paidAt: 'Há 3 dias' },
          { id: 'rep-p2', name: 'Mateus', amount: 450, paid: true, paidAt: 'Há 2 dias' },
          { id: 'rep-p3', name: 'Rodrigo', amount: 450, paid: false },
          { id: 'rep-p4', name: 'Gabriel', amount: 450, paid: false },
        ],
        history: [
          {
            id: 'rep-h1',
            participantName: 'Lucas',
            amount: 450,
            timestamp: 'Há 3 dias',
            status: 'Confirmado',
          },
          {
            id: 'rep-h2',
            participantName: 'Mateus',
            amount: 450,
            timestamp: 'Há 2 dias',
            status: 'Confirmado',
          },
        ],
      }
      return [DEMO_RACHA, demoRepublic, ...filtered]
    })
  }, [])

  // CARTEIRA ACTIONS
  const primaryCarteira = useMemo(() => {
    return carteiras[0] || DEMO_CARTEIRA
  }, [carteiras])

  const contributeToCarteira = useCallback(
    async (carteiraId: string, amount: number, description: string, authorName?: string) => {
      const user = pb.authStore.record
      const author = authorName?.trim() || user?.name || currentNickname || 'Visitante'
      const userId = user?.id || undefined

      const target = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      const targetId = target?.id || carteiraId
      const newBal = (target?.balance || 0) + amount

      // Optimistic update
      setCarteiras((prev) =>
        prev.map((c) => {
          if (c.id !== carteiraId && !(carteiraId === 'demo' && c.isDemo)) return c
          const updatedBal = c.balance + amount
          const newMov: CarteiraMovimento = {
            id: generateId(),
            carteiraId: c.id,
            type: 'deposito',
            amount,
            description: description || 'Contribuição ao caixa',
            authorName: author,
            timestamp: 'Agora há pouco',
            user: userId,
          }

          // Update member if exists
          const existingMemberIndex = c.members.findIndex(
            (m) => m.name.toLowerCase() === author.toLowerCase(),
          )
          let updatedMembers = [...c.members]
          if (existingMemberIndex >= 0) {
            updatedMembers[existingMemberIndex] = {
              ...updatedMembers[existingMemberIndex],
              totalContributed: updatedMembers[existingMemberIndex].totalContributed + amount,
              isVerified: Boolean(userId),
            }
          } else {
            updatedMembers.push({
              id: generateId(),
              name: author,
              role: 'membro',
              totalContributed: amount,
              user: userId,
              isVerified: Boolean(userId),
            })
          }

          return {
            ...c,
            balance: updatedBal,
            members: updatedMembers,
            movements: [newMov, ...c.movements],
          }
        }),
      )

      // Notificação in-app informativa sobre o novo depósito, respeitando preferências do morador
      const currentMemberKey = userId || author
      const prefs = target?.notifPreferences?.[currentMemberKey] || DEFAULT_CARTEIRA_NOTIF_PREFS
      if (prefs.contribuicoes !== false) {
        addAppNotification({
          type: 'carteira_contribuicao',
          carteiraId: targetId,
          carteiraName: target?.name || 'Caixa da República',
          title: 'Depósito registrado no caixa',
          description: `${description || 'Contribuição ao caixa'} por ${author}`,
          actorName: author,
          amount,
          newBalance: newBal,
          link: '/carteira',
        })
      }

      // PocketBase persist
      try {
        if (target && !target.id.startsWith('demo-')) {
          await addCarteiraContribution(target.id, amount, author, description, userId)
        }
      } catch (err) {
        console.warn('Erro ao registrar contribuição no PocketBase:', err)
      }
    },
    [carteiras, currentNickname, addAppNotification],
  )

  const proposeCarteiraExpense = useCallback(
    async (
      carteiraId: string,
      title: string,
      amount: number,
      recipient?: string,
      proposerName?: string,
    ) => {
      const user = pb.authStore.record
      const author = proposerName?.trim() || user?.name || currentNickname || 'Morador'
      const userId = user?.id || undefined

      const target = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      const targetId = target?.id || carteiraId

      const tempProp: CarteiraProposta = {
        id: generateId(),
        carteiraId: targetId,
        title: title.trim(),
        amount,
        recipient: recipient?.trim(),
        proposerName: author,
        proposerUser: userId,
        status: 'pendente',
        requiredApprovals: target?.threshold || 2,
        currentApprovals: 0,
        approvals: [],
        createdAt: new Date().toISOString(),
      }

      setCarteiras((prev) =>
        prev.map((c) => {
          if (c.id !== targetId && !(targetId === 'demo' && c.isDemo)) return c
          return {
            ...c,
            proposals: [tempProp, ...c.proposals],
          }
        }),
      )

      // No modo demo/local, quando o usuário simula uma proposta com outro morador (ex: Mateus ou Lucas),
      // ou para garantir que uma proposta recém-criada por outro membro apareça imediatamente
      // Se quem propõe for outro morador (diferente do usuário ativo atual), adicionamos a notificação
      const currentActiveName = user?.name || currentNickname || ''
      const isOtherProposer =
        currentActiveName && author.toLowerCase() !== currentActiveName.toLowerCase()

      if (isOtherProposer) {
        const memberKey = user?.id || currentActiveName
        const memberPrefs = target?.notifPreferences?.[memberKey] || DEFAULT_CARTEIRA_NOTIF_PREFS
        if (memberPrefs.novaProposta !== false) {
          addAppNotification({
            type: 'carteira_proposta_criada',
            carteiraId: targetId,
            carteiraName: target?.name || 'Caixa da República',
            proposalId: tempProp.id,
            title: 'Nova proposta no caixa da república',
            description: title.trim(),
            actorName: author,
            amount,
            link: '/carteira',
          })
        }
      }

      try {
        if (target && !target.id.startsWith('demo-')) {
          await createCarteiraProposal(target.id, title, amount, author, recipient, userId)
        }
      } catch (err) {
        console.warn('Erro ao criar proposta no PocketBase:', err)
      }
    },
    [carteiras, currentNickname, addAppNotification],
  )

  const approveProposal = useCallback(
    async (
      carteiraId: string,
      proposalId: string,
      approverName?: string,
    ): Promise<{ executed: boolean }> => {
      const user = pb.authStore.record
      const author = approverName?.trim() || user?.name || currentNickname || 'Membro'
      const userId = user?.id || undefined

      const targetCarteira = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      const targetProposal = targetCarteira?.proposals.find((p) => p.id === proposalId)

      if (!targetProposal) {
        throw new Error('Proposta não encontrada.')
      }

      if (
        author.toLowerCase() === targetProposal.proposerName.toLowerCase() ||
        (userId && targetProposal.proposerUser && userId === targetProposal.proposerUser)
      ) {
        throw new Error('O proponente da saída não pode aprovar a própria proposta.')
      }

      if (
        targetProposal.approvals.some(
          (a) =>
            a.approverName.toLowerCase() === author.toLowerCase() ||
            (userId && a.approverUser && a.approverUser === userId),
        )
      ) {
        throw new Error('Você já registrou aprovação para esta proposta.')
      }

      const nextApprovalsCount = targetProposal.currentApprovals + 1
      const willExecute = nextApprovalsCount >= targetProposal.requiredApprovals

      if (willExecute && (targetCarteira?.balance || 0) < targetProposal.amount) {
        throw new Error('Saldo insuficiente na carteira compartilhada para liquidar esta despesa.')
      }

      let executedNewBalance = (targetCarteira?.balance || 0) - targetProposal.amount

      // Optimistic state update
      setCarteiras((prev) =>
        prev.map((c) => {
          if (c.id !== carteiraId && !(carteiraId === 'demo' && c.isDemo)) return c

          let newBalance = c.balance
          let newMovements = [...c.movements]

          if (willExecute) {
            newBalance = c.balance - targetProposal.amount
            newMovements.unshift({
              id: generateId(),
              carteiraId: c.id,
              type: 'saida',
              amount: targetProposal.amount,
              description: `[Aprovado em grupo] ${targetProposal.title}`,
              authorName: targetProposal.proposerName,
              recipient: targetProposal.recipient || 'Despesa coletiva',
              timestamp: 'Agora há pouco',
              user: targetProposal.proposerUser,
            })
          }

          const updatedProposals = c.proposals.map((p) => {
            if (p.id !== proposalId) return p
            return {
              ...p,
              status: willExecute ? ('aprovada' as const) : ('pendente' as const),
              currentApprovals: nextApprovalsCount,
              approvals: [
                ...p.approvals,
                {
                  id: generateId(),
                  propostaId: p.id,
                  approverName: author,
                  approverUser: userId,
                  timestamp: 'Agora há pouco',
                },
              ],
            }
          })

          return {
            ...c,
            balance: newBalance,
            movements: newMovements,
            proposals: updatedProposals,
          }
        }),
      )

      // Se a proposta foi aprovada (atingiu quórum), disparar notificação local respeitando preferências
      if (willExecute) {
        const memberKey = userId || author
        const memberPrefs =
          targetCarteira?.notifPreferences?.[memberKey] || DEFAULT_CARTEIRA_NOTIF_PREFS
        if (memberPrefs.propostaAprovada !== false) {
          addAppNotification({
            type: 'carteira_proposta_aprovada',
            carteiraId: targetCarteira?.id || carteiraId,
            carteiraName: targetCarteira?.name || 'Caixa da República',
            proposalId: targetProposal.id,
            title: 'Proposta aprovada ✅',
            description: `${targetProposal.title} — Débito efetuado no caixa`,
            actorName: author,
            amount: targetProposal.amount,
            newBalance: executedNewBalance >= 0 ? executedNewBalance : 0,
            link: '/carteira',
          })
        }
      }

      // PocketBase persist
      if (targetCarteira && !targetCarteira.id.startsWith('demo-')) {
        try {
          const res = await approveCarteiraProposal(proposalId, author, userId)
          return { executed: res.executed }
        } catch (err: any) {
          console.warn('Erro ao sincronizar aprovação no PocketBase:', err)
          throw err
        }
      }

      return { executed: willExecute }
    },
    [carteiras, currentNickname, addAppNotification],
  )

  const updateCarteiraQuorum = useCallback(
    async (carteiraId: string, newThreshold: number) => {
      const target = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      const targetId = target?.id || carteiraId
      const memberCount = target?.members.length || 4

      // Validação estrita: mínimo 1, máximo número de membros
      const clamped = Math.max(1, Math.min(newThreshold, memberCount))

      setCarteiras((prev) =>
        prev.map((c) => {
          if (c.id !== targetId && !(targetId === 'demo' && c.isDemo)) return c
          return {
            ...c,
            threshold: clamped,
          }
        }),
      )

      try {
        if (target && !target.id.startsWith('demo-')) {
          await updateCarteiraThreshold(target.id, clamped)
        }
      } catch (err) {
        console.warn('Erro ao atualizar quórum da carteira no PocketBase:', err)
        throw err
      }
    },
    [carteiras],
  )

  // Atualiza as preferências de notificação individuais de um membro da carteira
  const updateMemberNotifPreferences = useCallback(
    async (carteiraId: string, memberKey: string, preferences: CarteiraNotifPreferences) => {
      const target = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      const targetId = target?.id || carteiraId

      setCarteiras((prev) =>
        prev.map((c) => {
          if (c.id !== targetId && !(targetId === 'demo' && c.isDemo)) return c
          const currentPrefs = c.notifPreferences || {}
          return {
            ...c,
            notifPreferences: {
              ...currentPrefs,
              [memberKey]: preferences,
            },
          }
        }),
      )

      try {
        if (target && !target.id.startsWith('demo-')) {
          await updateCarteiraMemberPreferences(target.id, memberKey, preferences)
        }
      } catch (err) {
        console.warn('Erro ao persistir preferências no PocketBase:', err)
      }
    },
    [carteiras],
  )

  const getMemberNotifPreferences = useCallback(
    (carteiraId: string, memberKey: string): CarteiraNotifPreferences => {
      const target = carteiras.find(
        (c) => c.id === carteiraId || (carteiraId === 'demo' && c.isDemo),
      )
      if (!target || !target.notifPreferences) {
        return DEFAULT_CARTEIRA_NOTIF_PREFS
      }
      return target.notifPreferences[memberKey] || DEFAULT_CARTEIRA_NOTIF_PREFS
    },
    [carteiras],
  )

  // FINANCIAL SUMMARY
  const financialSummary = useMemo(() => {
    return computeFinancialSummary(rachas)
  }, [rachas])

  const value = useMemo(
    () => ({
      rachas,
      isLoading,
      currentNickname,
      setCurrentNickname,
      getRacha,
      fetchRemoteRacha,
      createRacha,
      updateRacha,
      deleteRacha,
      markParticipantPaid,
      markParticipantPending,
      addParticipantToRacha,
      removeParticipantFromRacha,
      updateParticipant,
      saveOrganizerChanges,
      createNextMonthRecurring,
      resetDemoRacha,
      isNicknameModalOpen,
      setIsNicknameModalOpen,
      isWhySolanaModalOpen,
      setIsWhySolanaModalOpen,
      notifications,
      unreadNotificationsCount,
      markNotificationsAsRead,
      clearNotifications,
      addAppNotification,
      syncLocalStorageRachasToUser,
      carteiras,
      primaryCarteira,
      contributeToCarteira,
      proposeCarteiraExpense,
      approveProposal,
      updateCarteiraQuorum,
      updateMemberNotifPreferences,
      getMemberNotifPreferences,
      financialSummary,
    }),
    [
      rachas,
      isLoading,
      currentNickname,
      setCurrentNickname,
      getRacha,
      fetchRemoteRacha,
      createRacha,
      updateRacha,
      deleteRacha,
      markParticipantPaid,
      markParticipantPending,
      addParticipantToRacha,
      removeParticipantFromRacha,
      updateParticipant,
      saveOrganizerChanges,
      createNextMonthRecurring,
      resetDemoRacha,
      isNicknameModalOpen,
      setIsNicknameModalOpen,
      isWhySolanaModalOpen,
      setIsWhySolanaModalOpen,
      notifications,
      unreadNotificationsCount,
      markNotificationsAsRead,
      clearNotifications,
      addAppNotification,
      syncLocalStorageRachasToUser,
      carteiras,
      primaryCarteira,
      contributeToCarteira,
      proposeCarteiraExpense,
      approveProposal,
      updateCarteiraQuorum,
      updateMemberNotifPreferences,
      getMemberNotifPreferences,
      financialSummary,
    ],
  )

  return <RachaContext.Provider value={value}>{children}</RachaContext.Provider>
}

export const useRacha = () => {
  const ctx = useContext(RachaContext)
  if (!ctx) {
    throw new Error('useRacha must be used within a RachaProvider')
  }
  return ctx
}
