export type RachaCategory = 'República' | 'Comida' | 'Viagem' | 'Faculdade' | 'Evento' | 'Outro'

export interface Participant {
  id: string
  name: string
  amount: number
  paid: boolean
  paidAt?: string
  txHash?: string
}

export interface RachaHistoryEntry {
  id: string
  participantName: string
  amount: number
  timestamp: string
  status: 'Confirmado' | 'Pendente'
  txHash?: string
}

export interface Racha {
  id: string
  name: string
  category: RachaCategory
  totalAmount: number
  splitType: 'equal' | 'custom'
  participants: Participant[]
  history: RachaHistoryEntry[]
  createdAt: string
  isDemo?: boolean
  description?: string
  shareCode?: string
  creatorNickname?: string
  isRecurring?: boolean
  recurringGroupId?: string
  recurringGroupName?: string
  referenceMonth?: string
  owner?: string
}

export interface PaymentNotification {
  id: string
  rachaId: string
  rachaName: string
  participantName: string
  amount: number
  timestamp: string
  txHash?: string
  read: boolean
}

export interface InterpretedRachaData {
  name?: string
  category: RachaCategory
  totalAmount: number
  participantCount: number
  perPersonAmount: number
  participants: { name: string; amount: number; paid?: boolean }[]
  notes?: string
}

export const CATEGORIES: { label: RachaCategory; icon: string; emoji: string }[] = [
  { label: 'República', icon: 'home', emoji: '🏠' },
  { label: 'Comida', icon: 'utensils', emoji: '🍕' },
  { label: 'Viagem', icon: 'plane', emoji: '✈️' },
  { label: 'Faculdade', icon: 'graduation-cap', emoji: '🎓' },
  { label: 'Evento', icon: 'party-popper', emoji: '🎉' },
  { label: 'Outro', icon: 'plus', emoji: '➕' },
]

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[^\d]/g, '')
  if (!clean) return 0
  return Number(clean) / 100
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function generateTxHash(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let res = ''
  for (let i = 0; i < 44; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${res.substring(0, 4)}...${res.substring(res.length - 4)}`
}
