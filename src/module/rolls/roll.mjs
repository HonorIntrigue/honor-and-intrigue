import { systemID } from '../constants.mjs';

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
    if (!options.actor) return;

    options.modifiers.combatAbility ??= 'none';
    options.modifiers.combatAbilityOptions = Object.values(hi.CONFIG.combatAbilities).map(c => ({
      ...c,
      label: game.i18n.localize(c.label),
    }));

    options.modifiers.career ??= 'none';
    options.modifiers.careerOptions = options.actor.itemTypes['career'].map(career => ({
      label: `(+${career.system.rank}) ${career.name}`,
      value: career.id,
    }));

    // TODO apply penalty die when blinded, bound, etc.
  }

  /**
   * Prompt the user with a roll request dialog.
   * @param options
   * @returns {Promise<Object>}
   */
  static async prompt(options = {}) {
    options.modifiers ??= {};
    options.modifiers.bonuses ??= 0;
    options.modifiers.penalties ??= 0;
    options.modifiers.flat ??= 0;

    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    this.applyActorModifiers(options);

    const { rollMode, modifiers } = await hi.applications.apps.RollDialog.create({
      context: options,
    });

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

    if (modifiers.combatAbility && modifiers.combatAbility !== 'none') {
      const value = options.actor.system.combatAbilities[modifiers.combatAbility].value;

      roll.terms.push(
        new OperatorTerm({ operator: (value >= 0 ? '+' : '-') }),
        new NumericTerm({ number: Math.abs(value) }),
      );
    }

    if (modifiers.career && modifiers.career !== 'none') {
      const career = await options.actor.getEmbeddedDocument('Item', modifiers.career);

      if (career) {
        roll.terms.push(
          new OperatorTerm({ operator: '+' }),
          new NumericTerm({ number: Math.abs(career.system.rank) }),
        );
      }
    }

    if (modifiers.flat !== 0) {
      roll.terms.push(
        new OperatorTerm({ operator: (modifiers.flat > 0 ? '+' : '-') }),
        new NumericTerm({ number: Math.abs(modifiers.flat) }),
      );
    }

    if (options.bonus) {
      roll.terms.push(
        new OperatorTerm({ operator: (options.bonus > 0 ? '+' : '-') }),
        new NumericTerm({ number: Math.abs(options.bonus) }),
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

  constructor(formula = '2d6', data = {}, options = {}) {
    super(formula, data, options);
  }
}
