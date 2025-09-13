import { systemPath } from '../../constants.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      addCareer: this.#onAddCareer,
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      rollCharacteristic: this.#onRollCharacteristic,
      toggleManeuverMastery: this.#toggleManeuverMastery,
    },
    classes: ['hero'],
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: { template: systemPath('templates/sheets/actor/hero/sidebar.hbs') },
    header: { template: systemPath('templates/sheets/actor/hero/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    character: { template: systemPath('templates/sheets/actor/hero/tabs/character.hbs') },
    maneuvers: { template: systemPath('templates/sheets/actor/hero/tabs/maneuvers.hbs') },
    inventory: { template: systemPath('templates/sheets/actor/hero/tabs/inventory.hbs') },
    background: { template: systemPath('templates/sheets/actor/hero/tabs/background.hbs') },
    effects: { template: systemPath('templates/sheets/actor/hero/tabs/effects.hbs') },
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
   * Add a Career entry to the document.
   */
  static async #onAddCareer(event, target) {

  }

  /**
   * Begin rolling a characteristic such as a Quality or Combat Ability.
   * @param event
   * @param target Should have the target characteristic in its "dataset" field, such as <code>dataset.characteristic.qualities.might</code>.
   */
  static async #onRollCharacteristic(event, target) {
    return this.actor.rollCharacteristic(target.dataset.characteristic);
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
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);

    return {
      ...ctx,
      getValueField: (type, name) => this.document.system.schema.getField(`${type}.${name}.value`),
      getValueFieldValue: (type, name) => foundry.utils.getProperty(this.document.system, `${type}.${name}.value`),
    };
  }

  /**
   * Prepare the context for the maneuvers view.
   */
  async _prepareManeuversContext() {
    const maneuvers = (await this._prepareEmbeddedItemContext('maneuver')).sort((a, b) => a.item.name.localeCompare(b.item.name));

    return maneuvers.reduce((acc, curr) => {
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
      case 'maneuvers':
        context.maneuvers = await this._prepareManeuversContext();
        break;
    }

    return context;
  }
}
