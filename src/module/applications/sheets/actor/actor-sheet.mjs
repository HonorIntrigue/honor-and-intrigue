import { DocumentSheetMixin } from '../../api/_module.mjs';

export default class HonorIntrigueActorSheet extends DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      addBoonFlaw: this.#onAddBoonFlaw,
      addCareer: this.#onAddCareer,
      deleteItem: this.#onDeleteItem,
      openItem: this.#onOpenItem,
      rollCharacteristic: this.#onRollCharacteristic,
      toggleItemEquipped: this.#toggleItemEquipped,
      toggleItemExpanded: this.#toggleItemExpanded,
    },
    classes: ['actor'],
    position: {
      height: 800,
      width: 900,
    },
  };

  /**
   * A set of expanded items.
   * @type {Set<String>}
   */
  #expanded = new Set();

  /**
   * Add a Boon or Flaw to the actor.
   */
  static async #onAddBoonFlaw(event, target) {
    return new foundry.applications.api.DialogV2({
      window: { title: 'HONOR_INTRIGUE.Dialog.NewBoonOrFlaw.Title' },
      content: '',
      buttons: [{
        action: 'boon',
        label: 'HONOR_INTRIGUE.Dialog.NewBoonOrFlaw.ButtonBoon',
        style: { minWidth: '100px' },
      }, {
        action: 'flaw',
        label: 'HONOR_INTRIGUE.Dialog.NewBoonOrFlaw.ButtonFlaw',
        style: { minWidth: '100px' },
      }],
      submit: async (type) => {
        const [item] = await this.actor.createEmbeddedDocuments('Item', [{ type, name: game.i18n.localize(type === 'boon' ? 'HONOR_INTRIGUE.Item.Defaults.BoonName' : 'HONOR_INTRIGUE.Item.Defaults.FlawName') }]);
        return item.sheet.render(true);
      },
    }).render(true);
  }

  /**
   * Add a Career entry to the document.
   */
  static async #onAddCareer(event, target) {
    const [item] = await this.actor.createEmbeddedDocuments('Item', [{ type: 'career', name: game.i18n.localize('HONOR_INTRIGUE.Item.Defaults.CareerName') }]);
    return item.sheet.render(true);
  }

  /**
   * Delete an embedded item.
   */
  static async #onDeleteItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    const confirm = event.shiftKey || (await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.format('HONOR_INTRIGUE.Dialog.Confirm.DeleteWithPlaceholder', { item: item.name }) },
      content: game.i18n.localize('HONOR_INTRIGUE.Dialog.Confirm.DeleteItem'),
    }));

    if (confirm) {
      await item.delete();
    }
  }

  /**
   * Open an item sheet.
   */
  static #onOpenItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    item.sheet.render(true);
  }

  /**
   * Begin rolling a characteristic such as a Quality or Combat Ability.
   * @param event
   * @param target Should have the target characteristic in its "dataset" field, such as <code>dataset.characteristic.qualities.might</code>.
   */
  static async #onRollCharacteristic(event, target) {
    return this.actor.rollCharacteristic(target.dataset.characteristic);
  }

  /**
   * Cycle the equipped state of an item.
   */
  static async #toggleItemEquipped(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);
    const nextPosition = (
      item.system.carriedPosition === 0 ? 1 : (
        item.system.carriedPosition === 1 ? 2 : 0
      )
    );

    await item.update({ system: { carriedPosition: nextPosition } });
  }

  /**
   * Toggle the expanded state of an embedded item.
   */
  static async #toggleItemExpanded(event, target) {
    const { itemId } = target.closest('.item').dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest('[data-application-part]').dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);

    return {
      ...ctx,
      actorType: this.document.type ?? 'actor',
      atALoss: this.document.statuses.has('at-a-loss'),
      enrichedNotes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.notes, {
        rollData: this.document.getRollData(),
        secrets: this.document.isOwner,
      }),
      getValueField: (type, name) => this.document.system.schema.getField(`${type}.${name}`),
      getValueFieldValue: (type, name) => foundry.utils.getProperty(this.document.system, `${type}.${name}`),
    };
  }

  /**
   * Prepare the context for an embedded item type.
   */
  async _prepareEmbeddedItemContext(itemType, additionalContextFn = undefined) {
    if (!this.actor.itemTypes[itemType]) return {};

    return (await Promise.all(this.actor.itemTypes[itemType].map(async (item) => {
      const ctx = await this._prepareItemContext(item);

      if (additionalContextFn) {
        foundry.utils.mergeObject(ctx, (await additionalContextFn(item)));
      }

      return ctx;
    }))).sort((a, b) => a.item.sort - b.item.sort);
  }

  /**
   * Generate inline context for an embedded item.
   * @param {HonorIntrigueItem} item
   * @returns {Promise<Object>}
   */
  async _prepareItemContext(item) {
    const context = {
      item,
      expanded: this.#expanded.has(item.id),
    };

    if (context.expanded) {
      context.embed = await item.system.toEmbed({ includeName: false });
    }

    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'inventory':
        context.inventory = {
          armor: await this._prepareEmbeddedItemContext('armor', (item) => ({
            item: {
              system: {
                carriedPositionIcon: `fa-light ${item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Dropped ? 'fa-bars' : item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held ? 'fa-solid fa-shirt illuminate' : 'fa-sack'}`,
                carriedPositionLabel: game.i18n.localize(hi.CONFIG.equipmentCarryChoices[item.system.carriedPosition].label),
              },
            },
            rollable: !!item.system.protection,
          })),
          weapons: await this._prepareEmbeddedItemContext('weapon', (item) => ({
            item: {
              system: {
                carriedPositionIcon: `fa-light ${item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Dropped ? 'fa-bars' : item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held ? 'fa-solid fa-shirt illuminate' : 'fa-sack'}`,
                carriedPositionLabel: game.i18n.localize(hi.CONFIG.equipmentCarryChoices[item.system.carriedPosition].label),
              },
            },
          })),
        };
        break;
    }

    return context;
  }
}
