import pb from '@/lib/pocketbase/client'
import {
  CarteiraCompartilhada,
  CarteiraMembro,
  CarteiraMovimento,
  CarteiraProposta,
  CarteiraAprovacao,
  generateId,
} from '@/types/racha'

export interface CarteiraRecord {
  id: string
  name: string
  description?: string
  balance: number
  threshold: number
  isDemo?: boolean
  groupCode?: string
  owner?: string
  created: string
  updated: string
}

export interface CarteiraMembroRecord {
  id: string
  carteira: string
  name: string
  role?: 'admin' | 'membro'
  totalContributed?: number
  user?: string
  created: string
  updated: string
}

export interface CarteiraMovimentoRecord {
  id: string
  carteira: string
  type: 'deposito' | 'saida'
  amount: number
  description: string
  authorName: string
  recipient?: string
  user?: string
  created: string
  updated: string
}

export interface CarteiraPropostaRecord {
  id: string
  carteira: string
  title: string
  amount: number
  recipient?: string
  proposerName: string
  proposerUser?: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  requiredApprovals: number
  currentApprovals: number
  created: string
  updated: string
}

export interface CarteiraAprovacaoRecord {
  id: string
  proposta: string
  approverName: string
  approverUser?: string
  created: string
  updated: string
}

// Demo fallback data if backend is offline or empty
export const DEMO_CARTEIRA: CarteiraCompartilhada = {
  id: 'demo-carteira-rep',
  name: 'Caixa Coletivo da República Aloprados',
  description:
    'Fundo de reserva para despesas comuns, manutenções emergenciais e compras coletivas da casa.',
  balance: 620,
  threshold: 2,
  isDemo: true,
  groupCode: 'rep-aloprados-demo',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  members: [
    { id: 'cm-1', name: 'Lucas', role: 'admin', totalContributed: 200, isVerified: false },
    { id: 'cm-2', name: 'Mateus', role: 'membro', totalContributed: 180, isVerified: false },
    { id: 'cm-3', name: 'Rodrigo', role: 'membro', totalContributed: 120, isVerified: false },
    { id: 'cm-4', name: 'Gabriel', role: 'membro', totalContributed: 120, isVerified: false },
  ],
  movements: [
    {
      id: 'cmov-1',
      type: 'deposito',
      amount: 200,
      description: 'Contribuição mensal fundo de reserva',
      authorName: 'Lucas',
      timestamp: 'Há 5 dias',
    },
    {
      id: 'cmov-2',
      type: 'deposito',
      amount: 180,
      description: 'Sobra da compra de mantimentos da semana',
      authorName: 'Mateus',
      timestamp: 'Há 4 dias',
    },
    {
      id: 'cmov-3',
      type: 'deposito',
      amount: 240,
      description: 'Depósito conjunto para fundo emergencial',
      authorName: 'Rodrigo & Gabriel',
      timestamp: 'Há 3 dias',
    },
    {
      id: 'cmov-4',
      type: 'saida',
      amount: 150,
      description: 'Troca de lâmpadas LED e reparo no chuveiro',
      authorName: 'Lucas',
      recipient: 'Materiais de Construção São João',
      timestamp: 'Há 2 dias',
    },
    {
      id: 'cmov-5',
      type: 'deposito',
      amount: 150,
      description: 'Depósito de reposição de caixa',
      authorName: 'Mateus',
      timestamp: 'Ontem',
    },
  ],
  proposals: [
    {
      id: 'cprop-1',
      title: 'Conserto emergencial da fechadura eletrônica',
      amount: 140,
      recipient: 'Chaveiro Central Universitário',
      proposerName: 'Mateus',
      status: 'pendente',
      requiredApprovals: 2,
      currentApprovals: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      approvals: [
        {
          id: 'capr-1',
          propostaId: 'cprop-1',
          approverName: 'Lucas',
          timestamp: 'Há 3 horas',
        },
      ],
    },
  ],
}

// Converter PocketBase records para o modelo CarteiraCompartilhada
export function mapToCarteira(
  cRec: CarteiraRecord,
  membros: CarteiraMembroRecord[] = [],
  movimentos: CarteiraMovimentoRecord[] = [],
  propostas: CarteiraPropostaRecord[] = [],
  aprovacoes: CarteiraAprovacaoRecord[] = [],
): CarteiraCompartilhada {
  const mappedMembers: CarteiraMembro[] = membros.map((m) => ({
    id: m.id,
    carteiraId: cRec.id,
    name: m.name,
    role: m.role || 'membro',
    totalContributed: m.totalContributed || 0,
    user: m.user || undefined,
    isVerified: Boolean(m.user && m.user !== ''),
  }))

  const mappedMovements: CarteiraMovimento[] = movimentos.map((mov) => ({
    id: mov.id,
    carteiraId: cRec.id,
    type: mov.type,
    amount: mov.amount,
    description: mov.description,
    authorName: mov.authorName,
    recipient: mov.recipient || undefined,
    timestamp: new Date(mov.created).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    user: mov.user || undefined,
  }))

  const mappedProposals: CarteiraProposta[] = propostas.map((prop) => {
    const propApprovals: CarteiraAprovacao[] = aprovacoes
      .filter((a) => a.proposta === prop.id)
      .map((a) => ({
        id: a.id,
        propostaId: prop.id,
        approverName: a.approverName,
        approverUser: a.approverUser || undefined,
        timestamp: new Date(a.created).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))

    return {
      id: prop.id,
      carteiraId: cRec.id,
      title: prop.title,
      amount: prop.amount,
      recipient: prop.recipient || undefined,
      proposerName: prop.proposerName,
      proposerUser: prop.proposerUser || undefined,
      status: prop.status,
      requiredApprovals: prop.requiredApprovals,
      currentApprovals: Math.max(prop.currentApprovals, propApprovals.length),
      approvals: propApprovals,
      createdAt: prop.created,
    }
  })

  return {
    id: cRec.id,
    name: cRec.name,
    description: cRec.description || '',
    balance: cRec.balance,
    threshold: cRec.threshold,
    isDemo: Boolean(cRec.isDemo),
    groupCode: cRec.groupCode,
    owner: cRec.owner,
    createdAt: cRec.created,
    members: mappedMembers,
    movements: mappedMovements,
    proposals: mappedProposals,
  }
}

// Fetch all carteiras
export async function fetchAllCarteiras(): Promise<CarteiraCompartilhada[]> {
  try {
    const carteiraRecs = await pb.collection('carteiras').getFullList<CarteiraRecord>({
      sort: '-created',
    })

    if (!carteiraRecs || carteiraRecs.length === 0) {
      return [DEMO_CARTEIRA]
    }

    const [allMembros, allMovs, allProps, allAprs] = await Promise.all([
      pb.collection('carteira_membros').getFullList<CarteiraMembroRecord>(),
      pb
        .collection('carteira_movimentos')
        .getFullList<CarteiraMovimentoRecord>({ sort: '-created' }),
      pb.collection('carteira_propostas').getFullList<CarteiraPropostaRecord>({ sort: '-created' }),
      pb
        .collection('carteira_aprovacoes')
        .getFullList<CarteiraAprovacaoRecord>({ sort: '-created' }),
    ])

    return carteiraRecs.map((c) => {
      const membros = allMembros.filter((m) => m.carteira === c.id)
      const movs = allMovs.filter((m) => m.carteira === c.id)
      const props = allProps.filter((p) => p.carteira === c.id)
      return mapToCarteira(c, membros, movs, props, allAprs)
    })
  } catch (err) {
    console.warn('Falha ao buscar carteiras do PocketBase, usando fallback demo:', err)
    return [DEMO_CARTEIRA]
  }
}

// Add contribution to collective wallet
export async function addCarteiraContribution(
  carteiraId: string,
  amount: number,
  authorName: string,
  description: string,
  userId?: string,
): Promise<{ updatedBalance: number; newMovementId: string }> {
  try {
    const carteira = await pb.collection('carteiras').getOne<CarteiraRecord>(carteiraId)
    const newBalance = carteira.balance + amount

    // 1. Create movement
    const movData: any = {
      carteira: carteiraId,
      type: 'deposito',
      amount,
      description: description.trim() || 'Depósito voluntário no caixa',
      authorName: authorName.trim(),
    }
    if (userId) movData.user = userId
    const createdMov = await pb
      .collection('carteira_movimentos')
      .create<CarteiraMovimentoRecord>(movData)

    // 2. Update wallet balance
    await pb.collection('carteiras').update(carteiraId, { balance: newBalance })

    // 3. Update or create member contribution record
    try {
      const existingMember = await pb
        .collection('carteira_membros')
        .getFirstListItem<CarteiraMembroRecord>(
          `carteira = "${carteiraId}" && name = "${authorName.trim()}"`,
        )
      const updatedTotal = (existingMember.totalContributed || 0) + amount
      await pb.collection('carteira_membros').update(existingMember.id, {
        totalContributed: updatedTotal,
        user: userId || existingMember.user,
      })
    } catch {
      // Member not found by name, create member record
      await pb.collection('carteira_membros').create({
        carteira: carteiraId,
        name: authorName.trim(),
        role: 'membro',
        totalContributed: amount,
        user: userId || undefined,
      })
    }

    return { updatedBalance: newBalance, newMovementId: createdMov.id }
  } catch (err) {
    console.error('Erro ao adicionar contribuição:', err)
    throw err
  }
}

// Create a new expense proposal (Multisig simulator)
export async function createCarteiraProposal(
  carteiraId: string,
  title: string,
  amount: number,
  proposerName: string,
  recipient?: string,
  userId?: string,
): Promise<CarteiraPropostaRecord> {
  const carteira = await pb.collection('carteiras').getOne<CarteiraRecord>(carteiraId)

  const propData: any = {
    carteira: carteiraId,
    title: title.trim(),
    amount,
    recipient: recipient?.trim() || '',
    proposerName: proposerName.trim(),
    status: 'pendente',
    requiredApprovals: carteira.threshold || 2,
    currentApprovals: 0,
  }
  if (userId) propData.proposerUser = userId

  return await pb.collection('carteira_propostas').create<CarteiraPropostaRecord>(propData)
}

// Approve a proposal
export async function approveCarteiraProposal(
  proposalId: string,
  approverName: string,
  approverUserId?: string,
): Promise<{ proposal: CarteiraPropostaRecord; executed: boolean; newBalance?: number }> {
  const proposal = await pb
    .collection('carteira_propostas')
    .getOne<CarteiraPropostaRecord>(proposalId)

  if (proposal.status !== 'pendente') {
    throw new Error('Esta proposta já foi concluída ou rejeitada.')
  }

  // Check if approver is the same as proposer
  if (
    approverName.trim().toLowerCase() === proposal.proposerName.trim().toLowerCase() ||
    (approverUserId && proposal.proposerUser && approverUserId === proposal.proposerUser)
  ) {
    throw new Error('O proponente da saída não pode aprovar a própria proposta.')
  }

  // Check if approver has already voted
  const existingVotes = await pb
    .collection('carteira_aprovacoes')
    .getFullList<CarteiraAprovacaoRecord>({
      filter: `proposta = "${proposalId}"`,
    })

  const hasAlreadyVoted = existingVotes.some(
    (v) =>
      v.approverName.trim().toLowerCase() === approverName.trim().toLowerCase() ||
      (approverUserId && v.approverUser && v.approverUser === approverUserId),
  )

  if (hasAlreadyVoted) {
    throw new Error('Você já registrou aprovação para esta proposta.')
  }

  // Register approval
  const aprData: any = {
    proposta: proposalId,
    approverName: approverName.trim(),
  }
  if (approverUserId) aprData.approverUser = approverUserId
  await pb.collection('carteira_aprovacoes').create(aprData)

  const newApprovalsCount = existingVotes.length + 1
  let isApproved = newApprovalsCount >= proposal.requiredApprovals
  let updatedBalance: number | undefined

  if (isApproved) {
    // Execute proposal: debit wallet balance and create movement
    const carteira = await pb.collection('carteiras').getOne<CarteiraRecord>(proposal.carteira)

    if (carteira.balance < proposal.amount) {
      throw new Error(
        `Saldo insuficiente no caixa (Saldo: R$ ${carteira.balance.toFixed(2)}, Necessário: R$ ${proposal.amount.toFixed(2)}).`,
      )
    }

    updatedBalance = carteira.balance - proposal.amount
    await pb.collection('carteiras').update(carteira.id, { balance: updatedBalance })

    // Create movement
    const movData: any = {
      carteira: carteira.id,
      type: 'saida',
      amount: proposal.amount,
      description: `[Aprovado em grupo] ${proposal.title}`,
      authorName: proposal.proposerName,
      recipient: proposal.recipient || 'Despesa coletiva',
    }
    if (proposal.proposerUser) movData.user = proposal.proposerUser
    await pb.collection('carteira_movimentos').create(movData)

    // Update proposal status
    const updatedProp = await pb
      .collection('carteira_propostas')
      .update<CarteiraPropostaRecord>(proposalId, {
        status: 'aprovada',
        currentApprovals: newApprovalsCount,
      })

    return { proposal: updatedProp, executed: true, newBalance: updatedBalance }
  } else {
    // Just increment approval count
    const updatedProp = await pb
      .collection('carteira_propostas')
      .update<CarteiraPropostaRecord>(proposalId, {
        currentApprovals: newApprovalsCount,
      })

    return { proposal: updatedProp, executed: false }
  }
}
