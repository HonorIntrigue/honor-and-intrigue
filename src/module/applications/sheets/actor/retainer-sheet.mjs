import { systemPath } from '../../../constants.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class RetainerSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['retainer'],
    position: {
      height: 700,
      width: 800,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: { template: systemPath('templates/sheets/actor/base/sidebar.hbs') },
    header: { template: systemPath('templates/sheets/actor/base/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    background: { template: systemPath('templates/sheets/actor/retainer/tabs/background.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'background',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Tabs',
      tabs: [{ id: 'background' }],
    },
  };

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'background':
        context.careers = await this._prepareEmbeddedItemContext('career');
        break;
    }

    return context;
  }
}
