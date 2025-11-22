import { HonorIntrigueDamageRoll } from '../../rolls/_module.mjs';
import EquipmentModel from './equipment.mjs';

export default class WeaponModel extends EquipmentModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/sword.svg';

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'weapon' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.damageFormula = new fields.SchemaField({
      dieSize: new fields.NumberField({ choices: hi.CONFIG.damageDiceValues, initial: 6, integer: true, nullable: true }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      numDice: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
    });
    schema.handsHeld = new fields.NumberField({ initial: 0, integer: true, min: 0, max: 3, nullable: false });
    schema.loadActions = new fields.NumberField({ initial: 0, integer: true, min: 0 });
    schema.isLoaded = new fields.BooleanField({ initial: true });
    schema.maneuvers = new fields.SetField(new fields.DocumentUUIDField({ type: 'Item' }));
    schema.rangeIncrement = new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: false });
    schema.throwable = new fields.BooleanField({ initial: false });

    return schema;
  }

  /**
   * Roll the damage for a weapon activated from the chat log.
   * @param {ManeuverMessageModel} maneuver
   */
  static async rollDamageFromMessage(maneuver) {
    const item = await fromUuid(maneuver.relatedItemUuid);

    if (item?.type === 'weapon') {
      return item.system.rollDamage({ maneuver });
    }
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.damageFormula.value = hi.utils.valueFromFormulaField(this.damageFormula);
  }

  /**
   * Prompt the user to roll damage using this weapon's formula.
   */
  async rollDamage(options = {}) {
    const data = this.parent.getRollData();
    const result = await HonorIntrigueDamageRoll.prompt({
      ...options,
      actor: this.parent.actor,
      data,
      formula: this.damageFormula,
      title: options.title ?? this.parent.name,
    });
    if (!result) return;

    const { modifiers, rollMode, rolls } = result;

    return ChatMessage.create({
      flags: { core: { canPopout: true } },
      flavor: `<strong>${game.i18n.format('HONOR_INTRIGUE.Chat.Roll.Flavor.Damage', { weapon: this.parent.name })}</strong>`,
      rolls,
      rollMode,
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      system: { uuid: this.parent.uuid },
      title: options.title,
      type: 'damage',
    }, { rollMode });
  }
}
