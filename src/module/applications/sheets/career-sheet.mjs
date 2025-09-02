import { systemPath } from '../../constants.mjs';
import { DocumentSheetMixin } from '../api/_module.mjs';

export default class CareerItemSheet extends DocumentSheetMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['career'],
    position: {
      height: 450,
      width: 900,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/career/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/career/sidebar.hbs') },
    content: { template: systemPath('templates/sheets/item/career/sheet.hbs') },
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
