import { systemID } from '../../constants.mjs';
import { HonorIntrigueRoll } from '../../rolls/_module.mjs';
import HonorIntrigueSystemModel from '../system-model.mjs';

export default class ShipActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'ship' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    const quality = { min: 0, max: 5, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.values(hi.CONFIG.shipQualities).reduce((obj, { label, rollKey }) => ({
        ...obj,
        [rollKey]: new fields.NumberField({ ...quality, label }),
      }), {}),
    );

    schema.duties = new fields.SchemaField(
      Object.entries(hi.CONFIG.shipDuties).reduce((obj, [key, { label }]) => ({
        ...obj,
        [key]: new fields.DocumentUUIDField({ label, required: false, type: 'Actor' }),
      }), {}),
    );

    schema.class = new fields.StringField();
    schema.complement = new fields.SchemaField({
      value: new fields.NumberField({ min: 0.0, initial: 1.0, nullable: false }),
    });
    schema.notes = new fields.HTMLField({ textSearch: true });
    schema.timber = new fields.SchemaField({
      min: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      value: new fields.NumberField({ initial: 10, integer: true, nullable: false }),
    });

    return schema;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.complement.display = this.complement.value * 100;
    this.timber.max = 10 + (10 * this.qualities.size) + (5 * this.qualities.hull);

    this.tons = {};
    this.tons.max = Math.max(5, 10 * this.qualities.size);
    this.tons.reserved = { value: this.qualities.size * (this.qualities.guns === 0 ? 0.5 : this.qualities.guns) };
    this.tons.value = this.tons.reserved.value; // TODO add cargo weight

    this.tons.percentage = Math.round(this.tons.value / this.tons.max * 100);
    this.tons.reserved.percentage = Math.round(this.tons.reserved.value / this.tons.value * 100);

    if (this.tons.value > this.tons.max) {
      this.tons.overburdened = { limit: 12 * this.qualities.size };
      this.tons.overburdened.exceeded = this.tons.value > this.tons.overburdened.limit;
    }
  }

  /**
   * Prompt the user to roll a characteristic. As this is a ship, the roll dialog will use the invoking user actor's attributes.
   * @param characteristic
   * @param options
   * @returns {Promise<messageData>|undefined}
   */
  async rollCharacteristic(characteristic, options = {}) {
    const actor = ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    if (!actor) return;

    const shipQuality = hi.CONFIG.shipQualities[characteristic.split('.').at(-1)];
    if (!shipQuality) return;

    const data = this.parent.getRollData();
    const flavor = game.i18n.localize(shipQuality.label);
    const value = foundry.utils.getProperty(this, characteristic) ?? 0;

    options.system ??= {};
    options.system.quality = { key: shipQuality.rollKey, value };
    options.system.modifiers ??= {};
    options.title = game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Flavor.ShipQuality', {
      actor: actor.name,
      ship: this.parent.name,
      quality: flavor,
    });
    options.type ??= 'quality';

    const result = await HonorIntrigueRoll.prompt({
      ...options,
      actor,
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
        value: actor.system.combatAbilities[modifiers.combatAbility],
      };
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await actor.getEmbeddedDocument('Item', modifiers.career);
      options.system.modifiers.career = {
        key: career.name,
        value: career.system.rank,
      };
    }

    options.system.modifiers.difficulty = modifiers.difficulty;
    options.system.modifiers.bonuses = modifiers.bonuses;
    options.system.modifiers.penalties = modifiers.penalties;
    options.system.modifiers.flatModifier = modifiers.flat;

    return ChatMessage.create({
      flags: { core: { canPopout: true }, [systemID]: (options.flags || {}) },
      flavor: options.title ?? flavor,
      rolls,
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor }),
      system: options.system,
      title: options.title ?? flavor,
      type: options.type,
    }, { rollMode });
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      tons: { value: Math.max(5, 10 * this.qualities.size) },
    });
    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (foundry.utils.hasProperty(changes, 'system.complement.value')) {
      changes.system.complement.value /= 100;
    }

    return true;
  }
}
