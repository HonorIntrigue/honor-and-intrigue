import CharacterActorModel from './characterActorModel.mjs';

const fields = foundry.data.fields;

export default class HeroModel extends CharacterActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'hero',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.advancementPoints = new fields.SchemaField({
      accrued: new fields.NumberField({ min: 0, initial: 0, integer: true }),
      spent: new fields.NumberField({ min: 0, initial: 0, integer: true }),
    });

    // background
    schema.description = new fields.HTMLField({ trim: true });
    schema.origin = new fields.StringField({ trim: true });

    // backstory
    schema.friendsAndContacts = new fields.HTMLField({ trim: true });
    schema.rivalsAndEnemies = new fields.HTMLField({ trim: true });

    return schema;
  }

  /** @inheritDoc */
  get messageOnLifebloodChange() {
    return true;
  }

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.advancementPoints.value = this.advancementPoints.accrued - this.advancementPoints.spent;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      },
    });
    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (foundry.utils.hasProperty(changes, 'system.advancementPoints.value')) {
      const diff = Math.abs(this.advancementPoints.value - changes.system.advancementPoints.value);
      if (diff === 0) return true;

      let messageKey;

      if (changes.system.advancementPoints.value > this.advancementPoints.value) {
        messageKey = 'HONOR_INTRIGUE.Chat.Result.AdvancementGain';
        changes.system.advancementPoints.accrued = this.advancementPoints.accrued + diff;
      } else if (changes.system.advancementPoints.value < this.advancementPoints.value) {
        messageKey = 'HONOR_INTRIGUE.Chat.Result.AdvancementLoss';
        changes.system.advancementPoints.spent = this.advancementPoints.spent + diff;
      }

      if (diff === 1) messageKey += 'Singular';

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
