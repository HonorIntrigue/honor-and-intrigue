import { systemPath } from '../../../constants.mjs';
import { DocumentSheetMixin } from '../../api/_module.mjs';

export default class HonorIntrigueItemSheet extends DocumentSheetMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['item'],
    position: {
      height: 450,
      width: 900,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/base/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/base/sidebar.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    description: { template: systemPath('templates/sheets/item/base/tabs/description.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'description',
      labelPrefix: 'HONOR_INTRIGUE.Item.Sheet.Tabs',
      tabs: [{ id: 'description' }],
    },
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
