import BaseActorModel from './base.mjs';

const { hasProperty } = foundry.utils;

export default class CharacterActorModel extends BaseActorModel {
  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.advantage = new fields.NumberField({ min: 0, max: 10, initial: 3, integer: true, nullable: false });
    schema.composure = new fields.NumberField({ min: 0, max: 3, initial: 3, integer: true, nullable: false });
    schema.fortune = new fields.SchemaField({
      base: new fields.NumberField({ min: 0, initial: 3, integer: true, nullable: false }),
      value: new fields.NumberField({ min: 0, initial: 0, integer: true, nullable: false }),
    });
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
  async startCombat(combatant) {
    await this.parent.update({ system: { advantage: 3 } });

    return super.startCombat(combatant);
  }

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (userId === game.user.id) {
      if (hasProperty(changed, 'system.advantage')) {
        this.parent.toggleStatusEffect('defeated', { active: changed.system.advantage === 0 });
      }

      if (hasProperty(changed, 'system.fortune.value')) {
        game.messages.filter(m => m.system.target === this.parent.uuid).forEach(async m => game.system.socketHandler.doIfOrEmit(
          async () => m.update({ '_stats.modifiedTime': Date.now() }),
          m.canUserModify(game.user, 'update'),
          { type: 'MESSAGE_REFRESH', gmOnly: true, message: { id: m.id } },
        ));
      }
    }
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (this.parent.inCombat && hasProperty(changes, 'system.advantage')) {
      changes.system.advantage = Math.max(0, changes.system.advantage);

      const diff = Math.abs(this.advantage - changes.system.advantage);
      if (diff === 0) return true;

      let messageKey;

      if (changes.system.advantage > this.advantage) messageKey = 'HONOR_INTRIGUE.Chat.Result.AdvantageGain';
      else if (changes.system.advantage < this.advantage) messageKey = 'HONOR_INTRIGUE.Chat.Result.AdvantageLoss';

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.parent }),
        content: game.i18n.format(messageKey, {
          position: game.i18n.localize(hi.CONFIG.advantageLabel(changes.system.advantage)),
          name: this.parent.name,
        }),
      });
    }

    if (hasProperty(changes, 'system.fortune.value')) {
      const diff = Math.abs(this.fortune.value - changes.system.fortune.value);
      if (diff === 0) return true;

      let messageKey;

      if (changes.system.fortune.value > this.fortune.value) messageKey = 'HONOR_INTRIGUE.Chat.Result.FortuneGain';
      else if (changes.system.fortune.value < this.fortune.value) messageKey = 'HONOR_INTRIGUE.Chat.Result.FortuneLoss';

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.parent }),
        content: game.i18n.format(messageKey, {
          amount: diff,
          name: this.parent.name,
        }),
      });
    }

    return true;
  }
}
