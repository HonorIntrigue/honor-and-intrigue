import { systemID, systemPath } from '../../../constants.mjs';
import { determineManeuverOutcome } from '../../../utils/rollUtils.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
      adjustAdvantage: this.#adjustAdvantage,
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      populateManeuvers: this.#onPopulateManeuvers,
      rollCompendiumManeuver: this.#onRollCompendiumManeuver,
      rollItemDamage: this.#onRollItemDamage,
      rollManeuver: this.#onRollManeuver,
      resetManeuvers: this.#onResetManeuvers,
      toggleAdvantagePanel: this.#toggleAdvantagePanel,
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
   * Reference to the element holding the advantage panel.
   */
  #advantageEl;

  /**
   * Adjusts the charcter's total advancement points.
   */
  static async #adjustAdvancementPoints(event, target) {
    let change = event.type === 'click' ? 1 : -1;
    if (event.shiftKey) change *= 5;
    this.document.update({ system: { advancementPoints: { value: this.document.system.advancementPoints.value + change } } });
  }

  /**
   * Adjusts the character's advantage.
   */
  static async #adjustAdvantage(event, target) {
    const change = target.dataset.adjustment === 'increment' ? 1 : -1;
    this.actor.update({ system: { advantage: this.actor.system.advantage + change } });
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
   * Roll a maneuver from a compendium link.
   */
  static async #onRollCompendiumManeuver(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    const { itemUuid } = target.dataset;
    const maneuver = this.actor.itemTypes.maneuver.find(m => m._stats.compendiumSource === itemUuid) || await fromUuid(itemUuid);

    return this.#rollManeuver(maneuver, { system: { relatedItemUuid: item.uuid } });
  }

  /**
   * Roll damage for an item.
   */
  static async #onRollItemDamage(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    if (item?.type !== 'weapon') return;

    return item.system.rollDamage();
  }

  /**
   * Begin rolling a maneuver.
   */
  static async #onRollManeuver(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    if (item?.type !== 'maneuver') return;

    return this.#rollManeuver(item);
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
    const objs = docs.map(cd => game.items.fromCompendium(cd));

    await Item.implementation.createDocuments(objs, { parent: this.actor });
    return this.render({ parts: ['maneuvers'] });
  }

  /**
   * Toggle the expanded advantage side panel.
   */
  static async #toggleAdvantagePanel() {
    this.#advantageEl?.classList.toggle('expanded');
  }

  /**
   * Toggle the mastery status of a maneuver.
   */
  static async #toggleManeuverMastery(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    await item.update({ system: { isMastered: !item.system.isMastered } });
  }

  /**
   * Parse a maneuver for its roll options and kick off the roll.
   */
  async #rollManeuver(maneuver, options = {}) {
    const { abilityCheck } = maneuver.system;
    options.modifiers ??= {};
    options.system ??= {};
    options.system.maneuver = maneuver.uuid;
    options.title ??= game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Flavor.Maneuver', { maneuver: maneuver.name });
    options.type = 'maneuver';

    if (abilityCheck.combatAbility) options.modifiers.combatAbility = abilityCheck.combatAbility;
    if (abilityCheck.flatModifier) options.modifiers.flat = abilityCheck.flatModifier;

    if (maneuver.system.isMastered && /^bonus die/i.test(maneuver.system.mastery)) options.modifiers.bonuses = 1;

    const message = await this.actor.rollCharacteristic(`qualities.${abilityCheck.quality}`, options);
    if (message) message.update({ 'system.outcome': determineManeuverOutcome(message.rolls[0]) });

    return message;
  }

  /** @inheritDoc */
  _onPosition(position) {
    if (this.#advantageEl) {
      this.#advantageEl.style.left = `${position.width}px`;
    }
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

    const qtyInputs = document.querySelectorAll('.tab-content input[data-name="item-quantity"]');
    for (const input of qtyInputs) {
      input.addEventListener('change', async (event) => {
        const { itemId } = event.target.closest('.item').dataset;
        const item = this.actor.items.get(itemId);

        await item.update({ system: { quantity: event.target.value } });
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

  /**
   * Prepare the context for all offensive weapons and equipment.
   */
  async _prepareOffensiveEquipment() {
    const weapons = await Promise.all(this.actor.items
      .filter(i => i.type === 'weapon')
      .filter(w => w.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held)
      .map(async w => {
        w.maneuvers = await Promise.all(Array.from(w.system.maneuvers).map(async m => await fromUuid(m)));
        return w;
      }));

    return [...weapons];
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'character':
        context.boons = await this._prepareEmbeddedItemContext('boon');
        context.careers = await this._prepareEmbeddedItemContext('career');
        context.flaws = await this._prepareEmbeddedItemContext('flaw');
        break;
      case 'maneuvers':
        context.maneuvers = await this._prepareManeuversContext();
        context.offensiveEquipment = await this._prepareOffensiveEquipment();
        break;
    }

    return context;
  }

  /** @inheritDoc */
  async _renderHTML(context, options) {
    const [img, label] =
      this.actor.system.advantage === 0 ? ['advantage_defeated', 'Defeated'] :
        this.actor.system.advantage === 1 ? ['advantage_scrambling', 'Scrambling'] :
          this.actor.system.advantage === 2 ? ['advantage_retreating', 'Retreating'] :
            ['advantage_en-garde', 'EnGarde'];
    const htmlString = await foundry.applications.handlebars.renderTemplate(systemPath('templates/sheets/actor/partials/advantage-panel.hbs'), {
      advantage: this.actor.system.advantage,
      advantageLevelImg: systemPath(`assets/images/${img}.webp`),
      advantageLevelLabel: game.i18n.localize(`HONOR_INTRIGUE.Actor.Sheet.Labels.Advantage.${label}`),
      offset: this.element.style.width,
    });
    const tempEl = document.createElement('div');
    tempEl.innerHTML = htmlString;

    const expanded = this.#advantageEl?.classList.contains('expanded');
    this.#advantageEl = tempEl.firstElementChild;
    this.#advantageEl.classList.toggle('expanded', !!expanded);

    return await super._renderHTML(context, options);
  }

  /** @inheritDoc */
  _replaceHTML(result, content, options) {
    super._replaceHTML(result, content, options);

    const priorEl = this.element.querySelector('.advantage-panel');

    if (priorEl) {
      priorEl.replaceWith(this.#advantageEl);
    } else {
      this.element.insertAdjacentElement('beforeend', this.#advantageEl);
    }
  }
}
