migrate(
  (app) => {
    // 1. Create rachas collection
    const rachasCollection = new Collection({
      name: 'rachas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['República', 'Comida', 'Viagem', 'Faculdade', 'Evento', 'Outro'],
          maxSelect: 1,
        },
        { name: 'totalAmount', type: 'number', required: true, min: 0 },
        { name: 'splitType', type: 'select', values: ['equal', 'custom'], maxSelect: 1 },
        { name: 'shareCode', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'isDemo', type: 'bool' },
        { name: 'solanaRecipient', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_rachas_shareCode ON rachas (shareCode)',
        'CREATE INDEX idx_rachas_created ON rachas (created DESC)',
      ],
    })
    app.save(rachasCollection)

    const rachasId = rachasCollection.id

    // 2. Create participantes collection
    const participantesCollection = new Collection({
      name: 'participantes',
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
          collectionId: rachasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'paid', type: 'bool' },
        { name: 'paidAt', type: 'text' },
        { name: 'txHash', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_participantes_racha ON participantes (racha)'],
    })
    app.save(participantesCollection)

    // 3. Create pagamentos / historico collection
    const pagamentosCollection = new Collection({
      name: 'pagamentos',
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
          collectionId: rachasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'participantName', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'status', type: 'select', values: ['Confirmado', 'Pendente'], maxSelect: 1 },
        { name: 'txHash', type: 'text' },
        { name: 'timestamp', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pagamentos_racha ON pagamentos (racha)',
        'CREATE INDEX idx_pagamentos_created ON pagamentos (created DESC)',
      ],
    })
    app.save(pagamentosCollection)
  },
  (app) => {
    try {
      const pagamentos = app.findCollectionByNameOrId('pagamentos')
      app.delete(pagamentos)
    } catch (_) {}
    try {
      const participantes = app.findCollectionByNameOrId('participantes')
      app.delete(participantes)
    } catch (_) {}
    try {
      const rachas = app.findCollectionByNameOrId('rachas')
      app.delete(rachas)
    } catch (_) {}
  },
)
