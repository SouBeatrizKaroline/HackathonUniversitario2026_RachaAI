import pb from '@/lib/pocketbase/client'

export interface SendRachaInviteParams {
  rachaId: string
  rachaName: string
  shareCode: string
  invitedBy: string
  perPersonAmount: number
  emails: string[]
}

export interface SendRachaInviteResult {
  success: boolean
  smtpEnabled: boolean
  sentCount: number
  failedCount: number
  total: number
  message: string
  inviteUrl: string
  results: Array<{ email: string; status: string; error: string | null }>
}

/**
 * Envia convite de racha por e-mail pelo backend PocketBase.
 * Os convites são registrados na collection 'convites' e entregues via SMTP configurado.
 */
export async function sendRachaEmailInvites(
  params: SendRachaInviteParams,
): Promise<SendRachaInviteResult> {
  const cleanEmails = params.emails
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes('@'))

  if (cleanEmails.length === 0) {
    throw new Error('Nenhum e-mail válido fornecido para envio.')
  }

  try {
    const res = await pb.send<SendRachaInviteResult>('/backend/v1/invites/send', {
      method: 'POST',
      body: {
        rachaId: params.rachaId,
        rachaName: params.rachaName,
        shareCode: params.shareCode,
        invitedBy: params.invitedBy,
        perPersonAmount: params.perPersonAmount,
        emails: cleanEmails,
      },
    })
    return res
  } catch (err: any) {
    console.warn('Falha no endpoint /backend/v1/invites/send:', err)
    // Fallback gracioso: tentar registrar direto na collection 'convites' se o hook falhar
    const fallbackResults: SendRachaInviteResult['results'] = []
    let saved = 0
    for (const em of cleanEmails) {
      try {
        await pb.collection('convites').create({
          racha: params.rachaId,
          email: em,
          rachaName: params.rachaName,
          perPersonAmount: params.perPersonAmount,
          invitedBy: params.invitedBy,
          status: 'pendente_smtp',
        })
        saved++
        fallbackResults.push({ email: em, status: 'pendente_smtp', error: null })
      } catch {
        fallbackResults.push({ email: em, status: 'pendente_smtp', error: 'Falha ao salvar' })
      }
    }

    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/racha/${params.shareCode || params.rachaId}`

    return {
      success: true,
      smtpEnabled: false,
      sentCount: 0,
      failedCount: cleanEmails.length,
      total: cleanEmails.length,
      message:
        saved > 0
          ? `${saved} convite(s) registrado(s). Configure o SMTP no painel para envio automático.`
          : 'Não foi possível enviar os convites por e-mail.',
      inviteUrl,
      results: fallbackResults,
    }
  }
}
