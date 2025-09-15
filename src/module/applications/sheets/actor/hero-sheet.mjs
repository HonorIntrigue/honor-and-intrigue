import { systemID, systemPath } from '../../../constants.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      populateManeuvers: this.#onPopulateManeuvers,
      rollManeuver: this.#onRollManeuver,
      resetManeuvers: this.#onResetManeuvers,
      toggleManeuverMastery: this.#toggleManeuverMastery,
    },
    classes: ['hero'],
    window: {
      controls: [
        {
          action: 'resetManeuvers',
          icon: 'fa-solid fa-broom-wide',
          label: 'HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.Reset',
          ownership: 'OWNER',
        },
      ],
    },
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: { template: systemPath('templates/sheets/actor/base/sidebar.hbs') },
    header: { template: systemPath('templates/sheets/actor/base/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    character: { template: systemPath('templates/sheets/actor/hero/tabs/character.hbs'), scrollable: [''] },
    maneuvers: { template: systemPath('templates/sheets/actor/hero/tabs/maneuvers.hbs'), scrollable: [''] },
    inventory: { template: systemPath('templates/sheets/actor/hero/tabs/inventory.hbs'), scrollable: [''] },
    background: { template: systemPath('templates/sheets/actor/hero/tabs/background.hbs'), scrollable: [''] },
    effects: { template: systemPath('templates/sheets/actor/hero/tabs/effects.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'character',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Tabs',
      tabs: [{ id: 'character' }, { id: 'maneuvers' }, { id: 'inventory' }, { id: 'background' }, { id: 'effects' } ],
    },
  };

  /**
   * Adjusts the charcter's total advancement points.
   */
  static async #adjustAdvancementPoints(event, target) {
    let change = event.type === 'click' ? 1 : -1;
    if (event.shiftKey) change *= 5;
    this.document.update({ system: { advancementPoints: { value: this.document.system.advancementPoints.value + change } } });
  }

  /**
   * Adjusts the character's total fortune points.
   */
  static async #adjustFortune(event, target) {
    const change = event.type === 'click' ? 1 : -1;
    this.document.update({ system: { fortune: this.document.system.fortune + change } });
  }

  /**
   * Handle header control to reset the maneuvers content.
   */
  static async #onResetManeuvers(event) {
    const maneuvers = this.actor.itemTypes.maneuver;

    if (maneuvers.length > 0) {
      const confirm = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.Reset') },
        content: game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.ResetWarning'),
      });

      if (confirm) {
        await Item.deleteDocuments(maneuvers.map(m => m.id), { parent: this.actor });
      }
    }
  }

  /**
   * Begin rolling a maneuver.
   */
  static async #onRollManeuver(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    if (item?.type !== 'maneuver') return;

    const { abilityCheck } = item.system;
    const options = { modifiers: {} };

    if (abilityCheck.combatAbility) options.modifiers.combatAbility = abilityCheck.combatAbility;
    if (abilityCheck.flatModifier) options.modifiers.flat = abilityCheck.flatModifier;

    return this.actor.rollCharacteristic(`qualities.${abilityCheck.quality}`, options);
  }

  /**
   * Populate this actor with default maneuvers from the system compendium.
   */
  static async #onPopulateManeuvers(event, target) {
    const pack = game.packs.get(`${systemID}.maneuvers`);

    if (!pack || pack.index.size === 0) {
      ui.notifications.warn('Unable to load the system pack of maneuvers. Please check your compendium collection.');
      return;
    }

    const docs = await pack.getDocuments();
    const objs = docs.map(cd => cd.toObject());

    await Item.createDocuments(objs, { parent: this.actor });
    return this.render({ parts: ['maneuvers'] });
  }

  /**
   * Toggle the mastery status of a maneuver.
   */
  static async #toggleManeuverMastery(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    await item.update({ system: { isMastered: !item.system.isMastered } });
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const rankInputs = document.querySelectorAll('.tab-content input[data-name="career-rank"]');
    for (const input of rankInputs) {
      input.addEventListener('change', async (event) => {
        const { itemId } = event.target.closest('.item').dataset;
        const item = this.actor.items.get(itemId);

        await item.update({ system: { rank: event.target.value } });
      });
    }
  }

  /**
   * Prepare the context for the maneuvers view.
   * @return {Object|false} Returns false if this hero has no maneuvers.
   */
  async _prepareManeuversContext() {
    const maneuvers = (await this._prepareEmbeddedItemContext('maneuver')).sort((a, b) => a.item.name.localeCompare(b.item.name));

    if (maneuvers.length === 0) return false;

    return maneuvers.reduce((acc, curr) => {
      curr.hasMasteryBenefit = !!curr.item.system.mastery;
      curr.rollable = curr.item.system.requiresCheck || curr.item.system.requiresOpposedCheck;
      curr.tags = [];

      if (curr.item.system.requiresCheck) {
        let chk = [];

        if (curr.item.system.abilityCheck.quality) {
          chk.push(hi.CONFIG.qualities[curr.item.system.abilityCheck.quality].label);
        }
        if (curr.item.system.abilityCheck.combatAbility) {
          chk.push(hi.CONFIG.combatAbilities[curr.item.system.abilityCheck.combatAbility].label);
        }

        chk = chk.map(x => game.i18n.localize(x));
        curr.tags.push(chk.join(' + '));

        if (curr.item.system.requiresOpposedCheck) {
          chk = [];

          if (curr.item.system.abilityCheck.opposedBy.quality) {
            chk.push(hi.CONFIG.qualities[curr.item.system.abilityCheck.opposedBy.quality].label);
          }
          if (curr.item.system.abilityCheck.opposedBy.combatAbility) {
            chk.push(hi.CONFIG.combatAbilities[curr.item.system.abilityCheck.opposedBy.combatAbility].label);
          }
          chk = chk.map(x => game.i18n.localize(x));

          curr.tags.push('vs ' + chk.join(' + '));
        }
      }

      switch (curr.item.system.actionType) {
        case 0: acc.free.push(curr); break;
        case 1: acc.major.push(curr); break;
        case 2: acc.minor.push(curr); break;
        case 3: acc.reaction.push(curr); break;
      }

      return acc;
    }, { major: [], minor: [], free: [], reaction: [] });
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'character':
        context.careers = await this._prepareEmbeddedItemContext('career');
        break;
      case 'maneuvers':
        context.maneuvers = await this._prepareManeuversContext();
        break;
    }

    return context;
  }
}
