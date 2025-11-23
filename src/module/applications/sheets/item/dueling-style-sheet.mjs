import { systemPath } from '../../../constants.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class DuelingStyleSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    details: { template: systemPath('templates/sheets/item/duelingStyle/details.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    ...super.TABS,
    primary: {
      ...super.TABS.primary,
      tabs: [{ id: 'description' }, { id: 'details' }, { id: 'rules' }],
    },
  };

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.benefit = {
      description: await hi.utils.enrichedFieldToContext(
        this.document,
        context.systemFields.benefit.fields.description,
        this.document.system.benefit.description,
      ),
    };
    context.finalSecret = {
      description: await hi.utils.enrichedFieldToContext(
        this.document,
        context.systemFields.finalSecret.fields.description,
        this.document.system.finalSecret.description,
      ),
    };

    return context;
  }
}
