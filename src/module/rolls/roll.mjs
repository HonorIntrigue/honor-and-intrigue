import { systemID } from '../constants.mjs';

export default class HonorIntrigueRoll extends foundry.dice.Roll {
  static ROLL_FORMULA = {
    d10: '2d10',
    d6: '2d6',
  };

  /**
   * Determine the appropriate dice formula for rolling based on the Alternate d10 setting.
   * @returns {string}
   */
  static get rollFormula() {
    if (game.settings.get(systemID, 'd10') === true)
      return HonorIntrigueRoll.ROLL_FORMULA.d10;

    return HonorIntrigueRoll.ROLL_FORMULA.d6;
  }

  /**
   * Modify the roll options based on actor conditions.
   * @param options
   */
  static applyActorModifiers(options) {
    if (!options.actor) return;

    // TODO apply penalty die when blinded, bound, etc.
  }

  /**
   * Prompt the user with a roll request dialog.
   * @param options
   * @returns {Promise<Object>}
   */
  static async prompt(options = {}) {
    options.formula = this.rollFormula;

    options.modifiers ??= {};
    options.modifiers.bonuses ??= 0;
    options.modifiers.penalties ??= 0;

    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    this.applyActorModifiers(options);

    const promptResult = await hi.applications.apps.RollDialog.create({
      context: options,
    });

    const roll = new this(options.formula, options.data, {});
    await roll.evaluate();

    return {
      rollMode: promptResult.rollMode,
      rolls: [roll],
    };
  }

  constructor(formula = '2d6', data = {}, options = {}) {
    super(formula, data, options);
  }
}
