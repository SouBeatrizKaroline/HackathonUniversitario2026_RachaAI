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
