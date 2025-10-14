const {
  Dice,
  NumericTerm,
  OperatorTerm,
} = foundry.dice.terms;

export default class HonorIntrigueProtectionRoll extends foundry.dice.Roll {
  /**
   * Prompt the user with a roll request dialog.
   */
  static async prompt(options = {}) {
    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    options.protectionItems = options.actor.itemTypes['armor'].filter(item => item.system.protection.value).map(item => ({
      id: item.id,
      name: item.name,
      protection: item.system.protection.value,
      toggled: false,
    }));

    if (options.protectionItems.length === 0) {
      ui.notifications.warn(game.i18n.format('HONOR_INTRIGUE.Dialog.Result.NoProtection', { name: options.actor.name }));
      return false;
    }

    const result = await hi.applications.apps.ProtectionRollDialog.create({ context: options });
    if (!result) return false;

    const { protectionItems, rollMode } = result;
    const formula = [];

    for (const item of protectionItems) {
      if (item.toggled) {
        formula.push(item.protection);
      }
    }

    if (formula.length === 0) return false;

    const roll = new this(formula.join('+'), options.data);
    await roll.evaluate();

    return {
      protectionItems,
      rollMode,
      rolls: [roll],
    };
  }
}
