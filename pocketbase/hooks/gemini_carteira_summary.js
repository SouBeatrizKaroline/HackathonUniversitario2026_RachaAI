// Endpoint para resumo executivo e perguntas sobre o caixa coletivo da república (Carteira)
// Utiliza Google Gemini oficial ou Skip AI Gateway ($ai.chat) via SKIP_AI_GATEWAY_API_KEY/URL
// O Gemini NUNCA executa transações nem altera saldo; atua somente em leitura/resumo.

routerAdd('POST', '/backend/v1/gemini/carteira-summary', (e) => {
  const body = e.requestInfo().body || {}
  const query = (body.query || '').trim()
  const carteiraContext = body.carteiraContext || {}

  let geminiKey = ''
  try {
    geminiKey = $os.getenv('GEMINI_API_KEY') || $os.getenv('GOOGLE_API_KEY') || ''
  } catch (_) {}

  const systemInstruction = `Você é o assistente Gemini do Racha.AI, especialista em finanças colaborativas e prestação de contas de repúblicas e grupos de amigos no Brasil (pt-BR, R$).
Sua missão é resumir a saúde do caixa compartilhado (Carteira), destacar despesas recentes, propostas pendentes de aprovação e saldo disponível.

Regras inquebráveis:
1. Você NUNCA executa transferências, pagamentos ou débitos. O caixa possui governança estrita de aprovações (Multisig).
2. Use linguagem amigável, transparente, direta e descontraída (linguagem universitária/estudantil ou jovem adulta).
3. Valores monetários sempre formatados no padrão brasileiro R$ X,XX.
4. Formato de resposta OBRIGATÓRIO (retorne APENAS um JSON válido sem marcações markdown ou blocos \`\`\`json):
{
  "text": "Texto completo do resumo ou resposta detalhada em pt-BR",
  "highlight": "Uma frase de destaque rápida sobre o estado atual do caixa",
  "metrics": {
    "balance": 620.0,
    "totalDeposits": 770.0,
    "totalWithdrawals": 150.0,
    "pendingCount": 1
  }
}`

  const userPrompt = `Contexto do caixa coletivo:
${JSON.stringify(carteiraContext)}

Pergunta ou solicitação do morador:
"${query || 'Faça um resumo geral de fechamento e saúde financeira do caixa da república.'}"`

  // 1. Google Gemini direto se houver chave configurada
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
      console.log('Erro ao consultar Gemini direto para carteira:', err.message)
    }
  }

  // 2. Skip AI Gateway ($ai.chat) via SKIP_AI_GATEWAY_API_KEY/URL provisionados
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
    console.log('Fallback Skip AI Gateway na carteira falhou:', err.message)
  }

  // 3. Fallback controlado para o cliente
  return e.json(200, {
    useClientFallback: true,
    source: 'client_fallback',
  })
})
