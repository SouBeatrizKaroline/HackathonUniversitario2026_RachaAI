migrate(
  (app) => {
    // 1. Collection 'carteiras': Caixas coletivos (repúblicas, grupos de estudantes, comissões)
    const carteirasCol = new Collection({
      name: 'carteiras',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule:
        "@request.auth.id != '' && owner = @request.auth.id || owner = null || isDemo = true",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id || owner = null",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'balance', type: 'number', required: true, min: 0 },
        { name: 'threshold', type: 'number', required: true, min: 1 }, // Ex: 2 aprovações necessárias
        { name: 'isDemo', type: 'bool' },
        { name: 'groupCode', type: 'text' },
        {
          name: 'owner',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_carteiras_groupCode ON carteiras (groupCode)',
        'CREATE INDEX idx_carteiras_owner ON carteiras (owner)',
      ],
    })
    app.save(carteirasCol)

    const carteirasId = carteirasCol.id

    // 2. Collection 'carteira_membros': Membros participantes da carteira compartilhada
    const membrosCol = new Collection({
      name: 'carteira_membros',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'carteira',
          type: 'relation',
          required: true,
          collectionId: carteirasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'select', values: ['admin', 'membro'], maxSelect: 1 },
        { name: 'totalContributed', type: 'number', min: 0 },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_carteira_membros_carteira ON carteira_membros (carteira)',
        'CREATE INDEX idx_carteira_membros_user ON carteira_membros (user)',
      ],
    })
    app.save(membrosCol)

    // 3. Collection 'carteira_movimentos': Contribuições (+) e Saídas aprovadas (-)
    const movimentosCol = new Collection({
      name: 'carteira_movimentos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'carteira',
          type: 'relation',
          required: true,
          collectionId: carteirasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['deposito', 'saida'],
          maxSelect: 1,
        },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'description', type: 'text', required: true },
        { name: 'authorName', type: 'text', required: true },
        { name: 'recipient', type: 'text' },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_carteira_movimentos_carteira ON carteira_movimentos (carteira)',
        'CREATE INDEX idx_carteira_movimentos_created ON carteira_movimentos (created DESC)',
      ],
    })
    app.save(movimentosCol)

    // 4. Collection 'carteira_propostas': Propostas de saída que exigem aprovação de múltiplos membros (multisig simulado)
    const propostasCol = new Collection({
      name: 'carteira_propostas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'carteira',
          type: 'relation',
          required: true,
          collectionId: carteirasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'recipient', type: 'text' },
        { name: 'proposerName', type: 'text', required: true },
        {
          name: 'proposerUser',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aprovada', 'rejeitada'],
          maxSelect: 1,
        },
        { name: 'requiredApprovals', type: 'number', required: true, min: 1 },
        { name: 'currentApprovals', type: 'number', min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_carteira_propostas_carteira ON carteira_propostas (carteira)',
        'CREATE INDEX idx_carteira_propostas_status ON carteira_propostas (status)',
      ],
    })
    app.save(propostasCol)

    const propostasId = propostasCol.id

    // 5. Collection 'carteira_aprovacoes': Registros de votos/aprovações de cada membro por proposta
    const aprovacoesCol = new Collection({
      name: 'carteira_aprovacoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'proposta',
          type: 'relation',
          required: true,
          collectionId: propostasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'approverName', type: 'text', required: true },
        {
          name: 'approverUser',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_carteira_aprovacoes_proposta ON carteira_aprovacoes (proposta)'],
    })
    app.save(aprovacoesCol)
  },
  (app) => {
    try {
      const aprovacoes = app.findCollectionByNameOrId('carteira_aprovacoes')
      app.delete(aprovacoes)
    } catch (_) {}
    try {
      const propostas = app.findCollectionByNameOrId('carteira_propostas')
      app.delete(propostas)
    } catch (_) {}
    try {
      const movimentos = app.findCollectionByNameOrId('carteira_movimentos')
      app.delete(movimentos)
    } catch (_) {}
    try {
      const membros = app.findCollectionByNameOrId('carteira_membros')
      app.delete(membros)
    } catch (_) {}
    try {
      const carteiras = app.findCollectionByNameOrId('carteiras')
      app.delete(carteiras)
    } catch (_) {}
  },
)
