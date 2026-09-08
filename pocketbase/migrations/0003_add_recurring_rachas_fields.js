migrate(
  (app) => {
    // 1. Extend 'rachas' collection with recurring group and billing month fields
    const rachasCol = app.findCollectionByNameOrId('rachas')

    if (!rachasCol.fields.getByName('isRecurring')) {
      rachasCol.fields.add(new BoolField({ name: 'isRecurring' }))
    }
    if (!rachasCol.fields.getByName('recurringGroupId')) {
      rachasCol.fields.add(new TextField({ name: 'recurringGroupId' }))
    }
    if (!rachasCol.fields.getByName('recurringGroupName')) {
      rachasCol.fields.add(new TextField({ name: 'recurringGroupName' }))
    }
    if (!rachasCol.fields.getByName('referenceMonth')) {
      rachasCol.fields.add(new TextField({ name: 'referenceMonth' }))
    }
    if (!rachasCol.fields.getByName('creatorNickname')) {
      rachasCol.fields.add(new TextField({ name: 'creatorNickname' }))
    }

    rachasCol.addIndex('idx_rachas_recurring', false, 'recurringGroupId', '')
    rachasCol.addIndex('idx_rachas_month', false, 'referenceMonth', '')
    app.save(rachasCol)
  },
  (app) => {
    try {
      const rachasCol = app.findCollectionByNameOrId('rachas')
      rachasCol.removeIndex('idx_rachas_recurring')
      rachasCol.removeIndex('idx_rachas_month')
      rachasCol.fields.removeByName('isRecurring')
      rachasCol.fields.removeByName('recurringGroupId')
      rachasCol.fields.removeByName('recurringGroupName')
      rachasCol.fields.removeByName('referenceMonth')
      rachasCol.fields.removeByName('creatorNickname')
      app.save(rachasCol)
    } catch (_) {}
  },
)
