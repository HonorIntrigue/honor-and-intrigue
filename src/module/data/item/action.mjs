import { HonorIntrigueDamageRoll } from '../../rolls/_module.mjs';
import BaseItemModel from './base.mjs';

export default class ActionModel extends BaseItemModel {
  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'action' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.actionType = new fields.NumberField({
      choices: hi.CONFIG.actionTypes,
      initial: 0,
      integer: true,
    });
    schema.abilityCheck = new fields.SchemaField({
      quality: new fields.StringField({ blank: true, choices: hi.CONFIG.qualities }),
      combatAbility: new fields.StringField({ blank: true, choices: hi.CONFIG.combatAbilities }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      opposedBy: new fields.SchemaField({
        quality: new fields.StringField({ blank: true, choices: hi.CONFIG.qualities }),
        combatAbility: new fields.StringField({ blank: true, choices: hi.CONFIG.combatAbilities }),
        flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
    });
    schema.damageFormula = new fields.SchemaField({
      dieSize: new fields.NumberField({ choices: hi.CONFIG.damageDiceValues, initial: null, integer: true, nullable: true }),
      flatModifier: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      numDice: new fields.NumberField({ initial: null, integer: true, min: 1 }),
    });

    return schema;
  }

  /**
   * Resolves a localized tooltip for this action's ability check.
   */
  get abilityTooltip() {
    const parts = [];
    let subparts = [];

    if (this.requiresCheck) {
      if (this.abilityCheck.quality) subparts.push(hi.CONFIG.qualities[this.abilityCheck.quality].label);
      if (this.abilityCheck.combatAbility) subparts.push(hi.CONFIG.combatAbilities[this.abilityCheck.combatAbility].label);
      if (this.abilityCheck.flatModifier !== 0) subparts.push(`${this.abilityCheck.flatModifier}`);

      parts.push(subparts.map(v => game.i18n.localize(v)).join(' + '));
    }

    if (this.requiresOpposedCheck) {
      parts.push('vs');
      subparts = [];

      if (this.abilityCheck.opposedBy.quality) subparts.push(hi.CONFIG.qualities[this.abilityCheck.opposedBy.quality].label);
      if (this.abilityCheck.opposedBy.combatAbility) subparts.push(hi.CONFIG.combatAbilities[this.abilityCheck.opposedBy.combatAbility].label);
      if (this.abilityCheck.opposedBy.flatModifier !== 0) subparts.push(`${this.abilityCheck.opposedBy.flatModifier}`);

      parts.push(subparts.map(v => game.i18n.localize(v)).join(' + '));
    }

    return parts.join(' ');
  }

  /**
   * Flag that indicates if this action item can deal damage.
   */
  get dealsDamage() {
    return this.damageFormula.dieSize || this.damageFormula.flatModifier !== 0;
  }

  /**
   * Resolve the tooltip for this action's damage formula.
   */
  get damageTooltip() {
    return this.damageFormula.value;
  }

  /**
   * Flag that indicates if this maneuver requires an ability check to succeed.
   */
  get requiresCheck() {
    return !!this.abilityCheck.quality || !!this.abilityCheck.combatAbility || (this.abilityCheck.flatModifier ?? 0) !== 0;
  }

  /**
   * Flag that indicates if this maneuver is opposed by the target.
   */
  get requiresOpposedCheck() {
    return !!this.abilityCheck.opposedBy?.quality || !!this.abilityCheck.opposedBy?.combatAbility || (this.abilityCheck.opposedBy?.flatModifier ?? 0) !== 0;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.damageFormula.value = hi.utils.valueFromFormulaField(this.damageFormula);
  }

  /**
   * Prompt the user to roll damage using this action's damage formula.
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
      sound: CONFIG.sounds.dice,
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      system: { uuid: this.parent.uuid },
      title: options.title,
      type: 'damage',
    }, { rollMode });
  }
}
