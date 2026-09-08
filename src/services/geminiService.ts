import pb from '@/lib/pocketbase/client'
import { InterpretedRachaData, Racha } from '@/types/racha'
import { parseNaturalLanguageRacha as localParser } from '@/lib/geminiParser'

export interface GeminiParseResult {
  data: InterpretedRachaData
  assistantMessage: string
  followUpType?: 'added_person' | 'updated_split' | 'marked_paid' | 'general'
  source: 'gemini_api' | 'gemini_gateway' | 'client_fallback'
}

export interface GeminiAskResult {
  text: string
  action?: {
    type: 'add_people'
    count: number
    newPerPerson: number
  }
  source: 'gemini_api' | 'gemini_gateway' | 'client_fallback'
}

export interface MonthlySummaryData {
  rachaName: string
  referenceMonth: string
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  totalCount: number
  paidCount: number
  pendingCount: number
  topPending: { name: string; amount: number; monthsLate?: number }[]
  geminiText: string
  source: 'gemini_api' | 'gemini_gateway' | 'client_fallback'
}

export interface CarteiraSummaryResult {
  text: string
  highlight?: string
  metrics?: {
    balance: number
    totalDeposits: number
    totalWithdrawals: number
    pendingCount: number
  }
  source: 'gemini_api' | 'gemini_gateway' | 'client_fallback'
}

/**
 * Gera resumo mensal da república com Gemini (total pago, pendente e quem mais atrasa)
 * com fallback local heurístico garantido (nunca quebra).
 */
export async function generateRepublicMonthlySummary(
  racha: Racha,
  allGroupRachas: Racha[] = [],
): Promise<MonthlySummaryData> {
  const total = racha.totalAmount
  const paidParticipants = racha.participants.filter((p) => p.paid)
  const pendingParticipants = racha.participants.filter((p) => !p.paid)
  const paidAmount = paidParticipants.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingAmount = Math.max(0, total - paidAmount)
  const referenceMonth =
    racha.referenceMonth ||
    new Date(racha.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Cross-reference across recurring group months if available to compute who is consistently late
  const monthsLateMap = new Map<string, number>()
  if (allGroupRachas.length > 0) {
    for (const gRacha of allGroupRachas) {
      for (const p of gRacha.participants) {
        if (!p.paid) {
          const norm = p.name.trim().toLowerCase()
          monthsLateMap.set(norm, (monthsLateMap.get(norm) || 0) + 1)
        }
      }
    }
  }

  const topPending = pendingParticipants
    .map((p) => ({
      name: p.name,
      amount: p.amount,
      monthsLate: monthsLateMap.get(p.name.trim().toLowerCase()) || 1,
    }))
    .sort((a, b) => {
      // First by number of unpaid months, then by pending amount
      if ((b.monthsLate || 0) !== (a.monthsLate || 0)) {
        return (b.monthsLate || 0) - (a.monthsLate || 0)
      }
      return b.amount - a.amount
    })

  const formatBrl = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const prompt = `Gere o resumo mensal da república "${racha.recurringGroupName || racha.name}" referente ao mês de ${referenceMonth}.
Dados consolidados:
- Total do mês: ${formatBrl(total)}
- Total já arrecadado: ${formatBrl(paidAmount)} (${paidParticipants.length} moradores pagaram)
- Total pendente: ${formatBrl(pendingAmount)} (${pendingParticipants.length} moradores pendentes)
- Moradores pendentes e histórico de atrasos: ${
    topPending.length > 0
      ? topPending
          .map((p) => `${p.name} (R$ ${p.amount}, ${p.monthsLate || 1} mês(es) em aberto)`)
          .join(', ')
      : 'Nenhum pendente! Todos em dia.'
  }

Por favor redija um texto simpático, descontraído (linguagem de república/estudantil pt-BR), destacando o total pago, o que falta arrecadar e quem ainda precisa acertar a parte (com toque amigável de cobrança de república). Nunca faça pagamentos.`

  let geminiText = ''
  let source: MonthlySummaryData['source'] = 'client_fallback'

  try {
    const askResult = await askGeminiAboutRacha(prompt, racha)
    if (askResult && askResult.text) {
      geminiText = askResult.text
      source = askResult.source
    }
  } catch (err) {
    console.warn('Erro ao chamar askGeminiAboutRacha para resumo mensal:', err)
  }

  // Fallback text if Gemini returned empty or failed
  if (!geminiText) {
    if (pendingParticipants.length === 0) {
      geminiText = `🏠 Resumo da República — ${referenceMonth}\n\n🎉 Sensacional! Todos os ${racha.participants.length} moradores pagaram em dia!\n\n• Total Arrecadado: ${formatBrl(paidAmount)} de ${formatBrl(total)} (100%)\n• Pendências: R$ 0,00\n• Destaque: República exemplar, ninguém em atraso! 🏆`
    } else {
      const topLateNames = topPending
        .map(
          (p) =>
            `${p.name} (${formatBrl(p.amount)}${p.monthsLate && p.monthsLate > 1 ? ` • ${p.monthsLate} meses pendentes` : ''})`,
        )
        .join(', ')

      geminiText = `🏠 Resumo da República — ${referenceMonth}\n\nFechamento do mês da casa:\n\n• Total Pago: ${formatBrl(paidAmount)} de ${formatBrl(total)} (${paidParticipants.length}/${racha.participants.length} moradores)\n• Total Pendente: ${formatBrl(pendingAmount)}\n• Quem ainda não pagou: ${topLateNames}\n\n⚠️ Bora lembrar a galera pra quitar o aluguel e as contas antes do vencimento!`
    }
  }

  return {
    rachaName: racha.recurringGroupName || racha.name,
    referenceMonth,
    totalAmount: total,
    paidAmount,
    pendingAmount,
    totalCount: racha.participants.length,
    paidCount: paidParticipants.length,
    pendingCount: pendingParticipants.length,
    topPending,
    geminiText,
    source,
  }
}

/**
 * Interprets natural language racha commands.
 * Checks server endpoint with Gemini/Skip AI Gateway.
 * If unavailable or returns fallback, smoothly uses local regex/heuristic parser.
 */
export async function parseRachaWithGemini(
  text: string,
  prevState?: InterpretedRachaData,
): Promise<GeminiParseResult> {
  try {
    const res = await pb.send<any>('/backend/v1/gemini/parse', {
      method: 'POST',
      body: JSON.stringify({ text, prevState }),
    })

    if (res && !res.useClientFallback && res.data && res.assistantMessage) {
      return {
        data: res.data,
        assistantMessage: res.assistantMessage,
        followUpType: res.followUpType || 'general',
        source: res.source || 'gemini_api',
      }
    }
  } catch (err) {
    console.warn('API Gemini server-side indisponível, usando interpretador simulado local:', err)
  }

  // Local fallback (deterministic, fast, zero errors)
  const localRes = localParser(text, prevState)
  return {
    ...localRes,
    source: 'client_fallback',
  }
}

/**
 * Handles contextual questions in the "Perguntar ao Gemini" panel.
 * Always respects the rule: NEVER executes financial transactions.
 */
export async function askGeminiAboutRacha(query: string, racha: Racha): Promise<GeminiAskResult> {
  try {
    const total = racha.totalAmount
    const paidParticipants = racha.participants.filter((p) => p.paid)
    const pendingParticipants = racha.participants.filter((p) => !p.paid)
    const paidAmount = paidParticipants.reduce((acc, curr) => acc + curr.amount, 0)
    const pendingAmount = Math.max(0, total - paidAmount)

    const rachaContext = {
      name: racha.name,
      totalAmount: total,
      paidAmount,
      pendingAmount,
      participantCount: racha.participants.length,
      paidCount: paidParticipants.length,
      pendingCount: pendingParticipants.length,
      paidNames: paidParticipants.map((p) => p.name),
      pendingNames: pendingParticipants.map((p) => p.name),
    }

    const res = await pb.send<any>('/backend/v1/gemini/ask', {
      method: 'POST',
      body: JSON.stringify({ query, rachaContext }),
    })

    if (res && !res.useClientFallback && res.text) {
      return {
        text: res.text,
        action: res.action,
        source: res.source || 'gemini_api',
      }
    }
  } catch (err) {
    console.warn('Gemini ask server-side indisponível, usando respostas contextuais locais:', err)
  }

  // Fallback simulator for questions
  const lower = query.toLowerCase()
  const total = racha.totalAmount
  const paidParticipants = racha.participants.filter((p) => p.paid)
  const pendingParticipants = racha.participants.filter((p) => !p.paid)
  const paidAmount = paidParticipants.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingAmount = Math.max(0, total - paidAmount)

  let botResponse = ''
  let actionObj: GeminiAskResult['action'] = undefined

  const formatBrl = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (
    lower.includes('quem ainda não pagou') ||
    lower.includes('pendente') ||
    lower.includes('quem falta')
  ) {
    if (pendingParticipants.length === 0) {
      botResponse = 'Boas notícias! 🎉 Todos os participantes já pagaram suas partes.'
    } else {
      const names = pendingParticipants.map((p) => p.name).join(', ')
      botResponse = `Ainda faltam pagar (${pendingParticipants.length} pessoas): ${names}.`
    }
  } else if (lower.includes('quanto falta') || lower.includes('falta')) {
    botResponse = `Faltam ${formatBrl(pendingAmount)} para completar a meta de ${formatBrl(total)}.`
  } else if (
    lower.includes('duas pessoas') ||
    lower.includes('mais 2') ||
    lower.includes('adicionarmos')
  ) {
    const newCount = racha.participants.length + 2
    const newSplit = Math.round((total / newCount) * 100) / 100
    botResponse = `Com ${newCount} pessoas (adicionando mais 2), cada uma pagaria ${formatBrl(newSplit)}. Como o Gemini não altera valores sozinho, confirme para aplicar.`
    actionObj = {
      type: 'add_people',
      count: newCount,
      newPerPerson: newSplit,
    }
  } else if (
    lower.includes('resumo mensal') ||
    lower.includes('resumo da república') ||
    lower.includes('mais atrasa') ||
    lower.includes('fechamento do mês')
  ) {
    const pendentesCount = pendingParticipants.length
    const pagosCount = paidParticipants.length
    const month = racha.referenceMonth || 'deste mês'

    if (pendentesCount === 0) {
      botResponse = `Resumo da República (${month}):\n\n🎉 100% quitado! O total arrecadado foi ${formatBrl(paidAmount)} de ${formatBrl(total)}.\n\nTodos os ${racha.participants.length} moradores pagaram em dia. Ninguém em atraso neste mês! 🏆`
    } else {
      // Find top pending debtors
      const sortedPending = [...pendingParticipants].sort((a, b) => b.amount - a.amount)
      const topPendentes = sortedPending.map((p) => `${p.name} (${formatBrl(p.amount)})`).join(', ')

      botResponse = `Resumo da República (${month}):\n\n• Total Pago: ${formatBrl(paidAmount)} (${pagosCount}/${racha.participants.length} moradores)\n• Total Pendente: ${formatBrl(pendingAmount)} (${pendentesCount} em aberto)\n• Quem mais atrasa / pendências: ${topPendentes}.\n\nLembrete amigável gerado pelo Gemini: envie o aviso para o grupo fechar as contas da casa!`
    }
  } else if (lower.includes('resumo') || lower.includes('geral') || lower.includes('status')) {
    botResponse = `${paidParticipants.length} de ${racha.participants.length} participantes já pagaram. Foram arrecadados ${formatBrl(paidAmount)} dos ${formatBrl(total)}. Faltam ${formatBrl(pendingAmount)}.`
  } else {
    botResponse = `Entendido! O racha "${racha.name}" tem ${racha.participants.length} participantes com meta de ${formatBrl(total)}. Total arrecadado: ${formatBrl(paidAmount)}.`
  }

  return {
    text: botResponse,
    action: actionObj,
    source: 'client_fallback',
  }
}

/**
 * Gera resumo financeiro ou responde dúvidas sobre o caixa compartilhado (Carteira).
 * Chama o backend com Gemini real ou Skip AI Gateway.
 * Se indisponível, gera resposta automática local determinística e transparente.
 * Regra: NUNCA executa transações nem altera saldo.
 */
export async function askGeminiAboutCarteira(
  query: string,
  carteira: {
    name: string
    description?: string
    balance: number
    threshold: number
    members: { name: string; role?: string; totalContributed: number }[]
    movements: {
      type: 'deposito' | 'saida'
      amount: number
      description: string
      authorName: string
    }[]
    proposals: {
      title: string
      amount: number
      proposerName: string
      status: string
      requiredApprovals: number
      currentApprovals: number
    }[]
  },
): Promise<CarteiraSummaryResult> {
  const formatBrl = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const deposits = carteira.movements.filter((m) => m.type === 'deposito')
  const withdrawals = carteira.movements.filter((m) => m.type === 'saida')
  const totalDeposits = deposits.reduce((acc, curr) => acc + curr.amount, 0)
  const totalWithdrawals = withdrawals.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingProposals = carteira.proposals.filter((p) => p.status === 'pendente')

  // Sorted members by total contributed
  const rankedMembers = [...carteira.members].sort(
    (a, b) => b.totalContributed - a.totalContributed,
  )

  const carteiraContext = {
    name: carteira.name,
    description: carteira.description,
    balance: carteira.balance,
    threshold: carteira.threshold,
    membersCount: carteira.members.length,
    totalDeposits,
    totalWithdrawals,
    members: rankedMembers.map((m) => ({
      name: m.name,
      role: m.role || 'membro',
      totalContributed: m.totalContributed,
    })),
    recentMovements: carteira.movements.slice(0, 8),
    pendingProposals: pendingProposals.map((p) => ({
      title: p.title,
      amount: p.amount,
      proposer: p.proposerName,
      needed: Math.max(0, p.requiredApprovals - p.currentApprovals),
    })),
  }

  // 1. Tentar backend hook
  try {
    const res = await pb.send<any>('/backend/v1/gemini/carteira-summary', {
      method: 'POST',
      body: JSON.stringify({ query, carteiraContext }),
    })

    if (res && !res.useClientFallback && res.text) {
      return {
        text: res.text,
        highlight: res.highlight,
        metrics: res.metrics || {
          balance: carteira.balance,
          totalDeposits,
          totalWithdrawals,
          pendingCount: pendingProposals.length,
        },
        source: res.source || 'gemini_gateway',
      }
    }
  } catch (err) {
    console.warn(
      'Endpoint Gemini de carteira indisponível no backend, usando resumo calculado local:',
      err,
    )
  }

  // 2. Fallback calculado localmente com regras sólidas (mesmas métricas)
  const topContributorsStr = rankedMembers
    .slice(0, 3)
    .map((m) => `${m.name} (${formatBrl(m.totalContributed)})`)
    .join(', ')

  let fallbackText = ''
  let fallbackHighlight = ''

  const lower = (query || '').toLowerCase()

  if (lower.includes('saldo') || lower.includes('quanto tem') || lower.includes('dinheiro')) {
    fallbackText =
      `💰 **Saldo do Caixa**: ${formatBrl(carteira.balance)} disponíveis.\n\n` +
      `• Total já arrecadado no fundo: ${formatBrl(totalDeposits)}\n` +
      `• Total pago em despesas coletivas: ${formatBrl(totalWithdrawals)}\n` +
      `• Propostas pendentes de aprovação: ${pendingProposals.length}\n\n` +
      `O caixa está positivo e pronto para despesas operacionais da casa.`
    fallbackHighlight = `Saldo atual: ${formatBrl(carteira.balance)} disponível.`
  } else if (
    lower.includes('proposta') ||
    lower.includes('aprova') ||
    lower.includes('saída') ||
    lower.includes('pendente')
  ) {
    if (pendingProposals.length === 0) {
      fallbackText = `🗳️ **Votações do Caixa**:\n\nNenhuma proposta de saída pendente no momento! Todos os gastos propostos anteriormente foram concluídos ou não há novas solicitações em aberto.`
      fallbackHighlight = `Tudo em dia! 0 propostas pendentes no caixa.`
    } else {
      const propDetails = pendingProposals
        .map(
          (p) =>
            `• **${p.title}** (${formatBrl(p.amount)}) — proposto por ${p.proposerName}. Faltam ${Math.max(0, p.requiredApprovals - p.currentApprovals)} voto(s) para atingir o quórum de ${p.requiredApprovals}.`,
        )
        .join('\n')
      fallbackText = `🗳️ **Propostas em Votação** (${pendingProposals.length}):\n\n${propDetails}\n\nLembre os demais moradores de registrar o voto na aba de propostas!`
      fallbackHighlight = `${pendingProposals.length} proposta(s) aguardando atingir o quórum de ${carteira.threshold} votos.`
    }
  } else if (
    lower.includes('ranking') ||
    lower.includes('quem mais') ||
    lower.includes('contribuiu') ||
    lower.includes('cotista')
  ) {
    const listStr = rankedMembers
      .map(
        (m, idx) =>
          `${idx + 1}º ${m.name}: ${formatBrl(m.totalContributed)} (${m.role === 'admin' ? 'Admin' : 'Morador'})`,
      )
      .join('\n')
    fallbackText = `🏆 **Ranking de Contribuição dos Moradores**:\n\n${listStr}\n\nTotal acumulado de depósitos: ${formatBrl(totalDeposits)}.`
    fallbackHighlight = `Maior contribuidor: ${rankedMembers[0]?.name || 'Nenhum'} (${formatBrl(rankedMembers[0]?.totalContributed || 0)}).`
  } else {
    // Resumo geral completo
    const pendingSummary =
      pendingProposals.length > 0
        ? `⚠️ Há **${pendingProposals.length} proposta(s) de saída aguardando aprovação** (quórum exigido: ${carteira.threshold} moradores).`
        : `✨ Nenhuma despesa pendente de aprovação.`

    fallbackText =
      `🏠 **Resumo Financeiro do Caixa Coletivo**\n\n` +
      `• **Saldo Disponível**: ${formatBrl(carteira.balance)}\n` +
      `• **Arrecadação Total**: ${formatBrl(totalDeposits)} em ${deposits.length} depósitos\n` +
      `• **Saídas Aprovadas**: ${formatBrl(totalWithdrawals)} em ${withdrawals.length} despesas\n` +
      `• **Top Contribuidores**: ${topContributorsStr || 'Nenhum morador registrado'}\n` +
      `• **Regra de Governança**: Mínimo de **${carteira.threshold} aprovações** para liberação de qualquer débito\n\n` +
      `${pendingSummary}\n\n` +
      `*Aviso: Este resumo é gerado para leitura e planejamento da casa; a inteligência não efetua pagamentos nem altera saldos.*`

    fallbackHighlight = `Caixa com saldo de ${formatBrl(carteira.balance)} • ${pendingProposals.length} proposta(s) pendente(s)`
  }

  return {
    text: fallbackText,
    highlight: fallbackHighlight,
    metrics: {
      balance: carteira.balance,
      totalDeposits,
      totalWithdrawals,
      pendingCount: pendingProposals.length,
    },
    source: 'client_fallback',
  }
}
