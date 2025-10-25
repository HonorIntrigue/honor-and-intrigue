import { systemPath } from '../../../constants.mjs';
import { HonorIntrigueActor } from '../../../documents/_module.mjs';
import HonorIntrigueItemSheet from './item-sheet.mjs';

export default class CareerItemSheet extends HonorIntrigueItemSheet {
  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/item/base/header.hbs') },
    sidebar: { template: systemPath('templates/sheets/item/career/sidebar.hbs') },
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
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === 'sidebar') {
      context.isActorCareer = !!this.actor || this.document?.parent instanceof HonorIntrigueActor;
    }

    return context;
  }
}
