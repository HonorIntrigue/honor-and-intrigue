import { systemPath } from '../../../constants.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class VillainSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
    },
    classes: ['villain'],
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: { template: systemPath('templates/sheets/actor/base/sidebar.hbs') },
    header: { template: systemPath('templates/sheets/actor/base/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    background: { template: systemPath('templates/sheets/actor/villain/tabs/background.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'background',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Tabs',
      tabs: [{ id: 'background' }],
    },
  };

  /**
   * Adjusts the character's total fortune points.
   */
  static async #adjustFortune(event, target) {
    const change = event.type === 'click' ? 1 : -1;
    this.document.update({ system: { fortune: this.document.system.fortune + change } });
  }

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
