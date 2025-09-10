import { DocumentSheetMixin } from '../api/_module.mjs';

export default class HonorIntrigueItemSheet extends DocumentSheetMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['item'],
  };

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.description, {
      rollData: this.document.getRollData(),
      secrets: this.document.isOwner,
    });

    return context;
  }
}
