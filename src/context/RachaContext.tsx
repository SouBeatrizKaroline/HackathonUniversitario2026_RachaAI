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
  PagamentoRecord,
} from '@/services/rachas'
import { PaymentNotification } from '@/types/racha'
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
  markParticipantPaid: (rachaId: string, participantId: string, txHash?: string) => Promise<void>
  markParticipantPending: (rachaId: string, participantId: string) => Promise<void>
  addParticipantToRacha: (rachaId: string, name: string, amount?: number) => Promise<void>
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
  notifications: PaymentNotification[]
  unreadNotificationsCount: number
  markNotificationsAsRead: () => void
  clearNotifications: () => void
}

const STORAGE_KEY = 'rachaai_rachas'
const USER_KEY = 'rachaai_nickname'
const NOTIFS_KEY = 'rachaai_notifications'

const RachaContext = createContext<RachaContextType | undefined>(undefined)

export const RachaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rachas, setRachas] = useState<Racha[]>([DEMO_RACHA])
  const [isLoading, setIsLoading] = useState(true)

  const [currentNickname, setCurrentNicknameState] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_KEY) || ''
    } catch {
      return ''
    }
  })

  const [notifications, setNotifications] = useState<PaymentNotification[]>(() => {
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
        rachaId: 'demo',
        rachaName: 'Viagem para Congresso Universitário',
        participantName: 'Ana Clara',
        amount: 80,
        timestamp: 'Há 10 minutos',
        read: false,
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

    loadInitial()
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

  // Realtime subscription for incoming payments to notify the creator
  useEffect(() => {
    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    pb.collection('pagamentos')
      .subscribe<PagamentoRecord>('*', (e) => {
        if (e.action === 'create' && e.record) {
          const rec = e.record
          // Find which racha this belongs to
          setRachas((currentRachas) => {
            const targetRacha = currentRachas.find((r) => r.id === rec.racha)
            const rachaName = targetRacha?.name || 'Racha'

            // Add notification
            setNotifications((prev) => {
              // Avoid duplicate by txHash or id
              if (prev.some((n) => n.id === rec.id || (rec.txHash && n.txHash === rec.txHash))) {
                return prev
              }
              return [
                {
                  id: rec.id,
                  rachaId: rec.racha,
                  rachaName,
                  participantName: rec.participantName,
                  amount: rec.amount,
                  timestamp: rec.timestamp || 'Agora há pouco',
                  txHash: rec.txHash,
                  read: false,
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
          unsubscribeFn = fn
        }
      })
      .catch(() => {
        /* subscription fallback */
      })

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [])

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
    async (rachaId: string, participantId: string, customTxHash?: string) => {
      const hash = customTxHash || generateTxHash()
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
        await recordParticipantPayment(rachaId, participantId, hash)
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
    async (rachaId: string, name: string, amount?: number) => {
      const targetRacha = rachas.find((r) => r.id === rachaId || (rachaId === 'demo' && r.isDemo))
      const count = (targetRacha?.participants.length || 0) + 1
      const newAmount =
        amount !== undefined
          ? amount
          : targetRacha
            ? Math.round((targetRacha.totalAmount / count) * 100) / 100
            : 0

      const tempId = generateId()

      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

          const newP: Participant = {
            id: tempId,
            name,
            amount: newAmount,
            paid: false,
          }

          return {
            ...r,
            participants: [...r.participants, newP],
          }
        }),
      )

      try {
        const record = await addParticipantRecord(targetRacha?.id || rachaId, name, newAmount)
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
