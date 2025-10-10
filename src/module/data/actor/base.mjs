import { systemID } from '../../constants.mjs';
import { HonorIntrigueRoll } from '../../rolls/_module.mjs';
import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;
const { hasProperty } = foundry.utils;

export default class BaseActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc **/
  static defineSchema() {
    const schema = {};

    const quality = { min: -1, max: 6, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.values(hi.CONFIG.qualities)
        .filter(({ types }) => {
          if (!types) return true;
          return types.some(t => this.metadata.type === t);
        }).reduce((obj, { label, rollKey }) => ({
          ...obj,
          [rollKey]: new fields.NumberField({ ...quality, label }),
        }), {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.values(hi.CONFIG.combatAbilities).reduce((obj, { label, rollKey }) => ({
        ...obj,
        [rollKey]: new fields.NumberField({ ...combatAbility, label }),
      }), {}),
    );

    schema.lifeblood = new fields.SchemaField({
      max: new fields.NumberField({ min: 1, initial: 1, integer: true, nullable: false }),
      min: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      value: new fields.NumberField({ min: -6, initial: 1, integer: true, nullable: false, required: true }),
    });
    schema.notes = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }

  /**
   * Get the base value for computing lifeblood.
   */
  get baseLifeblood() {
    return 10;
  }

  /**
   * Flag that indicates if the max value of lifeblood should be derived from Might.
   */
  get isLifebloodMightDerived() {
    return true;
  }

  /**
   * Apply an amount of damage to this actor.
   */
  async applyDamage(amount) {
    return this.parent.update({ 'system.lifeblood.value': this.lifeblood.value - amount });
  }

  /**
   * Adjust roll data for the actor subtype.
   * @param rollData
   */
  modifyRollData(rollData) {
    for (const [key, val] of Object.entries(this.qualities)) {
      rollData[hi.CONFIG.qualities[key].rollKey] = val;
    }

    for (const [key, val] of Object.entries(this.combatAbilities)) {
      rollData[hi.CONFIG.combatAbilities[key].rollKey] = val;
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
    const flavor = game.i18n.localize(foundry.utils.getProperty(hi.CONFIG, characteristic)?.label);
    const value = foundry.utils.getProperty(this, characteristic) ?? 0;

    options.system ??= {};
    options.system.quality = { key: foundry.utils.getProperty(hi.CONFIG, characteristic).rollKey, value };
    options.system.modifiers ??= {};
    options.type ??= 'quality';

    // TODO enrich header with:
    // speakerActor.img
    // user.name

    const result = await HonorIntrigueRoll.prompt({
      ...options,
      actor: this.parent,
      quality: value,
      characteristic,
      data,
      flavor,
      title: options.title ?? flavor,
    });

    if (!result) return;

    const { modifiers, rollMode, rolls } = result;

    if (modifiers.combatAbility && modifiers.combatAbility !== 'none') {
      options.system.modifiers.combatAbility = {
        key: hi.CONFIG.combatAbilities[modifiers.combatAbility].rollKey,
        value: this.parent.system.combatAbilities[modifiers.combatAbility],
      };
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await this.parent.getEmbeddedDocument('Item', modifiers.career);
      options.system.modifiers.career = {
        key: career.name,
        value: career.system.rank,
      };
    }

    options.system.modifiers.bonuses = modifiers.bonuses;
    options.system.modifiers.penalties = modifiers.penalties;
    options.system.modifiers.flatModifier = modifiers.flat;

    const messageData = {
      flags: { core: { canPopout: true }, [systemID]: (options.flags || {}) },
      flavor: options.title ?? flavor,
      rolls,
      rollMode,
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      system: options.system,
      title: options.title ?? flavor,
      type: options.type,
    };

    return ChatMessage.create(messageData);
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const changes = { prototypeToken: { disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE } };

    if (this.isLifebloodMightDerived) {
      changes.system = { lifeblood: {} };
      changes.system.lifeblood.max = changes.system.lifeblood.value = this.baseLifeblood + this.qualities.might;
    }

    this.parent.updateSource(changes);
    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    let { min, max } = this.lifeblood;

    if (hasProperty(changes, 'system.qualities.might')) {
      if (max && this.isLifebloodMightDerived) {
        max = this.baseLifeblood + changes.system.qualities.might;
        changes.system.lifeblood.max = max;
      }
    }

    if (hasProperty(changes, 'system.lifeblood.value')) {
      changes.system.lifeblood.value = Math.max(changes.system.lifeblood.value, min);
      if (max) changes.system.lifeblood.value = Math.min(changes.system.lifeblood.value, max);
    }

    return true;
  }

  /** @inheritDoc */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user);

    if (hasProperty(changed, 'system.lifeblood.value')) {
      if (changed.system.lifeblood.value === this.lifeblood.min) {
        this.parent.toggleStatusEffect('dead', { active: true });
        this.parent.toggleStatusEffect('dying', { active: false });
      } else if (changed.system.lifeblood.value <= 0) {
        this.parent.toggleStatusEffect('dead', { active: false });
        this.parent.toggleStatusEffect('dying', { active: true });
      } else {
        this.parent.toggleStatusEffect('dead', { active: false });
        this.parent.toggleStatusEffect('dying', { active: false });
      }
    }
  }
}
