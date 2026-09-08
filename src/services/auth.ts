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
      message: 'Instruções para redefinir a senha foram enviadas para seu e-mail.',
    }
  } catch (err: any) {
    const errorMsg = String(err?.message || err || '')
    // When SMTP is not configured in PocketBase, it returns a 500 / Failed to send email error
    if (
      errorMsg.includes('Failed to send') ||
      errorMsg.includes('smtp') ||
      errorMsg.includes('mailer') ||
      err?.status === 500
    ) {
      return {
        success: false,
        message:
          'O servidor de envio de e-mails (SMTP) ainda não está configurado nesta instância. Entre em contato com o suporte ou crie uma nova conta.',
      }
    }
    return {
      success: false,
      message: 'Não foi possível solicitar a recuperação. Verifique se o e-mail está correto.',
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
