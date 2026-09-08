import pb from '@/lib/pocketbase/client'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  created: string
  updated: string
}

export interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  name: string
}

export interface LoginData {
  email: string
  password: string
}

export async function loginWithEmail({ email, password }: LoginData): Promise<UserProfile> {
  const authData = await pb.collection('users').authWithPassword(email.trim(), password)
  const user = authData.record
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    avatar: user.avatar ? pb.files.getURL(user, user.avatar) : undefined,
    created: user.created,
    updated: user.updated,
  }
}

export async function registerWithEmail(data: RegisterData): Promise<UserProfile> {
  const trimmedEmail = data.email.trim()
  const trimmedName = data.name.trim() || trimmedEmail.split('@')[0]

  // 1. Create user in users auth collection
  await pb.collection('users').create({
    email: trimmedEmail,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    name: trimmedName,
  })

  // 2. Automatically log in after registration
  return await loginWithEmail({
    email: trimmedEmail,
    password: data.password,
  })
}

export function logout(): void {
  pb.authStore.clear()
}

export function getCurrentUser(): UserProfile | null {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    return null
  }
  const rec = pb.authStore.record
  return {
    id: rec.id,
    email: rec.email || '',
    name: rec.name || (rec.email ? rec.email.split('@')[0] : 'Usuário'),
    avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar) : undefined,
    created: rec.created,
    updated: rec.updated,
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await pb.collection('users').requestPasswordReset(email.trim())
    return {
      success: true,
      message:
        'Se este e-mail estiver cadastrado, enviamos um link de redefinição para a sua caixa de entrada.',
    }
  } catch (err: any) {
    const errorMsg = String(err?.message || err || '')
    // Quando o SMTP não estiver configurado no servidor ou falhar na conexão de transporte
    if (
      errorMsg.includes('Failed to send') ||
      errorMsg.includes('smtp') ||
      errorMsg.includes('mailer') ||
      err?.status === 500
    ) {
      return {
        success: false,
        message:
          'O envio de e-mails falhou: as credenciais de SMTP ainda não foram configuradas no servidor Skip Cloud. Preencha as variáveis de ambiente SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no painel.',
      }
    }
    return {
      success: false,
      message:
        'Não foi possível solicitar a recuperação. Verifique se o e-mail informado é válido ou tente novamente mais tarde.',
    }
  }
}

export async function updateCurrentUserProfile(data: { name?: string }): Promise<UserProfile> {
  if (!pb.authStore.record?.id) {
    throw new Error('Nenhum usuário logado.')
  }
  const updated = await pb.collection('users').update(pb.authStore.record.id, data)
  return {
    id: updated.id,
    email: updated.email || '',
    name: updated.name || '',
    avatar: updated.avatar ? pb.files.getURL(updated, updated.avatar) : undefined,
    created: updated.created,
    updated: updated.updated,
  }
}
