export default class HonorIntrigueProtectionRoll extends foundry.dice.Roll {
  /**
   * Prompt the user with a roll request dialog.
   */
  static async prompt(options = {}) {
    options.actor ??= ChatMessage.getSpeakerActor(ChatMessage.getSpeaker());
    options.protectionItems = options.actor.itemTypes['armor'].filter(item => item.system.protection.value).map(item => ({
      ...item,
      id: item.id,
      toggled: (item.system.carriedPosition === hi.CONFIG.CARRY_CHOICE.Held),
    }));

    if (options.protectionItems.length === 0) {
      ui.notifications.warn(game.i18n.format('HONOR_INTRIGUE.Dialog.Result.NoProtection', { name: options.actor.name }));
      return false;
    }

    const result = await hi.applications.apps.ProtectionRollDialog.create({ context: options });
    if (!result) return false;

    const { protectionItems, rollMode } = result;

    const items = protectionItems.filter(item => item.toggled);
    if (items.length === 0) return false;

    const roll = await this.roll(items, options);

    return {
      protectionItems: items.reduce((acc, curr) => ({ ...acc, [curr.id]: { formula: curr.protection, name: curr.name } }), {}),
      rollMode,
      rolls: [roll],
    };
  }

  /**
   * Roll Protection for items without a prompt.
   * @param {Array<ArmorModel>} items
   * @param {Object} [options] Roll options.
   */
  static async roll(items, options = {}) {
    const formula = [];

    for (const item of items) {
      formula.push(item.system.protection.value);
    }

    if (formula.length === 0) return false;

    const roll = new this(formula.join('+'), options.data);
    await roll.evaluate();

    return roll;
  }
}
