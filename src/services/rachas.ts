import pb from '@/lib/pocketbase/client'
import { Racha, Participant, RachaHistoryEntry, generateId, generateTxHash } from '@/types/racha'
import { DEMO_RACHA } from '@/data/seed'

export interface RachaRecord {
  id: string
  name: string
  category: Racha['category']
  totalAmount: number
  splitType?: 'equal' | 'custom'
  shareCode?: string
  description?: string
  isDemo?: boolean
  solanaRecipient?: string
  creatorNickname?: string
  isRecurring?: boolean
  recurringGroupId?: string
  recurringGroupName?: string
  referenceMonth?: string
  owner?: string
  created: string
  updated: string
}

export interface ParticipantRecord {
  id: string
  racha: string
  name: string
  amount: number
  paid: boolean
  paidAt?: string
  txHash?: string
  user?: string
  created: string
  updated: string
}

export interface PagamentoRecord {
  id: string
  racha: string
  participantName: string
  amount: number
  status: 'Confirmado' | 'Pendente'
  txHash?: string
  timestamp: string
  user?: string
  created: string
  updated: string
}

// Convert PocketBase records to the frontend Racha model
export function mapToRacha(
  rachaRec: RachaRecord,
  participants: ParticipantRecord[] = [],
  pagamentos: PagamentoRecord[] = [],
): Racha {
  return {
    id: rachaRec.id,
    name: rachaRec.name,
    category: rachaRec.category,
    totalAmount: rachaRec.totalAmount,
    splitType: rachaRec.splitType || 'equal',
    shareCode: rachaRec.shareCode,
    description: rachaRec.description,
    isDemo: Boolean(rachaRec.isDemo),
    creatorNickname: rachaRec.creatorNickname,
    isRecurring: Boolean(rachaRec.isRecurring),
    recurringGroupId: rachaRec.recurringGroupId,
    recurringGroupName: rachaRec.recurringGroupName,
    referenceMonth: rachaRec.referenceMonth,
    owner: rachaRec.owner,
    createdAt: rachaRec.created,
    participants: participants.map((p) => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      paid: Boolean(p.paid),
      paidAt: p.paidAt,
      txHash: p.txHash,
      user: p.user || undefined,
      isVerified: Boolean(p.user && p.user !== ''),
    })),
    history: pagamentos.map((h) => ({
      id: h.id,
      participantName: h.participantName,
      amount: h.amount,
      timestamp: h.timestamp || 'Agora há pouco',
      status: h.status || 'Confirmado',
      txHash: h.txHash,
      user: h.user || undefined,
      isVerified: Boolean(h.user && h.user !== ''),
    })),
  }
}

// Fetch all rachas with their participants and payment history
export async function fetchAllRachas(): Promise<Racha[]> {
  try {
    const rachasRecs = await pb.collection('rachas').getFullList<RachaRecord>({
      sort: '-created',
    })

    if (!rachasRecs || rachasRecs.length === 0) {
      return [DEMO_RACHA]
    }

    // Load participants and history for all rachas
    const [allParticipants, allPagamentos] = await Promise.all([
      pb.collection('participantes').getFullList<ParticipantRecord>(),
      pb.collection('pagamentos').getFullList<PagamentoRecord>({ sort: '-created' }),
    ])

    return rachasRecs.map((r) => {
      const parts = allParticipants.filter((p) => p.racha === r.id)
      const pags = allPagamentos.filter((h) => h.racha === r.id)
      return mapToRacha(r, parts, pags)
    })
  } catch (err) {
    console.warn('Falha ao carregar do PocketBase, usando fallback local:', err)
    return [DEMO_RACHA]
  }
}

// Fetch a single racha by ID or shareCode
export async function fetchRachaByIdOrCode(idOrCode: string): Promise<Racha | null> {
  if (idOrCode === 'demo') {
    return DEMO_RACHA
  }

  try {
    let rachaRec: RachaRecord | null = null

    // Try finding by ID first
    try {
      rachaRec = await pb.collection('rachas').getOne<RachaRecord>(idOrCode)
    } catch (_) {
      // If not found by ID, try finding by shareCode
      try {
        rachaRec = await pb
          .collection('rachas')
          .getFirstListItem<RachaRecord>(`shareCode = "${idOrCode}"`)
      } catch {
        /* intentionally ignored */
      }
    }

    if (!rachaRec) return null

    const [participants, pagamentos] = await Promise.all([
      pb.collection('participantes').getFullList<ParticipantRecord>({
        filter: `racha = "${rachaRec.id}"`,
      }),
      pb.collection('pagamentos').getFullList<PagamentoRecord>({
        filter: `racha = "${rachaRec.id}"`,
        sort: '-created',
      }),
    ])

    return mapToRacha(rachaRec, participants, pagamentos)
  } catch (err) {
    console.error('Erro ao buscar racha:', err)
    return null
  }
}

// Create a new racha in PocketBase
export async function createRachaRecord(
  data: Omit<Racha, 'id' | 'createdAt' | 'history'>,
): Promise<Racha> {
  const shareCode = `${data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 16)}-${generateId()}`

  const rachaRec = await pb.collection('rachas').create<RachaRecord>({
    name: data.name,
    category: data.category,
    totalAmount: data.totalAmount,
    splitType: data.splitType || 'equal',
    shareCode,
    description: data.description || '',
    isDemo: false,
    creatorNickname: data.creatorNickname || '',
    isRecurring: Boolean(data.isRecurring),
    recurringGroupId: data.recurringGroupId || '',
    recurringGroupName: data.recurringGroupName || '',
    referenceMonth: data.referenceMonth || '',
    owner: data.owner || (pb.authStore.record?.id ? pb.authStore.record.id : ''),
  })

  // Create participants records
  const createdParticipants: ParticipantRecord[] = []
  for (const p of data.participants) {
    const partData: any = {
      racha: rachaRec.id,
      name: p.name,
      amount: p.amount,
      paid: Boolean(p.paid),
      paidAt: p.paidAt || (p.paid ? 'Agora' : ''),
      txHash: p.txHash || (p.paid ? generateTxHash() : ''),
    }
    if (p.user) {
      partData.user = p.user
    }
    const partRec = await pb.collection('participantes').create<ParticipantRecord>(partData)
    createdParticipants.push(partRec)
  }

  // Create payments for those already paid
  const createdPagamentos: PagamentoRecord[] = []
  for (const p of createdParticipants) {
    if (p.paid) {
      const pagData: any = {
        racha: rachaRec.id,
        participantName: p.name,
        amount: p.amount,
        status: 'Confirmado',
        txHash: p.txHash || generateTxHash(),
        timestamp: 'Agora há pouco',
      }
      if (p.user) {
        pagData.user = p.user
      }
      const pagRec = await pb.collection('pagamentos').create<PagamentoRecord>(pagData)
      createdPagamentos.push(pagRec)
    }
  }

  return mapToRacha(rachaRec, createdParticipants, createdPagamentos)
}

// Mark participant as paid
export async function recordParticipantPayment(
  rachaId: string,
  participantId: string,
  customTxHash?: string,
  userId?: string,
): Promise<void> {
  const hash = customTxHash || generateTxHash()
  const now = 'Agora há pouco'

  // Update participant
  const part = await pb.collection('participantes').getOne<ParticipantRecord>(participantId)
  const partUpdates: any = {
    paid: true,
    paidAt: now,
    txHash: hash,
  }
  if (userId) {
    partUpdates.user = userId
  }

  await pb.collection('participantes').update(participantId, partUpdates)

  // Insert payment history
  const pagData: any = {
    racha: rachaId,
    participantName: part.name,
    amount: part.amount,
    status: 'Confirmado',
    txHash: hash,
    timestamp: now,
  }
  if (userId || part.user) {
    pagData.user = userId || part.user
  }

  await pb.collection('pagamentos').create(pagData)
}

// Mark participant pending
export async function recordParticipantPending(
  rachaId: string,
  participantId: string,
): Promise<void> {
  const part = await pb.collection('participantes').getOne<ParticipantRecord>(participantId)
  await pb.collection('participantes').update(participantId, {
    paid: false,
    paidAt: '',
    txHash: '',
  })

  // Remove confirmed payment history entries for this participant
  try {
    const pags = await pb.collection('pagamentos').getFullList<PagamentoRecord>({
      filter: `racha = "${rachaId}" && participantName = "${part.name}"`,
    })
    for (const p of pags) {
      await pb.collection('pagamentos').delete(p.id)
    }
  } catch {
    /* intentionally ignored */
  }
}

// Add a participant to an existing racha
export async function addParticipantRecord(
  rachaId: string,
  name: string,
  amount: number,
  userId?: string,
): Promise<ParticipantRecord> {
  const data: any = {
    racha: rachaId,
    name,
    amount,
    paid: false,
  }
  if (userId) {
    data.user = userId
  }
  return await pb.collection('participantes').create<ParticipantRecord>(data)
}

// Remove participant
export async function removeParticipantRecord(participantId: string): Promise<void> {
  await pb.collection('participantes').delete(participantId)
}

// Update participant amount or name
export async function updateParticipantRecord(
  participantId: string,
  data: Partial<Pick<ParticipantRecord, 'name' | 'amount' | 'paid'>>,
): Promise<void> {
  await pb.collection('participantes').update(participantId, data)
}

// Update racha metadata (name, totalAmount, splitType, description, etc.)
export async function updateRachaRecord(
  rachaId: string,
  updates: Partial<RachaRecord>,
): Promise<RachaRecord> {
  return await pb.collection('rachas').update<RachaRecord>(rachaId, updates)
}

// Associate existing unowned rachas to a newly logged-in user
export async function claimRachasForUser(
  userId: string,
  nicknameOrIds: { nickname?: string; rachaIds?: string[] },
): Promise<number> {
  let count = 0
  const { nickname, rachaIds = [] } = nicknameOrIds

  try {
    for (const rachaId of rachaIds) {
      if (rachaId === 'demo' || rachaId === 'demo-republica-1') continue
      try {
        const existing = await pb.collection('rachas').getOne<RachaRecord>(rachaId)
        if (!existing.owner || existing.owner === '') {
          await pb.collection('rachas').update(rachaId, { owner: userId })
          count++
        }
      } catch {
        /* intentionally ignored */
      }
    }

    if (nickname && nickname.trim()) {
      try {
        const matching = await pb.collection('rachas').getFullList<RachaRecord>({
          filter: `creatorNickname = "${nickname.trim()}" && (owner = null || owner = "")`,
        })
        for (const item of matching) {
          if (item.isDemo) continue
          await pb.collection('rachas').update(item.id, { owner: userId })
          count++
        }
      } catch {
        /* intentionally ignored */
      }
    }
  } catch (err) {
    console.warn('Erro ao associar rachas ao usuário:', err)
  }

  return count
}
