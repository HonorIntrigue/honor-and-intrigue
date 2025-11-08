import { systemPath } from '../../../constants.mjs';
import CharacterActorSheet from './character-actor-sheet.mjs';

export default class HeroSheet extends CharacterActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
    },
  };

  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    background: { template: systemPath('templates/sheets/actor/hero/background.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    ...super.TABS,
    primary: {
      ...super.TABS.primary,
      tabs: super.TABS.primary.tabs.concat({ id: 'background' }),
    },
  };

  /**
   * Adjusts the charcter's total advancement points.
   */
  static async #adjustAdvancementPoints(event) {
    let change = event.type === 'click' ? 1 : -1;
    if (event.shiftKey) change *= 5;
    this.actor.update({ system: { advancementPoints: { value: Math.max(0, this.actor.system.advancementPoints.value + change) } } });
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'background':
        context.enrichedBackground = (await Promise.all(
          Object.entries(this.actor.system.background)
            .map(async ([key, value]) => ({ [key]: await foundry.applications.ux.TextEditor.implementation.enrichHTML(value, { secrets: this.document.isOwner }) })),
        )).reduce((acc, curr) => ({ ...acc, ...curr }), {});
        break;
    }

    return context;
  }
}
