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
      options.realMightValue = options.actor.system.qualities.might.value;
    }

    // TODO apply penalties from active actor effects, such as Blade Throw
  }

  /**
   * Button callback to apply damage to selected actors.
   * @param {PointerEvent} event
   */
  static async applyDamageCallback(event) {
    if (!canvas.tokens.controlled.length) {
      return ui.notifications.error('HONOR_INTRIGUE.Chat.Result.NoTokenSelected', { localize: true });
    }

    const li = event.currentTarget.closest('[data-message-id]');
    const message = game.messages.get(li.dataset.messageId);
    const roll = message.rolls[event.currentTarget.dataset.index];
    const amount = roll.total;

    for (const actor of hi.utils.tokensToActors()) {
      await actor.system.applyDamage(amount);
    }
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
    const baseTerm = new Die({ number: result.numDice, faces: result.dieSize });
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

  /**
   * Produces an HTML button with relevant data to apply this damage.
   * @param {Number} index The index of this roll in the <code>rolls</code> array of the message.
   */
  toRollButton(index) {
    return hi.utils.constructButton({
      classes: ['apply-damage'],
      dataset: {
        index,
        tooltip: game.i18n.localize('HONOR_INTRIGUE.Chat.Buttons.ApplyDamage.hint'),
        tooltipDirection: 'UP',
      },
      icon: 'fa-solid fa-burst',
      label: game.i18n.format('HONOR_INTRIGUE.Chat.Buttons.ApplyDamage.label', { amount: this.total }),
    });
  }
}
