export type RachaCategory = 'República' | 'Comida' | 'Viagem' | 'Faculdade' | 'Evento' | 'Outro'

export interface Participant {
  id: string
  name: string
  amount: number
  paid: boolean
  paidAt?: string
  txHash?: string
  user?: string
  isVerified?: boolean
}

export interface RachaHistoryEntry {
  id: string
  participantName: string
  amount: number
  timestamp: string
  status: 'Confirmado' | 'Pendente'
  txHash?: string
  user?: string
  isVerified?: boolean
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

export type NotificationType =
  | 'pagamento_racha'
  | 'carteira_proposta_criada'
  | 'carteira_proposta_aprovada'
  | 'carteira_contribuicao'

export interface AppNotification {
  id: string
  type?: NotificationType
  // Racha info (se aplicável)
  rachaId?: string
  rachaName?: string
  participantName?: string
  txHash?: string
  // Carteira info (se aplicável)
  carteiraId?: string
  carteiraName?: string
  proposalId?: string
  title?: string
  description?: string
  actorName?: string
  targetUser?: string
  newBalance?: number
  // Geral
  amount: number
  timestamp: string
  read: boolean
  link?: string
}

// Retrocompatibilidade para componentes que importam PaymentNotification
export type PaymentNotification = AppNotification

export interface InterpretedRachaData {
  name?: string
  category: RachaCategory
  totalAmount: number
  participantCount: number
  perPersonAmount: number
  participants: { name: string; amount: number; paid?: boolean }[]
  notes?: string
}

// -------------------------------------------------------------
// CARTEIRA COMPARTILHADA DA REPÚBLICA (Caixa coletivo / Multisig simulado)
// -------------------------------------------------------------
export interface CarteiraMembro {
  id: string
  carteiraId?: string
  name: string
  role: 'admin' | 'membro'
  totalContributed: number
  user?: string
  isVerified?: boolean
}

export interface CarteiraMovimento {
  id: string
  carteiraId?: string
  type: 'deposito' | 'saida'
  amount: number
  description: string
  authorName: string
  recipient?: string
  timestamp: string
  user?: string
}

export interface CarteiraAprovacao {
  id: string
  propostaId: string
  approverName: string
  approverUser?: string
  timestamp: string
}

export interface CarteiraProposta {
  id: string
  carteiraId?: string
  title: string
  amount: number
  recipient?: string
  proposerName: string
  proposerUser?: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  requiredApprovals: number
  currentApprovals: number
  approvals: CarteiraAprovacao[]
  createdAt: string
}

export interface CarteiraNotifPreferences {
  novaProposta: boolean // Notificar quando nova proposta for criada
  propostaAprovada: boolean // Notificar quando proposta atingir quórum e for aprovada
  contribuicoes: boolean // Notificar quando morador fizer depósito/contribuição
}

export interface CarteiraCompartilhada {
  id: string
  name: string
  description?: string
  balance: number
  threshold: number // N de M aprovações necessárias para saída
  isDemo?: boolean
  groupCode?: string
  owner?: string
  members: CarteiraMembro[]
  movements: CarteiraMovimento[]
  proposals: CarteiraProposta[]
  createdAt: string
  notifPreferences?: Record<string, CarteiraNotifPreferences>
}

// -------------------------------------------------------------
// HISTÓRICO FINANCEIRO AGREGADO DO GRUPO
// -------------------------------------------------------------
export interface FinancialSummaryAggregated {
  totalSplit: number // Soma dos valores de todos os rachas
  totalCollected: number // Soma dos valores pagos
  totalPending: number // Soma pendente a receber
  rachasCount: number // Número total de rachas
  paymentsCount: number // Número total de pagamentos concluídos
  pendingPaymentsCount: number // Número de pagamentos pendentes
  completionRate: number // Porcentagem de arrecadação (0-100)
  byMonth: {
    monthKey: string // YYYY-MM
    label: string // ex.: "Maio 2025"
    total: number
    paid: number
    rachasCount: number
  }[]
  byCategory: {
    category: RachaCategory
    total: number
    count: number
  }[]
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
