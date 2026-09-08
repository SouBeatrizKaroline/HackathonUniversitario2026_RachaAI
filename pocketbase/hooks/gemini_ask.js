// Endpoint para perguntas contextuais sobre um racha existente
// Usado pelo FAB "Perguntar ao Gemini" em qualquer dispositivo

routerAdd('POST', '/backend/v1/gemini/ask', (e) => {
  const body = e.requestInfo().body || {}
  const query = (body.query || '').trim()
  const rachaContext = body.rachaContext || {}

  if (!query) {
    return e.badRequestError("O campo 'query' é obrigatório.")
  }

  let geminiKey = ''
  try {
    geminiKey = $os.getenv('GEMINI_API_KEY') || $os.getenv('GOOGLE_API_KEY') || ''
  } catch (_) {}

  const systemInstruction = `Você é o Gemini, assistente de inteligência contextual do Racha.AI em português do Brasil (pt-BR).
Você responde dúvidas sobre o andamento de um racha coletivo de contas (quem pagou, quem falta, quanto falta, divisões e simulações).

Regras de ouro:
1. Você NUNCA executa pagamentos diretamente. Todas as alterações ou movimentações financeiras precisam de confirmação explícita do usuário.
2. Seja direto, simpático, com linguagem fintech jovem e valores formatados em R$.
3. Se o usuário perguntar sobre recalcular ou adicionar pessoas (ex: "se adicionarmos mais 2 pessoas"), sugira o novo valor e envie no JSON a ação de confirmação:
{
  "text": "Sua resposta textual",
  "action": {
    "type": "add_people",
    "count": 8,
    "newPerPerson": 60.0
  }
}
4. Se for apenas dúvida informativa (quem não pagou, quanto falta, resumo), retorne apenas:
{
  "text": "Sua resposta textual"
}
Retorne SEMPRE um JSON válido, sem crases markdown ou formatação externa.`

  const userPrompt = `Dados do racha atual:
${JSON.stringify(rachaContext)}

Pergunta ou instrução do usuário: "${query}"`

  // 1. Google Gemini direto se houver chave
  if (geminiKey) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
        geminiKey
      const res = $http.send({
        url: url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
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
          const raw = respJson.candidates[0].content.parts[0].text
          const parsed = JSON.parse(
            raw
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
      console.log('Erro ao consultar Gemini direto no ask:', err.message)
    }
  }

  // 2. Skip AI Gateway ($ai.chat)
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
    console.log('Fallback Skip AI no ask indisponível:', err.message)
  }

  return e.json(200, {
    useClientFallback: true,
    source: 'client_fallback',
  })
})
