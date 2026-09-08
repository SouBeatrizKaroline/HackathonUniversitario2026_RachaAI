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
} from '@/services/rachas'

interface RachaContextType {
  rachas: Racha[]
  isLoading: boolean
  currentNickname: string
  setCurrentNickname: (name: string) => void
  getRacha: (id: string) => Racha | undefined
  fetchRemoteRacha: (idOrCode: string) => Promise<Racha | null>
  createRacha: (data: Omit<Racha, 'id' | 'createdAt' | 'history'>) => Promise<Racha>
  updateRacha: (id: string, updates: Partial<Racha>) => void
  deleteRacha: (id: string) => void
  markParticipantPaid: (rachaId: string, participantId: string, txHash?: string) => Promise<void>
  markParticipantPending: (rachaId: string, participantId: string) => Promise<void>
  addParticipantToRacha: (rachaId: string, name: string, amount?: number) => Promise<void>
  removeParticipantFromRacha: (rachaId: string, participantId: string) => Promise<void>
  resetDemoRacha: () => void
  isNicknameModalOpen: boolean
  setIsNicknameModalOpen: (open: boolean) => void
  isWhySolanaModalOpen: boolean
  setIsWhySolanaModalOpen: (open: boolean) => void
}

const STORAGE_KEY = 'rachaai_rachas'
const USER_KEY = 'rachaai_nickname'

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

  const updateRacha = useCallback((id: string, updates: Partial<Racha>) => {
    setRachas((prev) => prev.map((racha) => (racha.id === id ? { ...racha, ...updates } : racha)))
  }, [])

  const deleteRacha = useCallback((id: string) => {
    setRachas((prev) => prev.filter((racha) => racha.id !== id))
  }, [])

  const markParticipantPaid = useCallback(
    async (rachaId: string, participantId: string, customTxHash?: string) => {
      const hash = customTxHash || generateTxHash()

      // Optimistic update
      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

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

      // Sync backend
      try {
        await recordParticipantPayment(rachaId, participantId, hash)
      } catch (err) {
        console.warn('Erro ao sincronizar pagamento no PocketBase:', err)
      }
    },
    [],
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

  const resetDemoRacha = useCallback(() => {
    setRachas((prev) => {
      const filtered = prev.filter((r) => r.id !== 'demo' && !r.isDemo)
      return [DEMO_RACHA, ...filtered]
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
      resetDemoRacha,
      isNicknameModalOpen,
      setIsNicknameModalOpen,
      isWhySolanaModalOpen,
      setIsWhySolanaModalOpen,
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
      resetDemoRacha,
      isNicknameModalOpen,
      setIsNicknameModalOpen,
      isWhySolanaModalOpen,
      setIsWhySolanaModalOpen,
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
