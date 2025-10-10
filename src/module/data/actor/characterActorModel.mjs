import BaseActorModel from './base.mjs';

const fields = foundry.data.fields;

export default class CharacterActorModel extends BaseActorModel {
  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.advantage = new fields.NumberField({ min: 0, max: 10, initial: 3, integer: true, nullable: false });
    schema.composure = new fields.NumberField({ min: 0, max: 3, initial: 3, integer: true, nullable: false });
    schema.fortune = new fields.NumberField({ min: 0, initial: 0, integer: true, nullable: false });
    schema.motivation = new fields.StringField({ trim: true });

    return schema;
  }

  /**
   * Apply modifiers to a set of roll options.
   */
  applyRollModifiers(options) {
    const composureLoss = Math.abs(this.schema.fields.composure.max - this.composure);

    if (composureLoss !== 0) {
      options.system.statusModifiers['composure'] = { label: 'HONOR_INTRIGUE.Chat.Roll.Modifier.ComposureLoss', value: -composureLoss };
    }
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (foundry.utils.hasProperty(changes, 'system.fortune')) {
      let messageKey;

      if (changes.system.fortune > this.fortune) messageKey = 'HONOR_INTRIGUE.Chat.Result.FortuneGain';
      else if (changes.system.fortune < this.fortune) messageKey = 'HONOR_INTRIGUE.Chat.Result.FortuneLoss';

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.parent }),
        content: game.i18n.format(messageKey, {
          amount: Math.abs(this.fortune - changes.system.fortune),
          name: this.parent.name,
        }),
      });
    }

    return true;
  }

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (foundry.utils.hasProperty(changed, 'system.advantage')) {
      this.parent.toggleStatusEffect('defeated', { active: changed.system.advantage === 0 });
    }
  }
}
