migrate(
  (app) => {
    const rachasCol = app.findCollectionByNameOrId('rachas')
    const partCol = app.findCollectionByNameOrId('participantes')
    const pagCol = app.findCollectionByNameOrId('pagamentos')

    // Check if demo racha already exists
    try {
      app.findFirstRecordByData('rachas', 'shareCode', 'viagem-congresso-7k2m')
      return // Already seeded
    } catch (_) {}

    // Create Demo Racha
    const demoRacha = new Record(rachasCol)
    demoRacha.set('name', 'Viagem para Congresso Universitário')
    demoRacha.set('category', 'Faculdade')
    demoRacha.set('totalAmount', 480)
    demoRacha.set('splitType', 'equal')
    demoRacha.set('shareCode', 'viagem-congresso-7k2m')
    demoRacha.set(
      'description',
      'Rateio de vans, ingressos coletivos e hospedagem no congresso nacional da área.',
    )
    demoRacha.set('isDemo', true)
    app.save(demoRacha)

    const demoId = demoRacha.id

    // Seed participants: Ana (paid), Beatriz, Carlos, João (paid), Lucas, Marina
    const participantsData = [
      { name: 'Ana', amount: 80, paid: true, paidAt: 'hoje, 14:32', txHash: '8xK2...3fPq' },
      { name: 'Beatriz', amount: 80, paid: false, paidAt: '', txHash: '' },
      { name: 'Carlos', amount: 80, paid: false, paidAt: '', txHash: '' },
      { name: 'João', amount: 80, paid: true, paidAt: 'hoje, 11:15', txHash: '5mQ9...7yLt' },
      { name: 'Lucas', amount: 80, paid: false, paidAt: '', txHash: '' },
      { name: 'Marina', amount: 80, paid: false, paidAt: '', txHash: '' },
    ]

    for (const p of participantsData) {
      const pRec = new Record(partCol)
      pRec.set('racha', demoId)
      pRec.set('name', p.name)
      pRec.set('amount', p.amount)
      pRec.set('paid', p.paid)
      if (p.paidAt) pRec.set('paidAt', p.paidAt)
      if (p.txHash) pRec.set('txHash', p.txHash)
      app.save(pRec)
    }

    // Seed history
    const historyData = [
      {
        participantName: 'Ana',
        amount: 80,
        status: 'Confirmado',
        txHash: '8xK2...3fPq',
        timestamp: 'hoje, 14:32',
      },
      {
        participantName: 'João',
        amount: 80,
        status: 'Confirmado',
        txHash: '5mQ9...7yLt',
        timestamp: 'hoje, 11:15',
      },
    ]

    for (const h of historyData) {
      const hRec = new Record(pagCol)
      hRec.set('racha', demoId)
      hRec.set('participantName', h.participantName)
      hRec.set('amount', h.amount)
      hRec.set('status', h.status)
      hRec.set('txHash', h.txHash)
      hRec.set('timestamp', h.timestamp)
      app.save(hRec)
    }
  },
  (app) => {
    try {
      const demo = app.findFirstRecordByData('rachas', 'shareCode', 'viagem-congresso-7k2m')
      app.delete(demo)
    } catch (_) {}
  },
)
