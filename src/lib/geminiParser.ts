import { InterpretedRachaData, RachaCategory } from '@/types/racha'

interface ParseState {
  currentData?: InterpretedRachaData
}

export function parseNaturalLanguageRacha(
  text: string,
  prevState?: InterpretedRachaData,
): {
  data: InterpretedRachaData
  assistantMessage: string
  followUpType?: 'added_person' | 'updated_split' | 'marked_paid' | 'general'
} {
  const lower = text.toLowerCase()

  // 1. Detect Category & Keywords
  let category: RachaCategory = prevState?.category || 'Outro'
  let guessedName = prevState?.name || ''

  if (
    /(viagem|viajar|praia|congresso|estrada|hotel|pousada|gasolina|pedagio|pedágio|carona)/i.test(
      text,
    )
  ) {
    category = 'Viagem'
    if (!guessedName) guessedName = 'Viagem da turma'
  } else if (
    /(comida|pizza|lanche|churrasco|hambúrguer|hamburguer|restaurante|jantar|almoço|almoco|pedido|delivery|ifood)/i.test(
      text,
    )
  ) {
    category = 'Comida'
    if (!guessedName) guessedName = 'Pizza da galera'
  } else if (
    /(república|republica|aluguel|condominio|condomínio|luz|água|agua|internet|faxina|compras do mes|feira)/i.test(
      text,
    )
  ) {
    category = 'República'
    if (!guessedName) guessedName = 'Contas da república'
  } else if (
    /(faculdade|trabalho|xerox|impressao|impressão|livro|formatura|atletica|atlética|curso|congresso)/i.test(
      text,
    )
  ) {
    category = 'Faculdade'
    if (!guessedName) guessedName = 'Trabalho da faculdade'
  } else if (
    /(festa|evento|show|ingresso|rolê|role|bar|chopp|cerveja|aniversario|aniversário)/i.test(text)
  ) {
    category = 'Evento'
    if (!guessedName) guessedName = 'Rolê do final de semana'
  }

  // 2. Detect Total Amount
  // matches: R$ 480,00, R$480, 480 reais, 480,00 reais, R$ 1.200,00
  let totalAmount = prevState?.totalAmount || 0
  const currencyMatch = text.match(
    /(?:r\$\s*|reais\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?|\d+)\s*(?:reais|conto|pila)?/i,
  )

  // Specific regex for "R$ 480" or "480 reais" or "arrecadar 480" or "dividir 480"
  const strongAmountMatch = text.match(
    /(?:r\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*reais|(?:arrecadar|dividir|total de|de)\s*r?\$?\s*(\d+(?:[.,]\d+)?))/i,
  )

  if (strongAmountMatch) {
    const rawVal = strongAmountMatch[1] || strongAmountMatch[2] || strongAmountMatch[3]
    if (rawVal) {
      const cleanVal = Number(rawVal.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(cleanVal) && cleanVal > 0) {
        totalAmount = cleanVal
      }
    }
  }

  // 3. Detect participant count
  // matches: "somos 6", "6 pessoas", "6 participantes", "dividir entre 6", "em 6"
  let count = prevState?.participantCount || 0
  const countMatch = text.match(
    /(?:somos\s+|entre\s+|em\s+)?(\d+)\s*(?:pessoas|amigos|participantes|integrantes|alunos|membros)?/i,
  )
  const explicitSomos = text.match(/somos\s+(\d+)/i)
  const explicitPessoas = text.match(/(\d+)\s+(?:pessoas|participantes|amigos|integrantes)/i)

  if (explicitSomos) {
    count = parseInt(explicitSomos[1], 10)
  } else if (explicitPessoas) {
    count = parseInt(explicitPessoas[1], 10)
  } else if (count === 0 && countMatch && countMatch[1]) {
    const possibleCount = parseInt(countMatch[1], 10)
    // Avoid mistaking amount for count if amount is huge
    if (possibleCount < 50 && possibleCount > 1) {
      count = possibleCount
    }
  }

  // 4. Proper Names Detection (Capitalized Words)
  // Look for Portuguese typical names or capital words not at start of sentence
  const commonNames = [
    'Ana',
    'João',
    'Maria',
    'Pedro',
    'Lucas',
    'Carlos',
    'Beatriz',
    'Marina',
    'Gabriel',
    'Larissa',
    'Matheus',
    'Felipe',
    'Julia',
    'Camila',
    'Rafael',
    'Bruna',
    'Thiago',
    'Gustavo',
    'Guilherme',
    'Fernanda',
    'Rodrigo',
  ]
  const detectedNames: string[] = []

  // Check known names
  commonNames.forEach((n) => {
    const reg = new RegExp(`\\b${n}\\b`, 'i')
    if (reg.test(text) && !detectedNames.includes(n)) {
      detectedNames.push(n)
    }
  })

  // Additional capitalized words (like "Vitor vai pagar")
  const capWords: string[] = text.match(/(?:[A-ZÀ-Ú][a-zà-ú]+)/g) || []
  capWords.forEach((word: string) => {
    const ignored: string[] = [
      'Somos',
      'Preciso',
      'Precisamos',
      'Vou',
      'Quero',
      'Dividir',
      'Rateio',
      'Racha',
      'Rachou',
      'Ai',
      'Gemini',
      'Solana',
      'Total',
      'Deixa',
    ]
    if (!ignored.includes(word) && !detectedNames.includes(word) && word.length > 2) {
      detectedNames.push(word)
    }
  })

  // 5. Follow-up: "Maria já pagou" or "João já pagou"
  const alreadyPaidMatch = text.match(/([A-ZÀ-Ú][a-zà-ú]+)\s+j[aá]\s+pagou/i)
  const paidName = alreadyPaidMatch ? alreadyPaidMatch[1] : null

  // 6. Follow-up: "João vai pagar R$ 100 e divide o restante entre os outros"
  const customPayMatch = text.match(
    /([A-ZÀ-Ú][a-zà-ú]+)\s+vai\s+pagar\s+(?:r\$\s*)?(\d+(?:[.,]\d+)?)/i,
  )

  // 7. Follow-up: "Adicione mais uma pessoa"
  const addPersonMatch =
    /(adicione|adicionar|coloca|chama)\s+(?:mais\s+)?(?:uma|1)?\s*(?:pessoa|amigo|participante)/i.test(
      text,
    )

  // Build / update participants list
  let participants = prevState?.participants ? [...prevState.participants] : []

  // If follow-up: adding a person
  if (addPersonMatch) {
    // If text has name like "Adicione o Rafael"
    const specificName = text.match(
      /(?:adicione|adicionar|coloca)\s+(?:o|a)?\s*([A-ZÀ-Ú][a-zà-ú]+)/i,
    )
    const newName =
      specificName &&
      specificName[1] &&
      !['mais', 'uma', 'pessoa'].includes(specificName[1].toLowerCase())
        ? specificName[1]
        : `Participante ${participants.length + 1}`

    count = Math.max(count + 1, participants.length + 1)
    const avg = totalAmount > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0
    participants.push({ name: newName, amount: avg, paid: false })

    // Recalculate amounts
    participants = participants.map((p, idx) => {
      if (idx === participants.length - 1) {
        const sumOthers = participants.slice(0, -1).reduce((acc, curr) => acc + curr.amount, 0)
        return { ...p, amount: Math.round((totalAmount - sumOthers) * 100) / 100 }
      }
      return { ...p, amount: avg }
    })

    const perPerson =
      totalAmount > 0 && count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0

    return {
      data: {
        name: guessedName || 'Racha coletivo',
        category,
        totalAmount,
        participantCount: count,
        perPersonAmount: perPerson,
        participants,
      },
      assistantMessage: `Adicionei ${newName}! Agora o racha tem ${count} participantes. O novo valor fica em aproximadamente ${formatCurrencyPreview(perPerson)} por pessoa.`,
      followUpType: 'added_person',
    }
  }

  // If follow-up: "Maria já pagou"
  if (paidName && participants.length > 0) {
    let found = false
    participants = participants.map((p) => {
      if (p.name.toLowerCase() === paidName.toLowerCase()) {
        found = true
        return { ...p, paid: true }
      }
      return p
    })

    if (!found) {
      // create participant
      const avg = totalAmount > 0 && count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0
      participants.push({ name: paidName, amount: avg, paid: true })
      count = Math.max(count, participants.length)
    }

    const perPerson =
      totalAmount > 0 && count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0
    return {
      data: {
        name: guessedName || 'Racha coletivo',
        category,
        totalAmount,
        participantCount: count,
        perPersonAmount: perPerson,
        participants,
      },
      assistantMessage: `Perfeito! Marquei que ${paidName} já pagou. O status foi atualizado.`,
      followUpType: 'marked_paid',
    }
  }

  // If follow-up: "João vai pagar R$ 100 e divide o restante entre os outros"
  if (customPayMatch) {
    const cName = customPayMatch[1]
    const cAmount = Number(customPayMatch[2].replace(/\./g, '').replace(',', '.'))

    if (!isNaN(cAmount) && totalAmount > 0) {
      count = Math.max(count, 2, participants.length)
      const remainingTotal = Math.max(0, totalAmount - cAmount)
      const othersCount = Math.max(1, count - 1)
      const perOther = Math.round((remainingTotal / othersCount) * 100) / 100

      // Update or create participants
      if (participants.length === 0) {
        participants.push({ name: cName, amount: cAmount, paid: false })
        for (let i = 1; i < count; i++) {
          const sampleNames = ['Ana', 'Carlos', 'Beatriz', 'Lucas', 'Marina', 'Gabriel']
          const pName = sampleNames[i - 1] || `Pessoa ${i + 1}`
          const isLast = i === count - 1
          const finalAmount = isLast
            ? Math.round((totalAmount - cAmount - perOther * (othersCount - 1)) * 100) / 100
            : perOther
          participants.push({ name: pName, amount: finalAmount, paid: false })
        }
      } else {
        let exists = false
        participants = participants.map((p) => {
          if (p.name.toLowerCase() === cName.toLowerCase()) {
            exists = true
            return { ...p, amount: cAmount }
          }
          return { ...p, amount: perOther }
        })
        if (!exists) {
          participants.unshift({ name: cName, amount: cAmount, paid: false })
        }
      }

      return {
        data: {
          name: guessedName || 'Racha coletivo',
          category,
          totalAmount,
          participantCount: count,
          perPersonAmount: perOther,
          participants,
        },
        assistantMessage: `Ajustado! ✨ ${cName} pagará ${formatCurrencyPreview(cAmount)}, e os outros ${othersCount} participantes pagarão ${formatCurrencyPreview(perOther)} cada.`,
        followUpType: 'updated_split',
      }
    }
  }

  // Initial parse or general update
  if (count === 0 && detectedNames.length > 0) {
    count = detectedNames.length
  } else if (count === 0) {
    count = 2
  }

  const perPersonAmount = totalAmount > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0

  // Build participant names
  if (participants.length === 0 || participants.length !== count) {
    const list: { name: string; amount: number; paid?: boolean }[] = []
    const sampleNames = [
      'Você',
      'Ana',
      'Carlos',
      'Beatriz',
      'João',
      'Lucas',
      'Marina',
      'Gabriel',
      'Larissa',
    ]
    let runningSum = 0

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1
      const amt = isLast ? Math.round((totalAmount - runningSum) * 100) / 100 : perPersonAmount
      runningSum += amt

      const name = detectedNames[i] || sampleNames[i] || `Pessoa ${i + 1}`
      const isPaid = paidName && name.toLowerCase() === paidName.toLowerCase()
      list.push({ name, amount: amt, paid: Boolean(isPaid) })
    }
    participants = list
  } else {
    // Just update amounts
    participants = participants.map((p, idx) => {
      const isLast = idx === participants.length - 1
      return {
        ...p,
        amount: isLast
          ? Math.round((totalAmount - perPersonAmount * (participants.length - 1)) * 100) / 100
          : perPersonAmount,
      }
    })
  }

  const formattedTotal = formatCurrencyPreview(totalAmount)
  const formattedPerPerson = formatCurrencyPreview(perPersonAmount)

  const assistantMessage = `Entendi! ✨ Vou criar um racha de ${formattedTotal} para ${count} pessoas. Cada pessoa pagará ${formattedPerPerson}.`

  return {
    data: {
      name: guessedName || 'Racha da turma',
      category,
      totalAmount,
      participantCount: count,
      perPersonAmount,
      participants,
    },
    assistantMessage,
    followUpType: 'general',
  }
}

function formatCurrencyPreview(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
