migrate(
  (app) => {
    const carteirasCol = app.findCollectionByNameOrId('carteiras')
    const membrosCol = app.findCollectionByNameOrId('carteira_membros')
    const movimentosCol = app.findCollectionByNameOrId('carteira_movimentos')
    const propostasCol = app.findCollectionByNameOrId('carteira_propostas')
    const aprovacoesCol = app.findCollectionByNameOrId('carteira_aprovacoes')

    // Verificar se a carteira demo já existe
    try {
      app.findFirstRecordByData('carteiras', 'groupCode', 'rep-aloprados-demo')
      return // Já populado
    } catch (_) {}

    // 1. Criar Carteira Demo da República Aloprados
    const demoCarteira = new Record(carteirasCol)
    demoCarteira.set('name', 'Caixa Coletivo da República Aloprados')
    demoCarteira.set(
      'description',
      'Fundo de reserva para despesas comuns, manutenções emergenciais e compras coletivas da casa.',
    )
    demoCarteira.set('balance', 620)
    demoCarteira.set('threshold', 2)
    demoCarteira.set('isDemo', true)
    demoCarteira.set('groupCode', 'rep-aloprados-demo')
    app.save(demoCarteira)

    const carteiraId = demoCarteira.id

    // 2. Criar Membros (4 membros da república)
    const membrosData = [
      { name: 'Lucas', role: 'admin', totalContributed: 200 },
      { name: 'Mateus', role: 'membro', totalContributed: 180 },
      { name: 'Rodrigo', role: 'membro', totalContributed: 120 },
      { name: 'Gabriel', role: 'membro', totalContributed: 120 },
    ]

    for (const m of membrosData) {
      const mRec = new Record(membrosCol)
      mRec.set('carteira', carteiraId)
      mRec.set('name', m.name)
      mRec.set('role', m.role)
      mRec.set('totalContributed', m.totalContributed)
      app.save(mRec)
    }

    // 3. Criar Movimentações históricas
    const movimentosData = [
      {
        type: 'deposito',
        amount: 200,
        description: 'Contribuição mensal fundo de reserva',
        authorName: 'Lucas',
      },
      {
        type: 'deposito',
        amount: 180,
        description: 'Sobra da compra de mantimentos da semana',
        authorName: 'Mateus',
      },
      {
        type: 'deposito',
        amount: 240,
        description: 'Depósito conjunto para fundo emergencial',
        authorName: 'Rodrigo & Gabriel',
      },
      {
        type: 'saida',
        amount: 150,
        description: 'Troca de lâmpadas LED e reparo no chuveiro',
        authorName: 'Lucas',
        recipient: 'Materiais de Construção São João',
      },
      {
        type: 'deposito',
        amount: 150,
        description: 'Depósito de reposição de caixa',
        authorName: 'Mateus',
      },
    ]

    for (const mov of movimentosData) {
      const movRec = new Record(movimentosCol)
      movRec.set('carteira', carteiraId)
      movRec.set('type', mov.type)
      movRec.set('amount', mov.amount)
      movRec.set('description', mov.description)
      movRec.set('authorName', mov.authorName)
      if (mov.recipient) movRec.set('recipient', mov.recipient)
      app.save(movRec)
    }

    // 4. Criar Proposta pendente com 1 de 2 aprovações
    const propRec = new Record(propostasCol)
    propRec.set('carteira', carteiraId)
    propRec.set('title', 'Conserto emergencial da fechadura eletrônica')
    propRec.set('amount', 140)
    propRec.set('recipient', 'Chaveiro Central Universitário')
    propRec.set('proposerName', 'Mateus')
    propRec.set('status', 'pendente')
    propRec.set('requiredApprovals', 2)
    propRec.set('currentApprovals', 1)
    app.save(propRec)

    // 5. Adicionar a 1ª aprovação já realizada por Lucas
    const aprovRec = new Record(aprovacoesCol)
    aprovRec.set('proposta', propRec.id)
    aprovRec.set('approverName', 'Lucas')
    app.save(aprovRec)
  },
  (app) => {
    try {
      const demo = app.findFirstRecordByData('carteiras', 'groupCode', 'rep-aloprados-demo')
      app.delete(demo)
    } catch (_) {}
  },
)
