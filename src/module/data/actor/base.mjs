import { systemID, systemPath } from '../../constants.mjs';
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
        }).reduce((obj, { label, rollKey }) => {
          obj[rollKey] = new fields.SchemaField({
            value: new fields.NumberField({ ...quality, label }),
          });

          return obj;
        }, {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.values(hi.CONFIG.combatAbilities).reduce((obj, { label, rollKey }) => {
        obj[rollKey] = new fields.SchemaField({
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
   * Apply an amount of damage to this actor.
   */
  async applyDamage(amount) {
    return this.parent.update({ 'system.lifeblood.value': this.lifeblood.value - amount });
  }

  /**
   * Calculate the maximum value of the lifeblood field.
   * @returns {number}
   */
  calcLifebloodMax() {
    return 1;
  }

  /**
   * Calculate the minimum value of the lifeblood field.
   * @returns {number}
   */
  calcLifebloodMin() {
    return -6;
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
    const flavor = game.i18n.localize(foundry.utils.getProperty(hi.CONFIG, characteristic)?.label);
    const value = foundry.utils.getProperty(this, characteristic)?.value ?? 0;

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
        value: this.parent.system.combatAbilities[modifiers.combatAbility].value,
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
  prepareDerivedData() {
    this.lifeblood.max = this.calcLifebloodMax();
    this.lifeblood.min = this.calcLifebloodMin();
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

  // TODO move lifeblood max to non-derived value

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if (hasProperty(changes, 'system.lifeblood')) {
      const max = this.calcLifebloodMax();
      const min = this.calcLifebloodMin();

      changes.system.lifeblood.value = Math.max(changes.system.lifeblood?.value ?? 0, min);
      if (max > 0) changes.system.lifeblood.value = Math.min(changes.system.lifeblood.value, max);
    }

    return super._preUpdate(changes, options, user);
  }

  /** @inheritDoc */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user);

    if (hasProperty(changed, 'system.qualities.might')) {
      const max = this.calcLifebloodMax();
      const min = this.calcLifebloodMin();

      let lb = Math.max(this.lifeblood.value, min);
      if (max > 0) lb = Math.min(lb, max);

      this.parent.update({ system: { lifeblood: { value: lb } } });
    }

    if (hasProperty(changed, 'system.lifeblood.value')) {
      if (changed.system.lifeblood.value === this.calcLifebloodMin()) {
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
