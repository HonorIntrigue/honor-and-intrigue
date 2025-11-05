import { systemPath } from '../../../../constants.mjs';
import { DocumentSheetMixin } from '../../../api/_module.mjs';

export default class PartySheet extends DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      openDetail: this.#onOpenDetail,
      openMember: this.#onOpenMember,
    },
    position: {
      height: 600,
      width: 800,
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
          boons: a.itemTypes['boon'].sort((a, b) => a.name.localeCompare(b.name)),
          careers: a.itemTypes['career'].sort((a, b) => a.sort - b.sort),
          flaws: a.itemTypes['flaw'].sort((a, b) => a.name.localeCompare(b.name)),
          lifebloodPercentage: Math.round(Math.clamp(a.system.lifeblood.value / a.system.lifeblood.max, 0, 1) * 100),
        }));
        break;
    }

    return context;
  }
}
