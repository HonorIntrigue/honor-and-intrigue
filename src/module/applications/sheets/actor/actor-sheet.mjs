import { systemPath } from '../../../constants.mjs';
import { HonorIntrigueProtectionRoll } from '../../../rolls/_module.mjs';
import { determineManeuverOutcome } from '../../../utils/rollUtils.mjs';
import { DocumentSheetMixin } from '../../api/_module.mjs';

export default class HonorIntrigueActorSheet extends DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      addItem: this.#onAddItem,
      adjustItem: this.#onAdjustItem,
      deleteItem: this.#onDeleteItem,
      openItem: this.#onOpenItem,
      populateManeuvers: this.#onPopulateManeuvers,
      resetManeuvers: this.#onResetManeuvers,
      rollCharacteristic: this.#onRollCharacteristic,
      rollItem: this.#onRollItem,
      rollItemDamage: this.#onRollItemDamage,
      rollTaggedManeuver: this.#onRollTaggedManeuver,
      toggleItemEquipped: this.#toggleItemEquipped,
      toggleItemExpanded: this.#toggleItemExpanded,
      toggleManeuverMastery: this.#toggleManeuverMastery,
    },
    classes: ['actor'],
    position: {
      height: 800,
      width: 900,
    },
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
    sidebar: { template: systemPath('templates/sheets/actor/base/sidebar.hbs'), scrollable: ['.characteristics-grid-container'] },
    header: { template: systemPath('templates/sheets/actor/base/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    character: { template: systemPath('templates/sheets/actor/shared/character.hbs'), scrollable: [''] },
    maneuvers: { template: systemPath('templates/sheets/actor/shared/maneuvers.hbs'), scrollable: [''] },
    inventory: { template: systemPath('templates/sheets/actor/shared/inventory.hbs'), scrollable: [''] },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'character',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Tabs',
      tabs: [{ id: 'character' }, { id: 'maneuvers' }, { id: 'inventory' }],
    },
  };

  /**
   * A set of expanded items.
   * @type {Set<String>}
   */
  #expanded = new Set();

  /**
   * Add a new inline item.
   */
  static async #onAddItem(event, target) {
    const { type } = target.dataset;
    const options = { type, name: game.i18n.localize(`HONOR_INTRIGUE.Item.Defaults.ItemName.${type}`) };
    const renderSheet = ['boon', 'career', 'flaw', 'maneuver'].includes(type);

    if (type === 'maneuver') {
      options.system = { actionType: target.dataset.actionType };
    }

    const [item] = await this.actor.createEmbeddedDocuments('Item', [options]);

    if (renderSheet) {
      return item.sheet.render(true);
    }
  }

  /**
   * Adjusts the quantity of an item.
   */
  static async #onAdjustItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);
    const field = item.type === 'career' ? 'rank' : 'quantity';
    let change = target.dataset.adjustment === 'increment' ? 1 : -1;

    if (change === -1 && item.system[field] === 0) {
      return HonorIntrigueActorSheet.#onDeleteItem.call(this, event, target);
    }

    if (event.shiftKey) change *= 5;
    else if (event.ctrlKey) change *= 10;

    return item.update({ [`system.${field}`]: Math.max(0, item.system[field] + change) });
  }

  /**
   * Delete an embedded item.
   */
  static async #onDeleteItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    const confirm = event.shiftKey || (await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.format('HONOR_INTRIGUE.Dialog.Confirm.DeleteWithPlaceholder', { item: item.name }) },
      content: game.i18n.localize('HONOR_INTRIGUE.Dialog.Confirm.DeleteItem'),
    }));

    if (confirm) {
      await item.delete();
    }
  }

  /**
   * Open an item sheet.
   */
  static #onOpenItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    item.sheet.render(true);
  }

  /**
   * Populate this actor with default maneuvers from the system compendium.
   */
  static async #onPopulateManeuvers() {
    const pack = game.packs.get(`${hi.CONST.systemID}.maneuvers`);

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
   * Handle header control to reset the maneuvers content.
   */
  static async #onResetManeuvers() {
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
   * Begin rolling a characteristic such as a Quality or Combat Ability.
   * @param event
   * @param target Should have the target characteristic in its "dataset" field, such as <code>dataset.characteristic.qualities.might</code>.
   */
  static async #onRollCharacteristic(event, target) {
    return this.actor.rollCharacteristic(target.dataset.characteristic);
  }

  /**
   * Begin rolling a rollable item entry.
   */
  static async #onRollItem(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    if (item?.type === 'armor' && item.system.protection) {
      const result = await HonorIntrigueProtectionRoll.roll([item]);
      return ChatMessage.create({
        flavor: game.i18n.localize('HONOR_INTRIGUE.Chat.Roll.Flavor.Protection'),
        rolls: [result],
        sound: CONFIG.sounds.dice,
        speaker: ChatMessage.getSpeaker({ actor: this.parent }),
        system: {
          protectionItems: { itemId: { formula: item.protection, name: item.name } },
        },
        type: 'damageResult',
      }, { rollMode: game.settings.get('core', 'rollMode') });
    } else if (item?.type === 'maneuver') {
      return this.#rollManeuver(item);
    }
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
   * Roll a maneuver from a tagged item link.
   */
  static async #onRollTaggedManeuver(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    const { itemUuid } = target.dataset;
    const maneuver = this.actor.itemTypes.maneuver.find(m => m._stats.compendiumSource === itemUuid) || await fromUuid(itemUuid);

    return this.#rollManeuver(maneuver, { system: { relatedItemUuid: item.uuid } });
  }

  /**
   * Cycle the equipped state of an item.
   */
  static async #toggleItemEquipped(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);
    const nextPosition = (
      item.system.carriedPosition === 0 ? 1 : (
        item.system.carriedPosition === 1 ? 2 : 0
      )
    );

    await item.update({ system: { carriedPosition: nextPosition } });
  }

  /**
   * Toggle the expanded state of an embedded item.
   */
  static async #toggleItemExpanded(event, target) {
    const { itemId } = target.closest('.item').dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest('[data-application-part]').dataset.applicationPart;
    this.render({ parts: [part] });
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
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (!this.document.isOwner) this._restrictLimited(parts);
    return parts;
  }

  /**
   * Generate the list of context menu options for items in an item-list.
   * @returns {ContextMenuEntry[]}
   */
  _getItemListContextOptions() {
    return [{
      name: 'HONOR_INTRIGUE.Actor.Sheet.Tooltips.SendToChat',
      icon: '<i class="fa-solid fa-message-lines"></i>',
      callback: async (target) => {
        const { itemId } = target.dataset;
        const item = this.actor.items.get(itemId);

        return ChatMessage.create({
          content: item.system.description,
          flavor: `${game.i18n.localize(`TYPES.Item.${item.type}`)}: ${item.name}`,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        });
      },
    }];
  }

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    this._createContextMenu(this._getItemListContextOptions, '.item-list .item[data-item-id]', { parentClassHooks: false });
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

  /** @inheritDoc */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);

    return {
      ...ctx,
      actorType: this.document.type ?? 'actor',
      atALoss: this.document.statuses.has('at-a-loss'),
      enrichedNotes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.notes, {
        rollData: this.document.getRollData(),
        secrets: this.document.isOwner,
      }),
      getValueField: (type, name) => this.document.system.schema.getField(`${type}.${name}`),
      getValueFieldValue: (type, name) => foundry.utils.getProperty(this.document.system, `${type}.${name}`),
      hasArcanePower: this.document.itemTypes['career'].some(c => c.system.isArcane),
    };
  }

  /**
   * Prepare the context for an embedded item type.
   */
  async _prepareEmbeddedItemContext(itemType, additionalContextFn = undefined) {
    if (!this.actor.itemTypes[itemType]) return {};

    return (await Promise.all(this.actor.itemTypes[itemType].map(async (item) => {
      const ctx = await this._prepareItemContext(item);

      if (additionalContextFn) {
        foundry.utils.mergeObject(ctx, (await additionalContextFn(item)));
      }

      return ctx;
    }))).sort((a, b) => a.item.sort - b.item.sort);
  }

  /**
   * Generate inline context for an embedded item.
   * @param {HonorIntrigueItem} item
   * @returns {Promise<Object>}
   */
  async _prepareItemContext(item) {
    const context = {
      item,
      expanded: this.#expanded.has(item.id),
    };

    if (context.expanded) {
      context.embed = await item.system.toEmbed({ includeName: false });
    }

    return context;
  }

  /**
   * Prepare the context for the maneuvers view.
   * @return {Object|false} Returns false if this hero has no maneuvers.
   */
  async _prepareManeuversContext() {
    const maneuvers = (await this._prepareEmbeddedItemContext('maneuver')).sort((a, b) => a.item.name.localeCompare(b.item.name, game.i18n.lang));

    if (maneuvers.length === 0) return false;

    return maneuvers.reduce((acc, curr) => {
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
      case 'character': {
        const [careers, boons, flaws] = await Promise.all([
          this._prepareEmbeddedItemContext('career'),
          this._prepareEmbeddedItemContext('boon'),
          this._prepareEmbeddedItemContext('flaw'),
        ]);

        context.careers = careers;
        context.boons = boons.sort((a, b) => a.item.name.localeCompare(b.item.name, game.i18n.lang));
        context.flaws = flaws.sort((a, b) => a.item.name.localeCompare(b.item.name, game.i18n.lang));
        break;
      }
      case 'inventory':
        context.inventory = {
          armor: await this._prepareEmbeddedItemContext('armor', (item) => ({
            item: {
              system: {
                carriedPositionIcon: `fa-light ${item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Dropped ? 'fa-bars' : item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held ? 'fa-solid fa-shirt illuminate' : 'fa-sack'}`,
                carriedPositionLabel: game.i18n.localize(hi.CONFIG.equipmentCarryChoices[item.system.carriedPosition].label),
              },
            },
            rollable: !!item.system.protection,
          })),
          equipment: await this._prepareEmbeddedItemContext('equipment'),
          treasure: await this._prepareEmbeddedItemContext('treasure'),
          weapon: await this._prepareEmbeddedItemContext('weapon', (item) => ({
            item: {
              system: {
                carriedPositionIcon: `fa-light ${item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Dropped ? 'fa-bars' : item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held ? 'fa-solid fa-shirt illuminate' : 'fa-sack'}`,
                carriedPositionLabel: game.i18n.localize(hi.CONFIG.equipmentCarryChoices[item.system.carriedPosition].label),
              },
            },
          })),
        };
        break;
      case 'maneuvers':
        context.maneuvers = await this._prepareManeuversContext();
        context.offensiveEquipment = await this._prepareOffensiveEquipment();
        break;
    }

    return context;
  }

  /** @inheritDoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (!this.document.isOwner && group === 'primary') this._restrictLimited(tabs);
    return tabs;
  }

  /**
   * Removes tabs for viewers with limited permission.
   * @param {Record<string, any>} data The parts or tabs object to modify.
   */
  _restrictLimited(data) {
    for (const key in data) {
      if (!['header', 'sidebar', 'content', 'character', 'background'].includes(key)) delete data[key];
    }
  }
}
