export default base => {
  /**
   * Adds CRUD actions for embedded items.
   */
  return class ItemCRUDMixin extends base {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      actions: {
        addItem: this.#onAddItem,
        adjustItem: this.#onAdjustItem,
        deleteItem: this.#onDeleteItem,
        openItem: this.#onOpenItem,
      },
    };

    /**
     * Add a new inline item.
     */
    static async #onAddItem(event, target) {
      const { type } = target.dataset;
      const options = { type, name: game.i18n.localize(`HONOR_INTRIGUE.Item.Defaults.ItemName.${type}`) };
      const renderSheet = ['boon', 'career', 'flaw', 'maneuver'].includes(type);

      if (type === 'maneuver') {
        options.system = { actionType: target.dataset.actionType };
      }

      const [item] = await this.document.createEmbeddedDocuments('Item', [options]);

      if (renderSheet) {
        return item.sheet.render(true);
      }
    }

    /**
     * Adjusts the quantity of an item.
     */
    static async #onAdjustItem(event, target) {
      const { itemId } = target.closest('.item').dataset;
      const item = this.document.items.get(itemId);
      const field = item.type === 'career' ? 'rank' : 'quantity';
      let change = target.dataset.adjustment === 'increment' ? 1 : -1;

      if (change === -1 && item.system[field] === 0) {
        return ItemCRUDMixin.#onDeleteItem.call(this, event, target);
      }

      if (event.shiftKey) change *= 5;
      else if (event.ctrlKey) change *= 10;

      return item.update({ [`system.${field}`]: Math.max(0, item.system[field] + change) });
    }

    /**
     * Delete an embedded item.
     */
    static async #onDeleteItem(event, target) {
      const { itemId } = target.closest('.item').dataset;
      const item = this.document.items.get(itemId);

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
      const item = this.document.items.get(itemId);

      item.sheet.render(true);
    }
  };
};
