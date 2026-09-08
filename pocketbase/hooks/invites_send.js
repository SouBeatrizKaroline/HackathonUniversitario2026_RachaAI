// Endpoint para envio de convites de racha por e-mail via servidor PocketBase
// Suporta envio real via SMTP se configurado, registrando o convite na collection 'convites'.

routerAdd('POST', '/backend/v1/invites/send', (e) => {
  const body = e.requestInfo().body || {}
  const rachaId = (body.rachaId || '').trim()
  const rachaName = (body.rachaName || 'Racha').trim()
  const shareCode = (body.shareCode || '').trim()
  const invitedBy = (body.invitedBy || 'Um amigo').trim()
  const perPersonAmount = Number(body.perPersonAmount || 0)
  const emails = Array.isArray(body.emails) ? body.emails : []

  if (!rachaId) {
    return e.badRequestError("O campo 'rachaId' é obrigatório.")
  }

  // Filtrar e validar e-mails válidos
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const validEmails = emails
    .map((em) =>
      String(em || '')
        .trim()
        .toLowerCase(),
    )
    .filter((em) => emailRegex.test(em))

  if (validEmails.length === 0) {
    return e.badRequestError('Nenhum e-mail válido foi fornecido.')
  }

  // Obter link do racha
  const siteUrl = $os.getenv('SITE_URL') || $os.getenv('APP_URL') || ''
  const baseUrl = siteUrl ? siteUrl.replace(/\/$/, '') : 'https://racha.ai'
  const inviteUrl = `${baseUrl}/racha/${shareCode || rachaId}`

  // Formatador BRL simples
  const formattedAmount = 'R$ ' + perPersonAmount.toFixed(2).replace('.', ',')

  // Checar se SMTP está habilitado e configurado
  const settings = $app.settings()
  const isSmtpEnabled = Boolean(settings.smtp && settings.smtp.enabled && settings.smtp.host)

  let sentCount = 0
  let failedCount = 0
  const results = []

  const senderEmail = settings.meta.senderAddress || 'nao-responda@racha.ai'
  const senderName = settings.meta.senderName || 'Racha.AI'

  for (let i = 0; i < validEmails.length; i++) {
    const toEmail = validEmails[i]
    let status = 'pendente_smtp'
    let errorDetail = ''

    if (isSmtpEnabled) {
      try {
        const mailClient = $app.newMailClient()
        const message = new MailerMessage({
          from: {
            address: senderEmail,
            name: senderName,
          },
          to: [{ address: toEmail }],
          subject: `${invitedBy} te convidou para o racha "${rachaName}" ⚡`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #7B2FF7; color: #ffffff; font-weight: 800; font-size: 20px; padding: 10px 18px; border-radius: 12px; letter-spacing: -0.5px;">
                  ⚡ Racha.AI
                </div>
              </div>
              <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin-bottom: 12px; text-align: center;">
                Você foi convidado para um racha!
              </h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                Oi! <strong>${invitedBy}</strong> incluiu você no racha <strong>"${rachaName}"</strong>.
              </p>
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                <div style="color: #64748B; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Sua parte estimada</div>
                <div style="color: #15803D; font-size: 26px; font-weight: 800;">${formattedAmount}</div>
              </div>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Acompanhe quem já pagou, confira a transparência em tempo real e confirme seu pagamento pelo link:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #7B2FF7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(123, 47, 247, 0.25);">
                  Acessar Racha "${rachaName}"
                </a>
              </div>
              <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                Link direto:<br/>
                <a href="${inviteUrl}" style="color: #7B2FF7; word-break: break-all;">${inviteUrl}</a>
              </p>
              <p style="color: #94A3B8; font-size: 11px; margin-top: 16px; text-align: center;">
                Racha.AI • Divisão de contas justa e transparente entre amigos e repúblicas.
              </p>
            </div>
          `,
        })

        mailClient.send(message)
        status = 'enviado'
        sentCount++
      } catch (err) {
        status = 'pendente_smtp'
        failedCount++
        errorDetail = err.message
        console.log('Falha ao enviar e-mail de convite para', toEmail, ':', err.message)
      }
    } else {
      // SMTP não configurado nesta instância ainda
      status = 'pendente_smtp'
      failedCount++
    }

    // Persistir o convite na collection 'convites'
    try {
      const convitesCol = $app.findCollectionByNameOrId('convites')
      const conviteRec = new Record(convitesCol)
      conviteRec.set('racha', rachaId)
      conviteRec.set('email', toEmail)
      conviteRec.set('rachaName', rachaName)
      conviteRec.set('perPersonAmount', perPersonAmount)
      conviteRec.set('invitedBy', invitedBy)
      conviteRec.set('status', status)
      $app.save(conviteRec)
    } catch (saveErr) {
      console.log('Erro ao salvar convite na collection:', saveErr.message)
    }

    results.push({
      email: toEmail,
      status: status,
      error: errorDetail || null,
    })
  }

  return e.json(200, {
    success: true,
    smtpEnabled: isSmtpEnabled,
    sentCount: sentCount,
    failedCount: failedCount,
    total: validEmails.length,
    results: results,
    inviteUrl: inviteUrl,
    message: isSmtpEnabled
      ? `${sentCount} convite(s) enviado(s) com sucesso por e-mail!`
      : `Convite(s) registrado(s). Para entrega real na caixa de entrada, configure os dados de SMTP no painel.`,
  })
})
