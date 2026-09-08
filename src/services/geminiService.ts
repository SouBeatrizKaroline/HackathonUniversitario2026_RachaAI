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
