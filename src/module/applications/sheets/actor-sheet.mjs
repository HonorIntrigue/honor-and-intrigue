import { DocumentSheetMixin } from '../api/_module.mjs';

export default class HonorIntrigueActorSheet extends DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      deleteItem: this.#onDeleteItem,
      openItem: this.#onOpenItem,
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
   * Toggle the expanded state of an embedded item.
   */
  static async #toggleItemExpanded(event, target) {
    const { itemId } = target.closest('.item').dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest('[data-application-part]').dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /**
   * Prepare the context for an embedded item type.
   */
  async _prepareEmbeddedItemContext(itemType, additionalContextFn = undefined) {
    if (!this.actor.itemTypes[itemType]) return {};

    return (await Promise.all(this.actor.itemTypes[itemType].map(async (item) => {
      const ctx = await this._prepareItemContext(item);

      if (additionalContextFn) {
        Object.assign(ctx, (await additionalContextFn.call(item)));
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
        context.inventory = await this._prepareEmbeddedItemContext('weapon');
        break;
    }

    return context;
  }
}
