const {
  Die,
  NumericTerm,
  OperatorTerm,
} = foundry.dice.terms;

export default class HonorIntrigueDamageRoll extends foundry.dice.Roll {
  /**
   * Modify the roll options based on actor conditions.
   */
  static applyActorModifiers(options) {
    if (!options.actor) return;

    if (options.data.rangeIncrement === 0) {
      options.modifiers.includeMightSelector = true;
      options.realMightValue = options.actor.system.qualities.might;
    }

    // TODO apply penalties from active actor effects, such as Blade Throw
  }

  /**
   * Button callback to apply damage from a message model.
   * @param {Object} options
   * @param {Actor} options.actor
   * @param {Roll} options.roll
   * @param {Boolean} [options.withProtection=false]
   * @returns {Promise<void>}
   */
  static async applyDamageCallback(options) {
    const { actor, roll, withProtection } = options;
    await actor.system.applyDamage({ amount: roll.total, withProtection });
  }

  /**
   * Prompt the user with a roll request dialog.
   */
  static async prompt(options = {}) {
    options.modifiers ??= {};

    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    this.applyActorModifiers(options);

    const result = await hi.applications.apps.DamageRollDialog.create({ context: options });
    if (!result) return false;

    const { rollMode, modifiers } = result;
    const baseTerm = new Die({ number: result.numDice ?? 0, faces: result.dieSize ?? 0 });
    const roll = new this(baseTerm.formula, options.data, {});

    if (result.flatModifier !== 0) {
      roll.terms.push(
        new OperatorTerm({ operator: (result.flatModifier > 0 ? '+' : '-') }),
        new NumericTerm({ number: Math.abs(result.flatModifier) }),
      );
    }

    if (result.modifiers.includeMightSelector) {
      roll.terms.push(
        new OperatorTerm({ operator: (result.mightValue >= 0 ? '+' : '-') }),
        new NumericTerm({ number: Math.abs(result.mightValue) }),
      );
    }

    roll.resetFormula();
    await roll.evaluate();

    return {
      modifiers,
      rollMode,
      rolls: [roll],
    };
  }
}
