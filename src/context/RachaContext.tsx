import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { Racha, Participant, RachaHistoryEntry, generateId, generateTxHash } from '@/types/racha'
import { DEMO_RACHA } from '@/data/seed'

interface RachaContextType {
  rachas: Racha[]
  currentNickname: string
  setCurrentNickname: (name: string) => void
  getRacha: (id: string) => Racha | undefined
  createRacha: (data: Omit<Racha, 'id' | 'createdAt' | 'history'>) => Racha
  updateRacha: (id: string, updates: Partial<Racha>) => void
  deleteRacha: (id: string) => void
  markParticipantPaid: (rachaId: string, participantId: string, txHash?: string) => void
  markParticipantPending: (rachaId: string, participantId: string) => void
  addParticipantToRacha: (rachaId: string, name: string, amount?: number) => void
  removeParticipantFromRacha: (rachaId: string, participantId: string) => void
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
  const [rachas, setRachas] = useState<Racha[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure demo racha is present
          const hasDemo = parsed.some((r: Racha) => r.id === 'demo' || r.isDemo)
          if (!hasDemo) {
            return [DEMO_RACHA, ...parsed]
          }
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return [DEMO_RACHA]
  })

  const [currentNickname, setCurrentNicknameState] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_KEY) || ''
    } catch {
      return ''
    }
  })

  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [isWhySolanaModalOpen, setIsWhySolanaModalOpen] = useState(false)

  // Save rachas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rachas))
    } catch (e) {
      console.error('Failed to save rachas to localStorage', e)
    }
  }, [rachas])

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
    (id: string) => {
      if (id === 'demo') {
        return rachas.find((r) => r.id === 'demo' || r.isDemo) || DEMO_RACHA
      }
      return rachas.find((r) => r.id === id)
    },
    [rachas],
  )

  const createRacha = useCallback((data: Omit<Racha, 'id' | 'createdAt' | 'history'>) => {
    const newId = generateId()
    const shareCode = `${data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 16)}-${newId}`

    const newRacha: Racha = {
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
          timestamp: 'Agora',
          status: 'Confirmado',
          txHash: p.txHash || generateTxHash(),
        })),
    }

    setRachas((prev) => [newRacha, ...prev])
    return newRacha
  }, [])

  const updateRacha = useCallback((id: string, updates: Partial<Racha>) => {
    setRachas((prev) => prev.map((racha) => (racha.id === id ? { ...racha, ...updates } : racha)))
  }, [])

  const deleteRacha = useCallback((id: string) => {
    setRachas((prev) => prev.filter((racha) => racha.id !== id))
  }, [])

  const markParticipantPaid = useCallback(
    (rachaId: string, participantId: string, customTxHash?: string) => {
      setRachas((prev) =>
        prev.map((r) => {
          if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

          let targetParticipant: Participant | undefined
          const updatedParticipants = r.participants.map((p) => {
            if (p.id === participantId || p.name.toLowerCase() === participantId.toLowerCase()) {
              const hash = customTxHash || generateTxHash()
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
    },
    [],
  )

  const markParticipantPending = useCallback((rachaId: string, participantId: string) => {
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
  }, [])

  const addParticipantToRacha = useCallback((rachaId: string, name: string, amount?: number) => {
    setRachas((prev) =>
      prev.map((r) => {
        if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r

        const count = r.participants.length + 1
        const newAmount =
          amount !== undefined ? amount : Math.round((r.totalAmount / count) * 100) / 100

        const newP: Participant = {
          id: generateId(),
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
  }, [])

  const removeParticipantFromRacha = useCallback((rachaId: string, participantId: string) => {
    setRachas((prev) =>
      prev.map((r) => {
        if (r.id !== rachaId && !(rachaId === 'demo' && r.isDemo)) return r
        return {
          ...r,
          participants: r.participants.filter((p) => p.id !== participantId),
        }
      }),
    )
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
      currentNickname,
      setCurrentNickname,
      getRacha,
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
      currentNickname,
      setCurrentNickname,
      getRacha,
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
