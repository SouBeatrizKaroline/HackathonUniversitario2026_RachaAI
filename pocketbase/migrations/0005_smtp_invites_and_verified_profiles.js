migrate(
  (app) => {
    // 1. Atualizar configurações do sistema: SMTP (lendo env vars) e Meta (nome e URL da app)
    const settings = app.settings()

    // Configurar App Meta
    settings.meta.appName = 'Racha.AI'
    const siteUrl = $os.getenv('SITE_URL') || $os.getenv('APP_URL') || ''
    if (siteUrl) {
      settings.meta.appURL = siteUrl
    }
    const senderEmail =
      $os.getenv('SMTP_SENDER') ||
      $os.getenv('SMTP_FROM') ||
      $os.getenv('SMTP_USER') ||
      'nao-responda@racha.ai'
    const senderName = $os.getenv('SMTP_SENDER_NAME') || 'Racha.AI'
    settings.meta.senderAddress = senderEmail
    settings.meta.senderName = senderName

    // Configurar SMTP se fornecido via variáveis de ambiente
    const smtpHost = $os.getenv('SMTP_HOST') || ''
    const smtpPort = parseInt($os.getenv('SMTP_PORT') || '587', 10)
    const smtpUser = $os.getenv('SMTP_USER') || $os.getenv('SMTP_USERNAME') || ''
    const smtpPass = $os.getenv('SMTP_PASS') || $os.getenv('SMTP_PASSWORD') || ''
    const smtpTls = $os.getenv('SMTP_TLS') === 'true' || smtpPort === 465

    if (smtpHost) {
      settings.smtp.enabled = true
      settings.smtp.host = smtpHost
      settings.smtp.port = smtpPort
      settings.smtp.username = smtpUser
      settings.smtp.password = smtpPass
      settings.smtp.tls = smtpTls
    }

    app.save(settings)

    // 2. Personalizar o template de e-mail de recuperação de senha da collection 'users'
    const usersCol = app.findCollectionByNameOrId('users')
    usersCol.resetPasswordTemplate = {
      subject: 'Recuperação de senha no Racha.AI ⚡',
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #7B2FF7; color: #ffffff; font-weight: 800; font-size: 20px; padding: 10px 18px; border-radius: 12px; letter-spacing: -0.5px;">
              ⚡ Racha.AI
            </div>
          </div>
          <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin-bottom: 12px; text-align: center;">
            Bora redefinir sua senha?
          </h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Olá! Recebemos um pedido para redefinir a senha da sua conta no <strong>Racha.AI</strong>. Se foi você, basta clicar no botão abaixo para escolher uma nova senha e voltar a rachar as contas da turma sem estresse:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="{ACTION_URL}" style="display: inline-block; background: #7B2FF7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(123, 47, 247, 0.25);">
              Redefinir minha senha
            </a>
          </div>
          <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
            Se o botão não funcionar, copie e cole o link no seu navegador:<br/>
            <a href="{ACTION_URL}" style="color: #7B2FF7; word-break: break-all;">{ACTION_URL}</a>
          </p>
          <p style="color: #94A3B8; font-size: 11px; margin-top: 16px; text-align: center;">
            Se não foi você que pediu, pode desconsiderar este e-mail. Sua senha continua segura! 🔒
          </p>
        </div>
      `,
    }

    // 3. Atualizar collection 'participantes' com campo 'user' (relação opcional com users para perfil verificado)
    const partCol = app.findCollectionByNameOrId('participantes')
    if (!partCol.fields.getByName('user')) {
      partCol.fields.add(
        new RelationField({
          name: 'user',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      partCol.addIndex('idx_participantes_user', false, 'user', '')
    }

    // 4. Atualizar collection 'pagamentos' com campo 'user' (relação opcional com users para pagamento verificado)
    const pagCol = app.findCollectionByNameOrId('pagamentos')
    if (!pagCol.fields.getByName('user')) {
      pagCol.fields.add(
        new RelationField({
          name: 'user',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      pagCol.addIndex('idx_pagamentos_user', false, 'user', '')
    }

    // 5. Criar collection 'convites' para persistir convites por e-mail pendentes/enviados
    try {
      app.findCollectionByNameOrId('convites')
    } catch (_) {
      const rachasCol = app.findCollectionByNameOrId('rachas')
      const convitesCol = new Collection({
        name: 'convites',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          {
            name: 'racha',
            type: 'relation',
            required: true,
            collectionId: rachasCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'email', type: 'email', required: true },
          { name: 'rachaName', type: 'text' },
          { name: 'perPersonAmount', type: 'number', min: 0 },
          { name: 'invitedBy', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['enviado', 'pendente_smtp', 'aceito'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_convites_racha ON convites (racha)',
          'CREATE INDEX idx_convites_email ON convites (email)',
        ],
      })
      app.save(convitesCol)
    }

    app.save(usersCol)
    app.save(partCol)
    app.save(pagCol)
  },
  (app) => {
    try {
      const convitesCol = app.findCollectionByNameOrId('convites')
      app.delete(convitesCol)
    } catch (_) {}

    try {
      const pagCol = app.findCollectionByNameOrId('pagamentos')
      pagCol.removeIndex('idx_pagamentos_user')
      pagCol.fields.removeByName('user')
      app.save(pagCol)
    } catch (_) {}

    try {
      const partCol = app.findCollectionByNameOrId('participantes')
      partCol.removeIndex('idx_participantes_user')
      partCol.fields.removeByName('user')
      app.save(partCol)
    } catch (_) {}
  },
)
