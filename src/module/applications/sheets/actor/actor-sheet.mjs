import { systemPath } from '../../../constants.mjs';
import { HonorIntrigueProtectionRoll } from '../../../rolls/_module.mjs';
import { determineManeuverOutcome } from '../../../utils/rollUtils.mjs';
import { DocumentSheetMixin, ItemCRUDMixin } from '../../api/_module.mjs';

export default class HonorIntrigueActorSheet extends ItemCRUDMixin(DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2)) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      loadWeapon: this.#onLoadWeapon,
      rollCharacteristic: this.#onRollCharacteristic,
      rollItem: this.#onRollItem,
      rollItemDamage: this.#onRollItemDamage,
      rollTaggedManeuver: this.#onRollTaggedManeuver,
      toggleItemEquipped: this.#toggleItemEquipped,
      toggleItemExpanded: this.#toggleItemExpanded,
    },
    classes: ['actor'],
    position: {
      height: 800,
      width: 900,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: {
      template: systemPath('templates/sheets/actor/base/sidebar.hbs'),
      scrollable: ['.characteristics-grid-container'],
    },
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
   * Updates the load counter of a weapon.
   */
  static async #onLoadWeapon(event, target) {
    const { itemId } = target.closest('.item[data-item-id]').dataset;
    const item = this.actor.items.get(itemId);
    const change = event.type === 'click' ? 1 : -1;

    if (change === 1 && item.system.isLoaded) return;

    return item.update({ system: { loadActions: { spent: item.system.loadActions.spent + change } } });
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
    } else if (item?.type === 'action') {
      return this.#rollAction(item);
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

    if (item?.type !== 'action' && item?.type !== 'weapon') return;

    return item.system.rollDamage();
  }

  /**
   * Roll a maneuver from a tagged item link.
   */
  static async #onRollTaggedManeuver(event, target) {
    const { itemId } = target.closest('.item').dataset;
    const item = this.actor.items.get(itemId);

    if (!item.system.isLoaded) await ui.notifications.warn('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.UseUnloaded', { localize: true });

    const { itemUuid } = target.dataset;
    const maneuver = this.actor.itemTypes.maneuver.find(m => m._stats.compendiumSource === itemUuid) || await fromUuid(itemUuid);

    const result = await this.#rollManeuver(maneuver, { system: { relatedItemUuid: item.uuid } });

    if (item.system.loadActions?.needed > 0 && result) {
      await item.update({ system: { 'loadActions.spent': 0 } });
    }
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
    const { itemId } = target.closest('[data-item-id]').dataset;

    if (this.#expanded.has(itemId)) this.#expanded.delete(itemId);
    else this.#expanded.add(itemId);

    const part = target.closest('[data-application-part]').dataset.applicationPart;
    this.render({ parts: [part] });
  }

  /**
   * Parses an action for its roll options and kicks off the roll.
   */
  async #rollAction(action, options = {}) {
    return this.actor.system.rollManeuver(action, {
      ...options,
      title: game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Flavor.Action', { action: action.name }),
    });
  }

  /**
   * Parses a maneuver for its roll options and kicks off the roll.
   */
  async #rollManeuver(maneuver, options = {}) {
    return this.actor.system.rollManeuver(maneuver, options);
  }

  /**
   * Adjusts the height of a prose-mirror element.
   * @param {EditorView} proseEditor
   * @param {MouseEvent|PointerEvent} event
   */
  async adjustProseHeight(proseEditor, event) {
    const change = event.type === 'click' ? 1 : -1;
    const el = proseEditor.view.dom.closest('prose-mirror');
    const currValue = getComputedStyle(el).getPropertyValue('--min-height').replace('px', '');

    if (currValue) {
      const scale = event.shiftKey ? 40 : 20;
      const newValue = `${parseInt(currValue) + (change * scale)}px`;
      el.style.setProperty('--min-height', newValue);

      if (el.name && this.document.system.elementOverrides) {
        const fieldName = el.name.replaceAll('.', '_');
        await this.document.update({
          'system.elementOverrides': {
            ...this.document.system.elementOverrides,
            [fieldName]: {
              ...this.document.system.elementOverrides[fieldName],
              '--min-height': newValue,
            },
          },
        }, { render: false });
      }
    }
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

    Hooks.on('proseMirrorMenu.activateListeners', (prose, html) => {
      if (!this.element.contains(html)) return;

      const btn = html.querySelector('button[data-action="adjust-height"]');
      if (btn) {
        btn.addEventListener('click', (evt) => this.adjustProseHeight(prose, evt));
        btn.addEventListener('contextmenu', (evt) => this.adjustProseHeight(prose, evt));
      }
    });
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const rankInputs = this.element.querySelectorAll('.tab-content input[data-name="career-rank"]');
    for (const input of rankInputs) {
      input.addEventListener('change', async (event) => {
        const { itemId } = event.target.closest('.item').dataset;
        const item = this.actor.items.get(itemId);

        await item.update({ system: { rank: event.target.value } });
      });
    }

    const qtyInputs = this.element.querySelectorAll('.tab-content input[data-name="item-quantity"]');
    for (const input of qtyInputs) {
      input.addEventListener('change', async (event) => {
        const { itemId } = event.target.closest('.item').dataset;
        const item = this.actor.items.get(itemId);

        await item.update({ system: { quantity: event.target.value } });
      });
    }

    const loadBtns = this.element.querySelectorAll('.tab-content button[data-action="loadWeapon"]');
    for (const btn of loadBtns) {
      btn.addEventListener('contextmenu', async (event) => HonorIntrigueActorSheet.#onLoadWeapon.call(this, event, event.target));
    }

    if (this.actor.system.elementOverrides) {
      for (const [key, overrides] of Object.entries(this.actor.system.elementOverrides)) {
        const el = this.element.querySelector(`[name="${key.replaceAll('_', '.')}"]`);

        if (el) {
          for (const [k, v] of Object.entries(overrides)) {
            el.style.setProperty(k, v);
          }
        }
      }
    }
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);

    return {
      ...ctx,
      actorType: this.document.type ?? 'actor',
      atALoss: this.document.statuses.has('at-a-loss'),
      hasArcanePower: this.document.itemTypes['career'].some(c => c.system.isArcane),
      notes: {
        enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.notes, {
          rollData: this.document.getRollData(),
          secrets: this.document.isOwner,
        }),
        field: ctx.systemFields.notes,
        value: this.document.system.notes,
      },
    };
  }

  /**
   * Prepare the context for an embedded item type.
   * @param {String} itemType Core type of embedded Item, as per Foundry itemType grouping.
   * @param {Function} [additionalContextFn] Optional function that adds context to the returned items.
   * @param {Function} [sortFn] Optional function to use for sorting the resulting item set.
   */
  async _prepareEmbeddedItemContext(itemType, additionalContextFn = undefined, sortFn = undefined) {
    if (!this.actor.itemTypes[itemType]) return {};

    const items = await Promise.all(this.actor.itemTypes[itemType].map(async (item) => {
      const ctx = await this._prepareItemContext(item);

      if (additionalContextFn) {
        foundry.utils.mergeObject(ctx, await additionalContextFn(item));
      }

      return ctx;
    }));

    if (sortFn) return items.sort(sortFn);

    return items.sort((a, b) => a.item.sort - b.item.sort);
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
    const maneuvers = (await this._prepareEmbeddedItemContext('maneuver')).sort(this._sortItemByName);

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

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'character': {
        const [careers, boons, flaws, duelingStyles] = await Promise.all([
          this._prepareEmbeddedItemContext('career'),
          this._prepareEmbeddedItemContext('boon', undefined, this._sortItemByName),
          this._prepareEmbeddedItemContext('flaw', undefined, this._sortItemByName),
          this._prepareEmbeddedItemContext('duelingStyle'),
        ]);

        context.careers = careers;
        context.boons = boons;
        context.flaws = flaws;
        context.duelingStyles = duelingStyles.sort((a, b) => {
          if (a.item.system.active && !b.item.system.active) return -1;
          else if (!a.item.system.active && b.item.system.active) return 1;

          return this._sortItemByName(a, b);
        });
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
          }), this._sortItemByName),
          equipment: await this._prepareEmbeddedItemContext('equipment', undefined, this._sortItemByName),
          treasure: await this._prepareEmbeddedItemContext('treasure', undefined, this._sortItemByName),
          weapon: await this._prepareEmbeddedItemContext('weapon', (item) => ({
            item: {
              system: {
                carriedPositionIcon: `fa-light ${item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Dropped ? 'fa-bars' : item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held ? 'fa-solid fa-shirt illuminate' : 'fa-sack'}`,
                carriedPositionLabel: game.i18n.localize(hi.CONFIG.equipmentCarryChoices[item.system.carriedPosition].label),
              },
            },
          }), this._sortItemByName),
        };
        break;
      case 'maneuvers':
        context.actions = await this._prepareEmbeddedItemContext('action', (item) => ({
          ...item,
          rollable: item.system.requiresCheck || item.system.requiresOpposedCheck,
        }), this._sortItemByName);
        context.maneuvers = await this._prepareManeuversContext();
        context.readiedEquipment = await this._prepareReadiedEquipment();
        break;
    }

    return context;
  }

  /**
   * Prepare the context for all offensive weapons and equipment.
   */
  async _prepareReadiedEquipment() {
    const weapons = await Promise.all(this.actor.items
      .filter(i => i.type === 'weapon')
      .filter(w => w.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held)
      .map(async w => {
        w.maneuvers = (await Promise.all(Array.from(w.system.maneuvers).map(async m => await fromUuid(m))))
          .filter(m => m.system.requiresCheck)
          .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
        return { item: { ...w, id: w.id, type: 'readiedEquipment' } };
      }));

    return weapons.sort(this._sortItemByName);
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

  /**
   * Helper function to sort embedded item entries by name.
   */
  _sortItemByName(a, b) {
    return a.item.name.localeCompare(b.item.name, game.i18n.lang);
  }
}
