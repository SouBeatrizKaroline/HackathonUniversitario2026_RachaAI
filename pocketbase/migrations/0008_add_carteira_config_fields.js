migrate(
  (app) => {
    const carteirasCol = app.findCollectionByNameOrId('carteiras')

    // 1. Campo de preferências de notificação por membro (formato JSON)
    if (!carteirasCol.fields.getByName('notif_preferences')) {
      carteirasCol.fields.add(
        new JSONField({
          name: 'notif_preferences',
          maxSize: 2000000,
        }),
      )
    }

    // 2. Garantir campo threshold existente e correto
    if (!carteirasCol.fields.getByName('threshold')) {
      carteirasCol.fields.add(
        new NumberField({
          name: 'threshold',
          min: 1,
        }),
      )
    }

    app.save(carteirasCol)

    // 3. Atualizar registros existentes que não possuem threshold definido (default = 2)
    try {
      app
        .db()
        .newQuery('UPDATE carteiras SET threshold = 2 WHERE threshold IS NULL OR threshold < 1')
        .execute()
    } catch (_) {}
  },
  (app) => {
    try {
      const carteirasCol = app.findCollectionByNameOrId('carteiras')
      const notifField = carteirasCol.fields.getByName('notif_preferences')
      if (notifField) {
        carteirasCol.fields.removeByName('notif_preferences')
        app.save(carteirasCol)
      }
    } catch (_) {}
  },
)
