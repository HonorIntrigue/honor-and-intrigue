import { systemPath } from '../../../../constants.mjs';
import HonorIntrigueActorSheet from '../actor-sheet.mjs';

export default class PartySheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      openDetail: this.#onOpenDetail,
      openMember: this.#onOpenMember,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    header: { template: systemPath('templates/sheets/actor/party/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    overview: { template: systemPath('templates/sheets/actor/party/overview.hbs'), scrollable: [''] },
    stash: { template: systemPath('templates/sheets/actor/party/stash.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'overview',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Tabs',
      tabs: [{ id: 'overview' }, { id: 'stash' }],
    },
  };

  /**
   * Opens the details for an item embedded in a party member.
   */
  static async #onOpenDetail(event, target) {
    const { itemId } = target.closest('[data-item-id]').dataset;
    const { memberUuid } = target.closest('.party-member').dataset;
    const member = await fromUuid(memberUuid);
    const item = member.items.get(itemId);

    if (item) item.sheet.render(true);
  }

  /**
   * Opens the sheet for a party member.
   */
  static async #onOpenMember(event, target) {
    const { memberUuid } = target.closest('.party-member').dataset;
    const member = await fromUuid(memberUuid);

    if (member) member.sheet.render(true);
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'overview':
        context.members = (await Promise.all(context.system.members.map(async m => fromUuid(m)))).map(a => ({
          ...a,
          uuid: a.uuid,
          boons: a.itemTypes['boon'].sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang)),
          careers: a.itemTypes['career'].sort((a, b) => a.sort - b.sort),
          flaws: a.itemTypes['flaw'].sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang)),
          composurePercentage: Math.round(Math.clamp(a.system.composure / 3, 0, 1) * 100),
          lifebloodPercentage: Math.round(Math.clamp(a.system.lifeblood.value / a.system.lifeblood.max, 0, 1) * 100),
        }));
        break;
      case 'stash': {
        const [armor, equipment, treasure, weapon] = await Promise.all([
          super._prepareEmbeddedItemContext('armor'),
          super._prepareEmbeddedItemContext('equipment'),
          super._prepareEmbeddedItemContext('treasure'),
          super._prepareEmbeddedItemContext('weapon'),
        ]);
        context.stash = { armor, equipment, treasure, weapon };
        break;
      }
    }

    return context;
  }
}
