import { systemPath } from '../../constants.mjs';
import { HonorIntrigueRoll } from '../../rolls/_module.mjs';
import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class BaseActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc **/
  static defineSchema() {
    const schema = {};

    const quality = { min: -1, max: 6, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.entries(hi.CONFIG.qualities).reduce((obj, [q, { label }]) => {
        obj[q] = new fields.SchemaField({
          value: new fields.NumberField({ ...quality, label }),
        });

        return obj;
      }, {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.entries(hi.CONFIG.combatAbilities).reduce((obj, [ca, { label }]) => {
        obj[ca] = new fields.SchemaField({
          value: new fields.NumberField({ ...combatAbility, label }),
        });

        return obj;
      }, {}),
    );

    schema.lifeblood = new fields.SchemaField({
      value: new fields.NumberField({ min: -6, initial: 1, integer: true, nullable: false }),
    });
    schema.notes = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }

  /**
   * Calculate the maximum value of the lifeblood field.
   * @returns {number}
   */
  calcLifebloodMax() {
    return 1;
  }

  /**
   * Adjust roll data for the actor subtype.
   * @param rollData
   */
  modifyRollData(rollData) {
    for (const [key, obj] of Object.entries(this.qualities)) {
      rollData[hi.CONFIG.qualities[key].rollKey] = obj.value;
    }

    for (const [key, obj] of Object.entries(this.combatAbilities)) {
      rollData[hi.CONFIG.combatAbilities[key].rollKey] = obj.value;
    }
  }

  /**
   * Prompt the user to roll a characteristic.
   * @param characteristic
   * @param options
   * @returns {Promise<messageData>|undefined}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const data = this.parent.getRollData();
    const flavor = game.i18n.localize(foundry.utils.getProperty(hi.CONFIG, characteristic).label);
    const value = foundry.utils.getProperty(this, characteristic)?.value ?? 0;

    // TODO enrich header with:
    // speakerActor.img
    // user.name

    const result = await HonorIntrigueRoll.prompt({
      actor: this.parent,
      quality: value,
      characteristic,
      data,
      flavor,
      title: flavor,
    });

    if (!result) return;

    const { modifiers, rollMode, rolls } = result;
    const flavorModifiers = [];

    flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
      ability: flavor,
      number: `${value >= 0 ? '+' : ''}${value}`,
    }));

    if (modifiers.combatAbility && modifiers.combatAbility !== 'none') {
      const abilityValue = this.parent.system.combatAbilities[modifiers.combatAbility].value;

      flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
        ability: game.i18n.localize(hi.CONFIG.combatAbilities[modifiers.combatAbility].label),
        number: `${abilityValue >= 0 ? '+' : ''}${abilityValue}`,
      }));
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await this.parent.getEmbeddedDocument('Item', modifiers.career);

      flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Ability', {
        ability: career.name,
        number: `+${career.system.rank}`,
      }));
    }

    if (modifiers.bonuses > 0) flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.BonusDice', { number: modifiers.bonuses }));
    if (modifiers.penalties > 0) flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.PenaltyDice', { number: modifiers.penalties }));
    if (modifiers.flat !== 0) flavorModifiers.push(game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Modifier.Flat', { number: `${(modifiers.flat > 0 ? '+' : '')}${modifiers.flat}` }));

    const messageData = {
      flags: { core: { canPopout: true } },
      flavor: await foundry.applications.handlebars.renderTemplate(systemPath('templates/rolls/chat-message-flavor.hbs'), {
        characteristic: game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Flavor.Characteristic', { characteristic: flavor }),
        modifiers: flavorModifiers,
      }),
      rolls,
      rollMode,
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      title: flavor,
    };

    return ChatMessage.create(messageData, { rollMode });
  }

  /** @inheritDoc */
  prepareDerivedData() {
    this.lifeblood.max = this.calcLifebloodMax();
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      system: { lifeblood: { value: this.calcLifebloodMax() } },
      prototypeToken: {
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      },
    });

    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if (changes.system?.lifeblood) {
      changes.system.lifeblood = {
        value: Math.clamp(changes.system.lifeblood?.value ?? 0, 0, this.calcLifebloodMax()),
      };
    }

    return super._preUpdate(changes, options, user);
  }

  /** @inheritDoc */
  async _onUpdate(changes, options, user) {
    if (changes.system?.qualities?.might) {
      this.parent.update({
        system: { lifeblood: { value: Math.clamp(this.lifeblood.value, 0, this.calcLifebloodMax()) } },
      });
    }

    return super._onUpdate(changes, options, user);
  }
}
