// Endpoint para interpretação de linguagem natural e perguntas contextuais
// Utiliza Google Gemini real (se GEMINI_API_KEY ou GOOGLE_API_KEY existir) ou Skip AI Gateway ($ai.chat)
// Nunca expõe chaves no client e nunca executa pagamentos diretamente.

routerAdd('POST', '/backend/v1/gemini/parse', (e) => {
  const body = e.requestInfo().body || {}
  const text = (body.text || '').trim()
  const prevState = body.prevState || null

  if (!text) {
    return e.badRequestError("O campo 'text' é obrigatório.")
  }

  // 1. Verificar chaves de ambiente
  let geminiKey = ''
  try {
    geminiKey = $os.getenv('GEMINI_API_KEY') || $os.getenv('GOOGLE_API_KEY') || ''
  } catch (_) {}

  const systemInstruction = `Você é o interpretador do Racha.AI, um aplicativo financeiro jovem e transparente para divisão de contas em reais (R$, pt-BR).
Sua missão é extrair dados de contas, rachas e divisões a partir de mensagens informais em português do Brasil.

Regras fundamentais:
1. Você NUNCA executa transações nem altera saldos bancários. Você apenas interpreta, calcula e estrutura os dados.
2. Formato de resposta OBRIGATÓRIO: Retorne APENAS um objeto JSON válido, sem crases de markdown (sem \`\`\`json) ou preâmbulo, com a seguinte estrutura:
{
  "data": {
    "name": "Nome sugerido para o racha",
    "category": "República" | "Comida" | "Viagem" | "Faculdade" | "Evento" | "Outro",
    "totalAmount": 480.0,
    "participantCount": 6,
    "perPersonAmount": 80.0,
    "participants": [
      { "name": "Nome", "amount": 80.0, "paid": false }
    ],
    "notes": "observações curtas se houver"
  },
  "assistantMessage": "Mensagem amigável e clara em pt-BR resumindo a interpretação.",
  "followUpType": "general" | "added_person" | "updated_split" | "marked_paid"
}

3. Se houver participantes prévios informados no contexto, preserve-os e aplique as modificações pedidas (ex.: "Maria já pagou" -> marque paid: true na Maria; "João vai pagar 100 e divide o resto" -> João com 100 e recalcule os outros; "Adicione mais uma pessoa" -> incremente participantes e recalcule o valor por pessoa).
4. Assegure que a soma dos valores dos participantes feche exatamente no totalAmount.`

  const userPrompt = `Contexto anterior: ${JSON.stringify(prevState || {})}
Mensagem do usuário: "${text}"`

  // Tentativa 1: Chamar API oficial do Gemini se a chave estiver configurada
  if (geminiKey) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
        geminiKey
      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }

      const res = $http.send({
        url: url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 15,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const respJson = res.json
        if (
          respJson &&
          respJson.candidates &&
          respJson.candidates[0] &&
          respJson.candidates[0].content
        ) {
          const rawText = respJson.candidates[0].content.parts[0].text
          const parsed = JSON.parse(
            rawText
              .trim()
              .replace(/^```json\s*/, '')
              .replace(/\s*```$/, ''),
          )
          return e.json(200, {
            ...parsed,
            source: 'gemini_api',
          })
        }
      }
    } catch (err) {
      console.log('Erro ao chamar Google Gemini API direta:', err.message)
    }
  }

  // Tentativa 2: Chamar Skip AI Gateway ($ai.chat) provisionado na instância
  try {
    const aiRes = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })

    if (aiRes && aiRes.choices && aiRes.choices[0] && aiRes.choices[0].message) {
      const content = aiRes.choices[0].message.content
      const parsed = JSON.parse(
        content
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, ''),
      )
      return e.json(200, {
        ...parsed,
        source: 'gemini_gateway',
      })
    }
  } catch (err) {
    console.log('Fallback Skip AI indisponível ou falhou:', err.message)
  }

  // Se nada acima estiver configurado ou responder, o status indica 'fallback_client'
  return e.json(200, {
    useClientFallback: true,
    source: 'client_fallback',
    message: 'Nenhuma API LLM configurada no momento. Usando parser local simulado.',
  })
})
