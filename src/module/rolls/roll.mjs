import { systemID } from '../constants.mjs';
import { HonorIntrigueActiveEffect } from '../documents/_module.mjs';

const {
  Die,
  NumericTerm,
  OperatorTerm,
} = foundry.dice.terms;

export default class HonorIntrigueRoll extends foundry.dice.Roll {
  static DICE_FACES = {
    d10: 10,
    d6: 6,
  };

  /**
   * Determine the appropriate die size for rolling based on the Alternate d10 setting.
   * @returns {Number}
   */
  static get dieSize() {
    if (game.settings.get(systemID, 'd10') === true)
      return HonorIntrigueRoll.DICE_FACES.d10;

    return HonorIntrigueRoll.DICE_FACES.d6;
  }

  /**
   * Modify the roll options based on actor conditions.
   * @param options
   */
  static applyActorModifiers(options) {
    const { actor } = options;
    if (!actor) return;

    options.system.statusModifiers ??= {};

    for (const effect of actor.effects) {
      if (effect instanceof HonorIntrigueActiveEffect) effect.applyRollModifiers(options.system.statusModifiers);
    }

    if (actor.system.applyRollModifiers instanceof Function) actor.system.applyRollModifiers(options);
  }

  /**
   * Modify the roll options based on the targeted actor.
   */
  static async applyTargetActorModifiers(options) {
    if (options.type !== 'maneuver') return;

    const target = game.user.targets.first();
    if (!target || !target.actor) return;

    const maneuver = await fromUuid(options.system.maneuver);
    if (!maneuver || !maneuver.system.requiresOpposedCheck) return;

    const { abilityCheck: { opposedBy } } = maneuver.system;
    options.system.targetModifiers ??= {};

    if (opposedBy.quality) options.system.targetModifiers.quality = {
      key: opposedBy.quality,
      value: target.actor.system.qualities[opposedBy.quality],
    };
    if (opposedBy.combatAbility) options.system.targetModifiers.combatAbility = {
      key: opposedBy.combatAbility,
      value: target.actor.system.combatAbilities[opposedBy.combatAbility],
    };
    if (opposedBy.flatModifier) options.system.targetModifiers.flatModifier = opposedBy.flatModifier;
  }

  /**
   * Constructs an appropriate OperatorTerm and NumericTerm for the given value.
   * @param {Number} value
   * @param {Object} options
   * @param {Boolean} [options.negative] Use the negative of the number before considering its value, for applying subtraction.
   * @returns {[OperatorTerm, NumericTerm]}
   */
  static constructNumericTerm(value, { negative = false } = {}) {
    if (isNaN(value) || value === 0) return [];

    if (negative && value > 0) value *= -1;

    return [
      new OperatorTerm({ operator: value > 0 ? '+' : '-' }),
      new NumericTerm({ number: Math.abs(value) }),
    ];
  }

  /**
   * Prompt the user with a roll request dialog.
   * @param options
   * @returns {Promise<Object|false>}
   */
  static async prompt(options = {}) {
    options.modifiers ??= {};
    options.modifiers.bonuses ??= 0;
    options.modifiers.difficulty ??= 'moderate';
    options.modifiers.penalties ??= 0;
    options.modifiers.flat ??= 0;

    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    this.applyActorModifiers(options);
    await this.applyTargetActorModifiers(options);

    const result = await hi.applications.apps.RollDialog.create({ context: options });
    if (!result) return false;

    const { rollMode, modifiers } = result;
    const baseTerm = new Die({ number: 2, faces: this.dieSize });

    if (modifiers.bonuses > 0) {
      baseTerm.alter(-1, modifiers.bonuses);
      baseTerm.modifiers.push(`dl${modifiers.bonuses}`);
    }

    if (modifiers.penalties > 0) {
      baseTerm.alter(-1, modifiers.penalties);
      baseTerm.modifiers.push(`dh${modifiers.penalties}`);
    }

    const roll = new this(baseTerm.formula, options.data, {});

    if (options.quality) {
      roll.terms.push(...this.constructNumericTerm(options.quality));
    }

    if (modifiers.combatAbility && modifiers.combatAbility !== 'none') {
      const value = options.actor.system.combatAbilities[modifiers.combatAbility];
      roll.terms.push(...this.constructNumericTerm(value));
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await options.actor.getEmbeddedDocument('Item', modifiers.career);
      if (career) roll.terms.push(...this.constructNumericTerm(career.system.rank));
    }

    if (modifiers.flat !== 0) {
      roll.terms.push(...this.constructNumericTerm(modifiers.flat));
    }

    if (modifiers.difficulty) {
      roll.terms.push(...this.constructNumericTerm(hi.CONFIG.difficulties[modifiers.difficulty].modifier));
    }

    if (options.system.targetModifiers) {
      roll.terms.push(
        ...this.constructNumericTerm(options.system.targetModifiers.quality?.value, { negative: true }),
        ...this.constructNumericTerm(options.system.targetModifiers.combatAbility?.value, { negative: true }),
        ...this.constructNumericTerm(options.system.targetModifiers.flatModifier, { negative: true }),
      );
    }

    if (options.system.statusModifiers) {
      Object.values(options.system.statusModifiers).forEach(({ value }) => roll.terms.push(...this.constructNumericTerm(value)));
    }

    roll.resetFormula();
    await roll.evaluate();

    return {
      modifiers,
      rollMode,
      rolls: [roll],
    };
  }

  constructor(formula = '2d6', data = {}, options = {}) {
    super(formula, data, options);
  }
}
