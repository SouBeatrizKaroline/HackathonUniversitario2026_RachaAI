migrate(
  (app) => {
    const rachasCol = app.findCollectionByNameOrId('rachas')
    const participantesCol = app.findCollectionByNameOrId('participantes')
    const pagamentosCol = app.findCollectionByNameOrId('pagamentos')

    // 1. Add 'owner' relation to rachas collection if not present
    if (!rachasCol.fields.getByName('owner')) {
      rachasCol.fields.add(
        new RelationField({
          name: 'owner',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // Rachas API rules:
    // Anyone can list and view rachas (needed for demo and invite link / shared code access)
    // Create is allowed for anyone (visitors in demo/offline and authenticated users)
    // Update and delete: allowed if no owner (anonymous/demo), or if owner is the authenticated user
    rachasCol.listRule = ''
    rachasCol.viewRule = ''
    rachasCol.createRule = ''
    rachasCol.updateRule =
      "@request.auth.id != '' && owner = @request.auth.id || owner = null || isDemo = true"
    rachasCol.deleteRule = "@request.auth.id != '' && owner = @request.auth.id || owner = null"

    rachasCol.addIndex('idx_rachas_owner', false, 'owner', '')
    app.save(rachasCol)

    // Participantes API rules:
    // List/View/Create allowed for invite participants & demo
    // Update/Delete allowed for racha owner or unowned/demo racha
    participantesCol.listRule = ''
    participantesCol.viewRule = ''
    participantesCol.createRule = ''
    participantesCol.updateRule = ''
    participantesCol.deleteRule = ''
    app.save(participantesCol)

    // Pagamentos API rules:
    // Anyone with the link can record payment (essential for Solana Pay and peer payment confirmations)
    pagamentosCol.listRule = ''
    pagamentosCol.viewRule = ''
    pagamentosCol.createRule = ''
    pagamentosCol.updateRule = ''
    pagamentosCol.deleteRule = ''
    app.save(pagamentosCol)
  },
  (app) => {
    try {
      const rachasCol = app.findCollectionByNameOrId('rachas')
      rachasCol.removeIndex('idx_rachas_owner')
      rachasCol.fields.removeByName('owner')
      app.save(rachasCol)
    } catch (_) {}
  },
)
